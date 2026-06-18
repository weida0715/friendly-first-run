# Changelog

All notable changes to the Bitcoin Experimental Engine (BEE) project will be documented in this file.

The project follows semantic versioning: `MAJOR.MINOR.PATCH`.

## [0.1.0] - 2nd May 2026

- Created the root monorepo structure with `frontend/` and `backend/` workspaces.
- Initialized the Next.js 15 frontend skeleton with Tailwind CSS, shadcn-style configuration, route pages, layout components, and Boundary View placeholders.
- Added frontend dependency management through `package.json`, `package-lock.json`, and `.nvmrc`.
- Initialized the Flask backend with an app factory, environment-aware config loader, route registry, normalized JSON response helpers, WSGI entrypoint, and health-check endpoint.
- Added backend controller, service, repository, and domain entity placeholders aligned with the FYP1 Chapter 5 design model.
- Added backend validator, strategy, and executor placeholder modules for architecture parity with RFC-001 tree.
- Added backend dependency management through `requirements.txt`, `requirements-dev.txt`, `pyproject.toml`, and `.python-version`.
- Added root environment documentation through `.env.example` and generated artifact protection through `.gitignore`.
- Added root `README.md` and frontend auth helper placeholder (`frontend/lib/auth/current-user.ts`).
- Updated backend health endpoint to include application `version` from root `VERSION` file.
- Added browser-friendly backend status page at `/` while preserving JSON health at `/api/health`.
- Added frontend API client (`lib/api/client.ts`) and endpoint config (`lib/api/endpoints.ts`) for backend health checks.
- Added frontend dashboard health status component and rendering integration.
- Switched frontend health integration to same-origin proxy path (`/api/backend`) via Next.js rewrites.
- Fixed Tailwind config ESM compatibility by replacing CommonJS `require(...)` plugin usage with ESM import.
- Verified Flask app startup (`create_app`) and backend module compilation.
- Verified dependency/version/environment files exist and are aligned with RFC-001 requirements.
- Verified `GET /api/health` returns HTTP 200 with required fields: `ok`, `service`, `version`, `environment`, `status`.
- Verified frontend typecheck passes and rewrite-based health route (`/api/backend/health`) returns HTTP 200.
- Verified architecture boundary rule: feature modules do not import `app.infrastructure` directly at this stage.

## [0.1.1] - 3rd May 2026

- Remove the archive/ folder from project repository and stop tracking it.

## [0.2.0] - 3rd May 2026

- Implement RFC-002 strict ERD-aligned persistence foundation using only Chapter 4 3NF-approved entities and tables.
- Add strict domain entities for `User`, `Blueprint`, `Experiment`, `Model`, `ExperimentLog`, `FavoriteModel`, `FavoriteBlueprint`, and `BTCUSDTKline`.
- Add non-persistent immutable value objects: `ValidationResult`, `CancellationResult`, `JobSpecification`, `QueuePosition`, `ExperimentConfig`, `SplitResult`, `ExecutionResult`, `TrainedModel`, and `EvaluationResult`.
- Add SQLAlchemy ORM mappings and strict migration for exact PascalCase table/column names, ERD enums, PK/FK/composite keys, unique constraints, and check constraints.
- Add ERD-scoped repositories: `UserRepository`, `BlueprintRepository`, `ExperimentRepository`, `ModelRepository`, `ExperimentLogRepository`, `FavoriteModelRepository`, `FavoriteBlueprintRepository`, and `MarketDataRepository`.
- Add context-managed `UnitOfWork` transaction boundary with commit/rollback/close lifecycle behavior.
- Add repository mapping compatibility for enum-backed fields returned as either Enum objects or plain strings.
- Implement BTCUSDT kline timestamp upsert behavior in `MarketDataRepository` and add repository tests for duplicate timestamp overwrite semantics and date-range retrieval.
- Add comprehensive test suites:
  - `backend/tests/domain/` for ERD entity invariants and value objects.
  - `backend/tests/database/` for strict schema table/column naming, constraints, and enum verification.
  - `backend/tests/repositories/` for CRUD/relationship traversal, UnitOfWork rollback behavior, and market-data upsert behavior.
- Remove out-of-scope `MetricsRepository` artifact to preserve strict RFC-002 ERD repository scope.

## [0.2.1] - 3rd May 2026

- Move runtime configuration to PostgreSQL-first mode:
  - remove SQLite runtime fallback,
  - require `DATABASE_URL` with PostgreSQL scheme,
  - fail fast with explicit configuration errors.
- Update `.env.example` and `README.md` for PostgreSQL-first setup, migration commands, test prerequisites, and troubleshooting guidance.
- Restore UnitOfWork test compatibility by keeping `SessionLocal` monkeypatch surface available in repository-level tests.

## [0.3.0] - 3rd May 2026

- Implement RFC-003 Authentication, Sessions, RBAC, and User Management.
- Add authentication controller flows:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- Add registration and login frontend views with client-side validation and API integration.
- Add password hashing/verification service integration for persisted credentials.
- Add server-managed session lifecycle with cookie-based session resolution and destruction.
- Add frontend `AuthProvider` and protected-route guards (`RequireAuth`, `RequireRole`) across authenticated/staff routes.
- Add `AccessControlService` role/ownership hierarchy checks:
  - authentication context resolution
  - staff/moderator/admin checks
  - manage-user and assign-role rules
- Add `UserController` staff/user-management APIs:
  - user listing with filters and pagination
  - current user profile + profile access checks
  - staff create user
  - enable/disable account
  - reset password
  - admin role update
  - admin delete
- Add user-management UI with role/status badges and role-constrained actions.
- Add backend auth/RBAC tests:
  - `backend/tests/test_authentication_controller.py`
  - `backend/tests/test_access_control_service.py`
  - `backend/tests/test_user_controller.py`
- Add frontend auth/RBAC tests with Jest + React Testing Library:
  - `frontend/tests/registration-view.test.tsx`
  - `frontend/tests/login-view.test.tsx`
  - `frontend/tests/auth-guards.test.tsx`
  - `frontend/tests/user-management-view.test.tsx`
- Add frontend Jest test configuration:
  - `frontend/jest.config.cjs`
  - `frontend/jest.setup.ts`
  - `frontend/package.json` test script/dependencies
- Align Alembic docs and workflow to single baseline revision behavior and `DATABASE_URL`-driven migration targeting.

## [0.4.0] - 3rd May 2026

- Deliver RFC-004 prototype-matching frontend implementation.
- Implement shared app shell and layout system:
  - `AppShell`, `TopBar`, `SidebarNav`, `Breadcrumbs`, `PageShell`, `PageHeader`
  - consistent responsive structure across dashboard, module, and admin views.
- Implement role-aware navigation model and visibility rules through `lib/routes/nav.ts`.
- Implement reusable boundary-layer view foundations:
  - `BaseView` with shared header/loading/error/fallback states
  - `WizardView` with reusable step chips, current-step context, summary slot, and footer slot.
- Implement reusable UI/state/form/table/status components used across modules:
  - form rows, error text, number/date/select inputs
  - table helpers and empty rows
  - loading/empty/error states
  - confirmation dialog card
  - status badges and user role/status wrappers.
- Implement prototype-aligned dashboard and module landing/admin placeholder pages:
  - dashboard cards + quick actions
  - experiments/blueprints/models/public hub/docs views
  - admin users/system/moderation/jobs placeholder pages.
- Add and align prototype parity UI tests (route rendering, navigation, base/states, wizard/dialog, status badges, auth guards).
- Remove duplicate overlapping legacy frontend test files and keep consolidated RFC-004 test suites as single source of truth.
- Validate frontend suite after consolidation:
  - `12 passed, 12 total` test suites
  - `36 passed, 36 total` tests.

## [0.5.0] - 3rd May 2026

- Deliver RFC-005 Blueprint workflow, versioning, library, favorites, and moderation foundation.
- Implement blueprint wizard creation flow with staged step layout (`Basics`, `Reference Architecture`, `Indicators`, `Review`) and create submission path.
- Add frontend-to-backend blueprint draft persistence integration:
  - `createBlueprint(...)` API client contract and payload typing.
  - Wizard create action now posts to backend instead of placeholder local redirect.
  - Submission UX includes loading state, duplicate-submit protection, and backend validation error surfacing.
- Implement/extend backend blueprint validation and draft persistence behavior through:
  - `BlueprintValidator`
  - `POST /api/blueprints/`
- Implement blueprint library and detail API/UI behavior:
  - owned and favorited library tab data flow
  - detail metadata/indicator/architecture/status/version/lineage rendering
  - owner/viewer visibility data and approval-state display
- Implement favorite/unfavorite workflow end-to-end:
  - `POST /api/blueprints/<id>/favorite`
  - `DELETE /api/blueprints/<id>/favorite`
- Implement immutable versioning behavior via `VersioningService` and edit flow integration:
  - in-place edit for never-submitted drafts
  - versioned draft copy for previously reviewed/submitted artifacts
- Implement approval/moderation workflow foundation:
  - owner request-approval transition to `Pending`
  - staff approve/reject/disapprove controls and controller endpoints
  - disapproved state schema support via migration `20260503_0002_rfc005_add_disapproved_approval_state.py`
  - approved blueprint options integration for experiment wizard selection path
- Add/extend blueprint-focused backend tests:
  - `test_blueprint_validator.py`
  - `test_blueprint_controller.py`
  - `test_blueprints_library_controller.py`
  - `test_blueprint_approval_controller.py`
  - `test_versioning_service.py`
  - `test_experiment_controller.py` (approved blueprint option availability)
- Add/extend blueprint-focused frontend tests:
  - `blueprint-wizard-view.test.tsx`
  - `blueprint-library-detail-moderation.test.tsx`
  - `experiment-wizard-view.test.tsx`
- Add dedicated moderation route page (`/blueprints/moderation`) and prevent incorrect detail fetches for non-numeric route params.
- Harden local development API behavior and troubleshooting:
  - browser runtime now prefers same-origin `/api/backend` proxy path
  - backend CORS handling for `/api/*` preflight and credentialed origins via `CORS_ALLOW_ORIGINS`
  - route-guard fixes for async `searchParams` handling in Next.js app-router page.

## [0.6.0] - 10th May 2026

- Deliver RFC-006 BTCUSDT Spot 1m kline retrieval, cache refresh, and charting integration.
- Implement Binance BTCUSDT 1m kline connector behavior:
  - strict symbol/interval validation (`BTCUSDT`, `1m`)
  - date-range and limit validation
  - paginated retrieval and retry handling
  - raw Binance row normalization into domain candles
- Implement/verify BTCUSDT cache upsert flow:
  - duplicate timestamp prevention via upsert semantics
  - update-in-place behavior for repeated timestamps
  - inserted/updated refresh summary propagation through service layer
- Integrate execution refresh-before-load behavior:
  - `DefaultExperimentExecutor` refreshes BTCUSDT 1m before cache load
  - experiment candles are loaded from local cache repository
  - refresh failure fallback path proceeds when cache is sufficient
- Add BTCUSDT charting stack:
  - cache-backed BTCUSDT kline API endpoint
  - reusable TradingView Lightweight Charts component
  - chart integration in Dashboard, Experiment Wizard, and Experiment Detail views
  - loading/empty/error/success rendering coverage
- Add/extend RFC-006 test coverage:
  - `backend/tests/infrastructure/test_binance_kline_client.py`
  - `backend/tests/repositories/test_market_data_repository.py`
  - `backend/tests/services/test_market_data_service.py`
  - `backend/tests/executors/test_default_experiment_executor.py`
  - `frontend/tests/btcusdt-price-chart.test.tsx`
  - `frontend/tests/dashboard-view.test.tsx`
  - `frontend/tests/experiment-wizard-view.test.tsx`
  - `frontend/tests/experiment-detail-view.test.tsx`
- Verification status:
  - backend full suite passes (`pytest tests`)
  - frontend chart/view suites pass (`btcucdt-price-chart`, `dashboard-view`, `experiment-wizard-view`, `experiment-detail-view`)

## [0.7.0] - 11th May 2026

- Deliver RFC-007 Experiment Configuration and Experiment Management.
- Implement experiment wizard flow with 7 prototype-aligned steps:
  - Basics
  - Dataset Range
  - Split Configuration
  - Blueprint Selection
  - Parameter Overrides
  - Review
  - Submit
- Implement experiment validation (`ExperimentValidator`) for:
  - required experiment name
  - BTCUSDT-only symbol scope
  - 1m interval enforcement for execution path
  - date-range ordering (`start_date < end_date`)
  - numeric split validation
  - split total = 100%
  - minimum validation/test split thresholds (>= 10%)
  - blueprint accessibility checks
  - parameter override object constraints
- Implement authenticated experiment creation endpoint with structured `422` validation responses and persistence through repository/UoW flow.
- Persist experiment configuration fields including selected blueprint reference, split values, override payload, and default lifecycle state (`Queued`, progress `0`).
- Enforce override immutability rule:
  - `parameter_overrides` stored only on Experiment
  - selected Blueprint record is not mutated during experiment creation
- Implement experiment list and detail APIs with ownership access control:
  - user-scoped list with status/search filtering
  - detail endpoint with unauthorized access rejection (`403`)
- Implement frontend experiment list/detail pages with backend data integration:
  - list filter controls + result cards
  - detail configuration/summary rendering
- Add/extend RFC-007 test coverage:
  - `backend/tests/test_experiment_validator.py`
  - `backend/tests/test_experiment_controller.py`
  - `backend/tests/repositories/test_experiment_repository.py`
  - `frontend/tests/experiment-wizard-view.test.tsx`
  - `frontend/tests/experiment-detail-view.test.tsx`
- Add wizard test coverage for:
  - next/back navigation
  - step-level validation visibility
  - submit success redirect
  - backend submission error handling path

## [0.8.0] - 17th May 2026

- Deliver RFC-008 Queue, Worker, Jobs, Cancellation, and System Management.
- Implement queue orchestration boundary and Redis/RQ integration:
  - `QueueService` protocol orchestration methods
  - `JobQueue` adapter contract
  - `RedisJobQueue` infrastructure implementation
  - queue lifecycle helpers for enqueue/position/remove/active/cancel
- Implement queued experiment submission path:
  - authenticated experiment creation now enqueues async experiment execution jobs
  - queue metadata returned in create response
- Implement worker lifecycle handling for experiments:
  - payload validation and experiment existence checks
  - status transitions for `Queued -> Running -> Completed`
  - failure transition for executor errors (`Running -> Failed`)
  - progress update callback persistence hooks
- Implement job detail and cancellation flow with authorization:
  - owner/staff job detail access checks
  - queued and running cancel behavior guards
  - stale/missing queue job handling path
- Implement cancellation strategy scaffolding:
  - `CancellableJobStrategy`
  - `ExperimentCancellationHandler`
  - `JobCancellationHandlerRegistry`
- Implement admin system queue visibility:
  - `GET /api/system/queue/active` admin-only endpoint
  - queue depth/running/active job snapshot exposure
  - frontend `SystemManagementView` queue rendering integration
- Add/extend RFC-008 test coverage:
  - `backend/tests/services/test_queue_service.py`
  - `backend/tests/infrastructure/test_redis_job_queue.py`
  - `backend/tests/test_experiment_worker.py`
  - `backend/tests/workers/test_experiment_worker.py`
  - `backend/tests/test_job_controller.py`
  - `backend/tests/test_system_controller.py`
  - `backend/tests/strategies/test_experiment_cancellation_handler.py`
  - `frontend/tests/job-detail-view.test.tsx`
  - `frontend/tests/system-management-view.test.tsx`

## [0.8.1] - 18th May 2026

- Add automated startup script `scripts/start_app.sh` to launch backend, worker, and frontend with one command.
- Add safe process shutdown handling so `Ctrl-C` stops all started services and exits cleanly.
- Update Quick Start documentation to prioritize automated startup guidance instead of manual multi-terminal app startup.

## [0.8.2] - 18th May 2026

- Add unified test runner script `scripts/test_all.sh` to execute backend and frontend test suites with one command.
- Configure script to run backend tests first (`pytest -q`, preferring `backend/.venv/bin/pytest`) and frontend tests second (`npm test -- --runInBand`).
- Add fail-fast behavior and prerequisite checks in the test runner script for clearer local developer feedback.
- Update `README.md` Quick Start with one-command test guidance (`./scripts/test_all.sh`).

## [0.8.3] - 18th May 2026

- Add GitHub Actions CI test workflow at `.github/workflows/test.yml`.
- Configure CI to run backend tests on Python 3.11 and frontend tests on Node.js 20.
- Trigger automated test workflow on push to `main` and on every pull request.
- Update `README.md` Quick Start test section with CI workflow status and reference.

## [0.8.4] - 18th May 2026

- Add database cleanup script `backend/app/scripts/cleanup_database.py`.
- Implement cleanup behavior that removes rows from all ERD-mapped tables except `User` and `BTCUSDTKline`.
- Use FK-safe delete ordering by traversing `reversed(Base.metadata.sorted_tables)` before commit.
- Add script test coverage in `backend/tests/test_market_data_scripts.py` for preserve-set and commit behavior.
- Update `README.md` with database cleanup usage and operational notes.
