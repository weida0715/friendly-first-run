"""Redis/RQ-backed queue adapter."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from redis import Redis
from redis.exceptions import RedisError
from rq import Queue
from rq.command import send_stop_job_command
from rq.exceptions import NoSuchJobError
from rq.registry import FinishedJobRegistry, StartedJobRegistry

from app.domain.value_objects.job_specification import JobSpecification
from app.domain.value_objects.queue_position import QueuePosition
from app.services.queue_service import (
    JobQueue,
    QueueJobNotFoundError,
    QueueUnavailableError,
)

ERROR_SNIPPET_MAX_LENGTH = 500
EXPERIMENT_JOB_KEY_PREFIX = "experiment_job"


class RedisJobQueue(JobQueue):
    """RQ adapter that keeps queue mechanics inside infrastructure layer."""

    def __init__(
        self,
        *,
        redis_url: str,
        queue_name: str = "experiments",
        job_function_path: str = "app.workers.experiment_worker.handle_experiment_job",
        job_timeout_seconds: int = 60 * 60,
        result_ttl_seconds: int = 24 * 60 * 60,
    ) -> None:
        self._queue_name = queue_name
        self._job_function_path = job_function_path
        self._job_timeout_seconds = job_timeout_seconds
        self._result_ttl_seconds = result_ttl_seconds
        try:
            self._redis = Redis.from_url(redis_url)
            self._queue = Queue(name=queue_name, connection=self._redis)
        except RedisError as exc:
            raise QueueUnavailableError(
                "Unable to initialize Redis queue backend") from exc

    def enqueue(self, spec: JobSpecification) -> QueuePosition:
        try:
            rq_job = self._queue.enqueue(
                self._job_function_path,
                spec.payload,
                job_timeout=self._job_timeout_seconds,
                result_ttl=self._result_ttl_seconds,
                meta={
                    "job_type": spec.job_type,
                    "priority": spec.priority,
                    "requested_by_user_id": spec.requested_by_user_id,
                },
            )
            position = self._resolve_queue_position(rq_job.id)
            experiment_id = spec.payload.get("experiment_id")
            if experiment_id not in (None, ""):
                self._redis.set(
                    f"{EXPERIMENT_JOB_KEY_PREFIX}:{int(experiment_id)}",
                    rq_job.id,
                    ex=self._result_ttl_seconds,
                )
            return QueuePosition(
                job_id=rq_job.id,
                position=position,
                queue_name=self._queue_name,
                eta_seconds=None,
            )
        except RedisError as exc:
            raise QueueUnavailableError("Failed to enqueue job") from exc

    def get_queue_position(self, job_id: str) -> QueuePosition | None:
        try:
            position = self._resolve_queue_position(job_id)
            if position is None:
                return None
            return QueuePosition(
                job_id=job_id,
                position=position,
                queue_name=self._queue_name,
                eta_seconds=None,
            )
        except RedisError as exc:
            raise QueueUnavailableError(
                "Failed to fetch queue position") from exc

    def remove_job_from_queue(self, job_id: str) -> bool:
        try:
            removed = self._queue.remove(job_id, delete_job=True)
            if removed:
                self._delete_experiment_mapping_for_job(job_id)
            return removed
        except NoSuchJobError:
            return False
        except RedisError as exc:
            raise QueueUnavailableError(
                "Failed to remove job from queue") from exc

    def get_active_jobs(self) -> list[dict[str, Any]]:
        try:
            jobs: list[dict[str, Any]] = []
            for position, queued_job_id in enumerate(self._queue.job_ids):
                jobs.append(
                    {
                        "job_id": queued_job_id,
                        "state": "queued",
                        "queue_name": self._queue_name,
                        "position": position,
                    }
                )

            started_registry = StartedJobRegistry(
                name=self._queue_name, connection=self._redis)
            for running_job_id in started_registry.get_job_ids():
                jobs.append(
                    {
                        "job_id": running_job_id,
                        "state": "running",
                        "queue_name": self._queue_name,
                        "position": None,
                    }
                )

            return jobs
        except RedisError as exc:
            raise QueueUnavailableError("Failed to list active jobs") from exc

    def cancel_running_job(self, job_id: str) -> bool:
        try:
            send_stop_job_command(self._redis, job_id)
            self._delete_experiment_mapping_for_job(job_id)
            return True
        except NoSuchJobError:
            return False
        except RedisError as exc:
            raise QueueUnavailableError(
                "Failed to cancel running job") from exc

    def get_job_state(self, job_id: str) -> str:
        """Return normalized job state for UI/API consumers."""
        try:
            queued_position = self._resolve_queue_position(job_id)
            if queued_position is not None:
                return "queued"

            started_registry = StartedJobRegistry(
                name=self._queue_name, connection=self._redis)
            if job_id in set(started_registry.get_job_ids()):
                return "running"

            finished_registry = FinishedJobRegistry(
                name=self._queue_name, connection=self._redis)
            if job_id in set(finished_registry.get_job_ids()):
                return "finished"

            rq_job = self._queue.fetch_job(job_id)
            if rq_job is None:
                raise QueueJobNotFoundError(f"Queue job not found: {job_id}")
            return self._normalize_job_state(str(rq_job.get_status(refresh=True)))
        except RedisError as exc:
            raise QueueUnavailableError("Failed to fetch job state") from exc

    def get_job_metadata(self, job_id: str) -> dict[str, Any]:
        """Return normalized queue job metadata for detail views."""
        try:
            rq_job = self._queue.fetch_job(job_id)
            if rq_job is None:
                raise QueueJobNotFoundError(f"Queue job not found: {job_id}")

            state = self._normalize_job_state(
                str(rq_job.get_status(refresh=True)))
            queue_position = self._resolve_queue_position(job_id)
            worker_name = getattr(rq_job, "worker_name", None)
            error_text = None
            latest_result_attr = getattr(rq_job, "latest_result", None)
            if callable(latest_result_attr):
                result_obj = latest_result_attr()
            else:
                result_obj = latest_result_attr
            if result_obj is not None:
                error_text = getattr(result_obj, "exc_string", None)
            if error_text is None:
                error_text = getattr(rq_job, "exc_info", None)
            error_snippet = None
            if isinstance(error_text, str) and error_text.strip():
                error_snippet = error_text.strip()[:ERROR_SNIPPET_MAX_LENGTH]

            return {
                "job_id": job_id,
                "state": state,
                "queue_position": queue_position,
                "worker_name": worker_name,
                "requested_by_user_id": rq_job.meta.get("requested_by_user_id"),
                "job_type": rq_job.meta.get("job_type"),
                "payload_experiment_id": (
                    rq_job.args[0].get("experiment_id")
                    if isinstance(getattr(rq_job, "args", None), (list, tuple))
                    and len(rq_job.args) > 0
                    and isinstance(rq_job.args[0], dict)
                    else None
                ),
                "enqueued_at": self._to_iso(getattr(rq_job, "created_at", None)),
                "started_at": self._to_iso(getattr(rq_job, "started_at", None)),
                "ended_at": self._to_iso(getattr(rq_job, "ended_at", None)),
                "error_snippet": error_snippet,
                "queue_name": self._queue_name,
                "source": "queue",
            }
        except RedisError as exc:
            raise QueueUnavailableError(
                "Failed to fetch job metadata") from exc

    @staticmethod
    def _normalize_job_state(status: str) -> str:
        normalized = (status or "").strip().lower()
        if normalized in {"queued", "deferred", "scheduled"}:
            return "queued"
        if normalized in {"started", "running", "busy"}:
            return "running"
        if normalized in {"finished", "complete", "completed"}:
            return "finished"
        if normalized in {"failed"}:
            return "failed"
        if normalized in {"stopped", "canceled", "cancelled"}:
            return "canceled"
        return "unknown"

    def _resolve_queue_position(self, job_id: str) -> int | None:
        job_ids = self._queue.job_ids
        try:
            return job_ids.index(job_id)
        except ValueError:
            return None

    def get_job_id_for_experiment(self, experiment_id: int) -> str | None:
        raw = self._redis.get(f"{EXPERIMENT_JOB_KEY_PREFIX}:{experiment_id}")
        if raw is None:
            return None
        return raw.decode("utf-8") if isinstance(raw, bytes) else str(raw)

    def _delete_experiment_mapping_for_job(self, job_id: str) -> None:
        rq_job = self._queue.fetch_job(job_id)
        if rq_job is None:
            return
        payload_experiment_id = (
            rq_job.args[0].get("experiment_id")
            if isinstance(getattr(rq_job, "args", None), (list, tuple))
            and len(rq_job.args) > 0
            and isinstance(rq_job.args[0], dict)
            else None
        )
        if payload_experiment_id in (None, ""):
            return
        self._redis.delete(
            f"{EXPERIMENT_JOB_KEY_PREFIX}:{int(payload_experiment_id)}")

    @staticmethod
    def _to_iso(value: datetime | None) -> str | None:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        return value.astimezone(UTC).isoformat()
