from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from app import create_app
from app.domain.models.blueprint import Blueprint
from app.domain.models.experiment import Experiment
from app.domain.models.model import Model
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import blueprint_orm, experiment_log_orm, experiment_orm, model_orm, user_orm  # noqa: F401
from app.infrastructure.database.session import configure_engine, get_engine
from app.repositories.unit_of_work import UnitOfWork
from app.strategies.trading.long_only_single_position_strategy import BACKTEST_FIELDS

class U:
    user_id=None; name="u"; username="u002"; email="u2@example.com"; password_hash="x"; role="User"; status="Enabled"
    UserID=None; Name="u"; Username="u002"; Email="u2@example.com"; PasswordHash="x"; Role="User"; Status="Enabled"
    created_at=datetime(2026,1,1); updated_at=datetime(2026,1,1); CreatedAt=created_at; UpdatedAt=updated_at

def test_repository_persists_structured_metrics_log():
    configure_engine("sqlite:///:memory:"); Base.metadata.create_all(bind=get_engine()); create_app("testing")
    with UnitOfWork() as uow:
        now=datetime(2026,1,1); user=uow.users.add(U())
        bp=uow.blueprints.add(Blueprint(None,user.user_id,"bp",None,{}, {}, {}, "Approved", now,1,None,now,now))
        exp=uow.experiments.add(Experiment(None,user.user_id,bp.blueprint_id,"exp",None,"1m",now.date(),now.date(),Decimal("0.8"),Decimal("0.1"),Decimal("0.1"),{},"Queued",Decimal("0"),None,None,None,now,None))
        model=uow.models.add(Model(None, exp.experiment_id, {"parameter_hash":"h"}, None, None, None, None, now, "h"))
        metrics={k: 0 for k in BACKTEST_FIELDS}; metrics["type"]="backtest"
        uow.experiment_logs.add_metrics_log(experiment_id=exp.experiment_id, model_id=model.model_id, metrics=metrics, timestamp=now)
        logs=uow.experiment_logs.list_by_model(model.model_id)
        assert logs[0].metrics["type"] == "backtest"
        assert set(BACKTEST_FIELDS).issubset(logs[0].metrics)
