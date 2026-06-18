from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.domain.models.blueprint import Blueprint
from app.domain.models.experiment import Experiment
from app.domain.models.user import User
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import blueprint_orm, experiment_orm, user_orm  # noqa: F401
from app.repositories.blueprint_repository import BlueprintRepository
from app.repositories.experiment_repository import ExperimentRepository
from app.repositories.user_repository import UserRepository


def _session():
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)()


def test_experiment_repository_add_get_list_by_user() -> None:
    session = _session()
    users = UserRepository(session)
    blueprints = BlueprintRepository(session)
    experiments = ExperimentRepository(session)
    now = datetime(2026, 1, 1, 12, 0, 0)

    user = users.add(User(None, "eve", "eve@example.com",
                     "x" * 60, "Eve", "User", "Enabled", now, now))
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
    session.commit()

    assert experiments.get_by_id(exp.ExperimentID).Name == "EXP"
    assert len(experiments.list_by_user(user.UserID)) == 1


def test_experiment_repository_status_transitions() -> None:
    session = _session()
    users = UserRepository(session)
    blueprints = BlueprintRepository(session)
    experiments = ExperimentRepository(session)
    now = datetime(2026, 1, 1, 12, 0, 0)

    user = users.add(User(None, "eve2", "eve2@example.com",
                     "x" * 60, "Eve2", "User", "Enabled", now, now))
    bp = blueprints.add(Blueprint(None, user.UserID, "BP2",
                        None, {}, {}, {}, "Draft", None, 1, None, now, now))
    exp = experiments.add(
        Experiment(
            None,
            user.UserID,
            bp.BlueprintID,
            "EXP2",
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

    running = experiments.mark_running(
        exp.ExperimentID, progress=Decimal("0"), current_stage="Running")
    assert running is not None
    assert running.Status == "Running"

    progress = experiments.update_progress(exp.ExperimentID, progress=Decimal(
        "45.5"), current_stage="Loading", eta_seconds=120)
    assert progress is not None
    assert progress.Progress == Decimal("45.50")
    assert progress.CurrentStage == "Loading"

    completed = experiments.mark_completed(
        exp.ExperimentID, completed_at=now, current_stage="Completed")
    assert completed is not None
    assert completed.Status == "Completed"
    assert completed.Success is True

    failed = experiments.mark_failed(
        exp.ExperimentID, completed_at=now, current_stage="Failed")
    assert failed is not None
    assert failed.Status == "Failed"
    assert failed.Success is False


def test_experiment_repository_truncates_long_current_stage_values() -> None:
    session = _session()
    users = UserRepository(session)
    blueprints = BlueprintRepository(session)
    experiments = ExperimentRepository(session)
    now = datetime(2026, 1, 1, 12, 0, 0)

    user = users.add(User(None, "eve3", "eve3@example.com", "x" * 60, "Eve3", "User", "Enabled", now, now))
    bp = blueprints.add(Blueprint(None, user.UserID, "BP3", None, {}, {}, {}, "Draft", None, 1, None, now, now))
    exp = experiments.add(Experiment(None, user.UserID, bp.BlueprintID, "EXP3", None, "1h", date(2025, 1, 1), date(2025, 2, 1), Decimal("0.80"), Decimal("0.10"), Decimal("0.10"), None, "Queued", None, None, None, None, now, None))

    long_stage = "Splitting data before features, targets, scaling, and training"
    updated = experiments.update_progress(exp.ExperimentID, progress=Decimal("22"), current_stage=long_stage, eta_seconds=None)
    assert updated is not None
    assert len(updated.CurrentStage) == 50
    assert updated.CurrentStage.endswith("…")

    failed = experiments.mark_failed(exp.ExperimentID, completed_at=now, current_stage="Failed: " + ("x" * 180))
    assert failed is not None
    assert len(failed.CurrentStage) == 50
    assert failed.CurrentStage.endswith("…")
