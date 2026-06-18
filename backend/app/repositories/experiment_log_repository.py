"""SQLAlchemy-backed repository for ExperimentLog aggregate."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.models.experiment_log import ExperimentLog
from app.infrastructure.database.orm.experiment_log_orm import ExperimentLogORM


class ExperimentLogRepository:
    """ExperimentLog persistence operations using RFC-002 ORM mappings."""

    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _to_domain(row: ExperimentLogORM) -> ExperimentLog:
        return ExperimentLog(
            experiment_log_id=row.ExperimentLogID,
            experiment_id=row.ExperimentID,
            model_id=row.ModelID,
            timestamp=row.Timestamp,
            signal=row.Signal,
            prediction=row.Prediction,
            metrics=row.Metrics,
            created_at=row.CreatedAt,
        )

    def add(self, log: ExperimentLog) -> ExperimentLog:
        row = ExperimentLogORM(
            ExperimentID=log.ExperimentID,
            ModelID=log.ModelID,
            Timestamp=log.Timestamp,
            Signal=log.Signal,
            Prediction=log.Prediction,
            Metrics=log.Metrics,
            CreatedAt=log.CreatedAt,
        )
        self._session.add(row)
        self._session.flush()
        return self._to_domain(row)

    def list_by_experiment(self, experiment_id: int) -> list[ExperimentLog]:
        rows = self._session.scalars(
            select(ExperimentLogORM)
            .where(ExperimentLogORM.ExperimentID == experiment_id)
            .order_by(ExperimentLogORM.ExperimentLogID)
        ).all()
        return [self._to_domain(row) for row in rows]

    def list_metric_summaries_by_experiment(self, experiment_id: int) -> list[ExperimentLog]:
        """Load only table-level metric logs, excluding large per-round logs."""
        metrics_type = ExperimentLogORM.Metrics["type"].as_string()
        rows = self._session.scalars(
            select(ExperimentLogORM)
            .where(ExperimentLogORM.ExperimentID == experiment_id)
            .where(metrics_type.in_(["backtest", "confusion"]))
            .order_by(ExperimentLogORM.ExperimentLogID)
        ).all()
        return [self._to_domain(row) for row in rows]

    def list_by_experiment_and_type(self, experiment_id: int, log_type: str) -> list[ExperimentLog]:
        metrics_type = ExperimentLogORM.Metrics["type"].as_string()
        rows = self._session.scalars(
            select(ExperimentLogORM)
            .where(ExperimentLogORM.ExperimentID == experiment_id)
            .where(metrics_type == log_type)
            .order_by(ExperimentLogORM.ExperimentLogID)
        ).all()
        return [self._to_domain(row) for row in rows]

    def list_by_model(self, model_id: int) -> list[ExperimentLog]:
        rows = self._session.scalars(
            select(ExperimentLogORM)
            .where(ExperimentLogORM.ModelID == model_id)
            .order_by(ExperimentLogORM.ExperimentLogID)
        ).all()
        return [self._to_domain(row) for row in rows]

    def list_by_model_and_type(self, model_id: int, log_type: str) -> list[ExperimentLog]:
        metrics_type = ExperimentLogORM.Metrics["type"].as_string()
        rows = self._session.scalars(
            select(ExperimentLogORM)
            .where(ExperimentLogORM.ModelID == model_id)
            .where(metrics_type == log_type)
            .order_by(ExperimentLogORM.ExperimentLogID)
        ).all()
        return [self._to_domain(row) for row in rows]

    def add_metrics_log(self, *, experiment_id: int, model_id: int, metrics: dict, timestamp=None) -> ExperimentLog:
        from datetime import datetime, timezone
        from decimal import Decimal
        now = timestamp or datetime.now(timezone.utc)
        return self.add(ExperimentLog(None, experiment_id, model_id, now, 0, Decimal("0"), metrics, now))
