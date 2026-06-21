---
title: Logs and Metrics
category: Metrics
order: 5
---

# Logs and Metrics

BEE stores result artifacts for completed experiments as Model columns and structured ExperimentLog rows.

## Model metrics

| Field | Meaning |
| --- | --- |
| `sharpe` | Stored from backtest `sharpe_per_bar`. |
| `accuracy` | Fraction of cleaned test rows where prediction equals target. Stored as ratio 0-1. |
| `precision` | Fraction of predicted-positive rows that were actual positives. Stored as ratio 0-1. |
| `recall` | Fraction of actual-positive rows predicted positive. Stored as ratio 0-1. |
| `parameter_hash` | Stable SHA-256 hash identifying the exact parameter combination. |

## Backtest log

Backtest logs have `type=backtest`. The trading strategy is long-only and single-position: enter long when prediction becomes `1`, hold while predictions stay positive, exit when prediction becomes `0` or at the final bar. `execution_lag_bars` defaults to 1, so fills occur after the signal bar. `cost_round_trip_bps` subtracts round-trip cost from each trade.

| Field | Meaning |
| --- | --- |
| `trade_win_rate_pct` | Percentage of closed trades whose net return is positive. |
| `trade_expectancy_pct` | Mean net return percentage across all trades. Returns `0.0` when there are no trades. |
| `max_drawdown_pct` | Absolute maximum drawdown percentage from the compounded trade equity curve. |
| `total_return_gross_pct` | Compounded gross portfolio return percentage before costs. |
| `total_return_net_pct` | Compounded net portfolio return percentage after round-trip costs. |
| `trade_return_mean_win_pct` | Mean net return of winning trades, or null when none exist. |
| `trade_return_mean_loss_pct` | Mean net return of losing/non-winning trades, or null when none exist. |
| `bars_total` | Number of test bars evaluated by the backtest. |
| `sharpe_per_bar` | Mean per-bar portfolio return divided by population standard deviation of per-bar portfolio returns. Null unless at least two bars and non-zero variance exist. |
| `sharpe_annualized` | `sharpe_per_bar` scaled by the square root of bars per year for the configured interval. Null when the interval is unknown or `sharpe_per_bar` is null. |
| `bars_in_market_pct` | Percentage of test bars where the strategy was already in a long position. |
| `trades_count` | Count of closed long trades. |
| `cost_round_trip_bps` | Cost subtracted per trade in basis points. |

## Confusion log

Confusion logs have `type=confusion`. They compare binary target labels against binary predictions. Return statistics are aligned with `execution_lag_bars` when price-change data exists, and the default lag is `1` unless the caller overrides it.

| Field | Meaning |
| --- | --- |
| `n_kept` | Number of rows kept after alignment, optional outlier filtering, and binary validation. |
| `tp_count` | True positives: actual `1`, predicted `1`. |
| `fp_count` | False positives: actual `0`, predicted `1`. |
| `tn_count` | True negatives: actual `0`, predicted `0`. |
| `fn_count` | False negatives: actual `1`, predicted `0`. |
| `pred_pos_count` | Total predicted positives, `tp_count + fp_count`. |
| `actual_pos_count` | Total actual positives, `tp_count + fn_count`. |
| `precision_pct` | `tp / (tp + fp) * 100`, null when there are no predicted positives. |
| `recall_pct` | `tp / (tp + fn) * 100`, null when there are no actual positives. |
| `f1_score_pct` | Harmonic mean of precision and recall, in percent, null when undefined. |
| `accuracy_pct` | `(tp + tn) / n_kept * 100`, null when no rows remain. |
| `pred_pos_rate_pct` | Predicted-positive rate, `(tp + fp) / n_kept * 100`. |
| `actual_pos_rate_pct` | Actual-positive rate, `(tp + fn) / n_kept * 100`. |
| `tp_mean_return_pct` | Mean aligned return for true-positive rows. |
| `fp_mean_return_pct` | Mean aligned return for false-positive rows. |
| `tn_mean_return_pct` | Mean aligned return for true-negative rows. |
| `fn_mean_return_pct` | Mean aligned return for false-negative rows. |

## Round logs

Round logs have `type=round` and are per-test-row prediction records. They are limited by `max_round_log_rows`; if no persisted round rows exist, the API attempts to regenerate them for owner-only model round-log requests.

| Field | Meaning |
| --- | --- |
| `roundIndex` / `round_index` | Zero-based row index inside the logged test rows. |
| `timestamp` | Test-row timestamp. |
| `predicted` | Predicted binary class. |
| `actual` | Actual binary target. |
| `outcome` | `win` for predicted 1 and actual 1; `lose` for predicted 1 and actual 0; otherwise `none`. |
| `signal` | Stored signal value, currently same as predicted class. |
| `prediction` | Stored Decimal prediction value. |
| `parameterHash` / `parameter_hash` | Parameter hash for the model. |

## Parameter correlation logs

The parameter-correlation export is built from model parameters joined with backtest metrics. It measures Pearson correlation between numeric parameter fields and `total_return_net_pct`.

| Field | Meaning |
| --- | --- |
| `cohort_pct` | Percentage of input rows that had valid numeric values for this feature and metric. |
| `feature` | Numeric parameter or metric field being correlated. |
| `n_rows` | Number of paired rows used. |
| `corr` | Pearson correlation. Positive means higher feature values move with higher metric values. |
| `corr_med` | Median bootstrap correlation. |
| `ci_lo`, `ci_hi` | 2.5% and 97.5% bootstrap interval bounds. |
| `sign_stability` | Fraction of bootstrap samples with the same sign as `corr`. |

The export returns no rows when fewer than `min_n` valid observations exist.

## Split metadata and console logs

- `split_metadata` rows describe split name, start timestamp, end timestamp, and row count when available.
- `console` rows describe operational messages with timestamp, level, and message when available.

## Public model IDs

Export APIs map internal database model IDs to zero-based public `modelId` values. This avoids leaking internal primary keys while keeping exports joinable by model within the same experiment.
