"""SQLAlchemy ORM mapping for the ERD User table."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship, synonym

from app.infrastructure.database.base import Base
from app.infrastructure.database.enums import UserRole, UserStatus


class UserORM(Base):
    """ORM mapping for User."""

    __tablename__ = "User"

    user_id: Mapped[int] = mapped_column(
        "UserID", Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(
        "Username", String(12), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(
        "Email", String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(
        "PasswordHash", String(255), nullable=False)
    name: Mapped[str] = mapped_column("Name", String(100), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        "Role",
        Enum(UserRole, values_callable=lambda e: [
             item.value for item in e], native_enum=False),
        nullable=False,
    )
    status: Mapped[UserStatus] = mapped_column(
        "Status",
        Enum(UserStatus, values_callable=lambda e: [
             item.value for item in e], native_enum=False),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        "CreatedAt", DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        "UpdatedAt", DateTime, nullable=False)

    UserID = synonym("user_id")
    Username = synonym("username")
    Email = synonym("email")
    PasswordHash = synonym("password_hash")
    Name = synonym("name")
    Role = synonym("role")
    Status = synonym("status")
    CreatedAt = synonym("created_at")
    UpdatedAt = synonym("updated_at")

    Blueprints = relationship("BlueprintORM", back_populates="User")
    Experiments = relationship("ExperimentORM", back_populates="User")
    FavoriteModels = relationship("FavoriteModelORM", back_populates="User")
    FavoriteBlueprints = relationship(
        "FavoriteBlueprintORM", back_populates="User")
