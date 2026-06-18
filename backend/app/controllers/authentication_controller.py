"""Authentication routes for registration and session lifecycle."""

from __future__ import annotations

from datetime import datetime, timezone
import re

from flask import Blueprint, current_app, request
from flask_wtf.csrf import generate_csrf
from sqlalchemy.exc import IntegrityError

from app.domain.models.user import User
from app.repositories.unit_of_work import UnitOfWork
from app.responses import error_response, ok_response
from app.services.access_control_service import AccessControlService
from app.services.password_service import hash_password, verify_password
from app.services.session_service import SessionService

blueprint = Blueprint("authentication", __name__)

USERNAME_PATTERN = re.compile(r"^[a-z0-9]+$")
MIN_USERNAME_LENGTH = 3
MAX_USERNAME_LENGTH = 12
MIN_PASSWORD_LENGTH = 8
SESSION_COOKIE_NAME = "bee_session"


class AuthenticationController:
    """Coordinates registration, login, logout, and identity use cases."""

    @staticmethod
    def _get_session_config() -> dict[str, object]:
        timeout_minutes = int(current_app.config.get(
            "SESSION_TIMEOUT_MINUTES", 1440))
        cookie_name = str(current_app.config.get(
            "SESSION_COOKIE_NAME", SESSION_COOKIE_NAME))
        cookie_samesite = str(current_app.config.get(
            "SESSION_COOKIE_SAMESITE", "Lax"))
        cookie_secure = bool(current_app.config.get(
            "SESSION_COOKIE_SECURE", False))
        return {
            "timeout_minutes": timeout_minutes,
            "cookie_name": cookie_name,
            "cookie_samesite": cookie_samesite,
            "cookie_secure": cookie_secure,
        }

    @staticmethod
    def _validate_registration_payload(payload: dict) -> tuple[bool, str | None]:
        name = str(payload.get("name", "")).strip()
        username = str(payload.get("username", "")).strip()
        email = str(payload.get("email", "")).strip().lower()
        password = str(payload.get("password", ""))

        if not name:
            return False, "Name is required"
        if not username:
            return False, "Username is required"
        if len(username) < MIN_USERNAME_LENGTH or len(username) > MAX_USERNAME_LENGTH:
            return False, f"Username must be between {MIN_USERNAME_LENGTH} and {MAX_USERNAME_LENGTH} characters"
        if not USERNAME_PATTERN.fullmatch(username):
            return False, "Username must contain lowercase letters and numbers only"
        if not email or "@" not in email:
            return False, "A valid email is required"
        if len(password) < MIN_PASSWORD_LENGTH:
            return False, f"Password must be at least {MIN_PASSWORD_LENGTH} characters"

        return True, None

    @staticmethod
    def _validate_login_payload(payload: dict) -> tuple[bool, str | None]:
        email = str(payload.get("email", "")).strip().lower()
        password = str(payload.get("password", ""))

        if not email or "@" not in email:
            return False, "A valid email is required"
        if not password:
            return False, "Password is required"

        return True, None


@blueprint.get("/")
def index():
    return ok_response({"controller": "AuthenticationController", "implemented": False})


@blueprint.get("/csrf")
def csrf_token():
    return ok_response({"data": {"csrfToken": generate_csrf()}})


@blueprint.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return error_response("Invalid registration payload", 400, code="INVALID_REGISTRATION")

    is_valid, message = AuthenticationController._validate_registration_payload(
        payload)
    if not is_valid:
        return error_response(message or "Invalid registration payload", 400, code="INVALID_REGISTRATION")

    name = str(payload["name"]).strip()
    username = str(payload["username"]).strip().lower()
    email = str(payload["email"]).strip().lower()
    password = str(payload["password"])

    try:
        with UnitOfWork() as uow:
            if uow.users.get_by_username(username) is not None:
                return error_response("Username is already taken", 409, code="USERNAME_EXISTS")

            if uow.users.get_by_email(email) is not None:
                return error_response("Email is already registered", 409, code="EMAIL_EXISTS")

            now = datetime.now(timezone.utc)
            created_user = uow.users.add(
                User(
                    user_id=None,
                    username=username,
                    email=email,
                    password_hash=hash_password(password),
                    name=name,
                    role="User",
                    status="Enabled",
                    created_at=now,
                    updated_at=now,
                )
            )
    except IntegrityError:
        return error_response("Username or email already exists", 409, code="USER_CONFLICT")

    return ok_response(
        {
            "data": {
                "user": {
                    "id": created_user.user_id,
                    "username": created_user.username,
                    "email": created_user.email,
                    "name": created_user.name,
                    "role": created_user.role,
                    "status": created_user.status,
                    "createdAt": created_user.created_at.isoformat(),
                }
            }
        },
        status_code=201,
    )


@blueprint.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return error_response("Invalid login payload", 400, code="INVALID_LOGIN_PAYLOAD")

    is_valid, message = AuthenticationController._validate_login_payload(
        payload)
    if not is_valid:
        return error_response(message or "Invalid login payload", 400, code="INVALID_LOGIN_PAYLOAD")

    email = str(payload["email"]).strip().lower()
    password = str(payload["password"])

    with UnitOfWork() as uow:
        user = uow.users.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            return error_response("Invalid credentials", 401, code="INVALID_CREDENTIALS")

        if user.status != "Enabled":
            return error_response("Account disabled", 403, code="ACCOUNT_DISABLED")

    session_config = AuthenticationController._get_session_config()
    timeout_minutes = int(session_config["timeout_minutes"])
    cookie_name = str(session_config["cookie_name"])
    cookie_samesite = str(session_config["cookie_samesite"])
    cookie_secure = bool(session_config["cookie_secure"])
    session_service = SessionService(timeout_minutes=timeout_minutes)
    session_record = session_service.create_server_session(
        user_id=user.user_id, role=user.role)

    response, status_code = ok_response(
        {
            "data": {
                "user": {
                    "id": user.user_id,
                    "username": user.username,
                    "email": user.email,
                    "name": user.name,
                    "role": user.role,
                    "status": user.status,
                }
            }
        },
        status_code=200,
    )
    response.set_cookie(
        key=cookie_name,
        value=session_record.session_id,
        max_age=timeout_minutes * 60,
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        path="/",
    )
    return response, status_code


@blueprint.get("/me")
def me():
    session_config = AuthenticationController._get_session_config()
    timeout_minutes = int(session_config["timeout_minutes"])
    cookie_name = str(session_config["cookie_name"])
    session_service = SessionService(timeout_minutes=timeout_minutes)
    access_control_service = AccessControlService(
        session_service=session_service,
        cookie_name=cookie_name,
    )

    context = access_control_service.get_authenticated_context(request)
    if context is None:
        return error_response("Authentication required", 401, code="UNAUTHENTICATED")

    return ok_response(
        {
            "data": {
                "user": {
                    "id": context.user_id,
                    "username": context.username,
                    "email": context.email,
                    "name": context.name,
                    "role": context.role,
                    "status": context.status,
                }
            }
        },
        status_code=200,
    )


@blueprint.post("/logout")
def logout():
    session_config = AuthenticationController._get_session_config()
    timeout_minutes = int(session_config["timeout_minutes"])
    cookie_name = str(session_config["cookie_name"])
    cookie_samesite = str(session_config["cookie_samesite"])
    cookie_secure = bool(session_config["cookie_secure"])

    session_service = SessionService(timeout_minutes=timeout_minutes)
    session_id = request.cookies.get(cookie_name)
    if session_id:
        session_service.destroy_server_session(session_id)

    response, status_code = ok_response(
        {"data": {"loggedOut": True}}, status_code=200)
    response.delete_cookie(
        key=cookie_name,
        path="/",
        secure=cookie_secure,
        httponly=True,
        samesite=cookie_samesite,
    )
    return response, status_code
