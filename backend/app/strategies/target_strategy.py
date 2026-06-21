"""Compatibility exports and factory for target strategies."""

from __future__ import annotations

import importlib
import pkgutil
from functools import lru_cache

from app.strategies.targets.base import TargetStrategy
import app.strategies.targets as target_strategy_package


class TargetStrategyFactory:
    @classmethod
    @lru_cache(maxsize=1)
    def _strategies(cls) -> dict[str, type[TargetStrategy]]:
        for module_info in pkgutil.iter_modules(target_strategy_package.__path__):
            if module_info.name.startswith("_"):
                continue
            importlib.import_module(f"{target_strategy_package.__name__}.{module_info.name}")

        strategies: dict[str, type[TargetStrategy]] = {}
        for strategy_cls in TargetStrategy.__subclasses__():
            name = getattr(strategy_cls, "target_name", "")
            if name:
                strategies[name] = strategy_cls
        return strategies

    @classmethod
    def create(cls, name: str | None, params: dict | None = None) -> TargetStrategy:
        strategy_name = name or "forward_return"
        try:
            return cls._strategies()[strategy_name](**(params or {}))
        except KeyError as exc:
            raise ValueError(f"Unsupported target strategy: {strategy_name}") from exc
