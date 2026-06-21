"""Confusion-metrics log builder."""

from __future__ import annotations

from collections.abc import Iterable
import math
from statistics import mean
from typing import Any

from app.strategies.experiment_log_strategy import ExperimentLogStrategy


CONFUSION_FIELDS = [
    "n_kept",
    "tp_count",
    "fp_count",
    "tn_count",
    "fn_count",
    "pred_pos_count",
    "actual_pos_count",
    "precision_pct",
    "recall_pct",
    "f1_score_pct",
    "accuracy_pct",
    "pred_pos_rate_pct",
    "actual_pos_rate_pct",
    "tp_mean_return_pct",
    "fp_mean_return_pct",
    "tn_mean_return_pct",
    "fn_mean_return_pct",
]


class ConfusionMetricsLogStrategy(ExperimentLogStrategy):
    """Build confusion-matrix metrics with optional aligned return stats."""

    def build(self, payload: dict[str, Any]) -> dict[str, Any]:
        y_true = _coerce_binary_series(_first_present(payload, "y_true", "actual"))
        y_pred = _coerce_binary_series(_first_present(payload, "y_pred", "predicted"))
        source = _coerce_float_series(_first_present(payload, "x", "price_change", "returns"))
        price_change = _coerce_float_series(_first_present(payload, "price_change"))
        lag = max(0, _coerce_int(payload.get("execution_lag_bars"), default=1))
        quantiles = payload.get("outlier_quantiles")

        n = min(len(y_true), len(y_pred))
        if len(source) < n:
            source.extend([None] * (n - len(source)))
        if len(price_change) < n:
            price_change.extend([None] * (n - len(price_change)))
        y_true = y_true[:n]
        y_pred = y_pred[:n]
        source = source[:n]
        price_change = price_change[:n]

        aligned_returns = _aligned_returns(source, price_change, lag)
        keep = [True] * n
        filter_values = aligned_returns[:]
        if isinstance(quantiles, (tuple, list)) and len(quantiles) == 2:
            low_q = _coerce_float(quantiles[0])
            high_q = _coerce_float(quantiles[1])
            finite_values = [value for value in filter_values if value is not None]
            if low_q is not None and high_q is not None and finite_values:
                lo = _percentile(finite_values, low_q)
                hi = _percentile(finite_values, high_q)
                keep = [
                    value is not None and lo <= value <= hi
                    for value in filter_values
                ]

        rows = [
            (truth, pred, ret)
            for truth, pred, ret, include in zip(y_true, y_pred, aligned_returns, keep, strict=True)
            if include and truth in (0, 1) and pred in (0, 1)
        ]

        total = len(rows)
        tp = sum(1 for truth, pred, _ in rows if truth == 1 and pred == 1)
        fp = sum(1 for truth, pred, _ in rows if truth == 0 and pred == 1)
        tn = sum(1 for truth, pred, _ in rows if truth == 0 and pred == 0)
        fn = sum(1 for truth, pred, _ in rows if truth == 1 and pred == 0)

        tp_returns = [ret for truth, pred, ret in rows if truth == 1 and pred == 1 and ret is not None]
        fp_returns = [ret for truth, pred, ret in rows if truth == 0 and pred == 1 and ret is not None]
        tn_returns = [ret for truth, pred, ret in rows if truth == 0 and pred == 0 and ret is not None]
        fn_returns = [ret for truth, pred, ret in rows if truth == 1 and pred == 0 and ret is not None]

        precision = _pct(tp / (tp + fp)) if tp + fp else None
        recall = _pct(tp / (tp + fn)) if tp + fn else None
        accuracy = _pct((tp + tn) / total) if total else None
        f1 = _pct((2 * (precision / 100.0) * (recall / 100.0)) / ((precision / 100.0) + (recall / 100.0))) if precision is not None and recall is not None and (precision + recall) > 0 else None

        result = {
            "n_kept": total,
            "tp_count": tp,
            "fp_count": fp,
            "tn_count": tn,
            "fn_count": fn,
            "pred_pos_count": tp + fp,
            "actual_pos_count": tp + fn,
            "precision_pct": precision,
            "recall_pct": recall,
            "f1_score_pct": f1,
            "accuracy_pct": accuracy,
            "pred_pos_rate_pct": _pct((tp + fp) / total) if total else None,
            "actual_pos_rate_pct": _pct((tp + fn) / total) if total else None,
            "tp_mean_return_pct": _mean(tp_returns),
            "fp_mean_return_pct": _mean(fp_returns),
            "tn_mean_return_pct": _mean(tn_returns),
            "fn_mean_return_pct": _mean(fn_returns),
        }
        return {field: result[field] for field in CONFUSION_FIELDS}


def _aligned_returns(source: list[float | None], price_change: list[float | None], lag: int) -> list[float | None]:
    if any(value is not None for value in price_change):
        return [
            price_change[index + lag] if index + lag < len(price_change) else None
            for index in range(len(source))
        ]
    return source[:]


def _coerce_binary_series(values: Any) -> list[int | None]:
    return [_coerce_binary(value) for value in _as_iterable(values)]


def _coerce_float_series(values: Any) -> list[float | None]:
    return [_coerce_float(value) for value in _as_iterable(values)]


def _coerce_float(value: Any) -> float | None:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if math.isfinite(parsed) else None


def _coerce_int(value: Any, default: int | None = None) -> int | None:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return parsed


def _coerce_binary(value: Any) -> int | None:
    if isinstance(value, bool):
        return int(value)
    if value is None:
        return None
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(parsed):
        return None
    if parsed == 0.0 or parsed == 1.0:
        return int(parsed)
    return None


def _as_iterable(values: Any) -> list[Any]:
    if values is None or isinstance(values, (str, bytes)):
        return []
    if isinstance(values, Iterable):
        return list(values)
    return []


def _first_present(payload: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in payload and payload[key] is not None:
            return payload[key]
    return []


def _mean(values: list[float | None]) -> float | None:
    cleaned = [value for value in values if value is not None]
    return float(mean(cleaned)) if cleaned else None


def _pct(value: float) -> float:
    return float(value) * 100.0


def _percentile(values: list[float], q: float) -> float:
    if not values:
        raise ValueError("values must not be empty")
    ordered = sorted(values)
    if q <= 0:
        return ordered[0]
    if q >= 1:
        return ordered[-1]
    position = (len(ordered) - 1) * q
    lower = int(math.floor(position))
    upper = int(math.ceil(position))
    if lower == upper:
        return ordered[lower]
    weight = position - lower
    return ordered[lower] * (1 - weight) + ordered[upper] * weight
