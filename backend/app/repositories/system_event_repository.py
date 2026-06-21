"""SQLAlchemy-backed repository for persisted system events."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.models.system_event import SystemEvent
from app.infrastructure.database.orm.system_event_orm import SystemEventORM


class SystemEventRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _to_domain(row: SystemEventORM) -> SystemEvent:
        return SystemEvent(
            system_event_id=row.SystemEventID,
            scope=row.Scope,
            action=row.Action,
            actor_id=row.ActorID,
            actor_username=row.ActorUsername,
            target_type=row.TargetType,
            target_id=row.TargetID,
            message=row.Message,
            created_at=row.CreatedAt,
        )

    def add(self, event: SystemEvent) -> SystemEvent:
        row = SystemEventORM(
            Scope=event.scope,
            Action=event.action,
            ActorID=event.actor_id,
            ActorUsername=event.actor_username,
            TargetType=event.target_type,
            TargetID=event.target_id,
            Message=event.message,
            CreatedAt=event.created_at,
        )
        self._session.add(row)
        self._session.flush()
        return self._to_domain(row)

    def list_recent(self, scope: str | None = None, limit: int = 100) -> list[SystemEvent]:
        statement = select(SystemEventORM)
        if scope:
            statement = statement.where(SystemEventORM.Scope == scope)
        rows = self._session.scalars(statement.order_by(SystemEventORM.CreatedAt.desc(), SystemEventORM.SystemEventID.desc()).limit(limit)).all()
        return [self._to_domain(row) for row in rows]
