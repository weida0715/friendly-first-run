from __future__ import annotations

from app.domain.value_objects.job_specification import JobSpecification
from app.domain.value_objects.queue_position import QueuePosition
from app.services.queue_service import QueueService, UnsupportedJobTypeError


class FakeJobQueue:
    def __init__(self) -> None:
        self.enqueued: list[JobSpecification] = []
        self.removed_job_ids: list[str] = []
        self.cancelled_job_ids: list[str] = []
        self.positions: dict[str, QueuePosition] = {}
        self.active_jobs: list[dict[str, object]] = []

    def enqueue(self, spec: JobSpecification) -> QueuePosition:
        self.enqueued.append(spec)
        position = QueuePosition(
            job_id="job-1",
            position=0,
            queue_name="experiments",
            eta_seconds=None,
        )
        self.positions[position.job_id] = position
        return position

    def get_queue_position(self, job_id: str) -> QueuePosition | None:
        return self.positions.get(job_id)

    def remove_job_from_queue(self, job_id: str) -> bool:
        self.removed_job_ids.append(job_id)
        return True

    def get_active_jobs(self) -> list[dict[str, object]]:
        return list(self.active_jobs)

    def cancel_running_job(self, job_id: str) -> bool:
        self.cancelled_job_ids.append(job_id)
        return True


def test_enqueue_job_delegates_and_returns_queue_position() -> None:
    backend = FakeJobQueue()
    service = QueueService(backend)
    spec = JobSpecification(
        job_type="EXPERIMENT_EXECUTION",
        payload={"experiment_id": 7},
    )

    queue_position = service.enqueue_job(spec)

    assert queue_position.job_id == "job-1"
    assert backend.enqueued == [spec]


def test_enqueue_job_rejects_unsupported_job_type() -> None:
    backend = FakeJobQueue()
    service = QueueService(backend)

    spec = JobSpecification(
        job_type="EXPERIMENT_EXECUTION",
        payload={"experiment_id": 3},
    )

    service.SUPPORTED_JOB_TYPES = set()

    try:
        service.enqueue_job(spec)
        assert False, "Expected UnsupportedJobTypeError"
    except UnsupportedJobTypeError:
        pass


def test_queue_service_delegates_read_remove_cancel_methods() -> None:
    backend = FakeJobQueue()
    service = QueueService(backend)
    backend.positions["job-99"] = QueuePosition(
        job_id="job-99",
        position=2,
        queue_name="experiments",
        eta_seconds=30,
    )
    backend.active_jobs = [{"job_id": "job-99", "state": "queued"}]

    position = service.get_queue_position("job-99")
    removed = service.remove_job_from_queue("job-99")
    active = service.get_active_jobs()
    cancelled = service.cancel_running_job("job-99")

    assert position is not None and position.position == 2
    assert removed is True
    assert active == [{"job_id": "job-99", "state": "queued"}]
    assert cancelled is True
    assert backend.removed_job_ids == ["job-99"]
    assert backend.cancelled_job_ids == ["job-99"]
