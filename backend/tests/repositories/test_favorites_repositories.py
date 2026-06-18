from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.domain.models.blueprint import Blueprint
from app.domain.models.experiment import Experiment
from app.domain.models.favorite_blueprint import FavoriteBlueprint
from app.domain.models.favorite_model import FavoriteModel
from app.domain.models.model import Model
from app.domain.models.user import User
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import blueprint_orm, experiment_orm, favorite_blueprint_orm, favorite_model_orm, model_orm, user_orm  # noqa: F401
from app.repositories.blueprint_repository import BlueprintRepository
from app.repositories.experiment_repository import ExperimentRepository
from app.repositories.favorite_blueprint_repository import FavoriteBlueprintRepository
from app.repositories.favorite_model_repository import FavoriteModelRepository
from app.repositories.model_repository import ModelRepository
from app.repositories.user_repository import UserRepository


def _session():
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)()


def test_favorites_add_list_remove() -> None:
    session = _session()
    users = UserRepository(session)
    blueprints = BlueprintRepository(session)
    experiments = ExperimentRepository(session)
    models = ModelRepository(session)
    fav_models = FavoriteModelRepository(session)
    fav_blueprints = FavoriteBlueprintRepository(session)
    now = datetime(2026, 1, 1, 12, 0, 0)

    user = users.add(User(None, "ivy", "ivy@example.com",
                     "x" * 60, "Ivy", "User", "Enabled", now, now))
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

    fav_models.add(FavoriteModel(user.UserID, model.ModelID, now))
    fav_blueprints.add(FavoriteBlueprint(user.UserID, bp.BlueprintID, now))
    session.commit()

    assert len(fav_models.list_by_user(user.UserID)) == 1
    assert len(fav_blueprints.list_by_user(user.UserID)) == 1

    fav_models.remove(user.UserID, model.ModelID)
    fav_blueprints.remove(user.UserID, bp.BlueprintID)
    session.commit()

    assert fav_models.list_by_user(user.UserID) == []
    assert fav_blueprints.list_by_user(user.UserID) == []
