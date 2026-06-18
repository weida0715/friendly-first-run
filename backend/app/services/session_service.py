"""SessionService implementation for server-managed session lifecycle."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import secrets
from threading import Lock
from flask import Request


@dataclass(slots=True)
class SessionRecord:
    session_id: str
    user_id: int
    role: str
    created_at: datetime
    expires_at: datetime


class SessionService:
    """Centralizes session lifecycle behavior."""

    _store: dict[str, SessionRecord] = {}
    _lock = Lock()

    def __init__(self, timeout_minutes: int = 1440) -> None:
        self._timeout_minutes = timeout_minutes

    @classmethod
    def _purge_expired_locked(cls, now: datetime) -> None:
        expired_session_ids = [
            session_id
            for session_id, record in cls._store.items()
            if record.expires_at <= now
        ]
        for session_id in expired_session_ids:
            cls._store.pop(session_id, None)

    def create_server_session(self, user_id: int, role: str) -> SessionRecord:
        now = datetime.now(timezone.utc)
        session_id = secrets.token_urlsafe(32)
        record = SessionRecord(
            session_id=session_id,
            user_id=user_id,
            role=role,
            created_at=now,
            expires_at=now + timedelta(minutes=self._timeout_minutes),
        )

        with self._lock:
            self._purge_expired_locked(now)
            self._store[session_id] = record

        return record

    def get_server_session(self, session_id: str) -> SessionRecord | None:
        with self._lock:
            record = self._store.get(session_id)
            if record is None:
                return None
            if record.expires_at <= datetime.now(timezone.utc):
                del self._store[session_id]
                return None
            return record

    def destroy_server_session(self, session_id: str) -> None:
        with self._lock:
            self._store.pop(session_id, None)

    def resolve_session_from_cookie(self, request: Request, cookie_name: str) -> SessionRecord | None:
        session_id = request.cookies.get(cookie_name)
        if not session_id:
            return None
        return self.get_server_session(session_id)
