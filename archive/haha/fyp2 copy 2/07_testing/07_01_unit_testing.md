# 7.1 Unit Testing

Unit testing was carried out to verify individual backend and frontend units before the modules were considered ready for integration. Backend unit tests are implemented with pytest under `backend/tests/`, while frontend unit/component tests are implemented with Jest and React Testing Library under `frontend/tests/`. The tests cover domain entities, repositories, validators, services, controllers, workers, frontend views, API client behaviour, route guards, chart states, status badges, and reusable UI states.

The purpose of this section is to show that individual units were tested against expected behaviour before being integrated into complete workflows. The test cases below are based on the actual test files present in the project source tree.

## 7.1.1 Test Plan

### Backend unit test plan

| No. | Test ID | Test Case Name | Test Date | Source test file(s) |
|---:|---|---|---|---|
| 1 | UT001 | User entity and authentication controller | 27 June 2026 | `backend/tests/domain/test_user_entity.py`, `backend/tests/test_authentication_controller.py` |
| 2 | UT002 | Access control, session service, and CSRF hardening | 27 June 2026 | `backend/tests/test_access_control_service.py`, `backend/tests/test_session_service.py`, `backend/tests/test_csrf_hardening.py` |
| 3 | UT003 | Blueprint entity, validator, controller, library, approval, and versioning | 27 June 2026 | `backend/tests/domain/test_blueprint_entity.py`, `backend/tests/test_blueprint_validator.py`, `backend/tests/test_blueprint_controller.py`, `backend/tests/test_blueprints_library_controller.py`, `backend/tests/test_blueprint_approval_controller.py`, `backend/tests/test_versioning_service.py` |
| 4 | UT004 | Experiment entity, validator, controller, compiler, executor, and worker | 27 June 2026 | `backend/tests/domain/test_experiment_entity.py`, `backend/tests/test_experiment_validator.py`, `backend/tests/test_experiment_controller.py`, `backend/tests/test_experiment_compiler.py`, `backend/tests/test_default_experiment_executor.py`, `backend/tests/test_experiment_worker.py` |
| 5 | UT005 | Strategy modules for indicators, targets, splits, metrics, and logs | 27 June 2026 | `backend/tests/test_custom_indicators.py`, `backend/tests/test_talib_indicator_strategy.py`, `backend/tests/strategies/test_target_strategy.py`, `backend/tests/test_target_strategy_factory.py`, `backend/tests/strategies/test_data_split_strategy.py`, `backend/tests/test_metrics_and_logs.py` |
| 6 | UT006 | Market data service, Binance client, repository, scripts, and controller | 27 June 2026 | `backend/tests/infrastructure/test_binance_kline_client.py`, `backend/tests/test_market_data_service.py`, `backend/tests/repositories/test_market_data_repository.py`, `backend/tests/test_market_data_controller.py`, `backend/tests/test_market_data_scripts.py` |
| 7 | UT007 | Queue service, Redis job queue, job controller, and cancellation strategies | 27 June 2026 | `backend/tests/services/test_queue_service.py`, `backend/tests/infrastructure/test_redis_job_queue.py`, `backend/tests/test_job_controller.py`, `backend/tests/test_job_cancellation_strategy.py`, `backend/tests/strategies/test_experiment_cancellation_handler.py` |
| 8 | UT008 | Model, experiment log, favourites, public hub, documentation, users, system, and database schema | 27 June 2026 | `backend/tests/domain/test_model_entity.py`, `backend/tests/domain/test_experiment_log_entity.py`, `backend/tests/domain/test_favorites_entities.py`, `backend/tests/test_model_controller.py`, `backend/tests/test_public_hub_controller.py`, `backend/tests/test_documentation_controller.py`, `backend/tests/test_user_controller.py`, `backend/tests/test_system_controller.py`, `backend/tests/database/` |

### Frontend unit/component test plan

| No. | Test ID | Test Case Name | Test Date | Source test file(s) |
|---:|---|---|---|---|
| 9 | UT009 | Authentication views, guards, registration, and login | 27 June 2026 | `frontend/tests/login-view.test.tsx`, `frontend/tests/registration-view.test.tsx`, `frontend/tests/auth-guards.test.tsx`, `frontend/tests/api-client-csrf.test.ts` |
| 10 | UT010 | Dashboard, routes, navigation, base states, dialogs, responsive layout, and status badges | 27 June 2026 | `frontend/tests/dashboard-view.test.tsx`, `frontend/tests/routes-rendering.test.tsx`, `frontend/tests/navigation.test.tsx`, `frontend/tests/base-and-states.test.tsx`, `frontend/tests/dialog-and-responsive.test.tsx`, `frontend/tests/status-badges.test.tsx` |
| 11 | UT011 | Blueprint wizard, blueprint library/detail, and moderation views | 27 June 2026 | `frontend/tests/blueprint-wizard-view.test.tsx`, `frontend/tests/blueprint-library-detail-moderation.test.tsx` |
| 12 | UT012 | Experiment wizard, experiment list, experiment detail, job detail, and BTCUSDT chart | 27 June 2026 | `frontend/tests/experiment-wizard-view.test.tsx`, `frontend/tests/experiment-list-view.test.tsx`, `frontend/tests/experiment-detail-view.test.tsx`, `frontend/tests/job-detail-view.test.tsx`, `frontend/tests/btcusdt-price-chart.test.tsx` |
| 13 | UT013 | Models, favourites, public hub, documentation, admin, and system views | 27 June 2026 | `frontend/tests/model-views.test.tsx`, `frontend/tests/favorites-library-view.test.tsx`, `frontend/tests/public-hub-view.test.tsx`, `frontend/tests/documentation-view.test.tsx`, `frontend/tests/user-management-view.test.tsx`, `frontend/tests/system-management-view.test.tsx`, `frontend/tests/admin-placeholder-views.test.tsx` |

## 7.1.2 Test Data

| Test ID | Test Case Name | Relevant Test Data |
|---|---|---|
| UT001 | User entity and authentication controller | Username, email, password, password hash, role, status, session cookie, login identifier. |
| UT002 | Access control, session service, and CSRF hardening | User role (`User`, `Moderator`, `Admin`), active/inactive status, session token, CSRF token, unsafe request methods. |
| UT003 | Blueprint entity, validator, controller, library, approval, and versioning | Blueprint name, description, architecture JSON, indicator configuration, features, approval state, version, parent id, owner id. |
| UT004 | Experiment entity, validator, controller, compiler, executor, and worker | Experiment name, BTCUSDT symbol, 1m interval, date range, train/validation/test split, blueprint id, parameter overrides, job id, status, progress. |
| UT005 | Strategy modules for indicators, targets, splits, metrics, and logs | OHLCV candles, indicator parameters, target lookahead values, split percentages, prediction arrays, confusion metrics, backtest log rows. |
| UT006 | Market data service, Binance client, repository, scripts, and controller | Binance kline response rows, BTCUSDT timestamp, open/high/low/close/volume, refresh range, inserted/updated counts, metadata request. |
| UT007 | Queue service, Redis job queue, job controller, and cancellation strategies | Job id, experiment id, queue name, job status, owner id, cancellation request, queue position, worker payload. |
| UT008 | Model, experiment log, favourites, public hub, documentation, users, system, and database schema | Model metrics, parameter hash, experiment log metrics, favourite pairs, public profile id, documentation slug, system setting key/value, system event data. |
| UT009 | Authentication views, guards, registration, and login | Email, password, register form fields, current user response, unauthorized route state, CSRF header. |
| UT010 | Dashboard, routes, navigation, base states, dialogs, responsive layout, and status badges | Route path, navigation label, role visibility, loading state, empty state, error state, status value, dialog open/close state. |
| UT011 | Blueprint wizard, blueprint library/detail, and moderation views | Wizard step state, blueprint form data, indicator inputs, validation messages, library filters, moderation queue item. |
| UT012 | Experiment wizard, experiment list, experiment detail, job detail, and BTCUSDT chart | Dataset range, split values, selected blueprint option, parameter overrides, experiment status, job status, candle data points. |
| UT013 | Models, favourites, public hub, documentation, admin, and system views | Model list item, favourite state, public hub filters, documentation item, user management row, system queue snapshot, system event. |

## 7.1.3 Test Results

### UT001: User entity and authentication controller

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
|---|---|---|---|---|---|---|
| UT001 | Verify user model and authentication API behaviours. | Test database/session fixture and user data are available. | Valid users can authenticate; invalid requests are rejected. | 1. Create user data. 2. Submit register/login requests. 3. Request current user. 4. Submit logout. | User registration/login succeeds with valid input; invalid credentials fail; current-user response reflects session state. | Covered by `backend/tests/domain/test_user_entity.py` and `backend/tests/test_authentication_controller.py`. |

### UT002: Access control, session service, and CSRF hardening

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
|---|---|---|---|---|---|---|
| UT002 | Verify role/session/CSRF protection units. | Users with different roles and sessions exist. | Protected endpoints reject unauthorized or unsafe requests. | 1. Create role-specific users. 2. Access protected resources. 3. Send unsafe request with and without CSRF handling. | Role checks, active-user checks, session checks, and CSRF checks behave correctly. | Covered by `backend/tests/test_access_control_service.py`, `backend/tests/test_session_service.py`, and `backend/tests/test_csrf_hardening.py`. |

### UT003: Blueprint entity, validator, controller, library, approval, and versioning

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
|---|---|---|---|---|---|---|
| UT003 | Verify blueprint creation, validation, library, favourites, approval, and version rules. | Authenticated user and blueprint payload exist. | Valid blueprints are persisted; invalid or unauthorized changes are rejected. | 1. Submit valid/invalid blueprint payloads. 2. List owned/favourited blueprints. 3. Request approval. 4. Moderate blueprint. 5. Edit submitted/reviewed blueprint. | Valid draft is created; invalid payload returns validation error; moderation is role-gated; reviewed/submitted edits preserve version history. | Covered by blueprint backend tests listed in the test plan. |

### UT004: Experiment entity, validator, controller, compiler, executor, and worker

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
|---|---|---|---|---|---|---|
| UT004 | Verify experiment creation, validation, compilation, execution, status, and worker lifecycle. | Authenticated user, accessible blueprint, and market data fixtures exist. | Experiment transitions through expected states and stores generated outputs. | 1. Submit valid/invalid experiments. 2. Compile plan. 3. Execute worker handler. 4. Inspect status and generated outputs. | Valid experiment is persisted/queued; invalid split/date/blueprint is rejected; worker updates running/completed/failed state. | Covered by experiment backend tests listed in the test plan. |

### UT005: Strategy modules for indicators, targets, splits, metrics, and logs

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
|---|---|---|---|---|---|---|
| UT005 | Verify computation strategies independently. | Synthetic or fixture OHLCV data is available. | Strategy output can be consumed by executor pipeline. | 1. Apply indicator strategies. 2. Apply target strategies. 3. Split data. 4. Compute metrics/log rows. | Strategies produce expected columns, target labels, split partitions, and metric/log structures. | Covered by strategy tests listed in the test plan. |

### UT006: Market data service, Binance client, repository, scripts, and controller

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
|---|---|---|---|---|---|---|
| UT006 | Verify BTCUSDT kline fetch, normalization, cache upsert, metadata, and controller behaviour. | Mock Binance rows and database repository fixtures exist. | Cached candle data is available for chart/execution use. | 1. Fetch mocked kline rows. 2. Normalize candles. 3. Upsert into repository. 4. Query chart/metadata endpoints. | Only supported BTCUSDT/1m data is accepted; duplicate timestamps update existing rows; controller returns usable candle data. | Covered by market-data backend tests listed in the test plan. |

### UT007: Queue service, Redis job queue, job controller, and cancellation strategies

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
|---|---|---|---|---|---|---|
| UT007 | Verify queue abstraction, job metadata, ownership checks, and cancellation behaviour. | Queue service or mocked Redis queue exists. | Jobs can be listed, inspected, and cancelled according to state and ownership. | 1. Enqueue experiment job. 2. Read queue/job metadata. 3. Request job detail. 4. Attempt owner and non-owner cancellation. | Owner/staff access succeeds where allowed; non-owner access is blocked; eligible jobs can be cancelled. | Covered by queue/job/cancellation tests listed in the test plan. |

### UT008: Model, experiment log, favourites, public hub, documentation, users, system, and database schema

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
|---|---|---|---|---|---|---|
| UT008 | Verify remaining backend entities, controllers, repositories, and schema constraints. | Database fixtures and role-specific users exist. | Controllers and repositories return correct data and enforce constraints. | 1. Create model/log/favourite records. 2. Query public hub/docs/system/users APIs. 3. Validate schema/enums/naming. | Entities map correctly; repositories return expected data; role-gated admin/system APIs enforce authorization. | Covered by backend tests listed in the test plan. |

### UT009 to UT013: Frontend view/component tests

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
|---|---|---|---|---|---|---|
| UT009 | Verify login, registration, auth guards, and CSRF-aware API client behaviour. | Mocked API/user states are available. | Authenticated/unauthenticated states render correctly. | Render views, fill forms, submit events, and inspect redirects/errors. | Login/register forms and route guards behave correctly. | Covered by frontend auth tests listed in the test plan. |
| UT010 | Verify dashboard, navigation, route rendering, base states, dialogs, responsive layout, and status badges. | Mocked route/user/status data exists. | Core UI boundaries render stable states. | Render components/views under different props and user roles. | Correct labels, routes, statuses, loading/empty/error states, and responsive structure appear. | Covered by frontend shell/state tests listed in the test plan. |
| UT011 | Verify blueprint wizard, library/detail, and moderation views. | Mocked blueprint and moderation data exists. | Blueprint UI workflows render and react to actions. | Render wizard steps, library rows, detail content, and moderation controls. | Blueprint creation and moderation UI states are visible and accessible. | Covered by blueprint frontend tests listed in the test plan. |
| UT012 | Verify experiment wizard, experiment list/detail, job detail, and BTCUSDT chart. | Mocked experiment, job, blueprint option, and candle data exists. | Experiment UI workflows render usable states. | Render wizard/list/detail/job/chart views with success/empty/error states. | Experiment configuration, status, job, and chart information appears correctly. | Covered by experiment/job/chart frontend tests listed in the test plan. |
| UT013 | Verify models, favourites, public hub, documentation, admin, and system views. | Mocked model, favourite, public, documentation, user, queue, event data exists. | Supporting UI modules render expected content and actions. | Render each view and inspect key labels/actions. | Model/public/docs/admin/system screens show expected information and restrictions. | Covered by remaining frontend tests listed in the test plan. |

Required screenshots for this subsection:

1. Terminal output of backend pytest test execution.
2. Terminal output of frontend Jest test execution.
3. Screenshot of at least one passing frontend component test file or Jest summary.
4. Screenshot of at least one backend test file or pytest summary.
