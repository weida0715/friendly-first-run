"""Shared mapper for Blueprint ORM/domain conversion."""

from __future__ import annotations

from app.domain.models.blueprint import Blueprint
from app.infrastructure.database.orm.blueprint_orm import BlueprintORM


def orm_to_blueprint_domain(row: BlueprintORM) -> Blueprint:
    approval_state = (
        row.ApprovalState.value
        if hasattr(row.ApprovalState, "value")
        else row.ApprovalState
    )
    return Blueprint(
        blueprint_id=row.BlueprintID,
        user_id=row.UserID,
        name=row.Name,
        description=row.Description,
        indicators=row.Indicators,
        features=row.Features,
        architecture=row.Architecture,
        approval_state=approval_state,
        submitted_at=row.SubmittedAt,
        version=row.Version,
        parent_id=row.ParentID,
        created_at=row.CreatedAt,
        updated_at=row.UpdatedAt,
    )
