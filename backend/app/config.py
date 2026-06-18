"""Environment-aware backend configuration loader."""

from __future__ import annotations

import os
from pathlib import Path


def read_project_version() -> str:
    """Read the root VERSION file for health and diagnostics responses."""

    version_file = Path(__file__).resolve().parents[2] / "VERSION"
    if not version_file.exists():
        return "0.0.0"
    return version_file.read_text(encoding="utf-8").strip()


class BaseConfig:
    """Base Flask configuration shared by all environments."""

    APP_NAME: str = "Bitcoin Experimental Engine"
    APP_VERSION: str = read_project_version()
    API_PREFIX: str = "/api"
    ENV_NAME: str = os.getenv("FLASK_ENV", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-change-me")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    QUEUE_NAME: str = os.getenv("QUEUE_NAME", "experiments")
    BINANCE_BASE_URL: str = os.getenv(
        "BINANCE_BASE_URL", "https://api.binance.com")
    SESSION_TIMEOUT_MINUTES: int = int(
        os.getenv("SESSION_TIMEOUT_MINUTES", "1440"))
    SESSION_COOKIE_NAME: str = os.getenv("SESSION_COOKIE_NAME", "bee_session")
    SESSION_COOKIE_SAMESITE: str = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
    SESSION_COOKIE_SECURE: bool = os.getenv(
        "SESSION_COOKIE_SECURE", "false").lower() == "true"
    SESSION_BACKEND: str = os.getenv("SESSION_BACKEND", "memory")
    CORS_ALLOW_ORIGINS: str = os.getenv(
        "CORS_ALLOW_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://0.0.0.0:3000,http://192.168.0.122:3000",
    )
    TESTING: bool = False
    DEBUG: bool = False


class DevelopmentConfig(BaseConfig):
    ENV_NAME = "development"
    DEBUG = True


class TestingConfig(BaseConfig):
    ENV_NAME = "testing"
    TESTING = True
    WTF_CSRF_ENABLED = False


class ProductionConfig(BaseConfig):
    ENV_NAME = "production"
    SESSION_COOKIE_SECURE = True


CONFIG_BY_NAME = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config(config_name: str | None = None) -> type[BaseConfig]:
    """Return a configuration class for the requested environment."""

    selected = (config_name or os.getenv("FLASK_ENV") or "development").lower()
    return CONFIG_BY_NAME.get(selected, DevelopmentConfig)
