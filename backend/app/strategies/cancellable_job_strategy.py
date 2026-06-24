"""Cancellation strategy contract for background jobs."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class CancellableJobStrategy(ABC):
    """Defines cancellation behavior contract for background jobs."""

    @abstractmethod
    def supports(self, job_type: str) -> bool:
        ...

    @abstractmethod
    def cancel(self, job_id: str, job_metadata: dict[str, Any], queue_service: Any) -> dict[str, Any]:
        ...
