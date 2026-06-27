# 6.6 APIs and Integration

## Section Purpose

This section explains how the frontend, backend, database, queue, worker, and third-party market-data provider are integrated. It should focus on implemented APIs, payload structure, authentication behavior, and how modules communicate through defined boundaries.

## 6.6.1 Description of Internal APIs or Third-Party APIs Used

### Recommended Structure

Use two paragraphs and one integration table.

Paragraph 1 should explain that the system exposes internal REST-style JSON APIs through the Flask backend under `/api`. The Next.js frontend communicates with these endpoints through the frontend rewrite path `/api/backend`.

Paragraph 2 should explain the third-party market-data integration. The backend retrieves BTCUSDT kline data from the configured Binance-compatible base URL, normalizes the response, and stores candles locally before charts or experiments use the data.

| Integration | Direction | Purpose |
| --- | --- | --- |
| Frontend to Backend API | Browser -> Next.js rewrite -> Flask `/api` | Authentication, users, blueprints, experiments, jobs, models, logs, docs, hub, market data, system management |
| Backend to PostgreSQL | Flask services/repositories -> database | Persistent storage of users, experiments, blueprints, models, logs, candles, settings |
| Backend to Redis/RQ | Queue service -> Redis | Queue experiment execution jobs and resolve queue metadata |
| Worker to Backend persistence | Worker -> repositories | Update experiment progress, status, models, and logs |
| Backend to market-data provider | Market data service -> Binance-compatible API | Retrieve BTCUSDT candles for cache refresh and charts |

> Note: Add one integration diagram showing the browser, frontend rewrite, backend API, database, Redis queue, worker, and market-data provider.

## 6.6.2 API Endpoints Implemented

### Recommended Structure

Use one paragraph and a grouped endpoint table. Do not list every minor variation unless space permits. Focus on endpoint groups that represent implemented modules.

| API Group | Example Endpoints | Purpose |
| --- | --- | --- |
| Health | `GET /api/health` | Backend health and version/status check |
| Auth | `/api/auth/csrf`, `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` | CSRF token, registration, login, logout, current-user session check |
| Users | `/api/users`, `/api/users/me`, `/api/users/{id}` | Profile and staff user-management operations |
| Blueprints | `/api/blueprints`, `/api/blueprints/{id}`, `/api/blueprints/library/owned`, `/api/blueprints/library/favorited` | Blueprint creation, detail, owned list, favorites, metadata |
| Blueprint approval | `/api/blueprints/{id}/approval`, moderation endpoints | Approval request and staff moderation |
| Experiments | `/api/experiments`, `/api/experiments/{id}`, `/api/experiments/blueprint-options` | Experiment creation, list, detail, selectable blueprint options |
| Jobs | `/api/jobs`, `/api/jobs/{id}`, `/api/jobs/{id}/cancel` | Queue job listing, detail, and cancellation |
| Market Data | `/api/market-data/btcusdt/klines`, metadata, target preview, admin catch-up paths | Candle data, chart data, refresh/catch-up administration |
| Models | `/api/models/rankings`, `/api/models/highlights`, `/api/models/{id}` | Model rankings, highlights, detail, favorites |
| Logs | `/api/logs/experiments/{id}/{artifact}` | Downloadable experiment artifacts |
| Public Hub | `/api/hub`, `/api/hub/users/{id}` | Public discovery of enabled users and approved/completed artifacts |
| Documentation | `/api/docs`, `/api/docs/{slug}` | Markdown documentation listing and rendering |
| System | `/api/system/queue/active`, settings, events | Admin queue, settings, and event visibility |

### What to Show

Include a table and one sample request/response. Do not paste all endpoints in prose; grouped tables are clearer.

## 6.6.3 JSON Payload Structure

### Recommended Structure

Use three short examples: login, experiment creation, and standard response shape.

### Standard Success Response

```json
{
  "ok": true,
  "data": {
    "id": 1,
    "status": "example"
  }
}
```

### Standard Error Response

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted request is invalid."
  }
}
```

### Experiment Creation Payload Example

```json
{
  "name": "BTCUSDT Direction Experiment",
  "symbol": "BTCUSDT",
  "interval": "1m",
  "start_date": "2026-01-01",
  "end_date": "2026-01-31",
  "split": {
    "train": 70,
    "validation": 15,
    "test": 15
  },
  "blueprint_id": 1,
  "target_strategy": "candle_direction",
  "deterministic": true,
  "seed": 42,
  "parameter_overrides": {}
}
```

> Note: Adjust the example payload to match the final form fields used in your demonstration. Keep examples non-sensitive.

## 6.6.4 Authentication Mechanisms

### Recommended Structure

Use three paragraphs.

Paragraph 1 should explain server-managed session authentication. After login or registration, the backend creates a session associated with user identity and role.

Paragraph 2 should explain that frontend API requests include browser credentials and that `AuthProvider` uses the current-user endpoint to restore authentication state after page refresh.

Paragraph 3 should explain CSRF protection for state-changing requests. The frontend obtains a CSRF token and sends it with mutating requests, while the backend rejects invalid CSRF submissions.

### Pseudocode

```text
PROCEDURE Send Mutating API Request
  IF request method changes server state THEN
    OBTAIN CSRF token from backend
    ATTACH CSRF token to request header
  ENDIF
  ATTACH browser credentials
  SEND JSON request to backend API
  PARSE JSON response
  IF response is error THEN
    RAISE typed API error for frontend view
  ENDIF
  RETURN response data
ENDPROCEDURE
```

## Draft Content to Use in the Report

The system integrates its modules through internal JSON APIs exposed by the Flask backend. The backend registers feature controllers under the `/api` prefix, while the frontend uses a centralized API client and endpoint map to communicate with these APIs. In browser runtime, API calls are made through `/api/backend`, and the Next.js rewrite configuration forwards those requests to the backend API origin. This avoids hard-coding backend origins inside individual views and keeps frontend-backend communication consistent.

The backend also integrates with external and infrastructure services. PostgreSQL stores persistent system records, Redis supports queue and session-related infrastructure, and the worker process updates experiment state and result artifacts after consuming queued jobs. BTCUSDT market data is retrieved through a Binance-compatible kline endpoint, normalized by the backend, and stored locally before being used by charts or experiment execution.

Authentication is implemented using server-managed sessions rather than stateless frontend-only identity. After successful registration or login, the backend creates a session containing the user identity and role. The frontend includes credentials with API requests and uses the current-user endpoint to restore authentication state. State-changing requests are protected with CSRF tokens to reduce the risk of unauthorized cross-site form submission.
