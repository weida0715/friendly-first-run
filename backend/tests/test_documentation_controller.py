from __future__ import annotations

from app import create_app
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import user_orm  # noqa: F401
from app.infrastructure.database.session import configure_engine, get_engine


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    return create_app("testing").test_client()


def test_documentation_list_and_detail_are_public():
    client = _client()

    listing = client.get("/api/docs/?q=public")
    assert listing.status_code == 200
    items = listing.get_json()["data"]["items"]
    assert any(item["slug"] == "public-hub" for item in items)

    detail = client.get("/api/docs/public-hub")
    assert detail.status_code == 200
    doc = detail.get_json()["data"]["doc"]
    assert doc["title"] == "Public Hub"
    assert "# Public Hub" in doc["body"]
    assert "Visible records must pass these rules" in doc["body"]


def test_documentation_missing_slug_returns_404():
    client = _client()
    response = client.get("/api/docs/nope")
    assert response.status_code == 404
