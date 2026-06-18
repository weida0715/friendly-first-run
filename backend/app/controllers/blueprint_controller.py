"""Blueprint routes for draft persistence and detail mutations."""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, request

from app.domain.models.blueprint import Blueprint as BlueprintEntity
from app.domain.models.favorite_blueprint import FavoriteBlueprint
from app.controllers._access import build_access_control
from app.repositories.unit_of_work import UnitOfWork
from app.responses import error_response, ok_response, validation_error_response
from app.services.access_control_service import AccessControlService
from app.services.versioning_service import VersioningService
from app.validators.blueprint_validator import BlueprintValidator
from app.factories.architecture_factory import ArchitectureFactory
from app.factories.blueprint_factory import BlueprintFactory
from app.factories.indicator_factory import IndicatorFactory
from app.factories.target_strategy_factory import TargetStrategyFactory

blueprint = Blueprint("blueprints", __name__)


class BlueprintController:
    """Coordinates Blueprint detail and mutation use cases."""

    @staticmethod
    def _access_control() -> AccessControlService:
        return build_access_control()

    @staticmethod
    def _can_access_blueprint(
        blueprint_item: BlueprintEntity,
        user_id: int | None,
        *,
        is_staff: bool = False,
    ) -> bool:
        is_owner = user_id is not None and user_id == blueprint_item.user_id
        is_public = blueprint_item.approval_state == "Approved"
        return is_owner or is_public or is_staff


@blueprint.get("/")
def index():
    return ok_response({"controller": "BlueprintController", "implemented": False})


@blueprint.get("/<int:blueprint_id>")
def get_blueprint_detail(blueprint_id: int):
    access_control = BlueprintController._access_control()
    context = access_control.get_authenticated_context(request)

    with UnitOfWork() as uow:
        blueprint_item = uow.blueprints.get_by_id(blueprint_id)
        if blueprint_item is None:
            return error_response("Blueprint not found", 404, code="BLUEPRINT_NOT_FOUND")

        is_owner = context is not None and context.user_id == blueprint_item.user_id
        is_staff = bool(
            context is not None and AccessControlService.is_staff(context))
        if not BlueprintController._can_access_blueprint(
            blueprint_item,
            context.user_id if context else None,
            is_staff=is_staff,
        ):
            return access_control.forbidden_response("Blueprint is not visible")

        owner = uow.users.get_by_id(blueprint_item.user_id)
        parent = uow.blueprints.get_by_id(
            blueprint_item.parent_id) if blueprint_item.parent_id else None
        children = uow.blueprints.list_by_parent(
            blueprint_item.blueprint_id or 0)
        is_favorited = bool(
            context is not None
            and blueprint_item.blueprint_id is not None
            and uow.favorite_blueprints.exists(context.user_id, blueprint_item.blueprint_id)
        )

    return ok_response(
        {
            "data": {
                "blueprint": {
                    "id": blueprint_item.blueprint_id,
                    "metadata": {
                        "name": blueprint_item.name,
                        "description": blueprint_item.description,
                        "createdAt": blueprint_item.created_at.isoformat(),
                        "updatedAt": blueprint_item.updated_at.isoformat(),
                    },
                    "indicators": blueprint_item.indicators,
                    "architecture": blueprint_item.architecture,
                    "approvalState": blueprint_item.approval_state,
                    "version": blueprint_item.version,
                    "lineage": {
                        "parent": (
                            {
                                "id": parent.blueprint_id,
                                "name": parent.name,
                                "version": parent.version,
                            }
                            if parent is not None
                            else None
                        ),
                        "children": [
                            {
                                "id": child.blueprint_id,
                                "name": child.name,
                                "version": child.version,
                                "approvalState": child.approval_state,
                            }
                            for child in children
                        ],
                    },
                    "owner": (
                        {
                            "id": owner.user_id,
                            "username": owner.username,
                            "name": owner.name,
                        }
                        if owner is not None
                        else None
                    ),
                    "viewer": {
                        "isAuthenticated": context is not None,
                        "isOwner": is_owner,
                        "isStaff": bool(context is not None and AccessControlService.is_staff(context)),
                        "role": context.role if context is not None else None,
                        "isFavorited": is_favorited,
                    },
                }
            }
        }
    )


@blueprint.post("/<int:blueprint_id>/favorite")
def favorite_blueprint(blueprint_id: int):
    access_control = BlueprintController._access_control()
    context = access_control.get_authenticated_context(request)
    if context is None:
        return access_control.unauthenticated_response()

    with UnitOfWork() as uow:
        blueprint_item = uow.blueprints.get_by_id(blueprint_id)
        if blueprint_item is None:
            return error_response("Blueprint not found", 404, code="BLUEPRINT_NOT_FOUND")
        if not BlueprintController._can_access_blueprint(
            blueprint_item,
            context.user_id,
            is_staff=AccessControlService.is_staff(context),
        ):
            return access_control.forbidden_response("Blueprint is not visible")

        if not uow.favorite_blueprints.exists(context.user_id, blueprint_id):
            uow.favorite_blueprints.add(
                FavoriteBlueprint(
                    user_id=context.user_id,
                    blueprint_id=blueprint_id,
                    created_at=datetime.now(timezone.utc),
                )
            )

    return ok_response({"data": {"favorited": True}})


@blueprint.delete("/<int:blueprint_id>/favorite")
def unfavorite_blueprint(blueprint_id: int):
    access_control = BlueprintController._access_control()
    context = access_control.get_authenticated_context(request)
    if context is None:
        return access_control.unauthenticated_response()

    with UnitOfWork() as uow:
        blueprint_item = uow.blueprints.get_by_id(blueprint_id)
        if blueprint_item is None:
            return error_response("Blueprint not found", 404, code="BLUEPRINT_NOT_FOUND")
        if not BlueprintController._can_access_blueprint(
            blueprint_item,
            context.user_id,
            is_staff=AccessControlService.is_staff(context),
        ):
            return access_control.forbidden_response("Blueprint is not visible")

        uow.favorite_blueprints.remove(context.user_id, blueprint_id)

    return ok_response({"data": {"favorited": False}})


@blueprint.get("/metadata")
def get_blueprint_metadata():
    return ok_response({
        "data": {
            "architectures": ArchitectureFactory.list_metadata(),
            "indicators": IndicatorFactory.list_metadata(),
            "targets": TargetStrategyFactory.list_metadata(),
        }
    })


@blueprint.post("/")
def create_draft_blueprint():
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return error_response("Invalid blueprint payload", 400, code="INVALID_BLUEPRINT_PAYLOAD")

    access_control = BlueprintController._access_control()
    context = access_control.get_authenticated_context(request)
    if context is None:
        return access_control.unauthenticated_response()

    validation = BlueprintValidator.validate(payload)
    if not validation.ok:
        return validation_error_response(validation.errors)

    metadata = payload.get("metadata") or {}
    normalized = BlueprintFactory.normalize_payload(payload)
    now = datetime.now(timezone.utc)

    draft = BlueprintEntity(
        blueprint_id=None,
        user_id=context.user_id,
        name=str(metadata.get("name", "")).strip(),
        description=metadata.get("description"),
        indicators=normalized["indicators"],
        features=normalized["features"],
        architecture=normalized["architecture"],
        approval_state="Draft",
        submitted_at=None,
        version=1,
        parent_id=None,
        created_at=now,
        updated_at=now,
    )

    with UnitOfWork() as uow:
        created = uow.blueprints.add(draft)

    return ok_response(
        {
            "data": {
                "blueprint": {
                    "id": created.blueprint_id,
                    "version": created.version,
                    "approvalState": created.approval_state,
                    "detailPath": f"/blueprints/{created.blueprint_id}",
                }
            }
        },
        status_code=201,
    )


@blueprint.patch("/<int:blueprint_id>")
def update_blueprint(blueprint_id: int):
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return error_response("Invalid blueprint payload", 400, code="INVALID_BLUEPRINT_PAYLOAD")

    access_control = BlueprintController._access_control()
    context = access_control.get_authenticated_context(request)
    if context is None:
        return access_control.unauthenticated_response()

    validation = BlueprintValidator.validate(payload)
    if not validation.ok:
        return validation_error_response(validation.errors)

    with UnitOfWork() as uow:
        existing = uow.blueprints.get_by_id(blueprint_id)
        if existing is None:
            return error_response("Blueprint not found", 404, code="BLUEPRINT_NOT_FOUND")
        if existing.user_id != context.user_id:
            return access_control.forbidden_response("Only owner can edit blueprint")

        versioning = VersioningService(uow.blueprints)
        try:
            saved = versioning.save_blueprint_edit(
                existing, payload, actor_user_id=context.user_id)
        except PermissionError as exc:
            return access_control.forbidden_response(str(exc))

    return ok_response(
        {
            "data": {
                "blueprint": {
                    "id": saved.blueprint_id,
                    "version": saved.version,
                    "approvalState": saved.approval_state,
                    "parentId": saved.parent_id,
                }
            }
        }
    )
