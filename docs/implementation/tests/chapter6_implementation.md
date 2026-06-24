# Chapter 6: Implementation

## 6.1 Overview

This chapter describes the implementation of the Bitcoin Experimental Engine (BEE) prototype. The implementation is structured as a web-based research system with a TypeScript/React frontend, a Python/Flask backend, a relational persistence layer, and supporting infrastructure for market data, job queueing, testing, and administrative workflows. The implementation follows the design intent established in the earlier chapters: BEE is a research-time experimentation platform rather than a live trading system.

The implementation evidence used for this chapter is derived from the provided backend and frontend module/test documentation. The backend artefacts show implementation coverage across controllers, services, repositories, strategies, infrastructure adapters, domain objects, schema rules, workers, and scripts. The frontend artefacts show implementation coverage across route wrappers, authentication behaviour, API client behaviour, reusable components, and feature views.

The major implemented areas are:

| Area | Implementation Focus |
| --- | --- |
| Frontend | Route wrappers, authentication guards, application shell, dashboard, charts, Blueprint views, experiment views, model views, Public Hub, system management, and user management. |
| Backend | Flask API controllers, validation services, access control, session management, repositories, unit of work, workers, market-data services, model metrics, and system administration endpoints. |
| Data layer | SQLAlchemy metadata, enum definitions, table/column naming rules, constraints, repositories, and transaction boundaries. |
| Infrastructure | Binance kline client, Redis/RQ job queue adapter, worker execution, market-data CLI scripts, and cache controls. |
| Security | Password hashing, session handling, role-based access control, CSRF protection, parameterized query usage, and protected routes. |
| Testing | 61 backend test files and 25 frontend test files are documented across unit, integration, system, security, data validation, and UI behaviour. |

## 6.2 Implementation Scope

The implemented prototype focuses on the system modules that are required to demonstrate BEE as a secure, role-governed, reproducible research platform. The scope prioritizes authenticated web access, Blueprint governance, experiment configuration, server-side execution boundaries, market-data cache management, and result discovery.

### 6.2.1 Implemented Features

| Feature | Status | Implementation Description |
| --- | --- | --- |
| Authentication and session management | Implemented | Email/password login, registration, server-side sessions, logout, current-user endpoint, session timeout settings, disabled-user blocking. |
| Role-based authorization | Implemented | Normal User, Moderator, and Administrator access boundaries are enforced in backend services and frontend route guards. |
| Staff user management | Implemented | Staff list/search/filter, account creation, status updates, admin role assignment, password reset, username update, deletion, and audit access. |
| Blueprint authoring | Implemented | Draft Blueprint creation, validation, indicator configuration, parameter range validation, architecture metadata validation, and persistence. |
| Blueprint versioning | Implemented | Never-submitted drafts update in place; reviewed Blueprints produce new lineage-preserving versions. |
| Blueprint moderation | Implemented | Approval request, queue listing, approve, reject, and disapprove flows are implemented for staff. |
| Blueprint libraries and favorites | Implemented | Owned/favorited Blueprint listings, detail access, favorite/unfavorite behavior, and visibility rules. |
| Experiment creation boundary | Implemented | Experiment configuration validation, Blueprint option selection, ownership checks, split validation, intervals, override validation, permutation-cap handling, and queue submission. |
| Server-side job queue | Implemented | Redis queue adapter, job metadata, queued/running cancellation, job detail access, and worker success/failure status updates. |
| Market data cache and ingestion | Implemented | BTCUSDT kline client, cached kline repository, refresh service, catch-up/stop/status/clear controls, ingestion scripts, resume and gap repair. |
| Split and target strategies | Implemented | Chronological split, reproducible random split, per-split indicator/target isolation, train-only scaling, target generation, and look-ahead validation. |
| Model metrics and logs | Implemented | Backtest metrics, Sharpe, confusion metrics, continuous metrics, round logs, reproducibility logs, long-only trading semantics, and model ranking queries. |
| Public Hub | Implemented | Public hub visibility/search and public profile responses that hide private artifacts. |
| Frontend application shell | Implemented | Responsive shell, navigation, status badges, loading/error/empty states, dialog behavior, and major authenticated route wrappers. |
| Frontend feature views | Implemented | Dashboard, charts, Blueprint wizard/library/moderation, experiment wizard/detail/list, model rankings/detail, public hub, documentation, system management, and user management views. |
| Documentation viewer | Implemented | Authenticated Markdown documentation list/detail endpoint and frontend rendering. |

The implemented functionality can be summarized through the following module-level workflow:

```text
user opens frontend route
frontend route guard checks authentication and role
frontend view collects form input
API client attaches credentials and CSRF token for unsafe requests
Flask controller validates request
service layer applies business rules
repository layer persists or retrieves data through unit of work
worker or queue layer handles asynchronous experiment tasks where required
frontend receives normalized JSON response
view renders success, error, loading, or empty state
```

### 6.2.2 Implementation Boundary

The prototype implements the research and governance boundary of BEE. It does not implement a live trading product, an exchange execution engine, or a production deployment service.

| Boundary Item | Implemented Behaviour | Excluded Behaviour |
| --- | --- | --- |
| Market data | BTCUSDT kline retrieval, cache persistence, refresh, metadata, gap handling, and preview endpoints. | Live exchange order-book streaming, tick-level execution, and multi-asset portfolio ingestion are not treated as core implementation scope. |
| Experiment execution | Experiment validation, Blueprint compilation, queue submission, job state management, worker handling, and deterministic pipeline boundaries. | Unbounded distributed parameter search and production-grade parallel compute orchestration are outside the prototype boundary. |
| Trading logic | Long-only evaluation semantics, metrics, logs, confusion statistics, and backtest-compatible result handling. | Real order placement, brokerage connectivity, slippage-rich live execution, and automated portfolio management are excluded. |
| Public discovery | Authenticated Public Hub visibility for public users, experiments, models, and approved Blueprints. | Unauthenticated public internet publication and external community platform integration are excluded. |
| Security | Application-level authentication, RBAC, CSRF controls, session behaviour, and query-safety rules. | Full penetration testing, managed identity integration, and enterprise security operations are outside the prototype boundary. |
| Deployment | Local development setup for backend, frontend, database, and workers. | Cloud autoscaling, managed observability, and high-availability production deployment are not required for the prototype. |

## 6.3 Development Environment

### 6.3.1 Programming Languages Used

| Language | Used In | Purpose |
| --- | --- | --- |
| Python | Backend | Flask API implementation, domain services, repositories, workers, strategies, market data scripts, and pytest test suites. |
| TypeScript / TSX | Frontend | React views, reusable UI components, route guards, API client wrappers, chart components, and Jest/Testing Library tests. |
| SQL | Database | Relational constraints, schema validation, migrations, repository queries, and PostgreSQL-specific projection behaviour. |
| Markdown | Documentation | System documentation content and report-facing implementation/test descriptions. |
| Text pseudocode | Test documentation | Human-readable representation of test logic and implementation verification boundaries. |

### 6.3.2 Frameworks and Libraries

| Framework / Library | Layer | Implementation Role |
| --- | --- | --- |
| Flask | Backend presentation layer | Provides API routing, controller endpoints, JSON request/response handling, and middleware integration. |
| SQLAlchemy | Data access layer | Defines ORM metadata, entity mappings, repositories, unit-of-work patterns, constraints, and enum persistence. |
| PostgreSQL | Database | Stores users, Blueprints, experiments, models, logs, favorites, market-data cache rows, system settings, and event records. |
| Redis / RQ | Infrastructure layer | Supports asynchronous job queueing, metadata storage, cancellation, and worker execution. |
| pytest | Backend testing | Verifies controllers, services, repositories, domain objects, infrastructure adapters, strategies, and workers. |
| Next.js / React | Frontend | Implements route-based pages, feature views, component rendering, and application shell. |
| Jest | Frontend testing | Executes frontend unit and component tests. |
| Testing Library | Frontend testing | Verifies UI behaviour through user-facing rendering and interaction semantics. |
| lightweight-charts | Frontend visualization | Displays BTCUSDT candlestick chart behaviour in the dashboard and chart components. |
| D3 mock | Frontend testing | Provides safe no-op chart helper behaviour during tests that import D3-dependent helpers. |
| TA-Lib / indicator abstractions | Feature engineering | Supports technical indicator computation and indicator metadata behaviour tested by strategy modules. |

### 6.3.3 IDEs and Tools

| Tool | Purpose |
| --- | --- |
| Visual Studio Code or equivalent IDE | Code editing, terminal execution, TypeScript/Python development, and file navigation. |
| Git | Version control for backend, frontend, tests, and documentation. |
| Terminal / shell | Running backend, frontend, migration, test, and worker commands. |
| Python virtual environment | Isolates backend dependencies. |
| Node package manager | Installs frontend dependencies and runs Jest/Next.js scripts. |
| Database client | Creates database, applies migrations, and inspects schema state. |
| Redis server | Provides queue and job metadata infrastructure. |
| Browser developer tools | Inspect frontend routing, cookies, network requests, CSRF headers, and responsive UI behaviour. |

### 6.3.4 Operating System Used

The implementation is suitable for a local development environment using a modern desktop operating system with Python, Node.js, PostgreSQL, and Redis support. A Unix-like shell is preferred for command consistency, but the implementation can be adapted to Windows, macOS, or Linux as long as the required services are available.

| Environment Component | Expected Local Capability |
| --- | --- |
| Backend runtime | Python interpreter with installed backend dependencies. |
| Frontend runtime | Node.js environment capable of running the frontend development server and Jest tests. |
| Database | PostgreSQL instance available on a configured host and port. |
| Queue | Redis instance available for job queueing and metadata storage. |
| Browser | Modern desktop browser for testing frontend views, route guards, and responsive layout behaviour. |

## 6.4 System Architecture Implementation

BEE is implemented as a layered web application. Each layer has a clear responsibility so that presentation logic, business logic, persistence, infrastructure, and worker execution remain separated.

| Layer | Primary Responsibility | Representative Implemented Modules |
| --- | --- | --- |
| Frontend presentation layer | Render routes, forms, charts, navigation, and feature views. | DashboardView, LoginView, RegistrationView, BlueprintWizardView, ExperimentWizardView, ModelsRankingsView, PublicHubView, SystemManagementView. |
| Backend presentation layer | Expose HTTP endpoints and translate requests into service calls. | Authentication controller, user controller, Blueprint controller, experiment controller, job controller, market-data controller, model controller, public-hub controller, system controller. |
| Business logic layer | Apply validation, authorization, state transitions, compilation, versioning, metrics, and workflow rules. | AccessControlService, SessionService, BlueprintValidator, VersioningService, ExperimentValidator, ExperimentCompiler, MarketDataService, QueueService. |
| Data access layer | Persist and retrieve relational objects with transaction boundaries. | UserRepository, BlueprintRepository, ExperimentRepository, ModelRepository, ExperimentLogRepository, MarketDataRepository, FavoritesRepository, UnitOfWork. |
| Infrastructure layer | Communicate with external or supporting systems. | BinanceKlineClient, RedisJobQueue, market-data CLI scripts, worker handlers, queue metadata adapter. |
| Worker layer | Execute asynchronous jobs and update persistent experiment/job state. | ExperimentWorker, cancellation strategy, queue detail services. |

### 6.4.1 Frontend Presentation Layer

The frontend presentation layer implements the user interface and the route-level interaction model. It is responsible for rendering pages, collecting form input, displaying validation errors, and invoking backend APIs through client wrappers. It also protects routes using authentication and role guards.

Key frontend responsibilities include:

| Responsibility | Implementation Behaviour |
| --- | --- |
| Route protection | Authenticated pages use route guards; staff-only pages use role guards. |
| Navigation | The application shell displays role-aware navigation items and staff/admin dropdowns. |
| Form handling | Login, registration, Blueprint wizard, experiment wizard, and user-management forms validate input before submission. |
| Feature views | Blueprint, experiment, model, Public Hub, dashboard, documentation, and system-management pages render backend data. |
| Error handling | Views support loading, error, empty, and normal content states. |
| Visualization | BTCUSDT chart rendering uses a chart component with loading, error, empty, update, and cleanup behaviour. |

Frontend route guard pseudocode:

```text
function RequireAuth(route):
    current_user = useAuth()
    if current_user is missing:
        redirect to login with next path
    else:
        render route children

function RequireRole(required_role):
    current_user = useAuth()
    if current_user role is below required_role:
        redirect to fallback route
    else:
        render protected component
```

### 6.4.2 Backend Presentation Layer

The backend presentation layer is implemented through Flask API controllers. Controllers are responsible for receiving HTTP requests, checking authentication context, validating payloads, invoking services, and returning normalized JSON responses.

| Controller Area | Implemented Responsibilities |
| --- | --- |
| Authentication controller | Registration, login, logout, current-user endpoint, duplicate rejection, disabled-user blocking, session cookie behaviour. |
| User controller | Profile endpoints, staff listing/filtering, audit access, user creation, status updates, role changes, username updates, password reset, deletion. |
| Blueprint controller | Draft creation, detail access, favorite/unfavorite, library listing, validation errors, staff visibility to moderation detail. |
| Blueprint approval controller | Approval request, moderation queue, approve, reject, disapprove, invalid transition rejection. |
| Experiment controller | Blueprint options, experiment creation, validation, queue errors, concurrency limits, ownership, date parsing, status normalization. |
| Job controller | Job detail access, unauthorized blocking, cancellation, accessible job listing. |
| Market-data controller | BTCUSDT kline access, target preview, metadata, catch-up status, stop, clear protection. |
| Model controller | Model detail privacy, rankings, filters, highlights, pagination, metric sorting. |
| Public Hub controller | Public hub visibility, search, and public profiles that omit private artifacts. |
| System controller | Queue snapshot, settings, system events, request tracing, global event feed, event CSV download. |

Controller request pseudocode:

```text
receive HTTP request
load authenticated session context
reject request if authentication is required and missing
parse and validate JSON payload or query parameters
check role and ownership permissions
call service or repository through unit of work
map domain result to response DTO
return JSON response with status code
```

### 6.4.3 Business Logic Layer

The business logic layer contains the rules that should not be embedded directly in controllers or UI components. It handles validation, access control, versioning, compilation, market-data refresh behaviour, queue orchestration, and metric-related processing.

| Service / Logic | Implemented Behaviour |
| --- | --- |
| Access control service | Role helpers, owner profile access, staff access, user-management permission matrix, assignable-role matrix. |
| Session service | Session creation, expiry purge, zero-timeout non-expiring session behaviour. |
| Blueprint validator | Validates scalers, custom indicators, missing names, unsupported indicators, invalid ranges, unsupported architecture, invalid settings, and multiple errors. |
| Versioning service | Updates never-submitted drafts in place and creates new version rows for reviewed Blueprints. |
| Experiment validator | Validates required fields, date ordering, split totals, intervals, Blueprint accessibility, staff access, overrides, and candlestick mode. |
| Experiment compiler | Merges overrides, creates deterministic permutation plans and hashes, preserves immutability, parses CSV/list/range values, and applies permutation caps. |
| Market data service | Validates refresh ranges, delegates to Binance client, persists fetched data, handles fetch/persistence failures, and exposes cached timestamp accessors. |
| Queue service | Delegates supported jobs to queue provider, rejects unsupported job types, reads details, removes jobs, and cancels jobs. |
| Job metadata service | Reads live job metadata and falls back to recent terminal metadata cache until expiry. |
| Metrics and logs logic | Computes or validates backtest fields, Sharpe, confusion metrics, continuous metrics, reproducibility logs, round logs, and long-only trading semantics. |

Blueprint versioning pseudocode:

```text
function update_blueprint(existing_blueprint, updated_payload):
    if existing_blueprint has never been submitted:
        mutate same draft row
        save row
        return same blueprint id

    new_blueprint = copy(existing_blueprint)
    new_blueprint.version = existing_blueprint.version + 1
    new_blueprint.parent_id = existing_blueprint.id
    new_blueprint.original_id = existing_blueprint.original_id or existing_blueprint.id
    new_blueprint.status = DRAFT
    apply updated_payload to new_blueprint
    persist new_blueprint
    return new blueprint id
```

Experiment compiler pseudocode:

```text
function compile_experiment(blueprint, experiment_overrides):
    snapshot = deep_copy(blueprint.configuration)
    validate all override keys are allowed
    merge override values into snapshot without mutating original blueprint
    expand fixed values, allowed values, ranges, and comma-separated values
    generate Cartesian product of all parameter dimensions
    if permutations exceed configured cap:
        clamp or reject according to configuration
    for each permutation:
        compute deterministic permutation hash
    return compiled manifest and permutation plan
```

### 6.4.4 Data Access Layer

The data access layer uses repositories and a unit-of-work abstraction. Repositories isolate query logic from controllers and services. The unit of work ensures that related writes are committed together or rolled back together.

| Repository | Main Implementation Role |
| --- | --- |
| UserRepository | CRUD, lookup by id/email/username, search filters, count filters, status updates, and role updates. |
| BlueprintRepository | Add/get/list Blueprints, list by owner, access detail records, and support workflow operations. |
| ExperimentRepository | Add/get/list experiments, update queued/running/completed/failed/cancelled state, timestamps, progress, and current-stage truncation. |
| ModelRepository | Add/get/list model artifacts by experiment. |
| ExperimentLogRepository | Persist and list structured metrics/log payloads by experiment, model, and type. |
| MarketDataRepository | Upsert BTCUSDT klines, retrieve ordered ranges, handle inserted/updated counts, and validate intervals. |
| FavoritesRepositories | Add, list, exists, and remove favorite model/Blueprint links. |
| UnitOfWork | Commit on successful operation and rollback on exception. |

Unit-of-work pseudocode:

```text
with UnitOfWork() as uow:
    repository = uow.repository
    repository.add(entity)
    if operation succeeds:
        commit transaction
    else:
        rollback transaction
        raise error
```

### 6.4.5 Infrastructure Layer

The infrastructure layer connects BEE to supporting services such as Binance data access, Redis queueing, and command-line market data scripts.

| Infrastructure Component | Implemented Behaviour |
| --- | --- |
| Binance kline client | Normalizes raw kline rows, validates symbol/interval/date range, paginates API responses, handles UTC timestamps, retries transient failures, and rejects malformed rows. |
| Redis job queue | Enqueues jobs, records job ID and queue position, writes metadata, maps Redis failures to queue errors, normalizes raw job states, and formats job details. |
| Market-data CLI scripts | Refresh data, ingest chunked windows, handle failures, resume from cache, reconcile gaps, repair gaps, validate date ranges, and preserve users/klines during cleanup. |
| Experiment worker | Validates payloads, handles missing experiment rows, runs executor success path, accepts dictionary results, and marks failed status on executor errors. |
| Cancellation strategy | Cancels queued and running experiment jobs and handles idempotent repeated cancellation requests. |

Queue submission pseudocode:

```text
function submit_experiment_run(user, validated_config):
    experiment = ExperimentRepository.add(validated_config)
    job_spec = JobSpecification(type="experiment", experiment_id=experiment.id)
    queue_result = QueueService.enqueue(job_spec)
    ExperimentRepository.mark_queued(experiment.id, queue_result.job_id)
    return experiment id, job id, queue position
```

### 6.4.6 Overall Project Structure

A representative project structure is shown below. The exact filenames may differ from the final repository, but the structure reflects the implemented responsibilities documented in the attached implementation/test artefacts.

```text
bee/
├── backend/
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── authentication_controller.py
│   │   │   ├── user_controller.py
│   │   │   ├── blueprint_controller.py
│   │   │   ├── blueprint_approval_controller.py
│   │   │   ├── experiment_controller.py
│   │   │   ├── job_controller.py
│   │   │   ├── market_data_controller.py
│   │   │   ├── model_controller.py
│   │   │   ├── public_hub_controller.py
│   │   │   └── system_controller.py
│   │   ├── domain/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── strategies/
│   │   ├── infrastructure/
│   │   ├── workers/
│   │   └── scripts/
│   └── tests/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── views/
│   ├── lib/
│   └── tests/
└── docs/
```

## 6.5 Database Implementation

### 6.5.1 Database Schema Overview

The database implementation supports authentication, governance, experiments, model artifacts, logs, favorites, market-data cache records, queue/system metadata, and event/audit records. Tests verify schema constraints, enum definitions, table names, column names, primary keys, foreign keys, unique constraints, and check constraints.

| Schema Concern | Implemented Control |
| --- | --- |
| Primary keys | Each required table exposes a primary key according to the expected ERD. |
| Foreign keys | Relationship columns target exact referenced tables and columns. |
| Unique constraints | Uniqueness rules are verified for identity and relationship constraints. |
| Check constraints | Business-rule constraints are represented at the database schema level where applicable. |
| Enums | Role, user status, Blueprint approval, interval, and experiment/job status values are verified against expected literals. |
| Naming convention | Strict table set and PascalCase column naming conventions are verified; snake_case table names are rejected by schema tests. |

### 6.5.2 Entity-to-Table Mapping

| Entity | Likely Table / Persistence Object | Core Stored Data | Relationships |
| --- | --- | --- | --- |
| User | Users | Email, username, password hash, role, status, timestamps. | Owns Blueprints, experiments, favorites, and profile/audit records. |
| Blueprint | Blueprints | Owner, status, version, parent reference, original reference, structured configuration document. | Owned by user; referenced by experiments; favorited by users. |
| Experiment | Experiments | Owner, Blueprint reference, dataset settings, interval, date range, split ratios, status, progress, queue metadata. | Owns generated models and logs. |
| Model | Models | Experiment reference, architecture, metrics, parameters, artifact fields. | Belongs to experiment; appears in rankings and favorites. |
| ExperimentLog | ExperimentLogs | Experiment/model reference, log type, structured metrics payload, timestamp. | Belongs to experiment and optionally model. |
| BTCUSDTKline | BTCUSDTKlines | Timestamp, open, high, low, close, volume, interval, created/updated metadata. | Used by market-data queries and experiment execution. |
| FavoriteModel | FavoriteModels | User ID, model ID, timestamp. | Links users to saved model artifacts. |
| FavoriteBlueprint | FavoriteBlueprints | User ID, Blueprint ID, timestamp. | Links users to saved Blueprints. |
| SystemEvent | SystemEvents | Event type, actor, scope, payload, timestamp. | Supports audit and system-management event feeds. |
| Session / Session metadata | Session storage | Session ID, user ID, expiry metadata. | Supports authenticated server-side session management. |

### 6.5.3 Migration and Schema Implementation

Schema implementation is validated through tests that inspect metadata rather than relying only on manual review. This reduces mismatch between the ERD and the actual database model.

```text
load SQLAlchemy metadata
for each expected table:
    assert table exists
    assert required columns exist
    assert primary key exists
    assert foreign keys target expected tables and columns
    assert unique constraints exist
    assert check constraints exist
for each enum:
    assert stored enum literals match ERD literals
```

Migration implementation should follow this sequence:

| Step | Action | Expected Result |
| --- | --- | --- |
| 1 | Create database and configure connection string. | Backend can establish SQLAlchemy session. |
| 2 | Apply migration scripts or metadata-generated schema. | All expected tables and constraints exist. |
| 3 | Run schema naming tests. | Table set and PascalCase column conventions match expected contract. |
| 4 | Run schema enum tests. | Role, status, approval, interval, and job/experiment status literals match the ERD. |
| 5 | Run repository tests. | CRUD and transaction behaviour confirm that mappings work correctly. |

### 6.5.4 Repository and Unit of Work Implementation

The repository pattern is used to keep persistence logic out of controllers and business services. The unit-of-work pattern groups related operations and controls transaction commit/rollback behaviour.

| Implementation Aspect | Description |
| --- | --- |
| Repository add/get/list | Repositories expose focused methods such as add, get by ID, list by owner, list by experiment, and list with filters. |
| Status transitions | Experiment repositories expose helpers for queued, running, completed, failed, and cancelled states. |
| Relationship handling | Experiment logs and models persist with relationships to experiments and users. |
| Favorites handling | Favorite repositories add, check, list, and remove many-to-many user-to-artifact links. |
| Market-data upsert | Market-data repository handles inserted/updated counts and preserves CreatedAt when candle rows are updated. |
| Transaction boundaries | UnitOfWork commits on normal exit and rolls back when exceptions occur. |

Repository pseudocode:

```text
class ExperimentRepository:
    function add(experiment):
        session.add(experiment)

    function get_by_id(experiment_id):
        return session.query(Experiment).filter(id == experiment_id).one_or_none()

    function mark_running(experiment_id, stage):
        experiment = get_by_id(experiment_id)
        experiment.status = RUNNING
        experiment.current_stage = truncate(stage)
        experiment.started_at = now()

    function mark_completed(experiment_id, metrics):
        experiment = get_by_id(experiment_id)
        experiment.status = COMPLETED
        experiment.completed_at = now()
        experiment.summary_metrics = metrics
```

### 6.5.5 Data Integrity Controls

| Integrity Control | Implemented Purpose |
| --- | --- |
| Primary and foreign keys | Prevent orphan records and preserve relationships among users, Blueprints, experiments, models, logs, and favorites. |
| Unique constraints | Prevent duplicate usernames, duplicate emails, duplicate favorites, and duplicate market-data rows where applicable. |
| Check constraints | Enforce domain rules such as allowed split ratios, valid statuses, and bounded configuration values where represented in the database. |
| Enum-backed columns | Restrict roles, statuses, approval states, and interval values to known literals. |
| Transaction isolation | Protect critical writes such as experiment creation and state transitions. |
| Upsert semantics | Allow market-data rows to be inserted or updated without producing duplicate candle records. |
| Deterministic ordering | Range retrieval for klines returns rows in timestamp order for reproducible downstream processing. |

## 6.6 Frontend Implementation

### 6.6.1 Application Routing

The frontend implements route-based screens for authentication, dashboard access, Blueprint management, experiments, models, Public Hub, documentation, jobs, and system administration. Route wrappers enforce whether a page is public, authenticated, or role-protected.

| Route Category | Example Views | Access Boundary |
| --- | --- | --- |
| Public routes | Login, registration, guest navigation. | Accessible without a current user. |
| Authenticated routes | Dashboard, experiments, models, Public Hub, documentation, user profile. | Require logged-in user. |
| Staff routes | User management, Blueprint moderation, system management. | Require Moderator or Administrator depending on operation. |
| Admin-specific routes | System settings, role assignment, destructive user operations. | Require Administrator permission. |
| Detail routes | Blueprint detail, experiment detail, model detail, job detail. | Require ownership, public visibility, or staff permission depending on artifact. |

### 6.6.2 Authentication Provider and Route Guard Implementation

The authentication provider maintains current-user state and exposes login, logout, refresh, and role-check behaviour to route guards and navigation components.

```text
on application load:
    call current-user endpoint
    if response has authenticated user:
        store user in auth context
    else:
        store anonymous state

on protected route:
    if auth context is loading:
        render loading state
    else if user is missing:
        redirect to login
    else:
        render protected view
```

### 6.6.3 Navigation and Application Shell

The application shell renders navigation links according to user status and role. It includes a topbar, sidebar or responsive navigation layout, sign-out handling, and staff/admin visibility rules.

| Navigation Behaviour | Implementation Detail |
| --- | --- |
| Authenticated navigation | Shows dashboard and feature links after login. |
| Guest navigation | Shows public navigation and authentication actions. |
| Role filtering | Hides protected navigation items from users without the required role. |
| Admin dropdown | Visible to staff/admin users where system management options are allowed. |
| Sign out | Calls logout flow and routes the user back to login. |

### 6.6.4 UI Component Implementation

Reusable UI components are used to standardize layout, status display, wizard progress, dialog interactions, and loading/error/empty states.

| Component Type | Purpose |
| --- | --- |
| BaseView | Provides shared title/content/loading/error layout structure. |
| EmptyState | Displays default or custom empty content messages. |
| LoadingState | Displays default or custom loading messages. |
| StatusBadge | Maps statuses to consistent labels and visual tones. |
| UserRoleBadge | Normalizes role display for Admin, Moderator, and User. |
| UserStatusBadge | Normalizes enabled/disabled status display. |
| WizardView | Displays current, completed, and upcoming steps with summary and footer slots. |
| Dialog components | Support confirmation and open/close interactions. |
| Responsive shell | Provides responsive layout classes for different screen sizes. |

### 6.6.5 Registration and Login Views

The registration and login views implement validation, submission, backend error display, and redirect behaviour.

```text
registration form submit:
    validate email, username, password, and confirmation
    if invalid:
        show inline errors
        block submit
    else:
        call register endpoint
        on success redirect to login
        on failure show backend validation errors

login form submit:
    validate email and password
    call login endpoint
    refresh current user
    redirect to dashboard
```

### 6.6.6 User Management and Profile Views

User management views implement staff-specific user administration. The UI hides actions from unauthorized roles and exposes different action sets to moderators and administrators.

| Actor | Visible User Management Behaviour |
| --- | --- |
| Normal User | Staff-only actions are hidden. |
| Moderator | Can perform limited staff actions such as normal-user creation and account status management. |
| Administrator | Can access the full user-management action set including role, password, username, and deletion workflows. |
| Staff user | Can open audit trail and review user-related events where permitted. |

### 6.6.7 Dashboard and Module Landing Pages

The dashboard provides module entry points, quick actions, BTCUSDT interval selection, chart rendering, loading states, and fallback live statistics.

| Dashboard Element | Implemented Behaviour |
| --- | --- |
| Dashboard cards | Show key system or module summaries. |
| Quick links | Provide direct navigation to major workflows. |
| BTCUSDT interval selector | Updates chart hook arguments when changed. |
| Price chart | Displays loading, error, empty, and candle states. |
| Fallback statistics | Displays safe values when live statistics are unavailable. |

### 6.6.8 Blueprint Wizard Implementation

The Blueprint wizard guides users through Blueprint creation, validation, and submission. It uses backend metadata to constrain parameter input.

```text
load Blueprint metadata
initialize wizard steps
for each step:
    validate required fields before next step
    display inline validation errors
on parameter input:
    tokenize list/range values
    validate against metadata constraints
on submit:
    call create Blueprint API
    if success:
        navigate to Blueprint detail
    if backend validation fails:
        display field-level errors
```

### 6.6.9 Blueprint Library and Detail Views

The Blueprint library supports owned and favorited tabs. The detail view renders status, lineage, and favorite state. Owners can edit draft or rejected Blueprints where allowed, and staff users can access moderation-related detail screens.

| View | Implemented Behaviour |
| --- | --- |
| Owned tab | Displays Blueprints owned by the current user. |
| Favorited tab | Displays Blueprints saved by the current user. |
| Detail view | Displays status, lineage, configuration, and favorite toggle. |
| Owner action | Allows valid edit/submission actions according to Blueprint state. |
| Favorite action | Persists favorite/unfavorite state. |

### 6.6.10 Blueprint Moderation View

The moderation view renders pending Blueprints and exposes staff actions for approve, reject, and disapprove workflows.

```text
load moderation queue
for each pending Blueprint:
    display owner, title, status, and summary
staff selects action:
    if approve:
        call approve endpoint
    if reject:
        call reject endpoint with reason where required
    if disapprove approved Blueprint:
        call disapprove endpoint
refresh queue after action
```

### 6.6.11 Experiment Wizard Boundary

The experiment wizard is implemented around configuration, preview, validation, and submission. It covers dataset preview, reused model prefill, Blueprint selection, grouped overrides, split controls, deterministic seed, target preview, permutation cap warnings, and backend field errors. This wizard currently represents the experiment creation boundary rather than a full live-trading workflow.

| Wizard Area | Implemented Behaviour |
| --- | --- |
| Dataset preview | Shows cached data bounds and preview state. |
| Model reuse prefill | Reads query parameters or model reuse context to prefill configuration where applicable. |
| Blueprint selection | Loads accessible Blueprint options and preview details. |
| Target preview | Applies target preview parameters and displays derived labels/statistics. |
| Overrides | Normalizes and validates grouped override values. |
| Split controls | Allows train/validation/test split configuration and deterministic seed input. |
| Permutation cap | Warns or clamps when generated permutations exceed configured caps. |
| Submit | Calls experiment creation endpoint and navigates to detail on success. |

### 6.6.12 API Client and Frontend-Backend Integration

The API client centralizes HTTP behaviour, credential inclusion, CSRF handling, request serialization, and response error handling.

```text
function apiPost(url, payload):
    csrf = fetchCsrfToken()
    send request with:
        method = POST
        credentials = include
        X-CSRFToken = csrf
        body = JSON.stringify(payload)
    if response is not ok:
        parse JSON error
        throw typed frontend error
    return parsed JSON
```

### 6.6.13 Market Chart Visualization Boundary

The BTCUSDT chart component handles candlestick rendering and incremental updates. It is tested through a mocked chart library so the component can be validated without relying on real DOM chart internals.

| Chart State | Implemented Behaviour |
| --- | --- |
| Loading | Displays loading state while candle data is fetched. |
| Error | Displays error state when data loading fails. |
| Empty | Displays empty state when no candle data is available. |
| Data rendering | Sends candlestick data to the chart series. |
| Incremental update | Updates the latest bar when new candle data arrives. |
| Cleanup | Removes chart resources on unmount. |

## 6.7 Backend Implementation

### 6.7.1 Flask API Structure

The backend exposes route groups that correspond to system modules. Each group is responsible for a coherent set of endpoints and delegates business logic to services.

| API Group | Implementation Responsibility |
| --- | --- |
| Authentication API | Register, login, logout, current-user lookup. |
| User API | Profile, staff listing, filtering, audit, create, update, disable, role change, delete. |
| Blueprint API | Draft, detail, validation, library, favorites, approval workflow. |
| Experiment API | Options, create, list, detail, validation, queue integration. |
| Job API | Detail, list, cancellation, access checking. |
| Market Data API | Klines, metadata, target preview, catch-up, stop, clear. |
| Model API | Model detail, ranking, sorting, filtering, highlights. |
| Public Hub API | Public discovery and public profile. |
| System API | Queue snapshot, settings, events, request tracing, CSV export. |

### 6.7.2 Configuration and Database Session Setup

Configuration centralizes database connectivity, session timeout, queue settings, concurrency limits, and security-related flags. Database session setup provides scoped sessions to repositories and unit-of-work instances.

```text
load environment configuration
create SQLAlchemy engine
create session factory
on request or unit-of-work start:
    open database session
on successful operation:
    commit
on exception:
    rollback
finally:
    close session
```

### 6.7.3 Authentication and Session Management

Authentication implements registration, credential verification, session creation, session persistence, current-user lookup, disabled-account blocking, and logout.

| Authentication Step | Implementation Detail |
| --- | --- |
| Register | Validate email, username, password; reject duplicate email/username; hash password; return safe user DTO. |
| Login | Verify email/password; reject invalid credentials; reject disabled users; create session cookie. |
| Current user | Read session; return safe authenticated user if valid. |
| Session timeout | Support configured timeout and zero-timeout non-expiring sessions. |
| Logout | Invalidate session and allow idempotent logout behaviour. |

### 6.7.4 Access Control and Role-Based Authorization

Access control logic is centralized so that controllers do not duplicate permission rules.

```text
function can_manage_user(actor, target, action):
    if actor.role == Administrator:
        return true
    if actor.role == Moderator:
        return action in ["create_normal_user", "enable_disable_normal_user"] and target.role == NormalUser
    return false

function can_access_artifact(actor, artifact):
    if artifact.owner_id == actor.id:
        return true
    if artifact.is_public:
        return true
    if actor.role in [Moderator, Administrator] and artifact.is_staff_visible:
        return true
    return false
```

### 6.7.5 User Controller and Staff User Management

The user controller implements profile endpoints, staff list/filter views, audit access, status changes, password reset, role changes, username updates, deletion, and create-user validation.

| Operation | Permission Boundary |
| --- | --- |
| View own profile | Allowed for authenticated owner. |
| View other profile | Allowed for staff where permitted. |
| List users | Staff-only. |
| Create user | Staff-only; moderator limited to Normal User creation. |
| Change status | Staff-only; moderator limited by target role. |
| Reset password | Administrator-only. |
| Change role | Administrator-only with assignable-role matrix. |
| Delete user | Administrator-only. |
| View audit | Staff-only. |

### 6.7.6 Blueprint Validation and Draft Persistence

Blueprint validation checks structural and semantic rules before persistence. It returns multiple field-level errors without crashing when invalid sections are encountered.

```text
function validate_blueprint(payload):
    errors = []
    if scaler unsupported:
        errors.add("scaler")
    for indicator in payload.indicators:
        if name missing or unsupported:
            errors.add("indicator.name")
        if range invalid:
            errors.add("indicator.range")
    if architecture unsupported:
        errors.add("architecture")
    if section is not object:
        errors.add("section")
    return ValidationResult(errors)
```

### 6.7.7 Blueprint Detail, Library, and Favorite Workflow

Blueprint detail and library endpoints enforce visibility boundaries and support favorites.

| Workflow | Backend Behaviour |
| --- | --- |
| Get detail as owner | Allowed for all owner-owned Blueprint states. |
| Get detail as public user | Allowed for public/approved Blueprints only. |
| Get detail as staff | Allowed for moderation-visible states. |
| List owned | Returns current user's Blueprints. |
| List favorited | Returns Blueprints favorited by current user and visible to them. |
| Favorite | Persists favorite link. |
| Unfavorite | Removes favorite link. |

### 6.7.8 Blueprint Versioning Service

The versioning service preserves immutable lineage once a Blueprint has entered the review lifecycle.

```text
if blueprint.status == DRAFT and blueprint.never_submitted:
    update current row
else:
    create new row
    copy previous configuration
    set parent reference
    set original reference
    increment version
    status = DRAFT
```

### 6.7.9 Blueprint Approval and Moderation

Moderation endpoints implement state transitions and reject invalid transitions.

| Current State | Action | Next State / Result |
| --- | --- | --- |
| DRAFT | Submit for approval | PENDING |
| PENDING | Approve | APPROVED |
| PENDING | Reject | REJECTED |
| APPROVED | Disapprove | REJECTED plus new editable DRAFT version for owner remediation |
| PENDING | Disapprove | Rejected as invalid transition |

### 6.7.10 Experiment Blueprint Option Endpoint

The experiment Blueprint option endpoint lists accessible Blueprints for experiment creation. It supports filters, sorting, paging, favorites, and permission boundaries.

```text
function list_blueprint_options(actor, filters):
    base = Blueprints visible to actor
    apply status filters
    apply search filters
    apply sorting
    apply pagination
    annotate favorite state
    return options
```

### 6.7.11 Domain Models and Value Objects

Domain models represent persistent business entities, while value objects represent non-persistent command/result structures.

| Domain Object | Purpose |
| --- | --- |
| User | Identity, credentials, role, and status. |
| Blueprint | Versioned pipeline specification and approval state. |
| Experiment | Configuration, owner, execution state, and progress. |
| Model | Generated model artifact, architecture, metrics, and parameters. |
| ExperimentLog | Structured metrics and log payload. |
| BTCUSDTKline | Market-data candle record. |
| FavoriteModel / FavoriteBlueprint | User-to-artifact saved links. |
| ValidationResult | Success/failure validation helper. |
| ExecutionResult | Execution outcome helper. |
| JobSpecification | Queue job request object. |
| QueuePosition | Queue position representation. |

### 6.7.12 Repository and Unit of Work Usage

Repositories are injected into service or controller workflows through the unit-of-work abstraction. This allows operations to remain transactional.

```text
function create_experiment(actor, payload):
    with UnitOfWork() as uow:
        validation = ExperimentValidator.validate(actor, payload)
        if validation.has_errors:
            return validation errors

        experiment = ExperimentRepository.add(payload)
        compiled_plan = ExperimentCompiler.compile(payload.blueprint, payload.overrides)
        job = QueueService.enqueue(experiment.id, compiled_plan)
        ExperimentRepository.mark_queued(experiment.id, job.id)
        uow.commit()
    return experiment and job response
```

## 6.8 Security Implementation

### 6.8.1 Authentication Security

Authentication security is implemented through password hashing, duplicate identity rejection, invalid-login blocking, disabled-user blocking, safe current-user responses, and session-cookie creation.

### 6.8.2 Authorization Security

Authorization security is implemented through role-based access control and ownership checks. Normal users, moderators, and administrators receive different permissions. Backend tests verify permission matrices, and frontend tests verify that unauthorized actions are hidden or redirected.

### 6.8.3 CSRF Protection

Unsafe state-changing operations require CSRF tokens. The frontend API client fetches and attaches the CSRF token, while backend CSRF hardening returns JSON errors for missing tokens and accepts valid tokens.

```text
unsafe request:
    frontend requests csrf token
    frontend attaches X-CSRFToken header
    backend validates token
    if token missing or invalid:
        return JSON CSRF_FAILED
    else:
        process state-changing operation
```

### 6.8.4 Session Protection

Session protection includes session expiry purge, configurable timeout, zero-timeout non-expiring behaviour, logout invalidation, and cookie-based session continuity. Secure deployment should additionally configure HTTP-only cookies, SameSite policy, Secure cookies under HTTPS, and environment-specific secret keys.

## 6.9 Deployment and Configuration

### 6.9.1 Backend Setup

| Step | Command / Action | Purpose |
| --- | --- | --- |
| 1 | Create Python virtual environment. | Isolate backend dependencies. |
| 2 | Install backend dependencies. | Install Flask, SQLAlchemy, pytest, Redis/RQ clients, and supporting libraries. |
| 3 | Set environment variables. | Configure database URL, Redis URL, secret key, session timeout, and concurrency settings. |
| 4 | Run migrations or schema setup. | Create required relational tables and constraints. |
| 5 | Start Flask backend. | Expose API routes for frontend consumption. |

Example backend startup pseudocode:

```text
cd backend
python -m venv .venv
activate .venv
pip install -r requirements.txt
set DATABASE_URL and REDIS_URL
run database migration
flask run
```

### 6.9.2 Frontend Setup

```text
cd frontend
install node dependencies
set API base URL environment variable
run development server
open browser at configured frontend port
```

### 6.9.3 Database Setup

```text
create PostgreSQL database
create application user
grant privileges
apply migrations
run schema tests
verify enums, constraints, and table names
```

### 6.9.4 Worker Setup

```text
start Redis server
start backend API
start worker process
submit experiment job
verify queue metadata and worker state updates
```

### 6.9.5 Network and Port Configuration

| Service | Typical Local Port | Purpose |
| --- | --- | --- |
| Frontend development server | 3000 | Browser-based user interface. |
| Backend Flask API | 5000 | JSON API consumed by frontend. |
| PostgreSQL | 5432 | Relational persistence. |
| Redis | 6379 | Queue and job metadata infrastructure. |

## 6.10 Summary

This chapter described the implemented BEE prototype as a layered web application. The frontend implements route protection, role-aware navigation, reusable UI components, and feature views for authentication, users, Blueprints, experiments, models, Public Hub, documentation, and administration. The backend implements Flask API controllers, validation services, access-control rules, Blueprint governance, experiment configuration, market-data cache operations, model and metrics endpoints, repositories, unit-of-work transactions, Redis queue integration, and worker execution. The implementation remains within the intended research prototype boundary and avoids live trading, brokerage connectivity, and production deployment claims.
