from dataclasses import FrozenInstanceError
from datetime import date
from decimal import Decimal

import pytest

from app.domain.value_objects import (
    CancellationResult,
    EvaluationResult,
    ExecutionResult,
    ExperimentConfig,
    JobSpecification,
    QueuePosition,
    SplitResult,
    TrainedModel,
    ValidationResult,
)


def test_validation_result_helpers() -> None:
    ok = ValidationResult.success()
    err = ValidationResult.failure("field", "message")

    assert ok.ok is True
    assert ok.errors == {}
    assert err.ok is False
    assert err.errors == {"field": ["message"]}


def test_execution_result_helpers() -> None:
    ok = ExecutionResult.success_result({"k": "v"})
    err = ExecutionResult.failure_result("boom")

    assert ok.success is True
    assert ok.error_message is None
    assert err.success is False
    assert err.error_message == "boom"


def test_value_objects_are_frozen_immutable() -> None:
    result = SplitResult(
        train_split=Decimal("0.8"),
        val_split=Decimal("0.1"),
        test_split=Decimal("0.1"),
    )

    with pytest.raises(FrozenInstanceError):
        result.train_split = Decimal("0.7")


def test_value_objects_are_non_persistent_helpers() -> None:
    classes = [
        ValidationResult,
        CancellationResult,
        QueuePosition,
        JobSpecification,
        ExperimentConfig,
        SplitResult,
        ExecutionResult,
        EvaluationResult,
        TrainedModel,
    ]

    for cls in classes:
        assert not hasattr(cls, "__tablename__")
        assert "metadata" not in cls.__dict__


def test_other_value_objects_construct_with_expected_fields() -> None:
    cfg = ExperimentConfig(
        interval="1h",
        start_date=date(2025, 1, 1),
        end_date=date(2025, 2, 1),
        train_split=Decimal("0.8"),
        val_split=Decimal("0.1"),
        test_split=Decimal("0.1"),
    )
    q = QueuePosition(
        job_id="job-1",
        position=1,
        queue_name="experiments",
        eta_seconds=120,
    )
    job = JobSpecification(
        job_type="EXPERIMENT_EXECUTION",
        payload={"experiment_id": 1},
        priority="normal",
        requested_by_user_id=99,
    )

    assert cfg.interval == "1h"
    assert q.position == 1
    assert q.job_id == "job-1"
    assert job.job_type == "EXPERIMENT_EXECUTION"
    assert job.payload["experiment_id"] == 1


def test_job_specification_rejects_invalid_payload() -> None:
    with pytest.raises(ValueError, match="experiment_id"):
        JobSpecification(
            job_type="EXPERIMENT_EXECUTION",
            payload={},
        )

    with pytest.raises(ValueError, match="positive integer"):
        JobSpecification(
            job_type="EXPERIMENT_EXECUTION",
            payload={"experiment_id": 0},
        )


def test_queue_position_rejects_invalid_values() -> None:
    with pytest.raises(ValueError, match="job_id"):
        QueuePosition(job_id="", position=1, queue_name="experiments")

    with pytest.raises(ValueError, match="position"):
        QueuePosition(job_id="job-1", position=-1, queue_name="experiments")
