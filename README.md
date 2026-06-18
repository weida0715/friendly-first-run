# Bitcoin Experimental Engine (BEE)

Bitcoin Experimental Engine (BEE) is an OOAD-driven, web-enabled experimentation framework for reproducible BTCUSDT quantitative research. It consolidates data-to-feature-to-model-to-evaluation workflow into a single architecture, then extends it with authenticated user access, model comparison, and public discovery capabilities.

This repository currently contains RFC-001 foundation, RFC-002 strict ERD persistence, RFC-003 authentication/session/RBAC/user-management delivery, RFC-004 prototype-matching frontend delivery, RFC-005 Blueprint workflow/versioning/moderation delivery, RFC-006 BTCUSDT market-data retrieval/cache refresh/charting delivery, RFC-007 experiment configuration/management delivery, and RFC-008 queue/worker/jobs/cancellation/system-management delivery.

## Why BEE

Bitcoin strategy research is often fragmented across scripts and tools, which weakens reproducibility and traceability. BEE addresses this by:

- enforcing a layered design aligned with FYP1 Chapter 5,
- structuring experiments around reusable **Blueprints**,
- preserving execution integrity using split-first experimentation flow,
- exposing results through a web UI with role-governed visibility.

## Current Scope (up to RFC-008)

At this stage, BEE provides a working multi-user auth/access-control foundation, blueprint governance workflow, BTCUSDT market-data retrieval/cache-refresh execution flow, experiment configuration/management flow, asynchronous experiment queue/worker lifecycle, job-level cancellation/ownership checks, and a prototype-aligned frontend boundary layer on top of strict ERD persistence.

Included:

- Registration/login/logout flows with backend validation and password hashing
- Server-managed sessions with cookie-based identity and `/api/auth/me`
- Frontend `AuthProvider` + protected route guards (`RequireAuth`, `RequireRole`)
- Role-based access control for `User`, `Moderator`, and `Admin`
- Staff user-management APIs and `UserManagementView`
- Strict ERD-backed PostgreSQL schema and repositories
- Auth/RBAC backend and frontend test coverage (pytest + Jest/RTL)
- Prototype-matching frontend shell/navigation/layout and reusable boundary UI components
- Prototype parity test coverage for routes/navigation/base-states/wizard/dialog/responsive smoke
- Blueprint wizard draft creation flow with backend persistence
- Blueprint library owned/favorited listing and detail rendering
- Favorite/unfavorite blueprint actions
- Immutable blueprint versioning rules for reviewed/submitted artifacts
- Approval request + moderation (approve/reject/disapprove) workflow foundations
- Approved blueprint option exposure for experiment wizard selection
- Binance-backed BTCUSDT 1m kline retrieval with request validation, pagination, and retry behavior
- BTCUSDT kline normalization + local upsert cache with duplicate timestamp prevention and inserted/updated refresh summaries
- Experiment execution refresh-before-load behavior using local BTCUSDT cache as deterministic source
- BTCUSDT chart API endpoint and TradingView Lightweight Charts rendering in Dashboard, Experiment Wizard, and Experiment Detail views
- Chart loading/empty/error state rendering for cache/data unavailability handling
- Experiment wizard end-to-end flow (`Basics` → `Dataset Range` → `Split Configuration` → `Blueprint Selection` → `Parameter Overrides` → `Review` → `Submit`)
- Experiment validation rules for fixed BTCUSDT scope, 1m interval, date ordering, split totals, min val/test thresholds, and blueprint accessibility
- Authenticated experiment creation with persisted configuration and `parameter_overrides`
- Experiment list API/UI with user ownership filtering and status/search filters
- Experiment detail API/UI with ownership enforcement, configuration summary, split summary, blueprint summary, and override summary
- Explicit non-mutation guarantee: blueprint records remain immutable when experiment overrides are submitted
- Redis/RQ-backed asynchronous experiment queueing through `QueueService` + `RedisJobQueue`
- Queue metadata resolver with transient cache fallback for job-detail continuity
- Worker payload validation and status transitions (`Queued -> Running -> Completed/Failed`) with progress callback hooks
- Job detail/cancellation APIs with ownership enforcement and non-owner access blocking
- Strategy-pattern cancellation scaffolding (`CancellableJobStrategy`, `ExperimentCancellationHandler`, `JobCancellationHandlerRegistry`)
- Admin-only queue snapshot endpoint (`GET /api/system/queue/active`) and System Management queue visibility UI

## RFC-008 Queue + Worker + Jobs Highlights

Implemented asynchronous experiment execution features include:

- **Queue Abstraction + Redis Adapter**
  - `JobQueue` protocol boundary and `QueueService` orchestration methods
  - `RedisJobQueue` infrastructure adapter encapsulating RQ/Redis operations
  - queue position/value-object handling through `JobSpecification` and `QueuePosition`
- **Experiment Enqueue Flow**
  - experiment creation enqueues `EXPERIMENT_EXECUTION` jobs after validation/persistence
  - queue metadata is returned to API consumers for immediate status visibility
- **Worker Lifecycle**
  - worker payload validation and experiment existence checks
  - transition path: `Queued -> Running -> Completed`
  - failure path: `Running -> Failed` with error capture
  - progress callback to persist stage/progress updates
- **Job Detail + Cancellation + Ownership**
  - authenticated job detail endpoint with owner/staff access control
  - queued/running cancellation behavior with guarded state handling
  - user-facing stale-job handling for removed/expired queue entries
- **System Queue Management (Admin)**
  - `GET /api/system/queue/active` admin-only snapshot endpoint
  - queue depth, running jobs, and active job list rendering in `SystemManagementView`

### RFC-008 acceptance checks (implemented)

- experiment submission creates queued job metadata
- worker processing updates lifecycle state transitions
- failure path marks experiment failed when executor raises
- owner can view/cancel own eligible queued job
- non-owner cannot access/cancel unauthorized jobs
- admin can view active queue snapshot in system view

### Role Accounts and Access Scope

Current platform role model (RFC-003):

- `User`
- `Moderator`
- `Admin`

Use the following account matrix during manual UI verification:

| Role          | Example Login Identity                     | Main Access                                                                                   | Restricted Access                                                        |
| ------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `User`      | `user@bee.local` / standard user account | Authenticated app pages (dashboard, experiments, models, blueprints, hub, docs, profile)      | Cannot access staff/admin management pages guarded by `RequireRole`    |
| `Moderator` | `moderator@bee.local` / staff account    | All `User` pages + staff-level user management page (`/admin/users`)                      | Cannot access admin-only system page (`/system`) or admin-only actions |
| `Admin`     | `admin@bee.local` / admin account        | Full platform access including `/admin/users` and `/system`; full user lifecycle controls | N/A (highest role)                                                       |

Notes:

- Route protection is enforced by frontend guards (`RequireAuth`, `RequireRole`) and backend RBAC.
- UI may show role-visibility cues, but authorization decisions must remain guard/API enforced.
- If seeded credentials differ by environment, keep role mapping the same and substitute your local account identifiers.

Not included yet:

- Public Hub full listing/governance UX (beyond approved blueprint exposure path)
- live trading or brokerage connectivity

## RFC-007 Experiment Configuration + Management Highlights

Implemented experiment workflow and management features include:

- **Experiment Wizard (Frontend)**
  - multi-step guided flow with step-by-step validation
  - fixed BTCUSDT dataset scope handling + date/candlestick mode checks
  - split configuration validation and review/submit flow
  - blueprint selection and experiment-scoped parameter override editing
- **Experiment Validation (Backend)**
  - required name, BTCUSDT-only symbol, and `1m` interval enforcement
  - date-range ordering validation
  - split numeric/sum/minimum threshold validation
  - blueprint accessibility validation
  - recursive parameter override object validation
- **Experiment Persistence + Access Control**
  - authenticated create endpoint with structured validation errors (`422`)
  - experiment entity persistence for configuration, status, and progress defaults
  - ownership-based list/detail visibility enforcement
  - status/search filtering for user experiment listing
- **Immutability Guarantee**
  - `parameter_overrides` persisted only on Experiment records
  - selected Blueprint records are read for validation/reference only and not mutated

### RFC-007 acceptance checks (implemented)

- valid experiment creation succeeds and links to owning user + selected blueprint
- invalid split totals and min val/test thresholds are rejected
- inaccessible blueprint selection is rejected
- experiment overrides do not mutate blueprint records
- experiment list/detail endpoints enforce ownership visibility
- wizard/detail frontend flows render and navigate with validation + submit behavior

## RFC-006 Market Data + Charting Highlights

Implemented BTCUSDT market-data and visualization features include:

- **Binance Connector (BTCUSDT 1m only)**
  - strict symbol/interval enforcement (`BTCUSDT`, `1m`)
  - start/end range validation
  - Binance-limit validation and paginated retrieval
  - retry handling for transient connector failures
- **Normalization + Local Cache Upsert**
  - kline row normalization into domain candle entities
  - upsert semantics keyed by candle timestamp
  - duplicate prevention with update-in-place behavior
  - inserted/updated summary reporting from refresh operations
- **Execution Integration**
  - `DefaultExperimentExecutor.load_data(...)` refreshes BTCUSDT cache first
  - experiment data loads from local `BTCUSDTKline` repository cache
  - refresh-failure fallback uses cache when sufficient candles exist
- **Charting Integration**
  - reusable `BTCUSDTPriceChart` component (TradingView Lightweight Charts)
  - integrated into Dashboard, Experiment Wizard, and Experiment Detail views
  - chart endpoint reads cache-backed candle data
  - stable loading/empty/error chart states

### RFC-006 acceptance checks (implemented)

- Binance response normalization is validated by tests
- only BTCUSDT 1m input is accepted by connector path
- repeated refresh/upsert does not duplicate timestamp rows
- experiment execution performs refresh-before-load ordering
- chart renders successful state with kline data
- chart renders empty/error states when applicable

## RFC-005 Blueprint Workflow Highlights

Implemented blueprint lifecycle/governance features include:

- **Blueprint Wizard**
  - multi-step authoring UI (`Basics`, `Reference Architecture`, `Indicators`, `Review`)
  - backend draft submission from wizard create action
  - client + server validation error display
- **Validation + Persistence**
  - required metadata and architecture/indicator validation via `BlueprintValidator`
  - valid blueprints persisted as owner-scoped `Draft`
- **Library + Detail + Favorites**
  - owned and favorited blueprint listing paths
  - detail view with metadata, architecture, indicators, approval state, version, and lineage
  - favorite/unfavorite behavior for accessible blueprints
- **Versioning Integrity**
  - in-place edits only for never-submitted drafts
  - immutable versioned-copy behavior for previously reviewed/submitted artifacts
- **Approval + Moderation**
  - request approval transition to `Pending`
  - staff moderation transitions: `Approved`, `Rejected`, `Disapproved`
  - dedicated moderation route: `/blueprints/moderation`
- **Experiment Integration**
  - approved blueprints exposed through experiment blueprint options endpoint

### Blueprint acceptance checks (implemented)

- valid blueprint creation succeeds
- invalid blueprint payload is rejected with surfaced validation errors
- favorite/unfavorite persistence works
- submitted/reviewed blueprint edits create versioned drafts
- moderation transitions are role-gated and stateful
- approved blueprint options are available to experiment wizard selection flow

## RFC-004 Frontend Delivery Highlights

Implemented frontend boundary-layer features include:

- Shared app shell and navigation:
  - `AppShell`, `TopBar`, `SidebarNav`, `Breadcrumbs`, `PageShell`, `PageHeader`
  - role-aware top-level navigation visibility using `lib/routes/nav.ts`
- Shared base/wizard view structure:
  - `BaseView` with loading/error/default content behavior
  - `WizardView` reusable step layout with summary/footer slots
- Reusable shadcn/ui-aligned form/table/status/state components:
  - form rows + validation text + select/number/date inputs
  - data table helper components and empty rows
  - loading/empty/error state blocks
  - status badges + role/status wrappers
  - confirmation dialog card
- Prototype-aligned landing/placeholder views:
  - dashboard cards + quick actions
  - experiments/blueprints/models/public hub/documentation
  - admin users/system/moderation/jobs placeholders

### Prototype parity acceptance checks (frontend)

The frontend test suite verifies:

- major routes render expected view boundaries
- navigation labels/targets and role visibility behavior
- protected route guard behavior (`RequireAuth`, `RequireRole`)
- base loading/error/empty rendering states
- status badge label/variant mapping
- wizard/dialog rendering behavior
- responsive structural smoke assertions (desktop/tablet class structure)

## Repository Structure

- `frontend/` — Next.js 15 + Tailwind + shadcn-style app-router frontend
- `backend/` — Flask backend with layered architecture skeleton
- `archive/` — FYP1/FYP2 report drafts and design references

## Architecture Layers (Backend)

- **Boundary**: frontend views/pages/components
- **Control**: backend controllers and services
- **Entity**: domain models and value objects
- **Persistence/Infra**: repositories + infrastructure adapters (prepared, mostly placeholders)

Design goal: feature modules should not import concrete infrastructure directly.

## Prerequisites

- Node.js `20` (see `frontend/.nvmrc`)
- Python `3.11` target (see `backend/.python-version`)

## Quick Start

### 1) Install dependencies (one-time setup)

```bash
cd backend
python -m venv .venv
.venv/bin/pip install -r requirements-dev.txt

cd frontend
npm install
```

### 2) Redis (required for job queue)

Experiment submission enqueues background jobs via Redis/RQ. Redis must be running before startup.

```bash
# Linux (systemd)
sudo systemctl enable --now redis
sudo systemctl status redis --no-pager

# Alternative foreground run (dev)
redis-server --port 6379
```

Default queue connection is:

```env
REDIS_URL=redis://localhost:6379/0
QUEUE_NAME=experiments
```

If Redis is unavailable, experiment create will return `503 QUEUE_UNAVAILABLE`.

### 3) Start all services with one command

Use the automated startup script to launch backend + worker + frontend together.

```bash
./scripts/start_app.sh
```

What this script does:

- starts backend (`http://localhost:5000`)
- starts background worker (experiment queue processing)
- starts frontend (`http://localhost:3000`)
- traps `Ctrl-C` and stops all started services safely before exit

Required environment before running script:

```bash
export DATABASE_URL=postgresql+psycopg://bee_user:bee_password@localhost:5432/bee
# optional overrides
# export REDIS_URL=redis://localhost:6379/0
# export QUEUE_NAME=experiments
```

### 3.1) Run backend + frontend tests with one command

Use the unified test runner script from the repository root:

```bash
./scripts/test_all.sh
```

What this script does:

- runs backend tests first (`pytest -q`, preferring `backend/.venv/bin/pytest` when available)
- runs frontend tests second (`npm test -- --runInBand`)
- exits immediately on first failure

CI status:

- GitHub Actions runs the same backend and frontend test flow on `push` to `main` and on every pull request via `.github/workflows/test.yml`.

### 4) Market Data Seed + Refresh (BTCUSDT 1m)


To ensure charts and experiment data reads have cached candles:

1. **Full backfill/seed (run before first backend start/demo/deployment)**

```bash
cd backend
. .venv/bin/activate
PYTHONPATH=$(pwd) python -m app.scripts.ingest_btcusdt_klines --from 2017-08-17T00:00:00Z --to now
# with progress logs every 10 seconds
PYTHONPATH=$(pwd) python -m app.scripts.ingest_btcusdt_klines --from 2017-08-17T00:00:00Z --to now --progress-seconds 10
# resume from latest cached candle (skip already ingested range)
PYTHONPATH=$(pwd) python -m app.scripts.ingest_btcusdt_klines --from 2017-08-17T00:00:00Z --to now --resume-from-cache --progress-seconds 10
# reconcile gaps: fill missing head, internal holes, and tail while skipping already-covered candles
PYTHONPATH=$(pwd) python -m app.scripts.ingest_btcusdt_klines --from 2017-08-17T00:00:00Z --to now --reconcile-cache --progress-seconds 10
```

2. **Incremental refresh (run after startup, before experiment execution, or on admin request)**

```bash
cd backend
. .venv/bin/activate
PYTHONPATH=$(pwd) python -m app.scripts.refresh_btcusdt_klines --lookback-hours 24
# or explicit range
PYTHONPATH=$(pwd) python -m app.scripts.refresh_btcusdt_klines --start 2026-01-01T00:00:00Z --end 2026-01-02T00:00:00Z
```

3. **Database cleanup (preserve users + BTCUSDT klines only)**

```bash
cd backend
. .venv/bin/activate
PYTHONPATH=$(pwd) python -m app.scripts.cleanup_database
```

Cleanup behavior:

- Deletes all rows from ERD-mapped tables except `User` and `BTCUSDTKline`.
- Useful for resetting experiment/blueprint/model/job-related data while keeping accounts and market cache.

Expected behavior:

- Full ingest prints aggregated `fetched/inserted/updated` summary across chunk windows.
- Incremental refresh prints per-range `fetched/inserted/updated` summary.
- Dashboard/Experiment chart endpoints continue to read from local `BTCUSDTKline` cache only.

Troubleshooting ingest/refresh failures:

- If you see `Failed to fetch BTCUSDT 1m candles: ...`, the failure happened before DB upsert (connector/network/Binance path).
- Quick connectivity check:

```bash
curl -I https://api.binance.com/api/v3/time
```

- For long backfills on unstable networks, you can continue past failed windows:

```bash
PYTHONPATH=$(pwd) python -m app.scripts.ingest_btcusdt_klines --from 2017-08-17T00:00:00Z --to now --continue-on-error --max-failures 5
```

- `Ctrl+C` during ingest is handled gracefully: partial progress is printed and the process exits with code `130`.

## Environment Configuration

Copy and adjust variables from `.env.example` as needed.

### Database (PostgreSQL Required)

The backend now requires a PostgreSQL `DATABASE_URL` at runtime. SQLite fallback is intentionally removed to keep development/runtime behavior aligned with deployment.

Recommended URL format:

```env
DATABASE_URL=postgresql+psycopg://bee_user:bee_password@localhost:5432/bee
```

If `DATABASE_URL` is missing or not PostgreSQL-based, backend startup fails fast with a clear configuration error.

Important variables:

- `FLASK_ENV`
- `SECRET_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `BINANCE_BASE_URL`
- `SESSION_TIMEOUT_MINUTES`
- `SESSION_BACKEND` (`memory` for current temporary mode)
- `NEXT_PUBLIC_API_BASE_URL`
- `BACKEND_API_ORIGIN`
- `CORS_ALLOW_ORIGINS` (CSV list, defaults include localhost:3000/127.0.0.1:3000)

### Temporary Session Deployment Guidance (before Redis)

Current RFC-003 sessions are server-managed with in-memory storage. In multi-process runtimes (e.g., Gunicorn/uWSGI), memory is isolated per worker.

Temporary mitigations:

- Configure **sticky sessions / session affinity** at your load balancer or reverse proxy so a client is routed to the same worker.
- For development or low-traffic deployments, run a single Gunicorn worker:

```bash
gunicorn --workers 1 wsgi:app
```

Important:

- Gunicorn does **not** provide sticky sessions by itself.
- Sticky/single-worker are temporary workarounds only.
- Target architecture should move to a centralized session store (Redis).

Frontend health API calls are proxied through Next.js rewrite:

- frontend route: `/api/backend/*`
- proxy target: `${BACKEND_API_ORIGIN}/api/*`

Browser runtime API base behavior defaults to same-origin proxy path (`/api/backend`) unless explicitly overridden with a relative path, which avoids common local CORS failures.

## Health Check

- Backend JSON health endpoint: `GET /api/health`
- Frontend-proxied health endpoint: `GET /api/backend/health`

Expected health payload shape:

```json
{
  "ok": true,
  "service": "Bitcoin Experimental Engine",
  "version": "0.7.0",
  "environment": "development",
  "status": "healthy"
}
```

## Versioning & Dependencies

- App version: root `VERSION`
- Changelog: `CHANGELOG.md`
- Frontend lock: `frontend/package-lock.json`
- Backend dependency specs:
  - `backend/requirements.txt`
  - `backend/requirements-dev.txt`
  - `backend/pyproject.toml`

## Verification Commands

PostgreSQL migration check:

```bash
cd backend
export DATABASE_URL=postgresql+psycopg://bee_user:bee_password@localhost:5432/bee
.venv/bin/alembic upgrade head
```

### Alembic Migration Workflow (Single Baseline Revision)

BEE currently uses a **single canonical Alembic revision**:

- `20260503_0001` (`backend/alembic/versions/20260503_0001_rfc002_strict_erd.py`)

This baseline already includes:

- `User.PasswordHash` length `255`
- `User.Role` values: `User`, `Moderator`, `Admin`
- `User.Status` values: `Enabled`, `Disabled`, `Pending`

Important behavior:

- Alembic will use `DATABASE_URL` (if set) via `backend/alembic/env.py`.
- If `DATABASE_URL` is not set, Alembic falls back to `backend/alembic.ini` (SQLite URL), which may target the wrong DB for backend runtime.

#### Fresh database

```bash
cd backend
export DATABASE_URL=postgresql+psycopg://bee_user:bee_password@localhost:5432/bee
.venv/bin/alembic upgrade head
```

#### Existing database with pre-created tables

If tables already exist but Alembic history is not stamped:

```bash
cd backend
export DATABASE_URL=postgresql+psycopg://bee_user:bee_password@localhost:5432/bee
.venv/bin/alembic stamp 20260503_0001
.venv/bin/alembic current
```

Use this to align Alembic history without replaying table creation.

Backend compile + health contract check:

```bash
cd backend
.venv/bin/python -m compileall app
PYTHONPATH=$(pwd) .venv/bin/python -c "from app import create_app; c=create_app('testing').test_client(); r=c.get('/api/health'); print(r.status_code, r.get_json())"
```

Frontend type check:

```bash
cd frontend
npm run typecheck
```

Repository tests requiring DB session setup:

```bash
cd backend
export DATABASE_URL=postgresql+psycopg://bee_user:bee_password@localhost:5432/bee
pytest tests/repositories -q
```

Auth + RBAC verification:

```bash
cd backend
pytest -q tests/test_authentication_controller.py tests/test_access_control_service.py tests/test_user_controller.py

cd ../frontend
npm test -- --runInBand
```

RFC-006 focused verification:

```bash
# backend
cd backend
pytest tests -q

# frontend chart/view suites
cd ../frontend
npm test -- --runInBand btcusdt-price-chart.test.tsx dashboard-view.test.tsx experiment-wizard-view.test.tsx experiment-detail-view.test.tsx
```

## PostgreSQL Troubleshooting

- **`DATABASE_URL is required`**: ensure `DATABASE_URL` is set in your environment or `.env` loader path.
- **Invalid DB scheme**: ensure URL begins with `postgresql://` or `postgresql+<driver>://`.
- **Connection/auth failures**: verify host, port, username, password, and database name.
- **Driver missing**: install PostgreSQL driver dependencies used by your selected SQLAlchemy URL (e.g., `psycopg`).

## Local Production Startup

Use the root `.env.example` as the baseline for local production-style runs.

Default ports:

- Frontend: `3000`
- Backend: `5000`
- PostgreSQL: `5432`
- Redis: `6379`

Typical startup flow:

```bash
cd backend
export DATABASE_URL=postgresql+psycopg://bee_user:bee_password@localhost:5432/bee
export REDIS_URL=redis://localhost:6379/0
PYTHONPATH=$(pwd) .venv/bin/python wsgi.py
```

```bash
cd backend
PYTHONPATH=$(pwd) .venv/bin/python -m app.scripts.run_worker
```

```bash
cd frontend
npm run build
npm run start
```
