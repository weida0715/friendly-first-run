from __future__ import annotations

from app import create_app
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import user_orm  # noqa: F401
from app.infrastructure.database.session import configure_engine, get_engine


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    return create_app("testing").test_client()


def _login(client):
    client.post("/api/auth/register", json={"name": "Viewer", "username": "docviewer", "email": "doc@example.com", "password": "securepass"})
    login = client.post("/api/auth/login", json={"email": "doc@example.com", "password": "securepass"})
    return login.headers.get("Set-Cookie", "").split(";", 1)[0]


def test_documentation_list_and_detail_require_auth():
    client = _client()
    assert client.get("/api/docs/").status_code == 401

    cookie = _login(client)
    listing = client.get("/api/docs/?q=public", headers={"Cookie": cookie})
    assert listing.status_code == 200
    items = listing.get_json()["data"]["items"]
    assert any(item["slug"] == "public-hub" for item in items)

    detail = client.get("/api/docs/public-hub", headers={"Cookie": cookie})
    assert detail.status_code == 200
    doc = detail.get_json()["data"]["doc"]
    assert doc["title"] == "Public Hub"
    assert "# Public Hub" in doc["body"]
    assert "Visible records must pass these rules" in doc["body"]


def test_documentation_missing_slug_returns_404():
    client = _client()
    cookie = _login(client)
    response = client.get("/api/docs/nope", headers={"Cookie": cookie})
    assert response.status_code == 404
