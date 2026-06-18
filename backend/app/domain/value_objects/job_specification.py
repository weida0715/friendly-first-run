"""Job specification value object."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

JobType = Literal["EXPERIMENT_EXECUTION"]
JobPriority = Literal["low", "normal", "high"]


@dataclass(frozen=True, slots=True)
class JobSpecification:
    """Immutable job definition for queue/execution coordination."""

    job_type: JobType
    payload: dict[str, Any]
    priority: JobPriority = "normal"
    requested_by_user_id: int | None = None

    def __post_init__(self) -> None:
        if self.job_type != "EXPERIMENT_EXECUTION":
            raise ValueError("job_type must be 'EXPERIMENT_EXECUTION'")

        if self.priority not in {"low", "normal", "high"}:
            raise ValueError("priority must be one of: low, normal, high")

        if "experiment_id" not in self.payload:
            raise ValueError(
                "payload must include required key: experiment_id")

        experiment_id = self.payload["experiment_id"]
        if not isinstance(experiment_id, int) or isinstance(experiment_id, bool):
            raise ValueError("payload.experiment_id must be an integer")
        if experiment_id <= 0:
            raise ValueError(
                "payload.experiment_id must be a positive integer")

        if self.requested_by_user_id is not None and (
            not isinstance(self.requested_by_user_id, int)
            or isinstance(self.requested_by_user_id, bool)
            or self.requested_by_user_id <= 0
        ):
            raise ValueError(
                "requested_by_user_id must be a positive integer when provided")
