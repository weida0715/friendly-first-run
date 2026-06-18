"""System-level backend routes."""

from __future__ import annotations

from flask import Blueprint, current_app, request

from app.controllers._access import build_access_control
from app.controllers._services import build_queue_service
from app.responses import error_response, ok_response, validation_error_response
from app.services.access_control_service import AccessControlService
from app.services.queue_service import QueueUnavailableError
from app.services.system_settings_service import SystemSettingsService

blueprint = Blueprint("system", __name__)


class SystemController:
    """Coordinates system health and management use cases."""

    pass


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
    _, _, error = _require_admin()
    if error is not None:
        return error
    payload = request.get_json(silent=True) or {}
    settings, errors = SystemSettingsService().update_settings(payload)
    if errors:
        return validation_error_response(errors, status_code=422)
    return ok_response({"data": {"settings": settings}})
