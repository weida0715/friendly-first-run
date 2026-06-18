"""Job cancellation handler registry."""

from __future__ import annotations

from app.strategies.cancellable_job_strategy import CancellableJobStrategy


class JobCancellationHandlerRegistry:
    """Resolves cancellation handlers by job type."""

    def __init__(self, handlers: list[CancellableJobStrategy]) -> None:
        self._handlers = list(handlers)

    def resolve(self, job_type: str) -> CancellableJobStrategy:
        for handler in self._handlers:
            if handler.supports(job_type):
                return handler
        raise KeyError(job_type)
