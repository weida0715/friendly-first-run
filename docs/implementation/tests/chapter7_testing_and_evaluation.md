# Chapter 7: Testing and Evaluation

## 7.1 Overview

This chapter describes the testing and evaluation strategy used for the BEE prototype. The testing artefacts cover backend and frontend verification. Backend testing uses pytest to verify controllers, services, repositories, strategies, infrastructure adapters, domain objects, schema rules, workers, and scripts. Frontend testing uses Jest and Testing Library to verify route wrappers, authentication behaviour, API client behaviour, reusable components, and feature views.

The available testing inventory contains:

| Test Area | Number of Test Files | Primary Framework |
| --- | --- | --- |
| Backend | 61 | pytest |
| Frontend | 25 | Jest and Testing Library |
| Total documented tests | 86 | Mixed backend/frontend automated test suites |

The purpose of testing is to verify that the implemented system satisfies the major functional areas of BEE: authentication, authorization, user management, Blueprint governance, experiment configuration, market data handling, queueing, model metrics, Public Hub visibility, frontend usability, and data integrity.

## 7.2 Testing Strategy

### 7.2.1 Testing Objectives

| Objective | Description | Related Implementation Area |
| --- | --- | --- |
| Verify correctness | Confirm that each implemented module behaves according to its expected input, output, and state-transition rules. | Controllers, services, repositories, strategies, UI views. |
| Verify security controls | Confirm authentication, authorization, CSRF, session handling, and database query-safety boundaries. | Auth controller, access-control service, route guards, CSRF client/backend. |
| Verify data integrity | Confirm schema constraints, enum values, repository persistence, transaction rollback, market-data upsert behaviour, and deterministic ordering. | Database schema, repositories, unit of work, market-data repository. |
| Verify temporal integrity | Confirm chronological split behaviour, per-split indicator/target isolation, train-only scaling, and deterministic output behaviour. | Data split strategy, target strategy, experiment executor. |
| Verify workflow behaviour | Confirm Blueprint creation/moderation/versioning, experiment creation/queueing, job detail/cancellation, model ranking, and Public Hub discovery. | Backend controllers and frontend feature views. |
| Verify frontend behaviour | Confirm route guards, validation errors, loading/error/empty states, form submission, navigation, charts, and feature views. | React/Next.js frontend. |
| Verify failure handling | Confirm graceful error output for invalid payloads, missing CSRF, queue failures, data fetch failures, unsupported jobs, and worker exceptions. | Backend and frontend error paths. |

### 7.2.2 Testing Environment

| Environment Item | Backend Testing | Frontend Testing |
| --- | --- | --- |
| Runtime | Python test runtime using pytest. | Node.js test runtime using Jest. |
| Frameworks | Flask test client, pytest fixtures/mocks, SQLAlchemy test session, service/repository mocks. | Jest, Testing Library, mocked router, mocked auth hooks, mocked API calls, mocked chart libraries. |
| Database | Test database or isolated SQLAlchemy session depending on test type. | Backend responses are mocked for most component tests. |
| Queue | Redis queue adapter behaviour is mocked or tested through adapter-level fakes. | Queue and job responses are mocked through frontend API wrappers. |
| External APIs | Binance kline client is tested with mocked pages and failures. | External chart and D3 behaviour are mocked. |
| Execution | Command-line pytest execution for backend tests. | Command-line Jest execution for frontend tests. |

### 7.2.3 Test Data Summary

| Test Data Type | Purpose | Examples |
| --- | --- | --- |
| User records | Authentication, role checks, account management, profile access, audit workflows. | Normal User, Moderator, Administrator, enabled/disabled accounts, duplicate email/username. |
| Blueprint records | Draft persistence, validation, approval, rejection, disapproval, versioning, library, favorite, and visibility tests. | DRAFT, PENDING, APPROVED, REJECTED Blueprints; owner and non-owner cases. |
| Experiment records | Experiment creation, validation, queueing, status transitions, detail access, and logs. | Queued, running, completed, failed, cancelled experiments. |
| Model records | Model detail, rankings, filters, metric sorting, highlights, favorites, and privacy rules. | Public/private models, incomplete/null metrics, favorited models. |
| Market data rows | BTCUSDT kline range retrieval, upsert behaviour, target preview, metadata, cache controls, and gap repair. | OHLCV candles, changed candles, empty input, invalid intervals. |
| Queue metadata | Job enqueueing, queue position, terminal metadata cache, cancellation, and detail access. | Queued/running/terminal job states. |
| Frontend mock responses | UI states, validation rendering, navigation, charts, and feature interactions. | Mocked API success/failure responses and route/auth states. |

### 7.2.4 Test Coverage by Implemented Module

Backend module coverage summary:

| Backend Coverage Area | Number of Files | Representative Test Files |
| --- | --- | --- |
| General backend | 6 | __init__.py, test_architecture_factory.py, test_custom_indicators.py, test_documentation_controller.py, test_logs_download_rfc011.py, test_versioning_service.py |
| Database schema | 3 | test_schema_constraints.py, test_schema_enums.py, test_schema_naming.py |
| Domain objects | 8 | test_blueprint_entity.py, test_btcusdt_kline_entity.py, test_experiment_entity.py, test_experiment_log_entity.py, test_favorites_entities.py, test_model_entity.py, test_user_entity.py, test_value_objects.py |
| Executors | 1 | test_default_experiment_executor.py |
| Infrastructure adapters | 2 | test_binance_kline_client.py, test_redis_job_queue.py |
| Repositories and unit of work | 8 | test_blueprint_repository.py, test_experiment_log_repository.py, test_experiment_repository.py, test_favorites_repositories.py, test_market_data_repository.py, test_model_repository.py, test_unit_of_work.py, test_user_repository.py |
| Services | 3 | test_job_metadata_service.py, test_market_data_service.py, test_queue_service.py |
| Strategies | 3 | test_data_split_strategy.py, test_experiment_cancellation_handler.py, test_target_strategy.py |
| Security and access | 4 | test_access_control_service.py, test_authentication_controller.py, test_csrf_hardening.py, test_session_service.py |
| Blueprint workflow | 4 | test_blueprint_approval_controller.py, test_blueprint_controller.py, test_blueprint_validator.py, test_blueprints_library_controller.py |
| Experiment and job workflow | 8 | test_default_experiment_executor.py, test_experiment_compiler.py, test_experiment_controller.py, test_experiment_log_repository_metrics.py, test_experiment_validator.py, test_experiment_worker.py, test_job_cancellation_strategy.py, test_job_controller.py |
| Market data and feature engineering | 5 | test_market_data_controller.py, test_market_data_scripts.py, test_market_data_service.py, test_talib_indicator_strategy.py, test_target_strategy_factory.py |
| Models, metrics, and rankings | 2 | test_metrics_and_logs.py, test_model_controller.py |
| Public hub | 1 | test_public_hub_controller.py |
| System administration | 1 | test_system_controller.py |
| User management | 1 | test_user_controller.py |
| Workers | 1 | test_experiment_worker.py |

Frontend module coverage summary:

| Frontend Coverage Area | Number of Files | Representative Test Files |
| --- | --- | --- |
| Shared UI components | 5 | d3.ts, base-and-states.test.tsx, dialog-and-responsive.test.tsx, status-badges.test.tsx, wizard-view.test.tsx |
| Administration UI | 4 | admin-placeholder-views.test.tsx, job-detail-view.test.tsx, system-management-view.test.tsx, user-management-view.test.tsx |
| API integration | 1 | api-client-csrf.test.ts |
| Authentication UI | 3 | auth-guards.test.tsx, login-view.test.tsx, registration-view.test.tsx |
| Blueprint UI | 2 | blueprint-library-detail-moderation.test.tsx, blueprint-wizard-view.test.tsx |
| Dashboard and chart UI | 2 | btcusdt-price-chart.test.tsx, dashboard-view.test.tsx |
| Documentation UI | 1 | documentation-view.test.tsx |
| Experiment UI | 3 | experiment-detail-view.test.tsx, experiment-list-view.test.tsx, experiment-wizard-view.test.tsx |
| Model UI | 1 | model-views.test.tsx |
| Routing and navigation | 2 | navigation.test.tsx, routes-rendering.test.tsx |
| Public hub UI | 1 | public-hub-view.test.tsx |

### 7.2.5 Testing Approach

Testing is organized into layered verification:

| Testing Layer | Description | Example |
| --- | --- | --- |
| Unit testing | Verifies individual classes, helpers, services, repositories, validators, strategies, and UI components in isolation. | Blueprint validator, data split strategy, status badge, route guard. |
| Integration testing | Verifies interaction between controllers, services, repositories, queue adapters, and frontend API-facing views. | Experiment creation with validation and queue error handling. |
| System testing | Verifies end-to-end workflows across the implemented system boundary. | Login, create Blueprint, submit for approval, approve, create experiment, view model results. |
| Security testing | Verifies authentication, authorization, CSRF, session, and query-safety behaviour. | CSRF missing-token rejection and valid-token acceptance. |
| Data validation testing | Verifies market-data quality, split behaviour, indicator/target generation, and deterministic data handling. | Per-split indicator isolation and train-only scaling. |
| Model/evaluation testing | Verifies metrics, logs, long-only evaluation, confusion metrics, reproducibility logs, and model ranking. | Sharpe calculation, drawdown, long-only entry/exit semantics. |
| Usability testing | Verifies that frontend views render understandable loading, error, empty, and normal states. | BaseView, EmptyState, wizard step rendering, friendly job not-found message. |

### 7.2.6 Test Execution Commands

| Command | Purpose |
| --- | --- |
| `pytest backend/tests` | Run the full backend test suite. |
| `pytest backend/tests/database` | Run database schema and enum verification tests. |
| `pytest backend/tests/repositories` | Run repository and unit-of-work tests. |
| `pytest backend/tests/strategies` | Run split, target, and cancellation strategy tests. |
| `pytest backend/tests/test_authentication_controller.py backend/tests/test_csrf_hardening.py` | Run authentication and CSRF security tests. |
| `npm test` or `npx jest` | Run the frontend Jest test suite. |
| `npx jest frontend/tests/auth-guards.test.tsx` | Run frontend route guard tests. |
| `npx jest frontend/tests/experiment-wizard-view.test.tsx` | Run experiment wizard UI tests. |
| `npx jest frontend/tests/model-views.test.tsx` | Run model ranking/detail UI tests. |

### 7.2.7 Testing Success Criteria

| Criterion | Success Definition |
| --- | --- |
| Functional pass | All required controller, service, repository, strategy, worker, and UI tests pass. |
| Security pass | Unauthorized access is blocked, CSRF failures are rejected, disabled users cannot login, and role boundaries are enforced. |
| Data integrity pass | Schema constraints, enum literals, transaction rollback, upsert behaviour, and deterministic ordering are verified. |
| Workflow pass | Blueprint, experiment, job, model, Public Hub, and user-management workflows behave as expected under valid and invalid conditions. |
| Frontend pass | Views render correct states, validations appear, protected routes redirect, and user interactions invoke expected APIs. |
| Failure handling pass | Expected failures produce controlled JSON or UI error states rather than crashes. |
| Evidence completeness | Test command output, pass/fail counts, and coverage reports should be recorded in the final submission after executing the tests. |

## 7.3 Unit Testing

### 7.3.1 Overview

Unit testing focuses on individual components and functions. Backend unit tests isolate domain entities, value objects, validators, services, repositories, strategies, and infrastructure adapters. Frontend unit tests isolate views, reusable components, API wrappers, route guards, and form validation behaviour.

### 7.3.2 Unit Testing

Representative backend unit test pseudocode:

```text
construct object or service under test
provide valid input
call target method
assert expected output fields
provide invalid input
assert validation error or exception
assert no unwanted side effects occurred
```

Representative frontend unit test pseudocode:

```text
mock API response and auth state
render component
assert expected content is visible
simulate user interaction
assert API called with expected payload
assert success, error, loading, or empty state appears
```

### 7.3.3 Unit Test Plan

Backend unit test plan:

| No. | Test File | Category | Purpose |
| --- | --- | --- | --- |
| 1 | backend/tests/__init__.py | General backend | Marks the backend test folder as a Python package. |
| 2 | backend/tests/database/test_schema_constraints.py | Database schema | Verifies database primary keys, foreign keys, unique constraints, and check constraints match the expected ERD. |
| 3 | backend/tests/database/test_schema_enums.py | Database schema | Verifies enum names and literal values match the ERD contract. |
| 4 | backend/tests/database/test_schema_naming.py | Database schema | Verifies strict table and column naming conventions, including exact table set and PascalCase columns. |
| 5 | backend/tests/domain/test_blueprint_entity.py | Domain objects | Verifies `Blueprint` domain field roundtrips and approval-state literals. |
| 6 | backend/tests/domain/test_btcusdt_kline_entity.py | Domain objects | Verifies `BTCUSDTKline` domain field roundtrips. |
| 7 | backend/tests/domain/test_experiment_entity.py | Domain objects | Verifies `Experiment` domain field roundtrips, interval/status literals, and that split constraints are not enforced inside the plain dataclass. |
| 8 | backend/tests/domain/test_experiment_log_entity.py | Domain objects | Verifies `ExperimentLog` domain field roundtrips. |
| 9 | backend/tests/domain/test_favorites_entities.py | Domain objects | Verifies favorite model and favorite blueprint domain link objects. |
| 10 | backend/tests/domain/test_model_entity.py | Domain objects | Verifies `Model` domain field roundtrips. |
| 11 | backend/tests/domain/test_user_entity.py | Domain objects | Verifies `User` domain field roundtrips and role/status literal values. |
| 12 | backend/tests/domain/test_value_objects.py | Domain objects | Tests value-object helpers, immutability, non-persistence intent, constructor fields, and validation for job specs and queue positions. |
| 13 | backend/tests/executors/test_default_experiment_executor.py | Executors | Focuses on default executor data loading from persisted cache without refresh side effects. |
| 14 | backend/tests/infrastructure/test_binance_kline_client.py | Infrastructure adapters | Tests Binance kline normalization, request validation, pagination, UTC handling, retry behavior, malformed rows, and client initialization. |
| 15 | backend/tests/infrastructure/test_redis_job_queue.py | Infrastructure adapters | Tests Redis queue adapter enqueue snapshots, Redis error mapping, state normalization, and metadata detail formatting. |
| 16 | backend/tests/repositories/test_blueprint_repository.py | Repositories and unit of work | Tests blueprint repository add/get/list by user behavior. |
| 17 | backend/tests/repositories/test_experiment_log_repository.py | Repositories and unit of work | Tests experiment log repository add/list behavior and relationships. |
| 18 | backend/tests/repositories/test_experiment_repository.py | Repositories and unit of work | Tests experiment repository CRUD, list-by-user, status transitions, and current-stage truncation. |
| 19 | backend/tests/repositories/test_favorites_repositories.py | Repositories and unit of work | Tests add/list/remove behavior for favorite model and favorite blueprint repositories. |
| 20 | backend/tests/repositories/test_market_data_repository.py | Repositories and unit of work | Tests BTCUSDT kline upsert, range retrieval, inserted/updated counts, empty input, interval validation, and PostgreSQL projection bucketing. |
| 21 | backend/tests/repositories/test_model_repository.py | Repositories and unit of work | Tests model repository add/get/list by experiment. |
| 22 | backend/tests/repositories/test_unit_of_work.py | Repositories and unit of work | Tests transaction commit on success and rollback on exception. |
| 23 | backend/tests/repositories/test_user_repository.py | Repositories and unit of work | Tests user repository CRUD, search/count filters, and enum-backed status/role updates. |
| 24 | backend/tests/services/test_job_metadata_service.py | Services | Tests live job metadata reads, recent terminal metadata cache fallback, and cache expiry. |
| 25 | backend/tests/services/test_market_data_service.py | Services | Tests service-layer market data refresh summary and safe handling of Binance fetch failures. |
| 26 | backend/tests/services/test_queue_service.py | Services | Tests queue service delegation, unsupported job-type rejection, and read/remove/cancel methods. |
| 27 | backend/tests/strategies/test_data_split_strategy.py | Strategies | Tests split strategies and leakage protections: chronological split, random reproducibility, seed behavior, indicator/target split isolation, train-only scaling, and log transform output scaling. |
| 28 | backend/tests/strategies/test_experiment_cancellation_handler.py | Strategies | Tests experiment cancellation handler type support and registry resolution. |
| 29 | backend/tests/strategies/test_target_strategy.py | Strategies | Tests indicator/target generation, binary target outputs, target-specific behavior, lookahead validation, quantile validation, and train-only scaler fitting. |
| 30 | backend/tests/test_access_control_service.py | Security and access | Tests access-control role checks, owner/profile access, user-management matrix, and assignable-role matrix. |
| 31 | backend/tests/test_architecture_factory.py | General backend | Tests architecture factory registration, invalid architecture rejection, metadata constraints, indicator/target metadata constraints, prediction contracts, ridge single-class handling, backtest compatibility, null class weight, and blueprint normalization. |
| 32 | backend/tests/test_authentication_controller.py | Security and access | Tests registration, duplicate rejection, username rules, login cookies, zero session timeout, invalid/disabled login, current-user endpoint, and logout behavior. |
| 33 | backend/tests/test_blueprint_approval_controller.py | Blueprint workflow | Tests blueprint approval request, moderator transitions, rejection/disapproval rules, and invalid pending disapproval. |
| 34 | backend/tests/test_blueprint_controller.py | Blueprint workflow | Tests draft creation defaults, session-cookie authorization, field-level validation, detail/favorite/unfavorite persistence, and staff access to pending moderation detail. |
| 35 | backend/tests/test_blueprint_validator.py | Blueprint workflow | Tests blueprint validator success and errors for scalers, custom indicators, missing names, unsupported indicators, invalid ranges, unsupported architecture, invalid settings, multiple errors, and non-object sections. |
| 36 | backend/tests/test_blueprints_library_controller.py | Blueprint workflow | Tests owned/favorited blueprint listings and hides disapproved blueprints from non-owners. |
| 37 | backend/tests/test_csrf_hardening.py | Security and access | Tests CSRF protection returns JSON errors for missing tokens and allows valid tokens. |
| 38 | backend/tests/test_custom_indicators.py | General backend | Tests custom indicator metadata exposure, blueprint factory normalization, and pipeline execution for new custom indicators. |
| 39 | backend/tests/test_default_experiment_executor.py | Experiment and job workflow | Tests default executor cache loading, insufficient cache errors, full-day datetime bounds, candle order preservation, round-log caps, and template method order. |
| 40 | backend/tests/test_documentation_controller.py | General backend | Tests documentation list/detail authentication and missing slug handling. |
| 41 | backend/tests/test_experiment_compiler.py | Experiment and job workflow | Tests compiled experiment snapshot generation, override merging, deterministic permutations/hashes, disallowed overrides, CSV parsing, cap enforcement, fixed/range/allowed-value overrides, immutability, scaler preservation, and multiple error reporting. |
| 42 | backend/tests/test_experiment_controller.py | Experiment and job workflow | Tests experiment blueprint options, creation, auth, validation, concurrency limits, persistence, permutation caps, ownership, date parsing, candlestick amount mode, queue errors, status normalization, stale queue reconciliation, detail counts, route redirects, and unexpected error JSON. |
| 43 | backend/tests/test_experiment_log_repository_metrics.py | Experiment and job workflow | Tests persistence of structured metrics logs through the experiment log repository. |
| 44 | backend/tests/test_experiment_validator.py | Experiment and job workflow | Tests experiment validator success and failures around required fields, ordering, split totals, intervals, blueprint accessibility, staff access, overrides, and candlestick mode. |
| 45 | backend/tests/test_experiment_worker.py | Experiment and job workflow | Tests experiment worker payload validation, missing experiment handling, successful execution, dict executor results, and failed status on executor errors. |
| 46 | backend/tests/test_job_cancellation_strategy.py | Experiment and job workflow | Tests queued and running experiment cancellation behavior and idempotency. |
| 47 | backend/tests/test_job_controller.py | Experiment and job workflow | Tests queue job detail access, unauthorized detail blocking, queued job cancellation, and accessible job listing. |
| 48 | backend/tests/test_logs_download_rfc011.py | General backend | Tests completed public experiment export authorization and rejects exports for incomplete experiments. |
| 49 | backend/tests/test_market_data_controller.py | Market data and feature engineering | Tests BTCUSDT kline endpoints, target preview behavior, interval handling, JSON-safe summaries, admin cache controls, metadata, catch-up status, stop, and clear protections. |
| 50 | backend/tests/test_market_data_scripts.py | Market data and feature engineering | Tests market-data CLI scripts for refresh, ingestion chunking, failure handling, resume/reconcile behavior, gap repair, range validation, and cleanup preservation. |
| 51 | backend/tests/test_market_data_service.py | Market data and feature engineering | Tests main market data service refresh validation, fetch/persistence failures, repository requirements, and cached timestamp accessors. |
| 52 | backend/tests/test_metrics_and_logs.py | Models, metrics, and rankings | Tests backtest metrics/log schemas, Sharpe, confusion metrics, continuous metrics, reproducibility logs, round-log endpoints/regeneration/errors, parameter correlation defaults, long-only trading semantics, and confusion edge cases. |
| 53 | backend/tests/test_model_controller.py | Models, metrics, and rankings | Tests model detail privacy, rankings sort/filter/library/favorites, pagination before log joins, flexible filters, null metric sorting, highlights, page-only metric population, and backtest metric sort/filter. |
| 54 | backend/tests/test_public_hub_controller.py | Public hub | Tests public hub visibility/search and public profiles returning only public artifacts. |
| 55 | backend/tests/test_session_service.py | Security and access | Tests in-memory server session expiry purge and zero-timeout non-expiring sessions. |
| 56 | backend/tests/test_system_controller.py | System administration | Tests system admin endpoints for queue snapshot, settings, events, request tracing, global feed defaults, and event CSV download. |
| 57 | backend/tests/test_talib_indicator_strategy.py | Market data and feature engineering | Tests TA-Lib indicator input signatures, selected indicator output columns, malformed/list param rejection, warmup cleanup, and decimal-column finite checks. |
| 58 | backend/tests/test_target_strategy_factory.py | Market data and feature engineering | Tests target strategy factory discovers target modules dynamically. |
| 59 | backend/tests/test_user_controller.py | User management | Tests profile endpoints, staff listing/filtering, audit access/history, missing audit user, staff management constraints, normal user blocking, username validation, moderator limits, immediate role effects, create-user validation, and admin role alias normalization. |
| 60 | backend/tests/test_versioning_service.py | General backend | Tests blueprint versioning: never-submitted drafts update in place and reviewed blueprints create new versions. |
| 61 | backend/tests/workers/test_experiment_worker.py | Workers | Worker-focused duplicate/narrow tests for payload validation, successful handling, and failure marking. |

Frontend unit test plan:

| No. | Test File | Category | Purpose |
| --- | --- | --- | --- |
| 1 | frontend/tests/__mocks__/d3.ts | Shared UI components | Provides a lightweight D3 mock for tests that import chart helpers without needing real D3 DOM behavior. |
| 2 | frontend/tests/admin-placeholder-views.test.tsx | Administration UI | Smoke-tests admin-related placeholder/section views for system management, blueprint moderation, and job detail lifecycle sections. |
| 3 | frontend/tests/api-client-csrf.test.ts | API integration | Verifies unsafe API methods fetch and attach CSRF tokens. |
| 4 | frontend/tests/auth-guards.test.tsx | Authentication UI | Tests client auth guards for unauthenticated redirects, unauthorized role redirects, and allowed admin access. |
| 5 | frontend/tests/base-and-states.test.tsx | Shared UI components | Checks shared layout/state components render normal, loading, error, empty, default, and custom content states. |
| 6 | frontend/tests/blueprint-library-detail-moderation.test.tsx | Blueprint UI | Covers blueprint library tabs, blueprint detail status/lineage/favorite behavior, and moderation queue actions. |
| 7 | frontend/tests/blueprint-wizard-view.test.tsx | Blueprint UI | Tests blueprint wizard navigation, validation, submission, backend validation display, metadata-backed parameter constraints, tokenized inputs, dropdown tokens, and architecture parameter validation. |
| 8 | frontend/tests/btcusdt-price-chart.test.tsx | Dashboard and chart UI | Tests BTCUSDT chart states and lightweight-charts integration behavior. |
| 9 | frontend/tests/dashboard-view.test.tsx | Dashboard and chart UI | Checks dashboard cards, quick links, BTCUSDT interval selection, chart hook arguments, loading state, and fallback live stats. |
| 10 | frontend/tests/dialog-and-responsive.test.tsx | Shared UI components | Smoke-tests dialog open/close interaction and responsive app shell classes. |
| 11 | frontend/tests/documentation-view.test.tsx | Documentation UI | Verifies documentation list and selected document detail render from mocked backend responses. |
| 12 | frontend/tests/experiment-detail-view.test.tsx | Experiment UI | Tests experiment detail configuration rendering, expanded risk chart modal, leaderboard pagination, model detail popup, round-log CSV progress, and completed download actions. |
| 13 | frontend/tests/experiment-list-view.test.tsx | Experiment UI | Tests debounced experiment search/status filters and graceful network error rendering. |
| 14 | frontend/tests/experiment-wizard-view.test.tsx | Experiment UI | Broad test coverage for the experiment wizard: dataset preview, reused model prefill, override normalization, blueprint selection/preview, grouped overrides, validation, cached bounds, intervals, split controls, deterministic seed, target preview, target constraints, metadata hydration, permutation caps, submit, back navigation, and backend field errors. |
| 15 | frontend/tests/job-detail-view.test.tsx | Administration UI | Tests job detail rendering and friendly not-found handling. |
| 16 | frontend/tests/login-view.test.tsx | Authentication UI | Tests login validation, blocked invalid submit, successful submit, auth refresh, and dashboard redirect. |
| 17 | frontend/tests/model-views.test.tsx | Model UI | Tests model ranking and detail screens: ranking rows, detail links, sorting, search/filter serialization, filter operator restrictions, numeric formatting, API errors, include-incomplete toggle, optimistic unfavorite removal, and detail metric/log rendering. |
| 18 | frontend/tests/navigation.test.tsx | Routing and navigation | Tests visible nav items, route targets, role filtering, topbar sign-out routing, guest nav, and admin dropdown visibility. |
| 19 | frontend/tests/public-hub-view.test.tsx | Public hub UI | Tests public hub data loading and tab switching. |
| 20 | frontend/tests/registration-view.test.tsx | Authentication UI | Tests registration validation, blocked invalid submit, successful payload submit, and redirect to login. |
| 21 | frontend/tests/routes-rendering.test.tsx | Routing and navigation | Verifies major route components render and route wrappers use the expected auth or role guard. |
| 22 | frontend/tests/status-badges.test.tsx | Shared UI components | Tests generic status badge tone mapping and user role/status wrapper normalization. |
| 23 | frontend/tests/system-management-view.test.tsx | Administration UI | Tests system management queue display, empty queue state, settings controls, terminal truncation/download link, BTCUSDT cache controls, catch-up failure display, and stop catch-up behavior. |
| 24 | frontend/tests/user-management-view.test.tsx | Administration UI | Tests user-management RBAC UI: create errors, hidden normal-user actions, moderator-limited actions, full admin actions, list endpoint errors, and audit trail rendering. |
| 25 | frontend/tests/wizard-view.test.tsx | Shared UI components | Tests shared wizard layout: step chips, current step header, summary/footer slots, and responsive structure. |

### 7.3.4 Unit Test Data

| Unit Test Group | Data Used | Expected Assertion |
| --- | --- | --- |
| Domain entity tests | Sample entity fields for User, Blueprint, Experiment, Model, ExperimentLog, BTCUSDTKline, and favorites. | Fields roundtrip correctly and enum literals match expected values. |
| Value-object tests | ValidationResult, ExecutionResult, JobSpecification, QueuePosition. | Success/failure helpers work; frozen objects cannot be mutated; invalid values raise errors. |
| Validator tests | Valid and invalid Blueprint/experiment payloads. | Valid payloads pass; invalid fields produce structured errors without crash. |
| Repository tests | Temporary users, Blueprints, experiments, models, logs, klines, and favorite links. | Rows persist, query correctly, update correctly, and delete/unfavorite correctly. |
| Strategy tests | Sample time-series OHLCV frames. | Splits are chronological; indicators and targets do not leak across splits; scaling uses train data only. |
| Infrastructure tests | Mock Binance pages and Redis command responses. | Pagination, retry, normalization, metadata, and error mapping behave correctly. |
| Frontend component tests | Mocked auth states, routes, API responses, and user events. | Views render correct states and call expected API functions. |
| Chart tests | Mocked candle arrays and chart library functions. | Chart receives candle data, updates latest bar, and cleans up on unmount. |

### 7.3.5 Unit Testing Summary

The unit tests provide broad coverage of implemented backend and frontend modules. They verify field-level correctness, validation rules, permission logic, data transformations, repository persistence, UI state rendering, and error handling. The strongest unit-level coverage is present in authentication, Blueprint governance, experiment validation, data splitting, market data, model metrics, route guards, frontend wizards, and system-management views.

## 7.4 Integration Testing

### 7.4.1 Overview

Integration testing verifies interaction across multiple implemented layers. In BEE, integration points include frontend API wrappers to backend responses, backend controllers to services, services to repositories, repositories to database sessions, and controllers to queue adapters.

### 7.4.2 Integration Test Plan

| Integration Scenario | Modules Involved | Expected Result |
| --- | --- | --- |
| Registration and login | Frontend login/registration views, authentication controller, session service, user repository. | Valid users can register/login; invalid or disabled users are rejected. |
| Blueprint creation | Blueprint wizard, API client, Blueprint controller, Blueprint validator, Blueprint repository. | Valid draft persists; invalid payload returns field errors rendered by frontend. |
| Blueprint moderation | Moderation view, approval controller, access control, versioning service, Blueprint repository. | Staff can approve/reject/disapprove according to valid state transitions. |
| Experiment creation | Experiment wizard, experiment controller, experiment validator, compiler, queue service, experiment repository. | Valid configuration creates experiment and queue job; invalid input or queue failure returns structured error. |
| Market-data preview | Dashboard/chart/experiment wizard, market-data controller, market-data service, market-data repository. | Cached data and preview summaries render correctly; invalid ranges are rejected. |
| Job detail and cancellation | Job detail view, job controller, queue service, cancellation strategy, experiment repository. | Owner can view/cancel accessible jobs; unrelated users are blocked. |
| Model ranking | Model views, model controller, model repository, log repository. | Models are sorted, filtered, paginated, and rendered with metrics. |
| Public Hub discovery | PublicHubView, PublicHubController, user/model/experiment/Blueprint repositories. | Only public/approved/enabled artifacts appear. |

### 7.4.3 Integration Test Data

Integration test data combines multiple entities. For example, an experiment integration test requires at least one user, one accessible Blueprint, valid experiment configuration, market-data availability or mocked cache, queue response, and expected experiment/job records.

| Scenario | Required Data |
| --- | --- |
| Blueprint moderation | Owner user, moderator user, DRAFT/PENDING/APPROVED Blueprint records. |
| Experiment creation | Authenticated user, approved Blueprint, valid date range, interval, split values, override payload, mocked queue result. |
| Model ranking | Completed experiments, generated models, metric logs, public/private visibility flags. |
| Public Hub | Enabled/disabled users, successful/incomplete experiments, approved/rejected Blueprints, public/private models. |
| Market data | Cached BTCUSDT candles, invalid intervals, date ranges, metadata bounds. |
| User management | Normal users, moderators, administrators, disabled users, duplicate identity inputs. |

### 7.4.4 Integration Testing Boundary

The integration tests focus on the implemented prototype. External live dependencies are mocked where appropriate. Binance API calls are simulated with mocked pages and retry behaviours. Redis commands are mocked or tested through queue adapter behaviour. Frontend tests mock backend responses rather than requiring a full browser-driven deployment.

### 7.4.5 Integration Test Results

The attached artefacts describe the intended and implemented test coverage but do not include raw execution output. The final report should include the actual command output after running the tests.

| Result Item | Current Documentation Status | Recommended Final Evidence |
| --- | --- | --- |
| Backend pass/fail count | Test files and pseudocode are documented. | Paste pytest summary with passed/failed/skipped counts. |
| Frontend pass/fail count | Test files and pseudocode are documented. | Paste Jest summary with passed/failed/skipped counts. |
| Coverage report | Not shown in provided artefacts. | Add statement or screenshot from pytest-cov and Jest coverage if available. |
| Integration result | Covered by controller/service/repository/UI tests. | Add explicit pass/fail table after execution. |
| Known failures | Not shown in provided artefacts. | Document failed/skipped tests and reason, if any. |

### 7.4.6 Integration Testing Summary

Integration coverage is strong for implemented web workflows, particularly authentication, Blueprint governance, experiment configuration, queueing, model ranking, Public Hub, and user management. The main improvement needed for final submission is to include real test execution evidence.

## 7.5 System Testing

### 7.5.1 Overview

System testing evaluates the complete prototype from a user workflow perspective. While unit and integration tests verify components, system tests confirm that the implemented system supports realistic user tasks.

### 7.5.2 System Test Scope

| In Scope | Out of Scope |
| --- | --- |
| Register, login, logout, and current-user session behaviour. | Live exchange login or external identity provider integration. |
| Role-based navigation and protected route access. | Enterprise SSO and multi-tenant organization management. |
| Create, validate, favorite, submit, approve, reject, and version Blueprints. | External Blueprint marketplace publication. |
| Create experiments using accessible Blueprints and valid configuration. | Live trading deployment or real order execution. |
| Queue job, view job detail, cancel queued/running job, and inspect worker state. | Distributed compute cluster orchestration. |
| View model rankings, details, metrics, logs, and downloads. | Financial performance guarantee or live portfolio P&L. |
| Use Public Hub discovery and public profile views. | Unauthenticated public internet sharing. |

### 7.5.3 End-to-End User Workflow Testing

| Workflow | Steps | Expected Result |
| --- | --- | --- |
| Normal user onboarding | Register → login → reach dashboard → view navigation. | User is authenticated and sees normal-user navigation. |
| Blueprint authoring | Create Blueprint → fill wizard → submit valid payload → open detail. | Draft Blueprint persists and detail view renders. |
| Blueprint approval | Owner submits approval → moderator opens queue → approves Blueprint. | Blueprint changes to APPROVED and becomes publicly visible. |
| Experiment creation | Select approved Blueprint → configure interval/date/split/overrides → submit. | Experiment record and queue job are created. |
| Job monitoring | Open job detail → observe status → cancel if pending/running. | Job state is visible and cancellation is controlled. |
| Model review | Open completed experiment → view model leaderboard → open model detail. | Metrics, parameters, logs, and detail content render. |
| Discovery | Open Public Hub → switch users/experiments/models/Blueprint tabs. | Only permitted public artifacts appear. |
| Staff administration | Admin opens user management → filters users → changes allowed user state. | Admin action succeeds; unauthorized actions are hidden or blocked. |

### 7.5.4 Authentication and Access System Testing

System-level authentication and access tests verify that user roles behave consistently across backend and frontend.

```text
login as normal user
attempt to open staff route
expect redirect or access denied
login as moderator
open moderation route
expect moderation view visible
attempt admin-only operation
expect blocked action
login as administrator
open system management
expect full admin controls visible
```

### 7.5.5 Frontend System Testing

Frontend system testing verifies that the application is usable and consistent across major screens.

| Frontend Area | System-Level Check |
| --- | --- |
| Application shell | Navigation links appear according to role; sign-out routes to login. |
| Wizards | Step navigation, validation, summary, and submit behaviour work. |
| Lists and details | Search, filters, pagination, links, and detail popups operate correctly. |
| State handling | Loading, empty, error, and success states render clearly. |
| Responsive layout | Application shell and dialogs maintain usable layout across screen sizes. |
| Charts | BTCUSDT chart renders candle data and handles updates/cleanup. |

### 7.5.6 Blueprint Governance System Testing

Blueprint governance system tests confirm that lifecycle rules work end to end.

```text
normal user creates draft Blueprint
normal user edits draft in place
normal user submits for approval
moderator approves pending Blueprint
normal user edits reviewed Blueprint
system creates new version instead of mutating approved artifact
moderator disapproves approved Blueprint
system generates editable remediation draft
```

### 7.5.7 Persistence and Data Integrity System Testing

Persistence system testing verifies that data remains consistent across related operations.

| Persistence Scenario | Expected Result |
| --- | --- |
| User creation | Duplicate username/email is rejected and password hash is stored safely. |
| Experiment creation | Experiment, compiled configuration, queue metadata, and status are persisted consistently. |
| Transaction rollback | Partial writes are rolled back when an exception occurs. |
| Market-data upsert | Duplicate candles are updated rather than inserted as duplicates. |
| Favorites | Favorite links are added once and removed cleanly. |
| Logs | Nested metric payloads persist and reload without structure loss. |

### 7.5.8 Current Experiment Boundary System Testing

The current implementation boundary should be tested explicitly so the system does not imply unsupported production behaviour.

| Boundary | System Test |
| --- | --- |
| BTCUSDT-only data | Attempt invalid symbol or interval and expect rejection. |
| Historical/cache-based data | Experiment data loading uses persisted cache and does not silently refresh during executor load. |
| Long-only evaluation | Short signals and overlapping long entries are rejected or handled according to long-only rules. |
| No live trading | No order-placement endpoint or live execution action is exposed in UI or API. |
| Queue limits | Configured concurrency limit is respected and queue position is displayed. |
| Incomplete experiment export | Exports for incomplete experiments are rejected. |

### 7.5.9 Out-of-Scope System Tests for Current Version

| Out-of-Scope Test | Reason |
| --- | --- |
| Live exchange order execution | The prototype is research-oriented and does not execute real orders. |
| Brokerage integration test | Broker connectivity is excluded from the current system boundary. |
| High-frequency tick processing test | Sub-second and tick-level trading are outside the implementation scope. |
| Distributed cluster stress test | Single-server queueing is implemented; distributed compute is not required. |
| Production failover test | High-availability production deployment is outside the prototype boundary. |
| Real money P&L verification | The system computes research metrics, not live financial account results. |

### 7.5.10 System Testing Summary

System testing confirms that the implemented prototype supports its intended user-facing workflows while respecting its research-only boundary. The recommended final report should include screenshots or execution logs for at least the major workflows: login, Blueprint creation, moderation, experiment creation, job detail, model ranking, Public Hub, and user management.

## 7.6 Security Testing

### 7.6.1 Authentication Testing

Authentication testing verifies registration, login, invalid credentials, disabled accounts, current-user lookup, logout, and session cookie behaviour.

```text
submit valid registration
assert password is hashed and safe user response returned
submit duplicate username or email
assert validation error
login with valid credentials
assert session cookie is set
login with invalid or disabled user
assert unauthorized or forbidden response
logout
assert session invalidated
```

### 7.6.2 Authorization Testing

Authorization testing verifies role helpers, owner access, staff access, user-management matrix, assignable-role matrix, route guards, and hidden frontend actions.

| Role | Expected Authorization Behaviour |
| --- | --- |
| Normal User | Can access own profile and normal authenticated features; cannot access staff routes or staff actions. |
| Moderator | Can access moderation and limited user-management functions; cannot perform unrestricted admin-only operations. |
| Administrator | Can access full system management and user-management operations. |
| Owner | Can access owned artifacts even when not publicly visible. |
| Non-owner | Can access only public/approved/successful artifacts according to visibility rules. |

### 7.6.3 CSRF Testing

CSRF testing verifies that unsafe operations require tokens.

```text
login or create authenticated test session
send unsafe POST without CSRF token
expect JSON error code CSRF_FAILED
fetch CSRF token
send unsafe POST with valid token
expect state change succeeds
```

### 7.6.4 Database Security Testing

Database security testing verifies parameterized query construction and rejects unsafe query construction patterns.

| Database Security Control | Testing Evidence |
| --- | --- |
| Parameterized statements | Database query construction pathways are expected to use parameterized statements. |
| No string interpolation | Query construction using direct string interpolation is prohibited. |
| Schema constraints | Primary, foreign, unique, and check constraints reduce invalid persisted states. |
| Transaction rollback | Unit-of-work rollback prevents partial writes after exceptions. |
| Access-filtered queries | Public hub, model detail, Blueprint library, and user-management queries filter by ownership, role, and visibility. |

## 7.7 Data Validation Testing

### 7.7.1 Market Data Quality Testing

Market-data tests verify BTCUSDT kline normalization, request validation, pagination, UTC handling, retry behaviour, malformed-row rejection, repository upsert, range retrieval, empty input behaviour, interval validation, and PostgreSQL projection bucketing.

```text
normalize raw kline row
assert timestamp, Decimal price fields, and volume fields
fetch paginated pages
assert next request advances time window
reject invalid symbol, interval, or date range before API call
upsert candle rows
assert inserted and updated counts are correct
query range
assert rows are ordered by timestamp
```

### 7.7.2 Dataset Splitting Validation

Dataset splitting validation verifies temporal integrity.

| Validation Rule | Expected Behaviour |
| --- | --- |
| Chronological boundary | Training, validation, and test splits maintain time order. |
| Reproducible random split | Same seed produces same split; different seed produces different split. |
| Indicator isolation | Indicator generation for one split does not consume rows from another split. |
| Target isolation | Target generation respects split boundaries and look-ahead validation. |
| Train-only scaling | Scaler is fitted on training data and applied to validation/test data without leakage. |

### 7.7.3 Feature Engineering Validation

Feature engineering tests verify indicator input signatures, output columns, malformed parameter rejection, warmup cleanup, decimal-column finite checks, dynamic target strategy discovery, and target output rules.

```text
for each supported indicator:
    apply indicator to sample OHLCV frame
    assert expected output feature columns exist
    reject malformed numeric or list parameters
after warmup cleanup:
    assert invalid warmup rows are removed
for each target strategy:
    assert target values are binary or null where expected
```

## 7.8 Model and Evaluation Testing

### 7.8.1 Evaluation Metrics Testing

Metrics tests verify backtest schema, annualized Sharpe, confusion schema, binary metrics, continuous metrics, reproducibility logs, round-log regeneration, parameter correlation defaults, long-only trading semantics, drawdown, compounding, and confusion edge cases.

| Metric / Evaluation Area | Expected Validation |
| --- | --- |
| Sharpe ratio | Annualized Sharpe field is calculated and present in expected schema. |
| Confusion metrics | Binary confusion statistics and edge cases are handled. |
| Continuous metrics | Continuous model output metrics are present where required. |
| Reproducibility logs | Logs are deterministic for identical inputs. |
| Round logs | Persisted and regenerated round logs are handled, including missing/error cases. |
| Long-only behaviour | Entry, exit, lag, compounding, drawdown, and force-close cases follow long-only semantics. |
| Parameter correlation | Default behaviour is stable when correlation metric is unavailable. |

### 7.8.2 Parameter Permutation Testing

Parameter permutation testing verifies deterministic experiment compilation.

```text
build Blueprint configuration
build override payload
compile experiment plan
assert source Blueprint is not mutated
assert fixed, range, list, and CSV values expand correctly
assert permutation hashes are deterministic
assert disallowed or conflicting overrides return errors
assert cap clamps or rejects excessive permutations
edit Blueprint after compile
assert compiled snapshot remains unchanged
```

### 7.8.3 Model Ranking Testing

Model ranking tests verify privacy, sorting, filtering, pagination, metric loading, highlights, null metric handling, and frontend rendering.

| Ranking Behaviour | Expected Result |
| --- | --- |
| Privacy | Private models are blocked from unauthorized users. |
| Sorting | Rankings sort by selected metric fields. |
| Filtering | Search and flexible filters serialize correctly and return matching rows. |
| Pagination | Pagination occurs before expensive log joins. |
| Null metrics | Incomplete/null metric rows are handled gracefully. |
| Highlights | SQL-limited highlight results are returned. |
| Frontend rendering | Ranking rows, sortable headings, detail links, and metric/log detail render correctly. |

## 7.9 Performance Testing

Performance testing should verify that the system meets the non-functional expectations for responsiveness, queue feedback, and concurrent job limits. The attached artefacts include concurrency-limit and status-feedback tests, but final benchmark output should be added after execution.

| Performance Area | Test Method | Expected Evidence |
| --- | --- | --- |
| Authentication response | Measure login endpoint response under normal load. | Average and worst-case response time. |
| Job request acknowledgment | Submit experiment creation request with mocked or available queue. | Acknowledgment time and returned job ID. |
| Queue-position feedback | Request job metadata while jobs are queued. | Queue position response time. |
| Concurrent jobs | Submit up to configured limit of experiment jobs. | System enforces concurrency limit and returns stable queue state. |
| Frontend navigation | Measure route transition/render time for major views. | No perceptible delay for normal navigation. |
| Large model ranking page | Load rankings with pagination and filters. | Pagination prevents excessive slowdowns. |

Performance test pseudocode:

```text
start backend, database, Redis, and worker
seed required test data
for n in 1..10:
    submit experiment job
record acknowledgment time
poll job queue metadata
record queue feedback time
assert no request exceeds accepted threshold
assert concurrency limit is respected
```

## 7.10 Usability Testing

### 7.10.1 User Interface Testing

Usability-oriented frontend tests verify that users receive clear feedback during normal and abnormal interaction.

| UI Usability Area | Testing Focus |
| --- | --- |
| Form validation | Login, registration, Blueprint wizard, and experiment wizard block invalid submissions and display errors. |
| Loading state | Views display loading states while data is being fetched. |
| Error state | Network or backend failures produce readable error messages. |
| Empty state | Empty lists or missing data render explicit empty-state messages. |
| Wizard navigation | Current, completed, and upcoming steps are visible. |
| Friendly missing resources | Job detail view displays a friendly not-found message. |
| Role clarity | Navigation and actions are hidden or shown according to role. |
| Responsive layout | Application shell and dialogs maintain responsive class structure. |

### 7.10.2 User Feedback Summary

For the final report, user feedback should be collected through a short structured evaluation. The test artefacts verify functional UI behaviour, while user feedback should verify clarity and perceived usability.

| Feedback Question | Purpose |
| --- | --- |
| Was the login and registration flow understandable? | Evaluate onboarding clarity. |
| Was the Blueprint wizard easy to follow? | Evaluate multi-step configuration usability. |
| Were validation errors clear? | Evaluate error recovery. |
| Was the experiment wizard understandable? | Evaluate configuration workflow. |
| Could users find models, Blueprints, and Public Hub items? | Evaluate discovery flow. |
| Could staff users understand moderation and user-management screens? | Evaluate administrative usability. |

## 7.11 Acceptance Testing

### 7.11.1 Acceptance Test Plan

| Acceptance Test | Acceptance Criteria |
| --- | --- |
| AT-01 Authentication | User can register, login, view current session, and logout; invalid or disabled login is rejected. |
| AT-02 RBAC | Normal, Moderator, and Administrator users see only permitted routes and actions. |
| AT-03 Blueprint draft | Authenticated user can create and validate a Blueprint draft. |
| AT-04 Blueprint moderation | Moderator or Administrator can approve/reject/disapprove according to valid state rules. |
| AT-05 Blueprint versioning | Reviewed Blueprint edits create a new version while preserving lineage. |
| AT-06 Experiment creation | User can create an experiment using an accessible Blueprint and valid split/date/interval settings. |
| AT-07 Queue handling | Experiment submission creates job metadata; job status and cancellation behave correctly. |
| AT-08 Market data | BTCUSDT cache can be retrieved/refreshed and invalid requests are rejected. |
| AT-09 Model ranking | Completed models appear in rankings with metrics, filters, and detail views. |
| AT-10 Public Hub | Only enabled users, successful experiments, successful models, and approved Blueprints appear. |
| AT-11 Security | CSRF, authorization, session, and database safety controls pass test cases. |
| AT-12 UI behaviour | Major views render loading, error, empty, and normal states correctly. |

### 7.11.2 Requirements Traceability

| Requirement / Feature Area | Backend Evidence | Frontend Evidence | Acceptance Status |
| --- | --- | --- | --- |
| Authentication | test_authentication_controller.py, test_session_service.py | login-view.test.tsx, registration-view.test.tsx, auth-guards.test.tsx | Pass when tests execute successfully. |
| Authorization and RBAC | test_access_control_service.py, test_user_controller.py | auth-guards.test.tsx, navigation.test.tsx, user-management-view.test.tsx | Pass when role boundaries are enforced. |
| Blueprint authoring | test_blueprint_controller.py, test_blueprint_validator.py | blueprint-wizard-view.test.tsx | Pass when valid drafts persist and invalid drafts show field errors. |
| Blueprint moderation | test_blueprint_approval_controller.py, test_versioning_service.py | blueprint-library-detail-moderation.test.tsx | Pass when state transitions and lineage rules hold. |
| Experiment configuration | test_experiment_controller.py, test_experiment_validator.py, test_experiment_compiler.py | experiment-wizard-view.test.tsx | Pass when validation, overrides, and permutations work. |
| Queue and worker | test_queue_service.py, test_redis_job_queue.py, test_experiment_worker.py, test_job_controller.py | job-detail-view.test.tsx, system-management-view.test.tsx | Pass when job state and cancellation work. |
| Market data | test_binance_kline_client.py, test_market_data_repository.py, test_market_data_controller.py, test_market_data_scripts.py | btcusdt-price-chart.test.tsx, dashboard-view.test.tsx | Pass when cache, chart, metadata, and validation work. |
| Data split and feature engineering | test_data_split_strategy.py, test_target_strategy.py, test_talib_indicator_strategy.py | experiment-wizard-view.test.tsx target preview checks | Pass when leakage controls and target previews work. |
| Model metrics and ranking | test_metrics_and_logs.py, test_model_controller.py, test_architecture_factory.py | model-views.test.tsx, experiment-detail-view.test.tsx | Pass when rankings and metrics render correctly. |
| Public discovery | test_public_hub_controller.py | public-hub-view.test.tsx | Pass when only public artifacts are shown. |
| System administration | test_system_controller.py, test_market_data_controller.py | system-management-view.test.tsx, admin-placeholder-views.test.tsx | Pass when settings, events, queue, and cache controls work. |
| Documentation | test_documentation_controller.py | documentation-view.test.tsx | Pass when Markdown list/detail content renders. |

## 7.12 Summary

This chapter presented the testing and evaluation plan for the BEE prototype. The documented tests provide broad coverage across backend and frontend layers. Backend tests verify schema rules, domain objects, repositories, services, infrastructure adapters, strategies, controllers, workers, market-data scripts, security controls, metrics, logs, and public discovery. Frontend tests verify route guards, API integration, reusable components, feature views, forms, wizards, charts, navigation, system management, and user management.

The test suite is sufficient to support an academic prototype evaluation when accompanied by real execution evidence. The final submission should include actual pytest and Jest output, pass/fail counts, skipped tests if any, and optional coverage reports. Performance and usability testing should also be documented with measured results or structured user feedback where available.
