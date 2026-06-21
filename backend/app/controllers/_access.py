"""Shared controller helpers for authentication/authorization checks."""

from __future__ import annotations

from flask import current_app

from app.services.access_control_service import AccessControlService
from app.services.session_service import SessionService


def build_access_control() -> AccessControlService:
    timeout_minutes = int(current_app.config.get(
        "SESSION_TIMEOUT_MINUTES", 1440))
    cookie_name = str(current_app.config.get(
        "AUTH_SESSION_COOKIE_NAME", "bee_session"))
    session_backend = str(current_app.config.get("SESSION_BACKEND", "memory"))
    redis_url = current_app.config.get("REDIS_URL")
    return AccessControlService(
        session_service=SessionService(
            timeout_minutes=timeout_minutes,
            backend=session_backend,
            redis_url=redis_url if isinstance(redis_url, str) and redis_url else None,
        ),
        cookie_name=cookie_name,
    )


def require_staff(access_control: AccessControlService, context):
    if context is None:
        return access_control.unauthenticated_response()
    if not AccessControlService.is_staff(context):
        return access_control.forbidden_response("Moderator or admin role required")
    return None
