# 6.2 Development Environment

The BEE development environment is a full-stack web development environment. The backend is implemented in Python using Flask and SQLAlchemy-style database infrastructure. The frontend is implemented in TypeScript using Next.js, React, Tailwind CSS, and reusable component patterns. Experiment execution uses Python data-science libraries and scikit-learn model wrappers, while PostgreSQL and Redis support persistent storage and asynchronous job handling.

## 6.2.1 Programming languages used

| Language | Used for | Source-code evidence |
|---|---|---|
| Python | Backend API, domain models, repositories, services, validators, experiment execution, market-data scripts, worker process, tests | `backend/app/**/*.py`, `backend/tests/*.py` |
| TypeScript / TSX | Frontend route pages, views, reusable components, API client, auth provider, tests | `frontend/app/**/*.tsx`, `frontend/views/*.tsx`, `frontend/components/**/*.tsx`, `frontend/lib/**/*.ts`, `frontend/tests/*.tsx` |
| CSS | Global styling, theme variables, Tailwind layers | `frontend/app/globals.css` |
| Shell | Local startup and unified test commands | `scripts/start_app.sh`, `scripts/test_all.sh` |
| SQL migration Python | Alembic schema migration declarations | `backend/alembic/versions/*.py` |

The most important language boundary is between the TypeScript frontend and the Python backend. The frontend is responsible for user interaction and presentation. The backend is responsible for validation, authorization, persistence, execution coordination, and data transformation. This separation is visible through route wrappers such as `frontend/app/experiments/new/page.tsx`, which renders `ExperimentWizardView`, and backend controllers such as `backend/app/controllers/experiment_controller.py`, which validates and persists experiment submissions.

## 6.2.2 Frameworks and libraries

| Category | Framework / library | Evidence path | Implementation role |
|---|---|---|---|
| Web backend | Flask | `backend/app/__init__.py`, `backend/app/routes.py` | Application factory, request handling, route registration, JSON API boundaries |
| Persistence | SQLAlchemy-style ORM and Alembic | `backend/app/infrastructure/database/orm/*.py`, `backend/alembic/versions/*.py` | Table mapping, migration baseline, repository-backed persistence |
| Queue | Redis/RQ | `backend/app/infrastructure/redis/job_queue.py`, `backend/app/services/queue_service.py`, `backend/app/workers/experiment_worker.py` | Experiment queueing, worker execution, cancellation, metadata lookup |
| Market data | Binance connector | `backend/app/infrastructure/binance/kline_client.py`, `backend/app/services/market_data_service.py` | BTCUSDT 1-minute kline retrieval and cache refresh |
| Machine learning | scikit-learn-style architectures | `backend/app/architectures/logistic_regressor_architecture.py`, `backend/app/architectures/ridge_classifier_architecture.py` | Trainable model strategies used by compiled experiments |
| Data processing | Polars-style frame handling | `backend/app/executors/default_experiment_executor.py`, `backend/app/strategies/*` | Indicator execution, feature scaling, targets, splits, metrics |
| Web frontend | Next.js and React | `frontend/app/layout.tsx`, `frontend/app/*/page.tsx`, `frontend/views/*.tsx` | App Router pages, client views, reusable UI composition |
| Styling | Tailwind CSS and shadcn-style components | `frontend/app/globals.css`, `frontend/components/ui/*`, `frontend/tailwind.config.ts` | Theme variables, UI primitives, cards, buttons, tables, badges, dialogs |
| Charting | Lightweight chart component wrapper | `frontend/components/charts/BTCUSDTPriceChart.tsx`, `frontend/components/charts/useBTCUSDTChartData.ts` | BTCUSDT price chart rendering in dashboard and experiment pages |
| Testing | pytest, Jest, Testing Library | `backend/tests/*.py`, `frontend/tests/*.tsx`, `frontend/jest.config.cjs` | Backend unit/integration tests and frontend view/component tests |

## 6.2.3 IDEs and tools

The source tree is designed for standard code editors such as VS Code or JetBrains IDEs. The repository includes package manager files, type-checking configuration, test configuration, backend dependency files, and startup scripts. The primary development tools are:

| Tool | Purpose | Source-code evidence |
|---|---|---|
| npm | Frontend dependency installation, tests, type checking, and build/start scripts | `frontend/package.json`, `frontend/package-lock.json` |
| pip / virtual environment | Backend dependency installation | `backend/requirements.txt`, `backend/requirements-dev.txt`, `backend/.python-version` |
| pytest | Backend test execution | `backend/tests/*.py`, `backend/pyproject.toml` |
| Jest | Frontend test execution | `frontend/jest.config.cjs`, `frontend/jest.setup.ts`, `frontend/tests/*.tsx` |
| Alembic | Database migration management | `backend/alembic.ini`, `backend/alembic/env.py`, `backend/alembic/versions/*.py` |
| Redis server | Queue backend for asynchronous experiments | `backend/app/infrastructure/redis/job_queue.py` |
| PostgreSQL | Runtime database | `.env.example`, `backend/app/config.py`, `backend/app/infrastructure/database/session.py` |

## 6.2.4 Version control system

The project uses Git as its version control system. For the report, implementation evidence should refer to source files and committed source paths, not to non-product workflow items. The relevant source-code evidence includes the backend, frontend, scripts, tests, and product documentation paths. Non-product workflow folders, hidden folders, and historical materials are not needed in the report body.

## 6.2.5 Operating system used

The runtime scripts and dependency instructions are Linux-oriented. The backend uses Python virtual environments, the frontend uses Node.js, and Redis/PostgreSQL run as local services. The implementation can be executed on Linux or similar POSIX environments. The repository root contains `scripts/start_app.sh` and `scripts/test_all.sh`, which assume shell execution.

## Environment variables

The runtime configuration should be described as `.env` configuration derived from `.env.example`. Important variables include:

| Variable | Purpose | Used by |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `backend/app/config.py`, database session layer |
| `REDIS_URL` | Redis queue connection | `backend/app/config.py`, `backend/app/infrastructure/redis/job_queue.py` |
| `QUEUE_NAME` | Queue name for experiment jobs | `backend/app/config.py`, queue service |
| `SECRET_KEY` | Flask/session security setting | `backend/app/config.py` |
| `SESSION_BACKEND` | Session storage mode | `backend/app/config.py`, `backend/app/services/session_service.py` |
| `BINANCE_BASE_URL` | Binance API base URL | `backend/app/config.py`, `backend/app/infrastructure/binance/kline_client.py` |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API base override | `frontend/lib/api/client.ts` |
| `BACKEND_API_ORIGIN` | Next.js proxy target for backend API | `frontend/next.config.ts` |
| `CORS_ALLOW_ORIGINS` | Allowed frontend origins for API requests | `backend/app/config.py`, `backend/app/__init__.py` |

## Recommended screenshots and code snippets

| Evidence type | What to capture | Suggested path |
|---|---|---|
| Backend dependency file | Runtime and development packages | `backend/requirements.txt`, `backend/requirements-dev.txt` |
| Frontend scripts | npm scripts for dev, test, build, typecheck | `frontend/package.json` |
| Environment configuration | Safe variable names only, without secrets | `.env.example` |
| App factory configuration | How Flask loads config and registers infrastructure | `backend/app/__init__.py` |
| Frontend root layout | Providers and shell composition | `frontend/app/layout.tsx` |

## Summary

The development environment reflects the layered nature of the system. Python implements backend logic, experiment execution, data processing, and persistence. TypeScript implements the frontend experience and client-side route structure. PostgreSQL and Redis provide the required stateful services for experiments and queues. This environment is suitable for a final-year project because it demonstrates both software engineering implementation and applied machine-learning system integration.
