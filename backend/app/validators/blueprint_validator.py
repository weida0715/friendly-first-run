"""Blueprint payload validator for architecture/indicator Blueprint flow."""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from app.domain.value_objects.validation_result import ValidationResult
from app.factories.architecture_factory import ArchitectureFactory
from app.factories.indicator_factory import IndicatorFactory


class BlueprintValidator:
    """Validates Blueprint creation payloads against shared factory constraints."""

    @classmethod
    def validate(cls, payload: dict[str, Any]) -> ValidationResult:
        errors: dict[str, list[str]] = defaultdict(list)

        metadata = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
        if payload.get("metadata") is not None and not isinstance(payload.get("metadata"), dict):
            errors["metadata"].append("Metadata must be an object.")
        name = metadata.get("name")
        if not isinstance(name, str) or not name.strip():
            errors["metadata.name"].append("Blueprint name is required.")

        architecture = payload.get("architecture")
        if architecture is None:
            architecture = {}
        elif not isinstance(architecture, dict):
            errors["architecture"].append("Architecture must be an object.")
            architecture = {}
        architecture_name = architecture.get("name") or architecture.get("reference")
        safety_profile = architecture.get("safety_profile")
        if safety_profile is not None and safety_profile not in {"conservative", "balanced", "aggressive"}:
            errors["architecture.safety_profile"].append(f"Unsupported safety profile '{safety_profile}'.")
        settings = architecture.get("settings")
        if settings is not None and not isinstance(settings, dict):
            errors["architecture.settings"].append("Architecture settings must be an object.")
        elif isinstance(settings, dict):
            for key, value in settings.items():
                if isinstance(value, (dict, list, tuple, set)):
                    errors[f"architecture.settings.{key}"].append("Architecture setting must be a scalar value.")
        if not isinstance(architecture_name, str) or not architecture_name.strip():
            errors["architecture.name"].append("Architecture is required.")
        else:
            try:
                params = architecture.get("parameters") or architecture.get("settings") or {}
                for key, values in ArchitectureFactory.validate_parameters(architecture_name, params).items():
                    errors[key].extend(values)
            except ValueError as exc:
                message = str(exc)
                errors["architecture.name"].append(message)
                errors["architecture.reference"].append(message)

        indicators = payload.get("indicators")
        if indicators is None:
            indicators = {}
        elif not isinstance(indicators, dict):
            errors["indicators"].append("Indicators must be an object.")
            indicators = {}
        selected = indicators.get("selected") or []
        if not isinstance(selected, list):
            errors["indicators.selected"].append("Selected indicators must be a list.")
            selected = []
        for key, values in IndicatorFactory.validate_selected([str(item) for item in selected]).items():
            errors[key].extend(values)

        parameter_ranges = payload.get("parameter_ranges")
        if parameter_ranges is not None and not isinstance(parameter_ranges, dict):
            errors["parameter_ranges"].append("Parameter ranges must be an object.")
        elif isinstance(parameter_ranges, dict):
            for range_key, range_value in parameter_ranges.items():
                if range_key == "extra" and isinstance(range_value, dict):
                    for extra_key, extra_value in range_value.items():
                        cls._validate_min_max(f"parameter_ranges.extra.{extra_key}", extra_value, errors)
                    continue
                cls._validate_min_max(f"parameter_ranges.{range_key}", range_value, errors)

        if errors:
            return ValidationResult(ok=False, errors=dict(errors))
        return ValidationResult.success()

    @staticmethod
    def _validate_min_max(field_key: str, value: Any, errors: dict[str, list[str]]) -> None:
        if not isinstance(value, dict):
            errors[field_key].append("Range must be an object with min and max.")
            return
        if "min" not in value or "max" not in value:
            errors[field_key].append("Range must include both min and max.")
            return
        min_value = value.get("min")
        max_value = value.get("max")
        if min_value in (None, "") or max_value in (None, ""):
            errors[field_key].append("Range min and max cannot be empty.")
            return
        try:
            min_numeric = float(min_value)
            max_numeric = float(max_value)
        except (TypeError, ValueError):
            errors[field_key].append("Range min and max must be numeric.")
            return
        if min_numeric > max_numeric:
            errors[field_key].append("Range min cannot be greater than max.")
