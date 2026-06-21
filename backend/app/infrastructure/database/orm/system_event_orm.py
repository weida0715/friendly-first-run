"""SQLAlchemy ORM mapping for persisted system events."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, synonym

from app.infrastructure.database.base import Base


class SystemEventORM(Base):
    """ORM mapping for SystemEvent."""

    __tablename__ = "SystemEvent"

    system_event_id: Mapped[int] = mapped_column(
        "SystemEventID", Integer, primary_key=True, autoincrement=True)
    scope: Mapped[str] = mapped_column("Scope", String(32), nullable=False)
    action: Mapped[str] = mapped_column("Action", String(128), nullable=False)
    actor_id: Mapped[int | None] = mapped_column("ActorID", Integer, nullable=True)
    actor_username: Mapped[str | None] = mapped_column("ActorUsername", String(64), nullable=True)
    target_type: Mapped[str | None] = mapped_column("TargetType", String(64), nullable=True)
    target_id: Mapped[str | None] = mapped_column("TargetID", String(64), nullable=True)
    message: Mapped[str] = mapped_column("Message", Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column("CreatedAt", DateTime, nullable=False)

    SystemEventID = synonym("system_event_id")
    Scope = synonym("scope")
    Action = synonym("action")
    ActorID = synonym("actor_id")
    ActorUsername = synonym("actor_username")
    TargetType = synonym("target_type")
    TargetID = synonym("target_id")
    Message = synonym("message")
    CreatedAt = synonym("created_at")
