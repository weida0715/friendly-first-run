from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.domain.models.user import User
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import user_orm  # noqa: F401
from app.repositories.user_repository import UserRepository


def _session():
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)()


def test_user_repository_crud_queries() -> None:
    session = _session()
    repo = UserRepository(session)
    now = datetime(2026, 1, 1, 12, 0, 0)

    created = repo.add(
        User(
            user_id=None,
            username="alice",
            email="alice@example.com",
            password_hash="x" * 60,
            name="Alice",
            role="User",
            status="Enabled",
            created_at=now,
            updated_at=now,
        )
    )
    session.commit()

    assert created.UserID is not None
    assert repo.get_by_id(created.UserID).Username == "alice"
    assert repo.get_by_username("alice").Email == "alice@example.com"
    assert repo.get_by_email("alice@example.com").Username == "alice"
    assert len(repo.list_all()) == 1


def test_user_repository_search_and_count_filters() -> None:
    session = _session()
    repo = UserRepository(session)
    now = datetime(2026, 1, 1, 12, 0, 0)

    repo.add(
        User(
            user_id=None,
            username="alice01",
            email="alice@example.com",
            password_hash="x" * 60,
            name="Alice",
            role="User",
            status="Enabled",
            created_at=now,
            updated_at=now,
        )
    )
    repo.add(
        User(
            user_id=None,
            username="mod001",
            email="mod@example.com",
            password_hash="x" * 60,
            name="Mod User",
            role="Moderator",
            status="Enabled",
            created_at=now,
            updated_at=now,
        )
    )
    repo.add(
        User(
            user_id=None,
            username="admin01",
            email="admin@example.com",
            password_hash="x" * 60,
            name="Admin User",
            role="Admin",
            status="Disabled",
            created_at=now,
            updated_at=now,
        )
    )
    session.commit()

    assert repo.count_users() == 3
    assert repo.count_users(query="alice") == 1
    assert repo.count_users(role="Moderator") == 1
    assert repo.count_users(status="Disabled") == 1

    page = repo.search_users(query="user", limit=1, offset=0)
    assert len(page) == 1
    assert page[0].Name in {"Mod User", "Admin User"}

    mods = repo.search_users(role="Moderator")
    assert len(mods) == 1
    assert mods[0].Username == "mod001"


def test_user_repository_update_status_and_role_use_enums() -> None:
    session = _session()
    repo = UserRepository(session)
    now = datetime(2026, 1, 1, 12, 0, 0)

    created = repo.add(
        User(
            user_id=None,
            username="userx",
            email="userx@example.com",
            password_hash="x" * 60,
            name="User X",
            role="User",
            status="Enabled",
            created_at=now,
            updated_at=now,
        )
    )
    session.commit()

    updated_status = repo.update_status(created.UserID, "Disabled")
    assert updated_status is not None
    assert updated_status.Status == "Disabled"

    updated_role = repo.update_role(created.UserID, "Moderator")
    assert updated_role is not None
    assert updated_role.Role == "Moderator"
