# 6.1 Deployment

The Bitcoin Experimental Engine is implemented as a full-stack web-based system for configuring, executing, monitoring, and reviewing BTCUSDT quantitative research experiments. The implementation converts the analysis and design models into a working application consisting of a browser-facing frontend, a backend API, a relational database, an asynchronous job queue, and a background worker. This deployment structure supports the main project goal of providing a reproducible research environment where users can create reusable experiment templates, submit experiments, track execution progress, and inspect generated model results.

The deployed application separates user interaction from server-side computation. The frontend is implemented as a Next.js web application under `frontend/`, while the backend is implemented as a Flask API under `backend/`. The backend handles authentication, authorization, request validation, persistence, queue orchestration, market-data access, and experiment execution coordination. Long-running experiment processing is delegated to a worker process so that the user interface remains responsive after an experiment is submitted.

The system is deployed locally as a group of cooperating services. PostgreSQL is used as the persistent relational database, Redis is used for queue and supporting runtime infrastructure, the Flask backend exposes JSON APIs, the worker consumes queued experiment jobs, and the Next.js frontend serves the user interface. The startup script under `scripts/` coordinates the local runtime by checking prerequisites and starting the backend, worker, and frontend processes.

## 6.1.1 Implementation Scope

The implementation scope covers the major functional areas required by the system. These include account registration, login, authenticated session handling, role-based access control, staff user management, blueprint authoring, blueprint approval, experiment configuration, market-data retrieval, asynchronous experiment execution, job monitoring, model ranking, experiment log inspection, favorites, public discovery, documentation browsing, and administrative system monitoring.

The system is not implemented as a single monolithic script. Instead, it is organized as a layered web application. The frontend provides route-based pages and reusable interface components. The backend provides controllers, services, validators, repositories, strategies, and worker logic. The database stores durable records, while the queue separates immediate user requests from computationally heavier experiment execution. This structure allows the system to support both interactive workflows and longer-running research jobs.

Table 6.1 summarizes the implemented deployment components and their runtime responsibilities.

**Table 6.1: Deployment Components and Runtime Responsibilities**

| Component | Source Location | Runtime Responsibility | Typical Local Runtime |
| --- | --- | --- | --- |
| Frontend web application | `frontend/` | Serves the browser interface, route entrypoints, views, forms, charts, authentication state, and API client integration | Next.js server on port `3000` |
| Backend API | `backend/app/` | Exposes HTTP API endpoints, validates requests, enforces access control, coordinates services, and manages persistence | Flask server on port `5000` |
| Experiment worker | `backend/app/workers/` and backend worker script | Consumes queued experiment jobs, updates experiment state, executes the experiment pipeline, and persists results | Background backend process |
| PostgreSQL database | configured through `.env` | Stores users, sessions-related records, blueprints, experiments, models, logs, market data, favorites, settings, and events | Database service on port `5432` |
| Redis service | configured through `.env` | Supports queue processing and runtime queue metadata | Redis service on port `6379` |
| Startup orchestration | `scripts/start_app.sh` | Checks required local services and starts the backend, worker, and frontend processes | Shell script |
| Test orchestration | `scripts/test_all.sh` | Runs backend and frontend automated test suites in a repeatable sequence | Shell script |

## 6.1.2 Mapping of Modules to System Objectives

The implemented modules directly support the objectives defined for the system. The authentication and authorization modules support controlled access so that normal users, moderators, and administrators can only perform actions suitable for their role. The blueprint module supports reusable experiment design by allowing users to define, validate, submit, approve, and version experiment templates. The experiment module supports reproducible research by persisting experiment configuration and compiling snapshots before execution.

The asynchronous execution modules support server-side processing of long-running jobs. Instead of training models directly inside a browser request, the system queues an experiment job and allows the worker to process it separately. This improves responsiveness and gives users a job-oriented way to monitor progress. The market-data module supports BTCUSDT candle retrieval and local caching so that charts and experiments can use a consistent data source. The model, log, favorites, and public hub modules support result inspection and reuse after experiments are completed.

Table 6.2 maps the implementation modules to the main system objectives.

**Table 6.2: Implementation Modules Mapped to System Objectives**

| System Objective | Implemented Module Support |
| --- | --- |
| Provide a reproducible BTCUSDT experimentation environment | Experiment compiler, persisted experiment configuration, compiled snapshots, deterministic seed handling, parameter permutations, BTCUSDT market-data cache, and split-first execution flow |
| Allow users to create reusable experiment templates | Blueprint wizard, blueprint validation, blueprint persistence, approval workflow, versioning behavior, and approved blueprint selection in the experiment wizard |
| Enforce controlled user access | Registration, login, logout, current-user session lookup, server-managed sessions, route guards, backend access-control service, and role-specific navigation |
| Support staff governance | Moderator and administrator permissions, blueprint moderation, user-management operations, and administrative system views |
| Execute experiments without blocking the web interface | Queue service, Redis queue adapter, job metadata service, worker process, job detail endpoints, and cancellation handling |
| Provide BTCUSDT market data and visualization | Market-data controller, Binance-compatible kline connector, candle normalization, local upsert cache, metadata endpoints, and BTCUSDT chart components |
| Support result inspection and research reuse | Experiment detail view, model rankings, model detail view, experiment logs, downloads, favorites, and Public Hub browsing |
| Support operational monitoring | System management view, active queue snapshot, settings handling, and system event recording |
| Provide user guidance | Documentation API and Markdown documentation viewer |

## 6.1.3 Deployed Component Interaction

The deployed system follows a clear request and processing flow. A user accesses the application through the browser. The browser loads the Next.js frontend, which renders the appropriate public or authenticated screen. When the user performs an action such as logging in, creating a blueprint, submitting an experiment, or opening a model ranking page, the frontend sends a JSON request to the backend through the configured API path.

The frontend uses the path `/api/backend` as the browser-facing API base. During local deployment, the Next.js configuration rewrites this path to the Flask backend API. The backend then processes the request through its registered controller, calls the relevant service or repository, applies validation and authorization, and returns a structured JSON response. This approach keeps frontend API calls consistent while still allowing the backend to remain a separate service.

When an experiment is submitted, the interaction flow is extended through the queue and worker. The backend first validates the experiment configuration and persists the experiment record. It then queues a background job and immediately returns job metadata to the frontend. The worker later consumes the queued job, loads the experiment, refreshes or reads BTCUSDT market data, executes the experiment pipeline, updates progress, and persists model and log outputs.

The following figure should be included in the final formatted report to illustrate the deployed component interaction.

> Note: Add a deployment interaction diagram here. The diagram should show: Browser -> Next.js Frontend -> Flask API -> PostgreSQL; Flask API -> Redis Queue; Worker -> Redis Queue; Worker -> PostgreSQL; Backend market-data service -> BTCUSDT market-data provider. The diagram should also show that the frontend sends browser API calls through `/api/backend`, while the backend exposes its own `/api` routes.

A text representation of the deployment interaction is shown below.

```text
Browser
  -> Next.js Frontend
      -> /api/backend rewrite
          -> Flask Backend API
              -> PostgreSQL Database
              -> Redis Queue
              -> Market-Data Service
          -> Worker Process
              -> Redis Queue
              -> Experiment Execution Services
              -> PostgreSQL Database
```

## 6.1.4 Local Deployment Flow

The local deployment flow is designed to make the system demonstrable in a development environment. Before the application is started, PostgreSQL and Redis must be available. The backend reads its runtime configuration from `.env`, including the database connection, Redis connection, backend API origin, session settings, and related environment values. The frontend also uses `.env` values to determine how browser API requests should reach the backend.

The backend is started from the `backend/` folder and serves the Flask API. The worker is started as a separate backend process so that it can process queued experiment jobs independently. The frontend is started from the `frontend/` folder and serves the web application. For convenience, the local startup script in `scripts/` performs the main checks and starts the backend, worker, and frontend together.

The typical local startup command is:

```bash
scripts/start_app.sh
```

The startup script checks that required commands are available, verifies that Redis can be reached, confirms that backend and frontend dependencies are installed, verifies that the database configuration exists, starts the backend API, starts the worker, and starts the frontend application. This scripted deployment flow reduces manual setup mistakes and supports repeatable demonstration.

## 6.1.5 Deployment Scope Against User Roles

The deployed system supports different runtime experiences depending on the user role. Guests can view public entry points such as the landing page and authentication screens. Authenticated users can access dashboards, experiments, blueprints, jobs, models, favorites, public hub, documentation, and profile views. Moderators can access staff-level moderation and limited user-management functions. Administrators can access full user-management and system-management functionality.

This role-aware deployment is important because the system includes both research workflows and governance workflows. The same deployed application must support ordinary experiment users, staff reviewers, and administrators without exposing all functions to every account. Frontend route guards improve navigation and usability, while backend access-control checks enforce the actual authorization decisions.

**Table 6.3: Deployed Access Scope by User Role**

| Actor / Role | Deployed Access Scope |
| --- | --- |
| Guest | Landing page, registration, login, and readable public guidance where allowed |
| User | Dashboard, experiment workflow, blueprint workflow, jobs, models, favorites, public hub, documentation, and profile |
| Moderator | User-level features plus blueprint moderation and staff-permitted user-management actions |
| Administrator | Full user-level and moderator-level features plus system management and administrator-only user-management actions |

## 6.1.6 Deployment Evidence to Include

This subsection should be supported by deployment evidence in the final submitted report. The strongest evidence is a combination of a deployment diagram, a component responsibility table, and selected screenshots of the running application. Source-code screenshots are not necessary in this section because deployment is better explained through runtime structure and system composition.

Recommended visual evidence includes:

- A deployment architecture diagram showing frontend, backend, database, Redis, worker, and market-data provider interaction.
- A screenshot of the frontend running in the browser.
- A screenshot of the backend health endpoint or backend terminal showing the API is running.
- A screenshot of the startup script output showing backend, worker, and frontend services starting.
- A screenshot of a submitted experiment or job detail page showing that asynchronous execution is visible from the user interface.

> Note: Avoid showing local secrets, private database connection strings, or credential values in screenshots. If a terminal screenshot contains environment values, crop or mask them before including it in the report.

## 6.1.7 Summary

In summary, the system is deployed as a modular full-stack application rather than as an isolated experimental script. The Next.js frontend provides the user interface, the Flask backend provides the API and business logic, PostgreSQL provides durable persistence, Redis supports asynchronous queue processing, and the worker executes long-running experiments in the background. The deployment structure supports the project requirements for reproducibility, role-based access, asynchronous execution, result inspection, and administrative monitoring.

This deployment arrangement also prepares the system for future production hardening. Although the current implementation is primarily suited for local development and assessment demonstration, the same component separation can be adapted to a server environment with production process management, HTTPS, secured environment variables, managed database services, and monitoring.
