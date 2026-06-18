"""Blueprints library listing routes."""

from __future__ import annotations

from flask import Blueprint, request

from app.controllers._access import build_access_control
from app.repositories.unit_of_work import UnitOfWork
from app.responses import ok_response
from app.services.access_control_service import AccessControlService

blueprint = Blueprint("blueprints_library", __name__)


class BlueprintsLibraryController:
    """Coordinates Blueprint library use cases."""

    @staticmethod
    def _access_control() -> AccessControlService:
        return build_access_control()

    @staticmethod
    def _to_item(bp, *, is_favorited: bool = False):
        return {
            "id": bp.blueprint_id,
            "name": bp.name,
            "approvalState": bp.approval_state,
            "version": bp.version,
            "ownerId": bp.user_id,
            "updatedAt": bp.updated_at.isoformat(),
            "isFavorited": is_favorited,
        }


@blueprint.get("/owned")
def list_owned_blueprints():
    ac = BlueprintsLibraryController._access_control()
    ctx = ac.get_authenticated_context(request)
    if ctx is None:
        return ac.unauthenticated_response()

    name = request.args.get("name")
    status = request.args.get("status")
    with UnitOfWork() as uow:
        items = uow.blueprints.list_owned_filtered(
            ctx.user_id,
            name=name,
            status=status,
            include_favorited_for_user_id=ctx.user_id,
        )

    return ok_response({"data": {"items": [
        BlueprintsLibraryController._to_item(i, is_favorited=is_favorited)
        for i, is_favorited in items
    ]}})


@blueprint.get("/favorited")
def list_favorited_blueprints():
    ac = BlueprintsLibraryController._access_control()
    ctx = ac.get_authenticated_context(request)
    if ctx is None:
        return ac.unauthenticated_response()

    name = request.args.get("name")
    status = request.args.get("status")
    author = request.args.get("author")
    with UnitOfWork() as uow:
        items = uow.favorite_blueprints.list_favorited_blueprints_for_user(
            ctx.user_id,
            name=name,
            status=status,
            author=author,
        )

    return ok_response({"data": {"items": [BlueprintsLibraryController._to_item(i, is_favorited=True) for i in items]}})
