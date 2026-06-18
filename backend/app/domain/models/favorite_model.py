"""Strict ERD-aligned FavoriteModel domain entity."""

from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class FavoriteModel:
    """Represents the ERD-defined FavoriteModel entity."""

    user_id: int
    model_id: int
    created_at: datetime

    @property
    def UserID(self) -> int: return self.user_id
    @property
    def ModelID(self) -> int: return self.model_id
    @property
    def CreatedAt(self) -> datetime: return self.created_at
