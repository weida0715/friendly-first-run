# 6.8 Security Measures

Security in BEE is implemented through backend validation, password hashing, server-side sessions, role-based access control, ownership checks, structured error handling, and system event logging. The frontend also filters routes by role and displays validation errors, but the backend remains the final authority for protected operations.

## 6.8.1 Input Validation, Encryption, and HTTPS Configuration

BEE validates input before writing data to the database or starting long-running work. Authentication validates registration and login payloads. Blueprint creation validates metadata, architecture, indicators, and features. Experiment creation validates date range, split values, selected blueprint access, target strategy, and parameter overrides. Market-data endpoints validate interval, limit, and date range before returning cached candles.

Passwords are not stored as plaintext. During registration and managed-user creation, the backend stores a password hash. During login, the submitted password is verified against the stored hash. This is visible in the authentication controller, where `hash_password` is used during registration and `verify_password` is used during login.[^sec-auth]

| Security control | How it is implemented | Relative paths |
|---|---|---|
| Registration validation | Checks payload format, username, email, duplicates, and password requirements | `backend/app/controllers/authentication_controller.py` lines 95-152 |
| Login validation | Checks payload, password, and enabled user status | `backend/app/controllers/authentication_controller.py` lines 155-217 |
| Blueprint validation | Validates blueprint payload before persistence | `backend/app/validators/blueprint_validator.py`, `backend/app/controllers/blueprint_controller.py` lines 201-214 |
| Experiment validation | Validates experiment payload before compilation and queueing | `backend/app/validators/experiment_validator.py`, `backend/app/controllers/experiment_controller.py` lines 272-314 |
| Market-data validation | Validates interval, limit, date range, and preview payload | `backend/app/controllers/market_data_controller.py` lines 424-530 |
| API error handling | Returns structured JSON errors instead of exposing raw internal failure details | `backend/app/responses.py`, `frontend/lib/api/client.ts` lines 103-124 |
| Frontend form feedback | Shows validation errors in login, blueprint wizard, experiment wizard, model pages, and admin pages | `frontend/tests/login-view.test.tsx`, `frontend/tests/blueprint-wizard-view.test.tsx`, `frontend/tests/experiment-wizard-view.test.tsx` |

HTTPS is not directly configured inside the Flask or Next.js source code for the local development setup. Local testing uses browser and API calls on local addresses. In a live deployment, HTTPS should be configured at the hosting or reverse-proxy layer, and the backend session-cookie settings should be adjusted for the production environment. The source code already contains production-oriented session configuration fields, including a secure-cookie flag in `backend/app/config.py` lines 39-42.

Input validation pseudocode:

```text
PROCEDURE ValidateExperimentBeforeQueue
    REQUIRE authenticated user
    CHECK payload contains required experiment fields
    CHECK BTCUSDT data scope and supported interval
    CHECK start time is earlier than end time
    CHECK train, validation, and test split values are valid
    CHECK selected blueprint exists and is accessible
    CHECK parameter overrides are valid for the compiled blueprint
    IF any validation error exists THEN
        RETURN structured validation response
    END IF
    CONTINUE to compilation and queueing
END PROCEDURE
```

## 6.8.2 Role-Based Access Control (RBAC)

BEE implements three main roles: `User`, `Moderator`, and `Admin`. A normal user can access the core application areas. A moderator can access moderation-related functions and some staff functions. An admin can access the full system management area. The frontend uses `frontend/lib/routes/nav.ts` to show role-appropriate navigation, but backend controllers still enforce access rules.

| Role | Main allowed functions | Main restrictions |
|---|---|---|
| User | Dashboard, own experiments, own and favourited blueprints, models, favourites, public hub, documentation, own jobs | Cannot access user management, system management, or moderation actions. |
| Moderator | User functions plus blueprint moderation and staff-level user functions where allowed | Cannot access admin-only system management actions. |
| Admin | Full application, user management, system management, moderation, queue view, settings, events, and market-data controls | Highest implemented role. |

Backend role checks appear across the controllers. User management requires staff access for the list and audit endpoints, while role changes require admin access.[^sec-user] System queue, settings, and events require admin access.[^sec-system] Blueprint moderation requires staff access.[^sec-blueprint-approval] Job detail allows the owner or staff to view the job.[^sec-job]

RBAC pseudocode:

```text
PROCEDURE AuthorizeRestrictedAction
    READ current authenticated context from server-side session
    IF no valid context exists THEN
        RETURN unauthenticated response
    END IF
    IF user role is below the required role THEN
        RETURN forbidden response
    END IF
    IF action targets an owned resource THEN
        CHECK user owns the resource OR user is staff
    END IF
    ALLOW action
END PROCEDURE
```

Required screenshots:

| Screenshot | What to show |
|---|---|
| Normal user sidebar | Dashboard, Experiments, Blueprints, Models, Favorites, Public Hub, Documentation |
| Moderator sidebar | Moderation link and allowed staff links |
| Admin sidebar | Users, System, Moderation, and Jobs links visible |
| Forbidden state | Normal user blocked from admin system page |
| Backend API forbidden response | JSON response when normal user calls restricted endpoint |

## 6.8.3 Error Handling and Logging

The backend uses structured response helpers for success, validation errors, general errors, and forbidden responses. The frontend API client reads JSON responses and converts failed responses into `ApiClientError` so views can show errors instead of failing silently. The frontend tests also verify visible error states for login, blueprint wizard, experiment wizard, model rankings, user management, and system management.

Experiment execution errors are handled by the worker. If the executor fails, the worker marks the experiment as failed and stores a short failure stage. If the executor completes, the worker marks the experiment as completed. This protects the user from a job that remains in an unclear state after a runtime failure.[^sec-worker]

System events give admins an operational view of important actions. The system controller records events and exposes admin-only event listing and download endpoints.[^sec-system]

| Error or logging area | Implementation | Relative paths |
|---|---|---|
| JSON response helpers | Success, error, validation, and forbidden responses | `backend/app/responses.py` |
| Frontend error mapping | Converts failed fetch responses into frontend errors | `frontend/lib/api/client.ts` lines 103-124 |
| Authentication errors | Invalid payload, duplicate user, invalid credentials, disabled account, missing session | `backend/app/controllers/authentication_controller.py` |
| Blueprint errors | Field-level validation errors and invalid approval transitions | `backend/app/controllers/blueprint_controller.py`, `backend/app/controllers/blueprint_approval_controller.py` |
| Experiment errors | Validation failure, compilation failure, queue unavailable, unexpected error response | `backend/app/controllers/experiment_controller.py` |
| Worker errors | Marks failed experiment on executor exception | `backend/app/workers/experiment_worker.py` lines 136-150 |
| System event logging | Records and lists operational events | `backend/app/controllers/system_controller.py` lines 24-45 and 113-177 |

Failure-handling pseudocode:

```text
PROCEDURE RunExperimentJobSafely
    TRY
        MARK experiment as Running
        RUN executor
        MARK experiment as Completed
    CATCH cancellation event
        RETURN cancelled result
    CATCH execution error
        MARK experiment as Failed
        STORE short error stage
        RAISE error for worker visibility
    END TRY
END PROCEDURE
```

## Required screenshots and code snippets

| Evidence | What to show | Suggested source or page |
|---|---|---|
| Login validation screenshot | Invalid login form message | `frontend/app/(auth)/login/` |
| Blueprint validation screenshot | Field-level wizard error | `frontend/app/blueprints/new/` |
| Experiment validation screenshot | Split or date-range error | `frontend/app/experiments/new/` |
| RBAC screenshot | User blocked from restricted page | Admin or system page using normal user |
| Worker failure snippet | Failed experiment handling | `backend/app/workers/experiment_worker.py` lines 136-150 |
| System events screenshot | Admin event table or terminal log | `frontend/app/system/` |

[^sec-auth]: Registration and login security logic is implemented in `backend/app/controllers/authentication_controller.py` lines 95-217.
[^sec-user]: Staff and admin checks are visible in `backend/app/controllers/user_controller.py` lines 113-380.
[^sec-system]: Admin-only system queue, settings, events, and download endpoints are implemented in `backend/app/controllers/system_controller.py` lines 64-177.
[^sec-blueprint-approval]: Blueprint moderation access is implemented in `backend/app/controllers/blueprint_approval_controller.py` lines 74-175.
[^sec-job]: Job owner or staff access checks are implemented in `backend/app/controllers/job_controller.py` lines 38-190.
[^sec-worker]: Worker success and failure handling is implemented in `backend/app/workers/experiment_worker.py` lines 55-150.
