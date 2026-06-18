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
from app.services.password_service import hash_password, verify_password


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    app = create_app("testing")
    return app.test_client()


def test_register_success_hashes_password_and_returns_safe_user() -> None:
    client = _client()

    response = client.post(
        "/api/auth/register",
        json={
            "name": "Alice",
            "username": "alice01",
            "email": "alice@example.com",
            "password": "securepass",
        },
    )

    assert response.status_code == 201
    body = response.get_json()
    assert body["ok"] is True
    assert body["data"]["user"]["username"] == "alice01"
    assert "password" not in body["data"]["user"]

    from app.repositories.unit_of_work import UnitOfWork
    with UnitOfWork() as uow:
        user = uow.users.get_by_email("alice@example.com")
        assert user is not None
        assert user.password_hash != "securepass"
        assert verify_password("securepass", user.password_hash)


def test_register_rejects_duplicate_username() -> None:
    client = _client()
    payload = {
        "name": "Alice",
        "username": "alice01",
        "email": "alice@example.com",
        "password": "securepass",
    }
    client.post("/api/auth/register", json=payload)
    response = client.post(
        "/api/auth/register",
        json={**payload, "email": "alice2@example.com"},
    )

    assert response.status_code == 409


def test_register_rejects_duplicate_email() -> None:
    client = _client()
    payload = {
        "name": "Alice",
        "username": "alice01",
        "email": "alice@example.com",
        "password": "securepass",
    }
    client.post("/api/auth/register", json=payload)
    response = client.post(
        "/api/auth/register",
        json={**payload, "username": "alice02"},
    )

    assert response.status_code == 409


def test_register_rejects_invalid_username() -> None:
    client = _client()
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Alice",
            "username": "ALICE",
            "email": "alice@example.com",
            "password": "securepass",
        },
    )
    assert response.status_code == 400


def test_login_success_sets_session_cookie() -> None:
    client = _client()
    client.post(
        "/api/auth/register",
        json={
            "name": "Alice",
            "username": "alice01",
            "email": "alice@example.com",
            "password": "securepass",
        },
    )

    response = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "securepass"},
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["ok"] is True
    assert body["data"]["user"]["username"] == "alice01"
    assert "Set-Cookie" in response.headers
    assert "bee_session=" in response.headers["Set-Cookie"]


def test_login_rejects_invalid_credentials() -> None:
    client = _client()
    response = client.post(
        "/api/auth/login",
        json={"email": "missing@example.com", "password": "securepass"},
    )
    assert response.status_code == 401


def test_login_rejects_disabled_user() -> None:
    from datetime import datetime, timezone

    from app.domain.models.user import User
    from app.repositories.unit_of_work import UnitOfWork

    client = _client()
    now = datetime.now(timezone.utc)
    with UnitOfWork() as uow:
        uow.users.add(
            User(
                user_id=None,
                username="disabled1",
                email="disabled@example.com",
                password_hash=hash_password("securepass"),
                name="Disabled User",
                role="User",
                status="Disabled",
                created_at=now,
                updated_at=now,
            )
        )

    response = client.post(
        "/api/auth/login",
        json={"email": "disabled@example.com", "password": "securepass"},
    )
    assert response.status_code == 403


def test_me_returns_authenticated_user_with_valid_session_cookie() -> None:
    client = _client()
    client.post(
        "/api/auth/register",
        json={
            "name": "Alice",
            "username": "alice01",
            "email": "alice@example.com",
            "password": "securepass",
        },
    )

    login_response = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "securepass"},
    )
    cookie = login_response.headers.get("Set-Cookie")
    assert cookie is not None

    me_response = client.get("/api/auth/me", headers={"Cookie": cookie})
    assert me_response.status_code == 200
    body = me_response.get_json()
    assert body["ok"] is True
    assert body["data"]["user"]["username"] == "alice01"


def test_me_rejects_when_missing_session_cookie() -> None:
    client = _client()
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_logout_invalidates_session_and_me_after_logout_is_unauthorized() -> None:
    client = _client()
    client.post(
        "/api/auth/register",
        json={
            "name": "Alice",
            "username": "alice01",
            "email": "alice@example.com",
            "password": "securepass",
        },
    )

    login_response = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "securepass"},
    )
    cookie = login_response.headers.get("Set-Cookie")
    assert cookie is not None

    logout_response = client.post(
        "/api/auth/logout", headers={"Cookie": cookie})
    assert logout_response.status_code == 200
    assert "Set-Cookie" in logout_response.headers

    me_response = client.get("/api/auth/me", headers={"Cookie": cookie})
    assert me_response.status_code == 401


def test_logout_is_idempotent_without_session_cookie() -> None:
    client = _client()
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
