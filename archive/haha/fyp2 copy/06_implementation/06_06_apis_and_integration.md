# 6.6 APIs and Integration

The BEE backend exposes JSON APIs under the `/api` prefix. Frontend pages call these APIs through the frontend API client and render the responses through React views. Integration also occurs between backend services and infrastructure components such as PostgreSQL, Redis, and Binance market-data endpoints.

## 6.6.1 Description of internal APIs and third-party APIs used

| Integration | Type | Source-code evidence | Purpose |
|---|---|---|---|
| Frontend to backend | Internal HTTP JSON API | `frontend/lib/api/*`, `backend/app/routes.py`, `backend/app/controllers/*.py` | Allows pages and views to authenticate users, manage experiments, blueprints, models, jobs, hub data, docs, users, and system settings |
| Backend to PostgreSQL | Internal persistence integration | `backend/app/infrastructure/database/session.py`, `backend/app/repositories/*.py`, `backend/app/infrastructure/database/orm/*.py` | Stores all domain data and execution results |
| Backend to Redis/RQ | Internal queue integration | `backend/app/infrastructure/redis/job_queue.py`, `backend/app/services/queue_service.py` | Enqueues and manages asynchronous experiment jobs |
| Worker to backend domain services | Internal service integration | `backend/app/workers/experiment_worker.py`, `backend/app/executors/default_experiment_executor.py` | Executes queued experiments and persists results |
| Backend to Binance | Third-party data integration | `backend/app/infrastructure/binance/kline_client.py`, `backend/app/services/market_data_service.py` | Retrieves BTCUSDT kline data for local cache refresh |
| Frontend chart to backend market data | Internal chart data integration | `frontend/components/charts/useBTCUSDTChartData.ts`, `backend/app/controllers/market_data_controller.py` | Loads chart-ready candle data |

## 6.6.2 API endpoints implemented

The route registry in `backend/app/routes.py`, lines 68-91, shows the top-level API grouping. The following table summarizes the implemented endpoints that should be documented in the final report.

| Module | Endpoint group | Important endpoints | Purpose |
|---|---|---|---|
| System | `/api` and `/api/system/*` | `GET /api/health`, `GET /api/system/queue/active`, `GET/PATCH /api/system/settings`, `GET /api/system/events`, `GET /api/system/events/download` | Health, queue visibility, settings, event logs |
| Authentication | `/api/auth/*` | `GET /api/auth/csrf`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` | CSRF token, registration, login, current user, logout |
| Users | `/api/users/*` | `GET /api/users`, `GET /api/users/me`, `GET /api/users/{id}`, `GET /api/users/{id}/audit`, `POST /api/users`, `PATCH /api/users/{id}/status`, `PATCH /api/users/{id}/password`, `PATCH /api/users/{id}/role`, `PATCH /api/users/{id}/username`, `DELETE /api/users/{id}` | Staff/admin user management and current-user profile |
| Blueprints | `/api/blueprints/*` | `GET /api/blueprints`, `GET /api/blueprints/{id}`, `POST /api/blueprints`, `PATCH /api/blueprints/{id}`, `GET /api/blueprints/metadata`, favourite/unfavourite endpoints | Blueprint library, detail, metadata, create/update, favourites |
| Blueprint library | `/api/blueprints/library/*` | `GET /api/blueprints/library/owned`, `GET /api/blueprints/library/favorited` | Owned and favourited blueprint tabs |
| Blueprint approval | `/api/blueprints/*` | `POST /api/blueprints/{id}/request-approval`, `GET /api/blueprints/moderation/queue`, `POST /api/blueprints/{id}/approve`, `POST /api/blueprints/{id}/reject`, `POST /api/blueprints/{id}/disapprove` | Review and moderation workflow |
| Experiments | `/api/experiments/*` | `POST /api/experiments`, `GET /api/experiments`, `GET /api/experiments/{id}`, `GET /api/experiments/blueprint-options`, `POST /api/experiments/{id}/cancel`, `POST /api/experiments/{id}/retry`, `DELETE /api/experiments/{id}` | Experiment creation, listing, detail, blueprint choices, lifecycle controls |
| Market data | `/api/market-data/*` | `GET /api/market-data/btcusdt/klines`, `POST /api/market-data/btcusdt/target-preview`, `GET /api/market-data/btcusdt/metadata`, admin catch-up/status/stop/delete endpoints | Charts, target preview, cached bounds, admin market data controls |
| Models | `/api/models/*` | `GET /api/models/highlights`, `GET /api/models/rankings`, `GET /api/models/library/owned`, `GET /api/models/library/favorited`, `GET /api/models/{id}`, favourite/unfavourite endpoints | Model ranking, detail, libraries, favourites |
| Jobs | `/api/jobs/*` | `GET /api/jobs`, `GET /api/jobs/{job_id}`, `POST /api/jobs/{job_id}/cancel` | Job list/detail/cancellation |
| Logs | `/api/logs/*` | `GET /api/logs`, experiment artifact and round CSV endpoints | Result artifact download and round-log export |
| Public hub | `/api/hub/*` | `GET /api/hub`, `GET /api/hub/users/{id}` | Public discovery page and public user profile |
| Documentation | `/api/docs/*` | `GET /api/docs`, `GET /api/docs/{slug}` | In-app documentation listing and detail |

## 6.6.3 JSON payload structure

The backend uses normalized JSON response helpers in `backend/app/responses.py`. The final report should explain that success responses, error responses, and validation responses follow consistent shapes.

Success response pattern:

```json
{
  "ok": true,
  "data": {
    "...": "payload fields"
  }
}
```

Single-error response pattern:

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

Validation-error response pattern:

```json
{
  "ok": false,
  "errors": {
    "fieldName": ["Validation message"]
  }
}
```

Important payload examples to include in the final report:

| Payload | Source-code path | Fields to describe |
|---|---|---|
| Login request | `backend/app/controllers/authentication_controller.py` | Email and password |
| Experiment creation request | `backend/app/controllers/experiment_controller.py`, `backend/app/validators/experiment_validator.py` | Name, description, interval, date range, blueprint id, split percentages, target strategy, deterministic seed, parameter overrides |
| Compiled experiment snapshot | `backend/app/execution/experiment_compiler.py` | Symbol, interval, target, deterministic settings, effective parameters, selected parameter hashes |
| Blueprint creation request | `backend/app/controllers/blueprint_controller.py`, `backend/app/validators/blueprint_validator.py` | Name, description, architecture, indicators, features, constraints |
| Market kline response | `backend/app/controllers/market_data_controller.py` | Timestamp, open, high, low, close, volume |
| Model detail response | `backend/app/controllers/model_controller.py` | Metrics, architecture, parameter hash, experiment metadata, favourite state |

## 6.6.4 Authentication mechanisms

The implementation uses server-managed sessions and CSRF protection for browser requests. The frontend requests a CSRF token for unsafe operations, sends session cookies with API calls, and backend controllers load the user context through access-control/session services.

Pseudocode:

```text
Unsafe API request from frontend
  -> frontend API client obtains CSRF token when needed
  -> request includes credentials and CSRF header
  -> backend validates session cookie and CSRF token
  -> access-control service loads current user
  -> controller enforces ownership or role permission
  -> controller returns success, error, or validation response
```

| Security/API mechanism | Evidence path | Explanation |
|---|---|---|
| CSRF endpoint | `backend/app/controllers/authentication_controller.py` | Provides CSRF token for unsafe browser requests |
| CSRF handling | `backend/app/__init__.py`, `frontend/tests/api-client-csrf.test.ts` | Backend validates unsafe requests; frontend attaches token |
| Session cookie | `backend/app/services/session_service.py` | Stores server-side session identity |
| Current user endpoint | `backend/app/controllers/authentication_controller.py` | `/api/auth/me` restores frontend auth state |
| Role checks | `backend/app/services/access_control_service.py`, `backend/app/controllers/_access.py` | Enforces User/Moderator/Admin access |
| Ownership checks | Experiment, blueprint, model, job controllers | Prevents unauthorized resource access |

## Required screenshots and code snippets

| Evidence | File/page | What to show |
|---|---|---|
| API route registry | `backend/app/routes.py`, lines 68-91 | Top-level API integration map |
| Normalized responses | `backend/app/responses.py` | `ok_response`, `error_response`, and validation helper |
| CSRF frontend test | `frontend/tests/api-client-csrf.test.ts` | Evidence that unsafe API calls include CSRF token |
| Experiment create payload UI | `/experiments/new` review step | Final payload summary before submit |
| API client | `frontend/lib/api/*` | How frontend calls backend with credentials |

## Summary

The API layer integrates all major parts of the system. Frontend views call backend controllers, controllers validate requests and enforce access rules, repositories persist data, Redis coordinates background jobs, Binance supplies market candles, and the worker stores results back into PostgreSQL. This integration design makes the system modular while preserving a single coherent workflow for users.
