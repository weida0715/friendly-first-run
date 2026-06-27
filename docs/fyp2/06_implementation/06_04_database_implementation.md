# 6.4 Database Implementation

BEE uses a relational database design backed by PostgreSQL, SQLAlchemy ORM models, Alembic migrations, repositories, and a Unit of Work transaction boundary. The database is not only used for user accounts. It also stores reusable blueprints, experiment configurations, generated models, experiment logs, favourites, cached BTCUSDT market data, system events, and runtime settings.

The database implementation follows the system's layered design. Controllers do not manipulate tables directly. Controllers call services or repositories through the Unit of Work layer. ORM classes map Python objects to database tables, and repositories provide focused operations for each main data area.

## 6.4.1 Database Schema Design

The schema is organized around the main workflow of the system. A user creates a blueprint. An experiment belongs to a user and references a blueprint. The experiment generates models and logs. Users can mark blueprints and models as favourites. Market data is stored separately in the BTCUSDT kline cache so experiments and charts can read the same persisted data source.

| Data area | Purpose | Main relative paths |
|---|---|---|
| User management | Stores account identity, password hash, role, status, and timestamps | `backend/app/infrastructure/database/orm/user_orm.py`, `backend/app/repositories/user_repository.py` |
| Blueprint management | Stores reusable experiment design, indicator JSON, feature JSON, architecture JSON, approval state, version, and parent lineage | `backend/app/infrastructure/database/orm/blueprint_orm.py`, `backend/app/repositories/blueprint_repository.py` |
| Experiment management | Stores selected blueprint, date range, split values, parameter overrides, status, progress, job id, compiled snapshots, seed, and permutation limits | `backend/app/infrastructure/database/orm/experiment_orm.py`, `backend/app/repositories/experiment_repository.py` |
| Model results | Stores generated model parameters, parameter hash, and summary metrics | `backend/app/infrastructure/database/orm/model_orm.py`, `backend/app/repositories/model_repository.py` |
| Experiment logs | Stores per-experiment and per-model logs, signals, predictions, and metric JSON | `backend/app/infrastructure/database/orm/experiment_log_orm.py`, `backend/app/repositories/experiment_log_repository.py` |
| Favourites | Stores user-to-blueprint and user-to-model favourite records | `backend/app/infrastructure/database/orm/favorite_blueprint_orm.py`, `backend/app/infrastructure/database/orm/favorite_model_orm.py` |
| Market data | Stores BTCUSDT OHLCV candles by timestamp | `backend/app/infrastructure/database/orm/btcusdt_kline_orm.py`, `backend/app/repositories/market_data_repository.py` |
| System operations | Stores system events and runtime settings | `backend/app/infrastructure/database/orm/system_event_orm.py`, `backend/app/infrastructure/database/orm/system_setting_orm.py` |

The most important schema decisions are shown by the ORM files. `User` has relationships to blueprints, experiments, favourite models, and favourite blueprints.[^db-user] `Blueprint` stores JSON architecture, indicator, and feature definitions, and has a self-reference for parent-child version lineage.[^db-blueprint] `Experiment` stores the split values, execution status, job id, compiled snapshots, deterministic flag, seed, and permutation counters.[^db-experiment] `Model` stores parameters, a parameter hash, and evaluation metrics.[^db-model] `BTCUSDTKline` uses timestamp as its primary key so duplicate market candles can be updated rather than inserted again.[^db-kline]

## 6.4.2 SQL/NoSQL Database Tables / Collections

The implemented database of record is SQL-based. There are no NoSQL collections in the application persistence layer. Redis is used for queue infrastructure and short-lived queue metadata, not as the permanent application database.

| Table | Main fields | Relationship summary |
|---|---|---|
| `User` | `UserID`, `Username`, `Email`, `PasswordHash`, `Name`, `Role`, `Status`, `CreatedAt`, `UpdatedAt` | One user can own many blueprints and experiments. One user can favourite many blueprints and models. |
| `Blueprint` | `BlueprintID`, `UserID`, `Name`, `Description`, `Indicators`, `Features`, `Architecture`, `ApprovalState`, `SubmittedAt`, `Version`, `ParentID`, timestamps | Belongs to one user. Can be selected by experiments. Can have parent and child versions. Can be favourited. |
| `Experiment` | `ExperimentID`, `UserID`, `BlueprintID`, `Name`, date/time range, split values, overrides, status, progress, job id, compiled snapshots, seed | Belongs to one user and one blueprint. Has many models and logs. |
| `Model` | `ModelID`, `ExperimentID`, `Parameters`, `ParameterHash`, `Sharpe`, `Accuracy`, `Precision`, `Recall`, `CreatedAt` | Belongs to one experiment. Can have logs and favourites. |
| `ExperimentLog` | `ExperimentLogID`, `ExperimentID`, `ModelID`, `Timestamp`, `Signal`, `Prediction`, `Metrics`, `CreatedAt` | Belongs to one experiment and one model. |
| `FavoriteBlueprint` | `UserID`, `BlueprintID`, `CreatedAt` | Links users to saved blueprints. |
| `FavoriteModel` | `UserID`, `ModelID`, `CreatedAt` | Links users to saved models. |
| `BTCUSDTKline` | `Timestamp`, `Open`, `High`, `Low`, `Close`, `Volume`, timestamps | Independent cache table read by charts and experiment execution. |
| `SystemEvent` | `SystemEventID`, `Scope`, `Action`, `ActorID`, `ActorUsername`, `TargetType`, `TargetID`, `Message`, `CreatedAt` | Stores operational history for admin review and download.[^db-event] |
| `SystemSetting` | `Key`, `Value`, `UpdatedAt` | Stores configurable runtime settings. |

The experiment table includes database-level split constraints. The ORM mapping declares that train, validation, and test splits must sum to `1.00`, and validation and test splits must each be at least `0.10`.[^db-experiment] This supports backend validation and protects the database from invalid experiment rows.

## 6.4.3 Stored Procedures or Triggers

The current implementation does not define database stored procedures or triggers. Business rules are implemented in application code. This is a reasonable choice for this system because most rules depend on request context, authenticated user role, blueprint ownership, approval state, queue state, and structured JSON payloads.

| Rule area | Implemented in application layer | Relative path |
|---|---|---|
| Registration and login validation | Authentication controller and password service | `backend/app/controllers/authentication_controller.py`, `backend/app/services/password_service.py` |
| Blueprint payload rules | Blueprint validator and controller | `backend/app/validators/blueprint_validator.py`, `backend/app/controllers/blueprint_controller.py` |
| Blueprint approval transitions | Blueprint approval controller | `backend/app/controllers/blueprint_approval_controller.py` |
| Blueprint versioning | Versioning service | `backend/app/services/versioning_service.py` |
| Experiment validation | Experiment validator and controller | `backend/app/validators/experiment_validator.py`, `backend/app/controllers/experiment_controller.py` |
| Experiment compilation | Compiler service | `backend/app/execution/experiment_compiler.py` |
| Job state changes | Queue service, worker, repositories | `backend/app/services/queue_service.py`, `backend/app/workers/experiment_worker.py`, `backend/app/repositories/experiment_repository.py` |
| Access control | Access control service and controller checks | `backend/app/services/access_control_service.py`, `backend/app/controllers/_access.py` |

This approach keeps business logic in testable Python modules. It also makes the rules visible to the automated tests under `backend/tests/`, such as tests for authentication, blueprint validation, experiment validation, compiler behaviour, worker state transitions, user management, market-data administration, and system management.

## 6.4.4 Tools Used for Database Management

Database management is handled through SQLAlchemy, Alembic, repositories, and PostgreSQL-compatible administration tools. The ORM layer defines how tables and relationships are mapped. Alembic migration files preserve schema evolution. Repository classes hide query details from controllers and services. Unit of Work coordinates transactions so related changes can be committed together.

| Tool or layer | Purpose | Relative path |
|---|---|---|
| SQLAlchemy ORM | Maps database tables to Python classes | `backend/app/infrastructure/database/orm/` |
| Alembic | Stores migration scripts for schema changes | `backend/alembic/versions/` |
| Repository classes | Encapsulate read and write operations for each data area | `backend/app/repositories/` |
| Unit of Work | Groups repository operations in one transaction boundary | `backend/app/repositories/unit_of_work.py` |
| PostgreSQL client or GUI | Manual table inspection and data verification | Connected through `.env` database URL |

## Required figures and code snippets

| Evidence | What to show | Suggested source |
|---|---|---|
| Database ERD figure | User, Blueprint, Experiment, Model, ExperimentLog, Favourite tables, BTCUSDTKline, SystemEvent, and SystemSetting | Draw from ORM files under `backend/app/infrastructure/database/orm/` |
| User table snippet | User identity, role, status, and relationships | `backend/app/infrastructure/database/orm/user_orm.py` lines 17-58 |
| Blueprint table snippet | JSON architecture, indicators, approval state, version, and parent relation | `backend/app/infrastructure/database/orm/blueprint_orm.py` lines 17-75 |
| Experiment table snippet | Split constraints, status, progress, job id, compiled snapshots, deterministic seed | `backend/app/infrastructure/database/orm/experiment_orm.py` lines 18-118 |
| Model table snippet | Parameters, metrics, parameter hash, and relationship to experiment | `backend/app/infrastructure/database/orm/model_orm.py` lines 17-50 |
| Market-data table snippet | Timestamp primary key and OHLCV fields | `backend/app/infrastructure/database/orm/btcusdt_kline_orm.py` lines 17-32 |
| Database screenshot | Actual PostgreSQL tables in a database viewer or terminal | Local PostgreSQL database |

[^db-user]: User mapping and relationships are implemented in `backend/app/infrastructure/database/orm/user_orm.py` lines 17-58.
[^db-blueprint]: Blueprint schema, uniqueness, self-parent constraint, and relationships are implemented in `backend/app/infrastructure/database/orm/blueprint_orm.py` lines 17-75.
[^db-experiment]: Experiment schema, split constraints, execution fields, snapshots, and relationships are implemented in `backend/app/infrastructure/database/orm/experiment_orm.py` lines 18-118.
[^db-model]: Model metrics and parameter hash are mapped in `backend/app/infrastructure/database/orm/model_orm.py` lines 17-50.
[^db-kline]: BTCUSDT kline cache fields are mapped in `backend/app/infrastructure/database/orm/btcusdt_kline_orm.py` lines 17-32.
[^db-event]: System event fields are mapped in `backend/app/infrastructure/database/orm/system_event_orm.py` lines 16-27.
