"""Backend route registry.

This module is the composition point for HTTP route modules. It keeps the app
factory clean and gives future controllers a single registration location.
"""

from __future__ import annotations

from flask import Flask, current_app

from app.controllers.authentication_controller import blueprint as authentication_blueprint
from app.controllers.blueprint_approval_controller import blueprint as blueprint_approval_blueprint
from app.controllers.blueprint_controller import blueprint as blueprint_blueprint
from app.controllers.blueprints_library_controller import blueprint as blueprints_library_blueprint
from app.controllers.documentation_controller import blueprint as documentation_blueprint
from app.controllers.experiment_controller import blueprint as experiment_blueprint
from app.controllers.job_controller import blueprint as job_blueprint
from app.controllers.logs_download_controller import blueprint as logs_blueprint
from app.controllers.market_data_controller import blueprint as market_data_blueprint
from app.controllers.model_controller import blueprint as model_blueprint
from app.controllers.public_hub_controller import blueprint as public_hub_blueprint
from app.controllers.system_controller import blueprint as system_blueprint
from app.controllers.user_controller import blueprint as user_blueprint


def register_routes(app: Flask) -> None:
    """Register all backend API blueprints."""

    @app.get("/")
    def backend_status_page():
        """Render a browser-friendly backend status page."""

        service = current_app.config.get("APP_NAME", "BEE")
        version = current_app.config.get("APP_VERSION", "0.0.0")
        environment = current_app.config.get("ENV_NAME", "development")
        return f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>{service} Backend</title>
            <style>
              body {{
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background: #07111f;
                color: #e6f7fb;
              }}
              main {{
                width: min(92vw, 680px);
                border: 1px solid rgba(77, 216, 235, 0.25);
                border-radius: 20px;
                padding: 32px;
                background: linear-gradient(135deg, rgba(12, 26, 45, 0.96), rgba(23, 16, 45, 0.9));
                box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
              }}
              .status {{ color: #5eead4; font-weight: 700; }}
              code {{ color: #93c5fd; }}
              a {{ color: #67e8f9; }}
            </style>
          </head>
          <body>
            <main>
              <p class="status">● healthy</p>
              <h1>{service} Backend</h1>
              <p>Version <code>{version}</code> is running in <code>{environment}</code> mode.</p>
              <p>API health endpoint: <a href="/api/health"><code>/api/health</code></a></p>
            </main>
          </body>
        </html>
        """

    api_prefix = app.config.get("API_PREFIX", "/api")
    app.register_blueprint(system_blueprint, url_prefix=api_prefix)
    app.register_blueprint(authentication_blueprint,
                           url_prefix=f"{api_prefix}/auth")
    app.register_blueprint(user_blueprint, url_prefix=f"{api_prefix}/users")
    app.register_blueprint(experiment_blueprint,
                           url_prefix=f"{api_prefix}/experiments")
    app.register_blueprint(blueprint_blueprint,
                           url_prefix=f"{api_prefix}/blueprints")
    app.register_blueprint(blueprint_approval_blueprint,
                           url_prefix=f"{api_prefix}/blueprints")
    app.register_blueprint(blueprints_library_blueprint,
                           url_prefix=f"{api_prefix}/blueprints/library")
    app.register_blueprint(model_blueprint, url_prefix=f"{api_prefix}/models")
    app.register_blueprint(public_hub_blueprint,
                           url_prefix=f"{api_prefix}/hub")
    app.register_blueprint(documentation_blueprint,
                           url_prefix=f"{api_prefix}/docs")
    app.register_blueprint(job_blueprint, url_prefix=f"{api_prefix}/jobs")
    app.register_blueprint(logs_blueprint, url_prefix=f"{api_prefix}/logs")
    app.register_blueprint(market_data_blueprint,
                           url_prefix=f"{api_prefix}/market-data")
