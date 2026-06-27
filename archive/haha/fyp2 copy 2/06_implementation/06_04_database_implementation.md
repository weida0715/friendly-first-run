# 6.4 Database Implementation

## 6.4.1 Database Schema Design

The database implementation follows a strict ERD-backed relational design using PostgreSQL, SQLAlchemy ORM mappings, repository classes, and Alembic migrations. The ORM files are located in `backend/app/infrastructure/database/orm/`, and migrations are located in `backend/alembic/versions/`. The schema is designed around the main system objects: users, blueprints, experiments, models, experiment logs, favourites, BTCUSDT market data, system events, and system settings.

The schema separates long-lived user-created artefacts from generated experiment outputs. Blueprints represent reusable experiment configurations. Experiments reference blueprints and store selected parameter overrides, split configuration, execution status, progress, and compiled snapshots. Models belong to experiments and store parameter and metric results. Experiment logs store per-model signal, prediction, and metric artefacts. Favourites are represented as join tables so that a user can favourite multiple blueprints and models without duplicating the original records.

| Entity / table | Purpose | ORM relative path |
|---|---|---|
| `User` | Stores account identity, password hash, role, status, and timestamps | `backend/app/infrastructure/database/orm/user_orm.py` |
| `Blueprint` | Stores user-owned blueprint metadata, indicators, features, architecture, approval state, version, and lineage | `backend/app/infrastructure/database/orm/blueprint_orm.py` |
| `Experiment` | Stores experiment configuration, selected blueprint, split settings, date/time range, job id, progress, compiled snapshots, and status | `backend/app/infrastructure/database/orm/experiment_orm.py` |
| `Model` | Stores generated model parameters and summary metrics such as Sharpe, accuracy, precision, and recall | `backend/app/infrastructure/database/orm/model_orm.py` |
| `ExperimentLog` | Stores experiment/model logs, signals, predictions, and metrics | `backend/app/infrastructure/database/orm/experiment_log_orm.py` |
| `FavoriteBlueprint` | Join table for favourited blueprints | `backend/app/infrastructure/database/orm/favorite_blueprint_orm.py` |
| `FavoriteModel` | Join table for favourited models | `backend/app/infrastructure/database/orm/favorite_model_orm.py` |
| `BTCUSDTKline` | Stores cached BTCUSDT OHLCV candles keyed by timestamp | `backend/app/infrastructure/database/orm/btcusdt_kline_orm.py` |
| `SystemEvent` | Stores audit/system activity records for admin review and export | `backend/app/infrastructure/database/orm/system_event_orm.py` |
| `SystemSetting` | Stores configurable system settings | `backend/app/infrastructure/database/orm/system_setting_orm.py` |

The database schema is accessed through repositories rather than direct SQL statements in controllers. This supports separation of concerns: controllers handle HTTP requests, services coordinate workflows, repositories perform persistence operations, and ORM classes map records to database tables.

## 6.4.2 SQL/NoSQL Database Tables / Collections

The implemented persistence model is SQL-based. There is no NoSQL collection store in the current implementation. Redis is used as queue infrastructure and transient job metadata storage, not as the main database of record.

| Table | Key relationships | Important stored data |
|---|---|---|
| `User` | One user has many blueprints, experiments, favourite models, and favourite blueprints | Username, email, password hash, name, role, status, timestamps |
| `Blueprint` | Belongs to user, can have parent/children lineage, can be favourited, can be selected by experiments | Name, description, indicator JSON, feature JSON, architecture JSON, approval state, submitted timestamp, version, parent id |
| `Experiment` | Belongs to user and blueprint, has many models and logs | Name, description, interval, date/time range, split percentages, parameter overrides, status, progress, stage, job id, compiled snapshots, seed |
| `Model` | Belongs to experiment, can be favourited, has many logs | Parameters, parameter hash, Sharpe, accuracy, precision, recall, created timestamp |
| `ExperimentLog` | Belongs to experiment and model | Timestamp, signal, prediction, metrics JSON |
| `FavoriteBlueprint` | Links user and blueprint | User id, blueprint id, created timestamp |
| `FavoriteModel` | Links user and model | User id, model id, created timestamp |
| `BTCUSDTKline` | Independent market-data cache table keyed by timestamp | Open, high, low, close, volume, created/updated timestamps |
| `SystemEvent` | Records platform events and actor information | Scope, action, actor id/name, target type/id, message, created timestamp |
| `SystemSetting` | Key-value settings table | Key, value, updated timestamp |

Required figure for this subsection:

- Database ERD figure showing the relationships between User, Blueprint, Experiment, Model, ExperimentLog, Favourite tables, BTCUSDTKline, SystemEvent, and SystemSetting. The report should label it as the implemented database schema and mention that it is mapped by the ORM files under `backend/app/infrastructure/database/orm/`.

## 6.4.3 Stored Procedures or Triggers

The current implementation does not define database stored procedures or triggers. Business rules are implemented in the application layer using validators, services, repositories, and transaction boundaries. This is appropriate for the current system because most rules depend on user roles, ownership, approval state, and experiment configuration validation, which are easier to express and test in Python code.

Examples of application-layer rules include blueprint validation in `backend/app/validators/blueprint_validator.py`, experiment validation in `backend/app/validators/experiment_validator.py`, versioning rules in `backend/app/services/versioning_service.py`, access-control checks in `backend/app/services/access_control_service.py`, and transaction grouping in `backend/app/repositories/unit_of_work.py`.

| Rule type | Implemented through | Reason |
|---|---|---|
| Authentication and roles | `backend/app/controllers/authentication_controller.py`, `backend/app/services/access_control_service.py` | Requires session/user context and request-level authorization. |
| Blueprint validation | `backend/app/validators/blueprint_validator.py` | Requires structured JSON validation for architecture and indicators. |
| Experiment validation | `backend/app/validators/experiment_validator.py` | Requires date, split, blueprint access, and parameter override checks before queueing. |
| Versioning | `backend/app/services/versioning_service.py` | Requires approval-state-aware behaviour for draft versus reviewed/submitted blueprints. |
| Queue lifecycle | `backend/app/services/queue_service.py`, `backend/app/workers/experiment_worker.py` | Requires coordination between database state and Redis/RQ job state. |

## 6.4.4 Tools Used for Database Management

Database management is implemented through SQLAlchemy ORM, Alembic migrations, repository classes, and PostgreSQL-compatible administration tools. The repository code performs persistence operations at runtime, while Alembic migration files version the schema.

| Tool / layer | Usage | Relative path |
|---|---|---|
| SQLAlchemy ORM | Maps Python classes to PostgreSQL tables | `backend/app/infrastructure/database/orm/` |
| Alembic | Applies schema migrations | `backend/alembic/versions/` |
| Unit of Work | Coordinates database transactions | `backend/app/repositories/unit_of_work.py` |
| Repository classes | Encapsulate database access for each aggregate | `backend/app/repositories/` |
| PostgreSQL client or GUI | Manual inspection and administration of local database | External tool; not part of source code |

Suggested code snippet reference:

- Include the `ExperimentORM` fields from `backend/app/infrastructure/database/orm/experiment_orm.py`, because this table demonstrates how experiment configuration, progress, job id, compiled snapshots, and deterministic settings are stored.
- Include the `BlueprintORM` fields from `backend/app/infrastructure/database/orm/blueprint_orm.py`, because it shows approval state, versioning, parent lineage, and experiment relationships.
- Include the `BTCUSDTKlineORM` fields from `backend/app/infrastructure/database/orm/btcusdt_kline_orm.py`, because it shows the market-data cache design.
