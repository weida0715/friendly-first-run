from __future__ import annotations

import pytest

from app.services.job_metadata_service import JobMetadataService
from app.services.queue_service import QueueJobNotFoundError


class FakeMetadataProvider:
    def __init__(self, payloads: list[dict[str, object]] | None = None, *, raise_not_found: bool = False) -> None:
        self._payloads = payloads or []
        self._raise_not_found = raise_not_found

    def get_job_metadata(self, job_id: str) -> dict[str, object]:
        if self._payloads:
            return dict(self._payloads.pop(0))
        if self._raise_not_found:
            raise QueueJobNotFoundError(f"Queue job not found: {job_id}")
        return {
            "job_id": job_id,
            "state": "running",
            "source": "queue",
        }


def test_returns_live_metadata_from_queue_provider() -> None:
    provider = FakeMetadataProvider(
        payloads=[{"job_id": "job-1", "state": "running", "source": "queue"}]
    )
    service = JobMetadataService(provider, cache_ttl_seconds=60)

    detail = service.get_job_detail("job-1")

    assert detail["job_id"] == "job-1"
    assert detail["state"] == "running"
    assert detail["source"] == "queue"


def test_falls_back_to_cache_for_recent_terminal_metadata() -> None:
    provider = FakeMetadataProvider(
        payloads=[{"job_id": "job-2", "state": "finished", "source": "queue"}],
        raise_not_found=True,
    )
    service = JobMetadataService(provider, cache_ttl_seconds=60)

    first = service.get_job_detail("job-2")
    assert first["source"] == "queue"

    fallback = service.get_job_detail("job-2")
    assert fallback["job_id"] == "job-2"
    assert fallback["state"] == "finished"
    assert fallback["source"] == "cache"


def test_cache_expires_and_not_found_is_raised(monkeypatch: pytest.MonkeyPatch) -> None:
    provider = FakeMetadataProvider(
        payloads=[{"job_id": "job-3", "state": "failed", "source": "queue"}],
        raise_not_found=True,
    )
    service = JobMetadataService(provider, cache_ttl_seconds=1)

    service.get_job_detail("job-3")

    import app.services.job_metadata_service as module

    monkeypatch.setattr(module.time, "time", lambda: 10_000_000_000.0)

    with pytest.raises(QueueJobNotFoundError):
        service.get_job_detail("job-3")
