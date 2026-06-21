from __future__ import annotations

import argparse
from itertools import combinations
import math
import random
from datetime import UTC, datetime, timedelta
from pathlib import Path
from statistics import median
from xml.sax.saxutils import escape

import polars as pl

from app.factories.target_strategy_factory import TargetStrategyFactory
from app.infrastructure.database.session import get_session_local
from app.repositories.market_data_repository import MarketDataRepository

TARGET_HORIZONS = (1, 2, 3, 4, 5, 10, 20, 50, 100)
TARGET_INTERVALS = ("1m", "5m", "15m", "45m", "1h", "4h", "1d")
DEFAULT_LOOKBACK_HOURS = 24 * 30
DEFAULT_OUTPUT_DIRNAME = "target_profitability_plots"
TARGET_ANALYSIS_ORDER = (
    "forward_return",
    "cost_adjusted_forward_return",
    "triple_barrier",
    "volatility_adjusted_forward_return",
    "mfe_mae_trade_quality",
    "quantile_flag",
    "candle_direction",
)
TARGET_ANALYSIS_EXCLUDES = {"roc_lookahead"}


def _target_strategies() -> tuple[object, ...]:
    discovered = {
        metadata["name"]
        for metadata in TargetStrategyFactory.list_metadata()
        if metadata["name"] and metadata["name"] not in TARGET_ANALYSIS_EXCLUDES
    }
    ordered = [name for name in TARGET_ANALYSIS_ORDER if name in discovered]
    ordered.extend(sorted(discovered.difference(ordered)))
    return tuple(TargetStrategyFactory.create(name) for name in ordered)


TARGET_STRATEGIES = _target_strategies()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Plot label forward-return separation against the all-bars baseline"
    )
    parser.add_argument("--start", type=str, help="ISO-8601 UTC start timestamp")
    parser.add_argument("--end", type=str, help="ISO-8601 UTC end timestamp or 'now'")
    parser.add_argument(
        "--lookback-hours",
        type=int,
        default=DEFAULT_LOOKBACK_HOURS,
        help="Look back this many hours when --start/--end are omitted",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parent / DEFAULT_OUTPUT_DIRNAME,
        help="Directory where SVG plots will be written",
    )
    parser.add_argument(
        "--smoke-test",
        action="store_true",
        help="Run a small self-check instead of reading the database",
    )
    parser.add_argument(
        "--cost-bps",
        type=float,
        default=0.0,
        help="Round-trip trading cost in basis points deducted from forward returns",
    )
    parser.add_argument(
        "--mock-precision",
        type=float,
        help="Simulate a model with this precision against each target before plotting",
    )
    parser.add_argument(
        "--mock-recall",
        type=float,
        help="Simulate a model with this recall against each target before plotting",
    )
    parser.add_argument(
        "--mock-seed",
        type=int,
        default=42,
        help="Random seed used for mock predictions",
    )
    return parser


def parse_iso_datetime(value: str) -> datetime:
    raw = value.strip()
    if raw.lower() == "now":
        return datetime.now(UTC)
    parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def resolve_range(args: argparse.Namespace) -> tuple[datetime, datetime]:
    if args.start or args.end:
        if not args.start or not args.end:
            raise ValueError("provide both --start and --end, or neither")
        start = parse_iso_datetime(args.start)
        end = parse_iso_datetime(args.end)
    else:
        if args.lookback_hours <= 0:
            raise ValueError("--lookback-hours must be greater than 0")
        end = datetime.now(UTC)
        start = end - timedelta(hours=args.lookback_hours)
    if start >= end:
        raise ValueError("start must be earlier than end")
    return start, end


def load_base_candles(start: datetime, end: datetime) -> pl.DataFrame:
    session_factory = get_session_local()
    with session_factory() as session:
        rows = MarketDataRepository(session).list_range_projection(start, end, interval="1m")

    if not rows:
        raise RuntimeError("no BTCUSDT candles found in the requested range")

    frame = pl.DataFrame(
        rows,
        schema=["timestamp", "open", "high", "low", "close", "volume"],
        orient="row",
    ).sort("timestamp")

    return frame.with_columns(
        pl.col("timestamp").cast(pl.Datetime),
        pl.col(["open", "high", "low", "close", "volume"]).cast(pl.Float64),
    )


def aggregate_ohlcv_interval(frame: pl.DataFrame, interval: str) -> pl.DataFrame:
    if interval == "1m":
        return frame.sort("timestamp")

    return (
        frame.sort("timestamp")
        .group_by_dynamic(
            "timestamp",
            every=interval,
            period=interval,
            closed="left",
            label="left",
        )
        .agg(
            pl.first("open").alias("open"),
            pl.max("high").alias("high"),
            pl.min("low").alias("low"),
            pl.last("close").alias("close"),
            pl.sum("volume").alias("volume"),
        )
        .sort("timestamp")
    )


def load_interval_candles(start: datetime, end: datetime, interval: str) -> pl.DataFrame:
    return aggregate_ohlcv_interval(load_base_candles(start, end), interval)


def apply_target(strategy, frame: pl.DataFrame) -> pl.DataFrame:
    return strategy.generate(frame.lazy()).collect()


def simulate_predictions_by_precision_recall(
    frame: pl.DataFrame,
    *,
    precision: float,
    recall: float,
    seed: int = 42,
    target_col: str = "target",
    output_col: str = "target",
) -> pl.DataFrame:
    if not 0.0 < precision <= 1.0:
        raise ValueError("precision must be between 0 and 1")
    if not 0.0 <= recall <= 1.0:
        raise ValueError("recall must be between 0 and 1")

    labelled = frame.with_row_index("_row_id").drop_nulls([target_col])
    positives = labelled.filter(pl.col(target_col) == 1)["_row_id"].to_list()
    negatives = labelled.filter(pl.col(target_col) == 0)["_row_id"].to_list()

    rng = random.Random(seed)
    true_positive_count = min(len(positives), round(len(positives) * recall))
    predicted_positive_count = 0 if precision == 0 else round(true_positive_count / precision)
    false_positive_count = max(0, predicted_positive_count - true_positive_count)

    true_positive_ids = set(rng.sample(positives, true_positive_count)) if true_positive_count else set()
    false_positive_ids = (
        set(rng.sample(negatives, min(false_positive_count, len(negatives)))) if false_positive_count else set()
    )
    predicted_positive_ids = true_positive_ids | false_positive_ids

    return (
        frame.with_row_index("_row_id")
        .with_columns(
            pl.when(pl.col(target_col).is_null())
            .then(None)
            .when(pl.col("_row_id").is_in(list(predicted_positive_ids)))
            .then(1)
            .otherwise(0)
            .cast(pl.Int8)
            .alias(output_col)
        )
        .drop("_row_id")
    )


def _safe_float(value: object | None) -> float | None:
    if value is None:
        return None
    result = float(value)
    return None if math.isnan(result) else result


def _cohort_frame(
    frame: pl.DataFrame,
    horizon: int,
    *,
    target_value: int | None = None,
    cost_bps: float = 0.0,
) -> pl.DataFrame:
    cost = cost_bps / 10_000.0
    cohort = frame.select(
        pl.col("target"),
        (
            pl.col("close").cast(pl.Float64).shift(-horizon) / pl.col("close").cast(pl.Float64)
        - 1.0
        - cost
        ).alias("forward_return"),
    ).drop_nulls(["forward_return", "target"])

    if target_value is not None:
        cohort = cohort.filter(pl.col("target") == target_value)

    return cohort


def _cohort_stats(returns: list[float]) -> dict[str, float | int | None]:
    count = len(returns)
    if count == 0:
        return {
            "count": 0,
            "mean": None,
            "median": None,
            "win_rate": None,
            "profit_factor": None,
        }

    positive_sum = sum(value for value in returns if value > 0)
    negative_sum = -sum(value for value in returns if value < 0)
    if negative_sum == 0:
        profit_factor = math.inf if positive_sum > 0 else None
    else:
        profit_factor = positive_sum / negative_sum

    return {
        "count": count,
        "mean": sum(returns) / count,
        "median": median(returns),
        "win_rate": sum(1 for value in returns if value > 0) / count,
        "profit_factor": profit_factor,
    }


def summarize_target_profitability(
    frame: pl.DataFrame,
    horizons: tuple[int, ...] = TARGET_HORIZONS,
    *,
    cost_bps: float = 0.0,
) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for horizon in horizons:
        all_frame = _cohort_frame(frame, horizon, cost_bps=cost_bps)
        signal_frame = _cohort_frame(frame, horizon, target_value=1, cost_bps=cost_bps)
        non_signal_frame = _cohort_frame(frame, horizon, target_value=0, cost_bps=cost_bps)
        all_stats = _cohort_stats(all_frame["forward_return"].to_list())
        signal_stats = _cohort_stats(signal_frame["forward_return"].to_list())
        non_signal_stats = _cohort_stats(non_signal_frame["forward_return"].to_list())
        rows.append(
            {
                "horizon": horizon,
                "all": all_stats,
                "signal": signal_stats,
                "non_signal": non_signal_stats,
                "all_count": all_stats["count"],
                "signal_count": signal_stats["count"],
                "non_signal_count": non_signal_stats["count"],
                "all_mean": all_stats["mean"],
                "all_median": all_stats["median"],
                "all_win": all_stats["win_rate"],
                "all_pf": all_stats["profit_factor"],
                "signal_mean": signal_stats["mean"],
                "signal_median": signal_stats["median"],
                "signal_win": signal_stats["win_rate"],
                "signal_pf": signal_stats["profit_factor"],
                "non_signal_mean": non_signal_stats["mean"],
                "signal_spread": _difference(signal_stats["mean"], non_signal_stats["mean"]),
                "lift": _difference(signal_stats["mean"], all_stats["mean"]),
            }
        )
    return rows


def _difference(left: float | None, right: float | None) -> float | None:
    if left is None or right is None:
        return None
    return left - right


def _format_pct(value: float | None) -> str:
    if value is None:
        return "--"
    return f"{value:.2%}"


def _format_factor(value: float | None) -> str:
    if value is None:
        return "--"
    if math.isinf(value):
        return "inf"
    return f"{value:.2f}"


def _format_ratio(value: float | None) -> str:
    if value is None:
        return "--"
    return f"{value:.2%}"


def _format_decimal(value: float | None) -> str:
    if value is None:
        return "--"
    return f"{value:.4f}"


def _mean(values: list[float]) -> float | None:
    if not values:
        return None
    return sum(values) / len(values)


def _correlation(xs: list[float], ys: list[float]) -> float | None:
    if len(xs) < 2 or len(xs) != len(ys):
        return None
    mean_x = _mean(xs)
    mean_y = _mean(ys)
    if mean_x is None or mean_y is None:
        return None
    var_x = sum((x - mean_x) ** 2 for x in xs)
    var_y = sum((y - mean_y) ** 2 for y in ys)
    if var_x == 0 or var_y == 0:
        return None
    cov = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    return cov / math.sqrt(var_x * var_y)


def _jaccard(xs: list[int], ys: list[int]) -> float | None:
    if len(xs) != len(ys) or not xs:
        return None
    intersection = sum(1 for x, y in zip(xs, ys) if x == 1 and y == 1)
    union = sum(1 for x, y in zip(xs, ys) if x == 1 or y == 1)
    if union == 0:
        return None
    return intersection / union


def summarize_target_verification(frame: pl.DataFrame, target_names: tuple[str, ...]) -> dict[str, list[dict[str, object]]]:
    positive_rates: list[dict[str, object]] = []
    for name in target_names:
        values = [int(value) for value in frame.get_column(name).drop_nulls().to_list()]
        positive_rates.append(
            {
                "target": name,
                "count": len(values),
                "positive_rate": _mean([1.0 if value == 1 else 0.0 for value in values]),
            }
        )

    pairwise: list[dict[str, object]] = []
    for left_name, right_name in combinations(target_names, 2):
        pair = frame.select(pl.col(left_name), pl.col(right_name)).drop_nulls()
        left_values = [int(value) for value in pair.get_column(left_name).to_list()]
        right_values = [int(value) for value in pair.get_column(right_name).to_list()]
        pairwise.append(
            {
                "target_a": left_name,
                "target_b": right_name,
                "count": len(left_values),
                "positive_rate_a": _mean([1.0 if value == 1 else 0.0 for value in left_values]),
                "positive_rate_b": _mean([1.0 if value == 1 else 0.0 for value in right_values]),
                "jaccard": _jaccard(left_values, right_values),
                "correlation": _correlation(left_values, right_values),
            }
        )

    return {"positive_rates": positive_rates, "pairwise": pairwise}


def _svg_header(width: int, height: int, title: str) -> list[str]:
    return [
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
        (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}" role="img" aria-label="{escape(title)}">'
        ),
        '<rect width="100%" height="100%" fill="#0f172a"/>',
        f'<text x="24" y="34" fill="#f8fafc" font-size="22" font-family="Arial, sans-serif">{escape(title)}</text>',
    ]


def _svg_footer() -> list[str]:
    return ["</svg>"]


def _plot_series(
    lines: list[str],
    *,
    rows: list[dict[str, object]],
    key: str,
    color: str,
    chart_left: float,
    chart_top: float,
    chart_width: float,
    chart_height: float,
    y_min: float,
    y_max: float,
    dasharray: str | None = None,
) -> None:
    step = chart_width / max(len(rows) - 1, 1)
    prev: tuple[float, float] | None = None

    for index, row in enumerate(rows):
        value = _safe_float(row[key])
        if value is None:
            prev = None
            continue

        x = chart_left + index * step
        y = chart_top + chart_height - ((value - y_min) / (y_max - y_min)) * chart_height
        lines.append(
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.5" fill="{color}" stroke="#0f172a" stroke-width="1"/>'
        )
        if prev is not None:
            dash = f' stroke-dasharray="{dasharray}"' if dasharray else ""
            lines.append(
                f'<line x1="{prev[0]:.1f}" y1="{prev[1]:.1f}" x2="{x:.1f}" y2="{y:.1f}" '
                f'stroke="{color}" stroke-width="2.5" stroke-linecap="round"{dash}/>'
            )
        prev = (x, y)


def render_profitability_svg(
    *,
    title: str,
    rows: list[dict[str, object]],
    verification: dict[str, list[dict[str, object]]],
    source_range: tuple[datetime, datetime],
    subtitle: str | None = None,
) -> str:
    width = 1280
    chart_left = 78.0
    chart_top = 72.0
    chart_width = 1120.0
    chart_height = 175.0
    table_top = 286.0
    table_left = 20.0
    table_row_height = 28.0
    columns = [
        ("horizon", 60.0),
        ("all_count", 62.0),
        ("signal_count", 72.0),
        ("non_signal_count", 92.0),
        ("all_mean", 78.0),
        ("signal_mean", 78.0),
        ("non_signal_mean", 86.0),
        ("signal_spread", 86.0),
        ("lift", 72.0),
        ("all_median", 78.0),
        ("signal_median", 78.0),
        ("all_win", 70.0),
        ("signal_win", 78.0),
        ("all_pf", 68.0),
        ("signal_pf", 68.0),
    ]

    values = [
        _safe_float(row[key])
        for row in rows
        for key in ("all_mean", "signal_mean", "non_signal_mean")
    ]
    values = [value for value in values if value is not None]
    if not values:
        values = [0.0]

    positive_rows = verification["positive_rates"]
    pairwise_rows = verification["pairwise"]
    verification_top = table_top + (len(rows) + 2) * table_row_height + 18
    height = max(
        840,
        int(verification_top + (max(len(positive_rows), len(pairwise_rows)) + 3) * table_row_height + 24),
    )

    y_min = min(values)
    y_max = max(values)
    if y_min == y_max:
        pad = 0.01 if y_min == 0 else abs(y_min) * 0.5
    else:
        pad = (y_max - y_min) * 0.15
    y_min -= pad
    y_max += pad

    lines = _svg_header(width, height, title)
    if subtitle:
        lines.append(
            f'<text x="24" y="58" fill="#cbd5e1" font-size="12" font-family="Arial, sans-serif">{escape(subtitle)}</text>'
        )
        source_y = 74
    else:
        source_y = 58
    lines.append(
        f'<text x="24" y="{source_y}" fill="#94a3b8" font-size="12" font-family="Arial, sans-serif">'
        f'{escape(source_range[0].isoformat())} to {escape(source_range[1].isoformat())}</text>'
    )
    lines.append(
        f'<text x="{width - 420}" y="{source_y}" fill="#cbd5e1" font-size="12" font-family="Arial, sans-serif">'
        '<tspan fill="#60a5fa">all</tspan> '
        '<tspan fill="#22c55e">target=1</tspan> '
        '<tspan fill="#f59e0b">target=0</tspan></text>'
    )

    for tick in range(5):
        fraction = tick / 4
        y = chart_top + chart_height - fraction * chart_height
        value = y_min + fraction * (y_max - y_min)
        lines.append(
            f'<line x1="{chart_left}" y1="{y:.1f}" x2="{chart_left + chart_width}" y2="{y:.1f}" '
            'stroke="#334155" stroke-width="1"/>'
        )
        lines.append(
            f'<text x="34" y="{y + 4:.1f}" fill="#cbd5e1" font-size="12" font-family="Arial, sans-serif">'
            f"{value:.2%}</text>"
        )

    step = chart_width / max(len(rows) - 1, 1)
    for index, row in enumerate(rows):
        x = chart_left + index * step
        lines.append(
            f'<line x1="{x:.1f}" y1="{chart_top + chart_height}" x2="{x:.1f}" y2="{chart_top + chart_height + 6}" '
            'stroke="#94a3b8" stroke-width="1"/>'
        )
        lines.append(
            f'<text x="{x:.1f}" y="{chart_top + chart_height + 20}" text-anchor="middle" fill="#cbd5e1" '
            f'font-size="12" font-family="Arial, sans-serif">{row["horizon"]} bars</text>'
        )

    _plot_series(
        lines,
        rows=rows,
        key="all_mean",
        color="#60a5fa",
        chart_left=chart_left,
        chart_top=chart_top,
        chart_width=chart_width,
        chart_height=chart_height,
        y_min=y_min,
        y_max=y_max,
    )
    _plot_series(
        lines,
        rows=rows,
        key="signal_mean",
        color="#22c55e",
        chart_left=chart_left,
        chart_top=chart_top,
        chart_width=chart_width,
        chart_height=chart_height,
        y_min=y_min,
        y_max=y_max,
    )
    _plot_series(
        lines,
        rows=rows,
        key="non_signal_mean",
        color="#f59e0b",
        dasharray="6 4",
        chart_left=chart_left,
        chart_top=chart_top,
        chart_width=chart_width,
        chart_height=chart_height,
        y_min=y_min,
        y_max=y_max,
    )

    lines.append(
        f'<text x="{chart_left}" y="{chart_top - 14}" fill="#e2e8f0" font-size="12" font-family="Arial, sans-serif">'
        "mean forward return by horizon</text>"
    )

    header_y = table_top
    x = table_left
    label_map = {
        "horizon": "horizon",
        "all_count": "all n",
        "signal_count": "signal n",
        "non_signal_count": "non-signal n",
        "all_mean": "all mean",
        "signal_mean": "signal mean",
        "non_signal_mean": "non-signal mean",
        "signal_spread": "signal spread",
        "lift": "lift",
        "all_median": "all median",
        "signal_median": "signal median",
        "all_win": "all win",
        "signal_win": "signal win",
        "all_pf": "all pf",
        "signal_pf": "signal pf",
    }
    for name, width_px in columns:
        lines.append(
            f'<rect x="{x}" y="{header_y}" width="{width_px}" height="{table_row_height}" fill="#111827" stroke="#334155"/>'
        )
        lines.append(
            f'<text x="{x + width_px / 2:.1f}" y="{header_y + 19}" text-anchor="middle" fill="#f8fafc" '
            f'font-size="10" font-family="Arial, sans-serif">{label_map[name]}</text>'
        )
        x += width_px

    for row_index, row in enumerate(rows, start=1):
        y = table_top + row_index * table_row_height
        x = table_left
        values = [
            str(row["horizon"]),
            str(row["all_count"]),
            str(row["signal_count"]),
            str(row["non_signal_count"]),
            _format_pct(row["all_mean"]),
            _format_pct(row["signal_mean"]),
            _format_pct(row["non_signal_mean"]),
            _format_decimal(row["signal_spread"]),
            _format_decimal(row["lift"]),
            _format_pct(row["all_median"]),
            _format_pct(row["signal_median"]),
            _format_pct(row["all_win"]),
            _format_pct(row["signal_win"]),
            _format_factor(row["all_pf"]),
            _format_factor(row["signal_pf"]),
        ]
        for _, width_px in columns:
            fill = "#0f172a" if row_index % 2 else "#111827"
            lines.append(
                f'<rect x="{x}" y="{y}" width="{width_px}" height="{table_row_height}" fill="{fill}" stroke="#334155"/>'
            )
            lines.append(
                f'<text x="{x + width_px / 2:.1f}" y="{y + 19}" text-anchor="middle" fill="#cbd5e1" '
                f'font-size="10" font-family="Arial, sans-serif">{escape(values.pop(0))}</text>'
            )
            x += width_px

    lines.append(
        f'<text x="{table_left}" y="{verification_top - 12}" fill="#f8fafc" font-size="14" font-family="Arial, sans-serif">'
        "verification</text>"
    )

    # positive rate table
    pos_columns = [("target", 160.0), ("count", 80.0), ("positive_rate", 110.0)]
    x = table_left
    for name, width_px in pos_columns:
        lines.append(
            f'<rect x="{x}" y="{verification_top}" width="{width_px}" height="{table_row_height}" fill="#111827" stroke="#334155"/>'
        )
        lines.append(
            f'<text x="{x + width_px / 2:.1f}" y="{verification_top + 19}" text-anchor="middle" fill="#f8fafc" '
            f'font-size="10" font-family="Arial, sans-serif">{name}</text>'
        )
        x += width_px

    for idx, row in enumerate(positive_rows, start=1):
        y = verification_top + idx * table_row_height
        x = table_left
        values = [str(row["target"]), str(row["count"]), _format_ratio(row["positive_rate"])]
        for _, width_px in pos_columns:
            fill = "#0f172a" if idx % 2 else "#111827"
            lines.append(
                f'<rect x="{x}" y="{y}" width="{width_px}" height="{table_row_height}" fill="{fill}" stroke="#334155"/>'
            )
            lines.append(
                f'<text x="{x + width_px / 2:.1f}" y="{y + 19}" text-anchor="middle" fill="#cbd5e1" '
                f'font-size="10" font-family="Arial, sans-serif">{escape(values.pop(0))}</text>'
            )
            x += width_px

    pair_top = verification_top
    pair_left = 360.0
    pair_columns = [("a", 120.0), ("b", 120.0), ("count", 70.0), ("jaccard", 90.0), ("corr", 90.0)]
    x = pair_left
    for name, width_px in pair_columns:
        lines.append(
            f'<rect x="{x}" y="{pair_top}" width="{width_px}" height="{table_row_height}" fill="#111827" stroke="#334155"/>'
        )
        lines.append(
            f'<text x="{x + width_px / 2:.1f}" y="{pair_top + 19}" text-anchor="middle" fill="#f8fafc" '
            f'font-size="10" font-family="Arial, sans-serif">{name}</text>'
        )
        x += width_px

    for idx, row in enumerate(pairwise_rows, start=1):
        y = pair_top + idx * table_row_height
        x = pair_left
        values = [
            str(row["target_a"]),
            str(row["target_b"]),
            str(row["count"]),
            _format_ratio(row["jaccard"]),
            _format_decimal(row["correlation"]),
        ]
        for _, width_px in pair_columns:
            fill = "#0f172a" if idx % 2 else "#111827"
            lines.append(
                f'<rect x="{x}" y="{y}" width="{width_px}" height="{table_row_height}" fill="{fill}" stroke="#334155"/>'
            )
            lines.append(
                f'<text x="{x + width_px / 2:.1f}" y="{y + 19}" text-anchor="middle" fill="#cbd5e1" '
                f'font-size="10" font-family="Arial, sans-serif">{escape(values.pop(0))}</text>'
            )
            x += width_px

    lines.append(
        f'<text x="{table_left}" y="{height - 22}" fill="#94a3b8" font-size="12" font-family="Arial, sans-serif">'
        "label=1 means the target condition is true at this bar; this is label analysis, not live prediction performance</text>"
    )
    lines.extend(_svg_footer())
    return "\n".join(lines)


def write_plots(
    output_dir: Path,
    frame: pl.DataFrame,
    start: datetime,
    end: datetime,
    *,
    cost_bps: float = 0.0,
    mock_precision: float | None = None,
    mock_recall: float | None = None,
    mock_seed: int = 42,
) -> list[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []
    for interval in TARGET_INTERVALS:
        interval_dir = output_dir / interval
        interval_dir.mkdir(parents=True, exist_ok=True)
        interval_frame = aggregate_ohlcv_interval(frame, interval)

        target_frames = {
            strategy.target_name: apply_target(strategy, interval_frame)
            for strategy in TARGET_STRATEGIES
        }
        analysis_frames = target_frames
        if mock_precision is not None and mock_recall is not None:
            analysis_frames = {
                name: simulate_predictions_by_precision_recall(
                    target_frame,
                    precision=mock_precision,
                    recall=mock_recall,
                    seed=mock_seed,
                )
                for name, target_frame in target_frames.items()
            }
        verification_frame = interval_frame.select("timestamp")
        for name, target_frame in target_frames.items():
            verification_frame = verification_frame.join(
                target_frame.select("timestamp", pl.col("target").alias(name)),
                on="timestamp",
                how="left",
            )
        verification = summarize_target_verification(
            verification_frame,
            tuple(strategy.target_name for strategy in TARGET_STRATEGIES),
        )

        for strategy in TARGET_STRATEGIES:
            subtitle = None
            if mock_precision is not None and mock_recall is not None:
                subtitle = (
                    f"mock predictor bridge: precision={mock_precision:.0%}, "
                    f"recall={mock_recall:.0%}, seed={mock_seed}"
                )
            rows = summarize_target_profitability(
                analysis_frames[strategy.target_name],
                cost_bps=cost_bps,
            )
            svg = render_profitability_svg(
                title=f"{strategy.target_name} label forward-return separation ({interval})",
                rows=rows,
                verification=verification,
                source_range=(start, end),
                subtitle=subtitle,
            )
            output_path = interval_dir / f"{strategy.target_name}.svg"
            output_path.write_text(svg, encoding="utf-8")
            outputs.append(output_path)
    return outputs


def _smoke_test() -> None:
    sample = pl.DataFrame(
        {
            "timestamp": [
                datetime(2026, 1, 1, 0, 0, tzinfo=UTC),
                datetime(2026, 1, 1, 1, 0, tzinfo=UTC),
                datetime(2026, 1, 1, 2, 0, tzinfo=UTC),
                datetime(2026, 1, 1, 3, 0, tzinfo=UTC),
                datetime(2026, 1, 1, 4, 0, tzinfo=UTC),
                datetime(2026, 1, 1, 5, 0, tzinfo=UTC),
            ],
            "open": [100.0, 100.0, 110.0, 99.0, 108.9, 98.01],
            "high": [101.0, 111.0, 110.0, 109.0, 109.9, 108.0],
            "low": [99.0, 99.0, 99.0, 98.0, 98.0, 97.0],
            "close": [100.0, 110.0, 99.0, 108.9, 98.01, 107.811],
            "volume": [10.0] * 6,
            "target": [0, 1, 0, 1, 1, 0],
        }
    )
    signal_frame = _cohort_frame(sample, 1, target_value=1)
    assert set(signal_frame["target"].to_list()) == {1}

    report = summarize_target_profitability(sample, horizons=(1, 2))
    assert len(report) == 2
    assert report[0]["all"]["count"] == 5
    assert report[0]["signal"]["count"] == 3
    assert report[0]["signal_spread"] is not None
    assert report[0]["lift"] is not None
    assert math.isclose(report[0]["all"]["mean"], 0.02, rel_tol=1e-9)
    assert math.isclose(report[0]["signal"]["mean"], -0.03333333333333333, rel_tol=1e-9)
    assert math.isclose(report[0]["all"]["profit_factor"], 1.5, rel_tol=1e-9)
    assert math.isclose(report[0]["signal"]["profit_factor"], 0.5, rel_tol=1e-9)
    verification_frame = sample.select("timestamp")
    for strategy in TARGET_STRATEGIES:
        verification_frame = verification_frame.with_columns(sample["target"].alias(strategy.target_name))
    verification = summarize_target_verification(
        verification_frame,
        tuple(strategy.target_name for strategy in TARGET_STRATEGIES),
    )
    assert len(verification["positive_rates"]) == len(TARGET_STRATEGIES)
    assert len(verification["pairwise"]) == len(TARGET_STRATEGIES) * (len(TARGET_STRATEGIES) - 1) // 2

    mock_frame = simulate_predictions_by_precision_recall(
        sample,
        precision=0.6,
        recall=0.5,
        seed=7,
    )
    assert mock_frame["target"].null_count() == sample["target"].null_count()
    assert set(mock_frame["target"].drop_nulls().unique().to_list()).issubset({0, 1})

    svg = render_profitability_svg(
        title="smoke",
        rows=report,
        verification=verification,
        source_range=(sample["timestamp"][0], sample["timestamp"][-1]),
        subtitle="mock predictor bridge: precision=60%, recall=50%, seed=7",
    )
    assert "signal" in svg
    assert "all mean" in svg


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.smoke_test:
        _smoke_test()
        print("smoke test passed")
        return 0

    if (args.mock_precision is None) != (args.mock_recall is None):
        parser.error("--mock-precision and --mock-recall must be provided together")

    try:
        start, end = resolve_range(args)
    except ValueError as exc:
        parser.error(str(exc))

    candles = load_base_candles(start, end)
    outputs = write_plots(
        args.output_dir,
        candles,
        start,
        end,
        cost_bps=args.cost_bps,
        mock_precision=args.mock_precision,
        mock_recall=args.mock_recall,
        mock_seed=args.mock_seed,
    )
    for output in outputs:
        print(f"wrote {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
