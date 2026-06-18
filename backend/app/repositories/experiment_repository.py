"""SQLAlchemy-backed repository for Experiment aggregate."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.models.experiment import Experiment
from app.infrastructure.database.orm.experiment_orm import ExperimentORM

MAX_CURRENT_STAGE_LENGTH = 50


def _fit_current_stage(value: str | None) -> str | None:
    if value is None:
        return None
    text = str(value)
    if len(text) <= MAX_CURRENT_STAGE_LENGTH:
        return text
    return text[: MAX_CURRENT_STAGE_LENGTH - 1] + "…"


class ExperimentRepository:
    """Experiment persistence operations using RFC-002 ORM mappings."""

    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _to_domain(row: ExperimentORM) -> Experiment:
        interval = row.Interval.value if hasattr(
            row.Interval, "value") else row.Interval
        status = row.Status.value if hasattr(
            row.Status, "value") else row.Status
        return Experiment(
            experiment_id=row.ExperimentID,
            user_id=row.UserID,
            blueprint_id=row.BlueprintID,
            name=row.Name,
            description=row.Description,
            interval=interval,
            start_date=row.StartDate,
            end_date=row.EndDate,
            train_split=row.TrainSplit,
            val_split=row.ValSplit,
            test_split=row.TestSplit,
            parameter_overrides=row.ParameterOverrides,
            status=status,
            progress=row.Progress,
            current_stage=row.CurrentStage,
            eta_seconds=row.EtaSeconds,
            success=row.Success,
            created_at=row.CreatedAt,
            completed_at=row.CompletedAt,
            job_id=getattr(row, "JobID", None),
            start_datetime=getattr(row, "StartDateTime", None),
            end_datetime=getattr(row, "EndDateTime", None),
            compiled_blueprint_snapshot=getattr(
                row, "CompiledBlueprintSnapshot", None),
            compiled_experiment_snapshot=getattr(
                row, "CompiledExperimentSnapshot", None),
            deterministic=getattr(row, "Deterministic", True),
            seed=getattr(row, "Seed", 42),
            max_permutation_count=getattr(row, "MaxPermutationCount", None),
            requested_permutation_count=getattr(
                row, "RequestedPermutationCount", None),
        )

    def add(self, experiment: Experiment) -> Experiment:
        row = ExperimentORM(
            UserID=experiment.UserID,
            BlueprintID=experiment.BlueprintID,
            Name=experiment.Name,
            Description=experiment.Description,
            Interval=experiment.Interval,
            StartDate=experiment.StartDate,
            EndDate=experiment.EndDate,
            StartDateTime=experiment.StartDateTime,
            EndDateTime=experiment.EndDateTime,
            TrainSplit=experiment.TrainSplit,
            ValSplit=experiment.ValSplit,
            TestSplit=experiment.TestSplit,
            ParameterOverrides=experiment.ParameterOverrides,
            Status=experiment.Status,
            Progress=experiment.Progress,
            CurrentStage=experiment.CurrentStage,
            EtaSeconds=experiment.EtaSeconds,
            Success=experiment.Success,
            CreatedAt=experiment.CreatedAt,
            CompletedAt=experiment.CompletedAt,
            JobID=experiment.JobID,
            CompiledBlueprintSnapshot=experiment.compiled_blueprint_snapshot,
            CompiledExperimentSnapshot=experiment.compiled_experiment_snapshot,
            Deterministic=experiment.deterministic,
            Seed=experiment.seed,
            MaxPermutationCount=experiment.max_permutation_count,
            RequestedPermutationCount=experiment.requested_permutation_count,
        )
        self._session.add(row)
        self._session.flush()
        return self._to_domain(row)

    def get_by_id(self, experiment_id: int) -> Experiment | None:
        row = self._session.get(ExperimentORM, experiment_id)
        return self._to_domain(row) if row else None

    def list_by_ids(self, experiment_ids: list[int]) -> list[Experiment]:
        if not experiment_ids:
            return []
        rows = self._session.scalars(
            select(ExperimentORM).where(
                ExperimentORM.ExperimentID.in_(experiment_ids))
        ).all()
        return [self._to_domain(row) for row in rows]

    def list_by_user(self, user_id: int) -> list[Experiment]:
        rows = self._session.scalars(
            select(ExperimentORM)
            .where(ExperimentORM.UserID == user_id)
            .order_by(ExperimentORM.ExperimentID.desc())
        ).all()
        return [self._to_domain(row) for row in rows]

    def list_by_user_filtered(
        self,
        user_id: int,
        *,
        status: str | None = None,
        search: str | None = None,
    ) -> list[Experiment]:
        query = select(ExperimentORM).where(ExperimentORM.UserID == user_id)
        if status:
            query = query.where(ExperimentORM.Status == status)
        if search:
            query = query.where(ExperimentORM.Name.ilike(f"%{search}%"))
        rows = self._session.scalars(query.order_by(
            ExperimentORM.ExperimentID.desc())).all()
        return [self._to_domain(row) for row in rows]

    def mark_running(
        self,
        experiment_id: int,
        *,
        progress: Decimal = Decimal("0"),
        current_stage: str | None = None,
    ) -> Experiment | None:
        row = self._session.get(ExperimentORM, experiment_id)
        if row is None:
            return None
        row.Status = "Running"
        row.Progress = progress
        row.CurrentStage = _fit_current_stage(current_stage)
        row.Success = None
        row.CompletedAt = None
        self._session.flush()
        return self._to_domain(row)

    def update_progress(
        self,
        experiment_id: int,
        *,
        progress: Decimal | None = None,
        current_stage: str | None = None,
        eta_seconds: int | None = None,
    ) -> Experiment | None:
        row = self._session.get(ExperimentORM, experiment_id)
        if row is None:
            return None
        if progress is not None:
            row.Progress = progress
        row.CurrentStage = _fit_current_stage(current_stage)
        row.EtaSeconds = eta_seconds
        self._session.flush()
        return self._to_domain(row)

    def mark_completed(
        self,
        experiment_id: int,
        *,
        completed_at: datetime,
        current_stage: str | None = "Completed",
    ) -> Experiment | None:
        row = self._session.get(ExperimentORM, experiment_id)
        if row is None:
            return None
        row.Status = "Completed"
        row.Progress = Decimal("100")
        row.CurrentStage = _fit_current_stage(current_stage)
        row.Success = True
        row.CompletedAt = completed_at
        self._session.flush()
        return self._to_domain(row)

    def mark_failed(
        self,
        experiment_id: int,
        *,
        completed_at: datetime,
        current_stage: str | None = "Failed",
    ) -> Experiment | None:
        row = self._session.get(ExperimentORM, experiment_id)
        if row is None:
            return None
        row.Status = "Failed"
        row.CurrentStage = _fit_current_stage(current_stage)
        row.Success = False
        row.CompletedAt = completed_at
        self._session.flush()
        return self._to_domain(row)

    def mark_cancelled(self, experiment_id: int, *, completed_at: datetime, current_stage: str | None = "Cancelled") -> Experiment | None:
        row = self._session.get(ExperimentORM, experiment_id)
        if row is None:
            return None
        row.Status = "Cancelled"
        row.CurrentStage = _fit_current_stage(current_stage)
        row.Success = False
        row.CompletedAt = completed_at
        self._session.flush()
        return self._to_domain(row)
