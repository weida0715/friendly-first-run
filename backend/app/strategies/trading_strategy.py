"""Trading strategy contracts for experiment backtesting."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

import polars as pl


@dataclass(frozen=True)
class BacktestResult:
    """Container for backtest outputs and summary metrics."""

    metrics: dict[str, Any]
    trades: list[dict[str, Any]]


class TradingStrategy(ABC):
    """Defines how predictions are translated into trading outcomes."""

    @abstractmethod
    def run(
        self,
        test_df: pl.LazyFrame,
        preds: dict[str, Any],
        cfg: dict[str, Any],
    ) -> BacktestResult:
        ...
