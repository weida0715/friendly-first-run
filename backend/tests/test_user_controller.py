from __future__ import annotations

from datetime import datetime, timezone

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
from app.infrastructure.database.orm.user_orm import UserORM
from app.domain.models.user import User
from app.repositories.unit_of_work import UnitOfWork
from app.services.password_service import hash_password


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    app = create_app("testing")
    return app.test_client()


def _register_and_login(client, username: str, email: str, name: str = "Test"):
    client.post(
        "/api/auth/register",
        json={
            "name": name,
            "username": username,
            "email": email,
            "password": "securepass",
        },
    )
    login = client.post("/api/auth/login",
                        json={"email": email, "password": "securepass"})
    raw_cookie = login.headers.get("Set-Cookie")
    return raw_cookie.split(";", 1)[0] if raw_cookie else None


def _register_only(client, username: str, email: str, name: str = "Test"):
    client.post(
        "/api/auth/register",
        json={
            "name": name,
            "username": username,
            "email": email,
            "password": "securepass",
        },
    )


def _login_existing(client, email: str, password: str = "securepass"):
    login = client.post("/api/auth/login", json={"email": email, "password": password})
    raw_cookie = login.headers.get("Set-Cookie")
    return raw_cookie.split(";", 1)[0] if raw_cookie else None


def test_users_me_requires_auth_and_returns_profile() -> None:
    client = _client()
    assert client.get("/api/users/me").status_code == 401

    cookie = _register_and_login(
        client, "alice01", "alice@example.com", "Alice")
    response = client.get("/api/users/me", headers={"Cookie": cookie})
    assert response.status_code == 200
    assert response.get_json()["data"]["user"]["username"] == "alice01"


def test_users_list_staff_only_with_filters() -> None:
    client = _client()
    _register_only(client, "alice01", "alice@example.com", "Alice")
    _register_only(client, "mod01", "mod@example.com", "Mod")
    _register_only(client, "user02", "user02@example.com", "User")

    cookie_user = _register_and_login(
        client, "user03", "user03@example.com", "User 03")

    denied = client.get("/api/users", headers={"Cookie": cookie_user})
    assert denied.status_code == 403

    cookie_mod = _register_and_login(client, "mod01", "mod@example.com", "Mod")

    with UnitOfWork() as uow:
        mod = uow.users.get_by_email("mod@example.com")
        mod_row = uow.session.get(UserORM, mod.UserID)
        mod_row.Role = "Moderator"
        uow.session.flush()

    allowed = client.get(
        "/api/users?q=alice&page=1&pageSize=10", headers={"Cookie": cookie_mod})
    assert allowed.status_code == 200
    body = allowed.get_json()["data"]
    assert body["total"] >= 1
    assert any(item["username"] == "alice01" for item in body["items"])


def test_user_profile_access_owner_or_staff() -> None:
    client = _client()
    cookie_alice = _register_and_login(
        client, "alice01", "alice@example.com", "Alice")
    _register_only(client, "bob0001", "bob@example.com", "Bob")

    with UnitOfWork() as uow:
        alice = uow.users.get_by_email("alice@example.com")
        bob = uow.users.get_by_email("bob@example.com")
        bob_id = bob.UserID

    own = client.get(f"/api/users/{alice.UserID}",
                     headers={"Cookie": cookie_alice})
    assert own.status_code == 200

    forbidden = client.get(
        f"/api/users/{bob_id}", headers={"Cookie": cookie_alice})
    assert forbidden.status_code == 403

    with UnitOfWork() as uow:
        alice_row = uow.users.get_by_email("alice@example.com")
        alice_orm = uow.session.get(UserORM, alice_row.UserID)
        alice_orm.Role = "Moderator"
        uow.session.flush()

    allowed = client.get(
        f"/api/users/{bob_id}", headers={"Cookie": cookie_alice})
    assert allowed.status_code == 200


def test_user_audit_requires_staff_and_returns_history() -> None:
    client = _client()
    _register_only(client, "adminaudit1", "admin_audit_access@example.com", "Admin")
    _register_only(client, "normaudit1", "user_audit_access@example.com", "User")
    with UnitOfWork() as uow:
        admin = uow.users.get_by_email("admin_audit_access@example.com")
        uow.session.get(UserORM, admin.UserID).Role = "Admin"
        uow.session.flush()

    with UnitOfWork() as uow:
        now = datetime.now(timezone.utc)
        user = uow.users.add(User(
            user_id=None,
            username="audituser",
            email="audit_user@example.com",
            password_hash=hash_password("securepass"),
            name="User",
            role="User",
            status="Disabled",
            created_at=now,
            updated_at=now,
        ))
        user_id = user.UserID

    cookie_user = _register_and_login(client, "normaudit1", "user_audit_access@example.com", "User")
    assert client.get(f"/api/users/{user_id}/audit",
                      headers={"Cookie": cookie_user}).status_code == 403

    cookie_admin = _register_and_login(client, "adminaudit1", "admin_audit_access@example.com", "Admin")
    response = client.get(
        f"/api/users/{user_id}/audit", headers={"Cookie": cookie_admin})
    assert response.status_code == 200
    items = response.get_json()["data"]["items"]
    assert len(items) >= 1
    assert set(items[0]).issuperset({"action", "actor", "timestamp", "details"})


def test_user_audit_missing_user_returns_404() -> None:
    client = _client()
    with UnitOfWork() as uow:
        now = datetime.now(timezone.utc)
        uow.users.add(User(
            user_id=None,
            username="adminmiss",
            email="admin_missing@example.com",
            password_hash=hash_password("securepass"),
            name="Admin",
            role="Admin",
            status="Enabled",
            created_at=now,
            updated_at=now,
        ))

    cookie_admin = _login_existing(client, "admin_missing@example.com")
    response = client.get("/api/users/999999/audit", headers={"Cookie": cookie_admin})
    assert response.status_code == 404


def test_staff_management_actions_constraints() -> None:
    client = _client()
    _register_only(client, "admin01", "admin@example.com", "Admin")
    _register_only(client, "mod01", "mod@example.com", "Mod")
    _register_only(client, "user01", "user@example.com", "User")

    with UnitOfWork() as uow:
        admin = uow.users.get_by_email("admin@example.com")
        mod = uow.users.get_by_email("mod@example.com")
        user = uow.users.get_by_email("user@example.com")
        uow.session.get(UserORM, admin.UserID).Role = "Admin"
        uow.session.get(UserORM, mod.UserID).Role = "Moderator"
        uow.session.flush()
        user_id = user.UserID
        mod_id = mod.UserID

    cookie_mod = _register_and_login(client, "mod01", "mod@example.com", "Mod")

    # Moderator can disable normal user
    r1 = client.patch(f"/api/users/{user_id}/status",
                      json={"status": "Disabled"}, headers={"Cookie": cookie_mod})
    assert r1.status_code == 200

    # Moderator cannot manage moderator target
    r2 = client.patch(f"/api/users/{mod_id}/status",
                      json={"status": "Disabled"}, headers={"Cookie": cookie_mod})
    assert r2.status_code == 403

    # Moderator cannot delete
    r3 = client.delete(f"/api/users/{user_id}", headers={"Cookie": cookie_mod})
    assert r3.status_code == 403

    cookie_admin = _register_and_login(
        client, "admin01", "admin@example.com", "Admin")

    # Admin can update role and delete
    r4 = client.patch(f"/api/users/{user_id}/role",
                      json={"role": "Moderator"}, headers={"Cookie": cookie_admin})
    assert r4.status_code == 200
    r5 = client.delete(f"/api/users/{user_id}",
                       headers={"Cookie": cookie_admin})
    assert r5.status_code == 200


def test_normal_user_blocked_from_staff_mutation_endpoints() -> None:
    client = _client()
    cookie_user = _register_and_login(
        client, "norm01", "norm@example.com", "Normal")
    _register_only(client, "target01", "target@example.com", "Target")

    with UnitOfWork() as uow:
        target = uow.users.get_by_email("target@example.com")
        target_id = target.UserID

    assert client.post("/api/users", json={
        "name": "x", "username": "xuser", "email": "x@example.com", "password": "securepass"
    }, headers={"Cookie": cookie_user}).status_code == 403
    assert client.patch(f"/api/users/{target_id}/status", json={
                        "status": "Disabled"}, headers={"Cookie": cookie_user}).status_code == 403
    assert client.patch(f"/api/users/{target_id}/password", json={
                        "password": "newsecurepass"}, headers={"Cookie": cookie_user}).status_code == 403
    assert client.patch(f"/api/users/{target_id}/role", json={
                        "role": "Moderator"}, headers={"Cookie": cookie_user}).status_code == 403
    assert client.delete(
        f"/api/users/{target_id}", headers={"Cookie": cookie_user}).status_code == 403


def test_moderator_cannot_create_elevated_roles() -> None:
    client = _client()
    _register_only(client, "mod02", "mod02@example.com", "Mod")
    with UnitOfWork() as uow:
        mod = uow.users.get_by_email("mod02@example.com")
        uow.session.get(UserORM, mod.UserID).Role = "Moderator"
        uow.session.flush()

    cookie_mod = _register_and_login(
        client, "mod02", "mod02@example.com", "Mod")

    r_admin = client.post("/api/users", json={
        "name": "Admin Candidate",
        "username": "admincand",
        "email": "admincand@example.com",
        "password": "securepass",
        "role": "Admin",
    }, headers={"Cookie": cookie_mod})
    assert r_admin.status_code == 403

    r_mod = client.post("/api/users", json={
        "name": "Mod Candidate",
        "username": "modcand",
        "email": "modcand@example.com",
        "password": "securepass",
        "role": "Moderator",
    }, headers={"Cookie": cookie_mod})
    assert r_mod.status_code == 403


def test_role_changes_reflected_immediately_for_access() -> None:
    client = _client()
    _register_only(client, "admin02", "admin02@example.com", "Admin")
    _register_only(client, "user10", "user10@example.com", "User")

    with UnitOfWork() as uow:
        admin = uow.users.get_by_email("admin02@example.com")
        user = uow.users.get_by_email("user10@example.com")
        uow.session.get(UserORM, admin.UserID).Role = "Admin"
        uow.session.flush()
        user_id = user.UserID

    cookie_admin = _register_and_login(
        client, "admin02", "admin02@example.com", "Admin")

    # while admin, privileged route works
    assert client.patch(
        f"/api/users/{user_id}/role",
        json={"role": "Moderator"},
        headers={"Cookie": cookie_admin},
    ).status_code == 200

    # demote actor and verify same session immediately loses admin-only access
    with UnitOfWork() as uow:
        admin = uow.users.get_by_email("admin02@example.com")
        uow.session.get(UserORM, admin.UserID).Role = "User"
        uow.session.flush()

    assert client.patch(
        f"/api/users/{user_id}/role",
        json={"role": "Admin"},
        headers={"Cookie": cookie_admin},
    ).status_code == 403


def test_staff_create_user_rejects_invalid_username_or_email() -> None:
    client = _client()
    _register_only(client, "admin03", "admin03@example.com", "Admin")

    with UnitOfWork() as uow:
        admin = uow.users.get_by_email("admin03@example.com")
        uow.session.get(UserORM, admin.UserID).Role = "Admin"
        uow.session.flush()

    cookie_admin = _register_and_login(
        client, "admin03", "admin03@example.com", "Admin")

    invalid_username = client.post(
        "/api/users",
        json={
            "name": "Invalid Username",
            "username": "BAD_USER!",
            "email": "valid@example.com",
            "password": "securepass",
            "role": "User",
        },
        headers={"Cookie": cookie_admin},
    )
    assert invalid_username.status_code == 400

    invalid_email = client.post(
        "/api/users",
        json={
            "name": "Invalid Email",
            "username": "validuser",
            "email": "not-an-email",
            "password": "securepass",
            "role": "User",
        },
        headers={"Cookie": cookie_admin},
    )
    assert invalid_email.status_code == 400


def test_admin_create_user_normalizes_role_aliases_before_persist() -> None:
    client = _client()
    _register_only(client, "admin04", "admin04@example.com", "Admin")

    with UnitOfWork() as uow:
        admin = uow.users.get_by_email("admin04@example.com")
        uow.session.get(UserORM, admin.UserID).Role = "Admin"
        uow.session.flush()

    cookie_admin = _register_and_login(
        client, "admin04", "admin04@example.com", "Admin")

    r1 = client.post(
        "/api/users",
        json={
            "name": "Case Admin",
            "username": "caseadmin1",
            "email": "caseadmin1@example.com",
            "password": "securepass",
            "role": "admin",
        },
        headers={"Cookie": cookie_admin},
    )
    assert r1.status_code == 201
    assert r1.get_json()["data"]["user"]["role"] == "Admin"

    r2 = client.post(
        "/api/users",
        json={
            "name": "Case Moderator",
            "username": "casemod01",
            "email": "casemod01@example.com",
            "password": "securepass",
            "role": "moderator",
        },
        headers={"Cookie": cookie_admin},
    )
    assert r2.status_code == 201
    assert r2.get_json()["data"]["user"]["role"] == "Moderator"
