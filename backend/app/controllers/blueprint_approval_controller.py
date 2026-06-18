"""Blueprint approval request routes."""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, request

from app.controllers._access import build_access_control, require_staff
from app.repositories.unit_of_work import UnitOfWork
from app.responses import error_response, ok_response
from app.services.access_control_service import AccessControlService

blueprint = Blueprint("blueprint_approval", __name__)


class BlueprintApprovalController:
    """Coordinates Blueprint moderation and approval use cases."""

    @staticmethod
    def _access_control() -> AccessControlService:
        return build_access_control()

    @staticmethod
    def _require_staff(access_control: AccessControlService, context):
        return require_staff(access_control, context)


@blueprint.post("/<int:blueprint_id>/request-approval")
def request_blueprint_approval(blueprint_id: int):
    access_control = BlueprintApprovalController._access_control()
    context = access_control.get_authenticated_context(request)
    if context is None:
        return access_control.unauthenticated_response()

    now = datetime.now(timezone.utc)
    with UnitOfWork() as uow:
        blueprint_item = uow.blueprints.get_by_id(blueprint_id)
        if blueprint_item is None:
            return error_response("Blueprint not found", 404, code="BLUEPRINT_NOT_FOUND")
        if blueprint_item.user_id != context.user_id:
            return access_control.forbidden_response("Only owner can request approval")
        if blueprint_item.approval_state != "Draft":
            return error_response(
                "Only Draft blueprints can request approval",
                409,
                code="BLUEPRINT_INVALID_TRANSITION",
            )

        updated = uow.blueprints.update(
            blueprint_id,
            {
                "approval_state": "Pending",
                "submitted_at": now,
                "updated_at": now,
            },
        )

    return ok_response(
        {
            "data": {
                "blueprint": {
                    "id": updated.blueprint_id,
                    "approvalState": updated.approval_state,
                    "submittedAt": updated.submitted_at.isoformat() if updated.submitted_at else None,
                    "version": updated.version,
                }
            }
        }
    )


@blueprint.get("/moderation/queue")
def moderation_queue():
    access_control = BlueprintApprovalController._access_control()
    context = access_control.get_authenticated_context(request)
    denied = BlueprintApprovalController._require_staff(
        access_control, context)
    if denied is not None:
        return denied

    with UnitOfWork() as uow:
        pending_items = uow.blueprints.list_by_approval_state("Pending")

    return ok_response({
        "data": {
            "items": [
                {
                    "id": bp.blueprint_id,
                    "name": bp.name,
                    "approvalState": bp.approval_state,
                    "version": bp.version,
                    "submittedAt": bp.submitted_at.isoformat() if bp.submitted_at else None,
                    "updatedAt": bp.updated_at.isoformat(),
                }
                for bp in pending_items
            ]
        }
    })


def _moderate_blueprint(blueprint_id: int, target_state: str):
    access_control = BlueprintApprovalController._access_control()
    context = access_control.get_authenticated_context(request)
    denied = BlueprintApprovalController._require_staff(
        access_control, context)
    if denied is not None:
        return denied

    with UnitOfWork() as uow:
        blueprint_item = uow.blueprints.get_by_id(blueprint_id)
        if blueprint_item is None:
            return error_response("Blueprint not found", 404, code="BLUEPRINT_NOT_FOUND")
        if (
            target_state in {"Approved", "Rejected"}
            and blueprint_item.approval_state != "Pending"
        ) or (
            target_state == "Disapproved"
            and blueprint_item.approval_state != "Approved"
        ):
            return error_response(
                f"Cannot transition to {target_state} from {blueprint_item.approval_state}",
                409,
                code="BLUEPRINT_INVALID_TRANSITION",
            )

        updated = uow.blueprints.update(
            blueprint_id,
            {
                "approval_state": target_state,
                "updated_at": datetime.now(timezone.utc),
            },
        )

    return ok_response({"data": {"blueprint": {
        "id": updated.blueprint_id,
        "approvalState": updated.approval_state,
        "version": updated.version,
    }}})


@blueprint.post("/<int:blueprint_id>/approve")
def approve_blueprint(blueprint_id: int):
    return _moderate_blueprint(blueprint_id, "Approved")


@blueprint.post("/<int:blueprint_id>/reject")
def reject_blueprint(blueprint_id: int):
    return _moderate_blueprint(blueprint_id, "Rejected")


@blueprint.post("/<int:blueprint_id>/disapprove")
def disapprove_blueprint(blueprint_id: int):
    return _moderate_blueprint(blueprint_id, "Disapproved")
