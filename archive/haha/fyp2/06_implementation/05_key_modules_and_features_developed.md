# 6.5 Key Modules and Features Developed

This section describes the main modules and features developed for the Bitcoin Experimental Engine. The system is implemented as a modular full-stack application, where each feature is supported by frontend views, backend controllers, service-layer logic, validation, repositories, database persistence, and, where required, asynchronous worker execution. The purpose of this section is to demonstrate how the system was built from its design into working modules.

The implemented modules are not isolated screens. They form a continuous workflow that begins with user access, continues through blueprint creation and experiment submission, and ends with queued execution, model generation, log inspection, favorites, public discovery, documentation, and administrative monitoring. The implementation therefore supports both the research workflow and the governance workflow required by the system.

## 6.5.1 User Authentication Module

The user authentication module allows guests to register an account, log in, restore authenticated session state, and log out. It is the entry point to most system functions because experiment configuration, blueprint authoring, job monitoring, model inspection, favorites, public hub access, profile viewing, user management, and system management all depend on authenticated identity.

The backend implementation is centered on `backend/app/controllers/authentication_controller.py`, supported by `backend/app/services/password_service.py`, `backend/app/services/session_service.py`, `backend/app/services/access_control_service.py`, and `backend/app/repositories/user_repository.py`. The frontend implementation is centered on `frontend/views/LoginView.tsx`, `frontend/views/RegistrationView.tsx`, `frontend/lib/auth/AuthProvider.tsx`, `frontend/lib/auth/current-user.ts`, `frontend/lib/auth/useAuth.ts`, and `frontend/lib/auth/guards.tsx`. API request behavior is centralized through `frontend/lib/api/client.ts` and `frontend/lib/api/endpoints.ts`.

During registration, the frontend collects account details and sends the request to the backend. The backend validates the account information, checks uniqueness rules, hashes the credential value, creates the user record, and establishes an authenticated session. During login, the backend verifies the submitted credential against the stored hash and checks the account status before creating a session. The frontend then updates its authentication state and redirects the user to the dashboard.

Session restoration is handled by the frontend authentication provider. When the application loads or refreshes, the frontend calls the current-user endpoint to determine whether a valid session exists. If the user is authenticated, protected routes are allowed to render. If the user is not authenticated, protected routes redirect or block access. This prevents the user interface from assuming identity based only on local page state.

The main authentication flow is shown in PDL-style pseudocode below.

```text
PROCEDURE Authenticate User
  RECEIVE email and credential from login form
  VALIDATE required fields
  FIND user record by email
  IF user record does not exist THEN
    RETURN authentication error
  ENDIF
  IF user account is disabled THEN
    RETURN access denied error
  ENDIF
  VERIFY submitted credential against stored credential hash
  IF verification fails THEN
    RETURN authentication error
  ENDIF
  CREATE server-managed session containing user identity and role
  RETURN safe user profile to frontend
ENDPROCEDURE
```

**Table 6.22: Authentication Module Implementation**

| Layer | Implementation Files | Responsibility |
| --- | --- | --- |
| Backend controller | `backend/app/controllers/authentication_controller.py` | Handles register, login, logout, CSRF, and current-user requests |
| Backend services | `password_service.py`, `session_service.py`, `access_control_service.py` | Handles credential hashing, session behavior, and identity resolution |
| Backend repository | `user_repository.py` | Persists and retrieves user records |
| Frontend views | `LoginView.tsx`, `RegistrationView.tsx` | Provides user-facing login and registration forms |
| Frontend auth state | `AuthProvider.tsx`, `current-user.ts`, `useAuth.ts` | Maintains session-aware frontend identity state |
| Frontend guards | `guards.tsx` | Protects authenticated and role-restricted routes |

> Note: Add screenshots of the registration form, login form, successful dashboard redirection, and logout result. Do not show real credentials or private user details in the screenshots.

## 6.5.2 Role-Based Access Control and User Management Module

The role-based access control module restricts system functions based on user role. The implemented roles are normal user, moderator, and administrator. Normal users can use research features such as dashboards, blueprints, experiments, jobs, models, favorites, public hub, documentation, and profile pages. Moderators can access staff moderation and limited user-management functions. Administrators can access the full user-management and system-management functions.

The backend access-control logic is implemented through `backend/app/services/access_control_service.py` and `backend/app/controllers/_access.py`. User-management operations are exposed through `backend/app/controllers/user_controller.py` and persisted through `backend/app/repositories/user_repository.py`. On the frontend, role-aware navigation and route protection are implemented through `frontend/lib/auth/guards.tsx`, authentication context, and views such as `frontend/views/UserManagementView.tsx` and `frontend/views/SystemManagementView.tsx`.

The implementation uses frontend restrictions for usability and backend restrictions for security. The frontend hides or blocks pages that are not suitable for the current user role, reducing confusion and preventing users from seeing unavailable controls. However, the backend remains the final authority. Even if a user manually calls an API endpoint, the backend resolves the authenticated actor and checks the required role before performing protected operations.

User management allows staff users to view and manage account records according to their permission level. Moderators are allowed to perform limited staff operations, while administrators can perform full user-management actions. This design supports governance requirements without giving every staff user unrestricted system control.

```text
PROCEDURE Enforce Protected Operation
  RESOLVE authenticated actor from session
  IF no actor is available THEN
    RETURN unauthenticated response
  ENDIF
  READ required role for requested operation
  IF actor role does not satisfy required role THEN
    RETURN forbidden response
  ENDIF
  EXECUTE requested protected operation
ENDPROCEDURE
```

**Table 6.23: RBAC and User Management Module Implementation**

| Layer | Implementation Files | Responsibility |
| --- | --- | --- |
| Backend access control | `backend/app/services/access_control_service.py`, `backend/app/controllers/_access.py` | Resolves actor identity and enforces role requirements |
| Backend user operations | `backend/app/controllers/user_controller.py` | Handles user profile and staff user-management API operations |
| Backend persistence | `backend/app/repositories/user_repository.py` | Reads and updates user records |
| Frontend guards | `frontend/lib/auth/guards.tsx` | Restricts route rendering based on authentication and role |
| Frontend user management | `frontend/views/UserManagementView.tsx` | Provides staff user-management interface |
| Frontend system management | `frontend/views/SystemManagementView.tsx` | Provides administrator-facing system controls |

> Note: Add one screenshot showing the user-management interface for a staff account and one screenshot showing restricted access for a normal user. The screenshots should demonstrate that role-based access is visible in the interface.

## 6.5.3 Dashboard and Application Shell Module

The dashboard and application shell module provides the main authenticated landing experience after login. The dashboard summarizes system activity and gives users quick access to important workflows, while the application shell provides navigation, layout, route structure, and consistent page presentation.

The backend dashboard data is exposed through `backend/app/controllers/dashboard_controller.py`. The frontend dashboard is implemented in `frontend/views/DashboardView.tsx`, and the base view structure is implemented through `frontend/views/BaseView.tsx`. Reusable layout and interface components are located under `frontend/components/`, while route-level pages under `frontend/app/` connect URLs to the correct views.

The dashboard gives users a central location to understand the current state of their experiments, models, and market-data availability. It is also a practical demonstration point because it shows that authentication, frontend rendering, API communication, and backend dashboard data are integrated. For administrators, the system-management view provides a separate operational dashboard for queue, settings, and event visibility.

**Table 6.24: Dashboard and Application Shell Implementation**

| Layer | Implementation Files | Responsibility |
| --- | --- | --- |
| Backend dashboard API | `backend/app/controllers/dashboard_controller.py` | Provides dashboard summary data |
| Frontend dashboard view | `frontend/views/DashboardView.tsx` | Displays user-facing dashboard content |
| Base view | `frontend/views/BaseView.tsx` | Provides common view structure |
| Reusable components | `frontend/components/` | Provides layout, status, chart, table, form, and state components |
| Route entrypoints | `frontend/app/` | Connects browser routes to views |

> Note: Add a dashboard screenshot after logging in with a demonstration account. This screenshot should show at least the navigation shell and one summary card or chart area.

## 6.5.4 Blueprint Authoring, Versioning, and Moderation Module

The blueprint module allows users to create reusable experiment templates. A blueprint contains the configuration needed to define a reusable experiment structure, including metadata, indicators, features, and architecture settings. This module is important because it separates reusable experiment design from individual experiment execution.

The backend implementation is distributed across `backend/app/controllers/blueprint_controller.py`, `backend/app/controllers/blueprint_wizard_controller.py`, `backend/app/controllers/blueprints_library_controller.py`, `backend/app/controllers/blueprint_approval_controller.py`, `backend/app/validators/blueprint_validator.py`, `backend/app/services/versioning_service.py`, and `backend/app/repositories/blueprint_repository.py`. Favorite behavior for blueprints is supported by `backend/app/repositories/favorite_blueprint_repository.py`. The frontend implementation is handled mainly by `frontend/views/BlueprintWizardView.tsx`, `frontend/views/BlueprintsLibraryView.tsx`, `frontend/views/BlueprintDetailView.tsx`, and `frontend/views/BlueprintModerationView.tsx`.

The blueprint wizard guides the user through authoring a blueprint. The user enters metadata, selects indicators, defines feature behavior, configures architecture values, and reviews the completed specification before saving or submitting. The frontend provides step-based interaction, while the backend validator performs authoritative validation before the blueprint is persisted or submitted for approval.

Blueprint approval is implemented so that reusable templates can be governed before wider use. Normal users can create drafts and submit them for approval. Moderators and administrators can approve or reject submissions. Approved blueprints can be selected during experiment creation, while drafts or rejected versions remain controlled according to ownership and staff visibility rules.

Blueprint versioning preserves traceability. When a blueprint has already entered a submitted or reviewed workflow, later modification should not silently overwrite the previously reviewed artifact. Instead, versioning behavior preserves the previous record and creates an editable version when required. This supports reproducibility because experiments created from a blueprint can remain linked to the blueprint state that existed when the experiment was configured.

```text
PROCEDURE Submit Blueprint For Approval
  RESOLVE authenticated owner
  LOAD blueprint by identifier
  VERIFY owner can access blueprint
  VALIDATE blueprint metadata, indicators, features, and architecture
  IF validation fails THEN
    RETURN validation errors
  ENDIF
  CHANGE blueprint approval state to pending
  SAVE blueprint changes
  RETURN updated blueprint detail
ENDPROCEDURE
```

```text
PROCEDURE Edit Blueprint
  LOAD existing blueprint
  VERIFY authenticated user owns blueprint
  IF blueprint is still editable draft THEN
    APPLY changes to existing draft
  ELSE
    CREATE new blueprint version
    COPY reusable specification from previous version
    APPLY owner changes to new version
    LINK new version to blueprint lineage
  ENDIF
  SAVE blueprint record
  RETURN saved blueprint detail
ENDPROCEDURE
```

**Table 6.25: Blueprint Module Implementation**

| Layer | Implementation Files | Responsibility |
| --- | --- | --- |
| Backend blueprint APIs | `blueprint_controller.py`, `blueprint_wizard_controller.py`, `blueprints_library_controller.py` | Handles blueprint creation, listing, wizard data, and detail retrieval |
| Backend approval API | `blueprint_approval_controller.py` | Handles approval request and moderation actions |
| Backend validation | `blueprint_validator.py` | Validates blueprint structure before persistence or submission |
| Backend versioning | `versioning_service.py` | Preserves blueprint lineage and creates new versions when needed |
| Backend persistence | `blueprint_repository.py`, `favorite_blueprint_repository.py` | Stores blueprints and favorite references |
| Frontend views | `BlueprintWizardView.tsx`, `BlueprintsLibraryView.tsx`, `BlueprintDetailView.tsx`, `BlueprintModerationView.tsx` | Provides blueprint authoring, library, detail, and moderation screens |

> Note: Add screenshots of the Blueprint Wizard, Blueprint Library, Blueprint Detail, and Blueprint Moderation pages. Also include a state-transition diagram showing Draft, Pending, Approved, and Rejected states.

## 6.5.5 Experiment Configuration and Management Module

The experiment module allows authenticated users to create and manage BTCUSDT experiments. An experiment defines the dataset interval and date range, train-validation-test split ratios, selected approved blueprint, optional parameter overrides, deterministic setting, and execution parameters. This module turns a reusable blueprint into a concrete experiment run.

Backend experiment functionality is implemented through `backend/app/controllers/experiment_controller.py`, `backend/app/controllers/experiment_wizard_controller.py`, `backend/app/validators/experiment_validator.py`, `backend/app/execution/experiment_compiler.py`, and `backend/app/repositories/experiment_repository.py`. The frontend implementation is handled by `frontend/views/ExperimentWizardView.tsx`, `frontend/views/ExperimentListView.tsx`, and `frontend/views/ExperimentDetailView.tsx`.

The experiment wizard guides the user through a multi-step configuration process. The user enters the experiment name and description, selects the BTCUSDT interval and date range, defines validation and test split values, selects an approved blueprint, optionally applies parameter overrides, reviews the configuration, and submits the experiment. The frontend helps the user avoid common mistakes, but backend validation remains the final enforcement point.

The backend validator checks that the experiment configuration is valid before persistence and queueing. This includes checking BTCUSDT scope, supported interval values, valid start and end dates, valid split ratios, minimum validation and test allocations, accessible blueprint selection, and valid parameter override structure. If validation succeeds, the experiment compiler produces snapshots that preserve the blueprint and experiment configuration used for the run.

The experiment management views allow users to list experiments, filter or inspect their status, and open experiment details. Experiment detail pages show configuration, progress, job information, resulting models, and artifact download options. This gives users a complete view of the experiment lifecycle from submission to result inspection.

```text
PROCEDURE Create Experiment
  RESOLVE authenticated user
  RECEIVE experiment configuration from wizard
  VALIDATE symbol, interval, date range, split ratios, blueprint access, and overrides
  IF validation fails THEN
    RETURN validation errors
  ENDIF
  COMPILE selected blueprint and experiment-specific settings into snapshots
  CREATE experiment record with queued status
  SUBMIT experiment execution job to queue
  RETURN experiment detail and queue metadata
ENDPROCEDURE
```

**Table 6.26: Experiment Module Implementation**

| Layer | Implementation Files | Responsibility |
| --- | --- | --- |
| Backend experiment API | `experiment_controller.py`, `experiment_wizard_controller.py` | Handles experiment creation, listing, detail retrieval, and wizard options |
| Backend validation | `experiment_validator.py` | Validates submitted experiment configuration |
| Backend compiler | `experiment_compiler.py` | Produces compiled blueprint and experiment snapshots |
| Backend persistence | `experiment_repository.py` | Stores experiment records and execution state |
| Frontend views | `ExperimentWizardView.tsx`, `ExperimentListView.tsx`, `ExperimentDetailView.tsx` | Provides experiment setup, listing, and detail screens |

> Note: Add screenshots of the Experiment Wizard review screen, experiment list, and experiment detail page. The screenshots should show the selected blueprint, split values, status, and progress information where possible.

## 6.5.6 Market Data and BTCUSDT Charting Module

The market-data module retrieves, stores, and serves BTCUSDT candle data. It supports both user-facing chart display and backend experiment execution. Since the project focuses on BTCUSDT experimentation, the market-data implementation is designed around BTCUSDT kline records rather than arbitrary market symbols.

The backend implementation includes `backend/app/controllers/market_data_controller.py`, `backend/app/services/market_data_service.py`, `backend/app/repositories/market_data_repository.py`, and the Binance-compatible infrastructure client under `backend/app/infrastructure/binance/`. Supporting scripts under `backend/app/scripts/` are used for BTCUSDT kline ingestion and refresh operations. The frontend chart implementation is located under `frontend/components/charts/` and is used by views such as the dashboard and experiment-related screens.

The backend retrieves candle data, normalizes it into a consistent OHLCV structure, and stores it in the `BTCUSDTKline` table. Timestamp is used as the primary key so that repeated refreshes can update existing records instead of creating duplicates. This design supports data integrity and ensures that experiment execution and chart rendering can refer to a consistent local candle cache.

The charting implementation converts backend candle data into the format needed by the frontend chart component. The chart can show loaded data, loading state, empty state, or error state depending on the API response. This improves usability because users can distinguish between unavailable data, pending loading, and actual chart output.

```text
PROCEDURE Refresh BTCUSDT Market Data
  RECEIVE requested interval and date range
  VALIDATE supported market-data scope
  REQUEST candle pages from market-data provider
  FOR EACH candle record returned
    NORMALIZE timestamp, open, high, low, close, and volume values
    UPSERT candle by timestamp into local database
  ENDFOR
  RETURN refresh summary to caller
ENDPROCEDURE
```

**Table 6.27: Market Data and Charting Module Implementation**

| Layer | Implementation Files | Responsibility |
| --- | --- | --- |
| Backend API | `market_data_controller.py` | Exposes market-data endpoints for chart and administrative use |
| Backend service | `market_data_service.py` | Coordinates market-data retrieval, normalization, and cache behavior |
| Backend repository | `market_data_repository.py` | Stores and retrieves BTCUSDT candle records |
| External connector | `backend/app/infrastructure/binance/` | Retrieves BTCUSDT kline data from configured provider |
| Frontend chart components | `frontend/components/charts/` | Renders BTCUSDT chart data and chart states |

> Note: Add a screenshot of the BTCUSDT chart on the dashboard or experiment page. Include a small table of sample candle fields: timestamp, open, high, low, close, and volume.

## 6.5.7 Queue, Worker, and Job Management Module

The queue, worker, and job management module enables long-running experiment execution without blocking the web interface. This is necessary because an experiment may involve data loading, feature generation, target generation, model training, evaluation, backtesting, metric calculation, and log persistence. Running this work inside a normal web request would make the system less responsive and less reliable.

The backend queue implementation includes `backend/app/services/queue_service.py`, `backend/app/services/job_metadata_service.py`, `backend/app/infrastructure/redis/`, `backend/app/controllers/job_controller.py`, `backend/app/controllers/system_controller.py`, and `backend/app/workers/experiment_worker.py`. Worker startup is supported through the backend worker script. The frontend job interfaces are implemented in `frontend/views/JobListView.tsx`, `frontend/views/JobDetailView.tsx`, and `frontend/views/SystemManagementView.tsx`.

When a user submits a valid experiment, the backend persists the experiment and enqueues a job. The API response returns quickly with experiment and queue metadata. The worker process later receives the job, loads the experiment, updates the experiment status, executes the experiment pipeline, records progress, and persists the output. This separation allows users to continue using the application while experiments run in the background.

The job management views allow users to inspect queued, running, completed, failed, or cancelled jobs. Eligible jobs can be cancelled. The system-management view gives administrators a higher-level view of active queue state and operational controls. These features improve transparency because users can understand whether their submitted experiment is waiting, processing, finished, or interrupted.

```text
PROCEDURE Process Queued Experiment Job
  RECEIVE job payload from queue
  LOAD experiment by identifier
  IF experiment cannot be found THEN
    MARK job as failed
    STOP
  ENDIF
  MARK experiment as running
  EXECUTE experiment pipeline with progress updates
  IF cancellation is requested THEN
    MARK experiment as cancelled
  ELSE IF execution succeeds THEN
    SAVE generated models and logs
    MARK experiment as completed
  ELSE
    RECORD failure information
    MARK experiment as failed
  ENDIF
ENDPROCEDURE
```

**Table 6.28: Queue, Worker, and Job Module Implementation**

| Layer | Implementation Files | Responsibility |
| --- | --- | --- |
| Queue service | `queue_service.py` | Enqueues validated experiment execution jobs |
| Job metadata | `job_metadata_service.py` | Provides queue and job status metadata |
| Redis infrastructure | `backend/app/infrastructure/redis/` | Integrates backend services with Redis-backed queue processing |
| Worker | `experiment_worker.py` | Executes queued experiments and updates experiment state |
| Job API | `job_controller.py` | Provides job list, detail, and cancellation behavior |
| System API | `system_controller.py` | Provides administrative queue visibility and system controls |
| Frontend views | `JobListView.tsx`, `JobDetailView.tsx`, `SystemManagementView.tsx` | Displays job status, cancellation controls, and system queue state |

> Note: Add screenshots of the job list page, job detail page, and administrator system queue view. A sequence diagram showing Experiment Submit -> Queue -> Worker -> Database Update -> Frontend Status is strongly recommended.

## 6.5.8 Experiment Execution, Model Training, Metrics, and Logs Module

The experiment execution module performs the core computational workflow of the system. It transforms a configured experiment into trained model artifacts and structured logs. This module is responsible for preserving temporal integrity, generating parameter permutations, processing BTCUSDT data, training models, evaluating outputs, and saving results.

The backend implementation includes `backend/app/execution/experiment_compiler.py`, `backend/app/execution/feature_scaler.py`, `backend/app/executors/experiment_executor.py`, `backend/app/executors/default_experiment_executor.py`, `backend/app/architectures/`, and `backend/app/strategies/`. Model and log outputs are persisted through `backend/app/repositories/model_repository.py` and `backend/app/repositories/experiment_log_repository.py`. The frontend result views include `frontend/views/ExperimentDetailView.tsx`, `frontend/views/ModelsRankingsView.tsx`, `frontend/views/ModelDetailView.tsx`, and `frontend/views/ModelDetailsView.tsx`.

The execution pipeline begins with a compiled experiment definition. The worker loads the experiment, resolves the selected blueprint snapshot, loads the required BTCUSDT data, and applies the configured split sequence. The split-first approach is important because indicators, targets, scaling, and evaluation must respect chronological boundaries and avoid look-ahead bias.

After splitting, the executor generates features and targets according to the compiled blueprint and experiment settings. It then generates parameter permutations and trains models for the selected configurations. Each model is evaluated using stored metrics, and the resulting parameter set is saved with a parameter hash. This allows the system to identify and rank model outputs consistently.

Logs are generated during evaluation and stored in the database. These logs allow experiment details, model metrics, backtest-style behavior, prediction signals, and structured metrics to be inspected later. The logs also support download features, which are implemented through the logs download controller.

```text
PROCEDURE Execute Compiled Experiment
  LOAD compiled experiment definition
  LOAD BTCUSDT candle data for selected interval and date range
  SPLIT data chronologically into train, validation, and test partitions
  FOR EACH parameter permutation
    GENERATE indicators within the appropriate data partition
    GENERATE target values according to selected target strategy
    SCALE features using training-data rules
    TRAIN selected model architecture
    EVALUATE model on validation and test data
    GENERATE trading signals and metrics
    SAVE model record and experiment logs
    UPDATE experiment progress
  ENDFOR
  RETURN execution summary
ENDPROCEDURE
```

**Table 6.29: Experiment Execution and Output Module Implementation**

| Layer | Implementation Files | Responsibility |
| --- | --- | --- |
| Experiment compiler | `experiment_compiler.py` | Produces executable experiment snapshots and parameter structures |
| Feature scaling | `feature_scaler.py` | Applies feature-scaling behavior during execution |
| Executor interface | `experiment_executor.py` | Defines the execution contract |
| Default executor | `default_experiment_executor.py` | Runs the main experiment execution workflow |
| Architectures | `backend/app/architectures/` | Provides trainable model architecture implementations |
| Strategies | `backend/app/strategies/` | Provides indicators, targets, splits, metrics, logs, and trading logic |
| Model persistence | `model_repository.py` | Stores model metrics and parameter records |
| Log persistence | `experiment_log_repository.py` | Stores structured experiment logs |
| Frontend result views | `ExperimentDetailView.tsx`, `ModelsRankingsView.tsx`, `ModelDetailView.tsx` | Displays experiment outputs and model details |

> Note: Add screenshots of experiment detail, model rankings, model detail, and log download controls. Use pseudocode and diagrams instead of long source-code screenshots because the execution pipeline spans multiple backend files.

## 6.5.9 Model Catalog, Rankings, and Model Detail Module

The model catalog module allows users to view generated model artifacts after experiments complete. Models can be ranked by performance metrics and opened for detailed inspection. This supports the project objective of helping users compare experimental outputs rather than only execute experiments.

Backend model functionality is implemented through `backend/app/controllers/model_controller.py`, `backend/app/controllers/models_rankings_controller.py`, `backend/app/controllers/models_library_controller.py`, and `backend/app/repositories/model_repository.py`. Favorite model behavior is supported through `backend/app/repositories/favorite_model_repository.py`. The frontend implementation includes `frontend/views/ModelsRankingsView.tsx`, `frontend/views/ModelDetailView.tsx`, `frontend/views/ModelDetailsView.tsx`, and `frontend/views/FavoritesLibraryView.tsx`.

The ranking interface displays model metrics such as Sharpe, accuracy, precision, and recall. The model detail view shows the selected model’s experiment context, parameters, metrics, owner information, and available actions. Users can also save models as favorites for quick retrieval.

```text
PROCEDURE Load Model Rankings
  RECEIVE optional ranking and filter criteria
  QUERY model records with related experiment and owner data
  ORDER models by selected performance metric
  RETURN ranked model list to frontend
ENDPROCEDURE
```

**Table 6.30: Model Catalog Module Implementation**

| Layer | Implementation Files | Responsibility |
| --- | --- | --- |
| Backend model APIs | `model_controller.py`, `models_rankings_controller.py`, `models_library_controller.py` | Provides model detail, ranking, highlight, library, and favorite behavior |
| Backend persistence | `model_repository.py`, `favorite_model_repository.py` | Retrieves model outputs and persists saved model references |
| Frontend ranking view | `ModelsRankingsView.tsx` | Displays ranked model list and metrics |
| Frontend detail views | `ModelDetailView.tsx`, `ModelDetailsView.tsx` | Displays selected model details |
| Frontend favorites view | `FavoritesLibraryView.tsx` | Displays saved models and blueprints |

> Note: Add a screenshot of the model ranking table and model detail page. Include at least one example showing performance metric columns.

## 6.5.10 Logs and Artifact Download Module

The logs and artifact download module allows users to retrieve experiment artifacts in a standard downloadable form. This is important because experiment outputs should not only be visible in the browser; they should also be available for external analysis, reporting, and verification.

The backend implementation is centered on `backend/app/controllers/logs_download_controller.py` and `backend/app/repositories/experiment_log_repository.py`. Experiment log records are linked to experiments and models. The frontend exposes download actions mainly from `frontend/views/ExperimentDetailView.tsx` and model-related result screens.

The module retrieves the requested artifact type, validates access to the experiment, loads the relevant model or log data, formats the artifact, and returns it as a downloadable response. Access control is important because users should not retrieve artifacts for experiments they are not allowed to view.

```text
PROCEDURE Download Experiment Artifact
  RESOLVE authenticated user
  LOAD experiment by identifier
  VERIFY user can access experiment
  VALIDATE requested artifact type
  LOAD matching log or model data
  FORMAT data for download
  RETURN downloadable response
ENDPROCEDURE
```

**Table 6.31: Logs and Download Module Implementation**

| Layer | Implementation Files | Responsibility |
| --- | --- | --- |
| Backend download API | `logs_download_controller.py` | Handles artifact download requests |
| Backend log persistence | `experiment_log_repository.py` | Retrieves stored experiment log records |
| Frontend experiment detail | `ExperimentDetailView.tsx` | Provides user-facing artifact download actions |
| Frontend API client | `frontend/lib/api/client.ts`, `frontend/lib/api/endpoints.ts` | Sends download requests to backend endpoints |

> Note: Add a screenshot of experiment detail showing available download buttons. A sample sanitized downloaded table may also be included if space allows.

## 6.5.11 Favorites Library Module

The favorites module allows users to save useful models and blueprints for quick retrieval. This feature supports reuse because users may want to return to a promising model or a reusable approved blueprint without searching through all public or owned artifacts again.

Backend favorite behavior is implemented through `backend/app/repositories/favorite_blueprint_repository.py`, `backend/app/repositories/favorite_model_repository.py`, blueprint library controllers, and model controllers. The frontend implementation is mainly handled by `frontend/views/FavoritesLibraryView.tsx`, with favorite actions also appearing on blueprint and model detail screens.

Favorites are stored as join records linking a user to a model or blueprint. The favorite tables do not duplicate the saved artifact itself; they only store the association. This preserves a single source of truth for the actual model or blueprint while still allowing each user to maintain a personalized saved library.

```text
PROCEDURE Toggle Favorite Artifact
  RESOLVE authenticated user
  VALIDATE target artifact exists and is accessible
  IF favorite record already exists THEN
    REMOVE favorite record
    RETURN unfavorited state
  ELSE
    CREATE favorite record
    RETURN favorited state
  ENDIF
ENDPROCEDURE
```

**Table 6.32: Favorites Module Implementation**

| Layer | Implementation Files | Responsibility |
| --- | --- | --- |
| Backend persistence | `favorite_blueprint_repository.py`, `favorite_model_repository.py` | Stores and removes favorite associations |
| Backend APIs | Blueprint and model controllers/library controllers | Expose favorite actions and favorite library data |
| Frontend library view | `FavoritesLibraryView.tsx` | Displays saved models and blueprints |
| Frontend detail screens | `BlueprintDetailView.tsx`, `ModelDetailView.tsx` | Provide favorite or unfavorite actions |

> Note: Add a screenshot of the Favorites page showing separate saved model and blueprint records. Also include an example of a favorite toggle button on a detail page.

## 6.5.12 Public Hub Module

The Public Hub module allows authenticated users to discover visible system artifacts created by other users. It supports browsing of enabled users, completed experiments, generated models, and approved blueprints. This module helps transform the system from a private experiment runner into a shared research environment.

The backend implementation is handled by `backend/app/controllers/public_hub_controller.py`, supported by repositories for users, experiments, models, and blueprints. The frontend implementation is located in `frontend/views/PublicHubView.tsx`. The API client and endpoint definitions allow the frontend to request public hub data in a consistent format.

Public Hub visibility rules are important. Disabled users should not be shown as public user results, failed or incomplete experiments should not be treated as completed public research outputs, and only approved blueprints should appear as reusable public templates. These rules ensure that discovery surfaces useful and valid artifacts.

```text
PROCEDURE Load Public Hub
  LOAD enabled users
  LOAD completed successful experiments
  LOAD models from completed experiments
  LOAD approved blueprints
  APPLY search or filter criteria if provided
  RETURN grouped public hub payload
ENDPROCEDURE
```

**Table 6.33: Public Hub Module Implementation**

| Layer | Implementation Files | Responsibility |
| --- | --- | --- |
| Backend API | `public_hub_controller.py` | Provides public hub data and user profile discovery |
| Backend repositories | User, experiment, model, and blueprint repositories | Retrieve visible public records |
| Frontend view | `PublicHubView.tsx` | Displays hub tabs, search, filters, and item summaries |
| API client | `frontend/lib/api/client.ts`, `frontend/lib/api/endpoints.ts` | Connects frontend hub view to backend endpoints |

> Note: Add screenshots of the Public Hub tabs for Users, Experiments, Models, and Blueprints. Show only demonstration data.

## 6.5.13 Documentation Viewer Module

The documentation viewer module allows users to browse documentation content inside the application. This supports the requirement that the system provide a documentation viewer capable of rendering Markdown-formatted content. It also improves usability because users can access guidance without leaving the application.

The backend documentation API is implemented in `backend/app/controllers/documentation_controller.py`. The frontend viewer is implemented in `frontend/views/DocumentationView.tsx`. Documentation content is served through backend routes and rendered on the frontend in a readable format.

The documentation module is intentionally simpler than the experiment and blueprint modules, but it is important for handover and usability. Users need guidance for workflows such as creating blueprints, configuring experiments, understanding model outputs, and using administrative features.

```text
PROCEDURE Load Documentation Page
  REQUEST documentation list from backend
  DISPLAY available document entries
  WHEN user selects a document
    REQUEST selected document content
    RENDER Markdown content in documentation view
ENDPROCEDURE
```

**Table 6.34: Documentation Module Implementation**

| Layer | Implementation Files | Responsibility |
| --- | --- | --- |
| Backend API | `documentation_controller.py` | Lists and serves documentation content |
| Frontend view | `DocumentationView.tsx` | Displays documentation list and selected content |
| API client | `frontend/lib/api/client.ts`, `frontend/lib/api/endpoints.ts` | Retrieves documentation data from backend |

> Note: Add a screenshot of the Documentation page showing the list of documents and rendered Markdown content.

## 6.5.14 System Management and Operational Monitoring Module

The system management module provides administrative visibility into operational aspects of the application. It includes queue visibility, settings behavior, and system events. This module is designed for administrator use and supports monitoring requirements.

The backend implementation is handled through `backend/app/controllers/system_controller.py`, `backend/app/services/system_settings_service.py`, `backend/app/services/job_metadata_service.py`, `backend/app/repositories/system_setting_repository.py`, and `backend/app/repositories/system_event_repository.py`. The frontend implementation is located in `frontend/views/SystemManagementView.tsx`.

The system management view allows administrators to inspect active queue state, view system settings, and review operational events. This is useful because experiment execution depends on queue and worker behavior. Administrators need a way to confirm whether jobs are waiting, running, completed, failed, or cancelled.

System events are recorded to support traceability. They can show important operations and route-level activity in a way that helps diagnose system behavior. This improves maintainability and operational visibility for a system that includes multiple user roles and asynchronous execution.

```text
PROCEDURE Load System Management Dashboard
  VERIFY authenticated actor is administrator
  LOAD queue snapshot
  LOAD system settings
  LOAD recent system events
  RETURN system dashboard payload
ENDPROCEDURE
```

**Table 6.35: System Management Module Implementation**

| Layer | Implementation Files | Responsibility |
| --- | --- | --- |
| Backend system API | `system_controller.py` | Provides system dashboard, queue, settings, and event endpoints |
| Backend services | `system_settings_service.py`, `job_metadata_service.py` | Handles settings behavior and queue metadata |
| Backend persistence | `system_setting_repository.py`, `system_event_repository.py` | Stores settings and operational events |
| Frontend view | `SystemManagementView.tsx` | Displays administrative system status and controls |
| Access control | `access_control_service.py`, `guards.tsx` | Restricts system management to administrator role |

> Note: Add a screenshot of the System Management page showing queue status, settings, or event records. The screenshot should be taken using an administrator demonstration account.

## 6.5.15 User Profile Module

The user profile module provides profile-level views for user activity and ownership. It allows users to inspect profile-related information and supports public discovery when other users are accessed through the Public Hub.

The backend profile data is provided through user-related controllers and repositories, while the frontend profile page is implemented in `frontend/views/UserProfileView.tsx`. The profile module integrates with experiments, models, blueprints, and public hub browsing because profile views often summarize a user's research artifacts.

This module improves discoverability and gives users a more complete view of activity ownership. In a research system, ownership is important because models, experiments, and blueprints should be traceable to the user who created them.

**Table 6.36: User Profile Module Implementation**

| Layer | Implementation Files | Responsibility |
| --- | --- | --- |
| Backend user API | `user_controller.py`, `public_hub_controller.py` | Provides profile and public user detail data |
| Backend persistence | `user_repository.py` and related artifact repositories | Loads user details and associated artifact summaries |
| Frontend profile view | `UserProfileView.tsx` | Displays user profile and activity information |
| Frontend navigation | Route and API client modules | Connects profile links from dashboard, public hub, and artifact views |

> Note: Add a screenshot of the user profile page showing activity summaries or associated artifacts.

## 6.5.16 Module Integration Summary

The completed modules form an integrated research workflow. A guest registers or logs in through the authentication module. The authenticated user then creates a blueprint through the blueprint wizard and submits it for approval. A moderator or administrator approves the blueprint. The user selects the approved blueprint in the experiment wizard, configures BTCUSDT data settings and split ratios, and submits the experiment. The backend validates the request, compiles snapshots, creates an experiment record, and queues the job. The worker executes the experiment, stores generated models and logs, and updates experiment progress. The user then reviews results through experiment detail, model ranking, downloads, favorites, and public hub pages.

The implementation also supports governance and operation. Role-based access control protects staff and administrator features. User management allows staff to manage accounts. System management provides queue and event visibility. Documentation provides guidance inside the application. These supporting modules make the system more complete than a standalone experiment execution tool.

The full workflow can be summarized as follows:

```text
Guest
  -> Register or Login
  -> Authenticated Dashboard
  -> Create Blueprint
  -> Request Blueprint Approval
  -> Staff Approves Blueprint
  -> Create Experiment from Approved Blueprint
  -> Backend Validates and Compiles Experiment
  -> Queue Experiment Job
  -> Worker Executes Experiment
  -> Store Models and Logs
  -> View Experiment Detail and Model Rankings
  -> Save Favorites or Browse Public Hub
```

**Table 6.37: End-to-End Module Integration**

| Workflow Stage | Modules Involved | Output |
| --- | --- | --- |
| Access | Authentication, sessions, route guards | Authenticated user state |
| Governance | RBAC, user management, blueprint moderation | Controlled access and approved templates |
| Template creation | Blueprint wizard, validation, versioning | Reusable blueprint record |
| Experiment setup | Experiment wizard, validator, compiler | Persisted experiment and compiled snapshots |
| Execution | Queue, worker, market data, executor, strategies | Completed or failed experiment state |
| Result storage | Models, logs, repositories, database | Model metrics and experiment artifacts |
| Result inspection | Experiment detail, model ranking, downloads | User-readable research output |
| Reuse and discovery | Favorites, public hub, user profile | Saved and discoverable artifacts |
| Operation | System management, system events, settings | Administrator visibility and control |

> Note: Include one end-to-end workflow diagram after this section. The diagram should show the user journey from login to blueprint creation, experiment submission, queue execution, and result inspection.

## 6.5.17 Summary

The key modules developed for the Bitcoin Experimental Engine implement the system as a complete research platform. The authentication, authorization, dashboard, blueprint, experiment, market-data, queue, worker, model, log, favorites, public hub, documentation, user profile, user-management, and system-management modules work together to support the project objectives.

The implementation uses clear separation of responsibilities. Frontend views provide user interaction, backend controllers expose API boundaries, services coordinate workflows, validators enforce input correctness, repositories manage persistence, strategies encapsulate experiment behavior, and the worker executes long-running jobs in the background. This modular design improves maintainability and allows the system to support reproducible BTCUSDT experimentation with traceable outputs and role-aware governance.
