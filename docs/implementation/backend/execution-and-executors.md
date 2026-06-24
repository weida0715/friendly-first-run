# Backend Execution And Executors Module

Execution code turns a saved experiment into trained model records, metrics, logs, and progress updates.

## `backend/app/execution/experiment_compiler.py`

Explanation: Converts a blueprint and experiment request into an immutable compiled plan. It merges overrides, validates override constraints, expands parameter permutations, hashes parameter sets, and preserves the effective config snapshot even if the source blueprint later changes.

Pseudocode:

```text
function stable_parameter_hash(parameters):
  JSON serialize parameters with sorted keys
  return short hash

ExperimentCompiler.compile(blueprint, payload, max_requested):
  copy blueprint config
  merge allowed target, split, architecture, and indicator overrides
  reject unsupported/disallowed override values
  expand comma-separated/list/range values into candidates
  compute cartesian parameter permutations
  clamp to max requested permutations
  attach stable hash to each permutation
  return CompiledExperimentPlan
```

## `backend/app/execution/feature_scaler.py`

Explanation: Provides feature scaling for indicator output columns. It can normalize, standardize, log-transform, or pass through columns, and `scale_indicator_outputs()` applies the requested scaler per output.

Pseudocode:

```text
FeatureScaler.fit_transform(frame, columns, method):
  collect training statistics
  for each selected column:
    if normalization: apply min/max scaling
    if standardization: apply z-score scaling
    if log_transform: apply signed log transform
    if none: leave unchanged
  return scaled frame and stats

function scale_indicator_outputs(df, output_scalers):
  for each output column and scaler name:
    apply scaler expression
  return lazy frame
```

## `backend/app/executors/experiment_executor.py`

Explanation: Defines the abstract executor interface and the shared `ExecutionContext` used by concrete experiment executors.

Pseudocode:

```text
class ExperimentExecutor:
  ExecutionContext:
    experiment_id
    config
    progress
    intermediate artifacts

  abstract execute(experiment_id)
  abstract methods for pipeline stages
```

## `backend/app/executors/default_experiment_executor.py`

Explanation: Runs the default BTCUSDT experiment pipeline. It loads persisted candles, aggregates intervals, computes features and targets, splits data, trains every parameter permutation, evaluates metrics, simulates backtests, writes model/log rows, and emits progress.

Pseudocode:

```text
execute(experiment_id):
  ctx = new execution context
  config = load experiment and compiled snapshot
  raw_klines = load persisted BTCUSDT candles
  interval_data = aggregate requested interval
  validate enough rows
  indicators = build indicator pipeline
  feature_data = apply indicators and warmup cleanup
  feature_data = scale requested indicator outputs
  target_data = build target labels
  splits = split into train/validation/test
  for each parameter permutation:
    build architecture
    train model on train split
    predict/evaluate validation/test split
    run long-only backtest
    persist ModelORM and ExperimentLog rows
    optionally persist capped round logs
    emit progress
  mark experiment completed
  return execution summary

helper candles_to_lazyframe(rows):
  convert candle domain objects to Polars frame

helper aggregate_ohlcv_interval(frame, interval):
  group 1m candles into requested OHLCV interval
```
