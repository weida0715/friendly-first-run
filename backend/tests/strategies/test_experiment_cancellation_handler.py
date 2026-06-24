from __future__ import annotations

import pytest

from app.strategies.cancellable_job_strategy import CancellableJobStrategy
from app.strategies.experiment_cancellation_handler import ExperimentCancellationHandler
from app.strategies.job_cancellation_handler_registry import JobCancellationHandlerRegistry


def test_experiment_cancellation_handler_is_strategy_subtype() -> None:
    handler = ExperimentCancellationHandler()
    assert isinstance(handler, CancellableJobStrategy)


def test_experiment_cancellation_handler_supports_experiment_type() -> None:
    handler = ExperimentCancellationHandler()
    assert handler.supports("EXPERIMENT_EXECUTION") is True
    assert handler.supports("OTHER") is False


def test_registry_resolves_handler_by_job_type() -> None:
    registry = JobCancellationHandlerRegistry(
        [ExperimentCancellationHandler()])
    handler = registry.resolve("EXPERIMENT_EXECUTION")
    assert isinstance(handler, ExperimentCancellationHandler)


def test_registry_raises_for_unknown_job_type() -> None:
    registry = JobCancellationHandlerRegistry(
        [ExperimentCancellationHandler()])
    with pytest.raises(KeyError):
        registry.resolve("UNKNOWN")


def test_default_registry_returns_experiment_handler() -> None:
    handler = JobCancellationHandlerRegistry().get(None)
    assert isinstance(handler, ExperimentCancellationHandler)
