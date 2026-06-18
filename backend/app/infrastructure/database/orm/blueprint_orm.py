"""SQLAlchemy ORM mapping for the ERD Blueprint table."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship, synonym

from app.infrastructure.database.base import Base
from app.infrastructure.database.enums import ApprovalState


class BlueprintORM(Base):
    """ORM mapping for Blueprint."""

    __tablename__ = "Blueprint"
    __table_args__ = (
        UniqueConstraint("UserID", "Name", "Version",
                         name="uq_Blueprint_UserID_Name_Version"),
        CheckConstraint(
            "ParentID IS NULL OR ParentID <> BlueprintID",
            name="ck_Blueprint_ParentID_not_self",
        ),
    )

    blueprint_id: Mapped[int] = mapped_column(
        "BlueprintID", Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        "UserID", ForeignKey("User.UserID"), nullable=False)
    name: Mapped[str] = mapped_column("Name", String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(
        "Description", Text, nullable=True)
    indicators: Mapped[dict] = mapped_column(
        "Indicators", JSON, nullable=False)
    features: Mapped[dict] = mapped_column("Features", JSON, nullable=False)
    architecture: Mapped[dict] = mapped_column(
        "Architecture", JSON, nullable=False)
    approval_state: Mapped[ApprovalState] = mapped_column(
        "ApprovalState",
        Enum(ApprovalState, values_callable=lambda e: [
             item.value for item in e], native_enum=False),
        nullable=False,
    )
    submitted_at: Mapped[datetime | None] = mapped_column(
        "SubmittedAt", DateTime, nullable=True)
    version: Mapped[int] = mapped_column("Version", Integer, nullable=False)
    parent_id: Mapped[int | None] = mapped_column(
        "ParentID", ForeignKey("Blueprint.BlueprintID"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        "CreatedAt", DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        "UpdatedAt", DateTime, nullable=False)

    BlueprintID = synonym("blueprint_id")
    UserID = synonym("user_id")
    Name = synonym("name")
    Description = synonym("description")
    Indicators = synonym("indicators")
    Features = synonym("features")
    Architecture = synonym("architecture")
    ApprovalState = synonym("approval_state")
    SubmittedAt = synonym("submitted_at")
    Version = synonym("version")
    ParentID = synonym("parent_id")
    CreatedAt = synonym("created_at")
    UpdatedAt = synonym("updated_at")

    User = relationship("UserORM", back_populates="Blueprints")
    Parent = relationship("BlueprintORM", remote_side=[
                          blueprint_id], back_populates="Children")
    Children = relationship("BlueprintORM", back_populates="Parent")
    Experiments = relationship("ExperimentORM", back_populates="Blueprint")
    FavoriteBy = relationship("FavoriteBlueprintORM",
                              back_populates="Blueprint")
