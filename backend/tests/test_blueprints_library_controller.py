from __future__ import annotations

from datetime import datetime

from app import create_app
from app.domain.models.blueprint import Blueprint
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
from app.domain.models.favorite_blueprint import FavoriteBlueprint
from app.repositories.unit_of_work import UnitOfWork


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    return create_app("testing").test_client()


def _register(client, username: str, email: str):
    client.post(
        "/api/auth/register",
        json={
            "name": username,
            "username": username,
            "email": email,
            "password": "securepass",
        },
    )


def _login_cookie(client, email: str):
    response = client.post(
        "/api/auth/login", json={"email": email, "password": "securepass"})
    raw_cookie = response.headers.get("Set-Cookie")
    return raw_cookie.split(";", 1)[0] if raw_cookie else None


def test_library_owned_and_favorited_listing_and_disapproved_hidden_for_non_owner() -> None:
    client = _client()
    _register(client, "owner001", "owner@example.com")
    _register(client, "viewer01", "viewer@example.com")
    owner_cookie = _login_cookie(client, "owner@example.com")

    now = datetime(2026, 1, 1, 12, 0, 0)
    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner@example.com")
        viewer = uow.users.get_by_email("viewer@example.com")
        approved = uow.blueprints.add(Blueprint(None, owner.user_id, "Approved BP", None, {
        }, {}, {}, "Approved", now, 1, None, now, now))
        disapproved = uow.blueprints.add(Blueprint(None, owner.user_id, "Disapproved BP", None, {
        }, {}, {}, "Disapproved", now, 1, None, now, now))
        uow.favorite_blueprints.add(FavoriteBlueprint(
            viewer.user_id, approved.blueprint_id, now))
        uow.favorite_blueprints.add(FavoriteBlueprint(
            viewer.user_id, disapproved.blueprint_id, now))

    owned = client.get("/api/blueprints/library/owned",
                       headers={"Cookie": owner_cookie})
    assert owned.status_code == 200
    owned_names = {i["name"] for i in owned.get_json()["data"]["items"]}
    assert {"Approved BP", "Disapproved BP"}.issubset(owned_names)

    viewer_cookie = _login_cookie(client, "viewer@example.com")

    favorited = client.get("/api/blueprints/library/favorited",
                           headers={"Cookie": viewer_cookie})
    assert favorited.status_code == 200
    favorited_names = {i["name"]
                       for i in favorited.get_json()["data"]["items"]}
    assert "Approved BP" in favorited_names
    assert "Disapproved BP" not in favorited_names
