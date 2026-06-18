"""SQLAlchemy ORM mapping for the ERD FavoriteModel table."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship, synonym

from app.infrastructure.database.base import Base


class FavoriteModelORM(Base):
    """ORM mapping for FavoriteModel."""

    __tablename__ = "FavoriteModel"

    user_id: Mapped[int] = mapped_column(
        "UserID", Integer, ForeignKey("User.UserID"), primary_key=True)
    model_id: Mapped[int] = mapped_column(
        "ModelID", Integer, ForeignKey("Model.ModelID"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        "CreatedAt", DateTime, nullable=False)

    UserID = synonym("user_id")
    ModelID = synonym("model_id")
    CreatedAt = synonym("created_at")

    User = relationship("UserORM", back_populates="FavoriteModels")
    Model = relationship("ModelORM", back_populates="FavoriteBy")
