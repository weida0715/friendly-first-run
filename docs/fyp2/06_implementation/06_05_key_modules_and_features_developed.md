# 6.5 Key Modules and Features Developed

This section describes the main modules developed in BEE. The system is implemented as a set of connected modules rather than as isolated screens. Each module has a frontend part, a backend API part, and, where needed, a persistence or execution part. The description below follows the implemented source code and includes the screenshots and code snippets that should be added to the final report.

## 6.5.1 User Authentication Module

The authentication module allows users to register, log in, remain authenticated through a server-side session, view the current user, and log out. Registration and login are implemented in `backend/app/controllers/authentication_controller.py`. The frontend login and registration pages are implemented under `frontend/app/(auth)/login/` and `frontend/app/(auth)/register/`. The frontend sends login and registration requests through `frontend/lib/api/client.ts`.

The backend validates the registration payload, checks duplicate username and email values, hashes the password, creates a user with the `User` role, and records an authentication event. Login checks the email and password, rejects disabled accounts, creates a server-side session, and returns a safe user object. The session id is stored in an HTTP-only browser cookie so client-side code does not need to store the password or session details directly.[^auth-controller]

| Feature | Implementation | Relative paths |
|---|---|---|
| Registration | Validates registration payload, rejects duplicates, hashes password, creates `User` account | `backend/app/controllers/authentication_controller.py` lines 95-152 |
| Login | Validates credentials, rejects disabled accounts, creates server-side session | `backend/app/controllers/authentication_controller.py` lines 155-217 |
| Current user lookup | Reads the session and returns user identity, role, and status | `backend/app/controllers/authentication_controller.py` lines 220-255 |
| Logout | Invalidates the active session | `backend/app/controllers/authentication_controller.py` lines 258 onward |
| Frontend integration | Provides `registerUser`, `loginUser`, `logoutUser`, and `getCurrentUser` API functions | `frontend/lib/api/client.ts` |
| Route visibility | Filters visible navigation items by role | `frontend/lib/routes/nav.ts` lines 32-68 |

Authentication pseudocode:

```text
PROCEDURE Login
    RECEIVE email and password
    VALIDATE login payload
    FIND user by email
    IF user does not exist OR password is invalid THEN
        RETURN invalid-credentials error
    END IF
    IF user status is not enabled THEN
        RETURN account-disabled error
    END IF
    CREATE server-side session for the user
    RETURN safe user profile with session cookie
END PROCEDURE
```

Required screenshots:

| Screenshot | What to show |
|---|---|
| Login page | Email field, password field, submit button, and validation area |
| Register page | Name, username, email, password, and account creation action |
| Dashboard after login | Proof that successful login redirects to authenticated application area |
| Restricted page attempt | Normal user blocked from admin or moderator-only page |

Suggested code snippet:

- Include `backend/app/controllers/authentication_controller.py` lines 95-152 for registration.
- Include `backend/app/controllers/authentication_controller.py` lines 155-217 for login.
- Include `frontend/lib/routes/nav.ts` lines 32-68 for role-based navigation.

## 6.5.2 Dashboard Module

The dashboard is the user's starting point after login. It connects the user to experiments, blueprints, models, favourites, public hub, documentation, and administrative pages if the user has the required role. The dashboard also displays BTCUSDT chart information through the shared chart and market-data API.

The dashboard frontend route is implemented under `frontend/app/dashboard/`. Automated frontend tests in `frontend/tests/dashboard-view.test.tsx` check dashboard cards, quick action links, chart interval handling, loading state, and stat fallbacks. Navigation coverage is tested in `frontend/tests/navigation.test.tsx`, including route targets and role-based visibility.

| Feature | Implementation | Relative paths |
|---|---|---|
| Dashboard page | Authenticated landing area for core workflows | `frontend/app/dashboard/`, `frontend/tests/dashboard-view.test.tsx` |
| Quick actions | Links to experiments, blueprints, models, and other main modules | `frontend/views/`, `frontend/components/layout/` |
| BTCUSDT chart area | Uses cached kline data and chart state handling | `frontend/components/charts/`, `frontend/tests/btcusdt-price-chart.test.tsx` |
| Navigation | Shows role-appropriate sidebar and admin links | `frontend/lib/routes/nav.ts` lines 32-68 |

Required screenshots:

| Screenshot | What to show |
|---|---|
| Dashboard overview | Sidebar, top bar, dashboard cards, and quick actions |
| Dashboard BTCUSDT chart | Chart panel with selected interval or empty-state message |
| Dashboard loading state | Loading placeholder if data is not ready |
| Role-aware sidebar | Normal user sidebar compared with moderator or admin sidebar |

## 6.5.3 Blueprint Module

The blueprint module lets users define reusable experiment structures. A blueprint stores metadata, architecture configuration, selected indicators, feature settings, approval state, version, and parent lineage. Users create draft blueprints through the frontend wizard. The backend validates and persists each blueprint. Moderators or administrators can review submitted blueprints.

The backend blueprint creation endpoint validates the payload, normalizes it through the blueprint factory, assigns the current user as owner, and stores the blueprint as a `Draft` with version `1`.[^blueprint-create] Updating a blueprint uses `VersioningService`, which protects reviewed or submitted blueprint records from destructive edits.[^blueprint-update] The approval controller handles request approval, moderation queue listing, approve, reject, and disapprove actions.[^blueprint-approval]

| Feature | Backend implementation | Frontend and tests |
|---|---|---|
| Blueprint wizard | `backend/app/controllers/blueprint_controller.py`, `backend/app/validators/blueprint_validator.py`, `backend/app/factories/blueprint_factory.py` | `frontend/app/blueprints/new/`, `frontend/tests/blueprint-wizard-view.test.tsx` |
| Blueprint detail | `backend/app/controllers/blueprint_controller.py` | `frontend/app/blueprints/[id]/`, `frontend/tests/blueprint-library-detail-moderation.test.tsx` |
| Blueprint library | `backend/app/controllers/blueprints_library_controller.py` | `frontend/app/blueprints/` |
| Favourite blueprint | `backend/app/controllers/blueprint_controller.py`, `backend/app/repositories/favorite_blueprint_repository.py` | `frontend/app/favorites/`, `frontend/tests/favorites-library-view.test.tsx` |
| Approval request | `backend/app/controllers/blueprint_approval_controller.py` lines 30-71 | Blueprint detail action |
| Moderation queue | `backend/app/controllers/blueprint_approval_controller.py` lines 74-100 | `frontend/app/blueprints/moderation/` |
| Approve, reject, disapprove | `backend/app/controllers/blueprint_approval_controller.py` lines 103-175 | `frontend/tests/blueprint-library-detail-moderation.test.tsx` |

Blueprint creation pseudocode:

```text
PROCEDURE CreateBlueprintDraft
    REQUIRE authenticated user
    READ blueprint payload
    VALIDATE payload with BlueprintValidator
    NORMALIZE metadata, architecture, indicators, and features
    CREATE Blueprint with owner id, Draft state, version 1, and timestamps
    SAVE blueprint through UnitOfWork repository
    RETURN blueprint id, version, approval state, and detail path
END PROCEDURE
```

Moderation pseudocode:

```text
PROCEDURE ModerateBlueprint
    REQUIRE moderator or admin role
    LOAD target blueprint
    CHECK that requested transition is valid for current approval state
    UPDATE approval state to Approved, Rejected, or Disapproved
    IF blueprint is disapproved THEN
        CREATE a new draft version linked to the old blueprint
    END IF
    RETURN updated approval state and draft id if created
END PROCEDURE
```

Required screenshots:

| Screenshot | What to show |
|---|---|
| Blueprint wizard basics | Name, description, and basic metadata fields |
| Blueprint architecture step | Selected architecture and parameter inputs |
| Blueprint indicator step | Indicator choices, parameter constraints, and removable tokens where used |
| Blueprint review step | Final summary before save or submission |
| Blueprint library | Owned and favourited blueprint tabs |
| Blueprint detail | Metadata, architecture, indicators, version, lineage, and favourite state |
| Moderation panel | Pending blueprint queue and approve/reject/disapprove buttons |

Suggested code snippet:

- Include `backend/app/controllers/blueprint_controller.py` lines 201-251 for draft creation.
- Include `backend/app/controllers/blueprint_controller.py` lines 254-294 for update and versioning flow.
- Include `backend/app/controllers/blueprint_approval_controller.py` lines 30-175 for approval and moderation.

## 6.5.4 Blueprint Architecture and Indicator Module

Blueprint architecture and indicators define what the experiment will compute. The architecture decides the model family and its parameters. Indicators define derived features built from the BTCUSDT candle data. The indicator factory exposes custom indicators and TA-Lib-style indicators to the blueprint metadata API. The factory lists metadata such as display names, parameter schemas, constraints, default values, output columns, and warm-up periods.[^indicator-factory]

| Area | Implemented examples or behaviour | Relative paths |
|---|---|---|
| Architecture implementations | Logistic regressor and ridge classifier architecture classes | `backend/app/architectures/logistic_regressor_architecture.py`, `backend/app/architectures/ridge_classifier_architecture.py` |
| Architecture factory | Selects and describes available architectures | `backend/app/factories/architecture_factory.py` |
| Custom indicators | VWAP, Ichimoku cloud, quantile flag, rolling volatility, Wilder RSI, price range position, trend strength, time features, SMA crossover | `backend/app/strategies/indicators/`, `backend/app/factories/indicator_factory.py` |
| Indicator metadata | Exposes schemas, constraints, defaults, output columns, warm-up periods | `backend/app/factories/indicator_factory.py` lines 20-104 |
| Metadata endpoint | Sends architecture, indicator, and target metadata to the frontend wizard | `backend/app/controllers/blueprint_controller.py` lines 190-196 |

Required screenshots:

| Screenshot | What to show |
|---|---|
| Architecture selection | Available architecture choices and parameter inputs |
| Indicator selection | Indicator list, schema-driven fields, and constraints |
| Indicator review summary | Selected indicators and output feature summary |

Suggested code snippet:

- Include `backend/app/factories/indicator_factory.py` lines 20-66 to show custom indicator metadata assembly.
- Include `backend/app/factories/indicator_factory.py` lines 69-104 to show fallback metadata and validation for supported indicators.

## 6.5.5 Target and Split Module

The target module defines the label the model tries to predict. The split module divides the candle dataset into training, validation, and test parts. BEE supports target strategy metadata through `backend/app/factories/target_strategy_factory.py`, and concrete target strategies under `backend/app/strategies/targets/`. The target factory discovers available target strategies and returns their parameter schema, constraints, default values, output column, and binary label rule.[^target-factory]

The split module supports time-based sequential splitting and seeded random splitting. Time-based splitting keeps chronological order and creates contiguous train, validation, and test windows.[^split-time] Random splitting shuffles rows with a seed, then sorts each partition by timestamp so results can be reproduced while still testing random partitions.[^split-random]

| Strategy type | Implementation | Relative paths |
|---|---|---|
| Target metadata | Discovers strategies and returns schema, constraints, defaults, and label rule | `backend/app/factories/target_strategy_factory.py` lines 15-65 |
| Forward return target | Generates binary target from future close return and threshold | `backend/app/strategies/targets/forward_return_target_strategy.py` lines 10-27 |
| Time-based split | Creates chronological train/validation/test partitions | `backend/app/strategies/splits/time_based_sequential_split_strategy.py` lines 13-25 |
| Random split | Creates seeded random partitions and preserves permutation metadata | `backend/app/strategies/splits/random_split_strategy.py` lines 13-36 |
| Target preview | Lets the frontend preview BTCUSDT target output and statistics before final submission | `backend/app/controllers/market_data_controller.py` lines 516 onward |

Target and split pseudocode:

```text
PROCEDURE PrepareLearningData
    LOAD cached BTCUSDT candles for selected range
    APPLY selected indicators to generate features
    APPLY selected target strategy to generate target labels
    SELECT split strategy from experiment configuration
    SPLIT labelled dataset into train, validation, and test sets
    RETURN split result to the executor
END PROCEDURE
```

Required screenshots:

| Screenshot | What to show |
|---|---|
| Experiment split step | Train, validation, and test split controls |
| Target selection step | Target strategy dropdown and parameter fields |
| Target preview | Preview statistics, label counts, or validation message |
| Review step | Final target and split summary before experiment submission |

Suggested code snippet:

- Include `backend/app/factories/target_strategy_factory.py` lines 15-65.
- Include `backend/app/strategies/splits/time_based_sequential_split_strategy.py` lines 13-25.
- Include `backend/app/strategies/splits/random_split_strategy.py` lines 13-36.
- Include `backend/app/strategies/targets/forward_return_target_strategy.py` lines 10-27.

## 6.5.6 Data Ingestion and BTCUSDT Market Data Module

The market-data module supports the dashboard, experiment wizard, target preview, and experiment execution. BTCUSDT candle data is stored in PostgreSQL through the `BTCUSDTKline` table. The market-data controller serves cached candles to the frontend and validates chart request parameters. The kline endpoint checks the interval and limit, validates the date range, reads cached rows, optionally aggregates rows for supported intervals, and returns OHLCV values in a frontend-friendly structure.[^market-klines]

| Feature | Implementation | Relative paths |
|---|---|---|
| Binance retrieval | External BTCUSDT kline client | `backend/app/infrastructure/binance/kline_client.py` |
| Cache service | Normalizes, upserts, and summarizes market-data refresh results | `backend/app/services/market_data_service.py` |
| Cache repository | Reads latest chunks, ranges, timestamp bounds, and cached rows | `backend/app/repositories/market_data_repository.py` |
| Kline API | Serves cached OHLCV data to charts | `backend/app/controllers/market_data_controller.py` lines 424-513 |
| Target preview API | Builds preview rows and target statistics | `backend/app/controllers/market_data_controller.py` lines 516 onward |
| Admin controls | Catch-up, status, stop, and clear actions | `backend/app/controllers/market_data_controller.py` |
| CLI scripts | Initial ingest, refresh, cleanup, and worker commands | `backend/app/scripts/` |

Market-data refresh pseudocode:

```text
PROCEDURE RefreshBTCUSDTCache
    VALIDATE supported symbol and interval
    FETCH kline batches from Binance connector
    NORMALIZE each row into timestamp, open, high, low, close, and volume
    UPSERT records into BTCUSDTKline by timestamp
    COUNT inserted and updated rows
    RETURN refresh summary
END PROCEDURE
```

Required screenshots:

| Screenshot | What to show |
|---|---|
| Dashboard chart | BTCUSDT candles loaded from cache |
| Experiment dataset step | Date/time range and chart preview |
| Market-data admin controls | Catch-up, status, stop, and clear controls in system page |
| Ingestion terminal output | Fetched, inserted, and updated candle summary |
| Empty cache state | Chart or API state when cached data is unavailable |

Suggested code snippet:

- Include `backend/app/controllers/market_data_controller.py` lines 424-513 for the cached kline endpoint.
- Include the market-data service upsert logic from `backend/app/services/market_data_service.py` after confirming the exact line range in the final report draft.

## 6.5.7 Experiment Wizard, Compiler, Executor, Queue, and Worker Module

The experiment module is the core workflow of BEE. A user configures an experiment through the frontend wizard. The backend validates the request, compiles an immutable execution plan, persists the experiment, and enqueues it for execution. The worker then loads the experiment, runs the default executor, updates progress, and marks the experiment as completed or failed.

The experiment creation endpoint requires authentication, checks queue limits, derives a date range when needed, validates the payload, loads the selected blueprint, compiles the plan, clamps requested permutations to the runtime limit, and creates the experiment record.[^experiment-create] The list endpoint returns the current user's experiments and normalizes active statuses with queue metadata.[^experiment-list] The detail endpoint enforces ownership and loads the blueprint, models, and logs for the selected experiment.[^experiment-detail]

The compiler creates two important snapshots: a blueprint snapshot and an experiment snapshot. It merges blueprint defaults with experiment overrides, builds architecture, indicator, target, and split parameters, creates parameter permutations, assigns stable parameter hashes, and supports deterministic sampling with a seed.[^compiler]

The executor loads configuration and cached market data, updates progress, and fails clearly if there are not enough persisted BTCUSDT candles for the selected range.[^executor] The worker validates the queued payload, marks the experiment as running, invokes the executor, marks completion, and marks failure if an exception occurs.[^worker]

| Feature | Implementation | Relative paths |
|---|---|---|
| Experiment wizard | Multi-step UI for basics, dataset, split, blueprint, target, overrides, review, and submit | `frontend/app/experiments/new/`, `frontend/tests/experiment-wizard-view.test.tsx` |
| Validation | Required fields, BTCUSDT scope, date range, split rules, blueprint access, and overrides | `backend/app/validators/experiment_validator.py`, `backend/tests/test_experiment_validator.py` |
| Create/list/detail APIs | Experiment persistence, ownership, status, logs, and models | `backend/app/controllers/experiment_controller.py` |
| Compiler | Snapshot, override merge, permutations, hashes, deterministic sampling | `backend/app/execution/experiment_compiler.py` |
| Executor | Data loading, strategy execution, progress updates, model/log output | `backend/app/executors/default_experiment_executor.py` |
| Queue service | Backend-agnostic queue orchestration | `backend/app/services/queue_service.py` lines 28-120 |
| Redis adapter | RQ queue implementation, priorities, job mapping, retries | `backend/app/infrastructure/redis/job_queue.py` lines 27-120 |
| Worker | Background execution and state transitions | `backend/app/workers/experiment_worker.py` lines 55-165 |
| Job pages | Job list, detail, and cancellation | `frontend/app/jobs/`, `backend/app/controllers/job_controller.py` lines 38-190 |

Experiment submission pseudocode:

```text
PROCEDURE SubmitExperiment
    REQUIRE authenticated user
    READ experiment payload from frontend wizard
    CHECK active queue limit
    VALIDATE experiment payload against blueprint access and split rules
    LOAD selected blueprint
    COMPILE blueprint and experiment snapshots
    CREATE experiment with Queued status, job metadata, seed, and snapshots
    ENQUEUE experiment execution job
    RETURN experiment id, status, detail path, and queue information
END PROCEDURE
```

Worker lifecycle pseudocode:

```text
PROCEDURE HandleExperimentJob
    VALIDATE queued payload and experiment id
    MARK experiment as Running
    LOAD experiment from repository
    RUN DefaultExperimentExecutor with progress callback
    MARK experiment as Completed when executor succeeds
    IF executor raises an error THEN
        MARK experiment as Failed with short error stage
        RAISE error for worker visibility
    END IF
END PROCEDURE
```

Required screenshots:

| Screenshot | What to show |
|---|---|
| Experiment wizard basics | Name, description, and initial setup fields |
| Dataset step | BTCUSDT range, cached bounds, and chart preview |
| Split step | Train, validation, and test split configuration |
| Blueprint selection step | Approved blueprint options and selected blueprint preview |
| Target and override step | Target strategy, target parameters, architecture and indicator overrides |
| Review step | Final configuration before submission |
| Experiment list | Status, progress, search/filter, and detail link |
| Experiment detail | Configuration, split summary, blueprint summary, logs, models, and downloads |
| Job detail | Queue state, worker state, timestamps, error snippet, and cancellation action |

Suggested code snippet:

- Include `backend/app/controllers/experiment_controller.py` lines 243-330 for experiment creation.
- Include `backend/app/execution/experiment_compiler.py` lines 34-132 for compilation.
- Include `backend/app/executors/default_experiment_executor.py` lines 68-170 for execution configuration and data loading.
- Include `backend/app/workers/experiment_worker.py` lines 55-165 for worker state transitions.

## 6.5.8 Models, Logs, and Favourites Module

The models module displays results produced by completed experiments. The backend supports model highlights, rankings, owned model library, favourited model library, detail, favourite, and unfavourite actions. It also merges model records with experiment, blueprint, owner, and log metrics so the frontend can show meaningful result summaries.[^model-controller]

| Feature | Implementation | Relative paths |
|---|---|---|
| Model highlights | Top accessible models by direct and log-based metrics | `backend/app/controllers/model_controller.py` lines 167-220 |
| Model rankings | Sorted, filtered, paginated model list | `backend/app/controllers/model_controller.py` lines 223-268 |
| Owned model library | Models generated by the user's experiments | `backend/app/controllers/model_controller.py` lines 271-284 |
| Favourited model library | Saved models for the current user | `backend/app/controllers/model_controller.py` lines 287-305 |
| Model detail | Metrics, nested parameters, experiment and blueprint context, logs | `backend/app/controllers/model_controller.py` lines 308-330 |
| Favourite model | Save or remove useful model outputs | `backend/app/controllers/model_controller.py` lines 333-360 onward |
| Experiment/model logs | Downloadable experiment and model artefacts | `backend/app/controllers/logs_download_controller.py` |
| Frontend pages | Ranking list, model detail, favourite library | `frontend/app/models/`, `frontend/app/favorites/`, `frontend/tests/model-views.test.tsx` |

Required screenshots:

| Screenshot | What to show |
|---|---|
| Model rankings | Sortable model table, filters, and metric columns |
| Model detail | Metrics, parameter hash, nested parameters, experiment context, and logs |
| Favourited models | Saved model list and unfavourite action |
| Favourited blueprints | Saved blueprint list and filter/search action |
| Experiment logs/download | Download action or log output from experiment detail |

Suggested code snippet:

- Include `backend/app/controllers/model_controller.py` lines 167-268 for highlights and rankings.
- Include `backend/app/controllers/model_controller.py` lines 308-360 for detail and favourite handling.

## 6.5.9 Public Hub and Documentation Module

The public hub supports discovery of enabled users, public experiments, public models, and approved blueprints. The controller supports tab selection, search, owner filtering, status filtering, date filtering, and metric sorting depending on the active tab.[^public-hub] The public profile endpoint returns visible artefacts for an enabled user. The documentation controller provides searchable documentation list and detail pages.[^documentation]

| Feature | Implementation | Relative paths |
|---|---|---|
| Public hub users tab | Lists enabled users | `backend/app/controllers/public_hub_controller.py` lines 121-145 |
| Public hub experiments tab | Lists public experiment summaries | `backend/app/controllers/public_hub_controller.py` lines 147-161 |
| Public hub models tab | Lists public model results sorted by metric | `backend/app/controllers/public_hub_controller.py` lines 163-175 |
| Public hub blueprints tab | Lists approved blueprints | `backend/app/controllers/public_hub_controller.py` lines 177-189 |
| Public profile | Shows public artefacts for an enabled user | `backend/app/controllers/public_hub_controller.py` lines 194-220 onward |
| Documentation list/detail | Searches documentation and returns selected documentation body | `backend/app/controllers/documentation_controller.py` lines 55-70 |
| Frontend pages | Public hub and documentation pages | `frontend/app/hub/`, `frontend/app/docs/`, `frontend/tests/public-hub-view.test.tsx`, `frontend/tests/documentation-view.test.tsx` |

Required screenshots:

| Screenshot | What to show |
|---|---|
| Public hub users tab | User list and search field |
| Public hub models tab | Public model results and metric sorting |
| Public hub blueprints tab | Approved blueprint discovery |
| Public profile | User profile with public artefacts |
| Documentation list | Searchable documentation list |
| Documentation detail | Full selected documentation page |

## 6.5.10 Admin Panel, Moderator Panel, System Management, and Jobs Module

The administration and moderation modules provide staff-only functionality. The `Users` page is visible to moderators and admins, but role-specific backend rules still control what actions each staff role can perform. The user controller supports listing users, viewing the current profile, viewing a profile, reading audit history, creating users, updating status, resetting password, updating role, updating username, and deleting users.[^user-controller]

The system controller supports backend health, admin-only active queue snapshot, system settings, system events, and system event download.[^system-controller] The jobs controller supports job list, job detail, and cancellation while enforcing owner or staff access.[^job-controller]

| Staff module | Functionality | Relative paths |
|---|---|---|
| User management | List, create, update status, reset password, update role, update username, delete user, view audit | `frontend/app/admin/users/`, `backend/app/controllers/user_controller.py`, `frontend/tests/user-management-view.test.tsx` |
| Moderator panel | View pending blueprints and moderate submissions | `frontend/app/blueprints/moderation/`, `backend/app/controllers/blueprint_approval_controller.py` |
| System management | Queue snapshot, system settings, system events, market-data controls | `frontend/app/system/`, `backend/app/controllers/system_controller.py`, `backend/app/controllers/market_data_controller.py` |
| Jobs | Job list, job detail, queue position, worker state, cancellation | `frontend/app/jobs/`, `backend/app/controllers/job_controller.py` |
| Role-based navigation | Shows staff pages only to eligible roles | `frontend/lib/routes/nav.ts` lines 32-68 |

Required screenshots:

| Screenshot | What to show |
|---|---|
| Admin user management | User table, filters, role/status actions, and audit entries |
| Moderator user management | Reduced actions for moderator role if applicable |
| Blueprint moderation page | Pending blueprint queue and action buttons |
| System page | Queue cards, active jobs, settings, event terminal, and market-data controls |
| Job list | Active jobs visible to owner or staff |
| Job detail | Job state, queue position, worker information, timestamps, error snippet, and cancel button |
| Access denied state | Normal user blocked from staff-only pages |

Suggested code snippet:

- Include `backend/app/controllers/user_controller.py` lines 113-380 for user management.
- Include `backend/app/controllers/system_controller.py` lines 50-177 for health, queue, settings, and events.
- Include `backend/app/controllers/job_controller.py` lines 38-190 for job list and detail.

## 6.5.11 End-to-End Module Flow

The full implementation can be understood as one continuous workflow. A user logs in, creates or selects a blueprint, configures an experiment, submits it, waits for the worker to process it, and then reviews generated models and logs. Staff roles support the same system by moderating blueprints and managing operational settings.

```text
PROCEDURE RunBEEWorkflow
    User logs in
    User creates a blueprint or selects an approved blueprint
    User configures experiment dataset, split, target, and overrides
    Backend validates the experiment request
    Backend compiles the selected blueprint and experiment settings
    Backend stores the experiment and enqueues a job
    Worker loads cached BTCUSDT data and executes the experiment
    Executor stores model and log outputs
    User reviews experiment detail, model rankings, logs, and favourites
    Moderator reviews blueprint submissions when needed
    Admin monitors users, queue state, settings, events, and market-data cache
END PROCEDURE
```

Required final figure:

| Figure | What to include |
|---|---|
| Core workflow diagram | Login -> Blueprint Wizard/Library -> Experiment Wizard -> Backend Validation -> Compiler -> Queue -> Worker -> Executor -> BTCUSDT Cache and Strategies -> Models/Logs -> Model Rankings/Favourites/Public Hub |

[^auth-controller]: Registration, login, current-user, and logout routes are implemented in `backend/app/controllers/authentication_controller.py` lines 95-260.
[^blueprint-create]: Draft blueprint creation is implemented in `backend/app/controllers/blueprint_controller.py` lines 201-251.
[^blueprint-update]: Blueprint update and versioning flow is implemented in `backend/app/controllers/blueprint_controller.py` lines 254-294.
[^blueprint-approval]: Approval request, moderation queue, and moderation transitions are implemented in `backend/app/controllers/blueprint_approval_controller.py` lines 30-175.
[^indicator-factory]: Indicator metadata and validation are implemented in `backend/app/factories/indicator_factory.py` lines 20-104.
[^target-factory]: Target strategy discovery, metadata, and creation are implemented in `backend/app/factories/target_strategy_factory.py` lines 15-65.
[^split-time]: Time-based sequential split is implemented in `backend/app/strategies/splits/time_based_sequential_split_strategy.py` lines 13-25.
[^split-random]: Seeded random split is implemented in `backend/app/strategies/splits/random_split_strategy.py` lines 13-36.
[^market-klines]: Cached BTCUSDT kline API is implemented in `backend/app/controllers/market_data_controller.py` lines 424-513.
[^experiment-create]: Experiment creation is implemented in `backend/app/controllers/experiment_controller.py` lines 243-330.
[^experiment-list]: Experiment listing is implemented in `backend/app/controllers/experiment_controller.py` lines 420-475.
[^experiment-detail]: Experiment detail loading starts in `backend/app/controllers/experiment_controller.py` lines 478-520.
[^compiler]: Experiment compilation is implemented in `backend/app/execution/experiment_compiler.py` lines 34-132.
[^executor]: Executor progress, configuration loading, and cached data loading are implemented in `backend/app/executors/default_experiment_executor.py` lines 68-170.
[^worker]: Worker state transitions are implemented in `backend/app/workers/experiment_worker.py` lines 55-165.
[^model-controller]: Model highlights, rankings, libraries, detail, and favourite routes are implemented in `backend/app/controllers/model_controller.py` lines 167-360.
[^public-hub]: Public hub listing is implemented in `backend/app/controllers/public_hub_controller.py` lines 121-220.
[^documentation]: Documentation list and detail routes are implemented in `backend/app/controllers/documentation_controller.py` lines 55-70.
[^user-controller]: User management routes are implemented in `backend/app/controllers/user_controller.py` lines 113-380.
[^system-controller]: Health, active queue, settings, events, and event download routes are implemented in `backend/app/controllers/system_controller.py` lines 50-177.
[^job-controller]: Job list and detail routes are implemented in `backend/app/controllers/job_controller.py` lines 38-190.
