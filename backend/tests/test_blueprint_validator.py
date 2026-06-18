from __future__ import annotations

from app.validators.blueprint_validator import BlueprintValidator


def _valid_payload() -> dict:
    return {
        "metadata": {"name": "Momentum Blueprint"},
        "indicators": {"selected": ["rsi", "macd"]},
        "architecture": {
            "reference": "logreg_binary",
            "safety_profile": "balanced",
            "settings": {"max_iter": 200, "fit_intercept": True},
        },
        "parameter_ranges": {
            "learning_rate": {"min": 0.001, "max": 0.1},
            "window_size": {"min": 10, "max": 50},
            "extra": {"threshold": {"min": 0.2, "max": 0.8}},
        },
    }


def test_validate_success_payload() -> None:
    result = BlueprintValidator.validate(_valid_payload())

    assert result.ok is True
    assert result.errors == {}


def test_validate_missing_name() -> None:
    payload = _valid_payload()
    payload["metadata"]["name"] = " "

    result = BlueprintValidator.validate(payload)

    assert result.ok is False
    assert "metadata.name" in result.errors


def test_validate_unsupported_indicator() -> None:
    payload = _valid_payload()
    payload["indicators"]["selected"] = ["rsi", "unknown_indicator"]

    result = BlueprintValidator.validate(payload)

    assert result.ok is False
    assert "indicators.selected" in result.errors


def test_validate_invalid_range_shape_and_order() -> None:
    payload = _valid_payload()
    payload["parameter_ranges"] = {
        "learning_rate": {"min": 0.5, "max": 0.1},
        "window_size": {"min": "", "max": 20},
    }

    result = BlueprintValidator.validate(payload)

    assert result.ok is False
    assert "parameter_ranges.learning_rate" in result.errors
    assert "parameter_ranges.window_size" in result.errors


def test_validate_unsupported_architecture() -> None:
    payload = _valid_payload()
    payload["architecture"]["reference"] = "unsupported_arch"

    result = BlueprintValidator.validate(payload)

    assert result.ok is False
    assert "architecture.reference" in result.errors


def test_validate_invalid_architecture_settings_type() -> None:
    payload = _valid_payload()
    payload["architecture"]["settings"] = {"nested": {"not": "allowed"}}

    result = BlueprintValidator.validate(payload)

    assert result.ok is False
    assert "architecture.settings.nested" in result.errors


def test_validate_collects_multiple_errors() -> None:
    payload = {
        "metadata": {"name": ""},
        "indicators": {"selected": ["bad"]},
        "architecture": {
            "reference": "bad_ref",
            "safety_profile": "unsafe_mode",
            "settings": "not-a-dict",
        },
        "parameter_ranges": {
            "learning_rate": {"min": "a", "max": 2},
        },
    }

    result = BlueprintValidator.validate(payload)

    assert result.ok is False
    assert "metadata.name" in result.errors
    assert "indicators.selected" in result.errors
    assert "architecture.reference" in result.errors
    assert "architecture.safety_profile" in result.errors
    assert "architecture.settings" in result.errors
    assert "parameter_ranges.learning_rate" in result.errors


def test_validate_rejects_non_object_sections_without_crashing() -> None:
    payload = {
        "metadata": [],
        "indicators": "invalid",
        "architecture": ["bad"],
        "parameter_ranges": "oops",
    }

    result = BlueprintValidator.validate(payload)

    assert result.ok is False
    assert "metadata" in result.errors
    assert "indicators" in result.errors
    assert "architecture" in result.errors
    assert "parameter_ranges" in result.errors
