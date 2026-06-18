"""SQLAlchemy ORM mapping for the ERD Model table."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship, synonym

from app.infrastructure.database.base import Base


class ModelORM(Base):
    """ORM mapping for Model."""

    __tablename__ = "Model"
    __table_args__ = (UniqueConstraint("ExperimentID", "ParameterHash", name="uq_Model_ExperimentID_ParameterHash"),)

    model_id: Mapped[int] = mapped_column(
        "ModelID", Integer, primary_key=True, autoincrement=True)
    experiment_id: Mapped[int] = mapped_column(
        "ExperimentID", ForeignKey("Experiment.ExperimentID"), nullable=False)
    parameters: Mapped[dict] = mapped_column(
        "Parameters", JSON, nullable=False)
    sharpe: Mapped[Decimal | None] = mapped_column(
        "Sharpe", Numeric(10, 4), nullable=True)
    accuracy: Mapped[Decimal | None] = mapped_column(
        "Accuracy", Numeric(5, 4), nullable=True)
    precision: Mapped[Decimal | None] = mapped_column(
        "Precision", Numeric(5, 4), nullable=True)
    recall: Mapped[Decimal | None] = mapped_column(
        "Recall", Numeric(5, 4), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        "CreatedAt", DateTime, nullable=True)
    parameter_hash: Mapped[str | None] = mapped_column("ParameterHash", String(64), nullable=True)

    ModelID = synonym("model_id")
    ExperimentID = synonym("experiment_id")
    Parameters = synonym("parameters")
    Sharpe = synonym("sharpe")
    Accuracy = synonym("accuracy")
    Precision = synonym("precision")
    Recall = synonym("recall")
    CreatedAt = synonym("created_at")
    ParameterHash = synonym("parameter_hash")

    Experiment = relationship("ExperimentORM", back_populates="Models")
    Logs = relationship("ExperimentLogORM", back_populates="Model")
    FavoriteBy = relationship("FavoriteModelORM", back_populates="Model")
