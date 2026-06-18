"""SQLAlchemy ORM mapping for the ERD ExperimentLog table."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Numeric, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship, synonym

from app.infrastructure.database.base import Base


class ExperimentLogORM(Base):
    """ORM mapping for ExperimentLog."""

    __tablename__ = "ExperimentLog"

    experiment_log_id: Mapped[int] = mapped_column(
        "ExperimentLogID", Integer, primary_key=True, autoincrement=True)
    experiment_id: Mapped[int] = mapped_column(
        "ExperimentID", ForeignKey("Experiment.ExperimentID"), nullable=False)
    model_id: Mapped[int] = mapped_column(
        "ModelID", ForeignKey("Model.ModelID"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        "Timestamp", DateTime, nullable=False)
    signal: Mapped[int] = mapped_column("Signal", SmallInteger, nullable=False)
    prediction: Mapped[Decimal | None] = mapped_column(
        "Prediction", Numeric(10, 4), nullable=True)
    metrics: Mapped[dict | None] = mapped_column(
        "Metrics", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        "CreatedAt", DateTime, nullable=False)

    ExperimentLogID = synonym("experiment_log_id")
    ExperimentID = synonym("experiment_id")
    ModelID = synonym("model_id")
    Timestamp = synonym("timestamp")
    Signal = synonym("signal")
    Prediction = synonym("prediction")
    Metrics = synonym("metrics")
    CreatedAt = synonym("created_at")

    Experiment = relationship("ExperimentORM", back_populates="Logs")
    Model = relationship("ModelORM", back_populates="Logs")
