# Frontend Tests

Frontend tests use Jest and Testing Library to verify route wrappers, auth behavior, API client behavior, reusable components, and feature views.

## `frontend/tests/__mocks__/d3.ts`

Explanation: Provides a lightweight D3 mock for tests that import chart helpers without needing real D3 DOM behavior.

Pseudocode:

```text
export mocked D3 chainable methods
return safe no-op selection/scale/axis helpers
```

## `frontend/tests/admin-placeholder-views.test.tsx`

Explanation: Smoke-tests admin-related placeholder/section views for system management, blueprint moderation, and job detail lifecycle sections.

Pseudocode:

```text
render SystemManagementView with mocked APIs
expect system sections
render BlueprintModerationView with queue data
expect moderation sections
render JobDetailView with lifecycle data
expect job lifecycle sections
```

## `frontend/tests/api-client-csrf.test.ts`

Explanation: Verifies unsafe API methods fetch and attach CSRF tokens.

Pseudocode:

```text
mock fetch for csrf endpoint and target request
call apiPost/apiDelete wrapper
expect target request has X-CSRFToken
expect credentials are included
```

## `frontend/tests/auth-guards.test.tsx`

Explanation: Tests client auth guards for unauthenticated redirects, unauthorized role redirects, and allowed admin access.

Pseudocode:

```text
mock useAuth and router
render RequireAuth without user
expect redirect to login with next path
render RequireRole with low role
expect fallback redirect
render RequireRole with Admin
expect children visible
```

## `frontend/tests/base-and-states.test.tsx`

Explanation: Checks shared layout/state components render normal, loading, error, empty, default, and custom content states.

Pseudocode:

```text
render BaseView normal/loading/error
expect title/content/loading/error text
render EmptyState default and custom action
render LoadingState default and custom message
```

## `frontend/tests/blueprint-library-detail-moderation.test.tsx`

Explanation: Covers blueprint library tabs, blueprint detail status/lineage/favorite behavior, and moderation queue actions.

Pseudocode:

```text
mock blueprint APIs
render BlueprintsLibraryView
switch owned/favorited tabs and expect rows
render BlueprintDetailView
expect status, lineage, favorite toggle
render BlueprintModerationView
expect approve/reject/disapprove actions
```

## `frontend/tests/blueprint-wizard-view.test.tsx`

Explanation: Tests blueprint wizard navigation, validation, submission, backend validation display, metadata-backed parameter constraints, tokenized inputs, dropdown tokens, and architecture parameter validation.

Pseudocode:

```text
mock metadata and createBlueprint APIs
render BlueprintWizardView
navigate through steps
trigger invalid step and expect inline error
fill valid blueprint fields
submit and expect navigation to detail
mock API rejection and expect backend error
interact with tokenized indicator/architecture params
expect constraint validation behavior
```

## `frontend/tests/btcusdt-price-chart.test.tsx`

Explanation: Tests BTCUSDT chart states and lightweight-charts integration behavior.

Pseudocode:

```text
mock lightweight-charts
render loading, error, empty states
render with candles
expect candlestick data sent to series
rerender with updated latest bar
expect incremental update and scroll
unmount and expect chart cleanup
```

## `frontend/tests/dashboard-view.test.tsx`

Explanation: Checks dashboard cards, quick links, BTCUSDT interval selection, chart hook arguments, loading state, and fallback live stats.

Pseudocode:

```text
mock chart hook
render DashboardView
expect required cards and quick actions
change interval
expect hook called with selected interval
render loading/fallback data states
```

## `frontend/tests/dialog-and-responsive.test.tsx`

Explanation: Smoke-tests dialog open/close interaction and responsive app shell classes.

Pseudocode:

```text
render confirm dialog trigger/card
click open and close
expect dialog content toggles
render AppShell
expect responsive layout class names
```

## `frontend/tests/documentation-view.test.tsx`

Explanation: Verifies documentation list and selected document detail render from mocked backend responses.

Pseudocode:

```text
mock listDocumentation and getDocumentation
render DocumentationView
wait for list item
expect detail markdown content rendered
```

## `frontend/tests/experiment-detail-view.test.tsx`

Explanation: Tests experiment detail configuration rendering, expanded risk chart modal, leaderboard pagination, model detail popup, round-log CSV progress, and completed download actions.

Pseudocode:

```text
mock experiment detail and log APIs
render ExperimentDetailView
expect configuration section
open risk chart modal and expect guidance
page through model leaderboard
open model popup
trigger round-log CSV action and expect progress
expect completed download buttons
```

## `frontend/tests/experiment-list-view.test.tsx`

Explanation: Tests debounced experiment search/status filters and graceful network error rendering.

Pseudocode:

```text
mock listExperiments
render ExperimentListView
change search/status
advance debounce timers
expect API called with filters
mock rejection
expect error state
```

## `frontend/tests/experiment-wizard-view.test.tsx`

Explanation: Broad test coverage for the experiment wizard: dataset preview, reused model prefill, override normalization, blueprint selection/preview, grouped overrides, validation, cached bounds, intervals, split controls, deterministic seed, target preview, target constraints, metadata hydration, permutation caps, submit, back navigation, and backend field errors.

Pseudocode:

```text
mock metadata, blueprint options, target preview, createExperiment
render ExperimentWizardView
validate initial wizard shell and dataset preview
exercise model reuse query params
navigate basics -> blueprint -> target -> overrides -> split -> review
verify blocking errors for missing/invalid values
verify cached bounds and interval options
edit split range and seed
open target info and apply preview params
edit tokenized overrides
verify permutation cap warning
submit valid payload and expect detail redirect
mock 422 response and expect field errors
```

## `frontend/tests/job-detail-view.test.tsx`

Explanation: Tests job detail rendering and friendly not-found handling.

Pseudocode:

```text
mock getJobDetail success
render JobDetailView
expect job status/details
mock not found response
expect friendly missing job message
```

## `frontend/tests/login-view.test.tsx`

Explanation: Tests login validation, blocked invalid submit, successful submit, auth refresh, and dashboard redirect.

Pseudocode:

```text
render LoginView
submit empty form
expect validation errors
fill email/password
mock login success
submit
expect refreshCurrentUser and router push dashboard
```

## `frontend/tests/model-views.test.tsx`

Explanation: Tests model ranking and detail screens: ranking rows, detail links, sorting, search/filter serialization, filter operator restrictions, numeric formatting, API errors, include-incomplete toggle, optimistic unfavorite removal, and detail metric/log rendering.

Pseudocode:

```text
mock model ranking/highlight/detail APIs
render ModelsRankingsView
expect rows and sortable headings
edit search/filter rules and expect serialized query
switch column types and expect operator reset
toggle includeIncomplete
unfavorite model and expect row removal
mock ranking error and expect error state
render ModelDetailView and expect metrics/params/logs
```

## `frontend/tests/navigation.test.tsx`

Explanation: Tests visible nav items, route targets, role filtering, topbar sign-out routing, guest nav, and admin dropdown visibility.

Pseudocode:

```text
mock auth roles and router
render navigation/sidebar/topbar
expect authenticated labels and hrefs
verify role-protected items hide/show
click sign out and expect login route
render guest topbar and expect public links
render staff topbar and expect admin dropdown
```

## `frontend/tests/public-hub-view.test.tsx`

Explanation: Tests public hub data loading and tab switching.

Pseudocode:

```text
mock getPublicHub
render PublicHubView
wait for users tab data
click experiments/models/blueprints tabs
expect matching records render
```

## `frontend/tests/registration-view.test.tsx`

Explanation: Tests registration validation, blocked invalid submit, successful payload submit, and redirect to login.

Pseudocode:

```text
render RegistrationView
submit invalid form
expect validation errors
fill valid fields
mock register success
submit
expect API payload and router push login
```

## `frontend/tests/routes-rendering.test.tsx`

Explanation: Verifies major route components render and route wrappers use the expected auth or role guard.

Pseudocode:

```text
mock guards and views
render major page components
expect corresponding view output
inspect authenticated pages for RequireAuth
inspect public pages for no auth guard
inspect role pages for RequireRole and minimum role
```

## `frontend/tests/status-badges.test.tsx`

Explanation: Tests generic status badge tone mapping and user role/status wrapper normalization.

Pseudocode:

```text
render StatusBadge with known and unknown statuses
expect label and fallback styles
render UserRoleBadge for Admin/Moderator/User
render UserStatusBadge for Enabled/Disabled/unknown
```

## `frontend/tests/system-management-view.test.tsx`

Explanation: Tests system management queue display, empty queue state, settings controls, terminal truncation/download link, BTCUSDT cache controls, catch-up failure display, and stop catch-up behavior.

Pseudocode:

```text
mock queue/settings/events/metadata APIs
render SystemManagementView
expect queue cards and job rows
mock empty queue and expect empty state
edit settings and expect update call
provide many terminal rows and expect visible cap plus download URL
click BTCUSDT catch-up/clear/stop controls
expect cache update notifications and error handling
```

## `frontend/tests/user-management-view.test.tsx`

Explanation: Tests user-management RBAC UI: create errors, hidden normal-user actions, moderator-limited actions, full admin actions, list endpoint errors, and audit trail rendering.

Pseudocode:

```text
mock auth actor and user APIs
render UserManagementView
simulate create-user failure and expect error
render as normal user and expect staff actions hidden
render as moderator and expect limited actions
render as admin and expect full action set
mock list failure and expect error
open audit trail and expect events
```

## `frontend/tests/wizard-view.test.tsx`

Explanation: Tests shared wizard layout: step chips, current step header, summary/footer slots, and responsive structure.

Pseudocode:

```text
render WizardView with steps
expect current/completed/upcoming chips
expect current title and description
render summary and footer slots
expect responsive class structure
```

# Backend Tests

Backend tests use pytest to verify controllers, services, repositories, strategies, infrastructure adapters, domain objects, schema rules, workers, and scripts.

## `backend/tests/__init__.py`

Explanation: Marks the backend test folder as a Python package.

Pseudocode:

```text
no runtime test logic
```

## `backend/tests/database/test_schema_constraints.py`

Explanation: Verifies database primary keys, foreign keys, unique constraints, and check constraints match the expected ERD.

Pseudocode:

```text
inspect SQLAlchemy metadata
assert every required primary key exists
assert foreign keys target exact tables/columns
assert unique/check constraints are present
```

## `backend/tests/database/test_schema_enums.py`

Explanation: Verifies enum names and literal values match the ERD contract.

Pseudocode:

```text
load database enum classes
compare role/status/approval/interval/status values to expected literals
```

## `backend/tests/database/test_schema_naming.py`

Explanation: Verifies strict table and column naming conventions, including exact table set and PascalCase columns.

Pseudocode:

```text
inspect metadata table names
assert exact expected table set
for each table: assert expected PascalCase column names
assert no snake_case table names exist
```

## `backend/tests/domain/test_blueprint_entity.py`

Explanation: Verifies `Blueprint` domain field roundtrips and approval-state literals.

Pseudocode:

```text
construct Blueprint with sample fields
assert fields are preserved
assert approval enum/literals match expected values
```

## `backend/tests/domain/test_btcusdt_kline_entity.py`

Explanation: Verifies `BTCUSDTKline` domain field roundtrips.

Pseudocode:

```text
construct BTCUSDTKline with OHLCV values
assert timestamp, price, volume fields are preserved
```

## `backend/tests/domain/test_experiment_entity.py`

Explanation: Verifies `Experiment` domain field roundtrips, interval/status literals, and that split constraints are not enforced inside the plain dataclass.

Pseudocode:

```text
construct Experiment with sample fields
assert identity/config/status fields
assert interval/status literals
construct unusual split values and assert dataclass accepts them
```

## `backend/tests/domain/test_experiment_log_entity.py`

Explanation: Verifies `ExperimentLog` domain field roundtrips.

Pseudocode:

```text
construct ExperimentLog
assert experiment/model/log type/metrics/timestamp fields
```

## `backend/tests/domain/test_favorites_entities.py`

Explanation: Verifies favorite model and favorite blueprint domain link objects.

Pseudocode:

```text
construct FavoriteModel and FavoriteBlueprint
assert user/object IDs and timestamps
```

## `backend/tests/domain/test_model_entity.py`

Explanation: Verifies `Model` domain field roundtrips.

Pseudocode:

```text
construct Model
assert experiment, architecture, metrics, artifact fields
```

## `backend/tests/domain/test_user_entity.py`

Explanation: Verifies `User` domain field roundtrips and role/status literal values.

Pseudocode:

```text
construct User
assert identity/auth/role/status fields
assert role and status literals match ERD
```

## `backend/tests/domain/test_value_objects.py`

Explanation: Tests value-object helpers, immutability, non-persistence intent, constructor fields, and validation for job specs and queue positions.

Pseudocode:

```text
create ValidationResult and ExecutionResult helpers
assert success/failure behavior
try mutating frozen value object and expect failure
construct other value objects and assert fields
construct invalid JobSpecification and QueuePosition and expect ValueError
```

## `backend/tests/executors/test_default_experiment_executor.py`

Explanation: Focuses on default executor data loading from persisted cache without refresh side effects.

Pseudocode:

```text
create fake unit of work/repository/cache rows
call load_data
assert repository cache is queried
assert refresh service is not used
repeat run and assert deterministic output
with insufficient cache: expect ExperimentExecutionError
```

## `backend/tests/infrastructure/test_binance_kline_client.py`

Explanation: Tests Binance kline normalization, request validation, pagination, UTC handling, retry behavior, malformed rows, and client initialization.

Pseudocode:

```text
normalize raw kline row and assert Decimal/date fields
pass short/malformed row and expect validation error
mock Binance client pages
call fetch_klines
assert symbol, interval, start/end, limit arguments
assert pagination advances until empty
assert invalid range/symbol/interval rejects before API call
mock transient failure then success
mock repeated failure and expect final error
```

## `backend/tests/infrastructure/test_redis_job_queue.py`

Explanation: Tests Redis queue adapter enqueue snapshots, Redis error mapping, state normalization, and metadata detail formatting.

Pseudocode:

```text
mock Redis commands
enqueue job and assert job ID, queue position, metadata writes
simulate Redis failure and expect QueueUnavailableError
normalize raw job states into frontend states
load job metadata and assert normalized detail payload
```

## `backend/tests/repositories/test_blueprint_repository.py`

Explanation: Tests blueprint repository add/get/list by user behavior.

Pseudocode:

```text
open test session
add blueprint
get by ID
list by owner
assert persisted fields match
```

## `backend/tests/repositories/test_experiment_log_repository.py`

Explanation: Tests experiment log repository add/list behavior and relationships.

Pseudocode:

```text
create experiment/model/log rows
add log through repository
list by experiment/type/model
assert relationships and metrics payload
```

## `backend/tests/repositories/test_experiment_repository.py`

Explanation: Tests experiment repository CRUD, list-by-user, status transitions, and current-stage truncation.

Pseudocode:

```text
add experiment
get/list by owner
call mark queued/running/completed/failed/cancelled helpers
assert status/timestamps/progress
update long current stage
assert stored value fits max length
```

## `backend/tests/repositories/test_favorites_repositories.py`

Explanation: Tests add/list/remove behavior for favorite model and favorite blueprint repositories.

Pseudocode:

```text
create user/model/blueprint rows
add favorites
assert list/exists returns links
remove favorites
assert links are gone
```

## `backend/tests/repositories/test_market_data_repository.py`

Explanation: Tests BTCUSDT kline upsert, range retrieval, inserted/updated counts, empty input, interval validation, and PostgreSQL projection bucketing.

Pseudocode:

```text
upsert sample klines
query range and assert order/fields
upsert changed candle and assert updated count and CreatedAt preservation
call upsert empty and assert zero summary
query invalid interval and expect error
inspect postgres projection SQL behavior for epoch buckets and UTC bounds
```

## `backend/tests/repositories/test_model_repository.py`

Explanation: Tests model repository add/get/list by experiment.

Pseudocode:

```text
create experiment
add model through repository
get by ID
list by experiment
assert model fields
```

## `backend/tests/repositories/test_unit_of_work.py`

Explanation: Tests transaction commit on success and rollback on exception.

Pseudocode:

```text
with UnitOfWork: add row
exit normally and assert row persisted
with UnitOfWork: add row then raise
assert row rolled back
```

## `backend/tests/repositories/test_user_repository.py`

Explanation: Tests user repository CRUD, search/count filters, and enum-backed status/role updates.

Pseudocode:

```text
add users
get by id/email/username
list with search/status/role filters
assert count results
update status and role
assert enum values persisted
```

## `backend/tests/services/test_job_metadata_service.py`

Explanation: Tests live job metadata reads, recent terminal metadata cache fallback, and cache expiry.

Pseudocode:

```text
mock queue provider with live metadata
assert service returns live data
simulate terminal job and cache it
simulate provider not found
assert cached terminal metadata returned until expiry
after expiry expect QueueJobNotFoundError
```

## `backend/tests/services/test_market_data_service.py`

Explanation: Tests service-layer market data refresh summary and safe handling of Binance fetch failures.

Pseudocode:

```text
mock client and repository
refresh BTCUSDT range
assert fetched/inserted/updated counts
simulate Binance failure
assert persistence is skipped and error handling is safe
```

## `backend/tests/services/test_queue_service.py`

Explanation: Tests queue service delegation, unsupported job-type rejection, and read/remove/cancel methods.

Pseudocode:

```text
mock queue provider
enqueue supported job and assert provider call/result
enqueue unsupported job and expect UnsupportedJobTypeError
call detail/list/remove/cancel
assert provider methods receive expected args
```

## `backend/tests/strategies/test_data_split_strategy.py`

Explanation: Tests split strategies and leakage protections: chronological split, random reproducibility, seed behavior, indicator/target split isolation, train-only scaling, and log transform output scaling.

Pseudocode:

```text
build sample time-series frame
run time-based split and assert chronological boundaries
run random split twice with same/different seeds
assert reproducibility/difference
apply indicator/target generation per split
assert no rows outside split influence outputs
fit scaler on train only
assert validation/test use train stats
```

## `backend/tests/strategies/test_experiment_cancellation_handler.py`

Explanation: Tests experiment cancellation handler type support and registry resolution.

Pseudocode:

```text
instantiate handler
assert it is cancellable strategy
assert it supports experiment jobs
register handler and resolve by job type
unknown job type raises
default registry includes experiment handler
```

## `backend/tests/strategies/test_target_strategy.py`

Explanation: Tests indicator/target generation, binary target outputs, target-specific behavior, lookahead validation, quantile validation, and train-only scaler fitting.

Pseudocode:

```text
build sample OHLCV frame
apply each target strategy
assert target values are binary/null where expected
assert lookahead changes output and zero lookahead rejects
assert cost/triple-barrier/volatility/MFE-MAE semantics
assert quantile cutoff fits and validates params
fit scaler on train and transform without leakage
```

## `backend/tests/test_access_control_service.py`

Explanation: Tests access-control role checks, owner/profile access, user-management matrix, and assignable-role matrix.

Pseudocode:

```text
create AuthContext roles
assert role helpers for user/moderator/admin
assert owner can access own profile and staff can access others
assert manage-user permissions by actor/target role
assert assignable roles by actor role
```

## `backend/tests/test_architecture_factory.py`

Explanation: Tests architecture factory registration, invalid architecture rejection, metadata constraints, indicator/target metadata constraints, prediction contracts, ridge single-class handling, backtest compatibility, null class weight, and blueprint normalization.

Pseudocode:

```text
resolve known architectures
request invalid architecture and expect error
inspect metadata fields and constraints
train/predict sample models and assert output length/values
train ridge on single-class data and assert stable predictions
feed predictions into backtest and assert trades possible
normalize blueprint without target strategy
```

## `backend/tests/test_authentication_controller.py`

Explanation: Tests registration, duplicate rejection, username rules, login cookies, zero session timeout, invalid/disabled login, current-user endpoint, and logout behavior.

Pseudocode:

```text
POST register valid payload
assert password hashed and safe user returned
POST duplicate username/email and invalid usernames
assert validation errors
POST login valid credentials
assert session cookie set
configure zero timeout and assert no max age
login invalid/disabled user and expect 401/403
GET me with/without session
POST logout and assert session invalidated/idempotent
```

## `backend/tests/test_blueprint_approval_controller.py`

Explanation: Tests blueprint approval request, moderator transitions, rejection/disapproval rules, and invalid pending disapproval.

Pseudocode:

```text
owner requests approval
moderator lists queue and approves
moderator rejects pending blueprint
moderator disapproves approved blueprint
attempt disapprove from pending and expect rejection
```

## `backend/tests/test_blueprint_controller.py`

Explanation: Tests draft creation defaults, session-cookie authorization, field-level validation, detail/favorite/unfavorite persistence, and staff access to pending moderation detail.

Pseudocode:

```text
POST draft blueprint with auth
assert defaults and persisted config
POST invalid payload and assert field errors
GET detail as owner/public/staff
POST/DELETE favorite and assert state persists
staff views pending blueprint for moderation
```

## `backend/tests/test_blueprint_validator.py`

Explanation: Tests blueprint validator success and errors for scalers, custom indicators, missing names, unsupported indicators, invalid ranges, unsupported architecture, invalid settings, multiple errors, and non-object sections.

Pseudocode:

```text
validate good payload and expect success
mutate payload for each invalid case
call validator
assert expected field errors without crash
```

## `backend/tests/test_blueprints_library_controller.py`

Explanation: Tests owned/favorited blueprint listings and hides disapproved blueprints from non-owners.

Pseudocode:

```text
create owner, other user, blueprints, favorites
GET owned list and assert owner rows
GET favorited list and assert favorited rows
assert disapproved non-owned blueprint hidden
```

## `backend/tests/test_csrf_hardening.py`

Explanation: Tests CSRF protection returns JSON errors for missing tokens and allows valid tokens.

Pseudocode:

```text
login or create client session
POST unsafe route without CSRF
assert JSON CSRF_FAILED error
GET csrf token
POST unsafe route with token
assert state change succeeds
```

## `backend/tests/test_custom_indicators.py`

Explanation: Tests custom indicator metadata exposure, blueprint factory normalization, and pipeline execution for new custom indicators.

Pseudocode:

```text
get IndicatorFactory metadata
assert custom indicators present
normalize blueprint with new indicators
run indicator pipeline on sample frame
assert output feature columns exist
```

## `backend/tests/test_default_experiment_executor.py`

Explanation: Tests default executor cache loading, insufficient cache errors, full-day datetime bounds, candle order preservation, round-log caps, and template method order.

Pseudocode:

```text
mock unit of work and market data repository
call load_data and assert persisted cache only
simulate insufficient cache and expect error
assert datetime bounds include full day
convert candles to LazyFrame and assert order
run executor with round-log settings
assert disabled/default cap behavior
assert pipeline stages called in golden order
```

## `backend/tests/test_documentation_controller.py`

Explanation: Tests documentation list/detail authentication and missing slug handling.

Pseudocode:

```text
GET docs without auth and expect unauthorized
GET docs with auth and expect list/detail
GET missing slug and expect 404
```

## `backend/tests/test_experiment_compiler.py`

Explanation: Tests compiled experiment snapshot generation, override merging, deterministic permutations/hashes, disallowed overrides, CSV parsing, cap enforcement, fixed/range/allowed-value overrides, immutability, scaler preservation, and multiple error reporting.

Pseudocode:

```text
build blueprint config and override payloads
compile plan
assert source blueprint not mutated
assert permutations and hashes are deterministic
assert comma-separated/list/range values expand
assert disallowed/conflicting overrides return errors
assert cap clamps requested permutations
edit blueprint after compile and assert snapshot unchanged
```

## `backend/tests/test_experiment_controller.py`

Explanation: Tests experiment blueprint options, creation, auth, validation, concurrency limits, persistence, permutation caps, ownership, date parsing, candlestick amount mode, queue errors, status normalization, stale queue reconciliation, detail counts, route redirects, and unexpected error JSON.

Pseudocode:

```text
seed users/blueprints/experiments/jobs
GET blueprint-options with filters/sort/paging/favorites
POST create without auth and expect 401
POST invalid payload and expect 422 structured errors
mock concurrency limit and queue unavailable errors
POST valid payload and assert experiment/job response
GET list/detail as owner/non-owner and assert access
simulate stale queued job and assert reconciliation
assert running status and permutation counts normalized
assert slashless route and unexpected errors return JSON
```

## `backend/tests/test_experiment_log_repository_metrics.py`

Explanation: Tests persistence of structured metrics logs through the experiment log repository.

Pseudocode:

```text
create experiment/model
persist metrics log
reload log
assert nested metrics payload preserved
```

## `backend/tests/test_experiment_validator.py`

Explanation: Tests experiment validator success and failures around required fields, ordering, split totals, intervals, blueprint accessibility, staff access, overrides, and candlestick mode.

Pseudocode:

```text
validate good payload
for invalid names/symbol/date/split/interval/blueprint/override:
  call validator
  assert expected field errors
validate approved blueprint for non-owner and staff override access
validate candlestick amount mode cases
```

## `backend/tests/test_experiment_worker.py`

Explanation: Tests experiment worker payload validation, missing experiment handling, successful execution, dict executor results, and failed status on executor errors.

Pseudocode:

```text
call payload validator with non-object/missing/non-int/missing experiment
expect payload errors
mock executor success
handle job and assert completed status
mock dict result and assert accepted
mock executor exception
assert experiment marked failed
```

## `backend/tests/test_job_cancellation_strategy.py`

Explanation: Tests queued and running experiment cancellation behavior and idempotency.

Pseudocode:

```text
create queued experiment/job
cancel and assert Cancelled plus event
create running job
cancel twice
assert running cancel path called and idempotent result
```

## `backend/tests/test_job_controller.py`

Explanation: Tests queue job detail access, unauthorized detail blocking, queued job cancellation, and accessible job listing.

Pseudocode:

```text
mock job metadata and queue service
GET detail as owner and assert payload
GET detail as unrelated user and expect 403
POST cancel as owner and assert cancel response
GET jobs and assert only accessible items
```

## `backend/tests/test_logs_download_rfc011.py`

Explanation: Tests completed public experiment export authorization and rejects exports for incomplete experiments.

Pseudocode:

```text
create completed public experiment with logs
request export as non-owner/auth combinations
assert allowed/blocked rules
create incomplete experiment
request export and expect rejection
```

## `backend/tests/test_market_data_controller.py`

Explanation: Tests BTCUSDT kline endpoints, target preview behavior, interval handling, JSON-safe summaries, admin cache controls, metadata, catch-up status, stop, and clear protections.

Pseudocode:

```text
seed cached klines
GET klines with ranges/intervals/invalid params
POST target-preview with target params
assert labels, confusion stats, economics, bridge fields
test string params, large-range cap, zero preview lookahead, tail nulls
mock target failure and assert surfaced error
admin endpoints require admin
GET metadata and assert bounds
POST catch-up/stop/status and assert state
DELETE cache and assert rows cleared or rejected while running
```

## `backend/tests/test_market_data_scripts.py`

Explanation: Tests market-data CLI scripts for refresh, ingestion chunking, failure handling, resume/reconcile behavior, gap repair, range validation, and cleanup preservation.

Pseudocode:

```text
monkeypatch MarketDataService and CLI args
run refresh script with lookback and assert service call
simulate service error and assert failure exit
run ingest over chunked windows and assert aggregate output
simulate failures within/over budget
simulate keyboard interrupt
simulate resume from cache and full skip
simulate reconcile head/internal/tail gaps and post-run repair
validate bad range combinations
run cleanup and assert users/klines preserved
```

## `backend/tests/test_market_data_service.py`

Explanation: Tests main market data service refresh validation, fetch/persistence failures, repository requirements, and cached timestamp accessors.

Pseudocode:

```text
mock Binance client and unit of work
refresh valid range and assert summary counts
invalid range rejects before fetch
fetch failure wraps as MarketDataRefreshError
missing repository raises
persistence failure wraps
latest/earliest/list timestamp methods delegate to repo
```

## `backend/tests/test_metrics_and_logs.py`

Explanation: Tests backtest metrics/log schemas, Sharpe, confusion metrics, continuous metrics, reproducibility logs, round-log endpoints/regeneration/errors, parameter correlation defaults, long-only trading semantics, and confusion edge cases.

Pseudocode:

```text
build sample predictions/prices/log payloads
assert backtest fields and annualized Sharpe
assert confusion schema and binary metrics
assert reproducibility logs deterministic
call round-log endpoints with persisted and missing rows
mock regeneration success/failure
assert parameter correlation metric default
run long-only strategy through entry/exit/lag/compounding/drawdown/force close cases
assert confusion filters invalid inputs and default lag
```

## `backend/tests/test_model_controller.py`

Explanation: Tests model detail privacy, rankings sort/filter/library/favorites, pagination before log joins, flexible filters, null metric sorting, highlights, page-only metric population, and backtest metric sort/filter.

Pseudocode:

```text
seed public/private models with experiments/logs/favorites
GET model detail as allowed/blocked users
GET rankings with sort/search/filter/library/favorite params
assert pagination happens before expensive log loading
assert incomplete/null metrics handled
GET highlights and assert SQL-limited results
sort/filter by backtest return and win rate
```

## `backend/tests/test_public_hub_controller.py`

Explanation: Tests public hub visibility/search and public profiles returning only public artifacts.

Pseudocode:

```text
seed public/private users/artifacts
GET hub with search
assert only public/approved records
GET public profile
assert private artifacts omitted
```

## `backend/tests/test_session_service.py`

Explanation: Tests in-memory server session expiry purge and zero-timeout non-expiring sessions.

Pseudocode:

```text
create expired and active sessions
create new session and assert expired purged
create zero-timeout session
advance time/check session
assert it does not expire
```

## `backend/tests/test_system_controller.py`

Explanation: Tests system admin endpoints for queue snapshot, settings, events, request tracing, global feed defaults, and event CSV download.

Pseudocode:

```text
GET queue as admin and non-admin
GET/PATCH settings as admin
GET system events with filters
make API request and assert SystemEvent persisted
GET events without scope and assert global feed
GET download and assert CSV response
```

## `backend/tests/test_talib_indicator_strategy.py`

Explanation: Tests TA-Lib indicator input signatures, selected indicator output columns, malformed/list param rejection, warmup cleanup, and decimal-column finite checks.

Pseudocode:

```text
apply AD indicator and assert high/low/close/volume signature
parametrize supported indicators and expected output columns
pass malformed numeric params and expect clean error
pass unexpanded list params and expect clean error
apply warmup cleanup and assert rows cleaned
ensure Decimal columns do not break finite checks
```

## `backend/tests/test_target_strategy_factory.py`

Explanation: Tests target strategy factory discovers target modules dynamically.

Pseudocode:

```text
monkeypatch target modules/registry
create factory
assert new target strategy appears in metadata/create lookup
```

## `backend/tests/test_user_controller.py`

Explanation: Tests profile endpoints, staff listing/filtering, audit access/history, missing audit user, staff management constraints, normal user blocking, username validation, moderator limits, immediate role effects, create-user validation, and admin role alias normalization.

Pseudocode:

```text
seed users with roles/status
GET /users/me and profile as owner/staff
GET list as staff with filters
GET audit as staff and assert history/missing behavior
try status/password/role/username/delete mutations by roles
assert normal users blocked
assert duplicate/short username rejected
assert moderator cannot create elevated roles
assert changed role affects access immediately
assert create user rejects invalid email/username
assert admin role aliases normalize before persist
```

## `backend/tests/test_versioning_service.py`

Explanation: Tests blueprint versioning: never-submitted drafts update in place and reviewed blueprints create new versions.

Pseudocode:

```text
create draft blueprint
update through VersioningService
assert same row updated
create reviewed blueprint
update through VersioningService
assert new version row with lineage
```

## `backend/tests/workers/test_experiment_worker.py`

Explanation: Worker-focused duplicate/narrow tests for payload validation, successful handling, and failure marking.

Pseudocode:

```text
validate bad payload shapes and missing experiment
mock executor success and assert completed update
mock executor error and assert failed update
```
