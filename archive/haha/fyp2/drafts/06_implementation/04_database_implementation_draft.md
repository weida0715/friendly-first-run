# 6.4 Database Implementation

## Section Purpose

This section explains how persistent storage was implemented. It should describe the relational database design, the main database tables, the migration approach, the transaction boundary, the repository pattern, and the tools used for database management. The emphasis should be on integrity, traceability, and reproducibility.

## 6.4.1 Database Schema Design

### Recommended Structure

Use three paragraphs, one ERD figure reference, and one entity responsibility table.

Paragraph 1 should explain that PostgreSQL is used as the required relational database. SQLAlchemy ORM mappings define the backend persistence structure, while Alembic is used for schema migration management. The backend reads the database connection from `.env` through `DATABASE_URL`.

Paragraph 2 should explain that domain models represent business concepts such as users, blueprints, experiments, models, experiment logs, favorites, market candles, system events, and settings. ORM files under `backend/app/infrastructure/database/orm` map these concepts to relational tables.

Paragraph 3 should explain how relational persistence supports reproducibility. Experiments store their configuration, compiled snapshots, model records, parameter hashes, metrics, and logs. Blueprint versioning and ownership are also stored, allowing the system to preserve the exact context used for experiment execution.

| Entity Area | Implementation Responsibility |
| --- | --- |
| User | Account identity, role, status, credential hash, and profile ownership |
| Blueprint | Reusable experiment template, approval state, version lineage, metadata, indicators, and architecture configuration |
| Experiment | Submitted experiment configuration, dataset range, split configuration, job state, progress, and compiled snapshots |
| Model | Trained model artifact metadata, parameters, parameter hash, metrics, and ranking data |
| ExperimentLog | Structured execution artifacts such as backtest, confusion, round, split metadata, and console information |
| BTCUSDTKline | Cached BTCUSDT candle records used by charts and experiment execution |
| FavoriteBlueprint / FavoriteModel | User-saved blueprint and model references |
| SystemEvent | Traceable operational and administrative events |
| SystemSetting | Runtime-configurable system values |

> Note: Include an ERD figure in this subsection. The figure should show users, blueprints, experiments, models, experiment logs, favorites, market-data candles, settings, and system events. If the ERD is too large, place the complete ERD in an appendix and include a simplified ERD here.

## 6.4.2 SQL Database Tables

### Recommended Structure

Use one introductory paragraph followed by a table of implemented tables. Add a second table for key relationships.

| Table / ORM Area | Purpose | Important Fields to Mention |
| --- | --- | --- |
| User ORM | Stores registered users | identifier, username, email, credential hash, role, status, timestamps |
| Blueprint ORM | Stores reusable blueprint definitions | owner, metadata, architecture, indicators, approval state, version, parent/original references |
| Experiment ORM | Stores experiment requests and status | owner, blueprint, symbol, interval, dates, split ratios, target strategy, status, progress, job id, snapshots |
| Model ORM | Stores evaluated model outputs | experiment id, parameters, parameter hash, metrics, ranking fields |
| ExperimentLog ORM | Stores structured experiment artifacts | experiment id, model id, log type, metrics payload |
| BTCUSDTKline ORM | Stores BTCUSDT candle cache | timestamp, open, high, low, close, volume, update metadata |
| FavoriteBlueprint ORM | Stores user-blueprint favorites | user id, blueprint id |
| FavoriteModel ORM | Stores user-model favorites | user id, model id |
| SystemEvent ORM | Stores trace/audit events | scope, action, actor, target, message, timestamps |
| SystemSetting ORM | Stores system configuration values | setting key, value, metadata |

| Relationship | Implementation Meaning |
| --- | --- |
| User to Blueprint | A user owns created blueprints |
| User to Experiment | A user owns submitted experiments |
| Blueprint to Experiment | Experiments are created from selected blueprints |
| Experiment to Model | One experiment can produce multiple model rows, one per parameter permutation |
| Experiment to ExperimentLog | One experiment can produce many structured logs |
| User to FavoriteBlueprint | A user can save accessible blueprints |
| User to FavoriteModel | A user can save model artifacts |
| User/System to SystemEvent | System actions can be recorded for traceability |

> Note: Include one screenshot from a database management tool only if it clearly shows the implemented tables. Avoid showing local secrets or connection strings.

## 6.4.3 Stored Procedures or Triggers

### Recommended Structure

Use one paragraph.

State that stored procedures and database triggers are not required in the current implementation. Business rules are implemented in the backend service, validator, repository, and unit-of-work layers. This keeps complex validation close to the domain logic and automated tests.

Content to include:

- No custom stored procedures are used.
- No custom triggers are required.
- Constraints and transactions are handled through relational schema, ORM mappings, repositories, and unit of work.
- Application-level validation handles experiment and blueprint rules before persistence.

## 6.4.4 Tools Used for Database Management

### Recommended Structure

Use one paragraph and one table.

| Tool | Purpose |
| --- | --- |
| PostgreSQL server | Runtime relational database |
| SQLAlchemy | ORM mapping and database access |
| Alembic | Schema migration and migration history |
| Backend tests | Validate repository and persistence behavior |
| Terminal / PostgreSQL client | Manual inspection and setup when required |
| `.env` configuration | Supplies database connection information |

## Pseudocode Requirement

Include PDL-style pseudocode for the unit-of-work transaction boundary because it explains how database consistency is maintained.

```text
PROCEDURE Execute Transactional Operation
  OPEN database session
  ATTACH repositories to session
  TRY
    PERFORM requested domain operation
    VALIDATE business rules
    PERSIST changed entities
    COMMIT transaction
  CATCH error
    ROLLBACK transaction
    RETURN error response
  FINALLY
    CLOSE database session
  ENDTRY
ENDPROCEDURE
```

## Draft Content to Use in the Report

The database implementation uses PostgreSQL as the persistent storage engine. The backend resolves the database connection through the `DATABASE_URL` environment variable. This ensures that the development and deployment environments use the same relational database assumptions.

SQLAlchemy is used to define ORM mappings and database sessions. The ORM layer maps persistent rows to application concepts such as users, blueprints, experiments, models, experiment logs, BTCUSDT candles, favorites, system settings, and system events. Repositories provide focused data access operations, while the unit-of-work boundary coordinates transactions and ensures that successful operations are committed and failed operations are rolled back.

The schema is designed around traceability and reproducibility. Experiment records store the submitted configuration, ownership, status, progress, selected blueprint, split configuration, and compiled snapshots. Model records store the resulting parameter combinations and evaluation metrics. Experiment logs preserve structured artifacts such as backtest logs, confusion metrics, split metadata, and console-style execution information. This design allows experiment results to remain accessible through the database without relying on temporary intermediate files.

Stored procedures and triggers are not used in this implementation. Instead, business rules are enforced at the backend layer through validators, services, repositories, and transaction handling. This approach keeps validation behavior visible in source code and easier to verify through automated tests.
