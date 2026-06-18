from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.domain.models.user import User
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
from app.repositories import unit_of_work as uow_module


def test_unit_of_work_commits_on_success() -> None:
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(
        bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

    original = uow_module.SessionLocal
    original_get_engine = uow_module.get_engine
    uow_module.SessionLocal = TestingSession
    uow_module.get_engine = lambda: engine
    try:
        now = datetime(2026, 1, 1, 12, 0, 0)
        with uow_module.UnitOfWork() as uow:
            uow.users.add(User(None, "uow_ok", "uow_ok@example.com",
                          "x" * 60, "Uow Ok", "User", "Enabled", now, now))

        with uow_module.UnitOfWork() as uow2:
            rows = uow2.users.list_all()
            assert any(u.Username == "uow_ok" for u in rows)
    finally:
        uow_module.get_engine = original_get_engine
        uow_module.SessionLocal = original


def test_unit_of_work_rolls_back_on_exception() -> None:
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(
        bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

    original = uow_module.SessionLocal
    original_get_engine = uow_module.get_engine
    uow_module.SessionLocal = TestingSession
    uow_module.get_engine = lambda: engine
    try:
        now = datetime(2026, 1, 1, 12, 0, 0)
        try:
            with uow_module.UnitOfWork() as uow:
                uow.users.add(
                    User(
                        None,
                        "uow_rollback",
                        "uow_rollback@example.com",
                        "x" * 60,
                        "Uow Rollback",
                        "User",
                        "Enabled",
                        now,
                        now,
                    )
                )
                raise RuntimeError("force rollback")
        except RuntimeError:
            pass

        with uow_module.UnitOfWork() as uow2:
            rows = uow2.users.list_all()
            assert all(u.Username != "uow_rollback" for u in rows)
    finally:
        uow_module.get_engine = original_get_engine
        uow_module.SessionLocal = original
