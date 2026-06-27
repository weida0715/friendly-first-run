# 6.5 Key Modules and Features Developed

This section describes the major modules and features implemented in BEE. Each module is explained using its functionality, source-code paths, integration points, pseudocode, required tables, and screenshot guidance. The report should show at least one screenshot for every user-facing feature described here. Where code snippets are needed, the report should include short screenshots of the referenced source files rather than long pasted source blocks.

## 6.5.1 User authentication module

The authentication module allows users to register, log in, load the current session, and log out. It protects private pages and ensures that backend endpoints can identify the current user. Authentication is implemented on both backend and frontend.

| Part | Source-code path | Role |
|---|---|---|
| Auth controller | `backend/app/controllers/authentication_controller.py` | Registers `/api/auth/csrf`, `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, and `/api/auth/logout` |
| Password hashing | `backend/app/services/password_service.py` | Hashes and verifies user passwords |
| Session management | `backend/app/services/session_service.py` | Creates, loads, and deletes server-side sessions |
| User repository | `backend/app/repositories/user_repository.py` | Loads and stores user records |
| Frontend auth state | `frontend/lib/auth/AuthProvider.tsx` or auth library files under `frontend/lib/auth/` | Stores current user state and exposes refresh/login/logout behavior |
| Route guards | `frontend/components/auth/RequireAuth.tsx`, `frontend/components/auth/RequireRole.tsx` | Protect authenticated and role-restricted frontend pages |
| Login/registration UI | `frontend/views/LoginView.tsx`, `frontend/views/RegistrationView.tsx` | Presents forms and validation feedback |

Pseudocode:

```text
User submits login form
  -> frontend validates required email/password fields
  -> frontend sends POST /api/auth/login with CSRF token
  -> backend finds user by email
  -> password service verifies password hash
  -> backend rejects disabled or invalid accounts
  -> session service creates server-side session
  -> backend sets session cookie and returns safe user payload
  -> frontend refreshes auth state and redirects to dashboard
```

Screenshots required:

| Screenshot | Page | Details to show |
|---|---|---|
| Login page | `/login` | Email/password fields, submit button, validation message |
| Registration page | `/register` | Name, username, email, password fields and validation |
| Authenticated dashboard redirect | `/dashboard` | User can access dashboard after login |
| Unauthorized guard | Open private route while logged out | Redirect or blocked access state |

Code snippets to include:

| File | Lines / section | Purpose |
|---|---|---|
| `backend/app/controllers/authentication_controller.py` | Registration and login route functions | Show credential validation, password hashing, and session creation |
| `backend/app/services/session_service.py` | Session create/load/delete methods | Show server-side session procedure |
| `frontend/views/LoginView.tsx` | Submit handler | Show frontend form-to-API flow |
| `frontend/components/auth/RequireAuth.tsx` | Main guard body | Show frontend route protection |

## 6.5.2 Role-based access control, admin panel, and moderator panel

RBAC separates users into normal users, moderators, and administrators. Normal users can use the research workflow. Moderators can access moderation functions. Administrators can access system management and user-management actions.

| Role | Main access | Restricted areas |
|---|---|---|
| User | Dashboard, experiments, blueprints, models, favourites, public hub, documentation, jobs, profile | User management, system management, privileged staff actions |
| Moderator | User access plus blueprint moderation and staff-level user management where allowed | Admin-only system settings and highest-risk administrative controls |
| Admin | Full access including system queue, settings, events, market-data admin controls, and user lifecycle management | None within implemented role model |

Source-code evidence:

| Feature | Source-code path |
|---|---|
| RBAC service | `backend/app/services/access_control_service.py` |
| Shared backend staff guard | `backend/app/controllers/_access.py` |
| User management API | `backend/app/controllers/user_controller.py` |
| System management API | `backend/app/controllers/system_controller.py` |
| Frontend user management page | `frontend/app/admin/users/page.tsx`, `frontend/views/UserManagementView.tsx` |
| Frontend system page | `frontend/app/system/page.tsx`, `frontend/views/SystemManagementView.tsx` |
| Moderator blueprint queue | `frontend/app/blueprints/moderation/page.tsx`, `frontend/views/BlueprintModerationView.tsx` |

Pseudocode:

```text
Protected staff request arrives
  -> access control loads current session from cookie
  -> user repository loads current user
  -> service compares user role against required role
  -> if insufficient role, backend returns 403
  -> if sufficient role, controller executes staff action
```

Screenshots required:

| Screenshot | Page | Details to show |
|---|---|---|
| User management | `/admin/users` | User table, role/status controls, audit area |
| System management | `/system` | Queue snapshot, system settings/events, market-data admin controls |
| Blueprint moderation | `/blueprints/moderation` | Pending blueprint queue and approve/reject/disapprove buttons |
| Role denial state | Access admin page as normal user | Redirect or unauthorized state |

## 6.5.3 Dashboard module

The dashboard provides the first authenticated overview of the system. It displays summary cards, quick actions, and BTCUSDT market chart information. The dashboard connects the user to experiment creation, blueprint creation, model review, and data/chart context.

| Part | Source-code path | Role |
|---|---|---|
| Route | `frontend/app/dashboard/page.tsx` | Authenticated dashboard entry |
| View | `frontend/views/DashboardView.tsx` | Renders dashboard cards, quick actions, and chart state |
| Chart component | `frontend/components/charts/BTCUSDTPriceChart.tsx` | Displays candlestick data |
| Chart hook | `frontend/components/charts/useBTCUSDTChartData.ts` | Loads market-data chart API |
| Market-data backend | `backend/app/controllers/market_data_controller.py` | Provides `/api/market-data/btcusdt/klines` |

Pseudocode:

```text
Dashboard loads
  -> RequireAuth checks current user
  -> DashboardView renders summary cards and quick action links
  -> chart hook requests BTCUSDT candles from backend
  -> backend reads cache-backed candles from repository
  -> chart displays candlestick data or loading/empty/error state
```

Screenshots required:

| Screenshot | Details |
|---|---|
| Dashboard overview | Summary cards, quick actions, page header |
| BTCUSDT chart | Candlestick chart with selected interval/loading state |
| Error or empty chart state | Show how data-unavailable cases are presented |

## 6.5.4 Blueprint architecture and blueprint workflow

Blueprints define reusable experiment designs. A blueprint stores model architecture, indicator selection, feature configuration, parameter constraints, approval state, version, and lineage. The workflow includes creating drafts, validating them, reviewing details, favouriting, requesting approval, and moderator/admin review.

| Feature | Source-code paths |
|---|---|
| Blueprint domain model | `backend/app/domain/models/blueprint.py` |
| Blueprint controller | `backend/app/controllers/blueprint_controller.py` |
| Blueprint library controller | `backend/app/controllers/blueprints_library_controller.py` |
| Approval workflow | `backend/app/controllers/blueprint_approval_controller.py` |
| Blueprint validation | `backend/app/validators/blueprint_validator.py` |
| Versioning | `backend/app/services/versioning_service.py` |
| Architecture factory | `backend/app/factories/architecture_factory.py` |
| Indicator factory | `backend/app/factories/indicator_factory.py` |
| Frontend library/detail/wizard/moderation | `frontend/views/BlueprintsLibraryView.tsx`, `frontend/views/BlueprintDetailView.tsx`, `frontend/views/BlueprintWizardView.tsx`, `frontend/views/BlueprintModerationView.tsx` |

Blueprint workflow table:

| Step | User action | Backend behavior | Result |
|---|---|---|---|
| Create draft | User fills blueprint wizard | Controller validates metadata, architecture, and indicators | Draft blueprint is persisted |
| Edit draft | Owner edits unsubmitted draft | Versioning service allows in-place update when never submitted | Draft remains editable |
| Request approval | Owner requests review | Approval state moves to pending | Moderators can review |
| Moderate | Moderator/Admin approves, rejects, or disapproves | Approval controller checks staff role and valid transition | Blueprint visibility changes |
| Favourite | User favourites accessible blueprint | Favourite repository stores link | Blueprint appears in favourites library |
| Use in experiment | User selects approved blueprint in experiment wizard | Experiment controller validates blueprint accessibility | Blueprint becomes part of experiment configuration |

Pseudocode:

```text
User creates blueprint
  -> frontend wizard collects basics, reference architecture, indicators, review data
  -> frontend sends blueprint payload to backend
  -> backend validates required fields and constraints
  -> backend persists draft blueprint for owner
  -> detail page displays metadata, architecture, indicators, version, lineage, and approval state
  -> owner may request approval
  -> moderator/admin approves or rejects through moderation queue
```

Screenshots required:

| Screenshot | Page | Details to show |
|---|---|---|
| Blueprint library | `/blueprints` | Owned and favourited tabs |
| Blueprint wizard basics | `/blueprints/new` | Name, description, visibility fields |
| Blueprint wizard architecture | `/blueprints/new` | Architecture selection and parameter constraints |
| Blueprint wizard indicators | `/blueprints/new` | Indicators and parameter inputs |
| Blueprint detail | `/blueprints/[id]` | Metadata, architecture, indicators, approval state, version/lineage, favourite button |
| Moderation queue | `/blueprints/moderation` | Pending items and staff actions |

Code snippets to include:

| File | Section | Purpose |
|---|---|---|
| `backend/app/validators/blueprint_validator.py` | Main validation rules | Show how invalid blueprint payloads are rejected |
| `backend/app/controllers/blueprint_controller.py` | Create/update/favourite sections | Show persistence and favourite behavior |
| `backend/app/controllers/blueprint_approval_controller.py` | Approval transition functions | Show moderation state changes |
| `backend/app/services/versioning_service.py` | Version-copy logic | Show immutable versioning behavior |

## 6.5.5 Indicators and feature engineering module

Indicators convert raw BTCUSDT candles into model features. The implementation supports custom indicators, TA-Lib-style indicator strategies, and output scaling. These indicators are selected through blueprint architecture and then applied during experiment execution.

| Indicator module | Source-code path | Purpose |
|---|---|---|
| Base indicator contract | `backend/app/strategies/indicators/base.py` | Common interface for indicator execution |
| Custom indicator strategy | `backend/app/strategies/indicators/custom_indicator_strategy.py` | Wraps project-defined custom indicators |
| TA-Lib indicator strategy | `backend/app/strategies/indicators/talib_indicator_strategy.py` | Applies technical analysis indicators through registry metadata |
| Indicator factory | `backend/app/factories/indicator_factory.py` | Builds indicator strategies from blueprint definitions |
| TA-Lib registry | `backend/app/factories/talib_registry.py` | Provides supported indicator metadata |
| Custom indicators | `backend/app/strategies/indicators/ichimoku_cloud.py`, `price_range_position.py`, `quantile_flag.py`, `rolling_volatility.py`, `sma_crossover.py`, `time_features.py`, `trend_strength.py`, `vwap.py`, `wilder_rsi.py` | Feature transformations used in experiments |
| Feature scaling | `backend/app/execution/feature_scaler.py`, `backend/app/strategies/scaling_strategy.py` | Scales generated features where configured |

Pseudocode:

```text
Experiment executor loads market candles
  -> blueprint executor factory reads compiled blueprint snapshot
  -> indicator factory builds selected indicator strategies
  -> each indicator strategy adds feature columns to the working frame
  -> optional output scalers transform selected feature columns
  -> target strategy creates target column
  -> split strategy divides train/validation/test frames
  -> architecture strategy trains model on generated features
```

Screenshots required:

| Screenshot | Page | Details to show |
|---|---|---|
| Blueprint indicator step | `/blueprints/new` | Indicator names, parameters, output scaler options |
| Experiment overrides | `/experiments/new` | Indicator parameter override controls |
| Model detail | `/models/[id]` or experiment model popup | Effective parameters and indicator-related metadata |

## 6.5.6 Market data ingestion and charting module

The market-data module fetches BTCUSDT candles from Binance, normalizes rows, stores them in the local database cache, exposes chart-ready klines, and provides admin maintenance controls.

| Feature | Source-code path |
|---|---|
| Binance client | `backend/app/infrastructure/binance/kline_client.py` |
| Market data service | `backend/app/services/market_data_service.py` |
| Market data repository | `backend/app/repositories/market_data_repository.py` |
| Market data controller | `backend/app/controllers/market_data_controller.py` |
| Initial ingestion script | `backend/app/scripts/ingest_btcusdt_klines.py` |
| Incremental refresh script | `backend/app/scripts/refresh_btcusdt_klines.py` |
| Shared CLI helpers | `backend/app/scripts/_market_data_cli.py` |
| Frontend chart component | `frontend/components/charts/BTCUSDTPriceChart.tsx` |
| Chart data hook | `frontend/components/charts/useBTCUSDTChartData.ts` |

Pseudocode:

```text
Refresh market cache
  -> validate symbol BTCUSDT and interval
  -> request paginated kline windows from Binance client
  -> normalize each candle into domain format
  -> upsert candles by timestamp into BTCUSDTKline table
  -> return inserted/updated/fetched summary
  -> chart and experiment execution read from local cache
```

Screenshots required:

| Screenshot | Page | Details to show |
|---|---|---|
| Dashboard chart | `/dashboard` | BTCUSDT chart loaded from cache |
| Experiment wizard dataset step | `/experiments/new` | Dataset range and chart preview |
| Experiment detail chart | `/experiments/[id]` | Experiment-specific market-data view |
| System market-data admin | `/system` | Catch-up/start/status/stop/delete cache controls if visible |

## 6.5.7 Experiment creation, target, split, compiler, and executor module

The experiment module is the core research workflow. It allows users to define experiment basics, choose BTCUSDT interval/range, configure split strategy, select a blueprint, override parameters, preview target behavior, review the plan, and submit it for queued execution.

| Submodule | Source-code path | Responsibility |
|---|---|---|
| Experiment controller | `backend/app/controllers/experiment_controller.py` | Create/list/detail/cancel/retry experiments and expose blueprint options |
| Experiment validator | `backend/app/validators/experiment_validator.py` | Validates symbol, interval, dates, splits, blueprint accessibility, overrides |
| Experiment compiler | `backend/app/execution/experiment_compiler.py` | Builds immutable blueprint and experiment snapshots, cartesian parameter permutations, hashes |
| Default executor | `backend/app/executors/default_experiment_executor.py` | Executes compiled experiment plan |
| Split strategies | `backend/app/strategies/splits/random_split_strategy.py`, `backend/app/strategies/splits/time_based_sequential_split_strategy.py` | Divides data into train/validation/test sets |
| Target strategies | `backend/app/strategies/targets/*.py` | Generates prediction targets such as forward return and candle direction |
| Architecture strategies | `backend/app/architectures/logistic_regressor_architecture.py`, `backend/app/architectures/ridge_classifier_architecture.py` | Train model candidates |
| Metrics strategies | `backend/app/strategies/metrics/*.py` | Computes classification and continuous metrics |
| Trading/backtest strategy | `backend/app/strategies/trading/long_only_single_position_strategy.py` | Converts predictions into simulated trading outcomes |
| Experiment wizard UI | `frontend/views/ExperimentWizardView.tsx` | Multi-step experiment authoring UI |
| Experiment list/detail UI | `frontend/views/ExperimentListView.tsx`, `frontend/views/ExperimentDetailView.tsx` | Management and result inspection |

Experiment wizard flow:

| Step | Information collected | Validation goal |
|---|---|---|
| Basics | Name, description, deterministic settings, seed | Ensure experiment has identity and reproducible execution settings |
| Dataset range | BTCUSDT interval, start/end date/time, cached bounds | Ensure available market-data range and valid ordering |
| Blueprint selection | Approved/access-controlled blueprint | Ensure experiment is based on accessible reusable design |
| Target configuration | Target strategy and parameters | Ensure prediction label is generated consistently |
| Parameter overrides | Architecture, indicator, target, split overrides | Ensure overrides respect blueprint constraints |
| Split configuration | Train/validation/test percentages and strategy | Ensure split totals and minimum thresholds are valid |
| Review and submit | Full experiment summary | Ensure user confirms final run plan before queueing |

Compiler pseudocode:

```text
Compile experiment
  -> copy blueprint architecture, indicators, features, approval state, version
  -> copy experiment parameter overrides
  -> merge architecture base parameters with overrides
  -> merge indicator base parameters with overrides
  -> merge target and split parameters
  -> reject unknown or out-of-range overrides
  -> expand parameter spaces into cartesian permutations
  -> hash each parameter set for traceability
  -> sample requested permutations using deterministic seed when required
  -> store compiled blueprint snapshot and compiled experiment snapshot
```

Executor pseudocode:

```text
Execute experiment job
  -> load experiment and compiled snapshots
  -> refresh or read BTCUSDT candle cache
  -> build features through indicators
  -> build target column through selected target strategy
  -> split data into train/validation/test frames
  -> train model architecture for selected parameter permutation
  -> predict on evaluation data
  -> compute metrics and backtest logs
  -> persist model, metrics, logs, and status updates
```

Screenshots required:

| Screenshot | Page | Details to show |
|---|---|---|
| Experiment list | `/experiments` | Search, status filter, user-owned experiments |
| Wizard basics | `/experiments/new` | Name, deterministic seed settings |
| Wizard dataset | `/experiments/new` | BTCUSDT range, interval, chart preview |
| Wizard blueprint | `/experiments/new` | Approved blueprint selection and preview |
| Wizard target | `/experiments/new` | Target strategy and preview |
| Wizard overrides | `/experiments/new` | Architecture/indicator overrides and permutation cap |
| Wizard split | `/experiments/new` | Train/validation/test percentages |
| Review submit | `/experiments/new` | Final configuration summary |
| Experiment detail | `/experiments/[id]` | Status/progress, configuration, compiled summary, chart, model leaderboard |
| Cancel/retry | `/experiments/[id]` | Available lifecycle buttons |

Code snippets to include:

| File | Section | Purpose |
|---|---|---|
| `backend/app/execution/experiment_compiler.py` | `compile()` and `_cartesian()` | Shows snapshot and permutation generation |
| `backend/app/controllers/experiment_controller.py` | Create/list/detail/cancel/retry endpoints | Shows API workflow |
| `backend/app/validators/experiment_validator.py` | Split/date/blueprint checks | Shows validation rules |
| `backend/app/executors/default_experiment_executor.py` | Main execution stages | Shows end-to-end experiment execution |
| `frontend/views/ExperimentWizardView.tsx` | Step configuration and submit handler | Shows frontend wizard logic |

## 6.5.8 Queue, worker, jobs, cancellation, and system monitoring

Experiment execution is asynchronous. Submitting an experiment should not block the browser while data is processed and models are trained. The queue module stores job metadata, the worker executes jobs, and job views allow users to inspect or cancel eligible jobs.

| Feature | Source-code path |
|---|---|
| Queue service | `backend/app/services/queue_service.py` |
| Redis queue adapter | `backend/app/infrastructure/redis/job_queue.py` |
| Job metadata service | `backend/app/services/job_metadata_service.py` |
| Worker | `backend/app/workers/experiment_worker.py` |
| Worker entry script | `backend/app/scripts/run_worker.py` |
| Cancellation strategy | `backend/app/strategies/cancellable_job_strategy.py`, `backend/app/strategies/experiment_cancellation_handler.py`, `backend/app/strategies/job_cancellation_handler_registry.py` |
| Job API | `backend/app/controllers/job_controller.py` |
| Admin queue snapshot | `backend/app/controllers/system_controller.py` |
| Job frontend | `frontend/views/JobListView.tsx`, `frontend/views/JobDetailView.tsx` |
| System frontend | `frontend/views/SystemManagementView.tsx` |

Pseudocode:

```text
Experiment submitted
  -> backend validates and persists experiment as Queued
  -> queue service builds EXPERIMENT_EXECUTION job specification
  -> Redis adapter enqueues job and returns job id/position
  -> worker receives payload
  -> worker marks experiment Running and updates progress/stage
  -> executor completes or fails experiment
  -> worker records Completed, Failed, or Cancelled state
  -> user views job detail or admin views queue snapshot
```

Screenshots required:

| Screenshot | Page | Details to show |
|---|---|---|
| Job list | `/jobs` | Job rows and statuses |
| Job detail | `/jobs/[id]` | Job id, status, experiment id, progress, cancellation button |
| Experiment detail status | `/experiments/[id]` | Queued/Running/Completed/Failed/Cancelled state |
| System queue snapshot | `/system` | Queue depth, running jobs, active jobs |

## 6.5.9 Models, metrics, logs, rankings, and downloads

Model records are produced after experiment execution. The model module allows users to compare trained models, view details, favourite models, inspect logs, and access result artifacts.

| Feature | Source-code path |
|---|---|
| Model domain model | `backend/app/domain/models/model.py` |
| Model repository | `backend/app/repositories/model_repository.py` |
| Model controller | `backend/app/controllers/model_controller.py` |
| Metrics strategies | `backend/app/strategies/metrics/binary_classification_metrics_strategy.py`, `backend/app/strategies/metrics/continuous_metrics_strategy.py` |
| Log strategies | `backend/app/strategies/logs/backtest_log_strategy.py`, `confusion_metrics_log_strategy.py`, `parameter_correlation_strategy.py`, `reproducibility_log_strategy.py` |
| Logs download controller | `backend/app/controllers/logs_download_controller.py` |
| Model rankings UI | `frontend/views/ModelsRankingsView.tsx` |
| Model detail UI | `frontend/views/ModelDetailView.tsx`, `frontend/views/ModelDetailsView.tsx` |
| Experiment detail leaderboard | `frontend/views/ExperimentDetailView.tsx` |

Model result table for report:

| Result type | Meaning | Where to show |
|---|---|---|
| Accuracy / precision / recall / AUC-style classification metrics | Prediction quality | Model rankings and experiment detail leaderboard |
| Net/gross return, drawdown, Sharpe-like figures, win rate | Trading simulation outcome | Model detail and rankings |
| Parameter hash | Reproducibility identifier for a parameter permutation | Model detail metadata |
| Architecture and effective parameters | Model provenance | Model detail page or popup |
| Logs/artifacts | Execution evidence and downloadable analysis | Experiment detail downloads and logs endpoints |

Pseudocode:

```text
Executor completes model training
  -> predictions are evaluated by metric strategies
  -> trading/backtest strategy computes return and risk fields
  -> log strategies create reproducibility and analysis artifacts
  -> model repository stores model metadata and metrics
  -> model controller exposes highlights, rankings, libraries, detail, and favourite toggles
  -> frontend renders ranking table and detail view
```

Screenshots required:

| Screenshot | Page | Details to show |
|---|---|---|
| Models ranking | `/models` | Sortable/ranked model table with core metrics |
| Model detail | `/models/[id]` | Metrics, architecture, parameter hash, experiment provenance |
| Experiment leaderboard | `/experiments/[id]` | Models generated by one experiment |
| Favourited model | `/favorites` | Saved model in favourites list |
| Log download controls | `/experiments/[id]` | CSV/log download buttons and status |

## 6.5.10 Favourites module

The favourites module helps users save blueprints and models for later review. It is implemented using separate favourite entities and repositories.

| Favourite type | Backend source | Frontend source |
|---|---|---|
| Blueprint favourites | `backend/app/domain/models/favorite_blueprint.py`, `backend/app/repositories/favorite_blueprint_repository.py`, `backend/app/controllers/blueprint_controller.py` | `frontend/views/BlueprintDetailView.tsx`, `frontend/views/BlueprintsLibraryView.tsx`, `frontend/views/FavoritesLibraryView.tsx` |
| Model favourites | `backend/app/domain/models/favorite_model.py`, `backend/app/repositories/favorite_model_repository.py`, `backend/app/controllers/model_controller.py` | `frontend/views/ModelDetailView.tsx`, `frontend/views/ModelsRankingsView.tsx`, `frontend/views/FavoritesLibraryView.tsx` |

Pseudocode:

```text
User clicks favourite
  -> frontend calls POST favourite endpoint
  -> backend checks authenticated user and accessible resource
  -> repository inserts favourite link if it does not exist
  -> detail/list UI refreshes favourite state
User removes favourite
  -> frontend calls DELETE favourite endpoint
  -> repository removes link
  -> favourites library no longer shows the item
```

Screenshots required:

| Screenshot | Page | Details to show |
|---|---|---|
| Blueprint favourite button | `/blueprints/[id]` | Favourite/unfavourite state |
| Model favourite button | `/models/[id]` | Favourite/unfavourite state |
| Favourites library | `/favorites` | Combined saved blueprint/model view |

## 6.5.11 Public hub and documentation module

The public hub exposes approved/public platform outputs so users can discover public users, blueprints, experiments, and models. The documentation module exposes product documentation through an in-app browser.

| Feature | Backend source | Frontend source |
|---|---|---|
| Public hub list | `backend/app/controllers/public_hub_controller.py` | `frontend/app/hub/page.tsx`, `frontend/views/PublicHubView.tsx` |
| Public user detail | `backend/app/controllers/public_hub_controller.py` | `frontend/views/PublicHubView.tsx` |
| Documentation list/detail | `backend/app/controllers/documentation_controller.py` | `frontend/app/docs/page.tsx`, `frontend/views/DocumentationView.tsx` |
| Product documentation files | `docs/*.md` excluding report-draft folders | Displayed through documentation controller |

Pseudocode:

```text
Public hub loads
  -> frontend requests public hub endpoint
  -> backend aggregates public/approved resources
  -> frontend renders discovery tabs and public profile details
Documentation loads
  -> frontend requests document list
  -> user selects document slug
  -> backend returns markdown content for selected document
  -> frontend renders selected article
```

Screenshots required:

| Screenshot | Page | Details to show |
|---|---|---|
| Public hub | `/hub` | Public resources, filter/list layout |
| Public user detail | `/hub` user detail state | User profile and public contributions |
| Documentation browser | `/docs` | Document list and selected markdown article |

## 6.5.12 User profile and navigation shell

The navigation shell creates a consistent user experience across modules. It controls sidebar navigation, breadcrumbs, top bar, page shell, and role-aware navigation visibility.

| Feature | Source-code path |
|---|---|
| App shell | `frontend/components/layout/AppShell.tsx` |
| Top navigation / navbar | `frontend/components/layout/Navbar.tsx` |
| Breadcrumbs | `frontend/components/layout/Breadcrumbs.tsx` |
| Page shell and header | `frontend/components/layout/PageShell.tsx`, `frontend/components/layout/PageHeader.tsx` |
| Route navigation configuration | `frontend/lib/routes/nav.ts` |
| Profile page | `frontend/app/profile/page.tsx`, `frontend/views/UserProfileView.tsx` |

Pseudocode:

```text
App layout renders
  -> ThemeProvider and AuthProvider wrap all pages
  -> AppShell reads current route and user role
  -> navigation config filters items by role
  -> page route renders feature view inside consistent shell
```

Screenshots required:

| Screenshot | Page | Details to show |
|---|---|---|
| App shell | Any authenticated page | Sidebar/top navigation and breadcrumbs |
| Role-aware navigation | Compare user vs admin account | Staff/admin links visible only to allowed roles |
| Profile page | `/profile` | Current user details |

## Summary

The implemented modules cover the required system functionality end to end. Users can authenticate, manage blueprints, configure experiments, ingest and view BTCUSDT data, execute queued experiments, compare models, save favourites, browse public outputs, read documentation, and use staff/admin tools. Internally, the system connects these features through route guards, backend controllers, validators, repositories, domain models, strategy/factory patterns, asynchronous queue execution, and persistent database records.
