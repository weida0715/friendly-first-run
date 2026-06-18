"""Strict ERD-aligned BTCUSDTKline domain entity."""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal


@dataclass(slots=True)
class BTCUSDTKline:
    """Represents the ERD-defined BTCUSDTKline entity."""

    timestamp: datetime
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: Decimal
    created_at: datetime
    updated_at: datetime | None = None

    @property
    def Timestamp(self) -> datetime: return self.timestamp
    @property
    def Open(self) -> Decimal: return self.open
    @property
    def High(self) -> Decimal: return self.high
    @property
    def Low(self) -> Decimal: return self.low
    @property
    def Close(self) -> Decimal: return self.close
    @property
    def Volume(self) -> Decimal: return self.volume
    @property
    def CreatedAt(self) -> datetime: return self.created_at
    @property
    def UpdatedAt(self) -> datetime | None: return self.updated_at
