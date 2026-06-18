"""Normalize Blueprint wizard payloads into persisted Blueprint JSON."""

from __future__ import annotations

from typing import Any

from app.factories.architecture_factory import ArchitectureFactory
from app.factories.indicator_factory import IndicatorFactory


class BlueprintFactory:
    @classmethod
    def normalize_payload(cls, payload: dict[str, Any]) -> dict[str, Any]:
        architecture = payload.get("architecture") or {}
        architecture_name = architecture.get("name") or architecture.get("reference")
        architecture_params = architecture.get("parameters") or architecture.get("settings") or {}
        architecture_metadata = ArchitectureFactory.metadata(architecture_name)

        indicators = payload.get("indicators") or {}
        selected = list(indicators.get("selected") or [])
        indicator_params = indicators.get("parameters") or indicators.get("params") or indicators.get("config") or {}
        indicator_metadata = {name: IndicatorFactory.metadata(name) for name in selected}

        return {
            "architecture": {
                "name": architecture_metadata["name"],
                "display_name": architecture_metadata["display_name"],
                "parameters": {**architecture_metadata["default_values"], **architecture_params},
                "parameter_constraints": architecture_metadata["parameter_constraints"],
                "prediction_output_shape": architecture_metadata["prediction_output_shape"],
                "supports_probabilities": architecture_metadata["supports_probabilities"],
                "legacy_reference": architecture.get("reference"),
            },
            "indicators": {
                "selected": selected,
                "parameters": {
                    name: {**indicator_metadata[name]["default_values"], **(indicator_params.get(name) or {})}
                    for name in selected
                },
                "parameter_constraints": {name: indicator_metadata[name]["parameter_constraints"] for name in selected},
                "definitions": list(indicator_metadata.values()),
            },
            "features": {"indicator_outputs": [col for meta in indicator_metadata.values() for col in meta["output_columns"]]},
        }
