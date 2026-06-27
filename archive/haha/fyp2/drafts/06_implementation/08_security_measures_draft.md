# 6.8 Security Measures

## Section Purpose

This section explains the security measures implemented in the system. It should connect directly to the non-functional security requirements and show how security is enforced through backend validation, credential hashing, server-managed sessions, CSRF protection, role-based access control, error handling, and logging.

## 6.8.1 Input Validation, Encryption, and HTTPS Configuration

### Recommended Structure

Use three paragraphs and one table.

Paragraph 1 should explain input validation. Mention frontend validation for faster feedback and backend validation as the final enforcement point. Backend validators check account fields, blueprint payloads, experiment configuration, split percentages, date ranges, BTCUSDT scope, parameter override structure, and blueprint accessibility.

Paragraph 2 should explain credential protection and session configuration. Credentials are stored using one-way hashing, and sessions are server-managed. Session timeout is configurable through `.env` and system settings.

Paragraph 3 should explain HTTPS. The current implementation is configured for local development, so HTTPS termination is not shown as a local server feature. For production deployment, HTTPS should be enabled at the reverse proxy or hosting layer, and secure cookie options should be enabled through environment configuration.

| Security Area | Implementation Evidence |
| --- | --- |
| Account validation | Registration and login validators in frontend and backend |
| Credential storage | Backend credential hashing service |
| CSRF protection | Flask-WTF CSRF setup and frontend token handling |
| Session lifetime | Configurable session timeout setting |
| Experiment validation | Backend experiment validator before persistence and queueing |
| Blueprint validation | Backend blueprint validator before draft persistence or approval request |
| Database query safety | SQLAlchemy ORM and repository pattern |
| HTTPS readiness | Secure cookie and deployment configuration values available through `.env` |

> Note: Include a screenshot of a validation error on the frontend, such as invalid login or invalid experiment split. This demonstrates security and usability together.

## 6.8.2 Role-Based Access Control (RBAC)

### Recommended Structure

Use two paragraphs and one role matrix.

Paragraph 1 should explain the three roles: User, Moderator, and Admin. Explain that role checks are enforced at both frontend navigation/guard level and backend endpoint level.

Paragraph 2 should explain that frontend route guards improve usability but backend checks remain authoritative. This is important because hidden navigation alone is not secure.

| Role | Access Scope |
| --- | --- |
| User | Dashboard, profile, experiments, blueprints, jobs, models, favorites, public hub, documentation |
| Moderator | User access plus moderation and limited user-management operations |
| Admin | Full user-management, system-management, queue, settings, and administrative operations |

### Pseudocode

```text
PROCEDURE Enforce Role Requirement
  RESOLVE current actor from session
  IF actor is not authenticated THEN
    RETURN unauthenticated response
  ENDIF
  IF actor role is lower than required role THEN
    RETURN forbidden response
  ENDIF
  EXECUTE protected operation
ENDPROCEDURE
```

> Note: Add one screenshot showing an admin-only page and another screenshot or explanation showing that a normal user cannot access it.

## 6.8.3 Error Handling and Logging

### Recommended Structure

Use three paragraphs and one table.

Paragraph 1 should explain standardized JSON responses. The backend returns consistent success, error, and validation error shapes so that frontend views can display errors predictably.

Paragraph 2 should explain system event logging. API requests and important system operations are recorded as events for traceability, allowing administrators to review operational activity.

Paragraph 3 should explain worker and job error handling. Failed experiment execution records failure state and diagnostic information so that users can understand whether a job completed, failed, or was cancelled.

| Error / Log Type | Implementation Purpose |
| --- | --- |
| Validation errors | Show user-correctable form and payload problems |
| Authentication errors | Reject invalid sessions or credentials |
| Authorization errors | Block users below required role |
| CSRF errors | Reject unsafe state-changing requests |
| Worker errors | Mark experiment/job failure and preserve diagnostic message |
| System events | Record route activity and administrative trace data |
| Experiment logs | Store experiment-specific metrics and artifacts |

## Draft Content to Use in the Report

The implementation includes several security controls at both frontend and backend levels. Frontend validation is used to provide immediate feedback to users, while backend validation remains the authoritative enforcement point before any data is persisted or processed. This is especially important for experiment creation because invalid date ranges, split percentages, inaccessible blueprints, or malformed parameter overrides could otherwise compromise experiment correctness.

Credential storage is protected using one-way hashing. The system does not rely on plain credential comparison during login; instead, the backend verifies submitted credentials against the stored hash. Authenticated identity is maintained through server-managed sessions, and session lifetime is controlled by configuration. State-changing requests are protected using CSRF tokens so that browser-originated mutations require a valid token.

Role-based access control is implemented through both frontend guards and backend checks. The frontend hides or redirects routes that are not suitable for the current user role, while the backend enforces the actual authorization decision for protected endpoints. This ensures that staff and administrative functions cannot be accessed merely by manually calling a protected route.

The backend also standardizes errors and records system activity. Validation errors, authentication failures, authorization failures, CSRF failures, worker failures, and system events are handled in predictable ways. This improves reliability during development and gives administrators clearer evidence when diagnosing operational problems.
