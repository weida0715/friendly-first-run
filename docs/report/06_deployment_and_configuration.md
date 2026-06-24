# Deployment and Configuration

## Backend Setup

The backend runs from the `backend/` directory with Python 3.11 dependencies installed from `backend/requirements.txt`.

Required backend services and configuration:

- PostgreSQL must be reachable through `DATABASE_URL`.
- Redis must be reachable through `REDIS_URL` when Redis sessions or queue workers are used.
- `SECRET_KEY` must be set to a production-safe secret.
- `FLASK_ENV=production` should be used for production.
- `SESSION_COOKIE_SECURE=true` should be used behind HTTPS.

The WSGI entrypoint is `backend/wsgi.py`. For local development, it starts Flask on `0.0.0.0:5000`.

## Frontend Setup

The frontend runs from the `frontend/` directory with npm dependencies installed from `frontend/package-lock.json`.

Important frontend configuration:

- `NEXT_PUBLIC_API_BASE_URL` controls where frontend API calls are sent.
- In the browser, the frontend prefers the same-origin `/api/backend` proxy path unless a relative override is configured.
- Local development uses `npm run dev`.
- Production should build with `npm run build` and run with `npm run start` or the hosting platform's Next.js runtime.

## Database Setup

The project uses PostgreSQL. `DATABASE_URL` must use a PostgreSQL scheme such as:

```text
postgresql+psycopg://bee_user:bee_password@localhost:5432/bee
```

Schema changes are managed by Alembic migrations under `backend/alembic`. The application also initializes SQLAlchemy metadata at startup, but migrations are the intended schema history for deployment.

Database-related environment variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by SQLAlchemy and Alembic. |
| `FLASK_ENV` | Selects development, testing, or production config. |
| `SECRET_KEY` | Flask secret key for signed security features. |

## Worker Setup

Experiments are executed asynchronously through a background worker. The worker entrypoint is:

```text
python -m app.scripts.run_worker
```

The local startup script runs this command from the backend directory with `PYTHONPATH` pointing at `backend/`.

Worker-related environment variables:

| Variable | Purpose |
| --- | --- |
| `REDIS_URL` | Redis connection used by queue and session infrastructure. |
| `QUEUE_NAME` | Queue name for experiment jobs. Defaults to `experiments`. |
| `SESSION_BACKEND` | Session storage backend. Use `redis` for production-style deployment. |
| `SESSION_TIMEOUT_MINUTES` | Server-side session lifetime. |

## Network and Port Configuration

Local development uses these default ports:

| Service | Local URL |
| --- | --- |
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:5000` |
| Redis | `redis://localhost:6379/0` |
| PostgreSQL | Defined by `DATABASE_URL` |

API and network environment variables:

| Variable | Purpose |
| --- | --- |
| `BACKEND_API_ORIGIN` | Backend origin used by local integration assumptions. |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API base path or URL. |
| `CORS_ALLOW_ORIGINS` | Comma-separated list of allowed browser origins for backend API calls. |
| `BINANCE_BASE_URL` | Base URL for Binance market data requests. |
| `AUTH_SESSION_COOKIE_NAME` | Cookie name for the app authentication session. |
| `FLASK_SESSION_COOKIE_NAME` | Separate Flask session cookie name used by Flask-WTF. |
| `SESSION_COOKIE_SAMESITE` | SameSite policy for the auth session cookie. |
| `SESSION_COOKIE_SECURE` | Enables Secure cookie behavior for HTTPS. |

The production deployment is assumed to be hosted at:

```text
https://bitcoin-experimental-engine.cc.cd/
```

With Cloudflare in front of the site, HTTPS termination, DNS, and edge routing are handled at the Cloudflare boundary. The application still needs the backend, frontend, database, Redis, worker, and environment variables configured on the origin infrastructure.

## Summary

Local development is started with:

```text
scripts/start_app.sh
```

The script checks for Bash, Node.js, npm, Python, Redis CLI, a reachable Redis instance, backend virtual environment, frontend dependencies, and `DATABASE_URL`. It then starts:

1. Backend on `http://localhost:5000`.
2. Experiment worker.
3. Frontend on `http://localhost:3000`.

Automated verification installs backend dependencies, runs `pytest`, installs frontend dependencies with `npm ci`, and runs Jest tests in-band.
