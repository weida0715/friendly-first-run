# 6.4 Database Implementation

This section describes how persistent storage is implemented for the Bitcoin Experimental Engine. The system uses a relational database design because the application must preserve users, roles, blueprints, experiments, jobs, models, logs, market data, favorites, settings, and system events in a structured and traceable way. Relational persistence is especially important for this project because experiment results must remain linked to the exact user, blueprint, configuration, model parameters, and generated logs that produced them.

The backend database implementation is located mainly under `backend/app/infrastructure/database`, `backend/app/repositories`, and `backend/app/domain`. The infrastructure layer defines SQLAlchemy database configuration and ORM mappings. The repository layer provides controlled data access operations. The domain layer defines application-level data objects used by services, controllers, workers, validators, and execution components. The database connection is configured through `.env`, allowing the source code to remain independent from local machine settings.

## 6.4.1 Database Schema Design

The database is implemented using PostgreSQL as the persistent relational storage engine. PostgreSQL was selected because the system requires durable relational records, uniqueness rules, foreign-key relationships, structured JSON fields, numeric precision for financial and evaluation values, and reliable transaction handling. SQLAlchemy is used as the object-relational mapping layer so that backend repositories can work with Python objects while still preserving relational database structure.

The database schema is designed around the main business objects of the system: users, blueprints, experiments, models, experiment logs, BTCUSDT candles, favorites, system settings, and system events. These objects map directly to the implemented source areas in the backend. For example, user records support authentication and role-based access, blueprint records support reusable experiment templates, experiment records support submitted execution requests, and model and log records support result inspection after execution.

The schema also supports reproducibility. Experiment records store configuration details such as selected blueprint, interval, date range, split ratios, deterministic setting, seed value, parameter overrides, job status, and compiled snapshots. Model records store parameter combinations, parameter hashes, and evaluation metrics. Experiment log records store structured execution artifacts. This means a completed experiment can be inspected later without relying on temporary runtime files.

The overall database design follows a normalized relational structure with selected JSON fields where flexible structured configuration is required. Blueprint indicator definitions, feature definitions, architecture configuration, experiment parameter overrides, compiled snapshots, model parameters, and log metrics are stored as structured JSON values. This hybrid approach keeps core ownership and relationship data relational while allowing experiment-specific configuration to remain flexible.

> Note: Add a simplified ERD figure after this paragraph. The ERD should show `User`, `Blueprint`, `Experiment`, `Model`, `ExperimentLog`, `BTCUSDTKline`, `FavoriteBlueprint`, `FavoriteModel`, `SystemSetting`, and `SystemEvent`. If the complete ERD becomes too large, place the full ERD in an appendix and keep a simplified version here.

**Table 6.16: Database Entity Responsibilities**

| Entity / Table | Implementation Responsibility |
| --- | --- |
| `User` | Stores account identity, username, email, credential hash, display name, role, status, and timestamps |
| `Blueprint` | Stores reusable experiment templates including metadata, indicators, features, architecture configuration, approval state, version, and parent relationship |
| `Experiment` | Stores submitted experiment configuration, selected blueprint, dataset range, split configuration, execution state, job identifier, deterministic settings, and compiled snapshots |
| `Model` | Stores trained model artifacts, parameter sets, parameter hashes, and evaluation metrics such as Sharpe, accuracy, precision, and recall |
| `ExperimentLog` | Stores structured experiment execution artifacts linked to experiments and models |
| `BTCUSDTKline` | Stores cached BTCUSDT candle data used by charts and experiment execution |
| `FavoriteBlueprint` | Stores user-saved blueprint references |
| `FavoriteModel` | Stores user-saved model references |
| `SystemSetting` | Stores key-value operational settings used by administrative functions |
| `SystemEvent` | Stores traceable system activity, route events, and administrative actions |

## 6.4.2 SQL Database Tables

The implemented database tables are mapped using SQLAlchemy ORM classes under the backend infrastructure database layer. The table names use domain-oriented names so that they remain aligned with the analysis and design models. Each table has a specific responsibility and is accessed through a repository rather than being manipulated directly by frontend code.

**Table 6.17: Implemented Database Tables**

| Table | Primary Responsibility | Important Implemented Fields |
| --- | --- | --- |
| `User` | Stores registered user accounts and role information | `UserID`, `Username`, `Email`, `PasswordHash`, `Name`, `Role`, `Status`, `CreatedAt`, `UpdatedAt` |
| `Blueprint` | Stores reusable blueprint definitions and approval/versioning information | `BlueprintID`, `UserID`, `Name`, `Description`, `Indicators`, `Features`, `Architecture`, `ApprovalState`, `SubmittedAt`, `Version`, `ParentID`, `CreatedAt`, `UpdatedAt` |
| `Experiment` | Stores submitted experiment records and execution state | `ExperimentID`, `UserID`, `BlueprintID`, `Name`, `Description`, `Interval`, `StartDate`, `EndDate`, `StartDateTime`, `EndDateTime`, `TrainSplit`, `ValSplit`, `TestSplit`, `ParameterOverrides`, `Status`, `Progress`, `CurrentStage`, `EtaSeconds`, `Success`, `JobID`, `CompiledBlueprintSnapshot`, `CompiledExperimentSnapshot`, `Deterministic`, `Seed`, `MaxPermutationCount`, `RequestedPermutationCount` |
| `Model` | Stores evaluated model outputs for each experiment parameter set | `ModelID`, `ExperimentID`, `Parameters`, `ParameterHash`, `Sharpe`, `Accuracy`, `Precision`, `Recall`, `CreatedAt` |
| `ExperimentLog` | Stores model-level experiment logs and metrics | `ExperimentLogID`, `ExperimentID`, `ModelID`, `Timestamp`, `Signal`, `Prediction`, `Metrics`, `CreatedAt` |
| `BTCUSDTKline` | Stores BTCUSDT OHLCV candle cache | `Timestamp`, `Open`, `High`, `Low`, `Close`, `Volume`, `CreatedAt`, `UpdatedAt` |
| `FavoriteBlueprint` | Stores many-to-many user-to-blueprint saved items | `UserID`, `BlueprintID`, `CreatedAt` |
| `FavoriteModel` | Stores many-to-many user-to-model saved items | `UserID`, `ModelID`, `CreatedAt` |
| `SystemSetting` | Stores administrative settings as key-value records | `Key`, `Value`, `UpdatedAt` |
| `SystemEvent` | Stores traceable system events | `SystemEventID`, `Scope`, `Action`, `ActorID`, `ActorUsername`, `TargetType`, `TargetID`, `Message`, `CreatedAt` |

The `User` table is the root of several ownership relationships. A user can own multiple blueprints and experiments, and can also save favorite blueprints or favorite models. The `Blueprint` table contains both relational fields and JSON fields because blueprint definitions contain flexible experiment configuration such as indicators, feature definitions, and model architecture settings. The `Experiment` table contains relational ownership links, numeric split values, execution status fields, and JSON snapshot fields that preserve the compiled state used for execution.

The `Model` and `ExperimentLog` tables store generated outputs. A single experiment can produce many model records because each parameter permutation may produce a separate evaluated model. Each model can have related experiment logs. Logs store structured metrics and execution information that can later be displayed or downloaded. The `BTCUSDTKline` table stores market-data candles using timestamp as the primary key, which allows repeated refresh operations to update existing candles instead of duplicating records.

System-level persistence is handled by `SystemSetting` and `SystemEvent`. `SystemSetting` stores configurable operational values used by administrative screens and services. `SystemEvent` stores trace data for route activity and system actions, allowing administrators to inspect operational behavior. These tables support monitoring and governance requirements without mixing administrative records with experiment artifacts.

## 6.4.3 Database Relationships

The database relationships preserve ownership, traceability, and access control. User ownership is central to the design because blueprints, experiments, favorites, and administrative visibility depend on the authenticated actor. Blueprint and experiment relationships are also central because experiments must record which reusable blueprint they were created from.

**Table 6.18: Main Database Relationships**

| Relationship | Type | Implementation Meaning |
| --- | --- | --- |
| `User` to `Blueprint` | One-to-many | A user can create and own multiple blueprints |
| `User` to `Experiment` | One-to-many | A user can submit and own multiple experiments |
| `Blueprint` to `Experiment` | One-to-many | A blueprint can be selected by multiple experiments |
| `Experiment` to `Model` | One-to-many | One experiment can produce multiple model outputs |
| `Experiment` to `ExperimentLog` | One-to-many | One experiment can produce multiple structured logs |
| `Model` to `ExperimentLog` | One-to-many | One model can be linked to multiple log entries |
| `User` to `FavoriteBlueprint` | One-to-many through join table | A user can save multiple blueprints as favorites |
| `Blueprint` to `FavoriteBlueprint` | One-to-many through join table | A blueprint can be saved by multiple users |
| `User` to `FavoriteModel` | One-to-many through join table | A user can save multiple models as favorites |
| `Model` to `FavoriteModel` | One-to-many through join table | A model can be saved by multiple users |
| `Blueprint` to `Blueprint` | Self-referencing parent-child | Blueprint versions can refer to earlier blueprint records |

The self-referencing relationship in the `Blueprint` table supports version lineage. When a blueprint has already entered a reviewed or submitted workflow, later owner edits can be represented through a new version rather than overwriting the existing artifact. This supports traceability because earlier experiments can still be understood in terms of the blueprint state that existed when the experiment was created.

The join tables `FavoriteBlueprint` and `FavoriteModel` implement saved-item behavior without duplicating blueprint or model data. This design allows users to maintain personal libraries of saved artifacts while preserving a single source of truth for the actual blueprint or model record.

> Note: Include a relationship-focused ERD or Crow's Foot diagram here if space allows. The diagram should emphasize `User -> Blueprint -> Experiment -> Model -> ExperimentLog` as the main research artifact chain.

## 6.4.4 Constraints and Data Integrity Rules

The database schema includes constraints that protect important data integrity rules. Usernames and emails are unique in the `User` table, preventing duplicate account identities. Blueprint names are constrained by user and version so that versioned blueprint records can be distinguished. Model records include a uniqueness rule for the combination of experiment and parameter hash, which prevents duplicate model artifacts for the same parameter permutation within the same experiment.

The `Experiment` table includes split-ratio checks to ensure that train, validation, and test splits form a valid experiment configuration. The split sum must equal the complete dataset allocation, and validation and test allocations must meet minimum thresholds. These database-level constraints complement the backend validator. The backend validator catches invalid submissions early and returns user-friendly errors, while the database constraint provides a final integrity safeguard.

The `BTCUSDTKline` table uses timestamp as the primary key. This is important because BTCUSDT candle records are time-series data, and each candle timestamp should identify one unique record. The market-data repository can therefore perform upsert behavior, updating an existing timestamp if refreshed data is received rather than inserting duplicate candles.

**Table 6.19: Data Integrity Rules Implemented in the Database Layer**

| Data Integrity Area | Implementation Mechanism | Purpose |
| --- | --- | --- |
| Unique user identity | Unique username and email columns | Prevent duplicate account identifiers |
| Blueprint version distinction | Unique combination of owner, blueprint name, and version | Preserve identifiable blueprint versions |
| Blueprint lineage safety | Parent reference and self-reference check | Prevent invalid blueprint parent relationship |
| Experiment split correctness | Database check constraints on split values | Ensure train, validation, and test ratios remain valid |
| Model permutation uniqueness | Unique experiment and parameter hash combination | Avoid duplicate model rows for the same parameter set |
| Market-data uniqueness | Timestamp primary key in `BTCUSDTKline` | Prevent duplicate candle rows |
| Referential traceability | Foreign-key relationships | Preserve ownership and artifact links |

## 6.4.5 Repository and Unit-of-Work Implementation

The database is not accessed directly from frontend code or by raw database operations in controller logic. Instead, the backend uses repositories to encapsulate persistence operations for each entity area. For example, the user repository handles user lookups and account persistence, the blueprint repository handles blueprint operations, the experiment repository handles experiment records, and the market-data repository handles BTCUSDT candle storage and retrieval.

The repository layer improves maintainability by separating data access from business logic. Controllers can focus on HTTP request handling, services can focus on application workflows, validators can focus on rule enforcement, and repositories can focus on database operations. This also makes testing easier because persistence behavior can be exercised through controlled repository methods.

The `UnitOfWork` class provides a transaction boundary around repository operations. When a unit-of-work context is entered, it opens a database session and attaches the repositories to that session. If the operation completes successfully, the transaction is committed. If an exception occurs, the transaction is rolled back. The session is then closed. This pattern protects consistency for operations that modify multiple tables, such as creating an experiment and queue metadata, updating experiment status, or saving model and log outputs.

The transaction behavior can be represented using Program Design Language style pseudocode:

```text
PROCEDURE Execute Database Operation
  OPEN database session
  ATTACH user repository to session
  ATTACH blueprint repository to session
  ATTACH experiment repository to session
  ATTACH model repository to session
  ATTACH experiment log repository to session
  ATTACH favorite repositories to session
  ATTACH market data repository to session
  ATTACH system repositories to session

  TRY
    PERFORM requested application operation
    VALIDATE business rules before persistence
    SAVE or UPDATE affected records
    COMMIT database transaction
  CATCH any error
    ROLLBACK database transaction
    RETURN or RAISE operation error
  FINALLY
    CLOSE database session
  ENDTRY
ENDPROCEDURE
```

**Table 6.20: Repository Responsibilities**

| Repository | Responsibility |
| --- | --- |
| `UserRepository` | User creation, lookup, status, role, and profile-related persistence |
| `BlueprintRepository` | Blueprint creation, lookup, listing, state changes, and version-related persistence |
| `ExperimentRepository` | Experiment creation, listing, detail lookup, status, progress, snapshots, and job-related updates |
| `ModelRepository` | Model artifact persistence, ranking queries, detail lookup, and favorite integration |
| `ExperimentLogRepository` | Structured experiment log persistence and retrieval for display or export |
| `FavoriteBlueprintRepository` | Saved blueprint creation, removal, and listing |
| `FavoriteModelRepository` | Saved model creation, removal, and listing |
| `MarketDataRepository` | BTCUSDT candle upsert, lookup, range queries, and cache metadata support |
| `SystemSettingRepository` | Administrative setting lookup and update |
| `SystemEventRepository` | System event persistence and retrieval |

## 6.4.6 Migration and Schema Management

Database schema management is handled through Alembic in the backend. Alembic provides a controlled way to apply schema definitions to the PostgreSQL database. This is important because the application has multiple related tables, foreign keys, constraints, JSON fields, and numeric fields that must match the source code expectations.

The backend database configuration uses `.env` to resolve the database connection. This allows schema setup commands and the runtime backend to point to the same database environment. Keeping database connection values outside the source code also improves portability between development and deployment environments.

A typical schema setup flow is shown below.

```text
Prepare PostgreSQL database
Configure database connection in .env
Run schema setup or migration command from backend context
Start backend application
Verify backend health and database-backed routes
```

> Note: If evidence is required for migration or schema setup, include a sanitized terminal screenshot showing a successful schema command. Do not show local database connection values.

## 6.4.7 Stored Procedures or Triggers

No custom stored procedures or database triggers are required in the current implementation. The main business rules are implemented in backend validators, services, repositories, and the unit-of-work transaction boundary. This approach keeps business logic visible in the application source code and easier to test through backend automated tests.

Database constraints are still used for important integrity rules such as uniqueness, foreign-key relationships, split-ratio validity, and primary-key uniqueness. The combination of application-level validation and database-level constraints provides two layers of protection: user-friendly validation before persistence and database integrity enforcement at the storage layer.

Stored procedures may be considered in the future if the system requires database-side scheduled aggregation, reporting, or performance optimization. However, for the current implementation, keeping workflow logic in the backend is more maintainable because experiment validation, blueprint versioning, queue submission, and worker updates are already coordinated by backend services.

## 6.4.8 Tools Used for Database Management

The database implementation uses a small set of tools that support development, setup, testing, and verification. PostgreSQL provides the database service. SQLAlchemy provides ORM mapping and session behavior. Alembic supports schema management. Backend tests validate repository and persistence behavior. Terminal commands are used to run setup and verification tasks.

**Table 6.21: Database Management Tools**

| Tool | Purpose |
| --- | --- |
| PostgreSQL | Runtime relational database for persistent system data |
| SQLAlchemy | ORM mapping, database engine setup, sessions, relationships, and repository access |
| Alembic | Database schema setup and migration workflow |
| Backend automated tests | Verification of repository behavior, controller persistence, and transaction-related behavior |
| Terminal / shell | Running backend database setup, test, and verification commands |
| `.env` configuration | Supplies database connection information without hard-coding local values |

> Note: If a database management tool screenshot is added, show only the table list or ERD. Do not show private connection information or local machine-specific values.

## 6.4.9 Database Evidence to Include

The final report should include database implementation evidence that is readable to both technical and non-technical assessors. The most suitable evidence is an ERD, table summary, and one or two selected database screenshots. Source-code screenshots are less effective unless they are used to highlight a specific constraint or mapping.

Recommended database evidence:

- Simplified ERD showing the main tables and relationships.
- Table summary listing each table and its purpose.
- Screenshot of database table list from a database client, with sensitive values hidden.
- Screenshot or table showing a sample experiment record and its related model/log records, using non-sensitive demonstration data.
- Screenshot or table showing BTCUSDT candle cache fields.

> Note: Avoid showing credential hashes, local connection strings, private user email addresses, or environment values in screenshots. Use demonstration accounts and sanitized data in the report.

## 6.4.10 Summary

The database implementation provides the persistence foundation for the Bitcoin Experimental Engine. PostgreSQL stores all durable system records, including users, blueprints, experiments, models, logs, BTCUSDT candles, favorites, settings, and system events. SQLAlchemy maps these tables into backend ORM classes, repositories encapsulate persistence operations, and the unit-of-work boundary coordinates transactions.

The schema supports the main requirements of the system by preserving ownership, role-based access, blueprint versioning, experiment configuration, compiled snapshots, model parameters, evaluation metrics, logs, market-data cache records, and administrative events. Database constraints and application validators work together to protect data integrity. This allows the system to provide reproducible experiment workflows while maintaining traceable relationships between user actions, configuration inputs, execution results, and generated artifacts.
