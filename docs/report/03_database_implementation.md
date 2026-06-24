# Database Implementation

## Database Schema Overview

The database is PostgreSQL. SQLAlchemy is used for runtime persistence and Alembic is used for schema migrations.

The main tables are:

| Table | Purpose |
| --- | --- |
| `User` | Stores account identity, password hash, role, status, and timestamps. |
| `Blueprint` | Stores reusable experiment definitions, approval state, version, and lineage. |
| `Experiment` | Stores experiment configuration, ownership, execution status, split settings, snapshots, and queue metadata. |
| `Model` | Stores model records created from experiment permutations and their summary metrics. |
| `ExperimentLog` | Stores structured experiment artifacts such as predictions, metrics, and logs. |
| `FavoriteModel` | Stores user-to-model favorites. |
| `FavoriteBlueprint` | Stores user-to-blueprint favorites. |
| `BTCUSDTKline` | Stores normalized BTCUSDT candle data. |
| `SystemEvent` | Stores recorded backend activity for system trace views. |
| `SystemSetting` | Stores runtime-tunable system settings. |

## Entity-to-Table Mapping

Domain entities are defined as dataclasses under `backend/app/domain/models`. SQLAlchemy ORM mappings are defined separately under `backend/app/infrastructure/database/orm`.

The mapping separates business objects from database rows:

- `User` maps to `UserORM` and the `User` table.
- `Blueprint` maps to `BlueprintORM` and the `Blueprint` table.
- `Experiment` maps to `ExperimentORM` and the `Experiment` table.
- `Model` maps to `ModelORM` and the `Model` table.
- `ExperimentLog` maps to `ExperimentLogORM` and the `ExperimentLog` table.
- `FavoriteModel` maps to `FavoriteModelORM` and the `FavoriteModel` table.
- `FavoriteBlueprint` maps to `FavoriteBlueprintORM` and the `FavoriteBlueprint` table.
- `BTCUSDTKline` maps to `BTCUSDTKlineORM` and the `BTCUSDTKline` table.
- `SystemEvent` maps to `SystemEventORM` and the `SystemEvent` table.
- `SystemSetting` maps to `SystemSettingORM` and the `SystemSetting` table.

Physical table and column names keep the strict ERD naming style. ORM classes expose Python-friendly attribute names and compatibility synonyms for the PascalCase column names.

## Migration and Schema Implementation

Migrations live in `backend/alembic/versions`. The baseline migration creates the main ERD tables, and later migrations add fields such as BTCUSDT update timestamps, experiment job IDs, datetime ranges, compiled snapshots, model parameter hashes, and system settings.

Pseudocode for applying migrations:

```text
Procedure ApplyDatabaseMigrations
  Read DATABASE_URL from the environment.
  Connect Alembic to the PostgreSQL database.
  Load migration files in revision order.
  For each pending migration:
    Run its upgrade procedure.
    Create or alter the affected tables and columns.
    Record the applied revision.
  Stop when the database revision matches the latest migration.
End Procedure
```

Pseudocode for the baseline schema migration:

```text
Procedure CreateBaselineSchema
  Create User with identity, credential, role, status, and timestamp columns.
  Create Blueprint with owner, JSON configuration, approval state, version, and parent columns.
  Create Experiment with owner, blueprint, split, status, progress, and configuration columns.
  Create Model linked to Experiment.
  Create ExperimentLog linked to Experiment and Model.
  Create FavoriteModel as a user-model join table.
  Create FavoriteBlueprint as a user-blueprint join table.
  Create BTCUSDTKline keyed by timestamp.
  Add foreign keys, enums, unique constraints, and check constraints.
End Procedure
```

## Repository and Unit of Work Implementation

Repositories live under `backend/app/repositories`. Each repository receives a SQLAlchemy session and owns the query logic for one persistence area. The unit of work creates the session and exposes repositories as one transaction boundary.

Pseudocode for repository usage:

```text
Procedure CreateUser
  Open a UnitOfWork.
  Ask UserRepository whether username already exists.
  Ask UserRepository whether email already exists.
  If either exists:
    Return a conflict response.
  Hash the password.
  Add the User domain object through UserRepository.
  Exit UnitOfWork successfully so the transaction commits.
End Procedure
```

Pseudocode for the unit of work:

```text
Procedure UnitOfWork
  When entering:
    Initialize database engine if needed.
    Open a SQLAlchemy session.
    Attach repositories to the session.
  During use:
    Controllers and services call repository methods.
  When exiting without error:
    Commit the session.
    Close the session.
  When exiting with error:
    Roll back the session.
    Close the session.
End Procedure
```

## Data Integrity Controls

The database layer uses multiple integrity controls:

- Primary keys protect entity identity.
- Foreign keys connect users, blueprints, experiments, models, logs, and favorite records.
- Unique constraints prevent duplicate usernames, duplicate emails, duplicate blueprint versions per owner/name, and duplicate model parameter hashes per experiment.
- Check constraints enforce valid experiment split totals, minimum validation/test split sizes, and prevent a blueprint from referencing itself as parent.
- Enum columns restrict user roles, user statuses, blueprint approval states, experiment intervals, and experiment statuses.
- Composite primary keys in favorite tables prevent duplicate favorites for the same user and target.
- The `BTCUSDTKline` timestamp primary key prevents duplicate candles for the same interval timestamp.
