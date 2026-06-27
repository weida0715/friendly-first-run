# 6.6 APIs and Integration

## 6.6.1 Description of Internal APIs or Third-Party APIs Used

BEE integrates internal REST-style JSON APIs, a third-party Binance market data API connector, PostgreSQL persistence, Redis/RQ queue infrastructure, and frontend API wrappers. The internal APIs are registered through `backend/app/routes.py` and implemented in controller files under `backend/app/controllers/`. The frontend does not call controllers directly; it uses typed wrapper functions in `frontend/lib/api/client.ts`.

| API / integration | Description | Relative paths |
|---|---|---|
| Authentication API | Register, login, logout, CSRF, and current-user lookup | `backend/app/controllers/authentication_controller.py`, `frontend/lib/api/client.ts` |
| User API | Admin/staff user listing, creation, status, password, role, username update, audit, and delete | `backend/app/controllers/user_controller.py` |
| Blueprint API | Create, update, list, detail, metadata, favourite/unfavourite, request approval, moderation queue, approve/reject/disapprove | `backend/app/controllers/blueprint_controller.py`, `backend/app/controllers/blueprint_approval_controller.py`, `backend/app/controllers/blueprints_library_controller.py` |
| Experiment API | Create, list, detail, blueprint options, cancel, retry, delete | `backend/app/controllers/experiment_controller.py` |
| Job API | List jobs, job detail, cancel job | `backend/app/controllers/job_controller.py` |
| Model API | Highlights, rankings, owned/favourited library, detail, favourite/unfavourite | `backend/app/controllers/model_controller.py` |
| Logs API | Experiment/model log download and round artefact download | `backend/app/controllers/logs_download_controller.py` |
| Market data API | BTCUSDT klines, target preview, metadata, admin catch-up/status/stop/clear | `backend/app/controllers/market_data_controller.py` |
| Public hub API | Public artefact discovery and public user profile | `backend/app/controllers/public_hub_controller.py` |
| Documentation API | Documentation list and documentation detail | `backend/app/controllers/documentation_controller.py` |
| System API | Health, active queue snapshot, settings, events, event download | `backend/app/controllers/system_controller.py` |
| Binance API connector | External BTCUSDT 1m kline retrieval | `backend/app/infrastructure/binance/kline_client.py` |

## 6.6.2 API Endpoints Implemented

The route registry mounts all backend routes under the configured API prefix, normally `/api`. The following table summarizes key implemented endpoint groups.

| Endpoint group | Example endpoint | HTTP method | Purpose |
|---|---|---|---|
| Health | `/api/health` | GET | Confirms backend service health. |
| Authentication | `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout` | POST/GET | Account creation, session creation, current user lookup, logout. |
| Users | `/api/users`, `/api/users/{id}`, `/api/users/{id}/role`, `/api/users/{id}/status` | GET/POST/PATCH/DELETE | Admin/staff user management. |
| Blueprints | `/api/blueprints`, `/api/blueprints/{id}`, `/api/blueprints/metadata` | GET/POST/PATCH | Blueprint creation, update, metadata, list, and detail. |
| Blueprint favourites | `/api/blueprints/{id}/favorite` | POST/DELETE | Favourite or unfavourite a blueprint. |
| Blueprint moderation | `/api/blueprints/{id}/request-approval`, `/api/blueprints/moderation/queue`, `/api/blueprints/{id}/approve` | GET/POST | Approval request and moderator/admin decisions. |
| Blueprint library | `/api/blueprints/library/owned`, `/api/blueprints/library/favorited` | GET | Owned and favourited blueprint listing. |
| Experiments | `/api/experiments`, `/api/experiments/{id}`, `/api/experiments/blueprint-options` | GET/POST | Experiment creation, list, detail, and approved blueprint selection. |
| Experiment lifecycle | `/api/experiments/{id}/cancel`, `/api/experiments/{id}/retry` | POST | Cancel or retry experiments. |
| Jobs | `/api/jobs`, `/api/jobs/{job_id}`, `/api/jobs/{job_id}/cancel` | GET/POST | Queue/job listing, detail, and cancellation. |
| Models | `/api/models/rankings`, `/api/models/highlights`, `/api/models/{id}` | GET | Model ranking, summary, and detail. |
| Model favourites | `/api/models/{id}/favorite` | POST/DELETE | Favourite or unfavourite a model. |
| Logs | `/api/logs/experiments/{experiment_id}/{artifact}` | GET | Download experiment artefacts. |
| Market data | `/api/market-data/btcusdt/klines`, `/api/market-data/btcusdt/metadata` | GET | Cached BTCUSDT chart and metadata. |
| Market data admin | `/api/market-data/btcusdt/admin/catch-up`, `/api/market-data/btcusdt/admin/klines` | POST/DELETE | Admin market-data catch-up and cache clearing. |
| Public hub | `/api/hub`, `/api/hub/users/{user_id}` | GET | Public discovery and public user profile. |
| Documentation | `/api/docs`, `/api/docs/{slug}` | GET | Documentation list and detail. |
| System | `/api/system/queue/active`, `/api/system/settings`, `/api/system/events` | GET/PATCH | Admin-only queue, settings, and event management. |

Suggested code snippet reference:

- Include the endpoint registration block from `backend/app/routes.py`.
- Include exported frontend API functions from `frontend/lib/api/client.ts` to show the integration boundary from UI to backend.

## 6.6.3 JSON / XML Payload Structure

The application uses JSON payloads for request and response bodies. XML is not used. The common backend response pattern contains an `ok` flag and a `data` or error payload. The frontend API client expects structured responses and maps error responses into user-facing error states.

Example login request payload:

```json
{
  "identifier": "user@bee.local",
  "password": "********"
}
```

Example current-user response payload:

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": 1,
      "username": "user",
      "email": "user@bee.local",
      "role": "User",
      "status": "Active"
    }
  }
}
```

Example blueprint creation payload:

```json
{
  "name": "RSI Momentum Blueprint",
  "description": "Reusable BTCUSDT experiment blueprint using RSI and trend features.",
  "architecture": {
    "type": "logistic_regressor",
    "parameters": {
      "C": 1.0
    }
  },
  "indicators": [
    {
      "name": "wilder_rsi",
      "parameters": {
        "period": 14
      }
    }
  ],
  "features": {
    "selected": ["close", "volume", "rsi_14"]
  }
}
```

Example experiment creation payload:

```json
{
  "name": "BTCUSDT RSI Experiment",
  "description": "Test RSI-based blueprint over a fixed BTCUSDT range.",
  "symbol": "BTCUSDT",
  "interval": "1m",
  "startDate": "2025-01-01",
  "endDate": "2025-03-31",
  "trainSplit": 0.7,
  "valSplit": 0.15,
  "testSplit": 0.15,
  "blueprintId": 10,
  "parameterOverrides": {
    "architecture": {
      "C": 0.5
    }
  }
}
```

Example market-data kline response item:

```json
{
  "time": "2025-01-01T00:00:00Z",
  "open": 93500.25,
  "high": 93610.00,
  "low": 93420.50,
  "close": 93575.10,
  "volume": 12.345678
}
```

The actual shape of individual payloads should be verified against the controller and frontend API type definitions before final submission. The relevant files are `backend/app/controllers/` for backend payload construction and `frontend/lib/api/client.ts` for frontend request/response types.

## 6.6.4 Authentication Mechanisms

BEE uses server-managed sessions and password hashing rather than stateless JWT authentication. Login creates a server-side session, and subsequent frontend calls use the session cookie to identify the user. CSRF hardening is also included for browser-based requests. Role-based access control is enforced using user roles stored in the `User` table and checked by backend access-control logic and frontend route guards.

| Security/auth component | Implementation | Relative paths |
|---|---|---|
| Password hashing | Verifies submitted password against stored hash | `backend/app/services/password_service.py` |
| Session creation and lookup | Maintains server-managed login state | `backend/app/services/session_service.py`, `backend/app/controllers/authentication_controller.py` |
| Current user API | Confirms active authenticated user for frontend | `backend/app/controllers/authentication_controller.py` |
| CSRF hardening | Protects unsafe browser requests | `backend/app/infrastructure/csrf/`, `backend/tests/test_csrf_hardening.py`, `frontend/tests/api-client-csrf.test.ts` |
| Backend RBAC | Enforces role and ownership checks at API boundary | `backend/app/services/access_control_service.py`, `backend/app/controllers/_access.py` |
| Frontend route guards | Prevents inaccessible pages from rendering | `frontend/lib/auth/`, `frontend/lib/routes/nav.ts`, `frontend/tests/auth-guards.test.tsx` |

Required screenshots:

1. Network tab or API client screenshot showing JSON login/current-user response.
2. Screenshot of admin-only route blocked for normal user.
3. Screenshot of moderator/admin accessing a role-gated page.
