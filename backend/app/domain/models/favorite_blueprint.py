"""Strict ERD-aligned FavoriteBlueprint domain entity."""

from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class FavoriteBlueprint:
    """Represents the ERD-defined FavoriteBlueprint entity."""

    user_id: int
    blueprint_id: int
    created_at: datetime

    @property
    def UserID(self) -> int: return self.user_id
    @property
    def BlueprintID(self) -> int: return self.blueprint_id
    @property
    def CreatedAt(self) -> datetime: return self.created_at
