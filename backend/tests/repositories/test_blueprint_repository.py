from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.domain.models.blueprint import Blueprint
from app.domain.models.user import User
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import blueprint_orm, user_orm  # noqa: F401
from app.repositories.blueprint_repository import BlueprintRepository
from app.repositories.user_repository import UserRepository


def _session():
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)()


def test_blueprint_repository_add_get_list_by_user() -> None:
    session = _session()
    users = UserRepository(session)
    blueprints = BlueprintRepository(session)
    now = datetime(2026, 1, 1, 12, 0, 0)

    user = users.add(User(None, "bob", "bob@example.com",
                     "x" * 60, "Bob", "User", "Enabled", now, now))
    bp = blueprints.add(
        Blueprint(
            blueprint_id=None,
            user_id=user.UserID,
            name="BP",
            description=None,
            indicators={"rsi": 14},
            features={"close": True},
            architecture={"layers": []},
            approval_state="Draft",
            submitted_at=None,
            version=1,
            parent_id=None,
            created_at=now,
            updated_at=now,
        )
    )
    session.commit()

    assert blueprints.get_by_id(bp.BlueprintID).Name == "BP"
    assert len(blueprints.list_by_user(user.UserID)) == 1
