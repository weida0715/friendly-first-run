# 6.3 System Configuration and Setup

This section explains how the implemented system is configured and started in the local development and demonstration environment. The system is not a single-process application; it consists of a frontend web application, backend API, database service, queue service, and worker process. Each component has a specific responsibility and is configured through source files, package tools, runtime services, and `.env` values.

The setup process supports the implementation requirements by making the application repeatable to run, test, and demonstrate. The backend must be able to connect to persistent storage and the queue service, the frontend must be able to forward browser API calls to the backend, and the worker must be able to process queued experiment jobs independently from the web request cycle. These setup decisions allow the system to support authentication, blueprint management, experiment configuration, asynchronous execution, market-data handling, result inspection, and administrative monitoring.

## 6.3.1 Backend Setup

The backend is implemented as a Flask application under `backend/app`. The application factory initializes the Flask runtime, loads environment-based configuration, configures CSRF handling, registers API routes, applies API response behavior, records system events, and initializes database metadata. The backend exposes its runtime application through `backend/wsgi.py`, which is used as the local backend entrypoint.

The backend is configured to run as a separate API service. In the local setup, the API is served on port `5000`, and all backend feature routes are registered under the `/api` route prefix. This includes authentication, users, blueprints, experiments, jobs, logs, market data, models, public hub, documentation, and system endpoints. This clear API boundary allows the frontend to treat the backend as a service rather than directly importing backend logic.

Runtime configuration is supplied through `.env`. The backend reads values for database connectivity, Redis connectivity, session behavior, market-data provider configuration, application environment, and cross-origin access. This prevents environment-specific values from being hard-coded into source files. It also allows the same backend implementation to be started with different local or deployment settings by changing configuration values rather than modifying code.

The backend uses PostgreSQL as the required relational database and Redis as the queue-related runtime service. PostgreSQL stores durable system data such as users, blueprints, experiments, models, logs, market candles, favorites, settings, and events. Redis supports job queue behavior and queue metadata used by asynchronous experiment execution. Because these services are external to the Flask process, they must be available before the backend and worker are used for a complete demonstration.

**Table 6.10: Backend Configuration Items**

| Configuration Item | Source | Used By | Purpose |
| --- | --- | --- | --- |
| `FLASK_ENV` | `.env` | Backend application | Selects backend runtime environment behavior |
| `DATABASE_URL` | `.env` | Backend database layer and migration tooling | Defines the PostgreSQL database connection used by the application |
| `REDIS_URL` | `.env` | Queue service and worker | Defines the Redis connection used for asynchronous job processing |
| `SESSION_BACKEND` | `.env` | Backend session handling | Selects the session storage approach used by the backend |
| `SESSION_TIMEOUT_MINUTES` | `.env` | Backend session handling and system settings | Controls how long authenticated sessions remain valid |
| `BINANCE_BASE_URL` | `.env` | Market-data service | Defines the BTCUSDT market-data provider base URL |
| `CORS_ALLOW_ORIGINS` | `.env` | Backend API response handling | Defines allowed frontend origins for browser API requests |
| `BACKEND_API_ORIGIN` | `.env` | Frontend rewrite configuration | Defines the backend origin used by frontend request forwarding |

The backend startup can be performed directly from the `backend/` folder when the required services are already running. The command below shows the local backend startup flow using environment-based configuration. Values that are environment-specific should be supplied from `.env` instead of being written directly into report screenshots.

```bash
cd backend
PYTHONPATH=$(pwd) .venv/bin/python wsgi.py
```

> Note: Add a screenshot of the backend terminal after startup and a browser or terminal check of the backend health endpoint. Crop or mask any local environment values before placing the screenshot in the final report.

## 6.3.2 Backend Request Handling Configuration

The backend request-handling setup includes route registration, CSRF handling, CORS handling, database access, and system event recording. These functions are configured at the application boundary so that individual feature controllers can focus on their own request logic. For example, the authentication controller handles login and registration, while the experiment controller handles experiment submission and detail retrieval.

CSRF handling protects state-changing requests. The frontend obtains a CSRF token and sends it with mutating API requests. If the token is invalid or missing for protected actions, the backend returns a structured error response. This configuration is important because the application uses browser-based sessions and performs actions such as creating experiments, creating blueprints, updating users, submitting approval requests, and cancelling jobs.

CORS handling is configured so that the frontend can communicate with the backend during local development. The backend accepts only configured origins. In the local setup, the frontend normally reaches the backend through the Next.js rewrite path, which reduces cross-origin complexity. However, the backend still includes explicit CORS handling for API requests so that local and future deployment environments can be configured safely.

System event recording is applied after API requests. This gives the administrative side of the system a record of operational activity, such as route access and management actions. The event recording behavior supports traceability and system monitoring, which are important for a system that includes user roles, administrative operations, queued jobs, and experiment execution.

**Table 6.11: Backend Setup Responsibilities**

| Backend Setup Area | Implementation Responsibility |
| --- | --- |
| Application factory | Creates Flask application and loads configuration |
| Route registry | Registers all API feature controllers under the backend API prefix |
| CSRF handling | Protects state-changing browser requests |
| CORS handling | Allows configured frontend origins to access API routes |
| Database session setup | Connects repositories and ORM mappings to PostgreSQL |
| Queue setup | Allows experiment jobs to be submitted to Redis-backed queue processing |
| System event recording | Captures operational events for administrative traceability |
| Response helpers | Standardizes success, error, and validation response shapes |

## 6.3.3 Frontend Setup

The frontend is implemented as a Next.js application under `frontend/`. Route entrypoints are placed under `frontend/app`, while the main screen logic is implemented under `frontend/views`. This separation keeps route files simple and allows each view to focus on page-level behavior. For example, dashboard, experiment, blueprint, job, model, public hub, documentation, profile, user-management, and system-management screens are implemented as view components.

The frontend setup also includes reusable components under `frontend/components`. These components provide the application shell, navigation, page headers, forms, chart rendering, tables, loading states, empty states, error states, status badges, and UI primitives. This component structure allows screens to remain visually consistent and avoids duplicating layout or state-handling patterns across different modules.

The frontend communicates with the backend through a centralized API client and endpoint map under `frontend/lib/api`. Instead of hard-coding backend URLs inside individual views, the frontend uses shared endpoint definitions. This improves maintainability because endpoint changes can be managed in one location. Authentication state is handled under `frontend/lib/auth`, which includes the authentication provider, current-user handling, and route guards.

The local frontend runtime is started from the `frontend/` folder. During development, the frontend serves the browser application on port `3000`. The frontend also provides a rewrite configuration so that browser requests to `/api/backend/*` are forwarded to the backend API. This allows the browser to call the backend through the frontend origin while preserving a separate Flask API service behind it.

**Table 6.12: Frontend Configuration and Source Areas**

| Frontend Area | Purpose |
| --- | --- |
| `frontend/app/` | Defines Next.js route entrypoints |
| `frontend/views/` | Implements page-level screen behavior and workflow logic |
| `frontend/components/` | Provides reusable layout, UI, form, chart, state, table, and status components |
| `frontend/lib/api/` | Centralizes API endpoint definitions and request handling |
| `frontend/lib/auth/` | Provides authentication state, current-user loading, and route guards |
| `frontend/lib/routes/` | Defines navigation metadata and role-aware route visibility |
| `frontend/lib/theme/` | Provides frontend theme handling |
| `frontend/lib/validators/` | Provides client-side validation for selected forms |
| `frontend/next.config.ts` | Configures frontend request rewriting to the backend API |
| `frontend/tailwind.config.ts` | Configures frontend styling behavior |

The typical frontend startup command is:

```bash
cd frontend
npm run dev
```

> Note: Add screenshots of the landing page, dashboard, and one workflow page such as the Blueprint Wizard or Experiment Wizard. Use realistic demonstration data and avoid showing hidden folders, generated build folders, or local runtime files.

## 6.3.4 Frontend API Proxy and Route Configuration

The frontend API proxy is an important setup feature because it connects the browser-facing Next.js application to the Flask backend API. In browser runtime, the frontend uses `/api/backend` as its API base path. The Next.js rewrite configuration forwards this path to the backend API origin. As a result, the browser can make API requests through the frontend server, while the backend continues to expose its own `/api` route structure.

This setup improves local development because the frontend can call backend endpoints consistently without each view needing to know the full backend address. It also helps reduce common browser integration issues by keeping the browser-facing API path under the frontend server. The backend still performs its own authentication, authorization, validation, and response handling; the frontend rewrite only forwards the request.

The simplified flow is shown below.

```text
Browser request
  -> Next.js frontend route or view
  -> frontend API client
  -> /api/backend/*
  -> Next.js rewrite
  -> Flask backend /api/*
  -> backend controller, service, repository, or queue action
```

> Note: Add a small diagram showing the API proxy flow. The diagram should distinguish the frontend browser path `/api/backend/*` from the backend API route prefix `/api/*`.

## 6.3.5 Database Setup

The database setup uses PostgreSQL as the persistent storage service. The backend connects to PostgreSQL through the database value supplied by `.env`. The database stores the persistent records required by the system, including users, blueprints, experiments, models, experiment logs, market-data candles, favorites, system settings, and system events.

SQLAlchemy is used by the backend to configure the database engine, sessions, ORM mappings, and repository access. Repositories then provide focused persistence operations for each domain area. This prevents controllers from directly handling database details and supports a more maintainable data access structure.

Alembic is used for database schema management. It supports controlled database setup by applying schema changes through migration commands. This is important because the application uses several related tables and must preserve consistency between source code, database schema, and runtime behavior.

The typical database setup flow is:

```text
Configure PostgreSQL service
Set database connection in .env
Apply database schema setup or migration command
Start backend API
Verify backend can connect to the database
```

> Note: If a screenshot is included, show only a sanitized database tool view listing table names. Do not show local connection details or sensitive configuration values.

## 6.3.6 Queue and Worker Setup

The queue setup uses Redis as the runtime service for queued experiment jobs. When a user submits a valid experiment, the backend creates an experiment record and places a job into the queue. The backend then returns queue metadata to the frontend so that the user can see that the experiment has been accepted for asynchronous execution.

The worker is started as a separate backend process. Its responsibility is to consume queued experiment jobs, load the referenced experiment, update the experiment status, execute the experiment pipeline, report progress, and persist resulting model and log data. Keeping the worker separate from the backend API prevents long-running experiment work from blocking normal web requests.

The worker startup command is executed from the backend context:

```bash
cd backend
PYTHONPATH=$(pwd) .venv/bin/python -m app.scripts.run_worker
```

The queue-worker relationship is summarized in Table 6.13.

**Table 6.13: Queue and Worker Setup**

| Component | Setup Requirement | Runtime Responsibility |
| --- | --- | --- |
| Redis service | Must be reachable through `.env` queue configuration | Stores queued job information and queue metadata |
| Backend queue service | Configured inside backend service layer | Enqueues validated experiment jobs |
| Worker process | Started as a separate backend process | Consumes queued jobs and executes experiments |
| Job detail API | Registered through backend API routes | Allows users to view job status and request cancellation |
| System management view | Available to administrator role | Allows queue visibility and operational monitoring |

> Note: Add a screenshot of the Job Detail page or System Management queue view after an experiment has been submitted. This provides better evidence than only showing a terminal process.

## 6.3.7 Build Tools and Package Managers

The project uses separate package and build tooling for backend and frontend development. The backend uses a Python virtual environment and Python dependency definitions under `backend/`. This keeps backend dependencies isolated from the operating system environment. The frontend uses npm scripts to run the development server, tests, type checking, and build-related workflows.

Testing tools are also part of the setup. Backend tests are executed using pytest, while frontend tests are executed using Jest and Testing Library. These testing tools are used during implementation to confirm that backend services, validators, controllers, workers, frontend views, route guards, and API behavior continue to work after changes.

**Table 6.14: Build Tools and Package Managers**

| Tool | Used In | Purpose |
| --- | --- | --- |
| Python virtual environment | `backend/` | Isolates backend runtime dependencies |
| Python dependency configuration | `backend/` | Defines backend runtime and development dependencies |
| pytest | `backend/` | Runs backend automated tests |
| Alembic | `backend/` | Applies database schema setup and migration workflow |
| npm | `frontend/` | Installs frontend dependencies and runs frontend scripts |
| Next.js scripts | `frontend/` | Starts, builds, and serves the frontend application |
| TypeScript compiler | `frontend/` | Checks frontend type correctness |
| Jest | `frontend/` | Runs frontend automated tests |
| Testing Library | `frontend/` | Verifies frontend behavior through rendered components |
| Shell scripts | `scripts/` | Automates startup and full test execution |

The main frontend development commands are:

```bash
cd frontend
npm run dev
npm run typecheck
npm test -- --runInBand
```

The main backend development commands are:

```bash
cd backend
.venv/bin/pytest -q
```

> Note: If terminal evidence is shown in this section, prefer screenshots of command results for `npm run typecheck`, frontend tests, backend tests, or the startup script. Avoid showing generated folder listings.

## 6.3.8 Startup and Test Scripts

The project includes shell scripts under `scripts/` to reduce repeated manual setup commands. The startup script checks that required commands are available, checks that Redis is reachable, confirms that backend and frontend dependencies are present, verifies that the database configuration is available, starts the backend API, starts the worker, starts the frontend development server, and stops child processes when the startup session ends.

The high-level startup process is shown in the following Program Design Language style pseudocode.

```text
PROCEDURE Start Application
  VERIFY required runtime commands exist
  VERIFY Redis service is reachable
  VERIFY backend runtime environment is available
  VERIFY frontend dependencies are available
  IF database configuration is missing THEN
    DISPLAY configuration error
    TERMINATE startup
  ENDIF
  START backend API process
  START experiment worker process
  START frontend development server
  WAIT for service process status
  WHEN stopping application
    STOP backend, worker, and frontend processes safely
ENDPROCEDURE
```

The test script provides a repeatable way to execute the backend and frontend automated test suites. This supports implementation quality because the developer can verify both sides of the system using one project-level command.

The typical full test command is:

```bash
scripts/test_all.sh
```

> Note: Add a screenshot of the startup script output when all services start correctly. For the testing script, include either a terminal screenshot or a copied summary of passed test counts after the final verification run.

## 6.3.9 Setup Verification Checklist

After configuration and setup are completed, the system should be verified using a short checklist. This checklist ensures that the services are available before user workflows are tested.

**Table 6.15: Local Setup Verification Checklist**

| No. | Verification Item | Expected Result |
| --- | --- | --- |
| 1 | PostgreSQL service is running | Backend can connect to the database using `.env` configuration |
| 2 | Redis service is running | Startup script or worker can reach Redis |
| 3 | Backend API starts successfully | Flask backend responds on local backend port |
| 4 | Frontend starts successfully | Browser can open the Next.js frontend on local frontend port |
| 5 | Frontend API rewrite works | Browser API requests through `/api/backend` reach backend `/api` routes |
| 6 | Worker starts successfully | Worker waits for queued experiment jobs |
| 7 | Authentication flow works | User can register or log in and reach authenticated routes |
| 8 | Experiment submission works | Valid experiment creates queued job metadata |
| 9 | Job status is visible | Job list or detail page shows queued, running, completed, failed, or cancelled state |
| 10 | Test script runs | Backend and frontend test commands complete as expected |

## 6.3.10 Summary

The system configuration and setup are designed to support a modular full-stack application. The Flask backend is configured as a separate API service, the Next.js frontend is configured as the browser-facing application, PostgreSQL provides persistent storage, Redis supports queued job processing, and the worker performs long-running experiment execution outside the web request cycle.

Environment-specific values are placed in `.env`, while source code remains organized by responsibility under `backend/`, `frontend/`, and `scripts/`. The frontend API rewrite connects the browser-facing application to the backend API, and the startup script simplifies local demonstration by coordinating the backend, worker, and frontend processes. This setup supports the system requirements for authenticated workflows, role-based access, reproducible experiment configuration, asynchronous execution, and result inspection.
