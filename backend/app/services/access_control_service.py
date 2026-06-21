"""AccessControlService for authentication and authorization context."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from flask import Request

from app.responses import error_response
from app.repositories.unit_of_work import UnitOfWork
from app.services.session_service import SessionService


@dataclass(slots=True)
class AuthContext:
    user_id: int
    username: str
    email: str
    name: str
    role: str
    status: str
    session_id: str


class AccessControlService:
    """Centralizes authorization and visibility checks."""

    ROLE_RANK = {
        "User": 1,
        "Moderator": 2,
        "Admin": 3,
    }

    def __init__(self, session_service: SessionService, cookie_name: str) -> None:
        self._session_service = session_service
        self._cookie_name = cookie_name

    @staticmethod
    def _normalize_role(role: str | None) -> str:
        if not role:
            return "User"
        if hasattr(role, "value"):
            role = role.value
        value = role.strip().lower()
        if value in {"admin", "administrator"}:
            return "Admin"
        if value in {"moderator", "mod"}:
            return "Moderator"
        return "User"

    @classmethod
    def _role_rank(cls, role: str | None) -> int:
        normalized = cls._normalize_role(role)
        return cls.ROLE_RANK[normalized]

    def get_authenticated_context(self, request: Request) -> AuthContext | None:
        session_record = self._session_service.resolve_session_from_cookie(
            request=request,
            cookie_name=self._cookie_name,
        )
        if session_record is None:
            return None

        with UnitOfWork() as uow:
            user = uow.users.get_by_id(session_record.user_id)

        if user is None or user.status != "Enabled":
            self._session_service.destroy_server_session(
                session_record.session_id)
            return None

        return AuthContext(
            user_id=user.user_id,
            username=user.username,
            email=user.email,
            name=user.name,
            role=user.role,
            status=user.status,
            session_id=session_record.session_id,
        )

    def is_authenticated(self, request: Request) -> bool:
        return self.get_authenticated_context(request) is not None

    def require_authenticated(self, request: Request) -> AuthContext | tuple[Any, int]:
        context = self.get_authenticated_context(request)
        if context is None:
            return self.unauthenticated_response()
        return context

    @staticmethod
    def unauthenticated_response():
        return error_response("Authentication required", 401, code="UNAUTHENTICATED")

    @staticmethod
    def forbidden_response(message: str = "Forbidden"):
        return error_response(message, 403, code="FORBIDDEN")

    @classmethod
    def is_staff(cls, actor: AuthContext) -> bool:
        return cls._role_rank(actor.role) >= 2

    @classmethod
    def is_moderator(cls, actor: AuthContext) -> bool:
        return cls._normalize_role(actor.role) == "Moderator"

    @classmethod
    def is_admin(cls, actor: AuthContext) -> bool:
        return cls._normalize_role(actor.role) == "Admin"

    @staticmethod
    def is_owner(actor: AuthContext, target_user_id: int) -> bool:
        return actor.user_id == target_user_id

    @classmethod
    def can_access_profile(cls, actor: AuthContext, target_user_id: int) -> bool:
        return cls.is_owner(actor, target_user_id) or cls.is_staff(actor)

    @classmethod
    def can_manage_user(cls, actor: AuthContext, target: Any) -> bool:
        actor_role = cls._normalize_role(actor.role)
        target_role = cls._normalize_role(
            getattr(target, "Role", None) or getattr(target, "role", None))

        if actor_role == "Admin":
            return True

        if actor_role == "Moderator":
            return target_role == "User"

        return False

    @classmethod
    def can_assign_role(cls, actor: AuthContext, new_role: str) -> bool:
        actor_role = cls._normalize_role(actor.role)
        requested_role = cls._normalize_role(new_role)

        if actor_role == "Admin":
            return True

        if actor_role == "Moderator":
            return requested_role == "User"

        return False
