"""Shared JSON response helpers for backend API routes."""

from __future__ import annotations

from typing import Any

from flask import jsonify


def ok_response(data: dict[str, Any] | None = None, status_code: int = 200):
    """Return a normalized successful JSON response."""

    payload = {"ok": True}
    if data:
        payload.update(data)
    return jsonify(payload), status_code


def error_response(message: str, status_code: int = 400, code: str | None = None):
    """Return a normalized error JSON response."""

    payload: dict[str, Any] = {"ok": False, "error": {"message": message}}
    if code:
        payload["error"]["code"] = code
    return jsonify(payload), status_code


def validation_error_response(errors: dict[str, list[str] | str], status_code: int = 400):
    """Return a normalized validation error payload with field-level errors."""

    payload: dict[str, Any] = {
        "ok": False,
        "error": {"message": "Validation failed", "code": "VALIDATION_ERROR"},
        "data": {"errors": errors},
    }
    return jsonify(payload), status_code
