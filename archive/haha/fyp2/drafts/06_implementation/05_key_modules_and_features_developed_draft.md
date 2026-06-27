# 6.5 Key Modules and Features Developed

## Section Purpose

This is the main implementation evidence section. For each developed module, describe the feature, files involved, implementation logic, screenshots or code snippets to include, pseudocode requirement, and integration with other components. This section should be the longest section in Chapter 6 because it demonstrates how the designed system was actually built.

## Recommended Overall Structure

Start with one overview paragraph, then use one subsection for each major module. Each module subsection should follow the same internal pattern:

1. **Feature / functionality**: what the module does.
2. **Implementation location**: backend, frontend, and script folders involved.
3. **Implementation explanation**: two to four paragraphs explaining how it works.
4. **Pseudocode**: include when the module contains workflow or algorithmic logic.
5. **Screenshots / code snippets**: state what should be shown.
6. **Integration**: explain how it connects to other modules.

> Note: Use screenshots for user-facing modules and pseudocode for workflow-heavy modules. Do not overuse source-code screenshots. Tables and pseudocode are usually clearer in a technical report.

---

## 6.5.1 User Authentication Module

### Feature / Functionality

The user authentication module allows users to register, log in, check current session identity, and log out. It validates account data, stores credential hashes, manages server-side sessions, applies CSRF protection, and redirects authenticated users to protected application areas.

### Implementation Location

| Layer | Files / Folders |
| --- | --- |
| Backend controller | `backend/app/controllers/authentication_controller.py` |
| Access control | `backend/app/services/access_control_service.py`, `backend/app/services/session_service.py` |
| Credential handling | `backend/app/services/password_service.py` |
| User persistence | `backend/app/repositories/user_repository.py`, user ORM/domain files |
| Frontend auth provider | `frontend/lib/auth/AuthProvider.tsx`, `frontend/lib/auth/useAuth.ts` |
| Route guards | `frontend/lib/auth/guards.tsx` |
| Login/register views | `frontend/views/LoginView.tsx`, `frontend/views/RegistrationView.tsx` |
| API client | `frontend/lib/api/client.ts`, `frontend/lib/api/endpoints.ts` |

### Implementation Explanation

Write three paragraphs. First, explain the registration flow: the frontend collects name, username, email, and account credential fields; client-side validators provide early feedback; backend validation remains the authority; the backend checks uniqueness, normalizes username, stores a secure credential hash, creates a user record, and establishes a session.

Second, explain the login flow: the user submits email and credential fields, the backend locates the account, verifies the submitted credential against the stored hash, checks user status, creates a server-side session, and returns a safe user payload. The frontend updates authentication state and redirects the user to the dashboard.

Third, explain session continuity: `AuthProvider` calls the current-user endpoint to determine whether the browser is authenticated, while route guards protect private routes. Logout invalidates the session and returns the user to a public state.

### Pseudocode

```text
PROCEDURE Login User
  RECEIVE login request containing email and credential
  VALIDATE required fields
  FIND user by email
  IF user does not exist THEN
    RETURN authentication error
  ENDIF
  IF user status is not enabled THEN
    RETURN access denied error
  ENDIF
  VERIFY submitted credential against stored credential hash
  IF verification fails THEN
    RETURN authentication error
  ENDIF
  CREATE server-side session for user identity and role
  RETURN safe user profile to frontend
ENDPROCEDURE
```

### Screenshots / Evidence

> Note: Add screenshots of the login page, registration page, and authenticated dashboard after login. Include one table describing the successful login API request and response shape rather than showing sensitive form data.

### Integration

The authentication module integrates with route guards, user management, role-based access control, protected backend endpoints, and the frontend app shell. Successful login allows users to access experiment, blueprint, job, model, profile, and public hub workflows.

---

## 6.5.2 Role-Based Access Control and User Management Module

### Feature / Functionality

This module restricts protected operations according to user role. Normal users can access research workflows, moderators can perform staff-level moderation and limited user administration, and administrators can access full user and system management operations.

### Implementation Location

| Layer | Files / Folders |
| --- | --- |
| Backend access control | `backend/app/services/access_control_service.py`, `backend/app/controllers/_access.py` |
| User controller | `backend/app/controllers/user_controller.py` |
| User management view | `frontend/views/UserManagementView.tsx` |
| Role guards | `frontend/lib/auth/guards.tsx`, `frontend/lib/routes/nav.ts` |
| Tests | backend and frontend user/auth/guard tests |

### Implementation Explanation

Write three paragraphs. Explain how the backend resolves the authenticated actor from session context and applies staff or admin checks before allowing protected operations. Explain how the frontend hides or redirects pages based on role, but backend authorization remains the final enforcement. Explain how staff user-management actions include listing users, creating users, enabling/disabling accounts, and administrator-only role, username, credential reset, or deletion operations.

### Pseudocode

```text
PROCEDURE Authorize Staff Operation
  RESOLVE authenticated actor from session
  IF actor is missing THEN
    RETURN unauthenticated response
  ENDIF
  IF actor role is not Moderator and not Admin THEN
    RETURN forbidden response
  ENDIF
  CONTINUE requested staff operation
ENDPROCEDURE
```

### Screenshots / Evidence

> Note: Add screenshots of the user-management page using a staff account and a screenshot of unauthorized access being redirected or blocked for a normal user.

### Integration

This module integrates with authentication, navigation rendering, backend controllers, user repository, audit/system event recording, and system management.

---

## 6.5.3 Blueprint Authoring, Versioning, and Moderation Module

### Feature / Functionality

Blueprints are reusable research templates containing architecture settings, indicator selections, feature definitions, and parameter ranges. The module supports blueprint creation, validation, owner library views, favorites, approval requests, moderation decisions, and versioned edits after submission or review.

### Implementation Location

| Layer | Files / Folders |
| --- | --- |
| Backend controllers | `backend/app/controllers/blueprint_controller.py`, `blueprint_approval_controller.py`, `blueprints_library_controller.py` |
| Validators/services | `backend/app/validators/`, `backend/app/services/versioning_service.py` |
| Repositories | `backend/app/repositories/blueprint_repository.py`, `favorite_blueprint_repository.py` |
| Frontend views | `frontend/views/BlueprintWizardView.tsx`, `BlueprintsLibraryView.tsx`, `BlueprintDetailView.tsx`, `BlueprintModerationView.tsx` |
| Frontend forms/components | `frontend/components/forms/`, `frontend/components/ui/` |

### Implementation Explanation

Write four paragraphs. First, explain the blueprint wizard steps and how users define reusable experiment specifications. Second, explain backend validation and persistence. Third, explain approval states and moderation by staff users. Fourth, explain versioning: editable drafts can be modified, but reviewed or submitted artifacts are preserved by creating new versions for later edits.

### Pseudocode

```text
PROCEDURE Submit Blueprint For Approval
  RESOLVE authenticated owner
  LOAD blueprint by identifier
  VERIFY owner can access blueprint
  VALIDATE blueprint metadata, architecture, indicators, and parameters
  IF validation fails THEN
    RETURN validation errors
  ENDIF
  CHANGE approval state to pending
  SAVE blueprint
  RETURN updated blueprint detail
ENDPROCEDURE
```

```text
PROCEDURE Edit Reviewed Blueprint
  LOAD existing blueprint
  IF blueprint was never submitted THEN
    UPDATE existing draft
  ELSE
    CREATE new draft version
    COPY reusable specification from existing blueprint
    LINK new version to original lineage
    APPLY owner edits to new draft
  ENDIF
  SAVE result
ENDPROCEDURE
```

### Screenshots / Evidence

> Note: Add screenshots for the Blueprint Wizard, Blueprint Library, Blueprint Detail, and Blueprint Moderation pages. Also include a small state-transition diagram for Draft, Pending, Approved, Rejected, and Disapproved states.

### Integration

This module integrates with experiment creation because only accessible approved blueprints should be selectable by the experiment wizard. It also integrates with favorites, public hub visibility, user ownership, and moderation authorization.

---

## 6.5.4 Experiment Configuration and Management Module

### Feature / Functionality

The experiment module allows authenticated users to configure BTCUSDT experiments, select date ranges and split ratios, choose an approved blueprint, define parameter overrides, submit the experiment, view experiment status, and inspect experiment detail.

### Implementation Location

| Layer | Files / Folders |
| --- | --- |
| Backend controller | `backend/app/controllers/experiment_controller.py` |
| Validator/compiler | `backend/app/validators/`, `backend/app/execution/experiment_compiler.py` |
| Repository | `backend/app/repositories/experiment_repository.py` |
| Frontend views | `frontend/views/ExperimentWizardView.tsx`, `ExperimentListView.tsx`, `ExperimentDetailView.tsx` |
| API client/endpoints | `frontend/lib/api/client.ts`, `frontend/lib/api/endpoints.ts` |

### Implementation Explanation

Write four paragraphs. Explain the multi-step experiment wizard. Explain validation rules: fixed BTCUSDT scope, interval/date range checks, split totals, minimum validation/test splits, blueprint accessibility, and structured parameter overrides. Explain persistence of experiment configuration and compiled snapshots. Explain list/detail views with ownership enforcement and status filtering.

### Pseudocode

```text
PROCEDURE Create Experiment
  RESOLVE authenticated user
  RECEIVE experiment configuration
  VALIDATE symbol, interval, dates, splits, blueprint access, and overrides
  IF validation fails THEN
    RETURN validation errors
  ENDIF
  COMPILE experiment from selected blueprint and overrides
  SAVE experiment with queued status and compiled snapshots
  ENQUEUE experiment execution job
  RETURN experiment detail and queue metadata
ENDPROCEDURE
```

### Screenshots / Evidence

> Note: Add screenshots of each major wizard stage: Basics, Dataset Range, Split Configuration, Blueprint Selection, Parameter Overrides, Review, and Submit result. For space control, use a collage or select the most representative screens.

### Integration

This module integrates with blueprint approval, market-data availability, queue service, worker execution, job detail, model records, logs, and dashboard summaries.

---

## 6.5.5 Market Data and Charting Module

### Feature / Functionality

This module retrieves, caches, and displays BTCUSDT market data. It supports backend market-data APIs, Binance-backed kline retrieval, local upsert caching, chart metadata, target preview, and frontend chart rendering.

### Implementation Location

| Layer | Files / Folders |
| --- | --- |
| Backend connector | `backend/app/infrastructure/binance/kline_client.py` |
| Service/repository | `backend/app/services/market_data_service.py`, `backend/app/repositories/market_data_repository.py` |
| Controller | `backend/app/controllers/market_data_controller.py` |
| Scripts | `backend/app/scripts/ingest_btcusdt_klines.py`, `refresh_btcusdt_klines.py` |
| Frontend chart | `frontend/components/charts/BTCUSDTPriceChart.tsx`, `useBTCUSDTChartData.ts`, `utils.ts` |

### Implementation Explanation

Write three paragraphs. Explain that the backend retrieves BTCUSDT kline data, normalizes it into candle records, and upserts records to prevent duplicate timestamps. Explain that experiment execution uses cached data as the deterministic data source after refresh attempts. Explain that the frontend displays cached candle data through reusable chart components in the dashboard and experiment screens.

### Pseudocode

```text
PROCEDURE Refresh BTCUSDT Candles
  VALIDATE requested symbol and interval
  VALIDATE start and end time range
  REQUEST candle pages from market-data provider
  FOR EACH returned candle DO
    NORMALIZE candle fields
    UPSERT candle by timestamp
  ENDFOR
  RETURN inserted and updated record counts
ENDPROCEDURE
```

### Screenshots / Evidence

> Note: Add a screenshot of the BTCUSDT chart on the dashboard or experiment wizard. Also include a small table showing example candle fields: timestamp, open, high, low, close, and volume.

### Integration

This module integrates with dashboard visualization, experiment wizard date selection, experiment execution, admin catch-up actions, and local cache reliability.

---

## 6.5.6 Queue, Worker, and Job Management Module

### Feature / Functionality

This module allows submitted experiments to run asynchronously. It queues validated experiment jobs, records job metadata, exposes job detail and cancellation endpoints, runs worker-side execution, and updates experiment progress and state.

### Implementation Location

| Layer | Files / Folders |
| --- | --- |
| Queue service | `backend/app/services/queue_service.py`, `job_metadata_service.py` |
| Redis adapter | `backend/app/infrastructure/redis/job_queue.py` |
| Worker | `backend/app/workers/experiment_worker.py`, `backend/app/scripts/run_worker.py` |
| Job controllers | `backend/app/controllers/job_controller.py`, `system_controller.py` |
| Frontend views | `frontend/views/JobListView.tsx`, `JobDetailView.tsx`, `SystemManagementView.tsx` |

### Implementation Explanation

Write four paragraphs. Explain that experiment submission returns immediately after queueing. Explain that Redis/RQ stores the queued job and the worker consumes job payloads. Explain job status transitions such as queued, running, completed, failed, and cancelled. Explain ownership checks for viewing or cancelling jobs.

### Pseudocode

```text
PROCEDURE Process Experiment Job
  RECEIVE job payload
  VALIDATE payload contains experiment identifier
  LOAD experiment
  IF experiment does not exist THEN
    MARK job as failed
    STOP
  ENDIF
  MARK experiment as running
  EXECUTE experiment pipeline with progress callback
  IF execution succeeds THEN
    MARK experiment as completed
  ELSE IF cancellation requested THEN
    MARK experiment as cancelled
  ELSE
    RECORD failure reason
    MARK experiment as failed
  ENDIF
ENDPROCEDURE
```

### Screenshots / Evidence

> Note: Add screenshots of the job list/detail page and the system queue management page. A small sequence diagram showing Experiment Submit -> Queue -> Worker -> Experiment Update is recommended.

### Integration

This module integrates with experiment creation, system management, cancellation strategies, system events, and frontend status badges.

---

## 6.5.7 Experiment Execution, Models, Metrics, and Logs Module

### Feature / Functionality

This module performs the computational workflow for experiments. It compiles experiment plans, generates parameter permutations, loads data, performs splitting, builds features and targets, trains models, evaluates outputs, runs trading/backtest logic, and stores models and logs.

### Implementation Location

| Layer | Files / Folders |
| --- | --- |
| Compiler | `backend/app/execution/experiment_compiler.py` |
| Executor | `backend/app/executors/default_experiment_executor.py` |
| Architectures | `backend/app/architectures/` |
| Strategies | `backend/app/strategies/` |
| Repositories | `backend/app/repositories/model_repository.py`, `experiment_log_repository.py` |
| Frontend views | `frontend/views/ModelDetailView.tsx`, `ModelsRankingsView.tsx`, `ExperimentDetailView.tsx` |

### Implementation Explanation

Write five paragraphs. Explain compilation of immutable snapshots and parameter permutations. Explain split-first processing to reduce look-ahead bias. Explain indicator and target strategy resolution. Explain model training and evaluation. Explain model/log persistence and frontend display.

### Pseudocode

```text
PROCEDURE Execute Experiment
  LOAD compiled experiment definition
  REFRESH or LOAD cached BTCUSDT candles
  MATERIALIZE requested interval and date range
  SPLIT data into train, validation, and test partitions
  FOR EACH parameter permutation DO
    BUILD indicators inside each split
    GENERATE targets inside each split
    SCALE features using training data rules
    TRAIN selected architecture on training split
    EVALUATE model on validation and test splits
    RUN long-only trading evaluation
    SAVE model metrics and experiment logs
    UPDATE progress
  ENDFOR
  RETURN execution summary
ENDPROCEDURE
```

### Screenshots / Evidence

> Note: Add screenshots of experiment detail, model ranking, model detail, and log download buttons. Include pseudocode instead of long code snippets because the execution pipeline spans many files.

### Integration

This module integrates with market data, blueprints, experiments, queue/worker execution, model rankings, experiment logs, downloads, and public hub visibility.

---

## 6.5.8 Public Hub, Favorites, Documentation, and Dashboard Module

### Feature / Functionality

These modules provide user-facing discovery and navigation features. The dashboard summarizes activity and data status. Public Hub exposes completed and approved artifacts. Favorites allow users to save models and blueprints. Documentation renders Markdown guide pages.

### Implementation Location

| Feature | Backend Location | Frontend Location |
| --- | --- | --- |
| Dashboard | `backend/app/controllers/dashboard_controller.py` | `frontend/views/DashboardView.tsx` |
| Public Hub | `backend/app/controllers/public_hub_controller.py` | `frontend/views/PublicHubView.tsx` |
| Favorites | favorite repositories and model/blueprint controllers | `frontend/views/FavoritesLibraryView.tsx` |
| Documentation | `backend/app/controllers/documentation_controller.py` | `frontend/views/DocumentationView.tsx` |

### Implementation Explanation

Write three paragraphs. Explain dashboard as the user’s landing area after login. Explain public hub visibility rules: enabled users, completed successful experiments, successful models, and approved blueprints. Explain favorites and documentation as usability and reuse features.

### Pseudocode

No pseudocode is required unless you want to show public hub filtering. If included, use this:

```text
PROCEDURE Load Public Hub
  LOAD enabled users
  LOAD completed experiments
  LOAD models from completed experiments
  LOAD approved blueprints
  APPLY optional search and filter criteria
  RETURN public hub payload
ENDPROCEDURE
```

### Screenshots / Evidence

> Note: Add screenshots of Dashboard, Public Hub, Favorites, and Documentation pages. These are highly suitable for demonstration screenshots because they prove the final user-facing workflow is integrated.

### Integration

These modules integrate with authentication, model and blueprint ownership, experiment status, documentation files, and navigation metadata.

## Final Section Wrap-Up

End 6.5 with a short paragraph explaining that the modules are not isolated; they form a continuous workflow from user authentication to blueprint creation, experiment submission, queue execution, model/log generation, and result discovery.
