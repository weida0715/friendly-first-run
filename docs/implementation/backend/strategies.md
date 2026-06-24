# Backend Strategies Module

Strategies are pluggable algorithm pieces used by experiment execution: indicators, targets, splits, model metrics, logs, jobs, and trading backtests.

## `backend/app/strategies/architecture_strategy.py`

Explanation: Abstract interface for trainable model architecture implementations.

Pseudocode:

```text
ArchitectureStrategy:
  metadata()
  train(train_data, params)
  predict(trained_model, data)
```

## `backend/app/strategies/blueprint_executor_factory.py`

Explanation: Minimal placeholder factory in the strategies namespace for blueprint executor construction.

Pseudocode:

```text
BlueprintExecutorFactory.create():
  return blueprint executor
```

## `backend/app/strategies/cancellable_job_strategy.py`

Explanation: Abstract interface for cancellation handlers that know how to cancel a given job type.

Pseudocode:

```text
CancellableJobStrategy:
  supports(job_type)
  cancel(job_id, payload)
```

## `backend/app/strategies/data_split_strategy.py`

Explanation: Selects the requested data split implementation by name.

Pseudocode:

```text
DataSplitStrategyFactory.create(name):
  if random: return RandomSplitStrategy
  if time_based_sequential: return TimeBasedSequentialSplitStrategy
  else: raise unsupported split
```

## `backend/app/strategies/experiment_cancellation_handler.py`

Explanation: Cancels experiment jobs by marking queued/running experiment state and returning a cancellation result.

Pseudocode:

```text
supports(job_type):
  return job_type == experiment

cancel(job):
  if already cancelled/completed: return idempotent result
  if queued: mark experiment Cancelled
  if running: set cancellation requested/mark status as needed
  return CancellationResult
```

## `backend/app/strategies/experiment_log_strategy.py`

Explanation: Abstract interface for building experiment log payloads.

Pseudocode:

```text
ExperimentLogStrategy:
  build(context, inputs) -> log payload
```

## `backend/app/strategies/indicator_strategy.py`

Explanation: Defines indicator strategy interfaces, runs selected indicators in sequence, and drops warmup rows with invalid generated features.

Pseudocode:

```text
IndicatorPipelineStrategy.apply(df):
  for each indicator:
    df = indicator.apply(df)
  return df

drop_warmup_nulls(df):
  inspect numeric/feature columns
  remove rows with null/non-finite warmup outputs
```

## `backend/app/strategies/job_cancellation.py`

Explanation: Small compatibility module for job cancellation behavior/types.

Pseudocode:

```text
define cancellation strategy exports or aliases
```

## `backend/app/strategies/job_cancellation_handler_registry.py`

Explanation: Registers cancellation handlers and resolves the handler for a job type.

Pseudocode:

```text
resolve(job_type):
  for handler in handlers:
    if handler.supports(job_type): return handler
  raise unsupported job type

default():
  return registry with ExperimentCancellationHandler
```

## `backend/app/strategies/job_execution_strategies.py`

Explanation: Defines job strategy classes for experiment, data ingestion, and log export job types.

Pseudocode:

```text
ExperimentJobStrategy.execute(payload):
  run experiment worker handler

DataIngestionJobStrategy.execute(payload):
  run data ingestion job

LogExportJobStrategy.execute(payload):
  run log export job
```

## `backend/app/strategies/job_strategy.py`

Explanation: Abstract job execution interface.

Pseudocode:

```text
JobStrategy:
  supports(job_type)
  execute(payload)
```

## `backend/app/strategies/logreg_binary_executor.py`

Explanation: Placeholder/compatibility executor for logistic-regression binary workflows.

Pseudocode:

```text
LogregBinaryExecutor:
  execute binary logistic-regression flow
```

## `backend/app/strategies/metrics_strategy.py`

Explanation: Abstract interface for metric calculation strategies.

Pseudocode:

```text
MetricsStrategy.calculate(y_true, y_pred, extras):
  return metrics dictionary
```

## `backend/app/strategies/reference_architecture_executor.py`

Explanation: Placeholder/compatibility class for reference architecture execution.

Pseudocode:

```text
ReferenceArchitectureExecutor:
  execute reference architecture flow
```

## `backend/app/strategies/scaling_strategy.py`

Explanation: Implements simple standard scaling with train-only fit and transform behavior.

Pseudocode:

```text
fit(train_values):
  mean = average
  std = standard deviation or 1

transform(values):
  return (value - mean) / std
```

## `backend/app/strategies/target_strategy.py`

Explanation: Registry/factory for target strategies used during experiment execution.

Pseudocode:

```text
TargetStrategyFactory.create(name):
  map name to target class
  instantiate with params

metadata():
  return target defaults and constraints
```

## `backend/app/strategies/trading_strategy.py`

Explanation: Defines the trading backtest result shape and abstract trading strategy interface.

Pseudocode:

```text
BacktestResult:
  metrics
  trades
  equity curve

TradingStrategy.run(prices, predictions, params):
  return BacktestResult
```

## `backend/app/strategies/indicators/base.py`

Explanation: Abstract base class for custom indicators.

Pseudocode:

```text
CustomIndicator:
  name
  metadata
  apply(df, params)
```

## `backend/app/strategies/indicators/custom_indicator_strategy.py`

Explanation: Registers custom indicator classes and creates them by name.

Pseudocode:

```text
CustomIndicatorFactory:
  registry = custom indicator classes
  metadata(): return all custom metadata
  create(name): return indicator instance
```

## `backend/app/strategies/indicators/ichimoku_cloud.py`

Explanation: Adds Ichimoku cloud-style trend columns from high, low, and close data.

Pseudocode:

```text
apply(df, params):
  compute conversion line from rolling high/low
  compute base line from longer rolling high/low
  compute span values
  append output columns
```

## `backend/app/strategies/indicators/price_range_position.py`

Explanation: Computes where close price sits inside the recent high/low range.

Pseudocode:

```text
apply(df, window):
  rolling_low = min(low, window)
  rolling_high = max(high, window)
  position = (close - rolling_low) / (rolling_high - rolling_low)
  append column
```

## `backend/app/strategies/indicators/quantile_flag.py`

Explanation: Creates a binary indicator by comparing a source column to a rolling or fitted quantile threshold.

Pseudocode:

```text
apply(df, params):
  compute quantile cutoff for source column
  flag = source >= cutoff
  append flag column
```

## `backend/app/strategies/indicators/rolling_volatility.py`

Explanation: Computes rolling return volatility from close prices.

Pseudocode:

```text
apply(df, window):
  returns = pct_change(close)
  volatility = rolling_std(returns, window)
  append volatility column
```

## `backend/app/strategies/indicators/sma_crossover.py`

Explanation: Computes fast and slow simple moving averages and a crossover signal.

Pseudocode:

```text
apply(df, fast_window, slow_window):
  fast = rolling_mean(close, fast_window)
  slow = rolling_mean(close, slow_window)
  signal = fast - slow or fast > slow
  append columns
```

## `backend/app/strategies/indicators/talib_indicator_strategy.py`

Explanation: Applies supported TA-Lib-style indicators using mapped OHLCV input signatures and sanitized numeric params.

Pseudocode:

```text
apply(df, name, params):
  sanitize params; reject unexpanded lists
  resolve required input columns for indicator
  call matching technical-analysis calculation
  append output columns

abstract_input_columns(name):
  return close/high-low-close/volume signature
```

## `backend/app/strategies/indicators/time_features.py`

Explanation: Adds time-derived features from candle timestamps.

Pseudocode:

```text
apply(df):
  extract hour/day/week fields from timestamp
  append cyclical or scalar time columns
```

## `backend/app/strategies/indicators/trend_strength.py`

Explanation: Computes a simple trend-strength value from recent price movement.

Pseudocode:

```text
apply(df, window):
  compare current close to rolling mean or prior close
  normalize movement by price/volatility
  append trend strength
```

## `backend/app/strategies/indicators/vwap.py`

Explanation: Computes volume-weighted average price from OHLCV data.

Pseudocode:

```text
apply(df, window):
  typical_price = (high + low + close) / 3
  vwap = rolling_sum(typical_price * volume) / rolling_sum(volume)
  append vwap
```

## `backend/app/strategies/indicators/wilder_rsi.py`

Explanation: Computes Wilder-style RSI from close price changes.

Pseudocode:

```text
apply(df, period):
  delta = close.diff()
  gains/losses = positive/negative deltas
  smoothed averages = Wilder smoothing
  rsi = 100 - 100 / (1 + avg_gain / avg_loss)
  append rsi
```

## `backend/app/strategies/logs/backtest_log_strategy.py`

Explanation: Builds backtest log payloads from backtest results.

Pseudocode:

```text
build(result):
  copy backtest metrics
  include trade/equity summaries
  return log payload
```

## `backend/app/strategies/logs/confusion_metrics_log_strategy.py`

Explanation: Builds binary confusion and return-quadrant metrics from labels, predictions, prices, returns, and execution lag.

Pseudocode:

```text
build(payload):
  coerce true labels and predictions to binary
  align returns using execution lag
  filter invalid rows
  compute TP/FP/TN/FN
  compute accuracy, precision, recall, f1
  compute return stats by quadrant
  return metrics
```

## `backend/app/strategies/logs/parameter_correlation_strategy.py`

Explanation: Computes simple Pearson correlations between varied parameters and a selected performance metric.

Pseudocode:

```text
build_parameter_correlation(rows, metric):
  find numeric candidate parameter columns
  for each feature:
    pair feature values with metric values
    compute Pearson correlation
    include percentile summaries
  return sorted correlation rows
```

## `backend/app/strategies/logs/reproducibility_log_strategy.py`

Explanation: Builds reproducibility metadata logs for experiment runs.

Pseudocode:

```text
build(context):
  include seed, config snapshot, parameter hash, environment metadata
  return payload
```

## `backend/app/strategies/metrics/binary_classification_metrics_strategy.py`

Explanation: Calculates binary classification metrics.

Pseudocode:

```text
calculate(y_true, y_pred):
  compute accuracy
  compute precision/recall/f1 with zero-division handling
  return metrics
```

## `backend/app/strategies/metrics/continuous_metrics_strategy.py`

Explanation: Calculates regression/continuous prediction metrics.

Pseudocode:

```text
calculate(y_true, y_pred):
  compute error values
  return MAE/MSE/RMSE or similar continuous metrics
```

## `backend/app/strategies/metrics/__init__.py`

Explanation: Provides a factory for selecting metrics strategy by prediction type.

Pseudocode:

```text
MetricsStrategyFactory.create(kind):
  if binary: return BinaryClassificationMetricsStrategy
  if continuous: return ContinuousMetricsStrategy
```

## `backend/app/strategies/splits/base.py`

Explanation: Defines the split strategy interface and shared helpers for split percentages, row counts, boundaries, and result construction.

Pseudocode:

```text
split_percentages(cfg):
  return train, validation, test ratios

split_sizes(row_count, cfg):
  compute integer row counts

boundary(frame):
  return first/last timestamps and count

build_split_result(train, val, test):
  return SplitResult with metadata
```

## `backend/app/strategies/splits/random_split_strategy.py`

Explanation: Splits data randomly using a seed.

Pseudocode:

```text
split(df, cfg, seed):
  collect rows
  shuffle deterministically with seed
  slice train/validation/test sizes
  return SplitResult
```

## `backend/app/strategies/splits/split_result.py`

Explanation: Strategy-layer split result object used by split implementations.

Pseudocode:

```text
SplitResult:
  train
  validation
  test
  metadata
```

## `backend/app/strategies/splits/time_based_sequential_split_strategy.py`

Explanation: Splits chronologically to avoid future leakage.

Pseudocode:

```text
split(df, cfg):
  sort by timestamp
  compute split sizes
  train = first segment
  validation = middle segment
  test = final segment
  return SplitResult
```

## `backend/app/strategies/targets/base.py`

Explanation: Abstract interface for target-label generation.

Pseudocode:

```text
TargetStrategy:
  name
  metadata/defaults
  apply(df, params) -> df with target column
```

## `backend/app/strategies/targets/candle_direction_target_strategy.py`

Explanation: Creates a binary label indicating whether a future close is above the current close.

Pseudocode:

```text
apply(df, lookahead):
  future_close = close shifted backward by lookahead
  target = future_close > close
  append target
```

## `backend/app/strategies/targets/forward_return_target_strategy.py`

Explanation: Creates a target from future percentage return.

Pseudocode:

```text
apply(df, lookahead, threshold):
  future_return = future_close / close - 1
  target = future_return > threshold
  append target and return column
```

## `backend/app/strategies/targets/quantile_flag_target_strategy.py`

Explanation: Fits or computes a quantile cutoff and creates shifted binary labels from future values.

Pseudocode:

```text
compute_quantile_cutoff(data, column, q):
  return quantile value

quantile_flag(data, column, cutoff):
  flag = column >= cutoff

apply(df, source_column, quantile, lookahead):
  cutoff = compute cutoff
  future_value = shift source by lookahead
  target = future_value >= cutoff
  append target
```

## `backend/app/strategies/targets/roc_lookahead_target_strategy.py`

Explanation: Creates a binary label from future rate-of-change over a lookahead window.

Pseudocode:

```text
apply(df, lookahead, threshold):
  roc = future_close / close - 1
  target = roc > threshold
  append target
```

## `backend/app/strategies/targets/trade_quality_target_strategies.py`

Explanation: Contains trade-oriented target strategies: cost-adjusted forward return, triple barrier, volatility-adjusted forward return, and MFE/MAE trade quality.

Pseudocode:

```text
CostAdjustedForwardReturn:
  target = future_return > trading_cost_buffer

TripleBarrier:
  for each row:
    scan future window
    if take-profit hit first: target = 1
    if stop-loss hit first: target = 0
    else use final return

VolatilityAdjustedForwardReturn:
  compute recent volatility
  target = future_return > volatility_multiplier * volatility

MfeMaeTradeQuality:
  compute max favorable/adverse excursion in future window
  target = favorable excursion dominates adverse excursion by threshold
```

## `backend/app/strategies/trading/long_only_single_position_strategy.py`

Explanation: Simulates a long-only strategy that enters on positive predictions, exits on negative predictions, applies execution lag/costs, force-closes at the end, and computes backtest metrics.

Pseudocode:

```text
run(prices, predictions, params):
  shift predictions by execution lag
  for each bar:
    if no position and signal positive: enter long
    if in position and signal non-positive: exit long
    mark equity and drawdown
  if still in position: close at final bar
  compute trade returns, total return, drawdown, Sharpe, win rate
  return BacktestResult
```
