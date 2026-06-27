from __future__ import annotations

from datetime import datetime

from app import create_app
from app.domain.models.blueprint import Blueprint
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import blueprint_orm, btcusdt_kline_orm, experiment_log_orm, experiment_orm, favorite_blueprint_orm, favorite_model_orm, model_orm, user_orm  # noqa: F401
from app.infrastructure.database.orm.user_orm import UserORM
from app.infrastructure.database.session import configure_engine, get_engine
from app.repositories.unit_of_work import UnitOfWork


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    return create_app("testing").test_client()


def _register_and_login(client, username: str, email: str):
    client.post("/api/auth/register", json={"name": username,
                "username": username, "email": email, "password": "securepass"})
    login = client.post("/api/auth/login",
                        json={"email": email, "password": "securepass"})
    raw_cookie = login.headers.get("Set-Cookie")
    return raw_cookie.split(";", 1)[0] if raw_cookie else None


def test_request_approval_and_moderator_transitions() -> None:
    client = _client()
    owner_cookie = _register_and_login(
        client, "owner111", "owner111@example.com")
    client.post("/api/auth/register", json={
        "name": "mod11111",
        "username": "mod11111",
        "email": "mod111@example.com",
        "password": "securepass",
    })

    now = datetime(2026, 1, 1, 12, 0, 0)
    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner111@example.com")
        mod = uow.users.get_by_email("mod111@example.com")
        uow.session.get(UserORM, mod.user_id).Role = "Moderator"
        draft = uow.blueprints.add(Blueprint(None, owner.user_id, "Draft BP", None, {
        }, {}, {}, "Draft", None, 1, None, now, now))

    request_res = client.post(
        f"/api/blueprints/{draft.blueprint_id}/request-approval", headers={"Cookie": owner_cookie})
    assert request_res.status_code == 200
    assert request_res.get_json(
    )["data"]["blueprint"]["approvalState"] == "Pending"

    mod_cookie = _register_and_login(client, "mod11111", "mod111@example.com")

    approve_res = client.post(
        f"/api/blueprints/{draft.blueprint_id}/approve", headers={"Cookie": mod_cookie})
    assert approve_res.status_code == 200
    assert approve_res.get_json(
    )["data"]["blueprint"]["approvalState"] == "Approved"


def test_moderator_reject_from_pending_and_disapprove_from_approved() -> None:
    client = _client()
    owner_cookie = _register_and_login(
        client, "owner222", "owner222@example.com")
    mod_cookie = _register_and_login(client, "mod22222", "mod222@example.com")

    now = datetime(2026, 1, 1, 12, 0, 0)
    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner222@example.com")
        mod = uow.users.get_by_email("mod222@example.com")
        uow.session.get(UserORM, mod.user_id).Role = "Moderator"
        pending_reject = uow.blueprints.add(Blueprint(
            None, owner.user_id, "Pending Reject", None, {}, {}, {}, "Pending", now, 1, None, now, now))
        approved_disapprove = uow.blueprints.add(Blueprint(
            None, owner.user_id, "Approved Disapprove", None, {}, {}, {}, "Approved", now, 1, None, now, now))

    reject_res = client.post(
        f"/api/blueprints/{pending_reject.blueprint_id}/reject", headers={"Cookie": mod_cookie})
    assert reject_res.status_code == 200
    assert reject_res.get_json(
    )["data"]["blueprint"]["approvalState"] == "Rejected"

    disapprove_res = client.post(
        f"/api/blueprints/{approved_disapprove.blueprint_id}/disapprove", headers={"Cookie": mod_cookie})
    assert disapprove_res.status_code == 200
    disapprove_body = disapprove_res.get_json()["data"]
    assert disapprove_body["blueprint"]["approvalState"] == "Disapproved"
    assert disapprove_body["draftId"] is not None
    with UnitOfWork() as uow:
        draft = uow.blueprints.get_by_id(disapprove_body["draftId"])
        assert draft is not None
        assert draft.approval_state == "Draft"
        assert draft.parent_id == approved_disapprove.blueprint_id
        assert draft.version == 2

    # Owner cannot perform moderation actions.
    owner_moderate_denied = client.post(
        f"/api/blueprints/{approved_disapprove.blueprint_id}/approve", headers={"Cookie": owner_cookie})
    assert owner_moderate_denied.status_code in {403, 409}


def test_moderator_disapprove_from_pending_is_rejected() -> None:
    client = _client()
    _register_and_login(client, "owner333", "owner333@example.com")
    mod_cookie = _register_and_login(client, "mod33333", "mod333@example.com")

    now = datetime(2026, 1, 1, 12, 0, 0)
    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner333@example.com")
        mod = uow.users.get_by_email("mod333@example.com")
        uow.session.get(UserORM, mod.user_id).Role = "Moderator"
        pending = uow.blueprints.add(Blueprint(
            None, owner.user_id, "Pending", None, {}, {}, {}, "Pending", now, 1, None, now, now))

    disapprove_res = client.post(
        f"/api/blueprints/{pending.blueprint_id}/disapprove", headers={"Cookie": mod_cookie})
    assert disapprove_res.status_code == 409
