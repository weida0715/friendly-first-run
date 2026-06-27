# 6.8 Security Measures

## 6.8.1 Input Validation, Encryption, and HTTPS Configuration

Security begins at the API boundary. The backend validates authentication inputs, blueprint payloads, experiment payloads, market-data requests, and administrative actions before processing them. Blueprint validation is implemented in `backend/app/validators/blueprint_validator.py`, experiment validation is implemented in `backend/app/validators/experiment_validator.py`, and request-specific validation is also implemented inside controller functions. Passwords are not stored in plaintext; password hashing and verification are handled by `backend/app/services/password_service.py`.

| Security control | Implementation | Relative paths |
|---|---|---|
| Password hashing | Passwords are stored as hashes and verified during login | `backend/app/services/password_service.py`, `backend/app/controllers/authentication_controller.py` |
| Request validation | Required fields, data types, split totals, date ordering, and payload structure are checked | `backend/app/validators/blueprint_validator.py`, `backend/app/validators/experiment_validator.py` |
| BTCUSDT scope validation | Market data and experiments are restricted to supported BTCUSDT/1m paths | `backend/app/controllers/market_data_controller.py`, `backend/app/infrastructure/binance/kline_client.py`, `backend/app/validators/experiment_validator.py` |
| CSRF hardening | Unsafe browser requests are protected by CSRF-aware infrastructure and client handling | `backend/app/infrastructure/csrf/`, `backend/tests/test_csrf_hardening.py`, `frontend/tests/api-client-csrf.test.ts` |
| Error shaping | API errors are returned as structured responses rather than uncaught tracebacks | `backend/app/responses.py`, `frontend/lib/api/client.ts` |

HTTPS is not directly configured in the Flask or Next.js source for the local development setup. In a live deployment, HTTPS should be terminated at a reverse proxy or hosting platform. The implementation chapter should state that local development uses HTTP on localhost, while production deployment should use HTTPS with secure cookie settings and trusted origins.

Input validation pseudocode:

```text
PROCEDURE ValidateExperimentRequest
    CHECK user is authenticated
    CHECK required fields are present
    CHECK symbol equals BTCUSDT
    CHECK interval equals 1m
    CHECK start date is before end date
    CHECK train + validation + test split equals expected total
    CHECK validation/test splits satisfy minimum thresholds
    CHECK selected blueprint is accessible to current user
    CHECK parameter overrides are structured objects
    RETURN validation result
END PROCEDURE
```

## 6.8.2 Role-Based Access Control (RBAC)

The system implements three main roles: User, Moderator, and Admin. Role and status values are stored in the `User` database model and enforced at both backend and frontend levels. Backend enforcement is essential because frontend visibility can improve user experience but cannot be the only security mechanism. Access-control logic is implemented in `backend/app/services/access_control_service.py` and `backend/app/controllers/_access.py`. Frontend route and navigation visibility is implemented in `frontend/lib/routes/nav.ts` and authentication guard components under `frontend/lib/auth/`.

| Role | Allowed functionality | Restricted functionality |
|---|---|---|
| User | Dashboard, own experiments, own/favourited blueprints, models, favourites, public hub, documentation, own jobs/profile | Cannot manage users, system settings, queue snapshot, or moderation actions. |
| Moderator | User features plus blueprint moderation queue and moderation actions | Cannot access admin-only system management actions if those are restricted to Admin. |
| Admin | Full platform access including user management, system settings/events, queue snapshot, market-data administration, and moderation | Highest role. |

RBAC pseudocode:

```text
PROCEDURE RequireRole(user, minimum_role)
    IF user is not authenticated THEN
        DENY access
    END IF
    IF user.status is not Active THEN
        DENY access
    END IF
    IF user.role is lower than minimum_role THEN
        DENY access
    END IF
    ALLOW request
END PROCEDURE
```

Required screenshots:

1. Normal user navigation showing only user-level pages.
2. Moderator access to blueprint moderation page.
3. Admin access to user management and system management pages.
4. Access denied page or redirect when a normal user accesses a restricted route.

## 6.8.3 Error Handling and Logging

The backend uses structured response helpers and specific service exceptions to handle common failure modes. Queue errors, validation errors, unauthorized access, and missing records are returned through API responses instead of exposing internal exceptions. Job execution errors are handled by the worker so that failed experiments are marked as failed and can be inspected by the user.

System events are stored using the system event persistence layer. System event ORM and repository files are `backend/app/infrastructure/database/orm/system_event_orm.py` and `backend/app/repositories/system_event_repository.py`. System event APIs are implemented in `backend/app/controllers/system_controller.py`, and frontend system-management tests are implemented in `frontend/tests/system-management-view.test.tsx`.

| Error / logging area | Implementation | Relative paths |
|---|---|---|
| API response shaping | Reusable response helpers | `backend/app/responses.py` |
| Queue exceptions | Queue unavailable, unsupported job type, missing job | `backend/app/services/queue_service.py` |
| Worker failure handling | Experiment status becomes Failed when execution fails | `backend/app/workers/experiment_worker.py` |
| Cancellation handling | Strategy-based cancellation and state checks | `backend/app/strategies/experiment_cancellation_handler.py`, `backend/app/strategies/job_cancellation_handler_registry.py` |
| System events | Admin-visible event records and download | `backend/app/controllers/system_controller.py`, `backend/app/repositories/system_event_repository.py` |
| Frontend error states | Empty/loading/error views and API error mapping | `frontend/components/states/`, `frontend/lib/api/client.ts` |

Failure-handling pseudocode:

```text
PROCEDURE ExecuteExperimentJob
    TRY
        SET status to Running
        RUN compiler and executor
        SET status to Completed
    CATCH cancellation request
        SET status to Cancelled
    CATCH exception
        CAPTURE error message
        SET status to Failed
        PERSIST failure state
    END TRY
END PROCEDURE
```

Required screenshots:

1. Frontend form validation error state.
2. Experiment failed/cancelled status state if available.
3. System events table in admin system management page.
4. Job detail page showing error, cancellation, or completed state.
