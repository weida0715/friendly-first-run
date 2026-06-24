# Backend Implementation

## Flask API Structure

The backend is a Flask application created by `create_app` in `backend/app/__init__.py`. The factory loads configuration, initializes CSRF protection, handles CORS preflight requests, records API activity events, registers routes, warns about unsafe local session settings, and creates database metadata.

Pseudocode:

```text
Procedure CreateBackendApplication
  Create Flask app.
  Load environment-specific config.
  Configure Flask session cookie name.
  Initialize CSRF protection.
  Register CSRF error handler.
  Configure API CORS handling.
  Register system event tracing hooks.
  Register all route blueprints.
  Initialize database metadata.
  Return app.
End Procedure
```

## Configuration and Database Session Setup

Configuration lives in `backend/app/config.py`. It reads values such as `FLASK_ENV`, `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`, queue name, Binance base URL, session timeout, session cookie names, cookie security, session backend, and CORS origins.

Database setup lives in `backend/app/infrastructure/database/session.py`. `resolve_database_url` requires a PostgreSQL URL and rejects non-PostgreSQL schemes. `get_engine` lazily initializes one process-global SQLAlchemy engine and binds `SessionLocal` to it.

## Authentication and Session Management

Authentication routes live in `backend/app/controllers/authentication_controller.py`. Registration validates user input, checks username and email uniqueness, hashes the password, creates a user, and returns the created account summary. Login validates credentials, verifies the password hash, checks account status, creates a server-side session, and sets an HTTP-only cookie.

Pseudocode:

```text
Procedure Login
  Validate email and password input.
  Load user by email.
  If no user or password verification fails:
    Return invalid credentials.
  If user is not enabled:
    Return account disabled.
  Create a server-side session record.
  Set session cookie using configured name, timeout, SameSite, Secure, and HttpOnly options.
  Return current user summary.
End Procedure
```

`SessionService` stores sessions in Redis when configured, otherwise in an in-memory store for local development and testing.

## Access Control and Role-Based Authorization

`AccessControlService` resolves the authenticated context from the session cookie. It loads the user from the database and rejects missing, expired, disabled, or deleted users.

Roles are ranked as `User`, `Moderator`, and `Admin`. Staff checks require at least moderator rank. Admin checks require admin rank. User-management checks also prevent moderators from managing elevated users or assigning elevated roles.

## User Controller and Staff User Management

`user_controller.py` exposes current profile, profile lookup, audit summary, user listing, user creation, status update, password reset, role update, username update, and deletion routes.

Pseudocode:

```text
Procedure ListUsers
  Resolve authenticated actor.
  Require staff role.
  Read search, role, status, page, and pageSize query parameters.
  Validate pagination.
  Count matching users.
  Load one page of users.
  Return serialized users and pagination metadata.
End Procedure
```

Staff actions are guarded by role checks before repository mutation.

## Blueprint Validation and Draft Persistence

Blueprint creation uses `BlueprintValidator`, `BlueprintFactory`, metadata factories, and `BlueprintRepository`.

Pseudocode:

```text
Procedure CreateDraftBlueprint
  Parse JSON payload.
  Require authenticated actor.
  Validate metadata, architecture, indicators, scalers, and parameter ranges.
  Normalize the blueprint payload.
  Build a Blueprint domain object with Draft approval state and version 1.
  Persist it through UnitOfWork and BlueprintRepository.
  Return the created blueprint id and detail path.
End Procedure
```

## Blueprint Detail, Library, and Favorite Workflow

Blueprint detail allows access when the viewer is the owner, staff, or the blueprint is approved. The response includes metadata, indicators, architecture, approval state, version, lineage, owner summary, and viewer flags.

The library controller lists owned and favorited blueprints for the authenticated user. Favorite and unfavorite routes require authentication and visible blueprint access.

## Blueprint Versioning Service

`VersioningService` protects reviewed or submitted blueprints from destructive edits.

Pseudocode:

```text
Procedure SaveBlueprintEdit
  Confirm the actor owns the blueprint.
  Read updated metadata, indicators, features, and architecture.
  If the blueprint is still an unsubmitted Draft:
    Update the existing row.
  Otherwise:
    Create a new Draft copy.
    Increment version.
    Set parent to the previous blueprint.
  Return the saved blueprint.
End Procedure
```

## Blueprint Approval and Moderation

Blueprint owners can request approval only for draft blueprints. The request changes approval state to `Pending` and records the submission timestamp.

Staff users can load the moderation queue and transition pending blueprints to `Approved` or `Rejected`. Approved blueprints can later be moved to `Disapproved`.

Pseudocode:

```text
Procedure ModerateBlueprint
  Resolve authenticated actor.
  Require staff role.
  Load target blueprint.
  Confirm the requested state transition is valid.
  Update approval state and timestamp.
  Return the updated approval state.
End Procedure
```

## Experiment Blueprint Option Endpoint

The experiment controller exposes approved blueprint options for experiment creation. Options are filtered and summarized so the frontend wizard can select a usable blueprint without exposing the full mutation surface.

Pseudocode:

```text
Procedure ListExperimentBlueprintOptions
  Require authenticated actor.
  Read paging and search parameters.
  Load approved blueprints visible to the actor.
  Convert each blueprint into option metadata.
  Return option items and paging metadata.
End Procedure
```

## Domain Models and Value Objects

Domain models under `backend/app/domain/models` represent durable concepts such as users, blueprints, experiments, models, favorite records, market candles, logs, and system events.

Value objects under `backend/app/domain/value_objects` represent non-table concepts used during execution, validation, queueing, cancellation, splitting, training, and evaluation. Examples include validation results, experiment configs, job specifications, queue positions, trained models, split results, and execution results.

## Repository and Unit of Work Usage

Controllers do not open raw database connections. They use `UnitOfWork`, which creates repositories for users, blueprints, experiments, models, logs, favorites, market data, system events, and settings.

Pseudocode:

```text
Procedure ControllerWithPersistence
  Open UnitOfWork.
  Use repositories attached to the unit of work.
  If the operation succeeds:
    Let UnitOfWork commit.
  If the operation fails:
    Let UnitOfWork roll back.
  Return JSON response.
End Procedure
```

## Security Implementation

Security is implemented at several layers:

- Input validation before persistence.
- Password hashing before storing credentials.
- Server-managed sessions instead of exposing user identity in client state.
- HTTP-only session cookies.
- Role-based authorization in backend services and controllers.
- CSRF protection for mutating API requests.
- CORS allow-listing for API origins.

## Authentication Security

Passwords are hashed with Werkzeug through `hash_password`. Login verifies the plaintext password against the stored hash with `verify_password`. Raw passwords are not persisted.

Registration and login validate required fields and reject malformed input. Login returns a generic invalid-credentials response when the email or password is wrong.

## Authorization Security

Authorization is enforced in backend controllers, not only in the frontend. `AccessControlService` checks authenticated identity, role rank, staff status, admin status, ownership, profile access, user-management permission, and role-assignment permission.

This means hidden UI controls are convenience only; backend endpoints still reject unauthorized requests.

## CSRF Protection

Flask-WTF provides CSRF protection. The backend exposes a CSRF token endpoint. The frontend API client fetches a token before `POST`, `PUT`, `PATCH`, and `DELETE` requests and sends it as `X-CSRFToken`.

Pseudocode:

```text
Procedure ProtectedMutation
  Frontend asks backend for CSRF token.
  Frontend sends mutating request with session cookie and CSRF header.
  Flask-WTF validates token.
  If token is missing or invalid:
    Return CSRF error.
  Otherwise:
    Continue to controller logic.
End Procedure
```

## Session Protection

Sessions are server-side records identified by an unpredictable token from `secrets.token_urlsafe`. The cookie stores only the session id. The backend resolves that id to a session record and then loads the current user from the database.

The session cookie is HTTP-only, uses configured SameSite behavior, and uses the Secure flag in production. Session timeout is configurable. Redis-backed sessions are used when `SESSION_BACKEND=redis`; in-memory sessions are limited to local or test use.
