# 6.3 System Configuration and Setup

## 6.3.1 Backend Setup

The backend is a Flask application with a layered structure. The route registry in `backend/app/routes.py` registers API modules for authentication, users, experiments, blueprints, models, public hub, documentation, jobs, logs, market data, and system management. Each controller focuses on HTTP request handling, while services, validators, repositories, and domain models handle the internal application logic.

The backend configuration is environment-driven. The project assumes a `.env` file based on `.env.example`. The configuration must include database, Redis, secret key, CORS, session, backend API origin, and Binance connector settings. For report writing, `.env.example` may be described as the source for `.env` because it documents the deployment variables without exposing private local values.

| Backend setup item | Implementation detail | Relative paths |
|---|---|---|
| Application entry and routing | API blueprints mounted under `/api` | `backend/app/routes.py`, `backend/app/controllers/` |
| Configuration | Environment variables for Flask, database, Redis, sessions, CORS, and Binance | `.env.example`, `backend/app/config.py` |
| Database access | SQLAlchemy session and ORM model mappings | `backend/app/infrastructure/database/session.py`, `backend/app/infrastructure/database/orm/` |
| Business services | Authentication/session, access control, market data, queue, versioning, settings | `backend/app/services/` |
| Input validation | Blueprint and experiment request validation before persistence/execution | `backend/app/validators/blueprint_validator.py`, `backend/app/validators/experiment_validator.py` |
| Background jobs | Queue service and Redis/RQ adapter for experiment execution | `backend/app/services/queue_service.py`, `backend/app/infrastructure/redis/job_queue.py`, `backend/app/workers/experiment_worker.py` |

The backend server configuration is implemented with Flask rather than Apache, IIS, or a separate Java application server. During local development, the Flask backend runs on `http://localhost:5000`. For production-style deployment, the same application can be placed behind a WSGI server, but the current implementation chapter should focus on the source-code-backed local deployment.

Backend setup pseudocode:

```text
PROCEDURE StartBackend
    LOAD environment variables from .env
    VALIDATE DATABASE_URL is configured for PostgreSQL
    CREATE Flask application instance
    CONFIGURE CORS, session, database, and service dependencies
    REGISTER all API blueprints through backend/app/routes.py
    START backend server on configured host and port
END PROCEDURE
```

Suggested code snippet reference:

- `backend/app/routes.py`: include the `register_routes(app: Flask)` function showing route registration for authentication, users, experiments, blueprints, models, hub, docs, jobs, logs, market data, and system endpoints.
- `backend/app/config.py`: include the configuration loading section for database URL, Redis URL, session settings, CORS origins, and API prefix.

## 6.3.2 Frontend Setup

The frontend is a Next.js application using the app-router layout. Page routes are implemented under `frontend/app/`, while feature views are implemented under `frontend/views/`. Shared interface elements are implemented under `frontend/components/`, and frontend utilities such as API requests, route metadata, authentication guards, validators, and theme helpers are implemented under `frontend/lib/`.

The frontend setup uses npm scripts from `frontend/package.json`. `next dev` runs the development server, `next build` creates the production build, `next start` serves the built application, `tsc --noEmit` performs type checking, and `jest --passWithNoTests` runs the frontend tests.

| Frontend setup item | Implementation detail | Relative paths |
|---|---|---|
| App router pages | Dashboard, experiments, blueprints, models, hub, docs, jobs, profile, admin users, system, login, register | `frontend/app/` |
| Feature views | Full page-level UI implementation for major workflows | `frontend/views/` |
| Shared layout | App shell, sidebar, top bar, breadcrumbs, page shell, page header | `frontend/components/layout/` |
| Shared UI | Buttons, forms, tables, status badges, dialogs, charts, state blocks | `frontend/components/` |
| API integration | Typed wrapper around backend endpoints | `frontend/lib/api/client.ts` |
| Route visibility and guards | Role-aware navigation and protected routes | `frontend/lib/routes/nav.ts`, `frontend/lib/auth/`, `frontend/tests/auth-guards.test.tsx` |

Frontend setup pseudocode:

```text
PROCEDURE StartFrontend
    INSTALL npm dependencies in frontend directory
    READ NEXT_PUBLIC_API_BASE_URL or use same-origin backend proxy
    START Next.js development server
    RENDER app-router pages from frontend/app
    FETCH backend data through frontend/lib/api/client.ts
    APPLY authentication and role guards before protected views render
END PROCEDURE
```

Required screenshots for this subsection:

1. Screenshot of the login page from `frontend/app/(auth)/login/`.
2. Screenshot of the dashboard page from `frontend/app/dashboard/` with navigation visible.
3. Screenshot of the experiment wizard page from `frontend/app/experiments/new/` showing multi-step setup.
4. Screenshot of the blueprint wizard page from `frontend/app/blueprints/new/` showing blueprint creation.

## 6.3.3 Build Tools and Package Managers

The backend uses Python packaging and virtual environment tooling. Dependencies are declared in `backend/pyproject.toml` and lock-step development dependencies are also provided through `backend/requirements.txt` and `backend/requirements-dev.txt`. The backend test runner is pytest. Alembic is used for schema migrations, and Python module commands are used for ingestion, refresh, worker, and cleanup scripts.

The frontend uses npm as its package manager and Next.js as its build tool. npm scripts in `frontend/package.json` define the core frontend commands. TypeScript provides compile-time checking, while Jest and React Testing Library provide the frontend test environment.

| Tool | Command / usage | Relative path |
|---|---|---|
| Python venv + pip | Install backend dependencies | `backend/requirements-dev.txt`, `backend/pyproject.toml` |
| pytest | Run backend tests | `backend/tests/` |
| Alembic | Apply database migrations | `backend/alembic/versions/` |
| npm | Install frontend dependencies | `frontend/package.json` |
| Next.js CLI | Run, build, and start frontend | `frontend/package.json` |
| TypeScript compiler | Type-check frontend | `frontend/tsconfig.json` |
| Jest | Run frontend unit/component tests | `frontend/tests/` |
| Shell startup scripts | Start services and run combined tests | `scripts/start_app.sh`, `scripts/test_all.sh` |

The combined local setup should start PostgreSQL first, start Redis second, then start the backend, worker, and frontend. This order matters because experiment creation depends on the database for persistence and Redis for queue metadata. If Redis is unavailable, experiment submission cannot be queued successfully.

Required screenshots for this subsection:

1. Screenshot of terminal running backend tests with pytest.
2. Screenshot of terminal running frontend tests with npm/Jest.
3. Screenshot of frontend build or development server output.
