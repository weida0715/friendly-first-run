from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.domain.models.blueprint import Blueprint
from app.domain.models.experiment import Experiment
from app.domain.models.experiment_log import ExperimentLog
from app.domain.models.model import Model
from app.domain.models.user import User
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import blueprint_orm, experiment_log_orm, experiment_orm, model_orm, user_orm  # noqa: F401
from app.repositories.blueprint_repository import BlueprintRepository
from app.repositories.experiment_log_repository import ExperimentLogRepository
from app.repositories.experiment_repository import ExperimentRepository
from app.repositories.model_repository import ModelRepository
from app.repositories.user_repository import UserRepository


def _session():
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)()


def test_experiment_log_repository_add_and_list_relations() -> None:
    session = _session()
    users = UserRepository(session)
    blueprints = BlueprintRepository(session)
    experiments = ExperimentRepository(session)
    models = ModelRepository(session)
    logs = ExperimentLogRepository(session)
    now = datetime(2026, 1, 1, 12, 0, 0)

    user = users.add(User(None, "zoe", "zoe@example.com",
                     "x" * 60, "Zoe", "User", "Enabled", now, now))
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
    model = models.add(Model(None, exp.ExperimentID, {
                       "c": 1}, Decimal("1.0"), None, None, None, now))
    log = logs.add(ExperimentLog(None, exp.ExperimentID,
                   model.ModelID, now, 1, Decimal("0.5"), {"a": 1}, now))
    session.commit()

    assert log.ExperimentLogID is not None
    assert len(logs.list_by_experiment(exp.ExperimentID)) == 1
    assert len(logs.list_by_model(model.ModelID)) == 1
