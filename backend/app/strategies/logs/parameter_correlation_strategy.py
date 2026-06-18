"""Parameter correlation helper."""

from __future__ import annotations

import math
import random
from typing import Any


def build_parameter_correlation(
    rows: list[dict[str, Any]],
    *,
    metric: str = "total_return_net_pct",
    n_boot: int = 80,
    min_n: int = 10,
    random_state: int = 0,
) -> list[dict[str, Any]]:
    if len(rows) < min_n:
        return []

    features = _candidate_features(rows, metric)
    rng = random.Random(random_state)
    result: list[dict[str, Any]] = []

    for feature in features:
        paired = _paired_rows(rows, feature, metric)
        if len(paired) < min_n:
            continue
        xs = [x for x, _ in paired]
        ys = [y for _, y in paired]
        corr = _pearson(xs, ys)
        if corr is None:
            continue
        boot = []
        if n_boot > 0:
            for _ in range(n_boot):
                sample = [paired[rng.randrange(len(paired))] for _ in range(len(paired))]
                sample_corr = _pearson([x for x, _ in sample], [y for _, y in sample])
                if sample_corr is not None:
                    boot.append(sample_corr)
        corr_med = _percentile(boot, 0.5) if boot else corr
        ci_lo = _percentile(boot, 0.025) if boot else corr
        ci_hi = _percentile(boot, 0.975) if boot else corr
        if boot:
            same_sign = sum(
                1 for value in boot
                if (corr >= 0 and value >= 0) or (corr < 0 and value < 0)
            )
            sign_stability = same_sign / len(boot)
        else:
            sign_stability = 1.0
        result.append({
            "cohort_pct": round(100.0 * len(paired) / len(rows), 3),
            "feature": feature,
            "n_rows": len(paired),
            "corr": corr,
            "corr_med": corr_med,
            "ci_lo": ci_lo,
            "ci_hi": ci_hi,
            "sign_stability": sign_stability,
        })

    return sorted(result, key=lambda row: (-abs(row["corr"]), row["feature"]))


def _candidate_features(rows: list[dict[str, Any]], metric: str) -> list[str]:
    excluded = {"modelId", "model_id", "parameter_hash", "parameterHash", metric, "type"}
    features: list[str] = []
    for row in rows:
        for key, value in row.items():
            if key in excluded or isinstance(value, (dict, list, tuple, set)):
                continue
            if key not in features and _coerce_float(value) is not None:
                features.append(key)
    return features


def _paired_rows(rows: list[dict[str, Any]], feature: str, metric: str) -> list[tuple[float, float]]:
    paired: list[tuple[float, float]] = []
    for row in rows:
        x = _coerce_float(row.get(feature))
        y = _coerce_float(row.get(metric))
        if x is None or y is None:
            continue
        paired.append((x, y))
    return paired


def _pearson(xs: list[float], ys: list[float]) -> float | None:
    if len(xs) != len(ys) or len(xs) < 2:
        return None
    mean_x = sum(xs) / len(xs)
    mean_y = sum(ys) / len(ys)
    cov = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys, strict=True))
    var_x = sum((x - mean_x) ** 2 for x in xs)
    var_y = sum((y - mean_y) ** 2 for y in ys)
    if var_x <= 0 or var_y <= 0:
        return None
    return cov / math.sqrt(var_x * var_y)


def _coerce_float(value: Any) -> float | None:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if math.isfinite(parsed) else None


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
