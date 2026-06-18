from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

import pytest

from app.execution.experiment_compiler import ExperimentCompilationError, ExperimentCompiler, stable_parameter_hash


@dataclass
class _Blueprint:
    blueprint_id: int = 1
    name: str = "BP"
    version: int = 1
    approval_state: str = "Approved"
    architecture: dict | None = None
    indicators: dict | None = None
    features: dict | None = None


def _blueprint() -> _Blueprint:
    return _Blueprint(
        architecture={
            "name": "logistic_regressor_arc",
            "parameters": {"C": 1.0, "solver": "lbfgs"},
            "parameter_constraints": {
                "C": {"type": "number", "min": 0.1, "max": 10.0},
                "solver": {"type": "string", "allowed_values": ["lbfgs", "liblinear"]},
            },
        },
        indicators={"parameters": {"vwap": {"output": "vwap"}}, "parameter_constraints": {"vwap": {"output": {"type": "string"}}}},
        features={},
    )


def test_compiler_merges_overrides_without_mutating_blueprint() -> None:
    bp = _blueprint()
    original = dict(bp.architecture["parameters"])
    plan = ExperimentCompiler.compile(
        blueprint=bp,
        experiment_payload={
            "symbol": "BTCUSDT",
            "train_split": 80,
            "val_split": 10,
            "test_split": 10,
            "parameter_overrides": {"architecture": {"C": 2.0}},
        },
    )
    assert plan.compiled_experiment_snapshot["effective_parameters"]["architecture"]["C"] == 2.0
    assert bp.architecture["parameters"] == original


def test_compiler_generates_permutations_hashes_and_deterministic_sample() -> None:
    payload = {
        "train_split": 80,
        "val_split": 10,
        "test_split": 10,
        "seed": 7,
        "requested_permutation_count": 2,
        "parameter_overrides": {"architecture": {"solver": {"allowed_values": ["lbfgs", "liblinear"]}, "C": {"min": 1.0, "max": 2.0}}},
    }
    one = ExperimentCompiler.compile(blueprint=_blueprint(), experiment_payload=payload)
    two = ExperimentCompiler.compile(blueprint=_blueprint(), experiment_payload=payload)
    assert one.max_permutation_count == 4
    assert one.requested_permutation_count == 2
    assert [p["parameter_hash"] for p in one.permutations] == [p["parameter_hash"] for p in two.permutations]
    assert stable_parameter_hash({"b": 1, "a": 2}) == stable_parameter_hash({"a": 2, "b": 1})


def test_compiler_rejects_disallowed_override() -> None:
    with pytest.raises(ExperimentCompilationError) as exc:
        ExperimentCompiler.compile(
            blueprint=_blueprint(),
            experiment_payload={"train_split": 80, "val_split": 10, "test_split": 10, "parameter_overrides": {"architecture": {"C": {"min": 0.01, "max": 2.0}}}},
        )
    assert "architecture.C" in exc.value.errors


def test_compiler_parses_comma_separated_override_values_for_permutations() -> None:
    payload = {
        "symbol": "BTCUSDT",
        "interval": "1m",
        "start_datetime": "2026-01-01T00:00:00+00:00",
        "end_datetime": "2026-01-02T00:00:00+00:00",
        "train_split": 80,
        "val_split": 10,
        "test_split": 10,
        "requested_permutation_count": 6,
        "parameter_overrides": {"indicators": {"ichimoku_cloud": {"base_period": "26,48,96", "conversion_period": "9,10"}}},
    }
    bp = _blueprint()
    bp.indicators = {"parameters": {"ichimoku_cloud": {"base_period": 26, "conversion_period": 9}}, "parameter_constraints": {}}
    plan = ExperimentCompiler.compile(blueprint=bp, experiment_payload=payload)
    assert plan.max_permutation_count == 6
    assert plan.requested_permutation_count == 6


def test_compiler_clamps_requested_permutation_count_to_backend_max() -> None:
    payload = {
        "symbol": "BTCUSDT",
        "interval": "1m",
        "start_datetime": "2026-01-01T00:00:00+00:00",
        "end_datetime": "2026-01-02T00:00:00+00:00",
        "train_split": 80,
        "val_split": 10,
        "test_split": 10,
        "requested_permutation_count": 5,
        "parameter_overrides": {},
    }
    plan = ExperimentCompiler.compile(blueprint=_blueprint(), experiment_payload=payload)
    assert plan.max_permutation_count == 1
    assert plan.requested_permutation_count == 1
    assert len(plan.permutations) == 1


def test_compiler_applies_fixed_value_override() -> None:
    plan = ExperimentCompiler.compile(
        blueprint=_blueprint(),
        experiment_payload={
            "train_split": 80,
            "val_split": 10,
            "test_split": 10,
            "parameter_overrides": {"architecture": {"solver": "liblinear"}},
        },
    )

    assert plan.compiled_experiment_snapshot["effective_parameters"]["architecture"]["solver"] == "liblinear"
    assert plan.max_permutation_count == 1


def test_compiler_applies_narrowed_range_override() -> None:
    plan = ExperimentCompiler.compile(
        blueprint=_blueprint(),
        experiment_payload={
            "train_split": 80,
            "val_split": 10,
            "test_split": 10,
            "parameter_overrides": {"architecture": {"C": {"min": 1.5, "max": 1.5}}},
        },
    )

    assert plan.compiled_experiment_snapshot["effective_parameters"]["architecture"]["C"] == 1.5


def test_compiler_applies_allowed_value_subset_override() -> None:
    plan = ExperimentCompiler.compile(
        blueprint=_blueprint(),
        experiment_payload={
            "train_split": 80,
            "val_split": 10,
            "test_split": 10,
            "requested_permutation_count": 1,
            "parameter_overrides": {"architecture": {"solver": {"allowed_values": ["liblinear"]}}},
        },
    )

    assert plan.max_permutation_count == 1
    assert plan.permutations[0]["architecture"]["solver"] == "liblinear"


def test_compiler_rejects_allowed_value_subset_with_disallowed_value() -> None:
    with pytest.raises(ExperimentCompilationError) as exc:
        ExperimentCompiler.compile(
            blueprint=_blueprint(),
            experiment_payload={
                "train_split": 80,
                "val_split": 10,
                "test_split": 10,
                "parameter_overrides": {"architecture": {"solver": {"allowed_values": ["bad_solver"]}}},
            },
        )

    assert "architecture.solver" in exc.value.errors


def test_compiler_snapshot_remains_immutable_after_blueprint_edit() -> None:
    bp = _blueprint()
    plan = ExperimentCompiler.compile(
        blueprint=bp,
        experiment_payload={
            "train_split": 80,
            "val_split": 10,
            "test_split": 10,
            "parameter_overrides": {"architecture": {"C": 2.0}},
        },
    )

    bp.architecture["parameters"]["C"] = 9.9
    bp.architecture["parameter_constraints"]["C"]["min"] = 9.0

    assert plan.compiled_blueprint_snapshot["architecture"]["parameters"]["C"] == 1.0
    assert plan.compiled_experiment_snapshot["effective_parameters"]["architecture"]["C"] == 2.0


def test_compiler_override_conflict_reports_multiple_errors() -> None:
    with pytest.raises(ExperimentCompilationError) as exc:
        ExperimentCompiler.compile(
            blueprint=_blueprint(),
            experiment_payload={
                "train_split": 80,
                "val_split": 10,
                "test_split": 10,
                "parameter_overrides": {
                    "architecture": {
                        "C": {"min": 0.01, "max": 99.0},
                        "solver": "bad_solver",
                    }
                },
            },
        )

    assert "architecture.C" in exc.value.errors
    assert "architecture.solver" in exc.value.errors
