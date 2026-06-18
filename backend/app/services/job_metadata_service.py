"""Queue-backed job metadata resolver with optional transient cache."""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Protocol

from app.services.queue_service import QueueJobNotFoundError


class JobMetadataProvider(Protocol):
    """Protocol for queue adapters that can resolve detailed job metadata."""

    def get_job_metadata(self, job_id: str) -> dict[str, Any]:
        """Return normalized queue job metadata for the given job id."""


@dataclass(slots=True)
class _CachedMetadata:
    expires_at_epoch: float
    payload: dict[str, Any]


class JobMetadataService:
    """Resolves job detail DTOs from queue backend with optional TTL cache fallback."""

    TERMINAL_STATES = {"finished", "failed", "canceled"}

    def __init__(
        self,
        provider: JobMetadataProvider,
        *,
        cache_ttl_seconds: int = 300,
    ) -> None:
        self._provider = provider
        self._cache_ttl_seconds = cache_ttl_seconds
        self._cache: dict[str, _CachedMetadata] = {}

    def get_job_detail(self, job_id: str) -> dict[str, Any]:
        self._evict_if_expired(job_id)
        try:
            metadata = self._provider.get_job_metadata(job_id)
            if metadata.get("state") in self.TERMINAL_STATES:
                self._set_cache(job_id, metadata)
            return metadata
        except QueueJobNotFoundError:
            cached = self._cache.get(job_id)
            if cached is None:
                raise
            cached_payload = dict(cached.payload)
            cached_payload["source"] = "cache"
            return cached_payload

    def _set_cache(self, job_id: str, payload: dict[str, Any]) -> None:
        expires_at = time.time() + self._cache_ttl_seconds
        self._cache[job_id] = _CachedMetadata(
            expires_at_epoch=expires_at,
            payload=dict(payload),
        )

    def _evict_if_expired(self, job_id: str) -> None:
        cached = self._cache.get(job_id)
        if cached is None:
            return
        if cached.expires_at_epoch <= time.time():
            self._cache.pop(job_id, None)
