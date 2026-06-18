"""User route placeholders for RFC-001."""

from __future__ import annotations

from flask import Blueprint, current_app, request
from datetime import datetime, timezone
import re

from app.domain.models.user import User
from app.repositories.unit_of_work import UnitOfWork
from app.responses import error_response, ok_response
from app.services.access_control_service import AccessControlService
from app.services.password_service import hash_password
from app.services.session_service import SessionService
from app.infrastructure.database.enums import UserRole

blueprint = Blueprint("users", __name__)


class UserController:
    """Coordinates user profile and user management use cases."""

    @staticmethod
    def _build_access_control_service() -> AccessControlService:
        timeout_minutes = int(current_app.config.get(
            "SESSION_TIMEOUT_MINUTES", 1440))
        cookie_name = str(current_app.config.get(
            "SESSION_COOKIE_NAME", "bee_session"))
        return AccessControlService(
            session_service=SessionService(timeout_minutes=timeout_minutes),
            cookie_name=cookie_name,
        )

    @staticmethod
    def _serialize_user_summary(user) -> dict:
        return {
            "id": user.user_id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "status": user.status,
        }

    USERNAME_PATTERN = re.compile(r"^[a-z0-9]+$")
    MIN_USERNAME_LENGTH = 3
    MAX_USERNAME_LENGTH = 12
    MIN_PASSWORD_LENGTH = 8

    @classmethod
    def _validate_create_user_payload(cls, payload: dict) -> tuple[bool, str | None]:
        name = str(payload.get("name", "")).strip()
        username = str(payload.get("username", "")).strip().lower()
        email = str(payload.get("email", "")).strip().lower()
        password = str(payload.get("password", ""))

        if not name:
            return False, "Name is required"
        if not username:
            return False, "Username is required"
        if len(username) < cls.MIN_USERNAME_LENGTH or len(username) > cls.MAX_USERNAME_LENGTH:
            return False, f"Username must be between {cls.MIN_USERNAME_LENGTH} and {cls.MAX_USERNAME_LENGTH} characters"
        if not cls.USERNAME_PATTERN.fullmatch(username):
            return False, "Username must contain lowercase letters and numbers only"
        if not email or "@" not in email:
            return False, "A valid email is required"
        if len(password) < cls.MIN_PASSWORD_LENGTH:
            return False, f"Password must be at least {cls.MIN_PASSWORD_LENGTH} characters"

        return True, None

    @staticmethod
    def _require_staff(access: AccessControlService, auth):
        if not access.is_staff(auth):
            return access.forbidden_response("Staff access required")
        return None


@blueprint.get("")
@blueprint.get("/")
def list_users():
    access = UserController._build_access_control_service()
    auth = access.require_authenticated(request)
    if not hasattr(auth, "user_id"):
        return auth

    if not access.is_staff(auth):
        return access.forbidden_response("Staff access required")

    query = request.args.get("q")
    role = request.args.get("role")
    status = request.args.get("status")

    try:
        page = max(1, int(request.args.get("page", 1)))
        page_size = max(1, min(100, int(request.args.get("pageSize", 20))))
    except ValueError:
        return error_response("Invalid pagination parameters", 400, code="INVALID_PAGINATION")

    offset = (page - 1) * page_size

    with UnitOfWork() as uow:
        total = uow.users.count_users(query=query, role=role, status=status)
        users = uow.users.search_users(
            query=query,
            role=role,
            status=status,
            limit=page_size,
            offset=offset,
        )

    total_pages = (total + page_size - 1) // page_size if total else 0
    return ok_response(
        {
            "data": {
                "items": [UserController._serialize_user_summary(user) for user in users],
                "page": page,
                "pageSize": page_size,
                "total": total,
                "totalPages": total_pages,
            }
        }
    )


@blueprint.get("/me")
def my_profile():
    access = UserController._build_access_control_service()
    auth = access.require_authenticated(request)
    if not hasattr(auth, "user_id"):
        return auth

    with UnitOfWork() as uow:
        user = uow.users.get_by_id(auth.user_id)

    if user is None:
        return error_response("User not found", 404, code="USER_NOT_FOUND")

    return ok_response({"data": {"user": UserController._serialize_user_summary(user)}})


@blueprint.get("/<int:user_id>")
def profile(user_id: int):
    access = UserController._build_access_control_service()
    auth = access.require_authenticated(request)
    if not hasattr(auth, "user_id"):
        return auth

    if not access.can_access_profile(auth, user_id):
        return access.forbidden_response("You do not have access to this profile")

    with UnitOfWork() as uow:
        user = uow.users.get_by_id(user_id)

    if user is None:
        return error_response("User not found", 404, code="USER_NOT_FOUND")

    return ok_response({"data": {"user": UserController._serialize_user_summary(user)}})


@blueprint.post("")
@blueprint.post("/")
def create_user():
    access = UserController._build_access_control_service()
    auth = access.require_authenticated(request)
    if not hasattr(auth, "user_id"):
        return auth
    staff_error = UserController._require_staff(access, auth)
    if staff_error:
        return staff_error

    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip().lower()
    email = str(payload.get("email", "")).strip().lower()
    name = str(payload.get("name", "")).strip()
    password = str(payload.get("password", ""))
    raw_role = str(payload.get("role", "User")).strip() or "User"
    normalized_role = AccessControlService._normalize_role(raw_role)

    is_valid, message = UserController._validate_create_user_payload(payload)
    if not is_valid:
        return error_response(message or "Invalid user payload", 400, code="INVALID_USER_PAYLOAD")

    if not access.can_assign_role(auth, normalized_role):
        return access.forbidden_response("Insufficient permission to assign role")

    with UnitOfWork() as uow:
        if uow.users.get_by_username(username) is not None:
            return error_response("Username is already taken", 409, code="USERNAME_EXISTS")
        if uow.users.get_by_email(email) is not None:
            return error_response("Email is already registered", 409, code="EMAIL_EXISTS")

        now = datetime.now(timezone.utc)
        created = uow.users.add(User(
            user_id=None,
            username=username,
            email=email,
            password_hash=hash_password(password),
            name=name,
            role=normalized_role,
            status="Enabled",
            created_at=now,
            updated_at=now,
        ))

    return ok_response({"data": {"user": UserController._serialize_user_summary(created)}}, status_code=201)


@blueprint.patch("/<int:user_id>/status")
def update_user_status(user_id: int):
    access = UserController._build_access_control_service()
    auth = access.require_authenticated(request)
    if not hasattr(auth, "user_id"):
        return auth
    staff_error = UserController._require_staff(access, auth)
    if staff_error:
        return staff_error

    payload = request.get_json(silent=True) or {}
    status = str(payload.get("status", "")).strip()
    if status not in {"Enabled", "Disabled"}:
        return error_response("Invalid status", 400, code="INVALID_STATUS")

    with UnitOfWork() as uow:
        target = uow.users.get_by_id(user_id)
        if target is None:
            return error_response("User not found", 404, code="USER_NOT_FOUND")
        target_role = AccessControlService._normalize_role(target.role)
        if access.is_moderator(auth) and target_role != "User":
            return access.forbidden_response("Moderators can only manage normal users")
        if not access.can_manage_user(auth, target):
            return access.forbidden_response("You cannot manage this user")
        updated = uow.users.update_status(user_id, status)

    return ok_response({"data": {"user": UserController._serialize_user_summary(updated)}})


@blueprint.patch("/<int:user_id>/password")
def reset_user_password(user_id: int):
    access = UserController._build_access_control_service()
    auth = access.require_authenticated(request)
    if not hasattr(auth, "user_id"):
        return auth
    staff_error = UserController._require_staff(access, auth)
    if staff_error:
        return staff_error

    payload = request.get_json(silent=True) or {}
    new_password = str(payload.get("password", ""))
    if len(new_password) < 8:
        return error_response("Password must be at least 8 characters", 400, code="INVALID_PASSWORD")

    with UnitOfWork() as uow:
        target = uow.users.get_by_id(user_id)
        if target is None:
            return error_response("User not found", 404, code="USER_NOT_FOUND")
        target_role = AccessControlService._normalize_role(target.role)
        if access.is_moderator(auth) and target_role != "User":
            return access.forbidden_response("Moderators can only manage normal users")
        if not access.can_manage_user(auth, target):
            return access.forbidden_response("You cannot manage this user")
        updated = uow.users.update_password_hash(
            user_id, hash_password(new_password))

    return ok_response({"data": {"user": UserController._serialize_user_summary(updated)}})


@blueprint.patch("/<int:user_id>/role")
def update_user_role(user_id: int):
    access = UserController._build_access_control_service()
    auth = access.require_authenticated(request)
    if not hasattr(auth, "user_id"):
        return auth
    if not access.is_admin(auth):
        return access.forbidden_response("Admin access required")

    payload = request.get_json(silent=True) or {}
    role = str(payload.get("role", "")).strip()
    if role not in {"User", "Moderator", "Admin"}:
        return error_response("Invalid role", 400, code="INVALID_ROLE")

    with UnitOfWork() as uow:
        target = uow.users.get_by_id(user_id)
        if target is None:
            return error_response("User not found", 404, code="USER_NOT_FOUND")
        updated = uow.users.update_role(user_id, role)

    return ok_response({"data": {"user": UserController._serialize_user_summary(updated)}})


@blueprint.delete("/<int:user_id>")
def delete_user(user_id: int):
    access = UserController._build_access_control_service()
    auth = access.require_authenticated(request)
    if not hasattr(auth, "user_id"):
        return auth
    if not access.is_admin(auth):
        return access.forbidden_response("Admin access required")

    with UnitOfWork() as uow:
        target = uow.users.get_by_id(user_id)
        if target is None:
            return error_response("User not found", 404, code="USER_NOT_FOUND")
        uow.users.delete_by_id(user_id)

    return ok_response({"data": {"deleted": True, "userId": user_id}})
