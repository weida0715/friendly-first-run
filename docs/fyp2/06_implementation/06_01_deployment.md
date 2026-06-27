# 6.1 Deployment

This chapter explains how the Bitcoin Experimental Engine, abbreviated as BEE, was implemented as a working web application. The implementation is not a single script or static prototype. It is a multi-layer system with a browser-based frontend, a Flask backend, PostgreSQL persistence, Redis-backed job processing, and a BTCUSDT market-data pipeline. The deployment described here is based on the current source code and the local development arrangement used by the project.

The system is deployed as separate services because each part has a different responsibility. The frontend renders the user interface. The backend exposes JSON APIs. PostgreSQL stores the application data. Redis and RQ handle background jobs. The worker process runs experiments outside the normal request-response cycle. This separation keeps long-running experiment work away from the user interface and allows the web application to remain responsive while a job is queued or running.

## Implementation scope

The implementation covers the core modules required for the project. A user can register, log in, view the dashboard, create blueprints, moderate blueprints if the user has the correct role, configure experiments, submit experiments to a queue, inspect jobs, view model results, manage favourites, browse public artefacts, read documentation, and use admin system pages. The route registry in `backend/app/routes.py` mounts the implemented backend modules under the `/api` prefix, including authentication, users, experiments, blueprints, models, public hub, documentation, jobs, logs, market data, and system management.[^impl-routes]

| Deployment part | Main responsibility | Main relative paths |
|---|---|---|
| Frontend application | Renders pages, forms, charts, tables, wizards, and role-based navigation | `frontend/app/`, `frontend/views/`, `frontend/components/`, `frontend/lib/` |
| Backend API | Handles HTTP requests, authentication, validation, access control, and business workflows | `backend/app/routes.py`, `backend/app/controllers/`, `backend/app/services/`, `backend/app/validators/` |
| Persistence layer | Stores users, blueprints, experiments, models, logs, favourites, market data, settings, and system events | `backend/app/infrastructure/database/orm/`, `backend/app/repositories/`, `backend/alembic/versions/` |
| Experiment execution layer | Compiles experiment plans, runs the executor, updates progress, and records output | `backend/app/execution/`, `backend/app/executors/`, `backend/app/workers/`, `backend/app/strategies/` |
| Queue layer | Places experiment work in Redis/RQ so execution does not block API requests | `backend/app/services/queue_service.py`, `backend/app/infrastructure/redis/job_queue.py`, `backend/app/workers/experiment_worker.py` |
| Market-data layer | Retrieves, normalizes, stores, serves, and administrates BTCUSDT candle data | `backend/app/infrastructure/binance/kline_client.py`, `backend/app/services/market_data_service.py`, `backend/app/controllers/market_data_controller.py`, `backend/app/scripts/` |

## Mapping implementation to project objectives

The project objective is to provide a reproducible web environment for BTCUSDT experimentation. The implementation supports this objective by connecting every user-facing workflow to a backend and persistence layer. The dashboard gives the user a starting point. The blueprint module stores reusable experiment design. The experiment module turns a selected blueprint into an executable job. The compiler records the effective parameters. The executor loads cached BTCUSDT candles and runs the selected strategies. The model and log modules expose results for comparison. The public hub and documentation modules help users discover and understand system artefacts. The admin and moderator modules support governance and operational control.

| Objective area | Implemented modules | Source-code evidence |
|---|---|---|
| Secure access | Registration, login, logout, current-user session, role-aware navigation | `backend/app/controllers/authentication_controller.py`, `backend/app/services/session_service.py`, `frontend/lib/routes/nav.ts` |
| Dashboard access | Authenticated dashboard, chart state, quick actions | `frontend/app/dashboard/`, `frontend/tests/dashboard-view.test.tsx` |
| Blueprint reuse | Blueprint wizard, library, detail, favourite, approval, moderation, versioning | `frontend/app/blueprints/`, `backend/app/controllers/blueprint_controller.py`, `backend/app/controllers/blueprint_approval_controller.py` |
| Experiment workflow | Experiment wizard, validation, creation, list, detail, cancellation, retry | `frontend/app/experiments/`, `backend/app/controllers/experiment_controller.py`, `backend/app/validators/experiment_validator.py` |
| Reproducible execution | Compiler snapshots, deterministic seed, parameter hashes, executor, worker | `backend/app/execution/experiment_compiler.py`, `backend/app/executors/default_experiment_executor.py`, `backend/app/workers/experiment_worker.py` |
| Market data | BTCUSDT kline cache, chart endpoint, target preview, admin catch-up controls | `backend/app/controllers/market_data_controller.py`, `backend/app/repositories/market_data_repository.py` |
| Model analysis | Rankings, highlights, detail, favourites, logs, downloads | `backend/app/controllers/model_controller.py`, `backend/app/controllers/logs_download_controller.py`, `frontend/app/models/` |
| Governance | Moderator blueprint queue and admin user/system management | `frontend/app/blueprints/moderation/`, `frontend/app/admin/users/`, `frontend/app/system/` |

## Deployment flow

The local deployment flow starts the database and Redis first. The backend then connects to PostgreSQL and Redis through environment variables. The worker starts after Redis is available because it listens to the configured experiment queues. The frontend starts separately and sends requests through its typed API client. The full system is only ready when all these services are running.

```text
PROCEDURE DeployLocalBEE
    START PostgreSQL database
    START Redis server
    LOAD environment variables from .env
    START Flask backend service
    REGISTER backend API routes under /api
    START experiment worker connected to Redis queues
    START Next.js frontend service
    OPEN browser at frontend URL
    VERIFY backend health endpoint and dashboard page
END PROCEDURE
```

The deployment can be represented as the following data flow:

```text
Browser user
    -> Next.js frontend
    -> Flask API routes
    -> Service and validation layer
    -> Repository and ORM layer
    -> PostgreSQL database

Experiment submission
    -> Flask experiment API
    -> Queue service
    -> Redis/RQ queue
    -> Worker
    -> Experiment compiler and executor
    -> PostgreSQL models and logs
    -> Frontend experiment detail and model pages
```

## Required figures and screenshots

The final report should include the following evidence in this subsection:

| Evidence | What to show | Suggested page or file |
|---|---|---|
| Deployment architecture figure | Browser, frontend, backend API, PostgreSQL, Redis/RQ, worker, and Binance connector | Draw from the source-code architecture described in this subsection |
| Backend health screenshot | JSON response showing service, version, environment, and status | `/api/health`, implemented in `backend/app/controllers/system_controller.py` lines 50-61 |
| Frontend dashboard screenshot | Sidebar, top bar, dashboard cards, and chart panel | `frontend/app/dashboard/` |
| Service terminal screenshot | Backend, frontend, Redis, and worker running locally | Local terminal during demonstration |
| Route registration code snippet | API modules registered under `/api` | `backend/app/routes.py` lines 77-98 |

[^impl-routes]: The backend route registry is implemented in `backend/app/routes.py` lines 77-98. It registers system, authentication, user, experiment, blueprint, model, public hub, documentation, job, log, and market-data controllers under the configured API prefix.
