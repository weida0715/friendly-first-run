"""System-level backend routes."""

from __future__ import annotations

from flask import Blueprint, current_app, request, Response
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError

from app.controllers._access import build_access_control
from app.controllers._services import build_queue_service
from app.domain.models.system_event import SystemEvent
from app.repositories.unit_of_work import UnitOfWork
from app.responses import error_response, ok_response, validation_error_response
from app.services.access_control_service import AccessControlService
from app.services.queue_service import QueueUnavailableError
from app.services.system_settings_service import SystemSettingsService

blueprint = Blueprint("system", __name__)


class SystemController:
    """Coordinates system health and management use cases."""

    @staticmethod
    def record_event(*, scope: str, action: str, actor=None, target_type: str | None = None, target_id: str | None = None, message: str) -> None:
        try:
            with UnitOfWork() as uow:
                if uow.system_events is None:
                    return
                uow.system_events.add(SystemEvent(
                    system_event_id=None,
                    scope=scope,
                    action=action,
                    actor_id=getattr(actor, "user_id", None),
                    actor_username=getattr(actor, "username", None),
                    target_type=target_type,
                    target_id=target_id,
                    message=message,
                    created_at=datetime.now(timezone.utc),
                ))
        except SQLAlchemyError:
            return


# Backward-compatible factory name used by tests/monkeypatches.
def _build_queue_service():
    return build_queue_service()


@blueprint.get("/health")
def health_check():
    """Return a lightweight backend health response."""

    return ok_response(
        {
            "service": current_app.config.get("APP_NAME", "BEE"),
            "version": current_app.config.get("APP_VERSION", "0.0.0"),
            "environment": current_app.config.get("ENV_NAME", "development"),
            "status": "healthy",
        }
    )


@blueprint.get("/system/queue/active")
def get_active_queue():
    access_control = build_access_control()
    actor = access_control.require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return actor
    if not AccessControlService.is_admin(actor):
        return access_control.forbidden_response("Admin role required")

    try:
        snapshot = _build_queue_service().get_active_queue_snapshot()
    except QueueUnavailableError:
        return error_response("Queue service unavailable", 503, code="QUEUE_UNAVAILABLE")

    return ok_response({"data": {"queue": snapshot}})


def _require_admin():
    access_control = build_access_control()
    actor = access_control.require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return access_control, actor, actor
    if not AccessControlService.is_admin(actor):
        return access_control, actor, access_control.forbidden_response("Admin role required")
    return access_control, actor, None


@blueprint.get("/system/settings")
def get_system_settings():
    _, _, error = _require_admin()
    if error is not None:
        return error
    service = SystemSettingsService()
    return ok_response({"data": {"settings": service.get_settings(), "metadata": service.metadata()}})


@blueprint.patch("/system/settings")
def update_system_settings():
    access_control, actor, error = _require_admin()
    if error is not None:
        return error
    payload = request.get_json(silent=True) or {}
    settings, errors = SystemSettingsService().update_settings(payload)
    if errors:
        return validation_error_response(errors, status_code=422)
    SystemController.record_event(scope="system", action="System settings updated", actor=actor, message="Operational settings changed")
    return ok_response({"data": {"settings": settings}})


@blueprint.get("/system/events")
def list_system_events():
    access_control = build_access_control()
    actor = access_control.require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return actor
    if not AccessControlService.is_admin(actor):
        return access_control.forbidden_response("Admin role required")

    scope = str(request.args.get("scope", "")).strip() or None
    try:
        limit = max(1, min(200, int(request.args.get("limit", 50))))
    except ValueError:
        return error_response("Invalid limit", 400, code="INVALID_LIMIT")

    try:
        with UnitOfWork() as uow:
            items = uow.system_events.list_recent(scope=scope, limit=limit) if uow.system_events else []
    except SQLAlchemyError:
        items = []

    return ok_response({
        "data": {
            "items": [{
                "id": event.system_event_id,
                "scope": event.scope,
                "action": event.action,
                "actor": event.actor_username or "system",
                "targetType": event.target_type,
                "targetId": event.target_id,
                "message": event.message,
                "createdAt": event.created_at.isoformat(),
            } for event in items]
        }
    })


@blueprint.get("/system/events/download")
def download_system_events():
    access_control = build_access_control()
    actor = access_control.require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return actor
    if not AccessControlService.is_admin(actor):
        return access_control.forbidden_response("Admin role required")

    scope = str(request.args.get("scope", "")).strip() or None
    try:
        limit = max(1, min(100000, int(request.args.get("limit", 100000))))
    except ValueError:
        return error_response("Invalid limit", 400, code="INVALID_LIMIT")

    try:
        with UnitOfWork() as uow:
            items = uow.system_events.list_recent(scope=scope, limit=limit) if uow.system_events else []
    except SQLAlchemyError:
        items = []

    lines = [
        f"[{event.created_at.isoformat()}] {event.scope} :: {event.actor_username or 'system'} :: {event.action} :: {event.message}"
        for event in items
    ]
    body = "\n".join(lines) + ("\n" if lines else "")
    response = Response(body, mimetype="text/plain")
    response.headers["Content-Disposition"] = 'attachment; filename="system-terminal-log.txt"'
    return response
