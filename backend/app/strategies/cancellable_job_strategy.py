"""Cancellation strategy contract for background jobs."""

from __future__ import annotations

from typing import Any


class CancellableJobStrategy:
    """Defines cancellation behavior contract for background jobs."""

    def supports(self, job_type: str) -> bool:
        raise NotImplementedError

    def cancel(self, job_metadata: dict[str, Any]) -> bool:
        raise NotImplementedError
