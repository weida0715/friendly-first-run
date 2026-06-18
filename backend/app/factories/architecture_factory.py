"""Factory and metadata registry for model architectures."""

from __future__ import annotations

from typing import Any

from app.architectures import LogisticRegressorArchitecture, RidgeClassifierArchitecture


class ArchitectureFactory:
    _ARCHITECTURES = {
        LogisticRegressorArchitecture.name: LogisticRegressorArchitecture,
        RidgeClassifierArchitecture.name: RidgeClassifierArchitecture,
        # Compatibility alias for older RFC-005 payloads.
        "logreg_binary": LogisticRegressorArchitecture,
    }

    @classmethod
    def create(cls, name: str | None):
        architecture_name = name or LogisticRegressorArchitecture.name
        try:
            return cls._ARCHITECTURES[architecture_name]()
        except KeyError as exc:
            raise ValueError(
                f"Unsupported architecture: {architecture_name}") from exc

    @classmethod
    def metadata(cls, name: str) -> dict[str, Any]:
        architecture_cls = cls._ARCHITECTURES.get(name)
        if architecture_cls is None:
            raise ValueError(f"Unsupported architecture: {name}")
        return cls._metadata_for(architecture_cls)

    @classmethod
    def list_metadata(cls) -> list[dict[str, Any]]:
        canonical = [LogisticRegressorArchitecture,
                     RidgeClassifierArchitecture]
        return [cls._metadata_for(item) for item in canonical]

    @staticmethod
    def _metadata_for(architecture_cls) -> dict[str, Any]:
        return {
            "name": architecture_cls.name,
            "display_name": architecture_cls.display_name,
            "displayName": architecture_cls.display_name,
            "hyperparameters": architecture_cls.hyperparameter_constraints,
            "parameter_constraints": architecture_cls.hyperparameter_constraints,
            "parameterConstraints": architecture_cls.hyperparameter_constraints,
            "default_values": architecture_cls.default_values,
            "defaultValues": architecture_cls.default_values,
            "prediction_output_shape": architecture_cls.prediction_output_shape,
            "predictionOutputShape": architecture_cls.prediction_output_shape,
            "supports_probabilities": architecture_cls.supports_probabilities,
            "supportsProbabilities": architecture_cls.supports_probabilities,
        }

    @classmethod
    def validate_parameters(cls, name: str, params: dict[str, Any]) -> dict[str, list[str]]:
        metadata = cls.metadata(name)
        return _validate_params(params, metadata["parameter_constraints"], f"architecture.parameters")


def _validate_params(params: dict[str, Any], constraints: dict[str, dict[str, Any]], prefix: str) -> dict[str, list[str]]:
    errors: dict[str, list[str]] = {}
    for key, rule in constraints.items():
        value = params.get(key, rule.get("default"))
        if rule.get("required") and value in (None, ""):
            errors.setdefault(f"{prefix}.{key}", []).append(
                "This parameter is required.")
            continue
        if value in (None, ""):
            continue
        kind = rule.get("type")
        values = _candidate_values(value)
        for candidate in values:
            try:
                numeric = float(candidate) if kind in {
                    "number", "integer"} else None
            except (TypeError, ValueError):
                errors.setdefault(f"{prefix}.{key}", []).append(
                    "Parameter must be numeric.")
                break
            if kind == "integer" and numeric is not None and not float(numeric).is_integer():
                errors.setdefault(f"{prefix}.{key}", []).append(
                    "Parameter must be an integer.")
                break
            if numeric is not None and "min" in rule and numeric < float(rule["min"]):
                errors.setdefault(f"{prefix}.{key}", []).append(
                    f"Parameter must be >= {rule['min']}.")
                break
            if numeric is not None and "max" in rule and numeric > float(rule["max"]):
                errors.setdefault(f"{prefix}.{key}", []).append(
                    f"Parameter must be <= {rule['max']}.")
                break
            allowed = rule.get("allowed_values")
            if allowed is not None:
                normalized = None if str(candidate).lower() in {
                    "none", "null"} else candidate
                if normalized not in allowed:
                    errors.setdefault(f"{prefix}.{key}", []).append(
                        f"Parameter must be one of {allowed}.")
                    break
    return errors


def _candidate_values(value: Any) -> list[Any]:
    if isinstance(value, str) and "," in value:
        return [item.strip() for item in value.split(",") if item.strip()]
    return [value]
