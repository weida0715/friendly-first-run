---
title: Experiment Workflow
category: Experiments
order: 3
---

# Experiment Workflow

An Experiment combines an approved Blueprint, BTCUSDT data range, train/validation/test split settings, target strategy, and parameter overrides.

## States

- `Queued`: waiting for a worker.
- `Running`: evaluating model permutations.
- `Completed`: finished successfully and can be exported.
- `Failed`: stopped before successful completion.
- `Cancelled`: stopped by a user or system action.

## Configuration fields

| Field | Meaning |
| --- | --- |
| `interval` | Supported values: `1m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `1d`. |
| `start_datetime`, `end_datetime` | Requested persisted BTCUSDT range; naive datetimes are treated as UTC. |
| `train_split`, `val_split`, `test_split` | Split percentages, normally 80/10/10. |
| `split_strategy` | `time_based_sequential`, alias `sequential`, or `random`. |
| `target_strategy` | `forward_return` or `roc_lookahead`. |
| `deterministic` | Whether permutation sampling uses the configured seed. |
| `seed` | Random seed for sampling and random splits. |
| `parameter_overrides` | Per-experiment changes to architecture, indicator, target, or split parameters. |
| `indicator_output_scalers` | Per-experiment overrides for indicator output column scaling. |
| `requested_permutation_count` | Requested number of parameter combinations, capped at max possible count. |

## Compilation

`ExperimentCompiler` creates immutable snapshots, expands scalar/list parameters into Cartesian products, deduplicates by stable SHA-256 `parameter_hash`, and samples requested permutations.

String values are normalized: booleans, numbers, JSON arrays, and comma-separated lists are converted before expansion.

## Data loading and interval materialization

The executor loads persisted BTCUSDT OHLCV rows. It does not fetch missing Binance data during execution. Higher intervals are materialized with first open, max high, min low, last close, and summed volume.

## Split strategies

### `time_based_sequential` / `sequential`

Sorts by timestamp and cuts contiguous train, validation, and test segments.

### `random`

Sorts by timestamp, adds `_row_id`, shuffles with seed, slices splits, then sorts each split by timestamp. Metadata stores seed and permutation.

## Target strategies

### `forward_return`

`target = 1` when `close[t + lookahead] / close[t] - 1 > return_threshold`.

| Parameter | Default | Constraints | Meaning |
| --- | --- | --- | --- |
| `lookahead_period` | `1` | integer, 1 to 1440 | Future row offset. |
| `return_threshold` | `0.0` | number, -1.0 to 1.0 | Minimum future return. |

### `roc_lookahead`

`target = 1` when `(close[t + lookahead] - close[t]) / close[t] > roc_threshold`.

| Parameter | Default | Constraints | Meaning |
| --- | --- | --- | --- |
| `lookahead_period` | `1` | integer, 1 to 1440 | Future row offset. |
| `roc_threshold` | `0.0` | number, -1.0 to 1.0 | Minimum future rate-of-change. |

## Execution pipeline

1. Load config and snapshots.
2. Query persisted BTCUSDT candles.
3. Materialize interval candles.
4. Validate candle count.
5. Split data.
6. Apply indicators per split.
7. Apply indicator output scalers.
8. Drop warm-up/null/NaN/infinite rows.
9. Generate targets.
10. Standardize remaining features.
11. For each permutation: rebuild features, train, predict, evaluate, backtest, persist model/logs.
12. Mark complete or failed.

## Progress stages

| Stage | Meaning |
| --- | --- |
| `load_klines_query_start` | Querying persisted candles. |
| `load_klines_query_complete` | Candles loaded with row count and elapsed time. |
| `materialize_interval_start` | Building requested interval candles. |
| `materialize_interval_complete` | Interval candles ready. |
| `validate_range_start` | Checking enough rows exist. |
| `validate_range_complete` | Range validation passed. |
| `split_data_complete` | Train/validation/test splits created. |

## Leakage controls

Indicators, targets, and scaling are handled per split to avoid train/test leakage. Output scalers default to `none` and can be overridden in the experiment wizard without changing the source Blueprint.
