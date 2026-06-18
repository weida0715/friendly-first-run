"""Experiment cancellation strategy."""

from __future__ import annotations

from typing import Any

from app.strategies.cancellable_job_strategy import CancellableJobStrategy


class ExperimentCancellationHandler(CancellableJobStrategy):
    """Handles experiment-specific cancellation behavior."""

    JOB_TYPE = "EXPERIMENT_EXECUTION"

    def supports(self, job_type: str) -> bool:
        return str(job_type) == self.JOB_TYPE

    def cancel(self, job_metadata: dict[str, Any]) -> bool:
        state = str(job_metadata.get("state") or "").lower()
        if state != "queued":
            raise ValueError(
                "Experiment cancellation only supports queued jobs")
        return True
