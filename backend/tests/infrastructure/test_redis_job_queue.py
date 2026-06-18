from __future__ import annotations

from datetime import UTC, datetime

import pytest
from redis.exceptions import RedisError

from app.domain.value_objects.job_specification import JobSpecification
from app.infrastructure.redis.job_queue import RedisJobQueue
from app.services.queue_service import QueueUnavailableError


class _FakeRQJob:
    def __init__(self, job_id: str, status: str = "queued") -> None:
        self.id = job_id
        self._status = status
        self.meta = {
            "requested_by_user_id": 9,
            "job_type": "EXPERIMENT_EXECUTION",
        }
        self.args = [{"experiment_id": 1}]
        self.worker_name = "worker-1"
        self.created_at = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
        self.started_at = datetime(2026, 1, 1, 0, 1, tzinfo=UTC)
        self.ended_at = None
        self.exc_info = None

    def get_status(self, refresh: bool = False) -> str:  # noqa: ARG002
        return self._status


class _FakeQueue:
    def __init__(self, should_fail_enqueue: bool = False) -> None:
        self.job_ids: list[str] = []
        self._jobs: dict[str, _FakeRQJob] = {}
        self._should_fail_enqueue = should_fail_enqueue

    def enqueue(self, func_path: str, payload: dict, **kwargs):  # noqa: ANN001
        if self._should_fail_enqueue:
            raise RedisError("boom")
        job = _FakeRQJob(f"job-{len(self.job_ids)+1}")
        self.job_ids.append(job.id)
        self._jobs[job.id] = job
        return job

    def remove(self, job_id: str, delete_job: bool = True) -> bool:  # noqa: ARG002
        if job_id in self.job_ids:
            self.job_ids.remove(job_id)
            self._jobs.pop(job_id, None)
            return True
        return False

    def fetch_job(self, job_id: str) -> _FakeRQJob | None:
        return self._jobs.get(job_id)


class _FakeRegistry:
    def __init__(self, *args, **kwargs):  # noqa: ANN002, ANN003
        self._job_ids: list[str] = []

    def get_job_ids(self) -> list[str]:
        return list(self._job_ids)


class _FakeRedis:
    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    def set(self, key: str, value: str, ex: int | None = None) -> None:  # noqa: ARG002
        self._store[key] = value

    def get(self, key: str) -> str | None:
        return self._store.get(key)

    def delete(self, key: str) -> int:
        if key in self._store:
            del self._store[key]
            return 1
        return 0


def _build_queue(monkeypatch: pytest.MonkeyPatch, *, should_fail_enqueue: bool = False) -> RedisJobQueue:
    fake_queue = _FakeQueue(should_fail_enqueue=should_fail_enqueue)
    fake_redis = _FakeRedis()

    monkeypatch.setattr(
        "app.infrastructure.redis.job_queue.Redis.from_url", lambda _: fake_redis)
    monkeypatch.setattr(
        "app.infrastructure.redis.job_queue.Queue",
        lambda name, connection: fake_queue,  # noqa: ARG005
    )
    monkeypatch.setattr(
        "app.infrastructure.redis.job_queue.StartedJobRegistry", _FakeRegistry)
    monkeypatch.setattr(
        "app.infrastructure.redis.job_queue.FinishedJobRegistry", _FakeRegistry)

    return RedisJobQueue(redis_url="redis://fake:6379/0", queue_name="experiments")


def test_enqueue_returns_queue_position_snapshot(monkeypatch: pytest.MonkeyPatch) -> None:
    queue = _build_queue(monkeypatch)
    spec = JobSpecification(
        job_type="EXPERIMENT_EXECUTION",
        payload={"experiment_id": 1},
    )

    position = queue.enqueue(spec)

    assert position.job_id == "job-1"
    assert position.position == 0
    assert position.queue_name == "experiments"
    assert queue.get_job_id_for_experiment(1) == "job-1"


def test_enqueue_maps_redis_error_to_queue_unavailable(monkeypatch: pytest.MonkeyPatch) -> None:
    queue = _build_queue(monkeypatch, should_fail_enqueue=True)
    spec = JobSpecification(
        job_type="EXPERIMENT_EXECUTION",
        payload={"experiment_id": 1},
    )

    with pytest.raises(QueueUnavailableError, match="Failed to enqueue job"):
        queue.enqueue(spec)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("queued", "queued"),
        ("deferred", "queued"),
        ("started", "running"),
        ("busy", "running"),
        ("finished", "finished"),
        ("completed", "finished"),
        ("failed", "failed"),
        ("cancelled", "canceled"),
        ("stopped", "canceled"),
        ("something-else", "unknown"),
    ],
)
def test_normalize_job_state(raw: str, expected: str) -> None:
    assert RedisJobQueue._normalize_job_state(raw) == expected


def test_get_job_metadata_returns_normalized_detail(monkeypatch: pytest.MonkeyPatch) -> None:
    queue = _build_queue(monkeypatch)
    spec = JobSpecification(
        job_type="EXPERIMENT_EXECUTION",
        payload={"experiment_id": 1},
    )
    queue.enqueue(spec)

    metadata = queue.get_job_metadata("job-1")

    assert metadata["job_id"] == "job-1"
    assert metadata["state"] == "queued"
    assert metadata["queue_position"] == 0
    assert metadata["worker_name"] == "worker-1"
    assert metadata["requested_by_user_id"] == 9
    assert metadata["job_type"] == "EXPERIMENT_EXECUTION"
    assert metadata["payload_experiment_id"] == 1
    assert metadata["queue_name"] == "experiments"
    assert metadata["source"] == "queue"
