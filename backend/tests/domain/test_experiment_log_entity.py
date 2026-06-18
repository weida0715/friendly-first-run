from datetime import datetime
from decimal import Decimal

from app.domain.models.experiment_log import ExperimentLog


def test_experiment_log_entity_roundtrip_fields() -> None:
    now = datetime(2026, 1, 1, 12, 0, 0)
    log = ExperimentLog(
        experiment_log_id=1,
        experiment_id=20,
        model_id=30,
        timestamp=now,
        signal=1,
        prediction=Decimal("0.1234"),
        metrics={"win_rate": 0.6},
        created_at=now,
    )
    assert log.Signal == 1
    assert log.Metrics == {"win_rate": 0.6}
