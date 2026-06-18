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
from app.domain.models.blueprint import Blueprint as BlueprintEntity
from app.repositories.unit_of_work import UnitOfWork


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    app = create_app("testing")
    return app.test_client()


def _register_and_login(client, *, username: str = "bpowner1", email: str = "bpowner@example.com"):
    client.post(
        "/api/auth/register",
        json={
            "name": "Blueprint Owner",
            "username": username,
            "email": email,
            "password": "securepass",
        },
    )
    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": "securepass"},
    )
    raw_cookie = login.headers.get("Set-Cookie")
    return raw_cookie.split(";", 1)[0] if raw_cookie else None


def _valid_payload() -> dict:
    return {
        "metadata": {"name": "Momentum Blueprint", "description": "desc"},
        "indicators": {"selected": ["rsi", "macd"]},
        "architecture": {
            "reference": "logreg_binary",
            "safety_profile": "balanced",
            "settings": {"max_iter": 200},
        },
        "parameter_ranges": {
            "learning_rate": {"min": 0.001, "max": 0.1},
            "window_size": {"min": 10, "max": 50},
        },
    }


def test_create_draft_blueprint_persists_with_defaults() -> None:
    client = _client()
    cookie = _register_and_login(client)

    response = client.post(
        "/api/blueprints/", json=_valid_payload(), headers={"Cookie": cookie})
    assert response.status_code == 201
    body = response.get_json()["data"]["blueprint"]
    assert body["approvalState"] == "Draft"
    assert body["version"] == 1
    assert body["detailPath"].startswith("/blueprints/")

    with UnitOfWork() as uow:
        created = uow.blueprints.get_by_id(body["id"])
        assert created is not None
        assert created.approval_state == "Draft"
        assert created.submitted_at is None
        assert created.parent_id is None
        assert created.features == {"indicator_outputs": ["rsi", "macd"]}


def test_create_draft_blueprint_validation_errors_are_field_level() -> None:
    client = _client()
    cookie = _register_and_login(client)

    bad_payload = _valid_payload()
    bad_payload["metadata"]["name"] = ""
    bad_payload["indicators"]["selected"] = ["unsupported_indicator"]

    response = client.post(
        "/api/blueprints/", json=bad_payload, headers={"Cookie": cookie})
    assert response.status_code == 400
    errors = response.get_json()["data"]["errors"]
    assert "metadata.name" in errors
    assert "indicators.selected" in errors


def test_detail_access_and_favorite_unfavorite_persistence() -> None:
    client = _client()
    client.post("/api/auth/register", json={"name": "Owner", "username": "owner009",
                "email": "owner009@example.com", "password": "securepass"})
    client.post("/api/auth/register", json={"name": "Viewer", "username": "viewer09",
                "email": "viewer09@example.com", "password": "securepass"})
    owner_cookie = _register_and_login(
        client, username="owner009", email="owner009@example.com")

    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner009@example.com")
        now = owner.created_at
        private_bp = uow.blueprints.add(BlueprintEntity(
            None, owner.user_id, "Private", None, {}, {}, {}, "Draft", None, 1, None, now, now))
        public_bp = uow.blueprints.add(BlueprintEntity(
            None, owner.user_id, "Public", None, {}, {}, {}, "Approved", now, 1, None, now, now))

    owner_detail = client.get(
        f"/api/blueprints/{private_bp.blueprint_id}", headers={"Cookie": owner_cookie})
    assert owner_detail.status_code == 200

    login_viewer = client.post(
        "/api/auth/login", json={"email": "viewer09@example.com", "password": "securepass"})
    viewer_cookie = login_viewer.headers.get("Set-Cookie").split(";", 1)[0]

    viewer_private = client.get(
        f"/api/blueprints/{private_bp.blueprint_id}", headers={"Cookie": viewer_cookie})
    assert viewer_private.status_code == 403

    viewer_public = client.get(
        f"/api/blueprints/{public_bp.blueprint_id}", headers={"Cookie": viewer_cookie})
    assert viewer_public.status_code == 200

    fav = client.post(
        f"/api/blueprints/{public_bp.blueprint_id}/favorite", headers={"Cookie": viewer_cookie})
    assert fav.status_code == 200
    with UnitOfWork() as uow:
        viewer = uow.users.get_by_email("viewer09@example.com")
        assert uow.favorite_blueprints.exists(
            viewer.user_id, public_bp.blueprint_id)

    unfav = client.delete(
        f"/api/blueprints/{public_bp.blueprint_id}/favorite", headers={"Cookie": viewer_cookie})
    assert unfav.status_code == 200
    with UnitOfWork() as uow:
        viewer = uow.users.get_by_email("viewer09@example.com")
        assert not uow.favorite_blueprints.exists(
            viewer.user_id, public_bp.blueprint_id)


def test_staff_can_view_pending_blueprint_detail_for_moderation() -> None:
    client = _client()
    client.post("/api/auth/register", json={
        "name": "Owner",
        "username": "owner101",
        "email": "owner101@example.com",
        "password": "securepass",
    })
    client.post("/api/auth/register", json={
        "name": "Moderator",
        "username": "mod101",
        "email": "mod101@example.com",
        "password": "securepass",
    })

    owner_cookie = _register_and_login(
        client, username="owner101", email="owner101@example.com")

    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner101@example.com")
        moderator = uow.users.get_by_email("mod101@example.com")
        moderator = uow.users.update_role(moderator.user_id, "Moderator")
        now = owner.created_at
        pending_bp = uow.blueprints.add(BlueprintEntity(
            None, owner.user_id, "Pending BP", None, {}, {}, {}, "Pending", now, 1, None, now, now))

    owner_detail = client.get(
        f"/api/blueprints/{pending_bp.blueprint_id}", headers={"Cookie": owner_cookie})
    assert owner_detail.status_code == 200

    login_mod = client.post(
        "/api/auth/login", json={"email": "mod101@example.com", "password": "securepass"})
    mod_cookie = login_mod.headers.get("Set-Cookie").split(";", 1)[0]

    mod_detail = client.get(
        f"/api/blueprints/{pending_bp.blueprint_id}", headers={"Cookie": mod_cookie})
    assert mod_detail.status_code == 200

    # Non-owner non-staff remains blocked
    client.post("/api/auth/register", json={
        "name": "Viewer",
        "username": "viewer101",
        "email": "viewer101@example.com",
        "password": "securepass",
    })
    login_viewer = client.post(
        "/api/auth/login", json={"email": "viewer101@example.com", "password": "securepass"})
    viewer_cookie = login_viewer.headers.get("Set-Cookie").split(";", 1)[0]
    viewer_detail = client.get(
        f"/api/blueprints/{pending_bp.blueprint_id}", headers={"Cookie": viewer_cookie})
    assert viewer_detail.status_code == 403
