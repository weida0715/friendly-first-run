"""Cancellation handlers for queued and running jobs."""
from __future__ import annotations
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from app.domain.models.experiment_log import ExperimentLog
from app.repositories.unit_of_work import UnitOfWork

class JobCancellationHandler:
    def cancel(self, job_id: str, queue_job: dict[str, Any], queue_service: Any) -> dict[str, Any]:
        raise NotImplementedError

class ExperimentCancellationHandler(JobCancellationHandler):
    def cancel(self, job_id: str, queue_job: dict[str, Any], queue_service: Any) -> dict[str, Any]:
        experiment_id = int(queue_job.get("payload_experiment_id") or 0)
        state = str(queue_job.get("state") or "").lower()
        with UnitOfWork() as uow:
            exp = uow.experiments.get_by_id(experiment_id) if uow.experiments else None
            if exp is not None and str(exp.status).lower() == "cancelled":
                return {"cancelled": True, "state": "cancelled", "experiment_id": experiment_id, "idempotent": True}
        if state == "queued":
            ok = queue_service.remove_job_from_queue(job_id)
        elif state == "running":
            ok = queue_service.cancel_running_job(job_id)
        else:
            ok = state == "cancelled"
        if ok:
            with UnitOfWork() as uow:
                if uow.experiments:
                    uow.experiments.mark_cancelled(experiment_id, completed_at=datetime.now(timezone.utc), current_stage="Cancelled")
                if uow.experiment_logs:
                    now = datetime.now(timezone.utc)
                    uow.experiment_logs.add(ExperimentLog(None, experiment_id, 0, now, 0, Decimal("0"), {"type":"timeline","event":"cancelled","stage":"cancelled","job_id":job_id}, now))
        return {"cancelled": bool(ok), "state": "cancelled" if ok else state, "experiment_id": experiment_id}

class JobCancellationHandlerRegistry:
    def __init__(self) -> None:
        self._handlers = {"EXPERIMENT_EXECUTION": ExperimentCancellationHandler()}
    def get(self, job_type: str | None) -> JobCancellationHandler:
        return self._handlers.get(job_type or "EXPERIMENT_EXECUTION", self._handlers["EXPERIMENT_EXECUTION"])
