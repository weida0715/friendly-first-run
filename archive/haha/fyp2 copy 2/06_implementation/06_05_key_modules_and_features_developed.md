# 6.5 Key Modules and Features Developed

This section describes the main modules implemented in BEE. Each module is described in terms of its functionality, source-code location, integration points, required screenshots, and selective pseudocode or code snippet references. The implementation covers the dashboard, experiments, blueprints, models, favourites, public hub, documentation, admin panel, moderator panel, blueprint architecture, indicators, data ingestion, splits, target strategies, experiment compiler, executor, job queue, and system management.

## 6.5.1 User Authentication and Session Module

The authentication module supports registration, login, current-user lookup, logout, session handling, CSRF hardening, password hashing, and role-aware access. Backend API logic is implemented in `backend/app/controllers/authentication_controller.py`, while password and session behaviour is supported by `backend/app/services/password_service.py` and `backend/app/services/session_service.py`. Frontend authentication views are implemented in `frontend/app/(auth)/login/`, `frontend/app/(auth)/register/`, and corresponding view files under `frontend/views/`. Route protection is tested in `frontend/tests/auth-guards.test.tsx`.

| Feature | Relative paths | Integration |
|---|---|---|
| Registration and login | `backend/app/controllers/authentication_controller.py`, `frontend/app/(auth)/login/`, `frontend/app/(auth)/register/` | Frontend submits credentials through `frontend/lib/api/client.ts`; backend validates and creates a session. |
| Current user session | `backend/app/controllers/authentication_controller.py`, `backend/app/services/session_service.py` | Frontend uses `/api/auth/me` to decide whether protected pages can render. |
| Password hashing | `backend/app/services/password_service.py` | User passwords are stored as hashes in `User.PasswordHash`, not plaintext. |
| Role-aware guards | `frontend/lib/routes/nav.ts`, `frontend/lib/auth/`, `frontend/tests/auth-guards.test.tsx` | Users, moderators, and admins see different route access. |

Authentication pseudocode:

```text
PROCEDURE LoginUser
    RECEIVE email_or_username and password
    VALIDATE required fields are present
    FIND active user by identifier
    IF user does not exist OR password hash does not match THEN
        RETURN authentication error
    END IF
    CREATE server-managed session for user
    RETURN current user profile and role
END PROCEDURE
```

Required screenshots:

1. Login page showing email/password fields and submit button.
2. Registration page showing account creation form.
3. Dashboard after successful login.
4. Unauthorized or role-restricted screen when a normal user attempts to access an admin-only page.

Suggested code snippet reference:

- Include login/register route sections from `backend/app/controllers/authentication_controller.py`.
- Include role guard/navigation logic from `frontend/lib/routes/nav.ts`.

## 6.5.2 Dashboard and BTCUSDT Chart Module

The dashboard module presents the authenticated user with high-level system entry points and BTCUSDT chart visibility. The frontend route is implemented under `frontend/app/dashboard/`, and the dashboard view is tested in `frontend/tests/dashboard-view.test.tsx`. BTCUSDT charting is implemented with a reusable chart component and backend market-data endpoint. The backend controller for market data is `backend/app/controllers/market_data_controller.py`, and the frontend API functions are defined in `frontend/lib/api/client.ts`.

| Feature | Relative paths | Integration |
|---|---|---|
| Dashboard route and cards | `frontend/app/dashboard/`, `frontend/views/` | Links users to experiments, blueprints, models, public hub, documentation, and jobs. |
| BTCUSDT price chart | `frontend/components/charts/`, `frontend/tests/btcusdt-price-chart.test.tsx` | Reads cached candles through backend market-data API. |
| Chart API | `backend/app/controllers/market_data_controller.py`, `backend/app/repositories/market_data_repository.py` | Returns cached BTCUSDT klines from PostgreSQL. |
| Loading/error/empty states | `frontend/components/states/`, `frontend/tests/base-and-states.test.tsx` | Handles unavailable data without crashing the UI. |

Required screenshots:

1. Dashboard overview with key cards and sidebar navigation.
2. BTCUSDT chart rendered with candle/line data.
3. Chart empty or loading state if local cache has no available candles.

Suggested code snippet reference:

- Include the market data endpoint section for `GET /api/market-data/btcusdt/klines` from `backend/app/controllers/market_data_controller.py`.
- Include chart fetch/render usage from the BTCUSDT chart component under `frontend/components/charts/`.

## 6.5.3 Blueprint Architecture, Wizard, Library, Moderation, and Versioning Module

The blueprint module allows users to create reusable experiment designs. A blueprint stores metadata, feature/indicator definitions, architecture configuration, approval state, version number, and optional parent lineage. The backend controller is implemented in `backend/app/controllers/blueprint_controller.py`, validation is implemented in `backend/app/validators/blueprint_validator.py`, persistence is implemented through `backend/app/repositories/blueprint_repository.py`, and version rules are supported by `backend/app/services/versioning_service.py`. The frontend wizard and library are implemented under `frontend/app/blueprints/` and tested by `frontend/tests/blueprint-wizard-view.test.tsx` and `frontend/tests/blueprint-library-detail-moderation.test.tsx`.

| Feature | Relative paths | Integration |
|---|---|---|
| Blueprint creation wizard | `frontend/app/blueprints/new/`, `frontend/views/blueprint-wizard-view.tsx`, `backend/app/controllers/blueprint_controller.py` | User creates a draft blueprint with metadata, reference architecture, and indicators. |
| Blueprint validation | `backend/app/validators/blueprint_validator.py` | Rejects missing or invalid metadata, architecture, and indicator configuration. |
| Blueprint library/detail | `frontend/app/blueprints/`, `frontend/app/blueprints/[id]/`, `backend/app/controllers/blueprints_library_controller.py` | Shows owned and favourited blueprints with detail summaries. |
| Versioning | `backend/app/services/versioning_service.py`, `backend/app/domain/models/blueprint.py` | Keeps reviewed/submitted blueprints immutable by creating versioned drafts when needed. |
| Moderation | `frontend/app/blueprints/moderation/`, `backend/app/controllers/blueprint_approval_controller.py` | Moderators/admins approve, reject, or disapprove submitted blueprints. |
| Experiment integration | `backend/app/controllers/experiment_controller.py`, `frontend/app/experiments/new/` | Approved blueprints are exposed as selectable experiment options. |

Blueprint creation pseudocode:

```text
PROCEDURE CreateBlueprintDraft
    RECEIVE blueprint metadata, architecture, and indicator configuration
    VALIDATE payload with BlueprintValidator
    IF validation errors exist THEN
        RETURN 422 with field-level messages
    END IF
    ATTACH current user as owner
    CREATE Draft blueprint in repository
    COMMIT transaction
    RETURN created blueprint summary
END PROCEDURE
```

Approval pseudocode:

```text
PROCEDURE ModerateBlueprint
    REQUIRE moderator or admin role
    LOAD target blueprint
    CHECK requested action is valid for current approval state
    UPDATE approval_state to Approved, Rejected, or Disapproved
    RECORD moderation result
    RETURN updated blueprint state
END PROCEDURE
```

Required screenshots:

1. Blueprint wizard basics step.
2. Blueprint architecture/indicator configuration step.
3. Blueprint review step before submission.
4. Blueprint library listing showing owned and favourited blueprints.
5. Blueprint detail page showing approval state, version, indicators, and architecture.
6. Moderator panel showing moderation queue and approve/reject/disapprove actions.

Suggested code snippet reference:

- Include `BlueprintValidator` logic from `backend/app/validators/blueprint_validator.py`.
- Include the create/patch/favourite endpoints from `backend/app/controllers/blueprint_controller.py`.
- Include moderation endpoints from `backend/app/controllers/blueprint_approval_controller.py`.

## 6.5.4 Indicator, Target, Split, Architecture, and Experiment Strategy Modules

The experiment engine is extensible through strategy classes and factories. Indicators are implemented under `backend/app/strategies/indicators/`. Target strategies are implemented under `backend/app/strategies/targets/`. Data split strategies are implemented under `backend/app/strategies/splits/`. Model architecture factories and concrete architectures are implemented under `backend/app/factories/architecture_factory.py`, `backend/app/architectures/logistic_regressor_architecture.py`, and `backend/app/architectures/ridge_classifier_architecture.py`.

| Strategy area | Implemented examples | Relative paths |
|---|---|---|
| Indicators | SMA crossover, RSI, VWAP, rolling volatility, trend strength, Ichimoku cloud, quantile flag, price range position, time features, TA-Lib indicator strategy | `backend/app/strategies/indicators/`, `backend/app/factories/indicator_factory.py`, `backend/app/factories/talib_registry.py` |
| Targets | Candle direction, forward return, rate-of-change lookahead, quantile flag, trade quality target strategies | `backend/app/strategies/targets/`, `backend/app/factories/target_strategy_factory.py` |
| Splits | Random split and time-based sequential split | `backend/app/strategies/splits/` |
| Architecture | Logistic regressor and ridge classifier architecture implementations | `backend/app/architectures/`, `backend/app/factories/architecture_factory.py` |
| Metrics and logs | Classification metrics, continuous metrics, backtest logs, confusion metrics, parameter correlation, reproducibility logs | `backend/app/strategies/metrics/`, `backend/app/strategies/logs/` |

The strategy design allows the experiment executor to assemble experiment behaviour based on blueprint and experiment configuration. This design is important because users configure experiments through the UI, but the backend must convert those settings into reproducible execution steps.

Strategy selection pseudocode:

```text
PROCEDURE BuildExecutionPlan
    LOAD selected blueprint and experiment configuration
    SELECT architecture from ArchitectureFactory
    FOR EACH configured indicator
        SELECT indicator strategy from IndicatorFactory
        APPLY indicator parameters
    END FOR
    SELECT target strategy from TargetStrategyFactory
    SELECT split strategy from split configuration
    RETURN compiled execution plan
END PROCEDURE
```

Required screenshots:

1. Blueprint wizard section showing indicator choices.
2. Experiment wizard section showing split configuration.
3. Experiment wizard section showing target preview or target-related settings.
4. Model/detail result screen showing metric outputs.

Suggested code snippet reference:

- Include selected factory logic from `backend/app/factories/indicator_factory.py` and `backend/app/factories/target_strategy_factory.py`.
- Include split logic from `backend/app/strategies/splits/time_based_sequential_split_strategy.py` and `backend/app/strategies/splits/random_split_strategy.py`.

## 6.5.5 Data Ingestion and BTCUSDT Market Data Cache Module

The market data module retrieves BTCUSDT 1-minute candles, normalizes them, and stores them in the local PostgreSQL cache. The Binance connector is implemented in `backend/app/infrastructure/binance/kline_client.py`, market data service logic is implemented in `backend/app/services/market_data_service.py`, the repository is implemented in `backend/app/repositories/market_data_repository.py`, and CLI scripts are implemented in `backend/app/scripts/ingest_btcusdt_klines.py` and `backend/app/scripts/refresh_btcusdt_klines.py`.

| Feature | Relative paths | Purpose |
|---|---|---|
| Binance kline client | `backend/app/infrastructure/binance/kline_client.py` | Retrieves external BTCUSDT candles with validation and pagination. |
| Market data service | `backend/app/services/market_data_service.py` | Coordinates retrieval, normalization, upsert, and refresh summaries. |
| BTCUSDT repository | `backend/app/repositories/market_data_repository.py` | Reads/writes kline cache records. |
| Ingestion script | `backend/app/scripts/ingest_btcusdt_klines.py` | Performs initial or large backfill. |
| Refresh script | `backend/app/scripts/refresh_btcusdt_klines.py` | Performs incremental refresh. |
| Admin catch-up controls | `backend/app/controllers/market_data_controller.py`, `frontend/app/system/` | Allows admin-controlled catch-up, status, stop, and clear actions. |

Data ingestion pseudocode:

```text
PROCEDURE RefreshBTCUSDTKlines
    VALIDATE symbol is BTCUSDT and interval is 1m
    FETCH kline batches from Binance client
    NORMALIZE each kline into BTCUSDTKline entity fields
    UPSERT candles by timestamp into PostgreSQL cache
    COUNT inserted and updated rows
    RETURN refresh summary
END PROCEDURE
```

Required screenshots:

1. System/admin market data section showing catch-up or status controls.
2. Terminal output of ingestion or refresh script showing fetched/inserted/updated summary.
3. Dashboard or experiment chart proving that cached BTCUSDT data is visible in the UI.

Suggested code snippet reference:

- Include Binance request validation from `backend/app/infrastructure/binance/kline_client.py`.
- Include upsert/cache refresh logic from `backend/app/services/market_data_service.py`.

## 6.5.6 Experiment Wizard, Compiler, Executor, Queue, and Job Lifecycle Module

The experiment module is the core module of BEE. It allows a user to create an experiment from an approved blueprint, configure the BTCUSDT dataset range, define train/validation/test splits, apply parameter overrides, review the configuration, submit the experiment, and track execution status. Frontend pages are implemented under `frontend/app/experiments/`, with tests in `frontend/tests/experiment-wizard-view.test.tsx`, `frontend/tests/experiment-list-view.test.tsx`, and `frontend/tests/experiment-detail-view.test.tsx`. Backend API logic is implemented in `backend/app/controllers/experiment_controller.py`, validation in `backend/app/validators/experiment_validator.py`, compilation in `backend/app/execution/experiment_compiler.py`, execution in `backend/app/executors/default_experiment_executor.py`, queue service in `backend/app/services/queue_service.py`, Redis/RQ adapter in `backend/app/infrastructure/redis/job_queue.py`, and worker handling in `backend/app/workers/experiment_worker.py`.

| Feature | Relative paths | Integration |
|---|---|---|
| Experiment wizard | `frontend/app/experiments/new/`, `frontend/views/experiment-wizard-view.tsx` | Multi-step UI for basics, dataset range, split, blueprint selection, overrides, review, and submit. |
| Experiment validation | `backend/app/validators/experiment_validator.py` | Checks required fields, BTCUSDT-only scope, date order, split totals, minimum split thresholds, and blueprint accessibility. |
| Experiment persistence | `backend/app/controllers/experiment_controller.py`, `backend/app/repositories/experiment_repository.py` | Stores configuration, status, progress, job id, overrides, and snapshots. |
| Compiler | `backend/app/execution/experiment_compiler.py` | Creates deterministic execution snapshots and stable parameter hashes. |
| Executor | `backend/app/executors/default_experiment_executor.py` | Loads cached BTCUSDT data, applies features/targets/splits, trains/evaluates models, and logs outputs. |
| Queue and worker | `backend/app/services/queue_service.py`, `backend/app/infrastructure/redis/job_queue.py`, `backend/app/workers/experiment_worker.py` | Queues jobs, processes execution asynchronously, updates progress, handles failure and cancellation. |
| Job detail/cancellation | `backend/app/controllers/job_controller.py`, `frontend/app/jobs/`, `frontend/tests/job-detail-view.test.tsx` | Allows owners/staff to inspect and cancel eligible jobs. |

Experiment submission pseudocode:

```text
PROCEDURE SubmitExperiment
    REQUIRE authenticated user
    RECEIVE experiment configuration
    VALIDATE configuration with ExperimentValidator
    LOAD selected approved/accessible blueprint
    PERSIST experiment with Queued status and parameter overrides
    ENQUEUE experiment execution job through QueueService
    STORE returned job_id on experiment
    RETURN experiment id, status, and queue metadata
END PROCEDURE
```

Worker lifecycle pseudocode:

```text
PROCEDURE HandleExperimentJob
    VALIDATE job payload contains experiment_id
    LOAD experiment from database
    SET experiment status to Running
    COMPILE experiment plan
    EXECUTE model training and evaluation
    SAVE generated models and logs
    SET experiment status to Completed
    IF any error occurs THEN
        SET experiment status to Failed with error information
    END IF
END PROCEDURE
```

Required screenshots:

1. Experiment wizard basics step.
2. Dataset range/chart step.
3. Split configuration step.
4. Blueprint selection step.
5. Parameter override step.
6. Review and submit step.
7. Experiment list showing status/search filters.
8. Experiment detail showing configuration, split summary, blueprint summary, progress, and model results.
9. Job detail page showing queue/running/completed state and cancellation control.

Suggested code snippet reference:

- Include create/list/detail/cancel/retry/delete endpoints from `backend/app/controllers/experiment_controller.py`.
- Include compilation logic from `backend/app/execution/experiment_compiler.py`.
- Include worker lifecycle from `backend/app/workers/experiment_worker.py`.
- Include `DefaultExperimentExecutor` execution stages from `backend/app/executors/default_experiment_executor.py`.

## 6.5.7 Models, Rankings, Logs, Downloads, and Favourites Module

The model module presents generated model outputs, ranking information, details, and favourite actions. Backend model APIs are implemented in `backend/app/controllers/model_controller.py`; model persistence is handled by `backend/app/repositories/model_repository.py`; logs and downloadable artefacts are handled by `backend/app/controllers/logs_download_controller.py` and `backend/app/repositories/experiment_log_repository.py`. Frontend model pages are under `frontend/app/models/`, and tests are in `frontend/tests/model-views.test.tsx` and `frontend/tests/favorites-library-view.test.tsx`.

| Feature | Relative paths | Integration |
|---|---|---|
| Model rankings | `backend/app/controllers/model_controller.py`, `frontend/app/models/` | Displays ranked models by metrics for comparison. |
| Model highlights | `backend/app/controllers/model_controller.py` | Provides best/highlight model information. |
| Model detail | `frontend/app/models/[id]/`, `backend/app/controllers/model_controller.py` | Shows parameters, metrics, experiment relationship, and logs. |
| Favourite model | `backend/app/infrastructure/database/orm/favorite_model_orm.py`, `backend/app/repositories/favorite_model_repository.py` | Allows users to save models for later reference. |
| Favourite blueprint | `backend/app/infrastructure/database/orm/favorite_blueprint_orm.py`, `backend/app/repositories/favorite_blueprint_repository.py` | Allows users to save blueprints for reuse. |
| Log download | `backend/app/controllers/logs_download_controller.py` | Exports experiment/model logs and round artefacts. |

Required screenshots:

1. Model ranking/library page.
2. Model detail page with metric cards and parameter information.
3. Favourite models page.
4. Favourite blueprints page.
5. Log download button or exported log result.

Suggested code snippet reference:

- Include model ranking/highlight/detail endpoints from `backend/app/controllers/model_controller.py`.
- Include favourite model/blueprint persistence files under `backend/app/repositories/`.
- Include log download endpoint from `backend/app/controllers/logs_download_controller.py`.

## 6.5.8 Public Hub and Documentation Module

The public hub module provides discovery of approved/public artefacts and public user profiles. Backend public hub APIs are implemented in `backend/app/controllers/public_hub_controller.py`. Frontend public hub pages are under `frontend/app/hub/`, and tests are implemented in `frontend/tests/public-hub-view.test.tsx`. The documentation module is implemented through `backend/app/controllers/documentation_controller.py`, `frontend/app/docs/`, and `frontend/tests/documentation-view.test.tsx`.

| Feature | Relative paths | Integration |
|---|---|---|
| Public hub listing | `frontend/app/hub/`, `backend/app/controllers/public_hub_controller.py` | Shows discoverable approved/public artefacts. |
| Public profile | `backend/app/controllers/public_hub_controller.py` | Shows a user-facing public profile summary. |
| Documentation list/detail | `frontend/app/docs/`, `backend/app/controllers/documentation_controller.py` | Provides user-facing guidance and help content. |
| Search/filter support | `frontend/lib/api/client.ts` | Frontend passes query parameters to backend endpoints. |

Required screenshots:

1. Public hub listing page with filters/search visible.
2. Public profile page.
3. Documentation list page.
4. Documentation detail page.

Suggested code snippet reference:

- Include public hub endpoints from `backend/app/controllers/public_hub_controller.py`.
- Include documentation endpoints from `backend/app/controllers/documentation_controller.py`.

## 6.5.9 Admin Panel, Moderator Panel, and System Management Module

Administrative functions are separated from normal user functions through role-based access control. The admin user management page is implemented under `frontend/app/admin/users/` and tested in `frontend/tests/user-management-view.test.tsx`. Backend user management APIs are implemented in `backend/app/controllers/user_controller.py`. The system management page is implemented under `frontend/app/system/` and tested in `frontend/tests/system-management-view.test.tsx`; backend system APIs are implemented in `backend/app/controllers/system_controller.py`. Moderator blueprint actions are implemented through the blueprint moderation route under `frontend/app/blueprints/moderation/` and backend approval controller.

| Role | Main functions | Relative paths |
|---|---|---|
| User | Dashboard, experiments, blueprints, models, favourites, hub, docs, profile, jobs owned by the user | `frontend/app/dashboard/`, `frontend/app/experiments/`, `frontend/app/blueprints/`, `frontend/app/models/`, `frontend/app/favorites/`, `frontend/app/hub/`, `frontend/app/docs/`, `frontend/app/jobs/` |
| Moderator | User features plus blueprint moderation | `frontend/app/blueprints/moderation/`, `backend/app/controllers/blueprint_approval_controller.py` |
| Admin | User and moderator features plus user management, system settings, queue snapshot, system events, market-data administration | `frontend/app/admin/users/`, `frontend/app/system/`, `backend/app/controllers/user_controller.py`, `backend/app/controllers/system_controller.py`, `backend/app/controllers/market_data_controller.py` |

Required screenshots:

1. Admin user management page showing list/filter/action controls.
2. User detail or audit panel if available.
3. System management page showing queue snapshot and system settings/events.
4. Moderator blueprint queue showing pending submissions.
5. Role-blocked state for a user attempting to access an admin-only route.

Suggested code snippet reference:

- Include selected user management endpoints from `backend/app/controllers/user_controller.py`.
- Include system queue/settings/events endpoints from `backend/app/controllers/system_controller.py`.
- Include route visibility logic from `frontend/lib/routes/nav.ts`.

## 6.5.10 Integration Summary of Core Modules

The implemented modules work together as a single workflow. A user authenticates, uses the blueprint wizard to create or select a reusable blueprint, configures an experiment through the experiment wizard, submits it to the backend, the backend validates and persists the request, the queue service enqueues the job, the worker compiles and executes the experiment, market data is loaded from the BTCUSDT cache, indicators and targets are generated through strategy modules, model results and logs are stored, and the frontend displays the experiment detail, models, rankings, logs, and favourites.

End-to-end workflow pseudocode:

```text
PROCEDURE RunBEEExperimentWorkflow
    User logs in
    User creates or selects approved blueprint
    User configures BTCUSDT dataset range, split, and overrides
    Backend validates experiment request
    Backend persists queued experiment
    QueueService enqueues execution job
    Worker compiles blueprint and experiment snapshots
    Executor refreshes or loads BTCUSDT cache
    Executor applies indicators, target strategy, and split strategy
    Executor trains/evaluates architecture permutations
    Backend stores generated models and logs
    Frontend displays experiment status, metrics, rankings, and downloads
END PROCEDURE
```

Required figure for this subsection:

- A system workflow diagram showing: Login → Blueprint Wizard/Library → Experiment Wizard → Validation → Queue → Worker → Compiler → Executor → BTCUSDT Cache/Indicators/Targets/Splits → Models/Logs → Experiment Detail/Rankings/Favourites/Public Hub.
