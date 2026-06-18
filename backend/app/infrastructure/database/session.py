"""Database engine and session factory setup for backend persistence."""

from __future__ import annotations

import os
import threading

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

engine: Engine | None = None
_engine_lock = threading.Lock()
SessionLocal = sessionmaker(
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    class_=Session,
)


def resolve_database_url() -> str:
    """Resolve required PostgreSQL database URL from environment."""

    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL is required and must point to PostgreSQL. "
            "Example: postgresql+psycopg://bee_user:bee_password@localhost:5432/bee"
        )

    if database_url.startswith("postgres://"):
        database_url = "postgresql://" + database_url[len("postgres://"):]

    if not database_url.startswith("postgresql"):
        raise RuntimeError(
            "DATABASE_URL must use a PostgreSQL scheme (postgresql:// or postgresql+<driver>://). "
            "If you are using legacy postgres://, update it to postgresql://."
        )

    return database_url


def get_engine() -> Engine:
    """Return the process-global engine, lazily initializing from environment once."""

    global engine
    if engine is not None:
        return engine

    with _engine_lock:
        if engine is not None:
            return engine

        resolved_url = resolve_database_url()
        new_engine = create_engine(resolved_url, future=True)
        SessionLocal.configure(bind=new_engine)
        engine = new_engine

        return engine


def configure_engine(database_url: str) -> Engine:
    """Explicitly (re)configure global engine/session factory; intended for controlled contexts."""

    global engine
    with _engine_lock:
        new_engine = create_engine(database_url, future=True)
        SessionLocal.configure(bind=new_engine)
        engine = new_engine
        return engine


def get_session_local() -> sessionmaker:
    """Return a bound session factory, initializing engine lazily when needed."""

    get_engine()
    return SessionLocal
