"""ORM mapping for admin-managed system settings."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, synonym

from app.infrastructure.database.base import Base


class SystemSettingORM(Base):
    """Key/value settings table for runtime operational controls."""

    __tablename__ = "SystemSetting"

    key: Mapped[str] = mapped_column("Key", String(100), primary_key=True)
    value: Mapped[str] = mapped_column("Value", String(500), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        "UpdatedAt", DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    Key = synonym("key")
    Value = synonym("value")
    UpdatedAt = synonym("updated_at")