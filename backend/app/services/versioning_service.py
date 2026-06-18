"""Blueprint immutable versioning service."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.domain.models.blueprint import Blueprint
from app.repositories.blueprint_repository import BlueprintRepository


class VersioningService:
    """Centralizes immutable lifecycle rules for Blueprint edits."""

    def __init__(self, repository: BlueprintRepository) -> None:
        self._repository = repository

    def save_blueprint_edit(
        self,
        existing: Blueprint,
        updates: dict[str, Any],
        *,
        actor_user_id: int,
    ) -> Blueprint:
        if existing.user_id != actor_user_id:
            raise PermissionError(
                "Only the blueprint owner can edit this blueprint")

        metadata = updates.get("metadata") or {}
        name = str(metadata.get("name", existing.name)).strip()
        description = metadata.get("description", existing.description)
        indicators = updates.get("indicators", existing.indicators)
        architecture = updates.get("architecture", existing.architecture)
        features = updates.get("features", existing.features)

        now = datetime.now(timezone.utc)

        if existing.approval_state == "Draft" and existing.submitted_at is None:
            updated = self._repository.update(
                existing.blueprint_id or 0,
                {
                    "name": name,
                    "description": description,
                    "indicators": indicators,
                    "features": features,
                    "architecture": architecture,
                    "updated_at": now,
                },
            )
            if updated is None:
                raise RuntimeError("Blueprint update failed")
            return updated

        copy = Blueprint(
            blueprint_id=None,
            user_id=existing.user_id,
            name=name,
            description=description,
            indicators=indicators,
            features=features,
            architecture=architecture,
            approval_state="Draft",
            submitted_at=None,
            version=existing.version + 1,
            parent_id=existing.blueprint_id,
            created_at=now,
            updated_at=now,
        )
        return self._repository.add(copy)
