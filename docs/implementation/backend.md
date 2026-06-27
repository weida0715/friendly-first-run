# Backend Application Module

This module boots the Flask API, loads runtime configuration, registers feature routes, and standardizes API responses.

## Current implementation evidence

The backend implementation is covered by the full pytest suite and the FYP integration journey test. The journey test drives the main prototype flow through real HTTP boundaries: user registration/login, Blueprint approval request, moderator approval, experiment creation, queue enqueue response, compiled snapshot persistence, simulated completed model/log artifacts, model rankings visibility, and Public Hub visibility.

Latest verified command:

```text
cd backend && .venv/bin/pytest
```

Latest verified result:

```text
364 passed
```

## `backend/wsgi.py`

Explanation: Exposes the Flask `application` object for WSGI servers such as Gunicorn or Waitress. It imports the app factory and creates the runtime app once.

Pseudocode:

```text
import create_app
application = create_app()
```

## `backend/app/__init__.py`

Explanation: Defines `create_app()`. It loads config, configures CSRF, handles CORS preflight and response headers, records system trace events for API requests, warns about unsafe in-memory sessions, registers routes, and creates database tables.

Pseudocode:

```text
function create_app(config_name):
  app = Flask()
  app.config = get_config(config_name)
  configure session cookie name
  enable CSRF protection
  on CSRF error: return JSON error
  before API OPTIONS request: return CORS preflight response
  after API request: add CORS headers and record route event
  on unhandled API exception: record failed route event
  warn if memory sessions are risky
  register all route blueprints
  create database tables
  return app
```

## `backend/app/config.py`

Explanation: Defines environment-specific configuration classes. It reads the project version, secret key, database URL, API prefix, CORS origins, session settings, Redis URL, Binance base URL, and test overrides.

Pseudocode:

```text
function read_project_version():
  read VERSION file
  return version or fallback

class BaseConfig:
  define defaults from environment

class DevelopmentConfig(BaseConfig): set development mode
class TestingConfig(BaseConfig): use test database and testing flags
class ProductionConfig(BaseConfig): require production-style runtime settings

function get_config(config_name):
  choose explicit config or FLASK_ENV
  return matching config class
```

## `backend/app/routes.py`

Explanation: Registers all Flask blueprints under the configured API prefix and serves a browser-friendly backend status page at `/`.

Pseudocode:

```text
function register_routes(app):
  define GET / status HTML page
  api_prefix = app config API_PREFIX
  register system blueprint at /api
  register auth blueprint at /api/auth
  register users blueprint at /api/users
  register experiments blueprint at /api/experiments
  register blueprints and approval/library blueprints
  register models, hub, docs, jobs, logs, market-data blueprints
```

## `backend/app/responses.py`

Explanation: Provides tiny helpers for consistent JSON response shapes: successful payloads, single errors, and validation errors.

Pseudocode:

```text
function ok_response(data, status_code):
  return JSON { ok: true, data: data }

function error_response(message, status_code, code):
  return JSON { ok: false, error: { message, code } }

function validation_error_response(errors):
  return JSON { ok: false, errors: errors }
```

# Backend Architectures Module

Architectures wrap trainable scikit-learn classifiers behind the shared architecture strategy interface.

## `backend/app/architectures/logistic_regressor_architecture.py`

Explanation: Implements logistic regression training and prediction. It cleans Polars frames, extracts feature columns excluding target/time columns, fits `LogisticRegression`, and predicts labels.

Pseudocode:

```text
metadata():
  return architecture name and parameter constraints

train(train_frame, params):
  collect lazy frame
  drop invalid/null model rows
  feature_columns = all non-target/time columns unless supplied
  X, y = frame[feature_columns], frame[target]
  model = LogisticRegression(params)
  fit model
  return TrainedModel(model, feature_columns)

predict(model, data):
  collect data
  clean rows
  X = selected feature columns
  return model.predict(X)
```

## `backend/app/architectures/ridge_classifier_architecture.py`

Explanation: Implements ridge classifier training and prediction. It normalizes boolean and class-weight params, handles single-class data safely, fits `RidgeClassifier`, and returns predictions.

Pseudocode:

```text
metadata():
  return architecture name and parameter constraints

train(train_frame, params):
  normalize boolean params
  normalize class_weight null/none values
  collect feature and target arrays
  if target has one class:
    use constant-class behavior
  else:
    fit RidgeClassifier
  return TrainedModel

predict(model, data):
  extract feature columns
  return predicted class labels
```

# Backend Controllers Module

Controllers define the HTTP boundary. They parse requests, call services/repositories, enforce access rules, and return the shared JSON response format.

## `backend/app/controllers/_access.py`

Explanation: Builds the access-control service and provides a shared staff gate for routes that require moderator/admin users.

Pseudocode:

```text
function build_access_control():
  return AccessControlService(session service, user repository)

function require_staff(access_control, context):
  if context is missing or role is not staff:
    return 403 error
  return null
```

## `backend/app/controllers/_services.py`

Explanation: Builds queue-related services from the configured Redis queue adapter.

Pseudocode:

```text
function build_queue_service():
  return QueueService(RedisJobQueue.from_config())

function build_job_metadata_service():
  return JobMetadataService(queue provider)
```

## `backend/app/controllers/authentication_controller.py`

Explanation: Handles auth index, CSRF token creation, registration, login, current-user lookup, and logout. It validates credentials, hashes passwords, stores server-side sessions, and returns safe user payloads.

Pseudocode:

```text
GET /auth/:
  return available auth routes

GET /auth/csrf:
  create CSRF token
  return token

POST /auth/register:
  validate name, username, email, password
  reject duplicates
  hash password
  create enabled User
  return safe user fields

POST /auth/login:
  find user by email
  verify password and enabled status
  create session record
  set session cookie
  return safe user fields

GET /auth/me:
  load session from cookie
  return current user or 401

POST /auth/logout:
  delete session if present
  clear cookie
  return loggedOut
```

## `backend/app/controllers/blueprint_approval_controller.py`

Explanation: Handles approval workflow for blueprints: owners request review, staff list pending items, moderators/admins approve, reject, or disapprove.

Pseudocode:

```text
POST /blueprints/{id}/request-approval:
  require owner
  move draft/rejected blueprint to Pending
  save event and return blueprint

GET /blueprints/moderation/queue:
  require staff
  list pending/approved moderation records

function moderate_blueprint(id, target_state):
  require staff
  validate current state transition
  update approval state
  record event
  return blueprint

approve/reject/disapprove routes:
  call moderate_blueprint with target state
```

## `backend/app/controllers/blueprint_controller.py`

Explanation: Serves blueprint list/detail, favorite toggles, metadata, draft creation, and updates. It enforces public/private/moderation access and validates blueprint payloads.

Pseudocode:

```text
GET /blueprints/:
  return accessible blueprints

GET /blueprints/{id}:
  load blueprint
  require owner, public approval, or staff moderation access
  return blueprint detail and favorite flag

POST/DELETE /blueprints/{id}/favorite:
  require auth
  add or remove favorite
  return favorite state

GET /blueprints/metadata:
  return indicator and architecture metadata

POST /blueprints/:
  require auth
  validate payload
  create draft blueprint

PATCH /blueprints/{id}:
  require owner-edit access
  validate and update blueprint
```

## `backend/app/controllers/blueprint_wizard_controller.py`

Explanation: Defines the wizard payload shape and controller placeholder used by blueprint wizard flows. The actual route work is handled in blueprint routes.

Pseudocode:

```text
BlueprintWizardSubmitPayload:
  store name, description, indicators, architecture, visibility

BlueprintWizardController:
  exists as feature controller namespace
```

## `backend/app/controllers/blueprints_library_controller.py`

Explanation: Lists blueprints owned by the current user and blueprints favorited by the current user.

Pseudocode:

```text
GET /blueprints/library/owned:
  require auth
  query owned blueprints
  return items

GET /blueprints/library/favorited:
  require auth
  query favorite rows joined to accessible blueprints
  return items
```

## `backend/app/controllers/dashboard_controller.py`

Explanation: Placeholder class for dashboard controller naming. Dashboard data is currently assembled from existing feature endpoints.

Pseudocode:

```text
class DashboardController:
  pass
```

## `backend/app/controllers/documentation_controller.py`

Explanation: Reads markdown docs from `docs/`, extracts title/category/body metadata, lists available docs, and returns detail by slug. Requires authentication.

Pseudocode:

```text
function auth():
  return authenticated context or 401

function parse_doc(path):
  read markdown
  title = first heading or filename
  category = parent/fallback category
  return doc metadata and body

GET /docs/:
  require auth
  parse all markdown docs
  return sorted list

GET /docs/{slug}:
  require auth
  find matching doc
  return detail or 404
```

## `backend/app/controllers/experiment_controller.py`

Explanation: Owns experiment lifecycle endpoints. It validates creation payloads, compiles blueprint snapshots, enqueues jobs, lists and details experiments, reconciles stale queue state, exposes blueprint options, and supports cancel/retry/delete.

Pseudocode:

```text
POST /experiments:
  require auth
  parse date or candlestick range
  validate payload against accessible blueprint
  enforce max concurrent jobs
  compile experiment plan and parameter permutations
  persist experiment with compiled snapshot
  enqueue experiment job
  return created experiment and queue position

GET /experiments:
  require auth
  list user's experiments
  normalize active queued statuses
  reconcile missing queue jobs
  return rows

GET /experiments/{id}:
  require owner/staff
  load experiment, models, logs, queue job
  compute public model IDs, progress, metrics, correlations
  return full detail

GET /experiments/blueprint-options:
  require auth
  list approved/accessible blueprints with search, sort, pagination

POST /experiments/{id}/cancel:
  require owner/staff
  cancel queue job or mark experiment cancelled

POST /experiments/{id}/retry:
  require owner/staff
  reset failed/cancelled experiment
  enqueue new job

DELETE /experiments/{id}:
  require owner/staff
  delete experiment
```

## `backend/app/controllers/experiment_wizard_controller.py`

Explanation: Placeholder class for experiment wizard naming. The wizard UI consumes experiment metadata and creation routes from `experiment_controller.py`.

Pseudocode:

```text
class ExperimentWizardController:
  pass
```

## `backend/app/controllers/job_controller.py`

Explanation: Lists accessible queue jobs, returns job details, and cancels jobs while checking owner/staff access.

Pseudocode:

```text
GET /jobs/:
  require auth
  fetch active jobs
  filter to owner/staff-visible jobs
  return list

GET /jobs/{job_id}:
  require auth
  fetch job metadata
  require owner/staff
  return detail

POST /jobs/{job_id}/cancel:
  require auth and owner/staff
  cancel through QueueService
  return cancellation result
```

## `backend/app/controllers/logs_download_controller.py`

Explanation: Exports experiment artifacts as JSON or CSV. It checks experiment access/completion, fetches stored logs, maps internal model IDs to public IDs, and regenerates round logs when missing.

Pseudocode:

```text
GET /logs/:
  return available log routes

GET /logs/experiments/{id}/{artifact}:
  require experiment access
  require completed experiment for export
  load requested log type
  add public model IDs
  return JSON or CSV artifact

GET /logs/experiments/{id}/models/{model_id}/round:
  require access and completion
  load or regenerate round rows
  return prediction history

GET /logs/experiments/{id}/models/{model_id}/round.csv:
  same as round endpoint, formatted as CSV
```

## `backend/app/controllers/market_data_controller.py`

Explanation: Serves BTCUSDT candle data, target previews, target economics, cache metadata, and admin cache controls. It includes helpers for interval aggregation, preview parameter coercion, label statistics, mock predictions, and catch-up state.

Pseudocode:

```text
GET /market-data/btcusdt/klines:
  parse start, end, interval, limit
  query cached klines
  aggregate if needed
  return chart rows

POST /market-data/btcusdt/target-preview:
  parse range, interval, target strategy, params, preview controls
  load cached candles and aggregate
  compute target labels
  compute class counts, null counts, returns, bridge/economics summaries
  return preview rows and summary

GET /market-data/btcusdt/metadata:
  return earliest/latest cached timestamps

POST /market-data/btcusdt/admin/catch-up:
  require admin
  start background catch-up from latest cache timestamp

GET/POST catch-up status/stop:
  return or update catch-up status

DELETE /market-data/btcusdt/admin/klines:
  require admin
  reject if catch-up running
  clear cached rows
```

## `backend/app/controllers/model_controller.py`

Explanation: Serves model highlights, rankings, libraries, details, and favorite toggles. It merges model rows with experiment, blueprint, owner, favorite, and log metric data.

Pseudocode:

```text
GET /models/highlights:
  require auth
  query top direct and backtest metrics
  return cards

GET /models/rankings:
  require auth
  parse paging, sort, filters, search
  query visible models
  attach metrics and favorite state
  return ranked rows

GET /models/library/owned|favorited:
  require auth
  return owned or favorited models

GET /models/{id}:
  require public/owner/staff access
  return model detail, parameters, logs

POST/DELETE /models/{id}/favorite:
  require auth
  add or remove favorite row
```

## `backend/app/controllers/models_library_controller.py`

Explanation: Placeholder class for the models library feature namespace. Active library routes live in `model_controller.py`.

Pseudocode:

```text
class ModelsLibraryController:
  pass
```

## `backend/app/controllers/models_rankings_controller.py`

Explanation: Placeholder class for the model rankings feature namespace. Active ranking routes live in `model_controller.py`.

Pseudocode:

```text
class ModelsRankingsController:
  pass
```

## `backend/app/controllers/public_hub_controller.py`

Explanation: Lists public users, experiments, models, and blueprints and serves public user profiles. It filters to approved/public artifacts and formats lightweight cards for the hub UI.

Pseudocode:

```text
GET /hub/:
  parse search/date filters
  query public users, experiments, models, blueprints
  return grouped hub data

GET /hub/users/{id}:
  find enabled user
  query user's public experiments, models, blueprints
  return profile or 404
```

## `backend/app/controllers/system_controller.py`

Explanation: Handles health checks, active queue snapshots, runtime settings, settings updates, system event listing, and CSV download. It also exposes `record_event()` used by request tracing.

Pseudocode:

```text
GET /health:
  return service, version, env, status

GET /system/queue/active:
  require admin
  return queue snapshot

GET/PATCH /system/settings:
  require admin
  read or update runtime settings

GET /system/events:
  require admin
  filter events by scope/user/limit
  return rows

GET /system/events/download:
  require admin
  stream event CSV

record_event(...):
  insert SystemEvent row, ignoring trace failures
```

## `backend/app/controllers/user_controller.py`

Explanation: Handles user profile and admin user-management routes. It enforces owner/staff/admin access, validates usernames/emails/roles, hashes reset passwords, and records audit events.

Pseudocode:

```text
GET /users:
  require staff
  parse filters
  return paged users

GET /users/me:
  require auth
  return own profile

GET /users/{id}:
  require owner or staff
  return profile

GET /users/{id}/audit:
  require staff
  return system events for user

POST /users:
  require staff with assignable role
  validate fields and uniqueness
  create user

PATCH status/password/role/username:
  require allowed staff/admin action
  validate payload
  update user and record event

DELETE /users/{id}:
  require admin
  delete user
```

## `backend/app/controllers/wizard_controller.py`

Explanation: Placeholder class for generic wizard naming. Concrete wizard behavior is implemented in blueprint and experiment controllers.

Pseudocode:

```text
class WizardController:
  pass
```

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

# Backend Factories Module

Factories centralize lookup, metadata, validation, and construction of pluggable experiment pieces.

## `backend/app/factories/architecture_factory.py`

Explanation: Registers supported architecture strategies, validates requested architecture parameters, exposes metadata, and constructs architecture instances.

Pseudocode:

```text
ArchitectureFactory:
  registry = logistic_regression, ridge_classifier

  metadata():
    return name, display name, description, constraints for each architecture

  validate(name, params):
    find constraints
    for each param candidate:
      enforce type, min/max, allowed values
    return field errors

  create(name, params):
    if invalid name or params: raise
    return architecture strategy instance
```

## `backend/app/factories/blueprint_executor_factory.py`

Explanation: Factory hook for blueprint execution. It currently keeps the executor construction point explicit for future blueprint execution support.

Pseudocode:

```text
BlueprintExecutorFactory:
  create(config):
    return configured blueprint executor
```

## `backend/app/factories/blueprint_factory.py`

Explanation: Normalizes raw blueprint data into a blueprint domain object, especially indicator and architecture configuration.

Pseudocode:

```text
BlueprintFactory.create(payload):
  read name, owner, description
  normalize config sections
  create Blueprint domain object
  return blueprint
```

## `backend/app/factories/indicator_factory.py`

Explanation: Registers custom and TA-Lib-backed indicators, exposes metadata and parameter constraints, validates requested indicators, and builds indicator strategies for execution.

Pseudocode:

```text
IndicatorFactory:
  load custom indicator registry
  load talib specs

  metadata():
    return indicators grouped by source/category

  validate(indicator config):
    ensure indicator name exists
    validate params against constraints
    validate output scaler config

  create(definition):
    if custom: return custom indicator strategy
    if talib: return TalibIndicatorStrategy
```

## `backend/app/factories/talib_registry.py`

Explanation: Defines the supported TA-Lib-style indicators, their categories, input columns, default params, and parameter constraints.

Pseudocode:

```text
TalibSpec:
  category
  inputs
  params

helper _p(params):
  return parameter definition dictionary

helper _s(category, inputs, params):
  return TalibSpec

TALIB_REGISTRY:
  map indicator name to TalibSpec

function parameter_constraints(parameters):
  convert registry parameter metadata into frontend/backend constraints
```

## `backend/app/factories/target_strategy_factory.py`

Explanation: Adapts the strategy target factory for the factory layer. It exposes target strategy metadata and creates concrete target strategies.

Pseudocode:

```text
TargetStrategyFactory:
  inherit strategy target factory
  metadata():
    return target names, defaults, constraints

  create(name, params):
    return matching TargetStrategy
```

# Backend Infrastructure Module

Infrastructure code connects the app to external systems: Binance, SQLAlchemy, Redis, and Alembic migrations.

## `backend/app/infrastructure/binance/kline_client.py`

Explanation: Fetches BTCUSDT kline rows from Binance, validates returned symbol/interval data, paginates by time range, retries transient failures, and normalizes raw rows into `BTCUSDTKline` domain objects.

Pseudocode:

```text
fetch_klines(symbol, interval, start, end):
  validate supported symbol and interval
  while start < end:
    call Binance client for next page
    if empty: stop
    normalize each raw row
    advance start past last close time
  return klines

normalize_kline(raw):
  require expected row length
  convert ms timestamps to UTC datetimes
  convert price/volume strings to Decimal
  return BTCUSDTKline
```

## `backend/app/infrastructure/database/base.py`

Explanation: Defines the SQLAlchemy declarative base class shared by all ORM models.

Pseudocode:

```text
class Base(DeclarativeBase):
  pass
```

## `backend/app/infrastructure/database/enums.py`

Explanation: Defines persisted enum values for roles, user status, blueprint approval, experiment interval, and experiment status.

Pseudocode:

```text
UserRole = User, Moderator, Admin
UserStatus = Enabled, Disabled
ApprovalState = Draft, Pending, Approved, Rejected, Disapproved
ExperimentInterval = 1m, 5m, 15m, 30m, 1h, 2h, 4h, 1d
ExperimentStatus = Queued, Running, Completed, Failed, Cancelled
```

## `backend/app/infrastructure/database/session.py`

Explanation: Resolves the database URL, creates/configures the SQLAlchemy engine, and provides the sessionmaker used by repositories and unit of work.

Pseudocode:

```text
resolve_database_url():
  read DATABASE_URL or fallback sqlite path

get_engine():
  create cached engine if missing
  return engine

configure_engine(database_url):
  replace global engine and sessionmaker
  return engine

get_session_local():
  return cached sessionmaker bound to engine
```

## `backend/app/infrastructure/database/orm/blueprint_orm.py`

Explanation: Maps the `Blueprint` table, including owner relationship, config JSON, approval state, visibility, version, lineage, and timestamps.

Pseudocode:

```text
BlueprintORM:
  table name Blueprint
  columns BlueprintID, UserID, Name, Description, Config, ApprovalState, Visibility, Version, ParentBlueprintID, timestamps
  relationships to owner/favorites/experiments
```

## `backend/app/infrastructure/database/orm/btcusdt_kline_orm.py`

Explanation: Maps cached BTCUSDT kline rows with unique timestamp and OHLCV decimal columns.

Pseudocode:

```text
BTCUSDTKlineORM:
  timestamp primary/unique key
  open/high/low/close/volume Decimal columns
  close_time and updated_at
```

## `backend/app/infrastructure/database/orm/experiment_log_orm.py`

Explanation: Maps experiment log rows with experiment/model references, log type, JSON metrics, and creation timestamp.

Pseudocode:

```text
ExperimentLogORM:
  LogID primary key
  ExperimentID foreign key
  optional ModelID foreign key
  LogType
  Metrics JSON
  CreatedAt
```

## `backend/app/infrastructure/database/orm/experiment_orm.py`

Explanation: Maps experiment rows, including owner, blueprint, date range, split settings, status/progress, job ID, compiled snapshot, overrides, and timestamps.

Pseudocode:

```text
ExperimentORM:
  ExperimentID primary key
  UserID and BlueprintID foreign keys
  symbol/date/split columns
  status/progress/current stage/job columns
  ParameterOverrides and compiled snapshot JSON
  relationships to models/logs/blueprint/owner
```

## `backend/app/infrastructure/database/orm/favorite_blueprint_orm.py`

Explanation: Maps the many-to-many favorite link between users and blueprints.

Pseudocode:

```text
FavoriteBlueprintORM:
  UserID foreign key
  BlueprintID foreign key
  CreatedAt
  unique user/blueprint pair
```

## `backend/app/infrastructure/database/orm/favorite_model_orm.py`

Explanation: Maps the many-to-many favorite link between users and models.

Pseudocode:

```text
FavoriteModelORM:
  UserID foreign key
  ModelID foreign key
  CreatedAt
  unique user/model pair
```

## `backend/app/infrastructure/database/orm/model_orm.py`

Explanation: Maps trained model records linked to experiments, including public rank fields, metrics JSON, parameters, artifact references, and timestamps.

Pseudocode:

```text
ModelORM:
  ModelID primary key
  ExperimentID foreign key
  architecture/parameters/metrics/artifact columns
  CreatedAt
  relationships to experiment/logs/favorites
```

## `backend/app/infrastructure/database/orm/system_event_orm.py`

Explanation: Maps persisted system/audit events for request tracing, admin terminal, and user audit.

Pseudocode:

```text
SystemEventORM:
  EventID primary key
  Scope, Action
  Actor fields
  TargetType, TargetID
  Message, Metadata
  CreatedAt
```

## `backend/app/infrastructure/database/orm/system_setting_orm.py`

Explanation: Maps runtime settings as key/value rows.

Pseudocode:

```text
SystemSettingORM:
  Key primary key
  Value string
  UpdatedAt
```

## `backend/app/infrastructure/database/orm/user_orm.py`

Explanation: Maps user rows with account fields, role/status enums, password hash, and timestamps.

Pseudocode:

```text
UserORM:
  UserID primary key
  Name, Username, Email
  PasswordHash
  Role, Status
  CreatedAt, UpdatedAt
  relationships to experiments, blueprints, favorites
```

## `backend/app/infrastructure/redis/job_queue.py`

Explanation: Redis-backed job queue adapter. It enqueues jobs, stores job metadata, maps experiment IDs to job IDs, reports queue snapshots, returns detail, removes jobs, and marks cancellation state.

Pseudocode:

```text
enqueue(spec):
  serialize payload and metadata
  push job ID to Redis queue
  store metadata hash
  store experiment-to-job mapping if experiment job
  return QueuePosition

get_active_jobs():
  read queued/running job IDs
  load metadata for each

get_job_detail(job_id):
  read metadata hash
  normalize state and payload fields
  return detail or not found

cancel_job(job_id):
  mark cancellation requested
  remove queued job when possible
  return cancellation payload
```

## `backend/alembic/env.py`

Explanation: Alembic runtime wiring. It imports the app metadata and runs migrations in offline or online mode.

Pseudocode:

```text
if offline:
  configure Alembic with URL and metadata
  run migrations
else:
  create engine connection
  configure Alembic with connection and metadata
  run migrations in transaction
```

## `backend/alembic/versions/20260503_0001_rfc002_strict_erd.py`

Explanation: Creates the strict ERD schema with the initial core tables, names, columns, keys, and constraints.

Pseudocode:

```text
upgrade:
  create user, blueprint, experiment, model, favorite, log tables
  create exact keys and constraints

downgrade:
  drop created tables
```

## `backend/alembic/versions/20260503_0002_rfc005_add_disapproved_approval_state.py`

Explanation: Adds the `Disapproved` blueprint approval state used by moderation.

Pseudocode:

```text
upgrade:
  alter approval-state constraint/enum to include Disapproved

downgrade:
  restore previous approval states
```

## `backend/alembic/versions/20260503_0003_compat_missing_revision.py`

Explanation: Compatibility migration for a previously missing revision in the migration chain.

Pseudocode:

```text
upgrade:
  no-op compatibility step

downgrade:
  no-op compatibility step
```

## `backend/alembic/versions/20260509_0003_add_btcusdt_kline_updated_at.py`

Explanation: Adds/ensures update timestamp tracking for cached BTCUSDT kline rows.

Pseudocode:

```text
upgrade:
  add UpdatedAt to BTCUSDT kline table

downgrade:
  remove UpdatedAt
```

## `backend/alembic/versions/20260517_0004_add_experiment_job_id.py`

Explanation: Adds job tracking fields to experiments so queued/running experiments can be linked to worker jobs.

Pseudocode:

```text
upgrade:
  add JobID/progress/current-stage columns to Experiment

downgrade:
  remove job tracking columns
```

## `backend/alembic/versions/20260519_0005_experiment_datetime_range.py`

Explanation: Adds datetime range support for experiments beyond date-only fields.

Pseudocode:

```text
upgrade:
  add StartDateTime and EndDateTime columns
  backfill from existing date fields where needed

downgrade:
  remove datetime range columns
```

## `backend/alembic/versions/20260602_0006_compile_experiment_snapshots.py`

Explanation: Adds storage for compiled experiment snapshots and effective parameter data.

Pseudocode:

```text
upgrade:
  add compiled snapshot JSON column to Experiment

downgrade:
  drop compiled snapshot column
```

## `backend/alembic/versions/20260610_0007_add_system_settings.py`

Explanation: Adds the system settings table used by runtime admin settings.

Pseudocode:

```text
upgrade:
  create SystemSetting table
  seed known default settings if needed

downgrade:
  drop SystemSetting table
```

# Backend Repositories Module

Repositories isolate SQLAlchemy persistence from controllers and services.

## `backend/app/repositories/blueprint_repository.py`

Explanation: Persists and queries blueprint ORM rows, including ownership lists, accessible/public blueprints, approval-state updates, and detail lookups.

Pseudocode:

```text
add(blueprint):
  map domain fields to BlueprintORM
  add row and flush

get_by_id(id):
  query BlueprintORM by primary key

list_by_user(user_id):
  query rows owned by user

update fields/state:
  load row
  mutate columns
  flush
```

## `backend/app/repositories/experiment_log_repository.py`

Explanation: Stores and retrieves experiment logs, including logs by type, logs by model, and structured metric payloads.

Pseudocode:

```text
add(log):
  map ExperimentLog domain object to ORM
  add and flush

list_by_experiment(experiment_id):
  query logs ordered by creation

list_by_type(experiment_id, log_type):
  filter by experiment and type
```

## `backend/app/repositories/experiment_repository.py`

Explanation: Manages experiment rows and status transitions. It creates experiments, lists by user, updates progress, marks running/completed/failed/cancelled, stores job IDs, and truncates long stage text to fit storage.

Pseudocode:

```text
add(experiment):
  map domain object to ExperimentORM
  add row and flush

get_by_id(id):
  query experiment

list_by_user(user_id, filters):
  apply owner/status/search filters
  return rows

update_progress(id, progress, current_stage, eta):
  clamp/truncate fields
  update row

mark_running/completed/failed/cancelled(id):
  update status timestamps and stage fields
```

## `backend/app/repositories/favorite_blueprint_repository.py`

Explanation: Manages user favorite links to blueprints.

Pseudocode:

```text
add(user_id, blueprint_id):
  insert if not already favorited

remove(user_id, blueprint_id):
  delete link

exists/list_for_user:
  query favorite links
```

## `backend/app/repositories/favorite_model_repository.py`

Explanation: Manages user favorite links to trained models.

Pseudocode:

```text
add(user_id, model_id):
  insert favorite if absent

remove(user_id, model_id):
  delete favorite

list_model_ids_for_user(user_id):
  return model IDs
```

## `backend/app/repositories/mappers/blueprint_mapper.py`

Explanation: Converts `BlueprintORM` rows into `Blueprint` domain objects.

Pseudocode:

```text
orm_to_blueprint_domain(row):
  copy scalar columns
  copy JSON config fields
  return Blueprint(...)
```

## `backend/app/repositories/market_data_repository.py`

Explanation: Manages BTCUSDT candle cache persistence. It upserts candles, returns inserted/updated counts, lists ranges, returns timestamp bounds, deletes cache rows, and can query pre-aggregated interval projections.

Pseudocode:

```text
upsert_klines(klines):
  for each candle:
    if timestamp exists: update OHLCV fields
    else: insert new row
  return UpsertSummary

list_range(start, end, interval):
  validate interval
  query candles in timestamp range
  return domain objects

list_range_projection(start, end, interval):
  if interval is 1m: select raw rows
  else: group candles into interval buckets in SQL

earliest/latest/list timestamps:
  delegate aggregate queries

clear_all():
  delete candle rows
```

## `backend/app/repositories/model_repository.py`

Explanation: Persists trained model rows and performs model listing/ranking queries. It joins experiments, blueprints, owners, favorites, and log metrics for model library/ranking use cases.

Pseudocode:

```text
add(model):
  map domain model to ModelORM
  add and flush

get_by_id(id):
  query model

list_by_experiment(experiment_id):
  return models for experiment

rankings(filters, sort, pagination):
  build visible model query
  apply search/filter rules
  join metric logs when needed
  sort and paginate
  return rows/count
```

## `backend/app/repositories/system_event_repository.py`

Explanation: Persists and queries audit/system event records for the system terminal and user audit views.

Pseudocode:

```text
add(event):
  map SystemEvent to ORM
  add and flush

list(filters):
  filter by scope, actor, target, limit
  order newest first
```

## `backend/app/repositories/system_setting_repository.py`

Explanation: Reads and writes key/value runtime settings.

Pseudocode:

```text
get_all():
  return key/value map

set(key, value):
  upsert SystemSettingORM row
```

## `backend/app/repositories/unit_of_work.py`

Explanation: Owns the SQLAlchemy session lifecycle and exposes repository instances under one transaction boundary.

Pseudocode:

```text
enter:
  create session
  attach repositories using session
  return self

exit:
  if exception: rollback
  else: commit
  close session
```

## `backend/app/repositories/user_repository.py`

Explanation: Manages user CRUD, uniqueness lookups, search/count filtering, and role/status updates.

Pseudocode:

```text
add(user):
  map User domain object to UserORM
  add and flush

get_by_id/email/username:
  query matching user

list(filters, pagination):
  apply role/status/search filters
  return rows and count

update_status/update_role/update_username:
  load user
  mutate column
  flush
```

# Backend Scripts And Workers Module

Scripts are CLI entry points. Workers consume queued jobs and run experiments.

## `backend/app/scripts/_market_data_cli.py`

Explanation: Shared CLI helpers for market-data scripts. It parses ISO datetimes and resolves `start`/`end`/`lookback_hours` combinations.

Pseudocode:

```text
parse_iso_datetime(value):
  parse ISO string
  attach/normalize UTC timezone

resolve_range(start, end, lookback_hours):
  reject invalid argument combinations
  compute start/end datetimes
  return UTC range
```

## `backend/app/scripts/cleanup_database.py`

Explanation: Local reset command that clears mutable experiment/application data while preserving selected reference tables such as users and BTCUSDT klines.

Pseudocode:

```text
main():
  create app context
  open database session
  delete configured tables in dependency-safe order
  commit
  print summary
```

## `backend/app/scripts/ingest_btcusdt_klines.py`

Explanation: CLI for backfilling BTCUSDT 1m candles. It discovers missing ranges, chunks work, refreshes each range, can continue within a failure budget, and repairs gaps.

Pseudocode:

```text
main(argv):
  parse start/end/lookback/resume/reconcile options
  resolve requested range
  discover missing ranges from cache
  merge adjacent ranges
  for each chunk:
    call MarketDataService.refresh_btcusdt_1m
    print progress
    track failures
    stop if failure budget exceeded
  run post-ingest gap check/repair if configured
  return exit code
```

## `backend/app/scripts/refresh_btcusdt_klines.py`

Explanation: Smaller CLI wrapper around `MarketDataService.refresh_btcusdt_1m()` for a single requested range.

Pseudocode:

```text
main(argv):
  parse start/end/lookback
  resolve range
  call refresh service
  print fetched/inserted/updated counts
  return 0 or 1 on service error
```

## `backend/app/scripts/run_worker.py`

Explanation: CLI entry point that starts the experiment worker loop.

Pseudocode:

```text
main():
  call experiment_worker.run_worker()
```

## `backend/app/workers/experiment_worker.py`

Explanation: Validates experiment job payloads, marks experiments running/completed/failed, runs the default executor, and exposes a queue worker loop.

Pseudocode:

```text
validate_payload(payload):
  require object payload
  require integer experiment_id
  require experiment exists
  return experiment_id

handle_experiment_job(payload):
  experiment_id = validate_payload(payload)
  mark experiment running
  run DefaultExperimentExecutor with progress callback
  mark experiment completed with result summary
  on error: mark experiment failed and re-raise/return failure

run_worker():
  connect to Redis queue
  consume experiment jobs
  call handle_experiment_job for each payload
```

# Backend Services Module

Services hold reusable application logic that controllers and workers call.

## `backend/app/services/access_control_service.py`

Explanation: Resolves authenticated users from request/session data and checks ownership, profile access, staff/admin access, user management permissions, and role assignment rules.

Pseudocode:

```text
get_authenticated_context(request):
  read session cookie
  find session and user
  reject missing, expired, disabled
  return AuthContext

can_access_profile(actor, target_user_id):
  return actor owns profile or is staff

can_manage_user(actor, target):
  apply admin/moderator matrix

can_assign_role(actor, role):
  apply allowed role matrix
```

## `backend/app/services/job_metadata_service.py`

Explanation: Reads job metadata from the queue provider and keeps a short cache for recently terminal jobs so detail pages can still show completion/failure after Redis removes active entries.

Pseudocode:

```text
get_job_detail(job_id):
  try provider.get_job_detail(job_id)
    if terminal: cache it with expiry
    return metadata
  except not found:
    if cached and not expired: return cached
    raise QueueJobNotFoundError
```

## `backend/app/services/market_data_service.py`

Explanation: Coordinates BTCUSDT kline refreshes. It validates time ranges, fetches from Binance, persists through the market data repository, and returns insert/update summary counts.

Pseudocode:

```text
refresh_btcusdt_1m(start, end):
  normalize UTC datetimes
  reject invalid range
  fetch klines from Binance client
  open unit of work
  require market_data repository
  upsert klines
  commit
  return RefreshSummary(fetched, inserted, updated)

get latest/earliest/list cached timestamps:
  delegate to repository
```

## `backend/app/services/password_service.py`

Explanation: Wraps Werkzeug password hashing and verification.

Pseudocode:

```text
hash_password(password):
  return generate_password_hash(password)

verify_password(password, hash):
  return check_password_hash(hash, password)
```

## `backend/app/services/queue_service.py`

Explanation: Defines queue error types and the queue provider protocol, then wraps enqueue, read, active snapshot, remove, and cancel behavior with job-type validation.

Pseudocode:

```text
enqueue_job(spec):
  if job_type unsupported: raise UnsupportedJobTypeError
  delegate enqueue to queue provider
  return QueuePosition

get_job_detail/list/cancel/remove:
  delegate to provider
  normalize provider errors
```

## `backend/app/services/session_service.py`

Explanation: Provides the current in-memory server-side session store. It creates session IDs, purges expired sessions, supports no-expiry zero timeout, reads sessions, and deletes sessions.

Pseudocode:

```text
create_session(user_id, timeout):
  purge expired records
  generate random session id
  expires_at = now + timeout unless timeout is zero
  store SessionRecord
  return session id

get_session(id):
  if missing or expired: return None
  return record

delete_session(id):
  remove record
```

## `backend/app/services/system_settings_service.py`

Explanation: Defines runtime setting specs, coercion rules, defaults, repository-backed reads/writes, and a helper for settings needed in hot paths.

Pseudocode:

```text
SystemSettingsService.get_settings():
  load persisted settings
  merge with defaults
  coerce ints
  return dict

update_settings(payload):
  validate known keys
  coerce integer values and enforce minimums
  persist each setting
  return updated settings

get_runtime_settings():
  open unit of work
  return service.get_settings()
```

## `backend/app/services/versioning_service.py`

Explanation: Handles blueprint versioning rules. It updates never-submitted drafts in place and creates a new version when an already reviewed blueprint is edited.

Pseudocode:

```text
save_blueprint_update(blueprint, changes):
  if blueprint was never submitted:
    update same row
  else:
    create new blueprint row
    increment version
    link lineage to source
  return saved blueprint
```

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

# Backend Validators Module

Validators keep request payload checks out of controllers.

## `backend/app/validators/blueprint_validator.py`

Explanation: Validates blueprint create/update payloads. It checks required fields, indicator support, indicator parameter constraints, output scaler choices, architecture support, architecture parameter types, and collects field-level errors.

Pseudocode:

```text
BlueprintValidator.validate(payload):
  errors = {}
  require non-empty name
  require config object
  validate indicators section:
    ensure selected indicators exist
    ensure params match constraints
    ensure output scalers are supported
  validate architecture section:
    ensure architecture exists
    ensure settings object is valid
    validate params through ArchitectureFactory
  if errors: return ValidationResult.failure(errors)
  return ValidationResult.success()
```

## `backend/app/validators/experiment_validator.py`

Explanation: Validates experiment creation payloads. It checks identity fields, date ranges, split ratios, interval support, selected blueprint accessibility, target strategy config, override shape, candlestick amount mode, and permutation limits.

Pseudocode:

```text
ExperimentValidator.validate(payload, context):
  errors = {}
  validate name and symbol
  validate date range or candlestick amount mode
  validate interval is supported
  validate train/validation/test split totals and minimums
  load selected blueprint and check owner/public/staff access
  validate target strategy and target params
  validate architecture/indicator override types and constraints
  validate requested permutations against settings
  if errors: return ValidationResult.failure(errors)
  return ValidationResult.success()
```
