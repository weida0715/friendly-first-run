from __future__ import annotations

from datetime import datetime, timezone

from app import create_app
from app.domain.models.user import User
from app.infrastructure.database.base import Base
from app.infrastructure.database.session import configure_engine, get_engine
from app.repositories.unit_of_work import UnitOfWork
from app.services.password_service import hash_password


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    return create_app("development").test_client()


def _seed_user() -> None:
    now = datetime.now(timezone.utc)
    with UnitOfWork() as uow:
        uow.users.add(
            User(
                user_id=None,
                username="alice01",
                email="alice@example.com",
                password_hash=hash_password("securepass"),
                name="Alice",
                role="User",
                status="Enabled",
                created_at=now,
                updated_at=now,
            )
        )


def test_missing_csrf_is_rejected_with_json_error() -> None:
    client = _client()

    response = client.post("/api/auth/logout")

    assert response.status_code == 400
    body = response.get_json()
    assert body["ok"] is False
    assert body["error"]["code"] == "CSRF_FAILED"


def test_valid_csrf_allows_state_change() -> None:
    client = _client()
    _seed_user()

    csrf_response = client.get("/api/auth/csrf")
    csrf_token = csrf_response.get_json()["data"]["csrfToken"]

    login = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "securepass"},
        headers={"X-CSRFToken": csrf_token},
    )
    assert login.status_code == 200

    csrf_response = client.get("/api/auth/csrf")
    csrf_token = csrf_response.get_json()["data"]["csrfToken"]

    logout = client.post(
        "/api/auth/logout",
        headers={"X-CSRFToken": csrf_token},
    )
    assert logout.status_code == 200
