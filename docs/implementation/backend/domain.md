# Backend Domain Module

The domain module contains plain dataclasses and small value objects used between controllers, repositories, services, and execution code.

## `backend/app/domain/architecture.py`

Explanation: Defines `ArchitectureMetadata`, the metadata shape returned for trainable model architectures.

Pseudocode:

```text
ArchitectureMetadata:
  name
  display_name
  description
  parameter_constraints
```

## `backend/app/domain/models/blueprint.py`

Explanation: Defines the blueprint domain object with owner, identity, strategy config, approval state, version, and timestamps.

Pseudocode:

```text
Blueprint:
  store blueprint ID, owner ID, name, description
  store indicators and architecture config
  store approval state, visibility, version, lineage
  store created/updated timestamps
```

## `backend/app/domain/models/btcusdt_kline.py`

Explanation: Defines one BTCUSDT OHLCV candle as a domain object with open/close time, decimal prices, volume, and update timestamp.

Pseudocode:

```text
BTCUSDTKline:
  timestamp = candle open time
  open/high/low/close/volume = Decimal values
  close_time = candle close time
  updated_at = persistence update time
```

## `backend/app/domain/models/experiment.py`

Explanation: Defines experiment metadata and execution state, including owner, blueprint, symbol, date range, split settings, status, progress, job ID, compiled snapshot, and timestamps.

Pseudocode:

```text
Experiment:
  identify experiment and owner
  store selected blueprint and symbol/date range
  store train/validation/test split fractions
  store status/progress/current stage/job ID
  store compiled snapshot and parameter overrides
  store created/completed timestamps
```

## `backend/app/domain/models/experiment_confusion_metrics.py`

Explanation: Defines the structured confusion-metric result for one model/experiment.

Pseudocode:

```text
ExperimentConfusionMetrics:
  store true/false positive/negative counts
  store accuracy, precision, recall, f1
```

## `backend/app/domain/models/experiment_log.py`

Explanation: Defines a persisted experiment log record with experiment/model linkage, log type, JSON metrics payload, and timestamp.

Pseudocode:

```text
ExperimentLog:
  experiment_id
  optional model_id
  log_type
  metrics payload
  created_at
```

## `backend/app/domain/models/favorite_blueprint.py`

Explanation: Defines a user-to-blueprint favorite link.

Pseudocode:

```text
FavoriteBlueprint:
  user_id
  blueprint_id
  created_at
```

## `backend/app/domain/models/favorite_model.py`

Explanation: Defines a user-to-model favorite link.

Pseudocode:

```text
FavoriteModel:
  user_id
  model_id
  created_at
```

## `backend/app/domain/models/model.py`

Explanation: Defines a trained model artifact associated with an experiment, including metrics, parameters, storage reference, and timestamps.

Pseudocode:

```text
Model:
  model_id, experiment_id, owner_id
  architecture name and parameters
  metrics and artifact reference
  created_at
```

## `backend/app/domain/models/system_event.py`

Explanation: Defines an audit/system event with scope, action, actor, target, message, metadata, and timestamp.

Pseudocode:

```text
SystemEvent:
  scope and action
  actor user details
  target type/id
  message and metadata
  created_at
```

## `backend/app/domain/models/user.py`

Explanation: Defines the user domain object with identity, login fields, role, status, password hash, and timestamps.

Pseudocode:

```text
User:
  user_id, name, username, email
  password_hash
  role and status
  created_at, updated_at
```

## `backend/app/domain/value_objects/cancellation_result.py`

Explanation: Immutable result object returned by cancellation handlers.

Pseudocode:

```text
CancellationResult:
  cancelled = true/false
  message
  optional job_id or experiment_id metadata
```

## `backend/app/domain/value_objects/evaluation_result.py`

Explanation: Immutable model evaluation result with metric values and optional predictions.

Pseudocode:

```text
EvaluationResult:
  metrics
  predictions
  probabilities
  validate fields at construction
```

## `backend/app/domain/value_objects/execution_result.py`

Explanation: Immutable result for a completed execution step or whole experiment.

Pseudocode:

```text
ExecutionResult:
  success flag
  metrics/logs/artifacts
  optional error message
  helper constructors for success/failure
```

## `backend/app/domain/value_objects/experiment_config.py`

Explanation: Immutable configuration object for an experiment run. It validates symbol, split values, date range, and strategy config structure.

Pseudocode:

```text
ExperimentConfig:
  accept symbol, date range, split ratios, strategy settings
  if split ratios invalid: raise ValueError
  if date range invalid: raise ValueError
  expose normalized config fields
```

## `backend/app/domain/value_objects/job_specification.py`

Explanation: Immutable queue job request. It validates supported job type and payload shape before enqueueing.

Pseudocode:

```text
JobSpecification:
  job_type
  payload dictionary
  if payload is not object: raise ValueError
  if job_type missing: raise ValueError
```

## `backend/app/domain/value_objects/queue_position.py`

Explanation: Immutable queue position result returned after enqueueing.

Pseudocode:

```text
QueuePosition:
  job_id
  position
  queued_jobs
  running_jobs
  reject negative counts
```

## `backend/app/domain/value_objects/split_result.py`

Explanation: Immutable train/validation/test split holder used by split strategies.

Pseudocode:

```text
SplitResult:
  train frame
  validation frame
  test frame
  metadata boundaries/counts
```

## `backend/app/domain/value_objects/trained_model.py`

Explanation: Immutable trained-model wrapper for model object, feature columns, target column, and metadata.

Pseudocode:

```text
TrainedModel:
  estimator
  feature_columns
  target_column
  metadata
```

## `backend/app/domain/value_objects/validation_result.py`

Explanation: Immutable validation helper with success flag and field errors.

Pseudocode:

```text
ValidationResult:
  errors dictionary
  is_valid = no errors
  success() returns empty errors
  failure(errors) returns errors
```
