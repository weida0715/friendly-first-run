# 6.8 Security Measures

Security measures in BEE are implemented through backend validation, password hashing, server-side sessions, CSRF protection, role-based access control, ownership checks, structured error responses, and safe frontend route guards. Since the system contains user accounts, experiment records, model records, and administrative operations, security is required at both the frontend and backend layers.

## 6.8.1 Input validation, encryption, and HTTPS configuration

### Input validation

| Area | Validation implemented | Source-code evidence |
|---|---|---|
| Authentication | Required registration/login fields, duplicate user checks, enabled account checks | `backend/app/controllers/authentication_controller.py` |
| Blueprint creation/update | Required metadata, architecture, indicators, parameter constraints | `backend/app/validators/blueprint_validator.py`, `backend/app/controllers/blueprint_controller.py` |
| Experiment creation | Required name, BTCUSDT/interval constraints, date ordering, split totals, minimum validation/test thresholds, blueprint access, parameter override structure | `backend/app/validators/experiment_validator.py`, `backend/app/controllers/experiment_controller.py` |
| Market data | BTCUSDT endpoint input validation, start/end ranges, interval metadata, target preview validation | `backend/app/controllers/market_data_controller.py`, `backend/app/services/market_data_service.py` |
| System/admin actions | Role checks and allowed setting/action validation | `backend/app/controllers/system_controller.py`, `backend/app/services/system_settings_service.py` |
| Frontend forms | Client-side required fields and wizard-step blocking | `frontend/views/LoginView.tsx`, `frontend/views/RegistrationView.tsx`, `frontend/views/BlueprintWizardView.tsx`, `frontend/views/ExperimentWizardView.tsx` |

### Password hashing and sensitive data

Passwords are not stored as plain text. Password logic is isolated in `backend/app/services/password_service.py`, while user registration and login call that service from `backend/app/controllers/authentication_controller.py`. The report should include a code screenshot of the password service and the registration/login sections, but it should not show any real passwords, secrets, or `.env` values.

### CSRF and session protection

Browser-based unsafe requests use CSRF protection. The frontend test `frontend/tests/api-client-csrf.test.ts` verifies that unsafe API requests attach the CSRF token. The backend exposes CSRF token retrieval in `backend/app/controllers/authentication_controller.py` and configures CSRF handling in `backend/app/__init__.py`.

Pseudocode:

```text
Unsafe frontend request
  -> API client requests or reuses CSRF token
  -> client sends credentials and X-CSRFToken header
  -> backend validates CSRF and session cookie
  -> controller performs access and validation checks
```

### HTTPS configuration

The local implementation is designed for localhost development. In a live deployment, HTTPS should be terminated by the hosting platform, reverse proxy, or load balancer. The code already centralizes CORS/session configuration through `backend/app/config.py`, which makes production hardening easier. The final report should state that HTTPS is a deployment requirement rather than a business-rule module implemented in application code.

## 6.8.2 Role-based access control (RBAC)

RBAC is enforced by backend access-control services and frontend route guards. Frontend guards improve user experience by hiding or redirecting unauthorized pages, but backend checks are the authoritative security boundary.

| Protected function | Backend enforcement | Frontend enforcement |
|---|---|---|
| Authenticated pages | Controllers load user/session context | `RequireAuth` wraps private route pages |
| Staff pages | `backend/app/controllers/_access.py`, `backend/app/services/access_control_service.py` | `RequireRole` wraps `/admin/users` and `/system` pages |
| User management | `backend/app/controllers/user_controller.py` | `frontend/views/UserManagementView.tsx` |
| System management | `backend/app/controllers/system_controller.py` | `frontend/views/SystemManagementView.tsx` |
| Blueprint moderation | `backend/app/controllers/blueprint_approval_controller.py` | `frontend/views/BlueprintModerationView.tsx` |
| Experiment ownership | `backend/app/controllers/experiment_controller.py` | Experiment views only show user-accessible records |
| Job ownership | `backend/app/controllers/job_controller.py` | Job views use backend-authorized detail data |
| Model/blueprint favourites | Model and blueprint controllers validate accessible resources | Detail views render favourite buttons based on API state |

RBAC pseudocode:

```text
Request requires staff role
  -> load current session
  -> if no session, return 401
  -> load user from repository
  -> if user role is below required role, return 403
  -> otherwise execute controller action
```

## 6.8.3 Error handling and logging

Error handling is implemented through consistent JSON responses and event logging. `backend/app/responses.py` standardizes response shapes. `backend/app/__init__.py` contains application-level request handling and error behavior. System-level event records are exposed through `backend/app/controllers/system_controller.py` and persisted through `backend/app/repositories/system_event_repository.py`.

| Error / logging area | Evidence path | Description |
|---|---|---|
| Standard success/error responses | `backend/app/responses.py` | Normalized `ok`, `error`, and validation payloads |
| API exception handling | `backend/app/__init__.py` | Handles API errors and response headers |
| Validation errors | Validators and controllers | Returns structured field-level errors |
| System events | `backend/app/controllers/system_controller.py`, `backend/app/repositories/system_event_repository.py` | Admin-visible event trail and downloadable system events |
| User audit | `backend/app/controllers/user_controller.py` | Staff action audit views for user management |
| Experiment execution logs | `backend/app/repositories/experiment_log_repository.py`, `backend/app/controllers/logs_download_controller.py` | Stores and downloads experiment result evidence |

## Recommended screenshots and code snippets

| Evidence item | File/page | What to show |
|---|---|---|
| Password hashing | `backend/app/services/password_service.py` | Hash/verify functions without secrets |
| CSRF handling | `backend/app/__init__.py`, `frontend/tests/api-client-csrf.test.ts` | CSRF configuration and frontend token inclusion test |
| Backend RBAC | `backend/app/services/access_control_service.py`, `backend/app/controllers/_access.py` | Role comparison and staff guard |
| Frontend RBAC | `frontend/components/auth/RequireRole.tsx` | Route-level guard |
| Validation errors | `/experiments/new` and `/blueprints/new` | Inline validation messages |
| Admin system events | `/system` | Event table or download control |
| User audit | `/admin/users` | User audit details if visible |

## Summary

The security implementation combines preventive and detective controls. Preventive controls include password hashing, CSRF protection, session validation, RBAC, ownership checks, and strict validators. Detective controls include system events, user audit information, and experiment logs. This is appropriate for BEE because the system manages multiple user roles and stores reproducible experiment results that should not be modified or accessed by unauthorized users.
