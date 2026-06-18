from datetime import date, datetime
from decimal import Decimal
from typing import get_args

from app.domain.models.experiment import Experiment, ExperimentStatus, Interval


def test_experiment_entity_roundtrip_fields() -> None:
    now = datetime(2026, 1, 1, 12, 0, 0)
    exp = Experiment(
        experiment_id=20,
        user_id=1,
        blueprint_id=10,
        name="exp",
        description=None,
        interval="1h",
        start_date=date(2025, 1, 1),
        end_date=date(2025, 2, 1),
        train_split=Decimal("0.80"),
        val_split=Decimal("0.10"),
        test_split=Decimal("0.10"),
        parameter_overrides=None,
        status="Queued",
        progress=None,
        current_stage=None,
        eta_seconds=None,
        success=None,
        created_at=now,
        completed_at=None,
    )
    assert exp.Interval == "1h"
    assert exp.Status == "Queued"


def test_experiment_interval_and_status_literal_values_match_erd() -> None:
    assert set(get_args(Interval)) == {"1m", "5m", "15m", "30m", "1h", "2h", "4h", "1d"}
    assert set(get_args(ExperimentStatus)) == {
        "Queued",
        "Running",
        "Completed",
        "Failed",
        "Cancelled",
    }


def test_experiment_split_constraints_not_runtime_enforced_in_domain_dataclass() -> None:
    """Current behavior: split guards are DB/ORM-level, not dataclass runtime-level."""
    now = datetime(2026, 1, 1, 12, 0, 0)
    exp = Experiment(
        experiment_id=None,
        user_id=1,
        blueprint_id=10,
        name="no_runtime_guard",
        description=None,
        interval="1d",
        start_date=date(2025, 1, 1),
        end_date=date(2025, 2, 1),
        train_split=Decimal("0.95"),
        val_split=Decimal("0.03"),
        test_split=Decimal("0.02"),
        parameter_overrides=None,
        status="Queued",
        progress=None,
        current_stage=None,
        eta_seconds=None,
        success=None,
        created_at=now,
        completed_at=None,
    )
    assert exp.ValSplit == Decimal("0.03")
