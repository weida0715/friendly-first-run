"""SessionService implementation for server-managed session lifecycle."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import json
import secrets
from threading import Lock
from flask import Request
from redis import Redis


@dataclass(slots=True)
class SessionRecord:
    session_id: str
    user_id: int
    role: str
    created_at: datetime
    expires_at: datetime | None


class SessionService:
    """Centralizes session lifecycle behavior."""

    _store: dict[str, SessionRecord] = {}
    _lock = Lock()

    def __init__(self, timeout_minutes: int = 1440, backend: str = "memory", redis_url: str | None = None, cookie_name: str = "bee_session") -> None:
        self._timeout_minutes = timeout_minutes
        self._backend = str(backend or "memory").lower()
        self._redis_url = redis_url
        self._cookie_name = cookie_name
        self._redis = Redis.from_url(redis_url) if self._backend == "redis" and redis_url else None

    def _key(self, session_id: str) -> str:
        return f"bee:session:{session_id}"

    @classmethod
    def _purge_expired_locked(cls, now: datetime) -> None:
        expired_session_ids = [
            session_id
            for session_id, record in cls._store.items()
            if record.expires_at is not None and record.expires_at <= now
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
            expires_at=None if self._timeout_minutes == 0 else now + timedelta(minutes=self._timeout_minutes),
        )

        if self._backend == "redis" and self._redis is not None:
            payload = json.dumps({
                "session_id": record.session_id,
                "user_id": record.user_id,
                "role": record.role,
                "created_at": record.created_at.isoformat(),
                "expires_at": record.expires_at.isoformat() if record.expires_at else None,
            })
            if self._timeout_minutes == 0:
                self._redis.set(self._key(session_id), payload)
            else:
                ttl = max(60, self._timeout_minutes * 60)
                self._redis.setex(self._key(session_id), ttl, payload)
        else:
            with self._lock:
                self._purge_expired_locked(now)
                self._store[session_id] = record

        return record

    def get_server_session(self, session_id: str) -> SessionRecord | None:
        if self._backend == "redis" and self._redis is not None:
            raw = self._redis.get(self._key(session_id))
            if not raw:
                return None
            try:
                payload = json.loads(raw)
                return SessionRecord(
                    session_id=str(payload["session_id"]),
                    user_id=int(payload["user_id"]),
                    role=str(payload["role"]),
                    created_at=datetime.fromisoformat(str(payload["created_at"])),
                    expires_at=datetime.fromisoformat(str(payload["expires_at"])) if payload.get("expires_at") else None,
                )
            except Exception:
                return None
        with self._lock:
            record = self._store.get(session_id)
            if record is None:
                return None
            if record.expires_at is not None and record.expires_at <= datetime.now(timezone.utc):
                del self._store[session_id]
                return None
            return record

    def destroy_server_session(self, session_id: str) -> None:
        if self._backend == "redis" and self._redis is not None:
            self._redis.delete(self._key(session_id))
            return
        with self._lock:
            self._store.pop(session_id, None)

    def resolve_session_from_cookie(self, request: Request, cookie_name: str) -> SessionRecord | None:
        session_id = request.cookies.get(cookie_name)
        if not session_id:
            return None
        return self.get_server_session(session_id)
