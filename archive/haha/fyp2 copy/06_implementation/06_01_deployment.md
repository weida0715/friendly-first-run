# 6.1 Deployment

This chapter documents the implementation of the Bitcoin Experimental Engine (BEE), a web-enabled experimentation system for BTCUSDT quantitative research. The implementation joins a Next.js frontend, Flask backend API, PostgreSQL persistence layer, Redis-backed job queue, market-data ingestion utilities, and an asynchronous experiment worker into one reproducible research platform. The implementation evidence in this chapter is taken from the live source code only. Historical planning folders and non-product workflow materials are intentionally excluded from the report.

The deployed system is structured as a browser-based application with a backend service and worker process. The frontend is served from `frontend/` and exposes routes for dashboard, authentication, experiments, blueprints, models, favourites, public hub, documentation, jobs, profile, moderator, and administrator functions. The backend is served from `backend/` and exposes REST-style JSON endpoints under `/api`. Route registration is centralized in `backend/app/routes.py`, especially lines 68-91, where each feature blueprint is mounted under the configured API prefix.

## Implementation scope

| Area | Implemented scope | Main source-code evidence |
|---|---|---|
| Frontend application | Next.js route pages, reusable views, shell layout, route guards, dashboard, wizards, list/detail pages, public pages, staff pages | `frontend/app/*/page.tsx`, `frontend/views/*.tsx`, `frontend/components/*` |
| Backend API | Flask application factory, route registry, controllers, services, repositories, domain models, validators | `backend/app/__init__.py`, `backend/app/routes.py`, `backend/app/controllers/*.py`, `backend/app/services/*.py` |
| Authentication and RBAC | Registration, login, logout, current-user session lookup, role checks for User, Moderator, Admin | `backend/app/controllers/authentication_controller.py`, `backend/app/services/session_service.py`, `backend/app/services/access_control_service.py`, `frontend/lib/auth/*`, `frontend/components/auth/*` |
| Market data | BTCUSDT kline retrieval, normalization, cache upsert, chart API, metadata, administrative catch-up controls | `backend/app/infrastructure/binance/kline_client.py`, `backend/app/services/market_data_service.py`, `backend/app/controllers/market_data_controller.py` |
| Blueprint workflow | Blueprint wizard, architecture/indicator configuration, validation, library, detail, favourites, versioning, approval moderation | `backend/app/controllers/blueprint_controller.py`, `backend/app/controllers/blueprint_approval_controller.py`, `backend/app/validators/blueprint_validator.py`, `frontend/views/Blueprint*.tsx` |
| Experiment workflow | Experiment wizard, split configuration, target selection, blueprint selection, parameter overrides, compilation, queue submission, detail pages | `backend/app/controllers/experiment_controller.py`, `backend/app/validators/experiment_validator.py`, `backend/app/execution/experiment_compiler.py`, `frontend/views/Experiment*.tsx` |
| Execution pipeline | Data loading, feature/indicator execution, target generation, splitting, model training, metrics, logs, saved model records | `backend/app/executors/default_experiment_executor.py`, `backend/app/strategies/*`, `backend/app/architectures/*.py` |
| Queue and jobs | Redis/RQ queue adapter, queue service, worker, job detail, cancellation, system queue snapshot | `backend/app/infrastructure/redis/job_queue.py`, `backend/app/services/queue_service.py`, `backend/app/workers/experiment_worker.py`, `backend/app/controllers/job_controller.py`, `backend/app/controllers/system_controller.py` |
| Model and result exploration | Model highlights, rankings, owned/favourited model library, detail, favourite toggling, round logs/downloads | `backend/app/controllers/model_controller.py`, `backend/app/controllers/logs_download_controller.py`, `frontend/views/ModelsRankingsView.tsx`, `frontend/views/ModelDetailView.tsx` |
| Public and documentation modules | Public hub, public user profile, documentation browser and backend documentation listing | `backend/app/controllers/public_hub_controller.py`, `backend/app/controllers/documentation_controller.py`, `frontend/views/PublicHubView.tsx`, `frontend/views/DocumentationView.tsx` |
| Administration | User management, system settings/events, market-data admin catch-up and cleanup, system queue visibility | `backend/app/controllers/user_controller.py`, `backend/app/controllers/system_controller.py`, `frontend/views/UserManagementView.tsx`, `frontend/views/SystemManagementView.tsx` |

## Deployment topology

The application is deployed locally as three cooperative runtime processes and two backing services:

1. The frontend process serves the Next.js web application on port `3000`.
2. The backend process serves the Flask API on port `5000`.
3. The worker process consumes experiment jobs and updates experiment/model/log records.
4. PostgreSQL stores users, blueprints, experiments, market candles, models, logs, favourites, settings, and audit/system events.
5. Redis stores the experiment job queue and queue metadata.

This arrangement is visible in `scripts/start_app.sh`, which starts backend, worker, and frontend together. The worker entry point is `backend/app/scripts/run_worker.py`, while the Flask WSGI entry point is `backend/wsgi.py`. Environment variables are read from the same runtime model as `.env.example`, with the report assuming `.env.example` values are applied as `.env` where applicable.

## Deployment flow

```text
Developer or evaluator starts the system
  -> environment variables are loaded from .env-style configuration
  -> PostgreSQL connection is required through DATABASE_URL
  -> Redis connection is required through REDIS_URL for queued experiments
  -> Flask application factory creates backend app
  -> route registry mounts feature controllers under /api
  -> worker process waits for experiment jobs
  -> Next.js frontend serves route pages and calls backend API
  -> users operate dashboard, experiments, blueprints, models, hub, docs, and admin pages
```

## Recommended figures and screenshots

| Figure / screenshot | What to show | Suggested capture location |
|---|---|---|
| Deployment architecture diagram | Browser, Next.js frontend, Flask backend, PostgreSQL, Redis, worker, Binance API | Draw from `frontend/`, `backend/app/routes.py`, `backend/app/infrastructure/redis/job_queue.py`, `backend/app/infrastructure/binance/kline_client.py` |
| Local startup terminal | Backend, worker, and frontend startup sequence | Run `./scripts/start_app.sh` from repository root |
| Backend status page | Backend health page and `/api/health` link | `http://localhost:5000/` |
| Frontend home/dashboard | Guest landing state and authenticated dashboard state | `http://localhost:3000/` and `/dashboard` |

## Code evidence to include as screenshots

| Purpose | File and lines to screenshot | Reason |
|---|---|---|
| Backend route composition | `backend/app/routes.py`, lines 68-91 | Shows all feature API blueprints registered under `/api` |
| Frontend root composition | `frontend/app/layout.tsx`, full file or main component body | Shows global layout, theme, auth provider, and app shell composition |
| Runtime startup | `scripts/start_app.sh`, main process-launch section | Shows backend, worker, and frontend deployment in one command |
| WSGI entry point | `backend/wsgi.py`, full file | Shows backend production entry point |

## Summary

The deployment design supports the project objective of making BTCUSDT experimentation reproducible and accessible through a role-aware web interface. Instead of relying on scattered notebooks or scripts, BEE deploys the research workflow as a layered application: users configure experiments through the frontend, the backend validates and persists those configurations, Redis coordinates asynchronous execution, the worker compiles and executes reproducible experiment plans, and PostgreSQL stores the resulting evidence for later inspection through model rankings, logs, and public discovery pages.
