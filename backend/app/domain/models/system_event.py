"""Persisted system event domain model."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class SystemEvent:
    system_event_id: int | None
    scope: str
    action: str
    actor_id: int | None
    actor_username: str | None
    target_type: str | None
    target_id: str | None
    message: str
    created_at: datetime
