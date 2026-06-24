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
