# 6.7 Network Configuration

## 6.7.1 Hosting Setup

The current implementation is configured for local development and demonstration using localhost services. The backend Flask API runs on `http://localhost:5000`, the frontend Next.js application runs on `http://localhost:3000`, PostgreSQL runs as the database service, and Redis runs as the queue/session-related infrastructure service. The source-code-backed deployment can later be moved to a cloud or institutional server by preserving the same environment variables and service relationships.

| Service | Local role | Typical local address | Source/configuration evidence |
|---|---|---|---|
| Frontend | Browser-facing Next.js application | `http://localhost:3000` | `frontend/package.json`, `frontend/next.config.ts`, `frontend/app/` |
| Backend API | Flask JSON API and health page | `http://localhost:5000` | `backend/app/routes.py`, `backend/app/config.py` |
| PostgreSQL | Main relational database | Configured through `DATABASE_URL` | `.env.example`, `backend/app/infrastructure/database/session.py` |
| Redis | Queue and transient infrastructure | `redis://localhost:6379/0` | `.env.example`, `backend/app/infrastructure/redis/job_queue.py` |
| RQ worker | Background experiment executor | Started as a backend worker process | `backend/app/workers/experiment_worker.py`, `backend/app/scripts/run_worker.py` |

The frontend connects to the backend through the configured API base URL. The project also supports a same-origin style backend proxy path through the frontend configuration, allowing the browser to call `/api/backend/*` while the Next.js layer forwards the request to the backend service. This reduces local CORS friction during development.

## 6.7.2 Port Configuration

The implementation uses separate ports because the frontend and backend are independent processes. The frontend is served by Next.js, while the backend is served by Flask. Redis and PostgreSQL run on their own service ports.

| Component | Port / connection | Notes |
|---|---|---|
| Next.js frontend | `3000` | User accesses the web UI from the browser. |
| Flask backend | `5000` | Backend exposes `/api/*` routes and `/api/health`. |
| Redis | `6379` | Queue service and RQ worker connection. |
| PostgreSQL | Usually `5432` | Exact database URL is configured through `DATABASE_URL`. |
| Binance API | External HTTPS endpoint | Accessed by `backend/app/infrastructure/binance/kline_client.py`. |

The environment variable `CORS_ALLOW_ORIGINS` should include the frontend origin during local development. `BACKEND_API_ORIGIN` and `NEXT_PUBLIC_API_BASE_URL` should be configured consistently so that frontend requests reach the backend API. For local demonstration, the backend health endpoint should be reachable at `/api/health`, and the frontend-proxied health path should also work if the proxy is enabled.

## 6.7.3 Deployment to Server or Live Environment

The system can be deployed by running the same logical services on a server: Next.js frontend, Flask backend, PostgreSQL database, Redis server, and RQ worker. Environment variables must be configured before starting the backend and frontend. Market data should be seeded before demonstration if chart and experiment data availability is required.

Deployment pseudocode:

```text
PROCEDURE DeployBEE
    PROVISION PostgreSQL database
    PROVISION Redis server
    CONFIGURE backend .env from .env.example
    RUN Alembic migrations against PostgreSQL
    START Flask backend service
    START RQ worker service
    CONFIGURE frontend environment API base URL
    BUILD and START Next.js frontend
    RUN BTCUSDT ingestion or refresh if chart/experiment cache is empty
    VERIFY /api/health and frontend dashboard
END PROCEDURE
```

Required screenshots:

1. Backend health endpoint showing healthy status.
2. Frontend dashboard loaded from the browser.
3. Redis service status or queue worker terminal output.
4. PostgreSQL connection/table listing showing application tables.
5. Terminal showing BTCUSDT ingestion or refresh command output.

Suggested code snippet reference:

- Include `frontend/next.config.ts` if showing backend proxy configuration.
- Include `scripts/start_app.sh` only as local startup evidence for service startup.
