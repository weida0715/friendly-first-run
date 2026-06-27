# 6.2 Development Environment

This section describes the development environment used to implement BEE. The system uses a Python backend and a TypeScript frontend. The backend handles API requests, database access, authentication, market-data processing, queue handling, and experiment execution. The frontend handles page routing, user interaction, charts, forms, tables, and client-side tests. The chosen environment reflects the source code that is present in the project.

## 6.2.1 Programming Languages Used

BEE is implemented mainly in Python and TypeScript. Python is used for the Flask backend, domain models, repositories, services, validators, worker processes, scripts, and automated backend tests. TypeScript and TSX are used for the Next.js frontend, React views, API client, navigation logic, form components, charts, and frontend tests. SQL is expressed through SQLAlchemy ORM models and Alembic migration files rather than through separate handwritten application SQL files.

| Language | Purpose in the project | Main relative paths |
|---|---|---|
| Python | Backend API, services, repositories, validators, domain models, execution engine, worker, scripts, and pytest tests | `backend/app/`, `backend/tests/` |
| TypeScript and TSX | Next.js pages, React views, UI components, typed API client, navigation, route guards, validators, and Jest tests | `frontend/app/`, `frontend/views/`, `frontend/components/`, `frontend/lib/`, `frontend/tests/` |
| SQL through ORM and migrations | Database schema and schema evolution for PostgreSQL | `backend/app/infrastructure/database/orm/`, `backend/alembic/versions/` |
| Shell script | Local service startup and test commands | `scripts/start_app.sh`, `scripts/test_all.sh` |

The backend package configuration states that the backend targets Python 3.11. The project metadata and Python dependencies are declared in `backend/pyproject.toml`. The frontend package configuration declares the Next.js, React, TypeScript, testing, charting, and UI dependencies in `frontend/package.json`.[^impl-pyproject][^impl-package]

## 6.2.2 Frameworks and Libraries

The backend uses Flask as the web framework. SQLAlchemy maps domain objects to database tables, and Alembic manages database migrations. Redis and RQ support the asynchronous job queue. pandas, Polars, NumPy, and scikit-learn support experiment data processing and model execution. Binance Connector supports external BTCUSDT candle retrieval.

The frontend uses Next.js and React. Tailwind CSS, class-variance-authority, clsx, Radix Slot, and related component utilities support the interface. Lightweight Charts is used for BTCUSDT chart rendering. Jest and React Testing Library support frontend automated testing.

| Area | Frameworks and libraries | Evidence in source code |
|---|---|---|
| Backend API | Flask, Flask-Login, Flask-WTF, Werkzeug | `backend/pyproject.toml` lines 11-27, `backend/app/routes.py` |
| Persistence | SQLAlchemy, Alembic, PostgreSQL database URL | `backend/pyproject.toml` lines 11-27, `backend/app/infrastructure/database/` |
| Data processing | pandas, Polars, NumPy | `backend/pyproject.toml` lines 11-27, `backend/app/executors/default_experiment_executor.py` |
| Machine learning | scikit-learn | `backend/pyproject.toml` lines 11-27, `backend/app/architectures/` |
| Queue processing | Redis and RQ | `backend/pyproject.toml` lines 11-27, `backend/app/services/queue_service.py`, `backend/app/infrastructure/redis/job_queue.py` |
| Frontend application | Next.js, React, React DOM, TypeScript | `frontend/package.json` |
| UI and charts | Tailwind-related utilities, lucide-react, d3, Lightweight Charts | `frontend/package.json`, `frontend/components/`, `frontend/tests/btcusdt-price-chart.test.tsx` |
| Testing | pytest, Jest, React Testing Library | `backend/tests/`, `frontend/tests/` |

## 6.2.3 IDEs and Tools

The project can be developed in Visual Studio Code or any IDE that supports Python, TypeScript, TSX, Markdown, and environment files. The source tree is divided into `backend/`, `frontend/`, `docs/`, and `scripts/`, so the IDE should support multi-folder navigation.

| Tool | Use in development | Related path or file |
|---|---|---|
| Visual Studio Code or equivalent IDE | Editing backend, frontend, scripts, and Markdown report files | Whole repository |
| Python virtual environment | Isolating backend dependencies during local development | `backend/.venv/` during local setup |
| pip | Installing backend dependencies | `backend/requirements.txt`, `backend/requirements-dev.txt`, `backend/pyproject.toml` |
| npm | Installing and running frontend dependencies | `frontend/package.json` |
| pytest | Running backend tests | `backend/tests/` |
| Jest and React Testing Library | Running frontend tests | `frontend/tests/` |
| Alembic | Managing database migrations | `backend/alembic/versions/` |
| PostgreSQL client or GUI | Inspecting application tables and records | Database connected through `.env` |
| Redis server | Running local queue infrastructure | Configured through `.env` |

## 6.2.4 Version Control System

The project is managed as a Git repository. This allows the backend source code, frontend source code, tests, scripts, documentation, and report drafts to be maintained together. For the report, the relevant point is not the hosting platform but the fact that Git supports traceable changes across the whole system.

The report should not treat generated dependency folders or generated build output as implementation evidence. The relevant evidence is the source code and test code under the main project folders. When describing a file, the report should use relative paths such as `backend/app/controllers/experiment_controller.py` or `frontend/views/experiment-wizard-view.tsx` so the reader can locate the implementation quickly.

## 6.2.5 Operating System Used

The local development environment uses a Linux-style path and shell workflow. The repository paths use `/mnt/SSD/...`, and the provided scripts use POSIX shell conventions. The backend runs with Python 3.11, and the frontend runs with Node.js and npm. PostgreSQL and Redis are expected as local services during development.

| Environment item | Value or role |
|---|---|
| Operating system style | Linux-based local development environment |
| Backend runtime | Python 3.11 target |
| Frontend runtime | Node.js with npm scripts |
| Backend server | Flask development service for local demonstration |
| Frontend server | Next.js development service for local demonstration |
| Database service | PostgreSQL |
| Queue service | Redis with RQ worker |

## Required screenshots and code snippets

| Evidence | What to capture | Suggested source or page |
|---|---|---|
| Backend dependency screenshot | Backend language and library versions | `backend/pyproject.toml` lines 11-31 |
| Frontend dependency screenshot | Next.js, React, TypeScript, test, chart, and UI dependencies | `frontend/package.json` |
| Development terminal screenshot | Python, Node.js, PostgreSQL, and Redis available | Local terminal |
| Backend test command screenshot | pytest running backend tests | `backend/tests/` |
| Frontend test command screenshot | Jest running frontend tests | `frontend/tests/` |

[^impl-pyproject]: Backend dependencies are declared in `backend/pyproject.toml`, especially the dependency block starting at line 11.
[^impl-package]: Frontend scripts and dependencies are declared in `frontend/package.json`, especially the `scripts`, `dependencies`, and `devDependencies` sections.
