"""Trade-quality target strategies."""

from __future__ import annotations

import polars as pl

from app.strategies.targets.base import TargetStrategy


def _collect_frame(df: pl.LazyFrame) -> pl.DataFrame:
    frame = df.collect()
    if "timestamp" in frame.columns:
        frame = frame.sort("timestamp")
    return frame


def _append_target(frame: pl.DataFrame, labels: list[int | None]) -> pl.LazyFrame:
    return frame.with_columns(pl.Series("target", labels, dtype=pl.Int8)).lazy()


def _future_window_scores(frame: pl.DataFrame) -> tuple[list[float], list[float], list[float]]:
    closes = frame.get_column("close").cast(pl.Float64).to_list()
    highs = frame.get_column("high").cast(pl.Float64).to_list()
    lows = frame.get_column("low").cast(pl.Float64).to_list()
    return closes, highs, lows


class CostAdjustedForwardReturnTargetStrategy(TargetStrategy):
    """Generate `target=1` when forward return clears a cost buffer."""

    target_name = "cost_adjusted_forward_return"
    parameter_schema = {"lookahead_period": "integer", "cost_bps": "number"}
    parameter_constraints = {"lookahead_period": {"min": 1, "max": 1440}, "cost_bps": {"min": 0.0, "max": 10_000.0}}
    default_values = {"lookahead_period": 1, "cost_bps": 15.0}
    binary_label_rule = "1 when close[t+lookahead] / close[t] - 1 > cost_bps / 10000, otherwise 0"

    def __init__(self, lookahead_period: int = 1, cost_bps: float = 15.0) -> None:
        if lookahead_period < 1:
            raise ValueError("lookahead_period must be >= 1")
        if cost_bps < 0:
            raise ValueError("cost_bps must be >= 0")
        self.lookahead_period = lookahead_period
        self.cost_bps = cost_bps

    def generate(self, df: pl.LazyFrame) -> pl.LazyFrame:
        threshold = self.cost_bps / 10_000.0
        future_return = (
            pl.col("close").shift(-self.lookahead_period).cast(pl.Float64) / pl.col("close").cast(pl.Float64)
        ) - 1.0
        return df.with_columns((future_return > threshold).cast(pl.Int8).alias(self.output_column))


class TripleBarrierTargetStrategy(TargetStrategy):
    """Generate `target=1` when take-profit is hit before stop-loss."""

    target_name = "triple_barrier"
    parameter_schema = {"lookahead_period": "integer", "take_profit": "number", "stop_loss": "number"}
    parameter_constraints = {
        "lookahead_period": {"min": 1, "max": 1440},
        "take_profit": {"min": 0.0, "max": 1.0},
        "stop_loss": {"min": 0.0, "max": 1.0},
    }
    default_values = {"lookahead_period": 5, "take_profit": 0.006, "stop_loss": 0.004}
    binary_label_rule = "1 when future high hits take_profit before future low hits stop_loss within lookahead_period bars, otherwise 0"

    def __init__(self, lookahead_period: int = 5, take_profit: float = 0.006, stop_loss: float = 0.004) -> None:
        if lookahead_period < 1:
            raise ValueError("lookahead_period must be >= 1")
        if take_profit <= 0:
            raise ValueError("take_profit must be > 0")
        if stop_loss <= 0:
            raise ValueError("stop_loss must be > 0")
        self.lookahead_period = lookahead_period
        self.take_profit = take_profit
        self.stop_loss = stop_loss

    def generate(self, df: pl.LazyFrame) -> pl.LazyFrame:
        frame = _collect_frame(df)
        closes, highs, lows = _future_window_scores(frame)
        labels: list[int | None] = []

        for index, entry in enumerate(closes):
            if index + self.lookahead_period >= len(closes):
                labels.append(None)
                continue

            take_profit_price = entry * (1.0 + self.take_profit)
            stop_loss_price = entry * (1.0 - self.stop_loss)
            label = 0

            for future_index in range(index + 1, index + self.lookahead_period + 1):
                high = highs[future_index]
                low = lows[future_index]
                tp_hit = high >= take_profit_price
                sl_hit = low <= stop_loss_price
                if tp_hit and sl_hit:
                    # ponytail: same-candle double hits resolve as a loss; intrabar order is unknowable from OHLC.
                    label = 0
                    break
                if tp_hit:
                    label = 1
                    break
                if sl_hit:
                    label = 0
                    break

            labels.append(label)

        return _append_target(frame, labels)


class VolatilityAdjustedForwardReturnTargetStrategy(TargetStrategy):
    """Generate `target=1` when forward return beats recent volatility."""

    target_name = "volatility_adjusted_forward_return"
    parameter_schema = {
        "lookahead_period": "integer",
        "volatility_period": "integer",
        "volatility_multiplier": "number",
    }
    parameter_constraints = {
        "lookahead_period": {"min": 1, "max": 1440},
        "volatility_period": {"min": 2, "max": 1440},
        "volatility_multiplier": {"min": 0.0, "max": 100.0},
    }
    default_values = {"lookahead_period": 5, "volatility_period": 20, "volatility_multiplier": 0.75}
    binary_label_rule = "1 when future return exceeds volatility_multiplier times recent rolling volatility, otherwise 0"

    def __init__(self, lookahead_period: int = 5, volatility_period: int = 20, volatility_multiplier: float = 0.75) -> None:
        if lookahead_period < 1:
            raise ValueError("lookahead_period must be >= 1")
        if volatility_period < 2:
            raise ValueError("volatility_period must be >= 2")
        if volatility_multiplier < 0:
            raise ValueError("volatility_multiplier must be >= 0")
        self.lookahead_period = lookahead_period
        self.volatility_period = volatility_period
        self.volatility_multiplier = volatility_multiplier

    def generate(self, df: pl.LazyFrame) -> pl.LazyFrame:
        returns = pl.col("close").cast(pl.Float64).pct_change()
        volatility = returns.rolling_std(self.volatility_period).shift(1)
        future_return = (
            pl.col("close").shift(-self.lookahead_period).cast(pl.Float64) / pl.col("close").cast(pl.Float64)
        ) - 1.0
        return df.with_columns(
            (future_return > (volatility * self.volatility_multiplier)).cast(pl.Int8).alias(self.output_column)
        )


class MfeMaeTradeQualityTargetStrategy(TargetStrategy):
    """Generate `target=1` when favorable excursion dominates adverse excursion."""

    target_name = "mfe_mae_trade_quality"
    parameter_schema = {"lookahead_period": "integer", "min_edge": "number"}
    parameter_constraints = {
        "lookahead_period": {"min": 1, "max": 1440},
        "min_edge": {"min": -1.0, "max": 1.0},
    }
    default_values = {"lookahead_period": 5, "min_edge": 0.0}
    binary_label_rule = "1 when max future upside minus absolute max future downside exceeds min_edge, otherwise 0"

    def __init__(self, lookahead_period: int = 5, min_edge: float = 0.0) -> None:
        if lookahead_period < 1:
            raise ValueError("lookahead_period must be >= 1")
        self.lookahead_period = lookahead_period
        self.min_edge = min_edge

    def generate(self, df: pl.LazyFrame) -> pl.LazyFrame:
        frame = _collect_frame(df)
        closes, highs, lows = _future_window_scores(frame)
        labels: list[int | None] = []

        for index, entry in enumerate(closes):
            if index + self.lookahead_period >= len(closes):
                labels.append(None)
                continue

            future_highs = highs[index + 1 : index + self.lookahead_period + 1]
            future_lows = lows[index + 1 : index + self.lookahead_period + 1]
            if not future_highs or not future_lows:
                labels.append(None)
                continue

            future_high = max(future_highs)
            future_low = min(future_lows)
            mfe = future_high / entry - 1.0
            mae = future_low / entry - 1.0
            score = mfe - abs(mae)
            labels.append(1 if score > self.min_edge else 0)

        return _append_target(frame, labels)
