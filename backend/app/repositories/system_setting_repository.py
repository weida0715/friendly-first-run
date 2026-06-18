"""Repository for persisted admin-managed system settings."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select

from sqlalchemy.orm import Session

from app.infrastructure.database.orm.system_setting_orm import SystemSettingORM


class SystemSettingRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def get(self, key: str) -> str | None:
        row = self._session.get(SystemSettingORM, key)
        return row.Value if row else None

    def list_all(self) -> dict[str, str]:
        rows = self._session.scalars(select(SystemSettingORM).order_by(SystemSettingORM.Key)).all()
        return {row.Key: row.Value for row in rows}

    def set_many(self, values: dict[str, str]) -> dict[str, str]:
        now = datetime.now(timezone.utc)
        for key, value in values.items():
            row = self._session.get(SystemSettingORM, key)
            if row is None:
                row = SystemSettingORM(Key=key, Value=str(value), UpdatedAt=now)
                self._session.add(row)
            else:
                row.Value = str(value)
                row.UpdatedAt = now
        self._session.flush()
        return self.list_all()