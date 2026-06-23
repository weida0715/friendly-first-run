from __future__ import annotations

from app import create_app
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import (  # noqa: F401
    blueprint_orm,
    btcusdt_kline_orm,
    experiment_log_orm,
    experiment_orm,
    favorite_blueprint_orm,
    favorite_model_orm,
    model_orm,
    user_orm,
)
from app.infrastructure.database.session import configure_engine, get_engine


class _FakeQueueService:
    def get_active_queue_snapshot(self):
        return {
            "queue_depth": 2,
            "running_jobs": 1,
            "active_jobs_total": 3,
            "active_jobs": [
                {"job_id": "job-1", "state": "queued",
                    "position": 0, "queue_name": "experiments"},
                {"job_id": "job-2", "state": "running",
                    "position": None, "queue_name": "experiments"},
            ],
        }


class _FakeSettingsService:
    def __init__(self):
        self._settings = {
            "queue_job_timeout_seconds": 7200,
            "session_timeout_minutes": 1440,
            "max_requested_permutations": 250,
            "max_round_log_rows": 10000,
            "max_concurrent_jobs": 10,
        }

    def get_settings(self):
        return dict(self._settings)

    def metadata(self):
        return []

    def update_settings(self, payload):
        self._settings.update({k: int(v) for k, v in payload.items()})
        return dict(self._settings), {}


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    return create_app("testing").test_client()


def test_admin_can_view_active_queue_snapshot() -> None:
    from app.controllers import system_controller as module
    from app.repositories.unit_of_work import UnitOfWork
    from app.infrastructure.database.orm.user_orm import UserORM

    client = _client()
    client.post("/api/auth/register", json={"name": "Admin", "username": "adminqueue",
                "email": "adminqueue@example.com", "password": "securepass"})
    with UnitOfWork() as uow:
        admin = uow.users.get_by_email("adminqueue@example.com")
        uow.session.get(UserORM, admin.user_id).Role = "Admin"
        uow.session.flush()
    client.post("/api/auth/login",
                json={"email": "adminqueue@example.com", "password": "securepass"})

    module._build_queue_service = lambda: _FakeQueueService()

    response = client.get("/api/system/queue/active")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["ok"] is True
    assert payload["data"]["queue"]["queue_depth"] == 2


def test_non_admin_gets_403_for_active_queue_snapshot() -> None:
    client = _client()
    client.post("/api/auth/register", json={"name": "User", "username": "userqueue",
                "email": "userqueue@example.com", "password": "securepass"})
    client.post("/api/auth/login",
                json={"email": "userqueue@example.com", "password": "securepass"})

    response = client.get("/api/system/queue/active")
    assert response.status_code == 403


def test_admin_can_view_and_update_system_settings() -> None:
    from app.controllers import system_controller as module
    from app.repositories.unit_of_work import UnitOfWork
    from app.domain.models.user import User
    from datetime import datetime, timezone

    class _Actor:
        user_id = 1
        role = "Admin"

    class _FakeAccessControl:
        def require_authenticated(self, request):
            return _Actor()

        def forbidden_response(self, message):
            raise AssertionError(message)

    client = _client()
    with UnitOfWork() as uow:
        uow.users.add(User(
            user_id=1,
            username="adminsettings",
            email="adminsettings@example.com",
            password_hash="hash",
            name="Admin",
            role="Admin",
            status="Enabled",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        ))

    module.build_access_control = lambda: _FakeAccessControl()
    module.SystemSettingsService = lambda: _FakeSettingsService()

    response = client.get("/api/system/settings")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["data"]["settings"]["queue_job_timeout_seconds"] == 7200
    assert payload["data"]["settings"]["session_timeout_minutes"] == 1440

    update = client.patch("/api/system/settings",
                          json={"queue_job_timeout_seconds": 9000, "session_timeout_minutes": 0, "max_concurrent_jobs": 5})
    assert update.status_code == 200
    settings = update.get_json()["data"]["settings"]
    assert settings["queue_job_timeout_seconds"] == 9000
    assert settings["session_timeout_minutes"] == 0
    assert settings["max_concurrent_jobs"] == 5


def test_admin_can_view_system_events() -> None:
    from app.controllers import system_controller as module
    from app.repositories.unit_of_work import UnitOfWork
    from app.domain.models.system_event import SystemEvent
    from app.domain.models.user import User
    from datetime import datetime, timezone

    class _Actor:
        user_id = 1
        username = "admin"
        role = "Admin"

    class _FakeAccessControl:
        def require_authenticated(self, request):
            return _Actor()

        def forbidden_response(self, message):
            raise AssertionError(message)

    client = _client()
    with UnitOfWork() as uow:
        uow.users.add(User(
            user_id=1,
            username="adminevents",
            email="adminevents@example.com",
            password_hash="hash",
            name="Admin",
            role="Admin",
            status="Enabled",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        ))
        uow.system_events.add(SystemEvent(
            system_event_id=None,
            scope="system",
            action="User logged in",
            actor_id=1,
            actor_username="admin",
            target_type="Session",
            target_id="sess-1",
            message="admin logged in",
            created_at=datetime.now(timezone.utc),
        ))

    module.build_access_control = lambda: _FakeAccessControl()

    response = client.get("/api/system/events?limit=10")
    assert response.status_code == 200
    items = response.get_json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["action"] == "User logged in"


def test_api_requests_emit_persisted_system_trace() -> None:
    from app.controllers import system_controller as module
    from app.repositories.unit_of_work import UnitOfWork
    from app.domain.models.user import User
    from datetime import datetime, timezone

    client = _client()
    with UnitOfWork() as uow:
        uow.users.add(User(
            user_id=None,
            username="traceuser",
            email="traceuser@example.com",
            password_hash="hash",
            name="Trace User",
            role="Admin",
            status="Enabled",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        ))

    client.post("/api/auth/login", json={"email": "traceuser@example.com", "password": "wrong"})

    with UnitOfWork() as uow:
        events = uow.system_events.list_recent(limit=20) if uow.system_events else []
    assert any("api/auth/login" in event.action or "api/auth/login" in event.message for event in events)


def test_system_events_default_to_global_feed() -> None:
    from app.repositories.unit_of_work import UnitOfWork
    from app.domain.models.system_event import SystemEvent
    from datetime import datetime, timezone

    client = _client()
    with UnitOfWork() as uow:
        uow.system_events.add(SystemEvent(
            system_event_id=None,
            scope="auth",
            action="User logged in",
            actor_id=1,
            actor_username="admin",
            target_type="Session",
            target_id="sess-1",
            message="admin logged in",
            created_at=datetime.now(timezone.utc),
        ))
        uow.system_events.add(SystemEvent(
            system_event_id=None,
            scope="user",
            action="User created",
            actor_id=1,
            actor_username="admin",
            target_type="User",
            target_id="2",
            message="created alice",
            created_at=datetime.now(timezone.utc),
        ))

    from app.controllers import system_controller as module
    class _Actor:
        user_id = 1
        role = "Admin"
    class _FakeAccessControl:
        def require_authenticated(self, request):
            return _Actor()
        def forbidden_response(self, message):
            raise AssertionError(message)
    module.build_access_control = lambda: _FakeAccessControl()

    response = client.get("/api/system/events?limit=10")
    assert response.status_code == 200
    items = response.get_json()["data"]["items"]
    assert {item["scope"] for item in items} == {"auth", "user"}


def test_admin_can_download_system_events() -> None:
    from app.controllers import system_controller as module
    from app.repositories.unit_of_work import UnitOfWork
    from app.domain.models.system_event import SystemEvent
    from datetime import datetime, timezone

    class _Actor:
        user_id = 1
        role = "Admin"

    class _FakeAccessControl:
        def require_authenticated(self, request):
            return _Actor()

        def forbidden_response(self, message):
            raise AssertionError(message)

    client = _client()
    with UnitOfWork() as uow:
        uow.system_events.add(SystemEvent(
            system_event_id=None,
            scope="auth",
            action="User logged in",
            actor_id=1,
            actor_username="admin",
            target_type="Session",
            target_id="sess-1",
            message="admin logged in",
            created_at=datetime.now(timezone.utc),
        ))

    module.build_access_control = lambda: _FakeAccessControl()
    response = client.get("/api/system/events/download")
    assert response.status_code == 200
    assert response.headers["Content-Disposition"].startswith('attachment; filename="system-terminal-log.txt"')
    assert "User logged in" in response.get_data(as_text=True)
