from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.domain.models.blueprint import Blueprint
from app.domain.models.user import User
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import blueprint_orm, user_orm  # noqa: F401
from app.repositories.blueprint_repository import BlueprintRepository
from app.repositories.user_repository import UserRepository
from app.services.versioning_service import VersioningService


def _session():
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)()


def _seed_user_and_blueprint(session, *, approval_state: str, submitted_at):
    users = UserRepository(session)
    blueprints = BlueprintRepository(session)
    now = datetime(2026, 1, 1, 12, 0, 0)

    user = users.add(User(None, "eve", "eve@example.com",
                     "x" * 60, "Eve", "User", "Enabled", now, now))
    bp = blueprints.add(
        Blueprint(
            blueprint_id=None,
            user_id=user.user_id,
            name="BP",
            description="old",
            indicators={"selected": ["rsi"]},
            features={"f": True},
            architecture={"reference": "logreg_binary",
                          "safety_profile": "balanced", "settings": {}},
            approval_state=approval_state,
            submitted_at=submitted_at,
            version=1,
            parent_id=None,
            created_at=now,
            updated_at=now,
        )
    )
    session.commit()
    return user, bp


def test_versioning_service_updates_in_place_for_never_submitted_draft() -> None:
    session = _session()
    user, bp = _seed_user_and_blueprint(
        session, approval_state="Draft", submitted_at=None)
    service = VersioningService(BlueprintRepository(session))

    saved = service.save_blueprint_edit(
        bp,
        {
            "metadata": {"name": "BP v1", "description": "new"},
            "indicators": {"selected": ["macd"]},
            "architecture": {"reference": "logreg_binary", "safety_profile": "balanced", "settings": {}},
        },
        actor_user_id=user.user_id,
    )
    session.commit()

    assert saved.blueprint_id == bp.blueprint_id
    assert saved.version == 1
    assert saved.parent_id is None
    assert saved.name == "BP v1"


def test_versioning_service_creates_new_version_for_reviewed_blueprint() -> None:
    session = _session()
    submitted_at = datetime(2026, 1, 2, 12, 0, 0)
    user, bp = _seed_user_and_blueprint(
        session, approval_state="Approved", submitted_at=submitted_at)
    repo = BlueprintRepository(session)
    service = VersioningService(repo)

    saved = service.save_blueprint_edit(
        bp,
        {
            "metadata": {"name": "BP v2", "description": "new"},
            "indicators": {"selected": ["atr"]},
            "architecture": {"reference": "logreg_binary", "safety_profile": "balanced", "settings": {}},
        },
        actor_user_id=user.user_id,
    )
    session.commit()

    assert saved.blueprint_id != bp.blueprint_id
    assert saved.parent_id == bp.blueprint_id
    assert saved.version == bp.version + 1
    assert saved.approval_state == "Draft"
    assert saved.submitted_at is None
