# 6.6 APIs and Integration

This section explains how the frontend, backend, database, queue, worker, and market-data provider are integrated in the Bitcoin Experimental Engine. The implemented system uses JSON-based HTTP APIs as the main communication boundary between the Next.js frontend and Flask backend. The backend then integrates with PostgreSQL for persistence, Redis for queue-related runtime behavior, the worker process for asynchronous experiment execution, and a Binance-compatible market-data provider for BTCUSDT candle retrieval.

The API layer is important because it separates browser-facing user interaction from server-side business logic. Frontend views do not directly access the database, queue, worker, or market-data provider. Instead, the frontend calls backend API endpoints through a centralized API client. The backend receives the request, validates input, checks authentication and authorization, coordinates services, performs repository operations, and returns a structured response to the frontend.

## 6.6.1 API Architecture Overview

The backend exposes its feature endpoints under the `/api` route prefix. Route registration is centralized in `backend/app/routes.py`, where Flask blueprints are registered for authentication, users, experiments, blueprints, models, public hub, documentation, jobs, logs, market data, and system management. This keeps the API surface organized by module and allows each controller to focus on one feature area.

The frontend communicates with the backend using the same-origin browser path `/api/backend`. The endpoint map is defined in `frontend/lib/api/endpoints.ts`, while request functions are defined in `frontend/lib/api/client.ts`. During local development, `frontend/next.config.ts` rewrites `/api/backend/:path*` to the backend API route. As a result, browser code can call `/api/backend/auth/login`, and the request is forwarded to the backend route `/api/auth/login`.

This architecture gives the project a clear integration boundary. Frontend views only need to know the frontend API base path and endpoint map. The backend remains responsible for security, validation, persistence, queueing, and integration with supporting services.

**Table 6.38: API Architecture Components**

| Component | Source Area | Implementation Responsibility |
| --- | --- | --- |
| Backend route registry | `backend/app/routes.py` | Registers all backend API blueprints under the configured API prefix |
| Backend controllers | `backend/app/controllers/` | Expose module-specific HTTP endpoints and response payloads |
| Frontend endpoint map | `frontend/lib/api/endpoints.ts` | Centralizes browser-facing API paths used by frontend views |
| Frontend API client | `frontend/lib/api/client.ts` | Sends requests, includes credentials, obtains CSRF tokens, parses JSON, and raises typed errors |
| Frontend rewrite configuration | `frontend/next.config.ts` | Forwards `/api/backend/*` browser calls to backend `/api/*` routes |
| Backend services and repositories | `backend/app/services/`, `backend/app/repositories/` | Execute business workflows and database operations behind the API layer |

> Note: Add one API architecture diagram here. The diagram should show: Browser -> Next.js Frontend -> `/api/backend/*` -> Next.js rewrite -> Flask `/api/*` -> controllers -> services/repositories -> PostgreSQL/Redis/worker/market-data provider.

## 6.6.2 Description of Internal APIs and External Integration

The internal API is implemented as REST-style JSON endpoints. Most frontend modules call backend endpoints through `apiGet`, `apiPost`, `apiPatch`, and `apiDelete`. GET requests are used for reading data such as dashboards, experiment details, model rankings, documentation, and public hub records. POST, PATCH, and DELETE requests are used for state-changing operations such as login, logout, blueprint creation, experiment submission, cancellation, favorite toggling, user updates, and system operations.

The backend integrates with PostgreSQL through SQLAlchemy repositories. Controllers and services open unit-of-work transactions, read or modify records, and return JSON responses. The frontend never communicates directly with PostgreSQL. This preserves the backend as the single authority for validation, authorization, and persistence.

The backend integrates with Redis through the queue service. When an experiment is created, the backend stores the experiment and then enqueues an experiment execution job. The worker consumes the job, executes the experiment, updates progress, and persists generated model and log records. The job and system APIs expose queue visibility to users and administrators.

The backend also integrates with a Binance-compatible market-data API for BTCUSDT candles. The market-data service retrieves candles, normalizes them, and stores them locally before charts or experiments use them. This design avoids making every chart or experiment execution depend directly on a live external request.

**Table 6.39: Internal and External Integration Points**

| Integration | Direction | Purpose | Main Source Areas |
| --- | --- | --- | --- |
| Frontend to backend API | Browser -> Next.js rewrite -> Flask API | Allows views to perform authentication, blueprint, experiment, model, job, documentation, hub, market-data, and system operations | `frontend/lib/api/`, `frontend/views/`, `backend/app/controllers/` |
| Backend to PostgreSQL | Controllers/services/repositories -> database | Persists users, blueprints, experiments, models, logs, candles, favorites, settings, and system events | `backend/app/repositories/`, `backend/app/infrastructure/database/` |
| Backend to Redis queue | Queue service -> Redis | Enqueues experiment execution jobs and reads queue metadata | `backend/app/services/queue_service.py`, `backend/app/infrastructure/redis/` |
| Worker to persistence layer | Worker/executor -> repositories -> database | Updates experiment status, progress, model metrics, and logs after queued execution | `backend/app/workers/`, `backend/app/executors/`, `backend/app/repositories/` |
| Backend to market-data provider | Market-data service -> Binance-compatible API | Retrieves BTCUSDT candles for local cache refresh | `backend/app/services/market_data_service.py`, `backend/app/infrastructure/binance/` |
| Frontend to chart components | View state -> reusable chart component | Renders BTCUSDT chart data returned by backend APIs | `frontend/components/charts/`, `frontend/views/` |

## 6.6.3 API Endpoint Groups Implemented

The implemented endpoints are grouped by module. This makes the API easier to understand and test because each group maps to a feature area in the system. The endpoint groups listed in this section are based on the frontend endpoint map and backend route registration.

**Table 6.40: Implemented API Endpoint Groups**

| API Group | Example Endpoints | Main Purpose |
| --- | --- | --- |
| Health | `GET /api/health` | Checks backend service health and runtime status |
| Authentication | `GET /api/auth/csrf`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | Handles CSRF token retrieval, registration, login, logout, and current-user session restoration |
| Users | `GET /api/users`, `GET /api/users/me`, `GET /api/users/{id}`, `PATCH /api/users/{id}/status`, `PATCH /api/users/{id}/role`, `DELETE /api/users/{id}` | Provides profile and staff user-management operations |
| Blueprints | `POST /api/blueprints`, `GET /api/blueprints/{id}`, `PATCH /api/blueprints/{id}`, `GET /api/blueprints/metadata`, `POST /api/blueprints/{id}/favorite` | Supports blueprint creation, editing, detail retrieval, metadata loading, and favorites |
| Blueprint library | `GET /api/blueprints/library/owned`, `GET /api/blueprints/library/favorited` | Lists owned and favorited blueprints |
| Blueprint approval | `POST /api/blueprints/{id}/request-approval`, `GET /api/blueprints/moderation/queue`, `POST /api/blueprints/{id}/approve`, `POST /api/blueprints/{id}/reject`, `POST /api/blueprints/{id}/disapprove` | Supports owner approval requests and staff moderation |
| Experiments | `POST /api/experiments`, `GET /api/experiments`, `GET /api/experiments/{id}`, `POST /api/experiments/{id}/cancel`, `POST /api/experiments/{id}/retry`, `DELETE /api/experiments/{id}`, `GET /api/experiments/blueprint-options` | Supports experiment creation, listing, detail retrieval, cancellation, retry, deletion, and selectable blueprint options |
| Jobs | `GET /api/jobs/`, `GET /api/jobs/{id}`, `POST /api/jobs/{id}/cancel` | Supports queue job listing, job detail, and cancellation |
| Market data | `GET /api/market-data/btcusdt/klines`, `GET /api/market-data/btcusdt/metadata`, `GET /api/market-data/btcusdt/target-preview`, `POST /api/market-data/btcusdt/admin/catch-up`, `GET /api/market-data/btcusdt/admin/catch-up/status`, `POST /api/market-data/btcusdt/admin/catch-up/stop`, `DELETE /api/market-data/btcusdt/admin/klines` | Provides BTCUSDT chart data, market-data metadata, target preview, and administrative cache maintenance |
| Models | `GET /api/models/rankings`, `GET /api/models/highlights`, `GET /api/models/library/favorited`, `GET /api/models/{id}`, `POST /api/models/{id}/favorite`, `DELETE /api/models/{id}/favorite` | Supports model ranking, model detail, highlights, and saved model behavior |
| Logs | `GET /api/logs/experiments/{id}/{artifact}`, `GET /api/logs/experiments/{id}/models/{modelId}/round` | Supports experiment artifact downloads and model-level round logs |
| Public Hub | `GET /api/hub`, `GET /api/hub/users/{id}` | Supports public discovery of enabled users, approved blueprints, completed experiments, and generated models |
| Documentation | `GET /api/docs`, `GET /api/docs/{slug}` | Lists and serves documentation content |
| System | `GET /api/system/queue/active`, `GET /api/system/settings`, `GET /api/system/events`, `GET /api/system/events/download` | Provides administrator-facing queue, settings, event, and event-download operations |

> Note: Add one API endpoint evidence screenshot from browser developer tools showing a successful `/api/backend/...` request and the corresponding JSON response. Use non-sensitive demonstration data only.

## 6.6.4 Frontend API Client Integration

The frontend API client is implemented in `frontend/lib/api/client.ts`. It provides helper functions for GET, POST, PATCH, and DELETE requests. All requests include browser credentials so that backend session cookies are sent with API calls. Mutating requests also obtain a CSRF token from the backend and attach it to the request headers.

The endpoint map is implemented in `frontend/lib/api/endpoints.ts`. It defines the API base path and all endpoint strings used by frontend views. The browser default is `/api/backend`, which matches the Next.js rewrite path. This prevents individual views from hard-coding backend origins or duplicating route strings.

The API client also standardizes error handling. If the backend returns a non-success response, the client parses the JSON payload and raises a typed `ApiClientError`. Frontend views can then display a form error, validation message, empty state, or page-level error message.

```text
PROCEDURE Send Frontend API Request
  RECEIVE endpoint path, HTTP method, optional payload, and optional headers
  BUILD browser URL from centralized API base path and endpoint map

  IF request method is GET THEN
    ATTACH Accept JSON header
  ELSE
    FETCH CSRF token from authentication endpoint
    ATTACH Accept JSON header
    ATTACH Content-Type JSON header
    ATTACH CSRF token header when available
  ENDIF

  INCLUDE browser credentials in request
  SEND request to `/api/backend` path
  WAIT for Next.js rewrite to forward request to backend `/api` route
  PARSE JSON response

  IF response status is not successful THEN
    CREATE typed frontend API error from backend error payload
    THROW error to calling view
  ENDIF

  RETURN parsed response payload
ENDPROCEDURE
```

**Table 6.41: Frontend API Client Responsibilities**

| Responsibility | Implementation Detail |
| --- | --- |
| Central API base | Uses `/api/backend` in browser runtime unless overridden by a relative configured path |
| Endpoint consistency | Stores endpoint paths in `API_ENDPOINTS` instead of duplicating strings inside views |
| Credential handling | Sends requests with browser credentials included |
| CSRF support | Fetches CSRF token before POST, PUT, PATCH, or DELETE requests |
| JSON parsing | Parses JSON responses when the backend returns JSON content |
| Error handling | Converts failed responses and network failures into `ApiClientError` |
| View integration | Exposes typed helper functions used by authentication, users, blueprints, experiments, models, hub, docs, jobs, market-data, and system views |

## 6.6.5 Backend API Controller Integration

Backend controllers are organized by feature area. Each controller receives an HTTP request, extracts path parameters or JSON payloads, calls the access-control service when authentication or authorization is required, validates input, coordinates services or repositories, and returns a standard response. This keeps request handling separate from frontend rendering and database internals.

For example, the authentication controller handles login and session lifecycle. The blueprint controllers handle draft creation, detail retrieval, favorites, versioning, and approval. The experiment controller validates and compiles experiment submissions before queueing execution jobs. The model controller exposes rankings, highlights, details, and favorites. The system controller exposes administrator-oriented queue, setting, and event data.

```text
PROCEDURE Handle Backend API Request
  RECEIVE HTTP request at Flask route
  READ path parameters, query parameters, or JSON payload
  IF endpoint requires authentication THEN
    RESOLVE authenticated user from session cookie
    IF user is missing THEN
      RETURN unauthenticated JSON response
    ENDIF
  ENDIF

  IF endpoint requires a role THEN
    VERIFY user role satisfies endpoint permission
    IF role is insufficient THEN
      RETURN forbidden JSON response
    ENDIF
  ENDIF

  VALIDATE request data
  IF validation fails THEN
    RETURN validation-error JSON response
  ENDIF

  OPEN unit of work when persistence is required
    CALL repository or service logic
    COMMIT operation if successful
  CLOSE unit of work

  RETURN standard success JSON response
ENDPROCEDURE
```

**Table 6.42: Backend Controller Integration by Module**

| Backend Controller Area | Integration Responsibility |
| --- | --- |
| `authentication_controller.py` | Integrates user repository, password service, session service, CSRF token generation, and current-user lookup |
| `user_controller.py` | Integrates user-management APIs with access control and user persistence |
| `blueprint_controller.py` | Integrates blueprint detail, creation, editing, favorite behavior, validation, and versioning |
| `blueprint_approval_controller.py` | Integrates staff moderation with blueprint approval-state transitions |
| `experiment_controller.py` | Integrates experiment validation, compiler snapshots, database persistence, and queue submission |
| `job_controller.py` | Integrates queue metadata with user-facing job detail and cancellation behavior |
| `market_data_controller.py` | Integrates chart endpoints, metadata, target preview, and cache administration with market-data service |
| `model_controller.py` | Integrates model rankings, highlights, details, and model favorites |
| `logs_download_controller.py` | Integrates experiment log retrieval with downloadable artifact responses |
| `public_hub_controller.py` | Integrates public discovery of users, blueprints, experiments, and models |
| `documentation_controller.py` | Integrates documentation listing and detail retrieval |
| `system_controller.py` | Integrates active queue snapshot, system settings, and system event retrieval |

## 6.6.6 JSON Payload Structure

The backend uses JSON as the primary request and response format for application APIs. Successful responses commonly include an `ok` flag and a `data` object. Error responses include an `ok` flag set to false and an error object containing a machine-readable code and human-readable message. Validation responses include field-level error details where appropriate.

### Standard Success Response

```json
{
  "ok": true,
  "data": {
    "status": "success"
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

### Authentication Request Example

```json
{
  "email": "demo@example.com",
  "password": "example-password"
}
```

### Authentication Response Example

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": 1,
      "username": "demouser",
      "email": "demo@example.com",
      "name": "Demo User",
      "role": "User",
      "status": "Enabled"
    }
  }
}
```

### Blueprint Creation Payload Example

```json
{
  "metadata": {
    "name": "Baseline BTCUSDT Blueprint",
    "description": "Reusable baseline configuration for BTCUSDT experiments"
  },
  "indicators": {
    "parameters": {
      "sma": {
        "window": [20, 50]
      }
    },
    "parameter_constraints": {
      "sma": {
        "window": {
          "type": "integer",
          "min": 2,
          "max": 200
        }
      }
    }
  },
  "features": {},
  "architecture": {
    "name": "logistic_regression",
    "parameters": {
      "max_iter": 100
    },
    "parameter_constraints": {}
  }
}
```

### Experiment Creation Payload Example

```json
{
  "name": "BTCUSDT Baseline Experiment",
  "description": "Demonstration experiment using an approved blueprint",
  "symbol": "BTCUSDT",
  "interval": "1m",
  "start_datetime": "2026-01-01T00:00:00Z",
  "end_datetime": "2026-01-07T00:00:00Z",
  "train_split": 0.7,
  "val_split": 0.15,
  "test_split": 0.15,
  "blueprint_id": 1,
  "target_strategy": "forward_return",
  "split_strategy": "time_based_sequential",
  "deterministic": true,
  "seed": 42,
  "requested_permutation_count": 10,
  "parameter_overrides": {}
}
```

### Experiment Creation Response Example

```json
{
  "ok": true,
  "data": {
    "experiment": {
      "id": 10,
      "detailPath": "/experiments/10",
      "status": "Queued",
      "progress": 0,
      "maxPermutationCount": 20,
      "requestedPermutationCount": 10
    },
    "queue": {
      "jobId": "example-job-id",
      "queueName": "experiments",
      "position": 1
    }
  }
}
```

> Note: Keep all API payload examples in the final report non-sensitive. Demonstration email addresses, usernames, experiment names, and identifiers should not reveal real accounts or private local data.

## 6.6.7 Authentication, Session, and CSRF Integration

The system uses server-managed session authentication. After successful login, the backend creates a session record associated with the authenticated user id and role. The session identifier is sent to the browser as an HTTP-only cookie. The frontend does not store the credential value and does not decide authentication status by itself.

When the frontend loads, `AuthProvider` calls the current-user endpoint through the API client. If the backend confirms that the session is valid, the frontend stores the safe current-user object in its authentication state. If the session is missing, expired, or invalid, authenticated routes are blocked or redirected.

CSRF protection is used for state-changing requests. The frontend API client checks whether the HTTP method changes server state. For POST, PUT, PATCH, and DELETE requests, it obtains a CSRF token from the backend and attaches it to the request headers. The backend validates CSRF requirements before allowing protected mutations.

```text
PROCEDURE Authenticate And Use Session
  USER submits login form
  FRONTEND sends login payload through API client
  BACKEND validates credential and account status
  BACKEND creates server-managed session
  BACKEND sets HTTP-only session cookie
  FRONTEND receives safe user object
  FRONTEND stores current user in authentication provider

  WHEN page refreshes
    FRONTEND calls current-user endpoint with browser credentials
    BACKEND resolves session cookie and returns safe user object
    FRONTEND restores authenticated UI state
  ENDWHEN
ENDPROCEDURE
```

```text
PROCEDURE Send State-Changing Request
  DETERMINE request method
  IF method is POST, PUT, PATCH, or DELETE THEN
    REQUEST CSRF token from backend
    ADD CSRF token to request header
    ADD JSON content-type header
  ENDIF
  INCLUDE browser credentials
  SEND request through frontend API path
  PARSE backend response
  IF backend returns error THEN
    DISPLAY or store typed frontend error
  ELSE
    UPDATE frontend state with response data
  ENDIF
ENDPROCEDURE
```

**Table 6.43: Authentication and CSRF Integration**

| Mechanism | Implementation Responsibility |
| --- | --- |
| Server-managed session | Backend creates and validates session records associated with user identity and role |
| HTTP-only cookie | Browser stores session identifier without exposing it directly to frontend JavaScript |
| Current-user endpoint | Frontend restores session-aware identity after page refresh |
| Route guards | Frontend blocks or redirects unauthenticated and role-restricted screens |
| Backend access control | Backend enforces authentication and role checks before protected operations |
| CSRF token endpoint | Backend provides token used by frontend mutating requests |
| API client CSRF handling | Frontend attaches CSRF token to state-changing requests |

## 6.6.8 Experiment Submission and Worker Integration

Experiment submission demonstrates the deepest integration flow in the system. It involves the frontend experiment wizard, backend validation, blueprint access checking, experiment compilation, database persistence, queue submission, worker execution, model persistence, log persistence, and frontend status updates.

The frontend sends the experiment creation payload through `POST /api/experiments`. The backend validates the payload and selected blueprint, compiles immutable snapshots, stores the experiment, creates placeholder model rows for selected parameter hashes, and enqueues the job. The worker later consumes the job and updates the experiment status and result records.

```text
PROCEDURE Submit Experiment Through API
  FRONTEND collects wizard form state
  FRONTEND sends POST request to experiment creation endpoint
  BACKEND authenticates user
  BACKEND validates experiment fields and blueprint access
  BACKEND compiles blueprint and experiment snapshots
  BACKEND stores experiment as Queued
  BACKEND creates model placeholder rows for selected parameter hashes
  BACKEND enqueues experiment execution job
  BACKEND returns experiment id, detail path, status, permutation counts, and queue metadata
  FRONTEND navigates to experiment detail or job detail page
ENDPROCEDURE
```

```text
PROCEDURE Execute Queued Experiment Integration
  WORKER receives queued job payload
  WORKER validates experiment id
  WORKER marks experiment as Running
  EXECUTOR loads experiment configuration and persisted BTCUSDT data
  EXECUTOR runs split, features, targets, scaling, training, evaluation, and backtest
  EXECUTOR stores model metrics and experiment logs
  WORKER marks experiment as Completed or Failed
  FRONTEND refreshes experiment or job detail through API
ENDPROCEDURE
```

> Note: Add a sequence diagram for this integration. Recommended sequence: Experiment Wizard -> Frontend API Client -> Flask Experiment API -> PostgreSQL -> Queue Service -> Redis -> Worker -> Executor -> PostgreSQL -> Experiment Detail View.

## 6.6.9 Market Data and Chart Integration

Market-data integration supports both chart display and experiment execution. The frontend chart requests BTCUSDT kline data from the backend. The backend reads cached candle data from PostgreSQL and returns chart-ready records. Administrative market-data endpoints can trigger catch-up or cache maintenance when needed.

The backend market-data service also retrieves BTCUSDT candles from the configured provider. Retrieved candles are normalized and persisted into the local database. The experiment executor later reads persisted candles rather than relying directly on a live external request during every experiment run.

```text
PROCEDURE Load BTCUSDT Chart Data
  FRONTEND requests BTCUSDT kline endpoint with range and interval parameters
  BACKEND validates range and interval
  BACKEND queries cached candle records from market-data repository
  BACKEND maps database candles into chart response records
  FRONTEND receives candle array
  FRONTEND renders chart or empty/error state
ENDPROCEDURE
```

```text
PROCEDURE Refresh BTCUSDT Cache
  BACKEND receives refresh or catch-up request
  BACKEND determines missing or requested candle range
  BACKEND calls configured market-data provider
  BACKEND normalizes candle timestamps and OHLCV values
  BACKEND upserts candles into PostgreSQL
  BACKEND returns fetched, inserted, and updated counts
ENDPROCEDURE
```

**Table 6.44: Market Data API Integration**

| API Area | Data Source | Output Consumer |
| --- | --- | --- |
| Kline chart endpoint | Cached BTCUSDT candles in PostgreSQL | Dashboard and chart components |
| Metadata endpoint | Market-data repository summary | Dashboard and administrative views |
| Target preview endpoint | Cached BTCUSDT data and target strategy logic | Experiment wizard preview or validation aid |
| Catch-up endpoints | Market-data service and provider client | Administrative market-data maintenance |
| Experiment executor data load | Market-data repository | Worker execution pipeline |

## 6.6.10 Model, Log, Favorite, and Public Hub Integration

After an experiment completes, generated model and log records become available through model, log, favorite, and public hub APIs. The model endpoints provide rankings, highlights, detail pages, and favorite actions. The log endpoints provide downloadable artifacts and model-level round logs. The public hub endpoint exposes enabled users, approved blueprints, completed experiments, and generated models for discovery.

These APIs reuse the same persisted records created by the worker. This avoids duplicate result storage and keeps the application consistent. A model visible in rankings can also appear in public hub, be opened in a detail page, and be saved as a favorite.

```text
PROCEDURE Inspect Completed Experiment Results
  FRONTEND opens experiment detail view
  BACKEND returns experiment configuration, progress, models, logs, and compiled snapshots
  FRONTEND displays model summary and artifact actions

  IF user opens model ranking THEN
    FRONTEND requests ranking endpoint
    BACKEND orders models by selected metric
    FRONTEND renders ranking table
  ENDIF

  IF user downloads artifact THEN
    FRONTEND requests log download endpoint
    BACKEND verifies access and formats artifact
    FRONTEND receives downloadable file response
  ENDIF
ENDPROCEDURE
```

```text
PROCEDURE Save Artifact As Favorite
  FRONTEND sends favorite request for model or blueprint
  BACKEND authenticates user
  BACKEND verifies target artifact exists and is visible
  IF favorite already exists THEN
    RETURN existing favorite state
  ELSE
    CREATE favorite association record
    RETURN favorited state
  ENDIF
ENDPROCEDURE
```

## 6.6.11 Error Handling and Validation Integration

The API layer uses structured JSON responses for errors. Validation errors are returned when submitted payloads are incomplete, incorrectly formatted, or inconsistent with business rules. Authentication errors are returned when a session is missing or invalid. Authorization errors are returned when the user role is insufficient. Queue errors are returned when Redis-backed queue functionality is unavailable. Market-data errors are returned when candle retrieval or cache operations fail.

The frontend API client converts failed responses into typed errors. Views can display these errors as form-level messages, field-level validation messages, page-level alerts, or empty states. This prevents raw backend errors from appearing directly in the interface and makes user feedback more consistent.

**Table 6.45: API Error Handling Categories**

| Error Category | Example Situation | Expected API Behavior | Frontend Behavior |
| --- | --- | --- | --- |
| Validation error | Invalid experiment split or missing blueprint field | Return JSON validation error with field details | Show field or form error |
| Authentication error | User accesses protected endpoint without valid session | Return unauthenticated JSON response | Redirect or show login requirement |
| Authorization error | Normal user accesses administrator endpoint | Return forbidden JSON response | Show restricted-access state |
| Not found error | Requested experiment, model, or blueprint does not exist | Return not-found JSON response | Show not-found or empty state |
| Queue error | Queue service cannot be reached | Return service-unavailable JSON response | Show operational error message |
| Market-data error | Candle refresh fails or range is invalid | Return market-data error response | Show chart or admin error state |
| Network error | Backend unreachable from browser | API client raises network-style error | Show backend unavailable message |

```text
PROCEDURE Handle API Error In Frontend View
  CALL API client function
  IF request succeeds THEN
    STORE response data
    RENDER normal content
  ELSE IF error contains validation details THEN
    MAP details to form fields or validation summary
  ELSE IF error status is unauthenticated THEN
    REDIRECT to login or show login prompt
  ELSE IF error status is forbidden THEN
    SHOW restricted-access message
  ELSE
    SHOW page-level error state
  ENDIF
ENDPROCEDURE
```

## 6.6.12 API Integration Evidence to Include

The final report should include API and integration evidence that demonstrates real communication between modules. The best evidence is not a long source-code listing, but a combination of diagrams, endpoint tables, request/response samples, and screenshots from the running system.

Recommended evidence:

- Integration diagram showing browser, frontend rewrite, backend API, database, Redis, worker, and market-data provider.
- Browser developer tools screenshot showing a frontend request to `/api/backend/...` and a successful JSON response.
- Backend terminal or health endpoint screenshot showing the API is running.
- Sample JSON request and response for login or experiment creation.
- Sequence diagram for experiment submission and worker execution.
- Screenshot of a failed validation response displayed in the frontend form.

> Note: Do not include real credentials, private session cookie values, local secrets, or private account data in screenshots. Use demonstration accounts and sanitized responses.

## 6.6.13 Summary

The implemented APIs and integration structure connect the full system together. The Next.js frontend communicates with the Flask backend through a centralized API client and `/api/backend` rewrite path. The backend exposes modular JSON APIs under `/api`, validates and authorizes requests, persists data through repositories, enqueues long-running experiment work through Redis-backed queueing, and integrates with BTCUSDT market-data retrieval.

This API design supports maintainability because each module has a clear boundary. Frontend views use endpoint definitions rather than hard-coded backend origins. Backend controllers handle HTTP requests and delegate business behavior to services, validators, repositories, and workers. Infrastructure integrations such as PostgreSQL, Redis, and market-data retrieval remain behind backend boundaries. As a result, the system can support secure user workflows, reproducible experiment submission, asynchronous execution, result inspection, documentation access, public discovery, and administrative monitoring.
