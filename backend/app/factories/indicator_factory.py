"""Factory metadata for Blueprint indicator configuration."""

from __future__ import annotations

from typing import Any

from app.strategies.indicators.custom_indicator_strategy import CustomIndicatorFactory
from app.strategies.indicators.ichimoku_cloud import IchimokuCloudIndicator
from app.strategies.indicators.quantile_flag import QuantileFlagIndicator
from app.strategies.indicators.vwap import VWAPIndicator
from app.factories.talib_registry import TALIB_INDICATOR_REGISTRY, parameter_constraints


class IndicatorFactory:
    _CUSTOM = {
        "vwap": VWAPIndicator,
        "ichimoku_cloud": IchimokuCloudIndicator,
        "quantile_flag": QuantileFlagIndicator,
    }

    @classmethod
    def create(cls, name: str):
        return CustomIndicatorFactory.create(name)

    @classmethod
    def metadata(cls, name: str) -> dict[str, Any]:
        indicator_cls = cls._CUSTOM.get(name)
        if indicator_cls is None:
            if name and name.upper() in TALIB_INDICATOR_REGISTRY:
                return cls._talib_metadata(name.upper())
            raise ValueError(f"Unsupported indicator: {name}")
        return {
            "name": indicator_cls.indicator_name,
            "display_name": getattr(indicator_cls, "name", indicator_cls.indicator_name),
            "displayName": getattr(indicator_cls, "name", indicator_cls.indicator_name),
            "source": "custom",
            "parameter_schema": indicator_cls.parameter_schema,
            "parameterSchema": indicator_cls.parameter_schema,
            "parameter_constraints": indicator_cls.parameter_constraints,
            "parameterConstraints": indicator_cls.parameter_constraints,
            "default_values": indicator_cls.default_values,
            "defaultValues": indicator_cls.default_values,
            "output_columns": list(indicator_cls.output_columns),
            "outputColumns": list(indicator_cls.output_columns),
            "warmup_period": indicator_cls.warmup_period,
            "warmupPeriod": indicator_cls.warmup_period,
        }

    @classmethod
    def list_metadata(cls) -> list[dict[str, Any]]:
        custom = [cls.metadata(name) for name in cls._CUSTOM]
        talib = [cls.metadata(name)
                 for name in sorted(TALIB_INDICATOR_REGISTRY)]
        return custom + talib

    @classmethod
    def _talib_metadata(cls, name: str) -> dict[str, Any]:
        spec = TALIB_INDICATOR_REGISTRY[name]
        constraints = parameter_constraints(spec.parameters)
        schema = {key: rule["type"] for key, rule in constraints.items()}
        return {
            "name": name,
            "display_name": name,
            "displayName": name,
            "source": "ta-lib",
            "category": spec.category,
            "sql_inputs": spec.sql_inputs,
            "sqlInputs": spec.sql_inputs,
            "talib_inputs": list(spec.talib_inputs),
            "talibInputs": list(spec.talib_inputs),
            "parameter_schema": schema,
            "parameterSchema": schema,
            "parameter_constraints": constraints,
            "parameterConstraints": constraints,
            "default_values": dict(spec.parameters),
            "defaultValues": dict(spec.parameters),
            "output_columns": [name.lower()],
            "outputColumns": [name.lower()],
            "warmup_period": int(spec.parameters.get("timeperiod", 0) or 0),
            "warmupPeriod": int(spec.parameters.get("timeperiod", 0) or 0),
        }

    @classmethod
    def validate_selected(cls, selected: list[str]) -> dict[str, list[str]]:
        errors: dict[str, list[str]] = {}
        for name in selected:
            try:
                cls.metadata(name)
            except ValueError:
                errors.setdefault("indicators.selected", []).append(
                    f"Unsupported indicator '{name}'.")
        return errors
