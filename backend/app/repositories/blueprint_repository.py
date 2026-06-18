"""SQLAlchemy-backed repository for Blueprint aggregate."""

from __future__ import annotations

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.domain.models.blueprint import Blueprint
from app.infrastructure.database.enums import ApprovalState as BlueprintApprovalState
from app.infrastructure.database.orm.blueprint_orm import BlueprintORM
from app.infrastructure.database.orm.favorite_blueprint_orm import FavoriteBlueprintORM
from app.repositories.mappers.blueprint_mapper import orm_to_blueprint_domain


class BlueprintRepository:
    """Blueprint persistence operations using RFC-002 ORM mappings."""

    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _to_domain(row: BlueprintORM) -> Blueprint:
        return orm_to_blueprint_domain(row)

    def add(self, blueprint: Blueprint) -> Blueprint:
        approval_state = (
            blueprint.ApprovalState
            if isinstance(blueprint.ApprovalState, BlueprintApprovalState)
            else BlueprintApprovalState(blueprint.ApprovalState)
        )
        row = BlueprintORM(
            UserID=blueprint.UserID,
            Name=blueprint.Name,
            Description=blueprint.Description,
            Indicators=blueprint.Indicators,
            Features=blueprint.Features,
            Architecture=blueprint.Architecture,
            ApprovalState=approval_state,
            SubmittedAt=blueprint.SubmittedAt,
            Version=blueprint.Version,
            ParentID=blueprint.ParentID,
            CreatedAt=blueprint.CreatedAt,
            UpdatedAt=blueprint.UpdatedAt,
        )
        self._session.add(row)
        self._session.flush()
        return self._to_domain(row)

    def get_by_id(self, blueprint_id: int) -> Blueprint | None:
        row = self._session.get(BlueprintORM, blueprint_id)
        return self._to_domain(row) if row else None

    def list_by_parent(self, parent_id: int) -> list[Blueprint]:
        rows = self._session.scalars(
            select(BlueprintORM)
            .where(BlueprintORM.ParentID == parent_id)
            .order_by(BlueprintORM.Version.asc())
        ).all()
        return [self._to_domain(row) for row in rows]

    def update(self, blueprint_id: int, patch: dict[str, object]) -> Blueprint | None:
        row = self._session.get(BlueprintORM, blueprint_id)
        if row is None:
            return None

        if "name" in patch:
            row.Name = str(patch["name"])
        if "description" in patch:
            row.Description = patch["description"]
        if "indicators" in patch:
            row.Indicators = patch["indicators"]
        if "features" in patch:
            row.Features = patch["features"]
        if "architecture" in patch:
            row.Architecture = patch["architecture"]
        if "approval_state" in patch:
            row.ApprovalState = BlueprintApprovalState(
                str(patch["approval_state"]))
        if "submitted_at" in patch:
            row.SubmittedAt = patch["submitted_at"]
        if "version" in patch:
            row.Version = int(patch["version"])
        if "parent_id" in patch:
            row.ParentID = patch["parent_id"]
        if "updated_at" in patch:
            row.UpdatedAt = patch["updated_at"]

        self._session.flush()
        return self._to_domain(row)

    def list_by_user(self, user_id: int) -> list[Blueprint]:
        rows = self._session.scalars(
            select(BlueprintORM)
            .where(BlueprintORM.UserID == user_id)
            .order_by(BlueprintORM.BlueprintID)
        ).all()
        return [self._to_domain(row) for row in rows]

    def list_by_approval_state(self, approval_state: str) -> list[Blueprint]:
        rows = self._session.scalars(
            select(BlueprintORM)
            .where(BlueprintORM.ApprovalState == approval_state)
            .order_by(BlueprintORM.UpdatedAt.desc())
        ).all()
        return [self._to_domain(row) for row in rows]

    def list_owned_filtered(
        self,
        user_id: int,
        *,
        name: str | None = None,
        status: str | None = None,
        include_favorited_for_user_id: int | None = None,
    ) -> list[tuple[Blueprint, bool]]:
        if include_favorited_for_user_id is None:
            include_favorited_for_user_id = user_id

        query = (
            select(BlueprintORM, FavoriteBlueprintORM.BlueprintID)
            .outerjoin(
                FavoriteBlueprintORM,
                and_(
                    FavoriteBlueprintORM.BlueprintID == BlueprintORM.BlueprintID,
                    FavoriteBlueprintORM.UserID == include_favorited_for_user_id,
                ),
            )
            .where(BlueprintORM.UserID == user_id)
        )

        if name:
            query = query.where(BlueprintORM.Name.ilike(f"%{name}%"))
        if status:
            query = query.where(BlueprintORM.ApprovalState == status)

        rows = self._session.execute(
            query.order_by(BlueprintORM.UpdatedAt.desc())
        ).all()
        return [
            (self._to_domain(blueprint_row), favorite_blueprint_id is not None)
            for blueprint_row, favorite_blueprint_id in rows
        ]
