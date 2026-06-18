"""SQLAlchemy ORM mapping for the ERD BTCUSDTKline table."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric
from sqlalchemy.orm import Mapped, mapped_column, synonym

from app.infrastructure.database.base import Base


class BTCUSDTKlineORM(Base):
    """ORM mapping for BTCUSDTKline."""

    __tablename__ = "BTCUSDTKline"

    timestamp: Mapped[datetime] = mapped_column(
        "Timestamp", DateTime, primary_key=True)
    open: Mapped[Decimal] = mapped_column(
        "Open", Numeric(15, 8), nullable=False)
    high: Mapped[Decimal] = mapped_column(
        "High", Numeric(15, 8), nullable=False)
    low: Mapped[Decimal] = mapped_column("Low", Numeric(15, 8), nullable=False)
    close: Mapped[Decimal] = mapped_column(
        "Close", Numeric(15, 8), nullable=False)
    volume: Mapped[Decimal] = mapped_column(
        "Volume", Numeric(20, 8), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "CreatedAt", DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        "UpdatedAt", DateTime, nullable=False)

    Timestamp = synonym("timestamp")
    Open = synonym("open")
    High = synonym("high")
    Low = synonym("low")
    Close = synonym("close")
    Volume = synonym("volume")
    CreatedAt = synonym("created_at")
    UpdatedAt = synonym("updated_at")
