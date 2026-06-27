# 6.3 System Configuration and Setup

System setup is divided into backend setup, frontend setup, and build/package setup. The implementation assumes the evaluator runs the project from the repository root, configures environment variables using `.env.example` as the `.env` baseline, starts PostgreSQL and Redis, installs backend and frontend dependencies, and launches backend, worker, and frontend processes.

## 6.3.1 Backend setup

The backend setup consists of a Flask API service, PostgreSQL database connection, Redis queue connection, CSRF/CORS handling, route registration, and a worker entry point.

| Setup item | Configuration or command | Source-code evidence |
|---|---|---|
| Python version | Python 3.11 target | `backend/.python-version` |
| Backend dependencies | Install from `backend/requirements.txt` and `backend/requirements-dev.txt` | `backend/requirements.txt`, `backend/requirements-dev.txt` |
| Flask application factory | `create_app()` constructs runtime Flask app | `backend/app/__init__.py` |
| WSGI app | `application = create_app()` | `backend/wsgi.py` |
| Route registration | Feature controllers registered under `/api` | `backend/app/routes.py`, lines 68-91 |
| Database URL | PostgreSQL required through `DATABASE_URL` | `backend/app/config.py`, `backend/app/infrastructure/database/session.py` |
| Queue URL | Redis required through `REDIS_URL` and `QUEUE_NAME` | `backend/app/config.py`, `backend/app/infrastructure/redis/job_queue.py` |
| Worker process | Worker consumes experiment execution jobs | `backend/app/scripts/run_worker.py`, `backend/app/workers/experiment_worker.py` |

### Backend setup procedure

```text
Create Python virtual environment
  -> install backend runtime and development requirements
  -> copy .env.example values into .env-style environment
  -> set DATABASE_URL to PostgreSQL connection string
  -> set REDIS_URL and QUEUE_NAME for experiment queue
  -> run Alembic migration or ensure baseline schema exists
  -> start Flask backend through backend/wsgi.py or startup script
  -> start experiment worker through backend/app/scripts/run_worker.py
```

### Backend middleware and request handling

The backend application factory in `backend/app/__init__.py` configures request-level infrastructure before registering routes. The report should explain that the backend does not directly expose database tables. Instead, requests pass through controllers, access-control checks, services, repositories, and domain models. The factory also applies CSRF behavior and CORS headers so browser requests from the frontend can safely call backend endpoints.

### Backend code snippet to include

| Snippet | File and lines | What it demonstrates |
|---|---|---|
| Flask factory setup | `backend/app/__init__.py`, around the `create_app()` function | Centralized backend initialization |
| Route registration | `backend/app/routes.py`, lines 68-91 | All feature modules mounted under `/api` |
| Queue construction | `backend/app/controllers/_services.py` | Controllers obtain queue services from configured Redis adapter |
| Worker entry | `backend/app/scripts/run_worker.py` | Background execution process |

## 6.3.2 Frontend setup

The frontend setup uses Next.js App Router pages. Route files in `frontend/app/` are mostly thin wrappers around feature views in `frontend/views/`. Shared layout, navigation, authentication, forms, charts, state displays, and UI primitives are stored in `frontend/components/` and `frontend/lib/`.

| Setup item | Configuration or command | Source-code evidence |
|---|---|---|
| Node version | Node 20 target | `frontend/.nvmrc` |
| Package manager | npm install from lockfile | `frontend/package.json`, `frontend/package-lock.json` |
| App root | Next.js root layout and page | `frontend/app/layout.tsx`, `frontend/app/page.tsx` |
| Frontend routes | App Router route pages | `frontend/app/**/page.tsx` |
| View layer | Feature-specific view components | `frontend/views/*.tsx` |
| API client | Browser-to-backend request helpers | `frontend/lib/api/*` |
| Authentication context | Session state and route guards | `frontend/lib/auth/*`, `frontend/components/auth/*` |
| Charts | BTCUSDT chart component and hook | `frontend/components/charts/BTCUSDTPriceChart.tsx`, `frontend/components/charts/useBTCUSDTChartData.ts` |
| Styling | Tailwind and global CSS variables | `frontend/tailwind.config.ts`, `frontend/app/globals.css` |

### Frontend setup procedure

```text
Install Node.js target version
  -> run npm install in frontend/
  -> configure backend API origin through .env-derived variables
  -> start Next.js development or production server
  -> frontend renders routes under /dashboard, /experiments, /blueprints, /models, /hub, /docs, /admin/users, and /system
  -> frontend calls backend JSON endpoints through the API client
```

### Frontend route structure

| User-facing page | Route file | Main view component | Screenshot required |
|---|---|---|---|
| Landing / root | `frontend/app/page.tsx`, `frontend/app/landing/page.tsx` | `LandingPageView`, `DashboardView` | Guest landing and authenticated dashboard |
| Login | `frontend/app/(auth)/login/page.tsx` | `LoginView` | Login form, validation message, successful redirect |
| Registration | `frontend/app/(auth)/register/page.tsx` | `RegistrationView` | Registration form and validation state |
| Dashboard | `frontend/app/dashboard/page.tsx` | `DashboardView` | Summary cards, BTCUSDT chart, quick actions |
| Experiments list | `frontend/app/experiments/page.tsx` | `ExperimentListView` | Search/filter/status table |
| Experiment wizard | `frontend/app/experiments/new/page.tsx` | `ExperimentWizardView` | Multi-step wizard and review page |
| Experiment detail | `frontend/app/experiments/[id]/page.tsx` | `ExperimentDetailView` | Configuration, progress/status, model leaderboard, logs |
| Blueprints library | `frontend/app/blueprints/page.tsx` | `BlueprintsLibraryView` | Owned and favourited tabs |
| Blueprint wizard | `frontend/app/blueprints/new/page.tsx` | `BlueprintWizardView` | Basics, architecture, indicators, review |
| Blueprint detail | `frontend/app/blueprints/[id]/page.tsx` | `BlueprintDetailView` | Metadata, approval state, version/lineage, favourite button |
| Blueprint moderation | `frontend/app/blueprints/moderation/page.tsx` | `BlueprintModerationView` | Queue and approve/reject/disapprove actions |
| Models | `frontend/app/models/page.tsx`, `frontend/app/models/[id]/page.tsx` | `ModelsRankingsView`, `ModelDetailView` | Rankings table and detail popup/page |
| Favourites | `frontend/app/favorites/page.tsx` | `FavoritesLibraryView` | Favourited blueprints/models |
| Public hub | `frontend/app/hub/page.tsx` | `PublicHubView` | Public blueprints, models, users, experiments |
| Documentation | `frontend/app/docs/page.tsx` | `DocumentationView` | Documentation list and selected article |
| Jobs | `frontend/app/jobs/page.tsx`, `frontend/app/jobs/[id]/page.tsx` | `JobListView`, `JobDetailView` | Job list, job status, cancellation state |
| User management | `frontend/app/admin/users/page.tsx` | `UserManagementView` | User list, role/status actions, audit details |
| System management | `frontend/app/system/page.tsx` | `SystemManagementView` | Queue snapshot, system settings/events, market-data admin actions |
| Profile | `frontend/app/profile/page.tsx` | `UserProfileView` | Current user details |

## 6.3.3 Build tools and package managers

The backend and frontend use separate package managers and verification tools.

| Area | Tool | Typical command | Source-code evidence |
|---|---|---|---|
| Backend install | pip | `pip install -r requirements-dev.txt` | `backend/requirements-dev.txt` |
| Backend run | Python / WSGI | `PYTHONPATH=$(pwd) python wsgi.py` | `backend/wsgi.py` |
| Backend tests | pytest | `pytest -q` | `backend/tests/*.py` |
| Database migration | Alembic | `alembic upgrade head` | `backend/alembic/env.py`, `backend/alembic/versions/*.py` |
| Frontend install | npm | `npm install` | `frontend/package.json`, `frontend/package-lock.json` |
| Frontend dev/build | Next.js scripts | `npm run dev`, `npm run build`, `npm run start` | `frontend/package.json` |
| Frontend tests | Jest | `npm test -- --runInBand` | `frontend/jest.config.cjs`, `frontend/tests/*.tsx` |
| Frontend type check | TypeScript | `npm run typecheck` | `frontend/tsconfig.json` |
| Full local startup | shell script | `./scripts/start_app.sh` | `scripts/start_app.sh` |
| Full test pass | shell script | `./scripts/test_all.sh` | `scripts/test_all.sh` |

## Summary

System setup reflects the implementation architecture: the backend and worker are Python services, the frontend is a TypeScript/Next.js application, and PostgreSQL plus Redis support persistence and asynchronous execution. The route and service structure makes each major product function independently testable while still allowing the evaluator to run the whole platform through the root startup script.
