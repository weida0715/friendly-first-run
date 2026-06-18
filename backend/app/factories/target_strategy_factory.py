"""RFC-facing target strategy factory metadata."""

from __future__ import annotations

from typing import Any

from app.strategies.target_strategy import TargetStrategyFactory as StrategyTargetFactory


class TargetStrategyFactory(StrategyTargetFactory):
    @classmethod
    def metadata(cls, name: str) -> dict[str, Any]:
        strategy_cls = cls._STRATEGIES.get(name)
        if strategy_cls is None:
            raise ValueError(f"Unsupported target strategy: {name}")
        return {
            "name": strategy_cls.target_name,
            "parameter_schema": strategy_cls.parameter_schema,
            "parameterSchema": strategy_cls.parameter_schema,
            "parameter_constraints": strategy_cls.parameter_constraints,
            "parameterConstraints": strategy_cls.parameter_constraints,
            "default_values": strategy_cls.default_values,
            "defaultValues": strategy_cls.default_values,
            "output_column": strategy_cls.output_column,
            "outputColumn": strategy_cls.output_column,
            "binary_label_rule": strategy_cls.binary_label_rule,
            "binaryLabelRule": strategy_cls.binary_label_rule,
        }

    @classmethod
    def list_metadata(cls) -> list[dict[str, Any]]:
        return [cls.metadata(name) for name in cls._STRATEGIES]
