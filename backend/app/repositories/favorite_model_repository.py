"""SQLAlchemy-backed repository for FavoriteModel aggregate."""

from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.domain.models.favorite_model import FavoriteModel
from app.infrastructure.database.orm.blueprint_orm import BlueprintORM
from app.infrastructure.database.orm.experiment_orm import ExperimentORM
from app.infrastructure.database.orm.favorite_model_orm import FavoriteModelORM
from app.infrastructure.database.orm.model_orm import ModelORM
from app.infrastructure.database.orm.user_orm import UserORM


class FavoriteModelRepository:
    """FavoriteModel persistence operations using RFC-002 ORM mappings."""

    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _to_domain(row: FavoriteModelORM) -> FavoriteModel:
        return FavoriteModel(
            user_id=row.UserID,
            model_id=row.ModelID,
            created_at=row.CreatedAt,
        )

    def add(self, favorite: FavoriteModel) -> FavoriteModel:
        row = FavoriteModelORM(
            UserID=favorite.UserID,
            ModelID=favorite.ModelID,
            CreatedAt=favorite.CreatedAt,
        )
        self._session.add(row)
        self._session.flush()
        return self._to_domain(row)

    def remove(self, user_id: int, model_id: int) -> None:
        self._session.execute(
            delete(FavoriteModelORM).where(
                FavoriteModelORM.UserID == user_id,
                FavoriteModelORM.ModelID == model_id,
            )
        )

    def exists(self, user_id: int, model_id: int) -> bool:
        return self._session.scalar(
            select(FavoriteModelORM)
            .where(FavoriteModelORM.UserID == user_id)
            .where(FavoriteModelORM.ModelID == model_id)
            .limit(1)
        ) is not None

    def list_by_user(self, user_id: int) -> list[FavoriteModel]:
        rows = self._session.scalars(
            select(FavoriteModelORM)
            .where(FavoriteModelORM.UserID == user_id)
            .order_by(FavoriteModelORM.CreatedAt.desc())
        ).all()
        return [self._to_domain(row) for row in rows]

    def list_favorited_models_for_user(
        self,
        user_id: int,
        *,
        is_staff: bool = False,
        experiment_id: int | None = None,
        blueprint_id: int | None = None,
    ):
        query = (
            select(ModelORM, ExperimentORM, BlueprintORM, UserORM)
            .join(FavoriteModelORM, FavoriteModelORM.ModelID == ModelORM.ModelID)
            .join(ExperimentORM, ExperimentORM.ExperimentID == ModelORM.ExperimentID)
            .join(BlueprintORM, BlueprintORM.BlueprintID == ExperimentORM.BlueprintID)
            .join(UserORM, UserORM.UserID == ExperimentORM.UserID)
            .where(FavoriteModelORM.UserID == user_id)
        )
        if not is_staff:
            query = query.where((ExperimentORM.UserID == user_id) | (BlueprintORM.ApprovalState == "Approved"))
        if experiment_id is not None:
            query = query.where(ModelORM.ExperimentID == experiment_id)
        if blueprint_id is not None:
            query = query.where(ExperimentORM.BlueprintID == blueprint_id)

        return [(model, experiment, blueprint, owner, True) for model, experiment, blueprint, owner in self._session.execute(query.order_by(FavoriteModelORM.CreatedAt.desc())).all()]
