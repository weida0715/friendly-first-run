"""SQLAlchemy-backed repository for FavoriteBlueprint aggregate."""

from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.domain.models.blueprint import Blueprint
from app.domain.models.favorite_blueprint import FavoriteBlueprint
from app.infrastructure.database.orm.blueprint_orm import BlueprintORM
from app.infrastructure.database.orm.user_orm import UserORM
from app.infrastructure.database.orm.favorite_blueprint_orm import FavoriteBlueprintORM
from app.repositories.mappers.blueprint_mapper import orm_to_blueprint_domain


class FavoriteBlueprintRepository:
    """FavoriteBlueprint persistence operations using RFC-002 ORM mappings."""

    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _to_domain(row: FavoriteBlueprintORM) -> FavoriteBlueprint:
        return FavoriteBlueprint(
            user_id=row.UserID,
            blueprint_id=row.BlueprintID,
            created_at=row.CreatedAt,
        )

    def add(self, favorite: FavoriteBlueprint) -> FavoriteBlueprint:
        row = FavoriteBlueprintORM(
            UserID=favorite.UserID,
            BlueprintID=favorite.BlueprintID,
            CreatedAt=favorite.CreatedAt,
        )
        self._session.add(row)
        self._session.flush()
        return self._to_domain(row)

    def remove(self, user_id: int, blueprint_id: int) -> None:
        self._session.execute(
            delete(FavoriteBlueprintORM).where(
                FavoriteBlueprintORM.UserID == user_id,
                FavoriteBlueprintORM.BlueprintID == blueprint_id,
            )
        )

    def exists(self, user_id: int, blueprint_id: int) -> bool:
        row = self._session.scalar(
            select(FavoriteBlueprintORM).where(
                FavoriteBlueprintORM.UserID == user_id,
                FavoriteBlueprintORM.BlueprintID == blueprint_id,
            )
        )
        return row is not None

    def list_by_user(self, user_id: int) -> list[FavoriteBlueprint]:
        rows = self._session.scalars(
            select(FavoriteBlueprintORM)
            .where(FavoriteBlueprintORM.UserID == user_id)
            .order_by(FavoriteBlueprintORM.CreatedAt.desc())
        ).all()
        return [self._to_domain(row) for row in rows]

    def list_favorited_blueprints_for_user(
        self,
        user_id: int,
        *,
        name: str | None = None,
        status: str | None = None,
        author: str | None = None,
    ) -> list[Blueprint]:
        query = (
            select(BlueprintORM)
            .join(FavoriteBlueprintORM, FavoriteBlueprintORM.BlueprintID == BlueprintORM.BlueprintID)
            .join(UserORM, UserORM.UserID == BlueprintORM.UserID)
            .where(FavoriteBlueprintORM.UserID == user_id)
            .where((BlueprintORM.ApprovalState != "Draft") | (BlueprintORM.UserID == user_id))
            .where((BlueprintORM.ApprovalState != "Disapproved") | (BlueprintORM.UserID == user_id))
        )
        if name:
            query = query.where(BlueprintORM.Name.ilike(f"%{name}%"))
        if status:
            query = query.where(BlueprintORM.ApprovalState == status)
        if author:
            query = query.where(UserORM.Username.ilike(f"%{author}%"))

        rows = self._session.scalars(query.order_by(
            BlueprintORM.UpdatedAt.desc())).all()
        return [orm_to_blueprint_domain(row) for row in rows]
