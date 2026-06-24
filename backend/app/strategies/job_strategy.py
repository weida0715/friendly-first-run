"""Job execution strategy contracts."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class JobStrategy(ABC):
    """Defines a generic execution and cancellation contract for jobs."""

    @abstractmethod
    def execute(self, job_ctx: dict[str, Any]) -> Any:
        ...

    @abstractmethod
    def cancel(self, job_id: str) -> bool:
        ...
