from __future__ import annotations

from statistics import mean, pstdev
from typing import Any

import polars as pl

from app.strategies.trading_strategy import BacktestResult, TradingStrategy

BACKTEST_FIELDS = ["trade_win_rate_pct", "trade_expectancy_pct", "max_drawdown_pct", "total_return_gross_pct", "total_return_net_pct", "trade_return_mean_win_pct", "trade_return_mean_loss_pct", "bars_total", "sharpe_per_bar", "bars_in_market_pct", "trades_count", "cost_round_trip_bps"]


def _pct(x: float) -> float:
    return float(x) * 100.0


def _safe_mean(xs: list[float]) -> float | None:
    return float(mean(xs)) if xs else None


class LongOnlySinglePositionStrategy(TradingStrategy):
    """Long-only strategy that holds one position while predictions stay positive."""

    def run(self, test_df: pl.LazyFrame, preds: dict[str, Any], cfg: dict[str, Any]) -> BacktestResult:
        rows = test_df.select([pl.col("timestamp"), pl.col("close").cast(pl.Float64)]).collect().to_dicts()
        pred_values = list(preds.get("_preds") or [])[: len(rows)]
        cost_bps = float(cfg.get("cost_round_trip_bps", 0.0) or 0.0)
        execution_lag_bars = max(0, int(cfg.get("execution_lag_bars", 1) or 0))
        trades: list[dict[str, Any]] = []
        in_pos = False
        entry_idx = 0
        entry_price = 0.0
        bars_in_market = 0

        def execution_index(signal_index: int) -> int | None:
            idx = signal_index + execution_lag_bars
            return idx if 0 <= idx < len(rows) else None

        def close_trade(signal_index: int) -> None:
            nonlocal in_pos, entry_idx, entry_price
            exit_idx = execution_index(signal_index)
            if exit_idx is None:
                exit_idx = len(rows) - 1
            if exit_idx <= entry_idx:
                return
            exit_price = float(rows[exit_idx]["close"])
            gross = (exit_price - entry_price) / entry_price if entry_price else 0.0
            net = gross - (cost_bps / 10000.0)
            trades.append({
                "entry_index": entry_idx,
                "exit_index": exit_idx,
                "side": "long",
                "gross_return_pct": _pct(gross),
                "net_return_pct": _pct(net),
            })
            in_pos = False

        for i in range(len(rows)):
            pred = int(pred_values[i] if i < len(pred_values) else 0)
            if in_pos:
                bars_in_market += 1
            if not in_pos and pred == 1:
                fill_idx = execution_index(i)
                if fill_idx is None:
                    continue
                in_pos = True
                entry_idx = fill_idx
                entry_price = float(rows[entry_idx]["close"])
            elif in_pos and pred == 0:
                close_trade(i)

        if in_pos and rows:
            close_trade(len(rows) - 1)

        gross_returns = [t["gross_return_pct"] for t in trades]
        net_returns = [t["net_return_pct"] for t in trades]
        wins = [r for r in net_returns if r > 0]
        losses = [r for r in net_returns if r <= 0]
        equity = 1.0
        peak = 1.0
        max_dd = 0.0
        for r in net_returns:
            equity *= 1.0 + (r / 100.0)
            peak = max(peak, equity)
            max_dd = min(max_dd, (equity / peak) - 1.0 if peak else 0.0)
        sharpe = None
        if len(net_returns) > 1 and pstdev(net_returns) > 0:
            # RFC field name is kept for compatibility; value is trade-level Sharpe.
            sharpe = mean(net_returns) / pstdev(net_returns)
        metrics = {
            "trade_win_rate_pct": _pct(len(wins) / len(trades)) if trades else 0.0,
            "trade_expectancy_pct": _safe_mean(net_returns) or 0.0,
            "max_drawdown_pct": abs(_pct(max_dd)),
            "total_return_gross_pct": sum(gross_returns),
            "total_return_net_pct": sum(net_returns),
            "trade_return_mean_win_pct": _safe_mean(wins),
            "trade_return_mean_loss_pct": _safe_mean(losses),
            "bars_total": len(rows),
            "sharpe_per_bar": sharpe,
            "bars_in_market_pct": _pct(bars_in_market / len(rows)) if rows else 0.0,
            "trades_count": len(trades),
            "cost_round_trip_bps": cost_bps,
        }
        return BacktestResult(metrics={k: metrics[k] for k in BACKTEST_FIELDS}, trades=trades)
