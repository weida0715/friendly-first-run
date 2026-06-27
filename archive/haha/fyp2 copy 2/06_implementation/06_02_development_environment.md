# 6.2 Development Environment

## 6.2.1 Programming Languages Used

The system uses two main programming languages. Python is used for the backend API, domain logic, database repositories, experiment execution, market data processing, queue workers, and automated backend tests. TypeScript is used for the frontend web application, typed API client, reusable UI components, route guards, and frontend tests. SQL is used indirectly through SQLAlchemy ORM models and Alembic migrations to define and evolve the PostgreSQL schema.

| Language | Usage in the system | Relative paths |
|---|---|---|
| Python | Backend controllers, services, validators, repositories, domain models, experiment compiler, executor, market data ingestion, queue worker, and pytest tests | `backend/app/`, `backend/tests/` |
| TypeScript / TSX | Next.js pages, React views, UI components, frontend API client, route configuration, validation helpers, and Jest/React Testing Library tests | `frontend/app/`, `frontend/views/`, `frontend/components/`, `frontend/lib/`, `frontend/tests/` |
| SQL / migration DDL | PostgreSQL schema evolution through Alembic migration scripts and SQLAlchemy mappings | `backend/alembic/versions/`, `backend/app/infrastructure/database/orm/` |
| Shell script | Local service startup and combined test runner | `scripts/start_app.sh`, `scripts/test_all.sh` |

## 6.2.2 Frameworks and Libraries

The backend is implemented using Flask, SQLAlchemy, Alembic, Flask-WTF, Flask-Login, pandas, Polars, NumPy, scikit-learn, Redis, and RQ. The declared backend dependencies are listed in `backend/pyproject.toml`. Flask provides the HTTP API layer. SQLAlchemy and Alembic implement ORM-based persistence and schema migration. Redis and RQ provide queue-backed background execution. pandas, Polars, NumPy, and scikit-learn support market data transformation and model execution.

The frontend is implemented using Next.js, React, Tailwind CSS, Radix UI slot primitives, class-variance-authority, clsx, lucide-react, d3, and TradingView Lightweight Charts. The declared frontend dependencies are listed in `frontend/package.json`. Next.js provides the app-router structure. React and TSX implement reusable views and components. Tailwind-based component styling supports a consistent user interface, while Lightweight Charts is used for BTCUSDT price visualization.

| Area | Frameworks / libraries | Implementation evidence |
|---|---|---|
| Backend web API | Flask 3.1.3, Flask-Login, Flask-WTF | `backend/pyproject.toml`, `backend/app/routes.py`, `backend/app/controllers/` |
| Persistence | SQLAlchemy 2.0.45, Alembic 1.17.2, PostgreSQL driver expected through the database URL | `backend/app/infrastructure/database/`, `backend/alembic/versions/` |
| Experiment computation | pandas, Polars, NumPy, scikit-learn | `backend/app/executors/default_experiment_executor.py`, `backend/app/execution/` |
| Queue processing | Redis, RQ | `backend/app/services/queue_service.py`, `backend/app/infrastructure/redis/job_queue.py`, `backend/app/workers/experiment_worker.py` |
| Frontend application | Next.js 15, React 19, TypeScript | `frontend/package.json`, `frontend/app/`, `frontend/views/` |
| UI and visualization | Tailwind CSS, Radix UI, lucide-react, d3, lightweight-charts | `frontend/components/`, `frontend/views/`, `frontend/tests/btcusdt-price-chart.test.tsx` |
| Testing | pytest, Jest, React Testing Library | `backend/tests/`, `frontend/tests/` |

## 6.2.3 IDEs and Tools

The project can be developed with a general-purpose IDE such as Visual Studio Code because the repository contains separate backend and frontend workspaces with standard Python and Node.js tooling. Backend work is supported by virtual environments, pytest, Alembic, and Python module execution. Frontend work is supported by npm scripts for development, build, type-checking, and Jest tests. Database management is supported through PostgreSQL-compatible tools and Alembic migration scripts.

| Tool | Usage |
|---|---|
| VS Code or equivalent IDE | Editing Python, TypeScript, TSX, Markdown, and environment files. |
| Python virtual environment | Isolating backend dependencies under `backend/.venv/` during local development. |
| npm | Installing frontend dependencies and running Next.js/Jest scripts from `frontend/package.json`. |
| pytest | Running backend unit and integration tests under `backend/tests/`. |
| Jest + React Testing Library | Running frontend view/component tests under `frontend/tests/`. |
| Alembic | Managing database migrations under `backend/alembic/versions/`. |
| Redis server | Supporting the experiment queue and worker lifecycle. |
| PostgreSQL client/tool | Inspecting and managing the ERD-backed database. |

## 6.2.4 Version Control System

The repository is structured as a Git project. Source files, tests, application code, scripts, and report drafts are organized into tracked project folders. The relevant point for this chapter is that Git is the version control mechanism used to maintain the backend, frontend, documentation, scripts, and report drafts together in one project.

## 6.2.5 Operating System Used

The implementation is designed for a Linux-style development environment. The provided paths and scripts use POSIX shell conventions, and the example service setup assumes local ports for the backend, frontend, Redis, and PostgreSQL. The backend dependency target is Python 3.11 according to `backend/pyproject.toml`, while the frontend uses Node.js tooling with Next.js and npm. The report can describe the actual development operating system as Linux, with deployment currently demonstrated locally using localhost services.

Required screenshots for this subsection:

1. Screenshot of `backend/pyproject.toml` showing backend dependencies.
2. Screenshot of `frontend/package.json` showing frontend dependencies and scripts.
3. Screenshot of terminal showing Python, Node.js, PostgreSQL, and Redis availability.

Suggested code snippet reference:

- Include `backend/pyproject.toml` dependency lines for Flask, SQLAlchemy, Alembic, scikit-learn, redis, and rq.
- Include `frontend/package.json` script and dependency sections for Next.js, React, Jest, Tailwind, and Lightweight Charts.
