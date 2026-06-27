# 6.3 System Configuration and Setup

This section explains how the backend, frontend, build tools, and package managers are configured. BEE runs as a group of cooperating services: a Flask backend, a Next.js frontend, a PostgreSQL database, a Redis queue, and an RQ worker. Application settings are read from environment variables. For this report, `.env.example` can be treated as the template for `.env`.

## 6.3.1 Backend Setup

The backend is a Flask application. The configuration class in `backend/app/config.py` defines the application name, version, API prefix, runtime environment, database URL, Redis URL, queue name, Binance base URL, session timeout, session backend, and allowed frontend origins.[^impl-config]

The backend route registry in `backend/app/routes.py` mounts the API controllers under `/api`. This gives the frontend stable paths for authentication, users, experiments, blueprints, models, public hub, documentation, jobs, logs, market data, and system management.[^impl-routes]

| Backend setup item | Implementation | Relative path |
|---|---|---|
| API framework | Flask application with controller blueprints | `backend/app/routes.py`, `backend/app/controllers/` |
| Configuration | Environment-based settings for app, database, Redis, sessions, frontend origins, and Binance | `backend/app/config.py` |
| Database access | SQLAlchemy session and ORM models | `backend/app/infrastructure/database/session.py`, `backend/app/infrastructure/database/orm/` |
| Transaction boundary | Unit of Work pattern for repository operations | `backend/app/repositories/unit_of_work.py` |
| Validation | Dedicated validators for blueprint and experiment payloads | `backend/app/validators/blueprint_validator.py`, `backend/app/validators/experiment_validator.py` |
| Authentication and sessions | Password hashing, server-side sessions, and access control | `backend/app/services/password_service.py`, `backend/app/services/session_service.py`, `backend/app/services/access_control_service.py` |
| Queue execution | Queue service, Redis adapter, and experiment worker | `backend/app/services/queue_service.py`, `backend/app/infrastructure/redis/job_queue.py`, `backend/app/workers/experiment_worker.py` |
| Market-data connector | Binance kline client and BTCUSDT cache service | `backend/app/infrastructure/binance/kline_client.py`, `backend/app/services/market_data_service.py` |

Backend setup procedure:

```text
PROCEDURE ConfigureBackend
    READ environment values for database, Redis, queue, and frontend origin settings
    SELECT Flask configuration from FLASK_ENV
    CREATE Flask application
    CONNECT backend repositories to PostgreSQL
    REGISTER API blueprints through backend/app/routes.py
    CONFIGURE session handling
    CONNECT queue service to Redis
    START backend service on the configured host and port
END PROCEDURE
```

The backend should not be started without a working database connection because the main application data is stored in PostgreSQL. Redis is also required for the normal experiment queue flow. If Redis is unavailable, experiment creation can return a queue-unavailable error instead of reporting a false running state.

## 6.3.2 Frontend Setup

The frontend is implemented with Next.js and React. Routes are organized under `frontend/app/`, while larger page implementations are placed in `frontend/views/`. Shared layout components are placed in `frontend/components/layout/`, and general UI components are placed under `frontend/components/`. API calls are centralized in `frontend/lib/api/client.ts`, which wraps `GET`, `POST`, `PATCH`, and `DELETE` requests and maps JSON errors into frontend exceptions.[^impl-api-client]

| Frontend setup item | Implementation | Relative path |
|---|---|---|
| App routes | User-facing and staff-facing pages | `frontend/app/` |
| Feature views | Dashboard, experiment wizard/detail, blueprint views, model views, public hub, documentation, admin pages | `frontend/views/` |
| Shared layout | Sidebar, top bar, page shell, breadcrumbs, page headers | `frontend/components/layout/` |
| Forms and UI components | Inputs, buttons, tables, dialogs, status badges, empty/loading/error states | `frontend/components/` |
| Chart component | BTCUSDT chart rendering | `frontend/components/charts/`, `frontend/tests/btcusdt-price-chart.test.tsx` |
| API client | Typed functions that call backend endpoints | `frontend/lib/api/client.ts` |
| Route visibility | Role-based navigation | `frontend/lib/routes/nav.ts` |

The frontend navigation declares the main implemented pages: Dashboard, Experiments, Blueprints, Models, Favorites, Public Hub, Documentation, Users, System, Moderation, and Jobs. The same file also ranks user roles and filters navigation items by role.[^impl-nav] This improves usability, but backend checks still decide whether a restricted action is allowed.

Frontend setup procedure:

```text
PROCEDURE ConfigureFrontend
    INSTALL npm dependencies in frontend directory
    READ frontend API configuration from environment
    START Next.js development server
    LOAD route definitions from frontend/app
    RENDER protected pages only after current-user check
    USE frontend/lib/api/client.ts for backend requests
    SHOW loading, empty, validation, and error states when required
END PROCEDURE
```

## 6.3.3 Build Tools and Package Managers

The backend and frontend use different package managers because they are built with different languages. The backend uses Python packaging and pip. The frontend uses npm scripts. This split is appropriate because the backend and frontend have separate runtimes and dependency ecosystems.

| Area | Tool | Command or use | Evidence |
|---|---|---|---|
| Backend package installation | pip | Install backend dependencies from requirements or project metadata | `backend/requirements.txt`, `backend/requirements-dev.txt`, `backend/pyproject.toml` |
| Backend test runner | pytest | Run backend tests | `backend/tests/` |
| Database migration | Alembic | Apply database schema migrations | `backend/alembic/versions/` |
| Frontend package installation | npm | Install frontend dependencies | `frontend/package.json` |
| Frontend development server | Next.js script | Run the web application locally | `frontend/package.json` |
| Frontend build | Next.js build script | Build production frontend bundle | `frontend/package.json` |
| Frontend type checking | TypeScript compiler | Check TypeScript without emitting files | `frontend/package.json`, `frontend/tsconfig.json` |
| Frontend testing | Jest | Run React and API client tests | `frontend/tests/` |
| Local multi-service start | Shell script | Start backend, worker, and frontend for demonstration | `scripts/start_app.sh` |

## Required screenshots and code snippets

| Evidence | What to show | Suggested source or page |
|---|---|---|
| Backend configuration snippet | Runtime settings for API prefix, database, Redis, sessions, and frontend origin list | `backend/app/config.py` lines 21-46 |
| Route registry snippet | Registered backend modules under `/api` | `backend/app/routes.py` lines 77-98 |
| API client snippet | Request wrapper, JSON parsing, and error mapping | `frontend/lib/api/client.ts` lines 80-180 |
| Navigation snippet | Role-filtered app navigation | `frontend/lib/routes/nav.ts` lines 32-68 |
| Frontend screenshots | Login page, dashboard, experiment wizard, blueprint wizard, model page, admin pages | `frontend/app/` pages |
| Backend service screenshot | Backend terminal running and `/api/health` response | `backend/app/controllers/system_controller.py` lines 50-61 |

[^impl-config]: Runtime settings are declared in `backend/app/config.py` lines 21-46.
[^impl-routes]: Backend API blueprints are registered in `backend/app/routes.py` lines 77-98.
[^impl-api-client]: The frontend API wrapper handles request setup, JSON parsing, and API errors in `frontend/lib/api/client.ts` lines 80-180.
[^impl-nav]: Role-based navigation is declared in `frontend/lib/routes/nav.ts` lines 32-68.
