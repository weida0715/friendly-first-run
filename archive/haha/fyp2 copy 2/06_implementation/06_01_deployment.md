# 6.1 Deployment

The implementation of the Bitcoin Experimental Engine (BEE) delivers a web-based experimental research platform for BTCUSDT quantitative model development. The implemented system is divided into a frontend application, backend API, persistent database layer, asynchronous experiment execution layer, and supporting data ingestion utilities. The implementation scope is based on the actual project codebase and is centred on allowing authenticated users to create reusable experiment blueprints, configure experiments, execute model training jobs, compare generated models, inspect experiment outputs, and discover approved public resources.

The deployment scope is local-development ready and structured for server deployment. The backend service exposes REST-style JSON APIs from `backend/app/routes.py`, while the frontend consumes those APIs through a typed client in `frontend/lib/api/client.ts`. The backend expects PostgreSQL for persistent storage and Redis/RQ for asynchronous job execution. The frontend runs as a Next.js application and communicates with the backend through the configured API base URL or the same-origin proxy route defined by the frontend configuration.

| Layer | Implementation scope | Main relative paths | Purpose |
|---|---|---|---|
| Frontend web client | Next.js application with role-aware pages and reusable components | `frontend/app/`, `frontend/views/`, `frontend/components/`, `frontend/lib/` | Provides dashboards, forms, wizards, charts, tables, admin views, and user-facing workflows. |
| Backend API | Flask application with controllers, services, validators, repositories, and route registry | `backend/app/routes.py`, `backend/app/controllers/`, `backend/app/services/`, `backend/app/validators/` | Handles authentication, validation, access control, business workflows, and API responses. |
| Database layer | SQLAlchemy ORM models, repositories, unit of work, and Alembic migrations | `backend/app/infrastructure/database/orm/`, `backend/app/repositories/`, `backend/alembic/versions/` | Stores users, blueprints, experiments, models, logs, favourites, market data, system events, and settings. |
| Experiment execution layer | Compiler, executor, strategies, worker, and queue abstraction | `backend/app/execution/`, `backend/app/executors/`, `backend/app/strategies/`, `backend/app/workers/`, `backend/app/services/queue_service.py` | Converts saved experiment configuration into executable plans and processes jobs asynchronously. |
| Market data layer | Binance connector, market data service, BTCUSDT kline cache, and scripts | `backend/app/infrastructure/binance/kline_client.py`, `backend/app/services/market_data_service.py`, `backend/app/scripts/` | Retrieves, normalizes, stores, refreshes, and serves BTCUSDT candle data. |
| Administration and moderation | User management, system settings/events, queue view, and blueprint moderation | `frontend/app/admin/`, `frontend/app/system/`, `frontend/app/blueprints/moderation/`, `backend/app/controllers/user_controller.py`, `backend/app/controllers/system_controller.py`, `backend/app/controllers/blueprint_approval_controller.py` | Provides role-restricted staff functions. |

The deployed application maps directly to the project objectives. The dashboard objective is supported by `frontend/app/dashboard/` and chart/data APIs under `backend/app/controllers/market_data_controller.py`. The experiment objective is supported by `frontend/app/experiments/`, `frontend/views/experiment-wizard-view.tsx`, `backend/app/controllers/experiment_controller.py`, `backend/app/execution/experiment_compiler.py`, and `backend/app/executors/default_experiment_executor.py`. The blueprint objective is implemented through `frontend/app/blueprints/`, `backend/app/controllers/blueprint_controller.py`, `backend/app/validators/blueprint_validator.py`, and `backend/app/services/versioning_service.py`. Model comparison and model library features are implemented through `frontend/app/models/`, `backend/app/controllers/model_controller.py`, and `backend/app/repositories/model_repository.py`. Favourites are supported by dedicated ORM and repository files such as `backend/app/infrastructure/database/orm/favorite_blueprint_orm.py`, `backend/app/infrastructure/database/orm/favorite_model_orm.py`, `backend/app/repositories/favorite_blueprint_repository.py`, and `backend/app/repositories/favorite_model_repository.py`.

Deployment is not only a matter of launching screens. The backend application must be connected to PostgreSQL and Redis before experiment execution is fully available. PostgreSQL is required because the database configuration intentionally targets the ERD-backed persistence model, while Redis is required for queue-backed experiment jobs. The user-facing deployment therefore consists of three concurrently running processes: the Flask backend, the RQ worker, and the Next.js frontend. The helper script `scripts/start_app.sh` is referenced by the project README as the local startup entry point for these processes.

Required screenshots for this subsection:

1. Screenshot of the running frontend landing/dashboard page showing the BEE navigation sidebar and authenticated layout.
2. Screenshot of the backend health endpoint response from `/api/health`.
3. Screenshot of terminal services running together: backend, frontend, and worker.

Suggested code snippet reference:

- Include the route registration snippet from `backend/app/routes.py`, especially the `register_routes(app: Flask)` function, because it shows how API modules are mounted under `/api`.
- Include the frontend API base/proxy usage from `frontend/lib/api/client.ts`, especially the exported API functions that consume backend endpoints.
