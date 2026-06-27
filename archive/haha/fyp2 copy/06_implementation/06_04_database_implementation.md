# 6.4 Database Implementation

The database implementation uses PostgreSQL as the required runtime database and maps the system entities through ORM classes, repositories, domain dataclasses, and a unit-of-work pattern. The schema is not treated as a passive storage layer. It supports authentication, role management, blueprint governance, experiment configuration, queued execution state, market-data caching, model ranking, logs, favourites, system settings, and audit/system events.

## 6.4.1 Database schema design

The schema is represented in two source-code layers:

1. Domain entities in `backend/app/domain/models/*.py`, which describe the business object fields used by services and controllers.
2. ORM table mappings in `backend/app/infrastructure/database/orm/*.py`, which map those concepts to database persistence.

The repository layer in `backend/app/repositories/*.py` separates business logic from database access. Controllers and services do not directly manipulate SQL queries for most feature workflows. Instead, they load and persist domain objects through repositories and commit through `backend/app/repositories/unit_of_work.py`.

## 6.4.2 SQL database tables / collections

| Logical table/entity | Domain model | ORM mapping | Repository | Purpose |
|---|---|---|---|---|
| Users | `backend/app/domain/models/user.py` | `backend/app/infrastructure/database/orm/user_orm.py` | `backend/app/repositories/user_repository.py` | Stores accounts, roles, status, identity, password hash, timestamps |
| User audit logs | `backend/app/domain/models/user.py` or audit-related repository model | `backend/app/infrastructure/database/orm/user_orm.py` and related audit mapping | `backend/app/repositories/user_audit_log_repository.py` if present / user controller usage | Tracks staff user-management changes |
| Blueprints | `backend/app/domain/models/blueprint.py` | `backend/app/infrastructure/database/orm/blueprint_orm.py` | `backend/app/repositories/blueprint_repository.py` | Stores reusable experiment architecture, indicators, approval state, version and lineage |
| Favourite blueprints | `backend/app/domain/models/favorite_blueprint.py` | `backend/app/infrastructure/database/orm/favorite_blueprint_orm.py` | `backend/app/repositories/favorite_blueprint_repository.py` | Links users to favourited blueprints |
| Experiments | `backend/app/domain/models/experiment.py` | `backend/app/infrastructure/database/orm/experiment_orm.py` | `backend/app/repositories/experiment_repository.py` | Stores experiment configuration, status, progress, job id, compiled snapshots, deterministic settings |
| BTCUSDT klines | `backend/app/domain/models/btcusdt_kline.py` | `backend/app/infrastructure/database/orm/btcusdt_kline_orm.py` | `backend/app/repositories/market_data_repository.py` | Stores cached market candles used by charts and experiment execution |
| Models | `backend/app/domain/models/model.py` | `backend/app/infrastructure/database/orm/model_orm.py` | `backend/app/repositories/model_repository.py` | Stores trained model records, metrics, parameters, ranking data, public visibility |
| Favourite models | `backend/app/domain/models/favorite_model.py` | `backend/app/infrastructure/database/orm/favorite_model_orm.py` | `backend/app/repositories/favorite_model_repository.py` | Links users to favourited model records |
| Experiment logs | `backend/app/domain/models/experiment_log.py` | `backend/app/infrastructure/database/orm/experiment_log_orm.py` | `backend/app/repositories/experiment_log_repository.py` | Stores execution logs and downloadable artifacts |
| Experiment confusion metrics | `backend/app/domain/models/experiment_confusion_metrics.py` | metrics/log ORM and repository integration | `backend/app/repositories/experiment_log_repository.py` | Stores confusion-matrix-style metrics for model evaluation |
| System events | `backend/app/domain/models/system_event.py` | `backend/app/infrastructure/database/orm/system_event_orm.py` | `backend/app/repositories/system_event_repository.py` | Stores operational trace and system event records |
| System settings | service-backed setting records | `backend/app/infrastructure/database/orm/system_setting_orm.py` | `backend/app/repositories/system_setting_repository.py` | Stores configurable system settings exposed to admin pages |

## Entity relationship explanation

| Relationship | Implementation meaning | Evidence paths |
|---|---|---|
| User to Blueprint | A user owns blueprints and may request approval for them | `backend/app/domain/models/blueprint.py`, `backend/app/controllers/blueprint_controller.py` |
| User to Experiment | A user owns experiments; experiment list/detail endpoints enforce ownership | `backend/app/domain/models/experiment.py`, `backend/app/controllers/experiment_controller.py` |
| Blueprint to Experiment | An experiment selects one approved or accessible blueprint and stores immutable compiled snapshots | `backend/app/execution/experiment_compiler.py`, `backend/app/domain/models/experiment.py` |
| Experiment to Model | Experiment execution produces model records used for rankings and detail views | `backend/app/repositories/model_repository.py`, `backend/app/controllers/model_controller.py` |
| Experiment to Logs | Execution produces logs and downloadable artifacts | `backend/app/repositories/experiment_log_repository.py`, `backend/app/controllers/logs_download_controller.py` |
| User to Favourites | Users can favourite blueprints and models for quick access | `backend/app/repositories/favorite_blueprint_repository.py`, `backend/app/repositories/favorite_model_repository.py` |
| BTCUSDTKline to Charts and Execution | Cached candle data feeds chart endpoints and experiment execution | `backend/app/repositories/market_data_repository.py`, `backend/app/services/market_data_service.py`, `backend/app/executors/default_experiment_executor.py` |

## Key schema fields to mention

| Entity | Important fields visible in source code | Why important |
|---|---|---|
| `Experiment` | `user_id`, `blueprint_id`, `interval`, `start_date`, `end_date`, `train_split`, `val_split`, `test_split`, `parameter_overrides`, `status`, `progress`, `job_id`, `compiled_blueprint_snapshot`, `compiled_experiment_snapshot`, `deterministic`, `seed`, `max_permutation_count`, `requested_permutation_count` | Shows that an experiment stores both user-facing configuration and execution traceability data. See `backend/app/domain/models/experiment.py`, lines 14-42. |
| `Blueprint` | name, description, architecture, indicators, features, approval state, owner, version, lineage | Supports reusable and moderated experiment designs. See `backend/app/domain/models/blueprint.py`. |
| `Model` | experiment link, metrics, parameter hash, architecture, ranking fields, public visibility/favourite support | Supports model comparison and discovery. See `backend/app/domain/models/model.py`. |
| `BTCUSDTKline` | timestamp/open/high/low/close/volume fields | Enables deterministic local chart and execution data. See `backend/app/domain/models/btcusdt_kline.py`. |
| `User` | account identity, role, status, password hash, timestamps | Enables authentication and RBAC. See `backend/app/domain/models/user.py`. |

## 6.4.3 Stored procedures or triggers

No stored procedures or database triggers are used in the current implementation. Business rules are implemented in Python services, validators, repositories, and controllers. This choice keeps the project logic visible in source code and testable through pytest. Examples include:

| Rule | Implemented in source code |
|---|---|
| Experiment split validation and blueprint accessibility | `backend/app/validators/experiment_validator.py`, `backend/app/controllers/experiment_controller.py` |
| Blueprint architecture/indicator validation | `backend/app/validators/blueprint_validator.py` |
| Versioning behavior for reviewed blueprints | `backend/app/services/versioning_service.py` |
| Role-based access control | `backend/app/services/access_control_service.py`, controller guards |
| Market-data upsert behavior | `backend/app/services/market_data_service.py`, `backend/app/repositories/market_data_repository.py` |
| Queue/job state transitions | `backend/app/workers/experiment_worker.py`, `backend/app/services/queue_service.py` |

## 6.4.4 Tools used for database management

| Tool | Role in implementation | Evidence |
|---|---|---|
| PostgreSQL | Required runtime database | `.env.example`, `backend/app/config.py` |
| Alembic | Schema migration baseline and database upgrade/stamp workflow | `backend/alembic/env.py`, `backend/alembic/versions/*.py` |
| SQLAlchemy-style ORM | Table mappings and session management | `backend/app/infrastructure/database/base.py`, `backend/app/infrastructure/database/session.py`, `backend/app/infrastructure/database/orm/*.py` |
| Repository layer | Encapsulates persistence access for domain logic | `backend/app/repositories/*.py` |
| Unit of Work | Coordinates transactions and commits | `backend/app/repositories/unit_of_work.py` |

## Database implementation pseudocode

```text
Controller receives authenticated request
  -> validate request payload and user access
  -> open repository/unit-of-work boundary
  -> load domain entities from ORM-backed repositories
  -> call service or validator for business rules
  -> update domain entity state
  -> repository maps domain state to ORM row
  -> unit of work commits transaction
  -> controller returns normalized JSON response
```

## Screenshot and code snippet requirements

| Evidence item | File and lines to include | Screenshot instruction |
|---|---|---|
| Experiment domain model | `backend/app/domain/models/experiment.py`, lines 14-42 | Show how status, splits, parameter overrides, job id, compiled snapshots, and permutation counts are persisted conceptually |
| Route-to-repository flow | `backend/app/controllers/experiment_controller.py`, experiment create and detail sections | Show controller-level validation and persistence calls |
| ORM mappings | `backend/app/infrastructure/database/orm/*.py` | Include a screenshot of at least the `experiment_orm.py`, `blueprint_orm.py`, and `model_orm.py` mappings |
| Migration baseline | `backend/alembic/versions/*.py` | Show that the database schema is explicitly versioned |
| Unit of work | `backend/app/repositories/unit_of_work.py` | Show transaction boundary pattern |

## Summary

The database implementation is central to BEE because the project is not only a prediction interface. It stores reproducible experimental context: user identity, blueprint design, experiment parameters, execution status, compiled snapshots, market data, trained models, logs, favourites, and public discovery records. This design makes completed experiments traceable and allows dashboards, rankings, public hub pages, and administrative tools to read from the same consistent persistence layer.
