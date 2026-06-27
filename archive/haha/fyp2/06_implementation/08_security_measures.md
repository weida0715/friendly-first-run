# 6.8 Security Measures

This section describes the security measures implemented in the Bitcoin Experimental Engine. The system includes browser-facing workflows, authenticated user actions, staff moderation, administrative functions, asynchronous jobs, and persisted research artifacts. Therefore, security is applied at multiple layers: frontend validation and route guards, backend authentication and authorization, server-managed sessions, CSRF protection, backend validators, repository-based persistence, standardized error responses, and operational event logging.

The security design follows an important principle: frontend checks improve usability, but backend checks remain authoritative. A user interface may hide restricted navigation or display validation feedback, but the backend still validates every protected operation before data is persisted, modified, queued, or returned. This is necessary because protected endpoints can be called directly even when frontend navigation is hidden.

## 6.8.1 Input Validation

Input validation is implemented at both frontend and backend levels. Frontend validation gives fast feedback to users when forms contain missing or incorrect values. Backend validation is the final enforcement point because backend controllers receive the actual submitted payload and decide whether the operation should continue.

The backend validates authentication payloads, blueprint payloads, experiment configuration, date ranges, split ratios, BTCUSDT scope, parameter override structure, role-management operations, and artifact access. For example, the experiment controller calls the experiment validator before compiling an experiment or queueing a job. The blueprint controller calls the blueprint validator before creating or updating a blueprint. Authentication routes validate registration and login inputs before checking persistence or session behavior.

This validation protects both data correctness and security. Invalid experiment splits could compromise experiment validity. Malformed parameter overrides could cause execution errors. Inaccessible blueprint identifiers could allow users to reference artifacts they should not use. Backend validation prevents these cases from becoming stored records or queued jobs.

**Table 6.53: Input Validation Controls**

| Validation Area | Implementation Location | Security Purpose |
| --- | --- | --- |
| Registration payload | `backend/app/controllers/authentication_controller.py` | Ensures required account fields are present and formatted before user creation |
| Login payload | `backend/app/controllers/authentication_controller.py` | Ensures submitted login data is valid before credential verification |
| Blueprint payload | `backend/app/validators/blueprint_validator.py` | Validates blueprint metadata, indicators, features, architecture, and parameter structure |
| Experiment payload | `backend/app/validators/experiment_validator.py` | Validates experiment configuration before persistence and queue submission |
| Experiment compilation | `backend/app/execution/experiment_compiler.py` | Validates overrides and parameter constraints before execution snapshots are created |
| Role and account updates | `backend/app/controllers/user_controller.py` and access-control service | Prevents unauthorized or invalid staff user-management changes |
| API request handling | `backend/app/controllers/` | Rejects invalid JSON and invalid path or query input before business logic continues |
| Frontend forms | `frontend/views/` and frontend validators | Provides immediate user-facing feedback before API submission |

```text
PROCEDURE Validate Protected Form Submission
  FRONTEND checks required fields and displays immediate feedback
  FRONTEND sends payload to backend API
  BACKEND verifies JSON payload structure
  BACKEND validates required fields and business rules
  BACKEND checks authenticated user and artifact access
  IF validation fails THEN
    RETURN structured validation error
  ENDIF
  CONTINUE persistence, queueing, or update operation
ENDPROCEDURE
```

> Note: Add a screenshot of a validation error in the frontend, such as an invalid experiment split or incomplete blueprint form. This demonstrates both security enforcement and user feedback.

## 6.8.2 Credential Protection

Credential protection is implemented using one-way hashing. During registration, the backend does not store the submitted credential value directly. Instead, it passes the value through the password service, which uses Werkzeug password hashing helpers. During login, the submitted credential is verified against the stored hash rather than compared to a stored plain value.

This design reduces risk if database records are inspected or exposed because the stored credential field is not the original credential. The authentication controller also returns only safe user fields such as id, username, email, name, role, and status. It does not return the stored credential hash to the frontend.

**Table 6.54: Credential Protection Measures**

| Measure | Implementation Location | Description |
| --- | --- | --- |
| One-way credential hashing | `backend/app/services/password_service.py` | Hashes submitted credential values before storage |
| Hash verification | `backend/app/services/password_service.py` | Verifies login submissions against stored hashes |
| Safe user response | `backend/app/controllers/authentication_controller.py` | Returns safe profile fields without exposing credential hashes |
| Duplicate account checks | `authentication_controller.py` and user repository | Prevents duplicate username or email registration |
| Disabled account check | `authentication_controller.py` and access-control service | Blocks login or session restoration for disabled accounts |

```text
PROCEDURE Store New User Credential
  RECEIVE registration credential
  VALIDATE credential length and account fields
  HASH credential using backend password service
  STORE credential hash in user record
  DISCARD original submitted credential after request handling
ENDPROCEDURE
```

```text
PROCEDURE Verify Login Credential
  RECEIVE email and credential from login request
  LOAD user by normalized email
  IF user is missing THEN
    RETURN invalid-credentials response
  ENDIF
  VERIFY submitted credential against stored hash
  IF verification fails THEN
    RETURN invalid-credentials response
  ENDIF
  IF user account is disabled THEN
    RETURN account-disabled response
  ENDIF
  CREATE authenticated session
ENDPROCEDURE
```

> Note: Do not include credential hashes, real passwords, real email addresses, or private account details in report screenshots. Use demonstration values only.

## 6.8.3 Server-Managed Sessions

Authenticated identity is maintained through server-managed sessions. After successful login, the backend creates a session record containing the session identifier, user id, role, creation time, and expiry time. The session identifier is stored in a browser cookie, while the session data itself is managed by the backend session service. The session service can use Redis-backed storage or memory-backed storage depending on configuration.

The access-control service resolves the current user from the session cookie. It checks whether the session exists, whether the user still exists, and whether the user is still enabled. If the user is missing or disabled, the session is destroyed and the request is treated as unauthenticated. This prevents disabled users from continuing to access the system through an old session.

Session behavior is configured through `.env`. Important settings include the session backend, timeout, cookie name, same-site behavior, and secure-cookie behavior. For local demonstration, development settings are used. For production-oriented deployment, secure cookie settings and HTTPS should be enabled.

**Table 6.55: Session Security Configuration**

| Session Area | Configuration or Source | Security Purpose |
| --- | --- | --- |
| Session identifier generation | `backend/app/services/session_service.py` | Generates random session identifiers for authenticated users |
| Session timeout | `.env` and runtime settings | Controls how long authenticated sessions remain valid |
| Session backend | `.env` | Selects Redis-backed or memory-backed session behavior |
| Session cookie name | `.env` and backend configuration | Identifies the browser cookie used for authentication session lookup |
| Same-site cookie behavior | `.env` | Reduces unintended cross-site session use |
| Secure cookie behavior | `.env` | Enables secure-cookie behavior for production-oriented HTTPS deployment |
| Session invalidation | `session_service.py` and access-control service | Destroys sessions during logout or when user state is invalid |

```text
PROCEDURE Create Server-Managed Session
  GENERATE random session identifier
  STORE user id, role, created time, and expiry time in backend session store
  IF Redis session backend is configured THEN
    STORE session with expiry time in Redis
  ELSE
    STORE session in in-memory session store
  ENDIF
  RETURN session identifier for HTTP-only browser cookie
ENDPROCEDURE
```

```text
PROCEDURE Resolve Session For Request
  READ session identifier from configured cookie name
  IF cookie is missing THEN
    RETURN unauthenticated context
  ENDIF
  LOAD session record from backend session store
  IF session is missing or expired THEN
    RETURN unauthenticated context
  ENDIF
  LOAD user by session user id
  IF user is missing or disabled THEN
    DESTROY session record
    RETURN unauthenticated context
  ENDIF
  RETURN authenticated context containing user identity and role
ENDPROCEDURE
```

## 6.8.4 CSRF Protection

CSRF protection is implemented using Flask-WTF CSRF support on the backend and CSRF-aware request handling in the frontend API client. The backend exposes a CSRF token endpoint, and the frontend API client obtains a token before sending state-changing requests.

The frontend API client treats POST, PUT, PATCH, and DELETE requests as mutating requests. Before sending one of these requests, it calls the CSRF token endpoint and attaches the token to the request header. The backend rejects requests that fail CSRF validation and returns a structured JSON error response.

This measure is important because the system uses browser-based sessions. Without CSRF protection, a malicious cross-site request could attempt to perform actions using the browser's existing session cookie. CSRF validation requires a valid token in addition to the session cookie.

**Table 6.56: CSRF Protection Measures**

| CSRF Measure | Implementation Location | Description |
| --- | --- | --- |
| CSRF initialization | `backend/app/__init__.py` | Initializes CSRF protection in the Flask application factory |
| CSRF token endpoint | `authentication_controller.py` | Provides token used by frontend API client |
| CSRF error handling | `backend/app/__init__.py` | Converts CSRF failures into structured JSON responses |
| Mutating request handling | `frontend/lib/api/client.ts` | Obtains and attaches CSRF token for state-changing requests |
| Credential inclusion | `frontend/lib/api/client.ts` | Sends browser credentials with API requests so sessions can be resolved |

```text
PROCEDURE Send CSRF-Protected Request
  FRONTEND determines request method
  IF method changes server state THEN
    REQUEST CSRF token from backend
    ATTACH token to CSRF request header
    ATTACH JSON content-type header
  ENDIF
  INCLUDE browser credentials
  SEND request through frontend API path
  BACKEND validates CSRF token before protected mutation continues
  IF token is invalid THEN
    RETURN structured CSRF error
  ENDIF
ENDPROCEDURE
```

## 6.8.5 Role-Based Access Control

The system implements three roles: User, Moderator, and Admin. These roles are ranked so that higher roles can access more privileged functions. Normal users can access research workflows such as dashboard, profile, blueprints, experiments, jobs, models, favorites, public hub, and documentation. Moderators can access staff moderation and limited user-management actions. Administrators can access full user-management, system-management, queue, settings, and event functions.

Role-based access is enforced in both frontend and backend layers. Frontend route guards improve usability by redirecting unauthenticated users and blocking insufficient-role pages. Backend access-control checks remain authoritative and must pass before protected API operations execute.

The backend access-control service normalizes role values, assigns role ranks, resolves authenticated context from sessions, checks whether users are staff or administrators, and verifies whether a user can manage another user. This centralizes security decisions so that controllers do not duplicate role-ranking logic.

**Table 6.57: Role-Based Access Matrix**

| Role | Access Scope |
| --- | --- |
| User | Dashboard, profile, experiment workflows, blueprint workflows, jobs, models, favorites, public hub, and documentation |
| Moderator | User-level access plus blueprint moderation and limited user-management operations |
| Admin | Moderator-level access plus full user-management, system management, queue visibility, settings, and system event access |

```text
PROCEDURE Enforce Backend Role Requirement
  RESOLVE authenticated context from session cookie
  IF context is missing THEN
    RETURN unauthenticated response
  ENDIF
  NORMALIZE actor role
  COMPARE actor role rank against required role rank
  IF actor role rank is lower than required role rank THEN
    RETURN forbidden response
  ENDIF
  EXECUTE protected operation
ENDPROCEDURE
```

```text
PROCEDURE Enforce Frontend Route Guard
  READ authenticated user from authentication provider
  IF authentication state is loading THEN
    RENDER no protected content yet
  ENDIF
  IF user is not authenticated THEN
    REDIRECT to login page
  ENDIF
  IF route requires a minimum role AND user role is insufficient THEN
    REDIRECT to safe fallback page
  ENDIF
  RENDER protected page content
ENDPROCEDURE
```

> Note: Add one screenshot of an administrator-only page and one screenshot or explanation showing that a normal user cannot access the same page.

## 6.8.6 Data Access and Database Safety

Database access is performed through SQLAlchemy ORM mappings, repositories, and a unit-of-work transaction boundary. Controllers do not directly build raw database queries from user input. Instead, they call repositories and services that use controlled database access patterns.

The repository pattern supports data access safety by separating HTTP request handling from persistence operations. The unit-of-work pattern supports consistency by committing successful operations and rolling back failed operations. This is important for workflows such as experiment creation, where experiment records, model placeholders, and queue identifiers must remain consistent.

Database constraints also support security and integrity. Unique username and email constraints prevent duplicate account identities. Foreign-key relationships preserve ownership and artifact traceability. Experiment split constraints and model parameter-hash uniqueness protect the correctness of stored experiment records.

**Table 6.58: Data Access Safety Measures**

| Measure | Implementation Area | Security or Integrity Purpose |
| --- | --- | --- |
| ORM mappings | `backend/app/infrastructure/database/orm/` | Maps database tables through structured model classes |
| Repository layer | `backend/app/repositories/` | Encapsulates persistence operations away from controllers |
| Unit of work | `backend/app/repositories/unit_of_work.py` | Provides transaction commit and rollback behavior |
| Database constraints | ORM mappings and schema | Protects uniqueness, relationships, split validity, and duplicate model prevention |
| Access checks before queries | Controllers and access-control service | Prevents users from retrieving or modifying unauthorized records |

```text
PROCEDURE Execute Secure Persistence Operation
  AUTHENTICATE current user
  AUTHORIZE operation against target record or required role
  VALIDATE request payload
  OPEN unit of work
    CALL repository methods using validated identifiers and values
    SAVE or UPDATE allowed records
    COMMIT transaction if no error occurs
  IF an error occurs THEN
    ROLLBACK transaction
    RETURN structured error response
  ENDIF
ENDPROCEDURE
```

## 6.8.7 HTTPS and Deployment Security Readiness

The current implementation is configured for local development and assessment demonstration. HTTPS termination is not shown as a local runtime service. In a production-oriented deployment, HTTPS should be enabled through a hosting platform or reverse proxy so that browser traffic, session cookies, and API requests are protected in transit.

The backend includes configuration values that support deployment hardening. Secure-cookie behavior can be enabled through `.env`, same-site cookie behavior can be configured, and allowed frontend origins can be restricted. The production configuration enables secure cookie behavior. These values should be combined with HTTPS, secret management, restricted network access, and process supervision.

Production-oriented deployment should also ensure that PostgreSQL and Redis are not publicly exposed. The frontend and backend API may be reachable from the browser, but database and queue services should remain private infrastructure services. Worker processes should run privately and consume queue jobs rather than expose public endpoints.

**Table 6.59: Deployment Security Readiness**

| Security Area | Local Demonstration | Production-Oriented Requirement |
| --- | --- | --- |
| Transport security | Local HTTP for development | HTTPS termination through hosting or reverse proxy |
| Session cookie secure flag | Configurable through `.env` | Enable secure-cookie behavior |
| Allowed origins | Configured for local frontend origins | Restrict to approved production frontend origin |
| Secrets | Local `.env` configuration | Secure secret management outside source code |
| Database access | Local PostgreSQL service | Private managed or secured database service |
| Queue access | Local Redis service | Private managed or secured queue service |
| Worker process | Local background process | Supervised private worker service |

> Note: If the system is submitted as a local deployment, state that HTTPS is a production deployment requirement rather than claiming it is enabled locally.

## 6.8.8 Error Handling and Safe Responses

The backend uses standardized JSON response helpers for successful responses, general errors, and validation errors. This makes frontend behavior predictable and prevents raw framework error pages from being used as the normal API response format. Controllers return status codes and machine-readable error codes so frontend views can display appropriate feedback.

Validation errors are returned with field-level details. Authentication errors return an unauthenticated response. Authorization errors return a forbidden response. CSRF errors are caught by the Flask application factory and returned as structured JSON. Queue and worker errors are also handled so that experiments can be marked failed or cancelled instead of silently disappearing.

This approach supports security because error responses are controlled and consistent. It also improves usability because users receive understandable messages when they submit invalid data, lose authentication, attempt restricted actions, or encounter queue-related failures.

**Table 6.60: Error Handling Measures**

| Error Type | Example Cause | Handling Approach |
| --- | --- | --- |
| Validation error | Invalid experiment split, missing blueprint field, malformed payload | Return structured validation response with field errors |
| Authentication error | Missing or expired session | Return unauthenticated JSON response |
| Authorization error | User role is insufficient | Return forbidden JSON response |
| CSRF error | Missing or invalid CSRF token on mutating request | Return structured CSRF failure response |
| Not found error | Missing blueprint, experiment, model, or user | Return not-found JSON response |
| Queue error | Redis-backed queue unavailable | Return service-unavailable style response |
| Worker error | Experiment execution exception | Mark experiment failed and preserve diagnostic stage message |

```text
PROCEDURE Return Safe API Error
  DETECT error category
  SELECT appropriate HTTP status code
  BUILD JSON payload with ok false
  INCLUDE machine-readable error code when available
  INCLUDE human-readable message suitable for frontend display
  RETURN JSON response to frontend
ENDPROCEDURE
```

## 6.8.9 Logging and Traceability

The system records operational events for traceability. The Flask application factory records route activity after API requests, while important actions such as registration and login can also create system events. These events are stored through the backend event repository and displayed through administrator-facing system views.

Experiment-specific execution information is stored separately as experiment logs. The worker and executor persist model metrics, backtest metrics, confusion-style metrics, and round-level logs. These logs are not only diagnostic records; they also support research review and artifact downloads after an experiment completes.

Worker error handling improves traceability for asynchronous processing. If an experiment job fails, the worker marks the experiment as failed and records the failure stage. If an experiment is cancelled, the worker returns cancellation information. This prevents long-running jobs from failing silently.

**Table 6.61: Logging and Traceability Controls**

| Log / Event Type | Implementation Purpose |
| --- | --- |
| System events | Records route activity and important operational actions for administrator review |
| Authentication events | Records registration and login activity for traceability |
| API status events | Records API method, path, and response status where applicable |
| Worker progress | Updates experiment progress and current stage during execution |
| Worker failure state | Marks failed experiments with diagnostic stage information |
| Experiment logs | Stores model-level metrics and execution artifacts for result inspection |
| System event download | Allows administrative export of system events for review |

```text
PROCEDURE Record API System Event
  AFTER API request completes
  IF request path is an API path THEN
    RESOLVE actor from session when available
    BUILD event containing scope, action, actor, target, and message
    STORE event through system event repository
  ENDIF
ENDPROCEDURE
```

```text
PROCEDURE Handle Worker Execution Failure
  TRY to execute queued experiment
  IF execution raises error THEN
    OPEN unit of work
      MARK experiment as Failed
      STORE current stage containing shortened diagnostic message
      SET completion timestamp
    CLOSE unit of work
    LOG worker failure for developer/operator review
    RAISE error to queue infrastructure
  ENDIF
ENDPROCEDURE
```

## 6.8.10 Security Evidence to Include

The final report should include evidence that demonstrates implemented security controls without exposing private information. Screenshots should use demonstration accounts and sanitized values.

Recommended evidence:

- Screenshot of registration or login validation feedback.
- Screenshot showing a normal user being redirected or blocked from an administrator-only page.
- Screenshot of an administrator-only system-management page.
- Screenshot of a CSRF-protected API request in browser developer tools, with cookie values hidden.
- Screenshot of a structured backend validation error displayed in a frontend form.
- Screenshot of system event records using non-sensitive demonstration data.

> Note: Do not show real credentials, session cookie values, secret keys, private database connection strings, credential hashes, or private user information in screenshots.

## 6.8.11 Summary

The implemented security measures protect the system at multiple levels. Backend validation prevents invalid or unauthorized data from being persisted or queued. Credential hashing protects stored account credentials. Server-managed sessions and CSRF tokens protect authenticated browser workflows. Role-based access control limits staff and administrative functions to suitable users. Repository and unit-of-work patterns provide safer database access and transaction control.

Error handling and logging further support reliability and traceability. Standard JSON responses allow frontend views to display predictable error messages, while system events and experiment logs provide visibility into application activity and execution results. Although the current deployment target is local demonstration, the implementation includes configuration points for production-oriented hardening such as secure cookies, restricted origins, HTTPS deployment, and private infrastructure services.
