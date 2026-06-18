"""Job execution strategy contracts."""

from __future__ import annotations

from typing import Any


class JobStrategy:
    """Defines a generic execution and cancellation contract for jobs."""

    def execute(self, job_ctx: dict[str, Any]) -> Any:
        raise NotImplementedError

    def cancel(self, job_id: str) -> bool:
        raise NotImplementedError
