from __future__ import annotations
from datetime import datetime
from app import create_app
from app.domain.models.blueprint import Blueprint
from app.domain.models.experiment import Experiment
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import blueprint_orm, experiment_log_orm, experiment_orm, model_orm, user_orm  # noqa: F401
from app.infrastructure.database.session import configure_engine, get_engine
from app.repositories.unit_of_work import UnitOfWork
from app.strategies.job_cancellation import ExperimentCancellationHandler
from decimal import Decimal

class _Queue:
    def __init__(self): self.removed = False; self.cancelled = False
    def remove_job_from_queue(self, job_id): self.removed = True; return True
    def cancel_running_job(self, job_id): self.cancelled = True; return True

def _seed_exp():
    configure_engine("sqlite:///:memory:"); Base.metadata.create_all(bind=get_engine()); app=create_app("testing")
    with UnitOfWork() as uow:
        now=datetime(2026,1,1)
        user=uow.users.add(type("U", (), {"user_id":None,"name":"u","username":"u001","email":"u@example.com","password_hash":"x","role":"User","created_at":now,"updated_at":now,"UserID":None,"Name":"u","Username":"u001","Email":"u@example.com","PasswordHash":"x","Role":"User","Status":"Enabled","CreatedAt":now,"UpdatedAt":now})())
        bp=uow.blueprints.add(Blueprint(None,user.user_id,"bp",None,{}, {}, {}, "Approved", now,1,None,now,now))
        exp=uow.experiments.add(Experiment(None,user.user_id,bp.blueprint_id,"exp",None,"1m",now.date(),now.date(),Decimal("0.8"),Decimal("0.1"),Decimal("0.1"),{},"Queued",Decimal("0"),None,None,None,now,None))
        return exp.experiment_id

def test_cancel_queued_marks_experiment_cancelled_and_logs_event():
    exp_id=_seed_exp(); q=_Queue()
    result=ExperimentCancellationHandler().cancel("job-1", {"state":"queued","payload_experiment_id":exp_id}, q)
    assert result["cancelled"] is True and q.removed
    with UnitOfWork() as uow:
        exp=uow.experiments.get_by_id(exp_id); logs=uow.experiment_logs.list_by_experiment(exp_id)
        assert exp.status == "Cancelled"
        assert any((log.metrics or {}).get("event") == "cancelled" for log in logs)

def test_cancel_running_calls_running_cancel_and_is_idempotent():
    exp_id=_seed_exp(); q=_Queue(); handler=ExperimentCancellationHandler()
    assert handler.cancel("job-1", {"state":"running","payload_experiment_id":exp_id}, q)["cancelled"] is True
    assert q.cancelled
    again=handler.cancel("job-1", {"state":"running","payload_experiment_id":exp_id}, q)
    assert again["cancelled"] is True and again["idempotent"] is True
