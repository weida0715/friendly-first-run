from __future__ import annotations

from types import SimpleNamespace

from app.validators.experiment_validator import ExperimentValidator


class _BlueprintRepoStub:
    def __init__(self, blueprint: object | None):
        self._blueprint = blueprint

    def get_by_id(self, blueprint_id: int):
        return self._blueprint


def _valid_payload() -> dict:
    return {
        "name": "Exp 1",
        "symbol": "BTCUSDT",
        "start_date": "2026-01-01T00:00:00Z",
        "end_date": "2026-01-10T00:00:00Z",
        "train_split": 80,
        "val_split": 10,
        "test_split": 10,
        "blueprint_id": 11,
        "parameter_overrides": {"window": 20, "risk": {"max_drawdown": 0.2}},
    }


def test_validate_success_payload() -> None:
    payload = _valid_payload()
    actor = SimpleNamespace(id=7, role="User")
    blueprint = SimpleNamespace(UserID=7, ApprovalState="Draft")
    repo = _BlueprintRepoStub(blueprint)

    result = ExperimentValidator.validate(
        payload, actor=actor, blueprint_repo=repo)

    assert result.ok is True
    assert result.errors == {}


def test_validate_missing_name_symbol_and_ordering() -> None:
    payload = _valid_payload()
    payload["name"] = " "
    payload["symbol"] = "ETHUSDT"
    payload["start_date"] = "2026-01-10T00:00:00Z"
    payload["end_date"] = "2026-01-01T00:00:00Z"

    actor = SimpleNamespace(id=7, role="User")
    blueprint = SimpleNamespace(UserID=7, ApprovalState="Draft")
    repo = _BlueprintRepoStub(blueprint)

    result = ExperimentValidator.validate(
        payload, actor=actor, blueprint_repo=repo)

    assert result.ok is False
    assert "name" in result.errors
    assert "symbol" in result.errors
    assert "dateRange" in result.errors


def test_validate_split_numeric_total_and_minimum_constraints() -> None:
    payload = _valid_payload()
    payload["train_split"] = "bad"
    payload["val_split"] = 5
    payload["test_split"] = 5

    actor = SimpleNamespace(id=7, role="User")
    blueprint = SimpleNamespace(UserID=7, ApprovalState="Draft")
    repo = _BlueprintRepoStub(blueprint)

    result = ExperimentValidator.validate(
        payload, actor=actor, blueprint_repo=repo)

    assert result.ok is False
    assert "trainSplit" in result.errors
    assert "valSplit" in result.errors
    assert "testSplit" in result.errors


def test_validate_split_total_error_when_not_one() -> None:
    payload = _valid_payload()
    payload["train_split"] = 70
    payload["val_split"] = 10
    payload["test_split"] = 10

    actor = SimpleNamespace(id=7, role="User")
    blueprint = SimpleNamespace(UserID=7, ApprovalState="Draft")
    repo = _BlueprintRepoStub(blueprint)

    result = ExperimentValidator.validate(
        payload, actor=actor, blueprint_repo=repo)

    assert result.ok is False
    assert "splitTotal" in result.errors
    assert result.errors["splitTotal"] == [
        "Train + Validation + Test must total 100%."]


def test_validate_interval_accepts_rfc009_supported_values() -> None:
    payload = _valid_payload()
    payload["interval"] = "4h"

    actor = SimpleNamespace(id=7, role="User")
    blueprint = SimpleNamespace(UserID=7, ApprovalState="Draft")
    repo = _BlueprintRepoStub(blueprint)

    result = ExperimentValidator.validate(
        payload, actor=actor, blueprint_repo=repo)

    assert result.ok is True
    assert result.errors == {}


def test_validate_blueprint_not_found_or_not_accessible() -> None:
    payload = _valid_payload()
    actor = SimpleNamespace(id=7, role="User")

    missing_repo = _BlueprintRepoStub(None)
    missing_result = ExperimentValidator.validate(
        payload, actor=actor, blueprint_repo=missing_repo)
    assert missing_result.ok is False
    assert "blueprintId" in missing_result.errors

    foreign_repo = _BlueprintRepoStub(SimpleNamespace(UserID=99, ApprovalState="Draft"))
    foreign_result = ExperimentValidator.validate(
        payload, actor=actor, blueprint_repo=foreign_repo)
    assert foreign_result.ok is False
    assert "blueprintId" in foreign_result.errors

    for state in ("Draft", "Pending", "Rejected"):
        result = ExperimentValidator.validate(
            payload,
            actor=actor,
            blueprint_repo=_BlueprintRepoStub(SimpleNamespace(UserID=99, ApprovalState=state)),
        )
        assert result.ok is False
        assert result.errors["blueprintId"] == ["Blueprint is not accessible."]


def test_validate_allows_approved_blueprint_for_non_owner() -> None:
    payload = _valid_payload()
    actor = SimpleNamespace(id=7, role="User")
    blueprint = SimpleNamespace(UserID=99, ApprovalState="Approved")
    repo = _BlueprintRepoStub(blueprint)

    result = ExperimentValidator.validate(
        payload, actor=actor, blueprint_repo=repo)

    assert result.ok is True
    assert result.errors == {}


def test_validate_allows_staff_for_non_owned_blueprint() -> None:
    payload = _valid_payload()
    actor = SimpleNamespace(id=7, role="Moderator")
    blueprint = SimpleNamespace(UserID=99, ApprovalState="Draft")
    repo = _BlueprintRepoStub(blueprint)

    result = ExperimentValidator.validate(
        payload, actor=actor, blueprint_repo=repo)

    assert result.ok is True
    assert result.errors == {}


def test_validate_override_constraints() -> None:
    payload = _valid_payload()
    payload["parameter_overrides"] = "not-an-object"

    actor = SimpleNamespace(id=7)
    blueprint = SimpleNamespace(UserID=7)
    repo = _BlueprintRepoStub(blueprint)

    result = ExperimentValidator.validate(
        payload, actor=actor, blueprint_repo=repo)
    assert result.ok is False
    assert "parameterOverrides" in result.errors


def test_validate_override_rejects_unsupported_nested_value_type() -> None:
    payload = _valid_payload()
    payload["parameter_overrides"] = {"bad": set([1, 2])}

    actor = SimpleNamespace(id=7)
    blueprint = SimpleNamespace(UserID=7)
    repo = _BlueprintRepoStub(blueprint)

    result = ExperimentValidator.validate(
        payload, actor=actor, blueprint_repo=repo)

    assert result.ok is False
    assert "parameterOverrides.bad" in result.errors


def test_validate_candlestick_mode_requires_end_date_and_positive_integer_amount() -> None:
    payload = _valid_payload()
    payload["start_date"] = None
    payload["end_date"] = None
    payload["candlestick_amount"] = 0

    actor = SimpleNamespace(id=7)
    blueprint = SimpleNamespace(UserID=7)
    repo = _BlueprintRepoStub(blueprint)

    result = ExperimentValidator.validate(
        payload, actor=actor, blueprint_repo=repo)

    assert result.ok is False
    assert "candlestickAmount" in result.errors
    assert "endDate" in result.errors


def test_validate_candlestick_mode_allows_missing_start_date_when_valid() -> None:
    payload = _valid_payload()
    payload["start_date"] = None
    payload["end_date"] = "2026-01-10T00:00:00Z"
    payload["candlestick_amount"] = 1000

    actor = SimpleNamespace(id=7)
    blueprint = SimpleNamespace(UserID=7)
    repo = _BlueprintRepoStub(blueprint)

    result = ExperimentValidator.validate(
        payload, actor=actor, blueprint_repo=repo)

    assert result.ok is True
    assert result.errors == {}
