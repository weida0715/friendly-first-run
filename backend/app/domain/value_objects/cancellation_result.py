"""Cancellation result value object."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class CancellationResult:
    """Immutable cancellation outcome."""

    cancelled: bool
    reason: str | None = None
