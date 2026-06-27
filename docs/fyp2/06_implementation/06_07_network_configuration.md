# 6.7 Network Configuration

This section describes how the implemented system is connected in a local deployment. BEE uses separate network endpoints for the frontend, backend, database, Redis queue, worker, and external market-data source. The frontend and backend communicate through HTTP API calls. The backend communicates with PostgreSQL and Redis through configured connection strings. The market-data service retrieves BTCUSDT candles through the backend connector and stores the result locally before the frontend reads it.

## 6.7.1 Hosting Setup

The current hosting setup is local-development oriented. The frontend is served by Next.js. The backend is served by Flask. PostgreSQL stores application data. Redis supports the job queue. The RQ worker runs beside the backend and consumes queued experiment jobs. The Binance connector is accessed only by the backend, not by the browser.

| Service | Local purpose | Typical local address or connection | Source-code evidence |
|---|---|---|---|
| Next.js frontend | Browser-facing web application | `http://localhost:3000` | `frontend/package.json`, `frontend/app/` |
| Flask backend | JSON API and backend health endpoint | `http://localhost:5000` | `backend/app/routes.py`, `backend/app/controllers/system_controller.py` |
| PostgreSQL | Main relational database | Configured by `DATABASE_URL` in `.env` | `backend/app/config.py`, `backend/app/infrastructure/database/` |
| Redis | Queue backend for background jobs | Configured by `REDIS_URL` in `.env` | `backend/app/config.py`, `backend/app/infrastructure/redis/job_queue.py` |
| RQ worker | Executes queued experiment jobs | Connected to Redis queues | `backend/app/workers/experiment_worker.py` |
| Binance endpoint | External source for BTCUSDT klines | Configured by `BINANCE_BASE_URL` | `backend/app/config.py`, `backend/app/infrastructure/binance/kline_client.py` |

The frontend should be treated as a client of the backend API. It does not connect directly to PostgreSQL, Redis, or Binance. This design limits the browser to application-level API calls and keeps data access, validation, and role checks in the backend.

## 6.7.2 Port Configuration

BEE uses separate ports because the frontend and backend are different processes. PostgreSQL and Redis use their own service ports. The exact values can be adjusted through environment variables, but the local setup follows conventional defaults.

| Component | Default or common value | Purpose |
|---|---|---|
| Frontend | `3000` | Serves the browser UI. |
| Backend | `5000` | Serves `/api` endpoints and health response. |
| PostgreSQL | `5432` | Stores persistent application data. |
| Redis | `6379` | Stores queue state and RQ job metadata. |
| Backend API prefix | `/api` | Groups internal backend endpoints. |
| Queue name | `experiments` | Main queue for experiment jobs. |

The route registry reads `API_PREFIX` from the backend configuration and registers the controllers under that prefix.[^net-routes] The worker reads `REDIS_URL` and `QUEUE_NAME`, then listens to high, normal, and low priority queues.[^net-worker]

Network flow:

```text
Browser
    -> Frontend on port 3000
    -> Backend API on port 5000
    -> PostgreSQL for persisted records
    -> Redis for job queue state
    -> Worker for experiment execution
    -> PostgreSQL for generated model and log output
```

## 6.7.3 Deployment to Server or Live Environment

The same architecture can be deployed to a server by keeping the service boundaries the same. The backend and worker must be able to reach PostgreSQL and Redis. The frontend must be configured to call the backend API. The backend should be configured with the correct frontend origin list. The market-data cache should be seeded or refreshed before demonstration if charts and experiments require historical BTCUSDT candles.

Deployment procedure:

```text
PROCEDURE DeployBEEToServer
    PROVISION PostgreSQL database
    PROVISION Redis service
    CONFIGURE backend environment values from .env
    APPLY database migrations
    START Flask backend process
    START RQ worker process
    CONFIGURE frontend API base path or origin
    BUILD and START Next.js frontend
    RUN BTCUSDT ingestion or refresh when cached data is needed
    VERIFY /api/health
    VERIFY dashboard, experiment wizard, and system page
END PROCEDURE
```

The system should be deployed with encrypted browser traffic in a live environment. In the local development setup, HTTP is acceptable because services run on localhost. For a public deployment, the web server or hosting platform should terminate HTTPS, and the backend session settings should be adjusted to match the secure environment.

## Required screenshots and code snippets

| Evidence | What to show | Suggested source or page |
|---|---|---|
| Network deployment diagram | Frontend, backend, PostgreSQL, Redis, worker, Binance connector | Draw from this subsection |
| Backend health screenshot | Healthy backend response | `/api/health`, implemented in `backend/app/controllers/system_controller.py` lines 50-61 |
| Running services screenshot | Frontend, backend, Redis, worker, and database running | Local terminal |
| Worker startup snippet | Redis URL, queue name, high/normal/low queues | `backend/app/workers/experiment_worker.py` lines 153-165 |
| Route prefix snippet | API prefix and registered controllers | `backend/app/routes.py` lines 77-98 |
| Frontend dashboard screenshot | Browser confirms frontend can call backend data | `frontend/app/dashboard/` |

[^net-routes]: API prefix and backend controller mounting are implemented in `backend/app/routes.py` lines 77-98.
[^net-worker]: Worker queue startup is implemented in `backend/app/workers/experiment_worker.py` lines 153-165.
