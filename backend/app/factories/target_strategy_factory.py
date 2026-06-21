"""RFC-facing target strategy factory metadata."""

from __future__ import annotations

import importlib
import pkgutil
from functools import lru_cache
from typing import Any

from app.strategies.target_strategy import TargetStrategyFactory as StrategyTargetFactory
from app.strategies.targets.base import TargetStrategy
import app.strategies.targets as target_strategy_package


class TargetStrategyFactory(StrategyTargetFactory):
    @classmethod
    @lru_cache(maxsize=1)
    def _discovered_strategies(cls) -> dict[str, type[TargetStrategy]]:
        strategies: dict[str, type[TargetStrategy]] = {}
        for module_info in pkgutil.iter_modules(target_strategy_package.__path__):
            if module_info.name.startswith("_"):
                continue
            importlib.import_module(f"{target_strategy_package.__name__}.{module_info.name}")

        for strategy_cls in TargetStrategy.__subclasses__():
            name = getattr(strategy_cls, "target_name", "")
            if name:
                strategies[name] = strategy_cls
        return strategies

    @classmethod
    def metadata(cls, name: str) -> dict[str, Any]:
        strategy_cls = cls._discovered_strategies().get(name)
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
        return [cls.metadata(name) for name in sorted(cls._discovered_strategies())]

    @classmethod
    def create(cls, name: str | None, params: dict | None = None, *, allow_preview_lookahead_zero: bool = False) -> TargetStrategy:
        strategy_name = name or "forward_return"
        strategy_cls = cls._discovered_strategies().get(strategy_name)
        if strategy_cls is None:
            raise ValueError(f"Unsupported target strategy: {strategy_name}")
        if allow_preview_lookahead_zero and int((params or {}).get("lookahead_period", 1) or 0) == 0:
            strategy = strategy_cls.__new__(strategy_cls)
            for key, value in (params or {}).items():
                setattr(strategy, key, value)
            return strategy
        return strategy_cls(**(params or {}))
