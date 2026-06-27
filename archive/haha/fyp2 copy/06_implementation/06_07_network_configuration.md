# 6.7 Network Configuration

The system is configured as a local web application with separate frontend, backend, database, and queue services. The frontend communicates with the backend through HTTP JSON APIs, while backend services communicate with PostgreSQL and Redis through configured connection strings.

## 6.7.1 Hosting setup

The expected local hosting arrangement is:

| Component | Local address / role | Source-code evidence |
|---|---|---|
| Frontend | `http://localhost:3000` | `frontend/package.json`, `frontend/next.config.ts`, `frontend/app/layout.tsx` |
| Backend API | `http://localhost:5000` | `backend/wsgi.py`, `backend/app/__init__.py`, `backend/app/routes.py` |
| Backend health endpoint | `http://localhost:5000/api/health` | `backend/app/controllers/system_controller.py` |
| PostgreSQL | Host/port from `DATABASE_URL`; commonly port `5432` | `.env.example`, `backend/app/config.py` |
| Redis | Host/port from `REDIS_URL`; commonly port `6379` | `.env.example`, `backend/app/config.py`, `backend/app/infrastructure/redis/job_queue.py` |
| Binance API | Configured by `BINANCE_BASE_URL` | `.env.example`, `backend/app/infrastructure/binance/kline_client.py` |

The frontend may call the backend through a same-origin proxy path depending on `NEXT_PUBLIC_API_BASE_URL` and `BACKEND_API_ORIGIN`. This reduces browser CORS friction during local development.

## 6.7.2 Port configuration

| Port | Service | Description |
|---|---|---|
| `3000` | Next.js frontend | Browser interface for all user-facing modules |
| `5000` | Flask backend | JSON API and backend health page |
| `5432` | PostgreSQL | Runtime relational database |
| `6379` | Redis | Experiment job queue and queue metadata |

The report should state that these are local-development defaults and can be adjusted through environment variables and service configuration. The code-level evidence for environment-driven configuration is `backend/app/config.py` and `frontend/next.config.ts`.

## 6.7.3 Deployment to server or live environment

The repository includes a startup script for local demonstration: `scripts/start_app.sh`. The script coordinates backend, worker, and frontend startup. For a production-like deployment, each service should be supervised separately:

```text
Start PostgreSQL
  -> Start Redis
  -> Run database migration
  -> Start Flask backend through WSGI server
  -> Start experiment worker process
  -> Build and start Next.js frontend
  -> Confirm /api/health and frontend route access
```

## Network request flow

```text
Browser opens frontend page
  -> Next.js renders route and view component
  -> frontend API client sends request to backend API
  -> backend controller validates session, CSRF, role, and ownership
  -> backend service/repository reads or writes PostgreSQL
  -> if experiment execution is requested, backend enqueues Redis job
  -> worker consumes Redis job and writes results to PostgreSQL
  -> frontend polls or reloads detail views to show updated status/results
```

## Required figures and screenshots

| Evidence item | What to capture |
|---|---|
| Network architecture diagram | Browser, frontend, backend API, PostgreSQL, Redis, worker, Binance |
| Backend health | `/api/health` JSON response |
| Frontend-backend proxy evidence | `frontend/next.config.ts` section that rewrites/proxies backend calls |
| Environment configuration | `.env.example` variable names for ports/origins, without secrets |
| Worker network dependency | `backend/app/infrastructure/redis/job_queue.py` showing Redis-backed queue connection |

## Summary

The network configuration is intentionally simple for evaluation and demonstration. The frontend runs as the web interface, the backend exposes the API, PostgreSQL stores persistent state, Redis coordinates long-running experiment jobs, and the worker performs the expensive execution process outside the web request cycle. This separation prevents the browser request from blocking while experiments are running and keeps the platform scalable for future deployment improvements.
