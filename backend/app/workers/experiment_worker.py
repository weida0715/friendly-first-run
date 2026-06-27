"""Background worker bootstrap and experiment job handler."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

import polars as pl
from redis import Redis
from rq import Queue, Worker, get_current_job

from app.executors.default_experiment_executor import DefaultExperimentExecutor, ExperimentCancelledError
from app.repositories.unit_of_work import UnitOfWork

LOGGER = logging.getLogger(__name__)
INITIAL_PROGRESS = Decimal("0")
STAGE_RUNNING = "Running"
STAGE_COMPLETED = "Completed"
STAGE_FAILED = "Failed"


class ExperimentJobPayloadError(ValueError):
    """Raised when queued experiment payload is invalid."""


def _validate_experiment_payload(payload: Any) -> int:
    if not isinstance(payload, dict):
        raise ExperimentJobPayloadError("Payload must be an object.")

    raw_experiment_id = payload.get("experiment_id")
    if raw_experiment_id in (None, ""):
        raise ExperimentJobPayloadError("payload.experiment_id is required.")

    try:
        experiment_id = int(raw_experiment_id)
    except (TypeError, ValueError) as exc:
        raise ExperimentJobPayloadError(
            "payload.experiment_id must be an integer.") from exc

    with UnitOfWork() as uow:
        if uow.experiments is None:
            raise ExperimentJobPayloadError(
                "Experiment repository is unavailable.")
        experiment = uow.experiments.get_by_id(experiment_id)
        if experiment is None:
            raise ExperimentJobPayloadError(
                f"Experiment does not exist: {experiment_id}")

    return experiment_id


def handle_experiment_job(payload: dict[str, Any]) -> dict[str, Any]:
    """RQ job entrypoint for experiment execution."""
    current_job = get_current_job()
    job_id = getattr(current_job, "id", None)

    experiment_id: int | None = None

    def _progress_callback(progress: float, stage: str, eta_seconds: int | None) -> None:
        if experiment_id is None:
            return
        with UnitOfWork() as uow:
            if uow.experiments is None:
                return
            uow.experiments.update_progress(
                experiment_id,
                progress=Decimal(str(progress)),
                current_stage=stage,
                eta_seconds=eta_seconds,
            )

    try:
        experiment_id = _validate_experiment_payload(payload)
        LOGGER.info(
            "experiment_job.started",
            extra={"job_id": job_id, "experiment_id": experiment_id},
        )

        with UnitOfWork() as uow:
            if uow.experiments is None:
                raise RuntimeError("Experiment repository is unavailable.")
            uow.experiments.mark_running(
                experiment_id,
                progress=INITIAL_PROGRESS,
                current_stage=STAGE_RUNNING,
            )
            experiment = uow.experiments.get_by_id(experiment_id)
            if experiment is None:
                raise RuntimeError(f"Experiment not found: {experiment_id}")

        executor = DefaultExperimentExecutor()
        execution_result = executor.run(experiment, progress_callback=_progress_callback)

        with UnitOfWork() as uow:
            if uow.experiments is None:
                raise RuntimeError("Experiment repository is unavailable.")
            uow.experiments.mark_completed(
                experiment_id,
                completed_at=datetime.now(timezone.utc),
                current_stage=STAGE_COMPLETED,
            )

        LOGGER.info(
            "experiment_job.completed",
            extra={"job_id": job_id, "experiment_id": experiment_id},
        )
        if isinstance(execution_result, pl.LazyFrame):
            row_count = int(execution_result.select(pl.len()).collect().item())
        elif isinstance(execution_result, pl.DataFrame):
            row_count = int(execution_result.height)
        elif isinstance(execution_result, dict):
            row_count = int(execution_result.get("rows") or execution_result.get("row_count") or 0)
        else:
            collect = getattr(execution_result, "collect", None)
            row_count = int(collect().height) if callable(collect) else 0
        payload = {"ok": True, "experiment_id": experiment_id, "rows": row_count}
        if isinstance(execution_result, dict):
            payload["execution_result"] = execution_result
        return payload
    except ExperimentCancelledError:
        LOGGER.info(
            "experiment_job.cancelled",
            extra={"job_id": job_id, "experiment_id": experiment_id},
        )
        return {"ok": False, "experiment_id": experiment_id, "cancelled": True}
    except ExperimentJobPayloadError:
        LOGGER.error(
            "experiment_job.validation_failed",
            extra={"job_id": job_id, "experiment_id": experiment_id},
            exc_info=True,
        )
        raise
    except Exception as exc:
        error_message = str(exc) or exc.__class__.__name__
        if experiment_id is not None:
            with UnitOfWork() as uow:
                if uow.experiments is not None:
                    uow.experiments.mark_failed(
                        experiment_id,
                        completed_at=datetime.now(timezone.utc),
                        current_stage=f"Failed: {error_message[:180]}",
                    )
        LOGGER.exception(
            "experiment_job.failed",
            extra={"job_id": job_id, "experiment_id": experiment_id},
        )
        raise


def run_worker() -> None:
    """Start an RQ worker for configured experiment queue."""
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    queue_name = os.getenv("QUEUE_NAME", "experiments")

    redis_conn = Redis.from_url(redis_url)
    queues = [
        Queue(name=f"{queue_name}_high", connection=redis_conn),
        Queue(name=queue_name, connection=redis_conn),
        Queue(name=f"{queue_name}_low", connection=redis_conn),
    ]
    LOGGER.info("experiment_worker.bootstrap",
                extra={"queue_name": queue_name})

    worker = Worker(queues, connection=redis_conn)
    worker.work()
