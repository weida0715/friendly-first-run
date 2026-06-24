"""Experiment cancellation strategy."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from app.domain.models.experiment_log import ExperimentLog
from app.repositories.unit_of_work import UnitOfWork
from app.strategies.cancellable_job_strategy import CancellableJobStrategy


class ExperimentCancellationHandler(CancellableJobStrategy):
    """Handles experiment-specific cancellation behavior."""

    JOB_TYPE = "EXPERIMENT_EXECUTION"

    def supports(self, job_type: str) -> bool:
        return str(job_type) == self.JOB_TYPE

    def cancel(self, job_id: str, job_metadata: dict[str, Any], queue_service: Any) -> dict[str, Any]:
        experiment_id = int(job_metadata.get("payload_experiment_id") or 0)
        state = str(job_metadata.get("state") or "").lower()

        with UnitOfWork() as uow:
            experiment = uow.experiments.get_by_id(experiment_id) if uow.experiments else None
            if experiment is not None and str(experiment.status).lower() == "cancelled":
                return {"cancelled": True, "state": "cancelled", "experiment_id": experiment_id, "idempotent": True}

        if state == "queued":
            cancelled = queue_service.remove_job_from_queue(job_id)
        elif state == "running":
            cancelled = queue_service.cancel_running_job(job_id)
        else:
            cancelled = state == "cancelled"

        if cancelled:
            self._mark_experiment_cancelled(experiment_id, job_id)

        return {"cancelled": bool(cancelled), "state": "cancelled" if cancelled else state, "experiment_id": experiment_id}

    def _mark_experiment_cancelled(self, experiment_id: int, job_id: str) -> None:
        now = datetime.now(timezone.utc)
        with UnitOfWork() as uow:
            if uow.experiments:
                uow.experiments.mark_cancelled(
                    experiment_id,
                    completed_at=now,
                    current_stage="Cancelled",
                )
            if uow.experiment_logs:
                uow.experiment_logs.add(
                    ExperimentLog(
                        None,
                        experiment_id,
                        0,
                        now,
                        0,
                        Decimal("0"),
                        {
                            "type": "timeline",
                            "event": "cancelled",
                            "stage": "cancelled",
                            "job_id": job_id,
                        },
                        now,
                    )
                )
