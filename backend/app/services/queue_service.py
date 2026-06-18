"""Queue service protocol boundary for background job orchestration."""

from __future__ import annotations

import logging
from typing import Any, Protocol

from app.domain.value_objects.job_specification import JobSpecification
from app.domain.value_objects.queue_position import QueuePosition


class QueueError(RuntimeError):
    """Base queue infrastructure error."""


class QueueUnavailableError(QueueError):
    """Raised when queue infrastructure cannot be reached."""


class QueueJobNotFoundError(QueueError):
    """Raised when a queue job cannot be found."""


class UnsupportedJobTypeError(QueueError, ValueError):
    """Raised when a job specification uses an unsupported job type."""


class JobQueue(Protocol):
    """Protocol for queue backend adapters."""

    def enqueue(self, spec: JobSpecification) -> QueuePosition:
        """Enqueue a new job and return queue position snapshot."""

    def get_queue_position(self, job_id: str) -> QueuePosition | None:
        """Return latest queue position for a job if queued."""

    def remove_job_from_queue(self, job_id: str) -> bool:
        """Remove a queued job from the queue backend."""

    def get_active_jobs(self) -> list[dict[str, Any]]:
        """Return currently active jobs with normalized state metadata."""

    def cancel_running_job(self, job_id: str) -> bool:
        """Best-effort cancel/stop for a running job."""

    def get_job_id_for_experiment(self, experiment_id: int) -> str | None:
        """Return queue job id mapped for experiment if known."""


class QueueService:
    """Centralizes queue orchestration behind a backend-agnostic protocol."""

    SUPPORTED_JOB_TYPES = {"EXPERIMENT_EXECUTION", "DATA_INGESTION", "LOG_EXPORT"}

    def __init__(self, job_queue: JobQueue) -> None:
        self._job_queue = job_queue
        self._logger = logging.getLogger(__name__)

    def enqueue_job(self, spec: JobSpecification) -> QueuePosition:
        if spec.job_type not in self.SUPPORTED_JOB_TYPES:
            raise UnsupportedJobTypeError(
                f"Unsupported job type: {spec.job_type}")

        self._logger.info(
            "QueueService enqueue requested",
            extra={
                "job_type": spec.job_type,
                "experiment_id": spec.payload.get("experiment_id"),
            },
        )
        queue_position = self._job_queue.enqueue(spec)
        self._logger.info(
            "QueueService enqueue succeeded",
            extra={
                "job_id": queue_position.job_id,
                "queue_name": queue_position.queue_name,
                "position": queue_position.position,
            },
        )
        return queue_position

    def get_queue_position(self, job_id: str) -> QueuePosition | None:
        queue_position = self._job_queue.get_queue_position(job_id)
        self._logger.info(
            "QueueService get_queue_position",
            extra={
                "job_id": job_id,
                "found": queue_position is not None,
            },
        )
        return queue_position

    def remove_job_from_queue(self, job_id: str) -> bool:
        removed = self._job_queue.remove_job_from_queue(job_id)
        self._logger.info(
            "QueueService remove_job_from_queue",
            extra={"job_id": job_id, "removed": removed},
        )
        return removed

    def get_active_jobs(self) -> list[dict[str, Any]]:
        active_jobs = self._job_queue.get_active_jobs()
        self._logger.info(
            "QueueService get_active_jobs",
            extra={"count": len(active_jobs)},
        )
        return active_jobs

    def get_active_queue_snapshot(self) -> dict[str, Any]:
        active_jobs = self.get_active_jobs()
        queued_jobs = [
            job for job in active_jobs if job.get("state") == "queued"]
        running_jobs = [
            job for job in active_jobs if job.get("state") == "running"]
        snapshot = {
            "queue_depth": len(queued_jobs),
            "running_jobs": len(running_jobs),
            "active_jobs_total": len(active_jobs),
            "active_jobs": active_jobs,
        }
        self._logger.info(
            "QueueService get_active_queue_snapshot", extra=snapshot)
        return snapshot

    def cancel_running_job(self, job_id: str) -> bool:
        cancelled = self._job_queue.cancel_running_job(job_id)
        self._logger.info(
            "QueueService cancel_running_job",
            extra={"job_id": job_id, "cancelled": cancelled},
        )
        return cancelled

    def get_job_id_for_experiment(self, experiment_id: int) -> str | None:
        job_id = self._job_queue.get_job_id_for_experiment(experiment_id)
        self._logger.info(
            "QueueService get_job_id_for_experiment",
            extra={"experiment_id": experiment_id,
                   "found": job_id is not None},
        )
        return job_id
