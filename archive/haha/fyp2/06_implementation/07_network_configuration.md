# 6.7 Network Configuration

This section explains how the Bitcoin Experimental Engine is connected in the local development and demonstration environment. The implemented system is a multi-service application rather than a single process. The browser accesses the Next.js frontend, the frontend forwards API requests to the Flask backend, the backend connects to PostgreSQL and Redis, and the worker process consumes queued experiment jobs through the queue service.

The network configuration is important because the system depends on several cooperating services. Authentication, blueprint management, experiment submission, model inspection, market-data charting, job monitoring, and system management all require reliable communication between the frontend, backend, database, queue, and worker. The local configuration keeps these services separate while still allowing the system to run on one development machine for assessment demonstration.

## 6.7.1 Local Hosting Setup

The implemented system is hosted locally as a group of services. The frontend runs as a local Next.js development server. The backend runs as a Flask API server. PostgreSQL runs as the persistent database service. Redis runs as the queue and runtime support service. The worker runs as a separate backend process that listens for experiment execution jobs. This separation reflects the actual deployed architecture because each service has a clear responsibility.

In this setup, the browser does not call the database, queue, worker, or market-data provider directly. The browser communicates with the frontend application. The frontend communicates with the backend through the configured API rewrite path. The backend then controls all access to persistence, queueing, worker-triggered execution, and market-data integration. This protects the system boundaries and keeps sensitive runtime services away from direct browser access.

**Table 6.46: Local Hosting Components**

| Service | Local Host Role | Responsibility |
| --- | --- | --- |
| Browser | Client runtime | Displays the user interface and sends requests to the frontend application |
| Next.js frontend | Local web server | Serves route pages, views, reusable components, and browser-facing API calls |
| Flask backend | Local API server | Exposes JSON API routes, validates requests, applies access control, and coordinates business logic |
| Experiment worker | Local background process | Executes queued experiments and updates progress, models, and logs |
| PostgreSQL | Local database service | Stores users, blueprints, experiments, models, logs, candles, favorites, settings, and events |
| Redis | Local queue service | Supports queued job processing and queue metadata |
| Market-data provider | External HTTP service configured by `.env` | Supplies BTCUSDT candle data that is normalized and cached by the backend |

> Note: Add a local network diagram here. The diagram should show Browser -> Next.js Frontend -> `/api/backend/*` -> Flask Backend `/api/*`; Flask Backend -> PostgreSQL; Flask Backend -> Redis; Worker -> Redis; Worker -> PostgreSQL; Backend market-data service -> BTCUSDT market-data provider.

## 6.7.2 Port Configuration

The local development environment uses fixed default ports so that services can find one another consistently. The frontend is served on port `3000`, and the backend API is served on port `5000`. PostgreSQL and Redis use their standard local service ports. The worker does not expose a browser-facing port because it operates as a background consumer of queue jobs.

The frontend uses `/api/backend/*` as the browser-facing API path. The Next.js rewrite configuration forwards that path to the backend origin and maps it to the backend `/api/*` route prefix. For example, a browser request to `/api/backend/auth/me` is forwarded to the backend route `/api/auth/me`. This allows frontend code to use a consistent same-origin API path while preserving the backend as a separate service.

**Table 6.47: Local Port and Address Configuration**

| Component | Default Local Address or Path | Configuration Source | Purpose |
| --- | --- | --- | --- |
| Frontend web application | `http://localhost:3000` | Next.js development server | Serves the browser user interface |
| Backend API | `http://localhost:5000` | Flask backend runtime | Serves backend JSON API routes |
| Frontend API path | `/api/backend/*` | `frontend/lib/api/endpoints.ts` | Browser-facing API base path used by frontend views |
| Frontend rewrite | `/api/backend/:path*` -> backend `/api/:path*` | `frontend/next.config.ts` and `.env` | Forwards browser API calls from frontend server to backend server |
| Backend API prefix | `/api/*` | Backend application configuration | Groups backend feature routes under a common API prefix |
| PostgreSQL | `localhost:5432` | `.env` database configuration | Provides persistent relational storage |
| Redis | `localhost:6379` | `.env` queue configuration | Provides queue-related runtime support |
| Worker process | No public port | `scripts/start_app.sh` and backend worker entrypoint | Consumes queued experiment jobs in the background |

## 6.7.3 Frontend to Backend Proxy Configuration

The frontend to backend proxy is implemented through the Next.js rewrite configuration. The frontend reads the backend API origin from `.env`. If no custom backend origin is supplied, the local backend origin defaults to `http://localhost:5000`. Browser API calls use `/api/backend` as the base path, and the rewrite forwards the request to the Flask backend under `/api`.

This configuration reduces local cross-origin complexity because the browser sends requests to the same frontend origin. The Next.js server performs the forwarding step. The backend still validates the request, checks sessions, verifies CSRF tokens for state-changing operations, applies access control, and returns the final JSON response.

The proxy flow is shown below.

```text
Browser
  -> http://localhost:3000
  -> /api/backend/auth/me
  -> Next.js rewrite
  -> http://localhost:5000/api/auth/me
  -> Flask authentication controller
  -> JSON response back through frontend path
```

**Table 6.48: Frontend Proxy Configuration Responsibilities**

| Configuration Element | Responsibility |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Defines the browser-facing API base path used by frontend API helpers |
| `BACKEND_API_ORIGIN` | Defines the backend target origin used by the Next.js rewrite |
| `frontend/next.config.ts` | Maps `/api/backend/:path*` to backend `/api/:path*` |
| `frontend/lib/api/endpoints.ts` | Centralizes endpoint paths so frontend views do not hard-code backend addresses |
| `frontend/lib/api/client.ts` | Sends requests with credentials, JSON headers, CSRF handling, and error parsing |

> Note: Add a screenshot from browser developer tools showing a request to `/api/backend/auth/me` or `/api/backend/health`. The screenshot should show a successful JSON response and must not show private cookie values.

## 6.7.4 Backend Network Configuration

The backend API is hosted as a Flask server in the local environment. It exposes route groups under the `/api` prefix. These route groups include authentication, users, blueprints, experiments, jobs, market data, models, logs, public hub, documentation, and system management. The backend listens on the local backend address and receives requests forwarded by the frontend or sent directly during backend testing.

Backend configuration values are read from `.env`. The backend uses these values to determine database connection, Redis connection, API behavior, session behavior, cookie settings, market-data provider base address, and allowed frontend origins. This keeps local addresses and deployment-specific values outside source code.

The backend also includes allowed-origin configuration for browser access. In local demonstration, the frontend origin is expected to be `http://localhost:3000` or another explicitly configured local frontend address. The allowed-origin configuration supports browser-based API access while still preventing uncontrolled origins from interacting with protected API routes.

**Table 6.49: Backend Network Configuration Values**

| Configuration Value | Used By | Network Purpose |
| --- | --- | --- |
| `FLASK_ENV` | Backend runtime | Selects backend environment behavior |
| `DATABASE_URL` | Backend database layer | Provides PostgreSQL connection path |
| `REDIS_URL` | Backend queue/session services and worker | Provides Redis connection path |
| `QUEUE_NAME` | Queue service and worker | Identifies the queue names used for experiment execution |
| `BINANCE_BASE_URL` | Market-data service | Defines the configured market-data provider origin |
| `SESSION_COOKIE_SAMESITE` | Backend session handling | Controls browser session cookie same-site behavior |
| `SESSION_COOKIE_SECURE` | Backend session handling | Controls whether session cookies require secure transport |
| `CORS_ALLOW_ORIGINS` | Backend API response handling | Defines allowed frontend origins for browser API access |

> Note: If configuration evidence is included, use a sanitized table instead of a screenshot of `.env`. Do not show private secrets, local credentials, session cookie values, or private connection strings.

## 6.7.5 Database and Redis Connectivity

PostgreSQL and Redis are required supporting services in the local network configuration. PostgreSQL stores all durable system data, while Redis supports queued job processing and related runtime behavior. The backend and worker both depend on these services.

The startup script checks that Redis is reachable before starting the backend, worker, and frontend processes. The script also requires database configuration to be present before it starts the application. These checks help avoid confusing runtime failures where the frontend loads but backend operations fail because required infrastructure is unavailable.

The database and queue connectivity flow is shown below.

```text
Flask Backend
  -> PostgreSQL through database configuration
  -> Redis through queue configuration

Experiment Worker
  -> Redis queue to receive jobs
  -> PostgreSQL through repositories to update experiments, models, and logs
```

**Table 6.50: Supporting Service Connectivity**

| Service | Connected Components | Purpose |
| --- | --- | --- |
| PostgreSQL | Flask backend, worker | Stores persistent system records and experiment outputs |
| Redis | Flask backend, worker | Stores queued jobs and queue metadata |
| Queue service | Flask backend -> Redis | Enqueues experiment jobs from API requests |
| Worker process | Redis -> worker -> PostgreSQL | Consumes experiment jobs and persists execution results |
| Startup script | Local terminal -> Redis/backend/frontend/worker | Checks dependencies and starts services together |

## 6.7.6 Worker Network Role

The worker is part of the backend runtime, but it does not expose a public HTTP address. Instead, it connects to Redis and waits for queued experiment jobs. When a job is available, the worker loads the referenced experiment from PostgreSQL, runs the experiment executor, and updates experiment status, progress, model metrics, and logs.

This design is important because long-running experiment work should not block normal API requests. The backend API only accepts and queues the experiment. The worker performs the computation separately. The frontend can then poll or refresh job and experiment endpoints to show updated status.

```text
User submits experiment
  -> Flask backend validates and queues job
  -> Redis stores job
  -> Worker consumes job
  -> Worker reads and writes PostgreSQL records
  -> Frontend reads updated status through backend API
```

> Note: Add a sequence diagram showing API submission and worker execution. The worker should be shown as a background process connected to Redis and PostgreSQL, not as a browser-accessible service.

## 6.7.7 Local Startup Network Flow

The local startup script under `scripts/` starts the integrated development environment after checking prerequisites. It verifies required commands, checks Redis connectivity, verifies the backend Python environment, verifies frontend dependencies, requires database configuration, starts the backend on `http://localhost:5000`, starts the worker, and starts the frontend on `http://localhost:3000`.

This startup flow makes the network configuration repeatable. Instead of manually starting each process and risking a missing service, the script starts the expected local network of cooperating services. It also stops child processes safely when the startup session ends.

```text
PROCEDURE Start Local Network Services
  VERIFY required runtime commands exist
  VERIFY Redis is reachable through configured Redis address
  VERIFY backend runtime environment exists
  VERIFY frontend dependencies exist
  VERIFY database configuration exists
  START backend API on local backend address
  START experiment worker process
  START frontend server on local frontend address
  WAIT until one process exits
  STOP remaining child processes safely
ENDPROCEDURE
```

**Table 6.51: Startup Script Network Responsibilities**

| Startup Step | Network Purpose |
| --- | --- |
| Check Redis reachability | Confirms queue service is available before backend and worker start |
| Check database configuration | Confirms backend has database connection information |
| Start backend | Opens the local API server for frontend and test requests |
| Start worker | Connects background experiment execution to the queue |
| Start frontend | Opens browser-facing web application |
| Cleanup on exit | Stops child processes to avoid stale local services |

## 6.7.8 Local Demonstration Network Diagram

The recommended local network diagram for the report is shown conceptually below. This diagram can be redrawn as a formal figure in the final document.

```text
Browser
  |
  | http://localhost:3000
  v
Next.js Frontend
  |
  | /api/backend/* rewrite
  v
Flask Backend API
  |                |                 |
  |                |                 |
  v                v                 v
PostgreSQL       Redis Queue      Market-Data Provider
  ^                |
  |                v
  |             Worker Process
  |                |
  +----------------+
```

> Note: Label the final figure as a local network configuration diagram. It should show service boundaries and ports, but it should not include private environment values or secret keys.

## 6.7.9 Deployment to Server or Live Environment

The current implementation is configured primarily for local development and assessment demonstration. However, the logical service boundaries are suitable for adaptation to a server or managed deployment environment. The frontend, backend, database, Redis service, and worker can be deployed as separate processes or services while keeping the same communication responsibilities.

A production-oriented deployment would require a production-grade frontend build, a production WSGI or application server for Flask, secure `.env` values, a managed PostgreSQL service or properly administered database server, a managed Redis service or equivalent queue service, HTTPS termination, restricted allowed origins, secure cookie settings, logging, monitoring, and process supervision for the worker.

The most important deployment requirement is to preserve the same logical network structure with stronger security controls. The browser should only access the frontend and public API entry points. The database and Redis service should not be publicly exposed. The worker should remain a private background process. Secrets and connection values should be supplied through secure runtime configuration rather than being stored in source files.

**Table 6.52: Local Demonstration vs Production-Oriented Deployment**

| Area | Local Demonstration | Production-Oriented Deployment |
| --- | --- | --- |
| Frontend | Next.js local development server | Production frontend build served by managed hosting or process manager |
| Backend | Flask local server | Production application server behind HTTPS and reverse proxy |
| Database | Local PostgreSQL service | Managed or secured PostgreSQL service |
| Queue | Local Redis service | Managed or secured Redis-compatible service |
| Worker | Local backend process | Supervised background process or worker service |
| API routing | `/api/backend/*` rewrite to local backend | Reverse proxy or hosted rewrite to backend API service |
| Security | Local demonstration settings | HTTPS, secure cookies, restricted origins, secret management, monitoring |

> Note: If the submitted project is demonstrated locally only, state that the implemented deployment target is local demonstration. Do not imply that a public live deployment exists unless it has actually been deployed and verified.

## 6.7.10 Network Configuration Evidence to Include

The final report should include evidence that the local network configuration works. The most useful evidence is a combination of diagrams, terminal output, browser screenshots, and API request evidence.

Recommended evidence:

- Screenshot of the startup script showing backend, worker, and frontend services starting.
- Screenshot of the frontend running at `http://localhost:3000`.
- Screenshot of backend health or API response from the browser or terminal.
- Browser developer tools screenshot showing `/api/backend/*` request forwarding successfully.
- Screenshot of job detail or experiment detail showing that worker updates are visible through the frontend.
- Local network configuration diagram showing the services and ports.

> Note: Crop or mask any terminal output that contains private local values. Do not show session cookie values, secrets, database connection strings, or private account data.

## 6.7.11 Summary

The network configuration of the Bitcoin Experimental Engine is based on a local multi-service setup. The frontend runs on port `3000`, the backend API runs on port `5000`, PostgreSQL provides persistent storage, Redis provides queue support, and the worker process handles long-running experiment execution in the background. The frontend communicates with the backend through the `/api/backend/*` path, which is rewritten to backend `/api/*` routes.

This configuration supports the system requirements because it allows browser interaction, secure backend processing, persistent storage, asynchronous execution, chart data access, result inspection, and administrative monitoring to work together. The same service boundaries can be adapted for a production-oriented environment by adding HTTPS, secure runtime configuration, managed services, restricted origins, and process supervision.
