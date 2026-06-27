"""Markdown-backed documentation endpoints."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

from flask import Blueprint, request

from app.responses import error_response, ok_response

blueprint = Blueprint("documentation", __name__)
DOCS_DIR = Path(__file__).resolve().parents[3] / "docs"


class DocumentationController:
    """Coordinates documentation browsing use cases."""

    pass


def _parse_doc(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    meta: dict[str, str] = {}
    body = text
    if text.startswith("---\n"):
        _, raw_meta, body = text.split("---\n", 2)
        for line in raw_meta.splitlines():
            if ":" not in line:
                continue
            key, value = line.split(":", 1)
            meta[key.strip()] = value.strip()
    order_raw = meta.get("order")
    try:
        order = int(order_raw) if order_raw else 999
    except ValueError:
        order = 999
    return {
        "slug": path.stem,
        "title": meta.get("title") or path.stem.replace("-", " ").title(),
        "category": meta.get("category") or "General",
        "order": order,
        "body": body.strip(),
    }


@lru_cache(maxsize=1)
def _docs() -> list[dict[str, Any]]:
    if not DOCS_DIR.exists():
        return []
    return sorted((_parse_doc(path) for path in DOCS_DIR.glob("*.md")), key=lambda doc: (doc["order"], doc["title"]))


@blueprint.get("/", strict_slashes=False)
@blueprint.get("", strict_slashes=False)
def index():
    q = (request.args.get("q") or "").strip().lower()
    docs = _docs()
    if q:
        docs = [doc for doc in docs if q in doc["title"].lower() or q in doc["category"].lower() or q in doc["body"].lower()]
    return ok_response({"data": {"items": [{k: doc[k] for k in ("slug", "title", "category")} for doc in docs]}})


@blueprint.get("/<string:slug>")
def detail(slug: str):
    doc = next((item for item in _docs() if item["slug"] == slug), None)
    if doc is None:
        return error_response("Documentation page not found", 404)
    return ok_response({"data": {"doc": {k: doc[k] for k in ("slug", "title", "category", "body")}}})
