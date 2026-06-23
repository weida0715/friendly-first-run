from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.services.session_service import SessionRecord, SessionService


def test_create_server_session_purges_expired_sessions() -> None:
    SessionService._store.clear()
    now = datetime.now(timezone.utc)
    SessionService._store["expired"] = SessionRecord(
        session_id="expired",
        user_id=1,
        role="User",
        created_at=now - timedelta(hours=2),
        expires_at=now - timedelta(minutes=1),
    )

    service = SessionService(timeout_minutes=60)
    created = service.create_server_session(user_id=2, role="User")

    assert "expired" not in SessionService._store
    assert created.session_id in SessionService._store


def test_zero_timeout_memory_session_does_not_expire() -> None:
    SessionService._store.clear()
    service = SessionService(timeout_minutes=0)

    created = service.create_server_session(user_id=2, role="User")
    resolved = service.get_server_session(created.session_id)

    assert created.expires_at is None
    assert resolved is not None
