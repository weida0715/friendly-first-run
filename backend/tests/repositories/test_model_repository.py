from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.domain.models.blueprint import Blueprint
from app.domain.models.experiment import Experiment
from app.domain.models.model import Model
from app.domain.models.user import User
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import blueprint_orm, experiment_orm, model_orm, user_orm  # noqa: F401
from app.repositories.blueprint_repository import BlueprintRepository
from app.repositories.experiment_repository import ExperimentRepository
from app.repositories.model_repository import ModelRepository
from app.repositories.user_repository import UserRepository


def _session():
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)()


def test_model_repository_add_get_list_by_experiment() -> None:
    session = _session()
    users = UserRepository(session)
    blueprints = BlueprintRepository(session)
    experiments = ExperimentRepository(session)
    models = ModelRepository(session)
    now = datetime(2026, 1, 1, 12, 0, 0)

    user = users.add(User(None, "mike", "mike@example.com",
                     "x" * 60, "Mike", "User", "Enabled", now, now))
    bp = blueprints.add(Blueprint(None, user.UserID, "BP",
                        None, {}, {}, {}, "Draft", None, 1, None, now, now))
    exp = experiments.add(
        Experiment(
            None,
            user.UserID,
            bp.BlueprintID,
            "EXP",
            None,
            "1h",
            date(2025, 1, 1),
            date(2025, 2, 1),
            Decimal("0.80"),
            Decimal("0.10"),
            Decimal("0.10"),
            None,
            "Queued",
            None,
            None,
            None,
            None,
            now,
            None,
        )
    )
    m = models.add(Model(None, exp.ExperimentID, {
                   "c": 1}, Decimal("1.0"), None, None, None, now))
    session.commit()

    assert models.get_by_id(m.ModelID).ExperimentID == exp.ExperimentID
    assert len(models.list_by_experiment(exp.ExperimentID)) == 1
