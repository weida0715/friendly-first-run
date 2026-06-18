"""Queue position value object."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class QueuePosition:
    """Immutable queue position and ETA snapshot."""

    job_id: str
    position: int | None
    queue_name: str
    eta_seconds: int | None = None

    def __post_init__(self) -> None:
        if not self.job_id.strip():
            raise ValueError("job_id must be a non-empty string")

        if self.position is not None and self.position < 0:
            raise ValueError("position must be >= 0 when provided")

        if not self.queue_name.strip():
            raise ValueError("queue_name must be a non-empty string")

        if self.eta_seconds is not None and self.eta_seconds < 0:
            raise ValueError("eta_seconds must be >= 0 when provided")
