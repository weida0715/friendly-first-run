"""Shared controller helpers for authentication/authorization checks."""

from __future__ import annotations

from flask import current_app

from app.services.access_control_service import AccessControlService
from app.services.session_service import SessionService


def build_access_control() -> AccessControlService:
    timeout_minutes = int(current_app.config.get(
        "SESSION_TIMEOUT_MINUTES", 1440))
    cookie_name = str(current_app.config.get(
        "SESSION_COOKIE_NAME", "bee_session"))
    return AccessControlService(
        session_service=SessionService(timeout_minutes=timeout_minutes),
        cookie_name=cookie_name,
    )


def require_staff(access_control: AccessControlService, context):
    if context is None:
        return access_control.unauthenticated_response()
    if not AccessControlService.is_staff(context):
        return access_control.forbidden_response("Moderator or admin role required")
    return None
