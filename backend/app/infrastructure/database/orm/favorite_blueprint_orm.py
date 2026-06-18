"""SQLAlchemy ORM mapping for the ERD FavoriteBlueprint table."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship, synonym

from app.infrastructure.database.base import Base


class FavoriteBlueprintORM(Base):
    """ORM mapping for FavoriteBlueprint."""

    __tablename__ = "FavoriteBlueprint"

    user_id: Mapped[int] = mapped_column(
        "UserID", Integer, ForeignKey("User.UserID"), primary_key=True)
    blueprint_id: Mapped[int] = mapped_column(
        "BlueprintID", Integer, ForeignKey("Blueprint.BlueprintID"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(
        "CreatedAt", DateTime, nullable=False)

    UserID = synonym("user_id")
    BlueprintID = synonym("blueprint_id")
    CreatedAt = synonym("created_at")

    User = relationship("UserORM", back_populates="FavoriteBlueprints")
    Blueprint = relationship("BlueprintORM", back_populates="FavoriteBy")
