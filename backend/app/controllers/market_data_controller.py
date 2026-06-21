"""Market data cache read endpoints."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any
from statistics import median
import math
import random

import polars as pl
from flask import Blueprint, request

from app.repositories.unit_of_work import UnitOfWork
from app.repositories.market_data_repository import MarketDataRepository
from app.responses import error_response, ok_response, validation_error_response
from app.factories.target_strategy_factory import TargetStrategyFactory
from app.strategies.logs.confusion_metrics_log_strategy import (
    CONFUSION_FIELDS,
    ConfusionMetricsLogStrategy,
)

blueprint = Blueprint("market_data", __name__)

DEFAULT_API_KLINE_LIMIT = 5000
MAX_API_KLINE_LIMIT = 20000

SUPPORTED_PREVIEW_INTERVALS = tuple(MarketDataRepository.SUPPORTED_INTERVALS.keys())
INTERVAL_MINUTES = {
    "1m": 1,
    "5m": 5,
    "15m": 15,
    "30m": 30,
    "1h": 60,
    "2h": 120,
    "4h": 240,
    "1d": 1440,
}
MAX_TARGET_PREVIEW_RAW_ROWS = 12000


def _parse_iso8601(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def _to_utc_iso(value: datetime) -> str:
    normalized = value if value.tzinfo is not None else value.replace(
        tzinfo=UTC)
    return normalized.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _coerce_datetime(value: datetime | str) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo is not None else value.replace(tzinfo=UTC)
    parsed = datetime.fromisoformat(value)
    return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=UTC)


def _extract_kline_fields(item) -> tuple[datetime, object, object, object, object, object]:
    if isinstance(item, tuple):
        ts = _coerce_datetime(item[0])
        return ts, item[1], item[2], item[3], item[4], item[5]

    ts = _coerce_datetime(getattr(item, "Timestamp"))
    return ts, item.Open, item.High, item.Low, item.Close, item.Volume


def _format_decimal_8(value: object) -> str:
    return f"{Decimal(str(value)):.8f}"


def _coerce_positive_int(value: object, *, field_name: str) -> tuple[int | None, str | None]:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None, f"{field_name} must be an integer"
    if parsed <= 0:
        return None, f"{field_name} must be greater than 0"
    return parsed, None


def _coerce_preview_parameter_value(value: object) -> object:
    if not isinstance(value, str):
        return value
    text = value.strip()
    if not text:
        return value
    lowered = text.lower()
    if lowered in {"null", "none"}:
        return None
    if text.startswith("["):
        try:
            import json

            return json.loads(text)
        except ValueError:
            pass
    if "," in text:
        return [
            _coerce_preview_parameter_value(part.strip())
            for part in text.split(",")
            if part.strip()
        ]
    if lowered == "true":
        return True
    if lowered == "false":
        return False
    try:
        number = float(text)
    except ValueError:
        return text
    return int(number) if number.is_integer() else number


def _normalize_preview_target_params(params: dict[str, object]) -> dict[str, object]:
    return {key: _coerce_preview_parameter_value(value) for key, value in params.items()}


def _row_value(row: Any, key: str) -> Any:
    if isinstance(row, dict):
        return row[key]
    return getattr(row, key)


def _preview_rows_to_frame(rows: list[object]) -> pl.LazyFrame:
    return pl.DataFrame([
        {
            "timestamp": _row_value(row, "timestamp"),
            "open": float(_row_value(row, "open")),
            "high": float(_row_value(row, "high")),
            "low": float(_row_value(row, "low")),
            "close": float(_row_value(row, "close")),
            "volume": float(_row_value(row, "volume")),
        }
        for row in rows
    ]).lazy()


def _aggregate_preview_rows(rows: list[object], interval: str) -> list[dict[str, object]]:
    minutes = INTERVAL_MINUTES.get(interval)
    if minutes is None or interval == "1m":
        return [
            {
                "timestamp": _row_value(row, "timestamp"),
                "open": _row_value(row, "open"),
                "high": _row_value(row, "high"),
                "low": _row_value(row, "low"),
                "close": _row_value(row, "close"),
                "volume": _row_value(row, "volume"),
            }
            for row in rows
        ]

    bucket_seconds = minutes * 60
    aggregated: list[dict[str, object]] = []
    current_bucket: datetime | None = None
    current_row: dict[str, object] | None = None
    for row in rows:
        timestamp = _row_value(row, "timestamp")
        if not isinstance(timestamp, datetime):
            timestamp = _coerce_datetime(timestamp)
        bucket_ts = datetime.fromtimestamp((int(timestamp.timestamp()) // bucket_seconds) * bucket_seconds, tz=UTC)
        if current_bucket != bucket_ts or current_row is None:
            if current_row is not None:
                aggregated.append(current_row)
            current_bucket = bucket_ts
            current_row = {
                "timestamp": bucket_ts,
                "open": _row_value(row, "open"),
                "high": _row_value(row, "high"),
                "low": _row_value(row, "low"),
                "close": _row_value(row, "close"),
                "volume": _row_value(row, "volume"),
            }
            continue
        current_row["high"] = max(float(current_row["high"]), float(_row_value(row, "high")))
        current_row["low"] = min(float(current_row["low"]), float(_row_value(row, "low")))
        current_row["close"] = _row_value(row, "close")
        current_row["volume"] = float(current_row["volume"]) + float(_row_value(row, "volume"))
    if current_row is not None:
        aggregated.append(current_row)
    return aggregated


def _count_tail_nulls(values: list[object | None]) -> int:
    count = 0
    for value in reversed(values):
        if value is None:
            count += 1
            continue
        break
    return count


def _count_warmup_nulls(values: list[object | None]) -> int:
    count = 0
    for value in values:
        if value is None:
            count += 1
            continue
        break
    return count


def _cohort_stats(returns: list[float]) -> dict[str, float | int | None]:
    count = len(returns)
    if count == 0:
        return {"count": 0, "mean": None, "median": None, "win_rate": None, "profit_factor": None}

    positive_sum = sum(value for value in returns if value > 0)
    negative_sum = -sum(value for value in returns if value < 0)
    if negative_sum == 0:
        # Keep JSON valid when the cohort has no losses.
        profit_factor = None
    else:
        profit_factor = positive_sum / negative_sum

    return {
        "count": count,
        "mean": sum(returns) / count,
        "median": median(returns),
        "win_rate": sum(1 for value in returns if value > 0) / count,
        "profit_factor": profit_factor,
    }


def _simulate_prediction_labels(
    labels: list[int | None],
    *,
    precision: float,
    recall: float,
    seed: int,
) -> tuple[list[int | None], dict[str, float | int | None]]:
    if not 0.0 < precision <= 1.0:
        raise ValueError("precision must be between 0 and 1")
    if not 0.0 <= recall <= 1.0:
        raise ValueError("recall must be between 0 and 1")

    labelled_indices = [index for index, value in enumerate(labels) if value in (0, 1)]
    positive_indices = [index for index in labelled_indices if labels[index] == 1]
    negative_indices = [index for index in labelled_indices if labels[index] == 0]
    rng = random.Random(seed)

    true_positive_count = min(len(positive_indices), round(len(positive_indices) * recall))
    predicted_positive_count = 0 if precision == 0 else round(true_positive_count / precision)
    false_positive_count = max(0, predicted_positive_count - true_positive_count)

    true_positive_indices = set(rng.sample(positive_indices, true_positive_count)) if true_positive_count else set()
    false_positive_indices = (
        set(rng.sample(negative_indices, min(false_positive_count, len(negative_indices))))
        if false_positive_count
        else set()
    )
    predicted_positive_indices = true_positive_indices | false_positive_indices

    predicted_labels = [None if value is None else 0 for value in labels]
    for index in predicted_positive_indices:
        predicted_labels[index] = 1

    tp = len(true_positive_indices)
    fp = len(false_positive_indices)
    fn = max(0, len(positive_indices) - tp)
    tn = max(0, len(negative_indices) - fp)
    predicted_positive = tp + fp
    actual_positive = len(positive_indices)

    actual_precision = (tp / predicted_positive) * 100.0 if predicted_positive else None
    actual_recall = (tp / actual_positive) * 100.0 if actual_positive else None
    signal_rate = (predicted_positive / len(labelled_indices)) * 100.0 if labelled_indices else None
    false_positive_rate = (fp / len(negative_indices)) * 100.0 if negative_indices else None

    return predicted_labels, {
        "requestedPrecisionPct": precision * 100.0,
        "requestedRecallPct": recall * 100.0,
        "actualPrecisionPct": actual_precision,
        "actualRecallPct": actual_recall,
        "signalRatePct": signal_rate,
        "falsePositiveRatePct": false_positive_rate,
        "predictedPositiveCount": predicted_positive,
        "truePositiveCount": tp,
        "falsePositiveCount": fp,
        "trueNegativeCount": tn,
        "falseNegativeCount": fn,
    }


def _coerce_non_negative_int(value: object, *, field_name: str) -> tuple[int | None, str | None]:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None, f"{field_name} must be an integer"
    if parsed < 0:
        return None, f"{field_name} must be greater than or equal to 0"
    return parsed, None


@blueprint.get("/btcusdt/klines")
def get_btcusdt_klines():
    start_raw = request.args.get("start", type=str)
    end_raw = request.args.get("end", type=str)
    interval = request.args.get("interval", default="1m", type=str)
    limit = request.args.get(
        "limit", default=DEFAULT_API_KLINE_LIMIT, type=int)
    before_raw = request.args.get("before", type=str)

    errors: dict[str, str] = {}
    if interval != "1m":
        errors["interval"] = "Only 1m interval is supported"
    if limit <= 0 or limit > MAX_API_KLINE_LIMIT:
        errors["limit"] = f"limit must be between 1 and {MAX_API_KLINE_LIMIT}"
    if errors:
        return validation_error_response(errors, status_code=400)

    start: datetime | None = None
    end: datetime | None = None
    if start_raw is not None:
        try:
            start = _parse_iso8601(start_raw)
        except ValueError:
            return validation_error_response({"start": "Invalid ISO-8601 datetime"}, status_code=400)
    if end_raw is not None:
        try:
            end = _parse_iso8601(end_raw)
        except ValueError:
            return validation_error_response({"end": "Invalid ISO-8601 datetime"}, status_code=400)
    if (start is None) != (end is None):
        return validation_error_response(
            {"range": "start and end must be provided together"}, status_code=400
        )
    if start is not None and end is not None and start >= end:
        return validation_error_response({"range": "start must be earlier than end"}, status_code=400)

    before: datetime | None = None
    if before_raw is not None:
        try:
            before = _parse_iso8601(before_raw)
        except ValueError:
            return validation_error_response({"before": "Invalid ISO-8601 datetime"}, status_code=400)

    with UnitOfWork() as uow:
        if start is None or end is None:
            items = uow.market_data.list_latest_chunk(
                limit=limit, before=before, interval="1m")
            has_more = False
            next_before: str | None = None
            if items:
                earliest_in_chunk = items[0].Timestamp
                repo_earliest = uow.market_data.get_earliest_timestamp()
                if repo_earliest is not None and earliest_in_chunk > repo_earliest:
                    has_more = True
                    next_before = _to_utc_iso(earliest_in_chunk)
        else:
            items = uow.market_data.list_range_projection(
                start=start,
                end=end,
                interval="1m",
                limit=limit,
            )
            has_more = False
            next_before = None

    return ok_response(
        {
            "data": {
                "symbol": "BTCUSDT",
                "interval": "1m",
                "has_more": has_more,
                "next_before": next_before,
                "items": [
                    {
                        "time": int(ts.timestamp()),
                        "timestamp": _to_utc_iso(ts),
                        "open": _format_decimal_8(open_),
                        "high": _format_decimal_8(high),
                        "low": _format_decimal_8(low),
                        "close": _format_decimal_8(close),
                        "volume": _format_decimal_8(volume),
                    }
                    for ts, open_, high, low, close, volume in (_extract_kline_fields(item) for item in items)
                ],
            }
        }
    )


@blueprint.post("/btcusdt/target-preview")
def preview_btcusdt_target():
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return validation_error_response({"payload": "Invalid preview payload"}, status_code=400)

    strategy_name = str(payload.get("target_strategy") or payload.get("targetStrategy") or "forward_return")
    params = payload.get("target_params") or payload.get("targetParams") or {}
    interval = str(payload.get("interval") or "1m")
    start_raw = payload.get("start_datetime") or payload.get("startDatetime")
    end_raw = payload.get("end_datetime") or payload.get("endDatetime")
    candlestick_amount_raw = payload.get("candlestick_amount") or payload.get("candlestickAmount")
    preview_mode = str(payload.get("preview_mode") or payload.get("previewMode") or "true_label")
    entry_assumption = str(payload.get("entry_assumption") or payload.get("entryAssumption") or "next_open")
    evaluation_cost_raw = payload.get("evaluation_cost_bps") or payload.get("evaluationCostBps") or 0.0
    mock_precision_raw = payload.get("mock_precision") or payload.get("mockPrecision")
    mock_recall_raw = payload.get("mock_recall") or payload.get("mockRecall")
    mock_seed_raw = payload.get("mock_seed") or payload.get("mockSeed") or 42

    errors: dict[str, str] = {}
    if interval not in SUPPORTED_PREVIEW_INTERVALS:
        errors["interval"] = f"interval must be one of {', '.join(SUPPORTED_PREVIEW_INTERVALS)}"
    if preview_mode not in {"true_label", "mock_prediction"}:
        errors["preview_mode"] = "preview_mode must be either true_label or mock_prediction"
    if entry_assumption not in {"next_open", "current_close"}:
        errors["entry_assumption"] = "entry_assumption must be either next_open or current_close"
    if not isinstance(params, dict):
        errors["target_params"] = "target_params must be an object"

    start: datetime | None = None
    end: datetime | None = None
    if start_raw is not None:
        try:
            start = _parse_iso8601(str(start_raw))
        except ValueError:
            errors["start_datetime"] = "Invalid ISO-8601 datetime"
    if end_raw is not None:
        try:
            end = _parse_iso8601(str(end_raw))
        except ValueError:
            errors["end_datetime"] = "Invalid ISO-8601 datetime"

    limit = DEFAULT_API_KLINE_LIMIT
    if candlestick_amount_raw is not None:
        limit, limit_error = _coerce_positive_int(candlestick_amount_raw, field_name="candlestick_amount")
        if limit_error:
            errors["candlestick_amount"] = limit_error
    try:
        evaluation_cost_bps = float(evaluation_cost_raw)
        if evaluation_cost_bps < 0:
            raise ValueError
    except (TypeError, ValueError):
        errors["evaluation_cost_bps"] = "evaluation_cost_bps must be a non-negative number"

    mock_precision: float | None = None
    mock_recall: float | None = None
    mock_seed = 42
    if mock_precision_raw is not None:
        try:
            mock_precision = float(mock_precision_raw)
        except (TypeError, ValueError):
            errors["mock_precision"] = "mock_precision must be a number between 0 and 1"
    if mock_recall_raw is not None:
        try:
            mock_recall = float(mock_recall_raw)
        except (TypeError, ValueError):
            errors["mock_recall"] = "mock_recall must be a number between 0 and 1"
    try:
        mock_seed = int(mock_seed_raw)
    except (TypeError, ValueError):
        errors["mock_seed"] = "mock_seed must be an integer"
    if preview_mode == "mock_prediction":
        if mock_precision is None:
            errors["mock_precision"] = "mock_precision is required in mock_prediction mode"
        if mock_recall is None:
            errors["mock_recall"] = "mock_recall is required in mock_prediction mode"

    if errors:
        return validation_error_response(errors, status_code=400)

    params = _normalize_preview_target_params(params)

    with UnitOfWork() as uow:
        preview_row_limit = min(limit, MAX_TARGET_PREVIEW_RAW_ROWS)
        preview_truncated = False
        before_end = end + timedelta(microseconds=1) if end is not None else None
        if start is not None and end is not None:
            total_rows = uow.market_data.count_range(start=start, end=end, interval="1m")
            if total_rows > MAX_TARGET_PREVIEW_RAW_ROWS:
                preview_truncated = True
                preview_row_limit = MAX_TARGET_PREVIEW_RAW_ROWS
                rows = uow.market_data.list_latest_chunk(
                    limit=MAX_TARGET_PREVIEW_RAW_ROWS,
                    before=before_end,
                    interval="1m",
                )
                rows = [row for row in rows if _coerce_datetime(_row_value(row, "timestamp")) >= start]
            else:
                rows = uow.market_data.list_range(start=start, end=end, interval="1m")
        elif end is not None:
            if limit > MAX_TARGET_PREVIEW_RAW_ROWS:
                preview_truncated = True
            rows = uow.market_data.list_latest_chunk(limit=preview_row_limit, before=before_end, interval="1m")
        else:
            if limit > MAX_TARGET_PREVIEW_RAW_ROWS:
                preview_truncated = True
            rows = uow.market_data.list_latest_chunk(limit=preview_row_limit, interval="1m")
    rows = _aggregate_preview_rows(rows, interval)

    if not rows:
        return ok_response(
            {
                "data": {
                    "symbol": "BTCUSDT",
                    "interval": interval,
                    "strategy": {"name": strategy_name},
                    "mode": {
                        "previewMode": preview_mode,
                        "entryAssumption": entry_assumption,
                        "evaluationCostBps": evaluation_cost_bps,
                        "mockPrecision": mock_precision,
                        "mockRecall": mock_recall,
                        "mockSeed": mock_seed,
                    },
                    "range": {
                        "start": _to_utc_iso(start) if start else None,
                        "end": _to_utc_iso(end) if end else None,
                        "candles": 0,
                        "previewTruncated": preview_truncated,
                        "previewRowLimit": preview_row_limit,
                    },
                    "rows": [],
                    "summary": {
                        "rowCount": 0,
                        "labeledCount": 0,
                        "positiveCount": 0,
                        "negativeCount": 0,
                        "unlabeledCount": 0,
                        "positiveRatePct": None,
                        "baselinePositiveRatePct": None,
                        "warmupNullCount": 0,
                        "tailNullCount": 0,
                        "lookaheadPeriod": 0,
                        "confusion": {field: None for field in CONFUSION_FIELDS},
                    },
                    "economics": {"horizons": []},
                    "bridge": None,
                }
            }
        )

    frame = _preview_rows_to_frame(rows)
    try:
        strategy = TargetStrategyFactory.create(strategy_name, params, allow_preview_lookahead_zero=True)
    except (TypeError, ValueError) as exc:
        return validation_error_response({"target_strategy": str(exc)}, status_code=400)

    try:
        preview = strategy.generate(frame).collect()
        rows_dict = preview.to_dicts()
        actual_target_values = [row.get("target") if row.get("target") in (0, 1) else None for row in rows_dict]
        if preview_mode == "mock_prediction":
            display_target_values, bridge = _simulate_prediction_labels(
                actual_target_values,
                precision=mock_precision or 0.0,
                recall=mock_recall or 0.0,
                seed=mock_seed,
            )
        else:
            display_target_values = actual_target_values[:]
            bridge = None

        direction_values: list[int | None] = []
        actual_values: list[int | None] = []
        preview_rows: list[dict[str, object]] = []
        for index, row in enumerate(rows_dict):
            candle_direction = 1 if float(_row_value(rows[index], "close")) > float(_row_value(rows[index], "open")) else -1 if float(_row_value(rows[index], "close")) < float(_row_value(rows[index], "open")) else 0
            direction_values.append(candle_direction)
            actual = 1 if candle_direction > 0 else 0
            actual_values.append(actual)
            target = display_target_values[index]
            preview_rows.append({
                "time": int(_row_value(rows[index], "timestamp").timestamp()),
                "timestamp": _to_utc_iso(_row_value(rows[index], "timestamp")),
                "open": _format_decimal_8(_row_value(rows[index], "open")),
                "high": _format_decimal_8(_row_value(rows[index], "high")),
                "low": _format_decimal_8(_row_value(rows[index], "low")),
                "close": _format_decimal_8(_row_value(rows[index], "close")),
                "volume": _format_decimal_8(_row_value(rows[index], "volume")),
                "target": int(target) if target in (0, 1) else None,
                "candleDirection": candle_direction,
                "actualDirectionTarget": actual,
            })

        target_values = display_target_values
        tail_null_count = _count_tail_nulls(target_values)
        labeled_count = len([value for value in target_values if value in (0, 1)])
        positive_count = len([value for value in target_values if value == 1])
        negative_count = len([value for value in target_values if value == 0])
        confusion = ConfusionMetricsLogStrategy().build({
            "y_true": target_values,
            "y_pred": actual_values,
            "x": direction_values,
            "execution_lag_bars": 0,
        })
        positive_rate = (positive_count / labeled_count) * 100.0 if labeled_count else None
        actual_positive_count = len([value for value in actual_values if value == 1])
        actual_negative_count = len([value for value in actual_values if value == 0])
        actual_positive_rate = (actual_positive_count / len(actual_values)) * 100.0 if actual_values else None
        direction_up_count = len([value for value in direction_values if value == 1])
        direction_down_count = len([value for value in direction_values if value == -1])
        direction_flat_count = len([value for value in direction_values if value == 0])

        economics_horizons: list[dict[str, object]] = []
        for horizon in (1, 2, 3, 4, 5, 10, 20, 50, 100):
            return_rows: list[float] = []
            signal_rows: list[float] = []
            non_signal_rows: list[float] = []
            for index, target in enumerate(target_values):
                if target not in (0, 1):
                    continue

                if entry_assumption == "next_open":
                    if index + 1 >= len(rows_dict) or index + horizon >= len(rows_dict):
                        continue
                    entry_price = float(_row_value(rows[index + 1], "open"))
                    exit_price = float(_row_value(rows[index + horizon], "close"))
                else:
                    if index + horizon >= len(rows_dict):
                        continue
                    entry_price = float(_row_value(rows[index], "close"))
                    exit_price = float(_row_value(rows[index + horizon], "close"))

                if entry_price == 0:
                    continue
                forward_return = (exit_price / entry_price) - 1.0 - (evaluation_cost_bps / 10_000.0)
                return_rows.append(forward_return)
                if target == 1:
                    signal_rows.append(forward_return)
                else:
                    non_signal_rows.append(forward_return)

            all_stats = _cohort_stats(return_rows)
            signal_stats = _cohort_stats(signal_rows)
            non_signal_stats = _cohort_stats(non_signal_rows)
            economics_horizons.append({
                "horizon": horizon,
                "allCount": all_stats["count"],
                "signalCount": signal_stats["count"],
                "nonSignalCount": non_signal_stats["count"],
                "allMeanPct": (all_stats["mean"] * 100.0) if all_stats["mean"] is not None else None,
                "signalMeanPct": (signal_stats["mean"] * 100.0) if signal_stats["mean"] is not None else None,
                "nonSignalMeanPct": (non_signal_stats["mean"] * 100.0) if non_signal_stats["mean"] is not None else None,
                "signalSpreadPct": ((signal_stats["mean"] - non_signal_stats["mean"]) * 100.0) if signal_stats["mean"] is not None and non_signal_stats["mean"] is not None else None,
                "liftPct": ((signal_stats["mean"] - all_stats["mean"]) * 100.0) if signal_stats["mean"] is not None and all_stats["mean"] is not None else None,
                "allMedianPct": (all_stats["median"] * 100.0) if all_stats["median"] is not None else None,
                "signalMedianPct": (signal_stats["median"] * 100.0) if signal_stats["median"] is not None else None,
                "allWinRatePct": (all_stats["win_rate"] * 100.0) if all_stats["win_rate"] is not None else None,
                "signalWinRatePct": (signal_stats["win_rate"] * 100.0) if signal_stats["win_rate"] is not None else None,
                "allProfitFactor": all_stats["profit_factor"],
                "signalProfitFactor": signal_stats["profit_factor"],
                "positiveRatePct": positive_rate,
            })
    except Exception as exc:
        return error_response(f"Target preview failed for {strategy_name}: {exc}", status_code=500, code="TARGET_PREVIEW_FAILED")

    return ok_response(
        {
            "data": {
                "symbol": "BTCUSDT",
                "interval": interval,
                "strategy": {
                    "name": strategy_name,
                    "binaryLabelRule": getattr(strategy, "binary_label_rule", None),
                    "defaultValues": getattr(strategy, "default_values", {}),
                    "parameters": params,
                },
                "mode": {
                    "previewMode": preview_mode,
                    "entryAssumption": entry_assumption,
                    "evaluationCostBps": evaluation_cost_bps,
                    "mockPrecision": mock_precision,
                    "mockRecall": mock_recall,
                    "mockSeed": mock_seed,
                },
                "range": {
                    "start": _to_utc_iso(_row_value(rows[0], "timestamp")) if rows else (_to_utc_iso(start) if start else None),
                    "end": _to_utc_iso(_row_value(rows[-1], "timestamp")) if rows else (_to_utc_iso(end) if end else None),
                    "candles": len(preview_rows),
                    "previewTruncated": preview_truncated,
                    "previewRowLimit": preview_row_limit,
                },
                "rows": preview_rows,
                "summary": {
                    "rowCount": len(preview_rows),
                    "labeledCount": labeled_count,
                    "positiveCount": positive_count,
                    "negativeCount": negative_count,
                    "unlabeledCount": len(preview_rows) - labeled_count,
                    "positiveRatePct": positive_rate,
                    "actualPositiveRatePct": actual_positive_rate,
                    "actualPositiveCount": actual_positive_count,
                    "actualNegativeCount": actual_negative_count,
                    "directionUpCount": direction_up_count,
                    "directionDownCount": direction_down_count,
                    "directionFlatCount": direction_flat_count,
                    "warmupNullCount": _count_warmup_nulls(target_values),
                    "tailNullCount": tail_null_count,
                    "lookaheadPeriod": getattr(strategy, "lookahead_period", 0) or 0,
                    "confusion": confusion,
                },
                "economics": {"horizons": economics_horizons},
                "bridge": bridge,
            }
        }
    )


@blueprint.get("/btcusdt/metadata")
def get_btcusdt_metadata():
    with UnitOfWork() as uow:
        latest = uow.market_data.get_latest_timestamp() if uow.market_data else None
        earliest = uow.market_data.get_earliest_timestamp() if uow.market_data else None

    return ok_response(
        {
            "data": {
                "symbol": "BTCUSDT",
                "interval": "1m",
                "latestTimestamp": latest.isoformat() + "Z" if latest else None,
                "earliestTimestamp": earliest.isoformat() + "Z" if earliest else None,
            }
        }
    )
