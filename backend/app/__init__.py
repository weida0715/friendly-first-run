"""BEE backend Flask application factory."""

from __future__ import annotations

import os
from datetime import datetime, timezone

from flask import Flask, make_response, request
from flask_wtf.csrf import CSRFProtect, CSRFError

from app.config import get_config
from app.controllers._access import build_access_control
from app.controllers.system_controller import SystemController
from app.infrastructure.database.base import Base
from app.infrastructure.database.session import get_engine
from app.routes import register_routes
from app.responses import error_response


def create_app(config_name: str | None = None) -> Flask:
    """Create and configure the BEE Flask application.

    The factory is intentionally lightweight for RFC-001. Later RFCs can wire
    repositories, services, and infrastructure adapters here without coupling
    feature modules directly to concrete infrastructure.
    """

    app = Flask(__name__)
    app.config.from_object(get_config(config_name))
    app.config["SESSION_COOKIE_NAME"] = str(
        app.config.get("FLASK_SESSION_COOKIE_NAME", "flask_session_id"))
    csrf = CSRFProtect()
    csrf.init_app(app)

    @app.errorhandler(CSRFError)
    def _handle_csrf_error(error: CSRFError):
        return error_response(error.description or "CSRF validation failed", 400, code="CSRF_FAILED")

    allowed_origins = {
        origin.strip()
        for origin in str(app.config.get("CORS_ALLOW_ORIGINS", "")).split(",")
        if origin.strip()
    }

    @app.before_request
    def _handle_cors_preflight():
        if request.method == "OPTIONS" and request.path.startswith("/api/"):
            origin = request.headers.get("Origin")
            response = make_response("", 204)
            if origin and origin in allowed_origins:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-CSRFToken, X-CSRF-Token"
                response.headers["Vary"] = "Origin"
            return response
        return None

    @app.after_request
    def _apply_cors_headers(response):
        if request.path.startswith("/api/"):
            origin = request.headers.get("Origin")
            if origin and origin in allowed_origins:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Vary"] = "Origin"
            if request.method != "OPTIONS" and request.endpoint != "system.list_system_events":
                try:
                    actor = build_access_control().get_authenticated_context(request)
                    target_id = request.view_args.get("user_id") if isinstance(request.view_args, dict) else None
                    SystemController.record_event(
                        scope=(request.endpoint or "api").split(".", 1)[0],
                        action=f"{request.method} {request.path} -> {response.status_code}",
                        actor=actor,
                        target_type="Route",
                        target_id=str(target_id) if target_id is not None else None,
                        message=f"{request.method} {request.full_path.rstrip('?')} returned {response.status_code}",
                    )
                except Exception:
                    pass
        return response

    @app.teardown_request
    def _trace_unhandled_exception(exc):
        if exc is None or not request.path.startswith("/api/"):
            return None
        try:
            actor = build_access_control().get_authenticated_context(request)
            SystemController.record_event(
                scope=(request.endpoint or "api").split(".", 1)[0],
                action=f"{request.method} {request.path} -> 500",
                actor=actor,
                target_type="Route",
                target_id=None,
                message=f"{request.method} {request.full_path.rstrip('?')} raised {exc.__class__.__name__}: {exc}",
            )
        except Exception:
            return None
        return None

    session_backend = str(app.config.get("SESSION_BACKEND", "memory")).lower()
    web_concurrency = int(os.getenv("WEB_CONCURRENCY", "1"))
    if session_backend == "memory" and not app.testing:
        if web_concurrency > 1:
            app.logger.warning(
                "In-memory session backend with WEB_CONCURRENCY=%s can cause session loss across workers. "
                "Use sticky sessions (session affinity) at your load balancer or run a single worker as a temporary workaround.",
                web_concurrency,
            )
        else:
            app.logger.warning(
                "Using in-memory session backend. This is a temporary setup; use sticky sessions for multi-worker deployments "
                "or migrate to a centralized session store (e.g., Redis)."
            )

    register_routes(app)
    Base.metadata.create_all(bind=get_engine())

    return app
