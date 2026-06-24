"""Job cancellation handler registry."""

from __future__ import annotations

from app.strategies.cancellable_job_strategy import CancellableJobStrategy
from app.strategies.experiment_cancellation_handler import ExperimentCancellationHandler


class JobCancellationHandlerRegistry:
    """Resolves cancellation handlers by job type."""

    def __init__(self, handlers: list[CancellableJobStrategy] | None = None) -> None:
        self._handlers = list(handlers or [ExperimentCancellationHandler()])

    def resolve(self, job_type: str) -> CancellableJobStrategy:
        for handler in self._handlers:
            if handler.supports(job_type):
                return handler
        raise KeyError(job_type)

    def get(self, job_type: str | None) -> CancellableJobStrategy:
        try:
            return self.resolve(job_type or ExperimentCancellationHandler.JOB_TYPE)
        except KeyError:
            return self.resolve(ExperimentCancellationHandler.JOB_TYPE)
