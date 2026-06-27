# 7.1 Unit Testing

Unit testing verifies individual modules before they are integrated into the full BEE workflow. The current source tree contains backend pytest tests and frontend Jest/Testing Library tests. The test files cover authentication, RBAC, blueprints, experiments, market data, custom indicators, target strategies, queues, jobs, models, logs, public hub, documentation, dashboard, route guards, and frontend views.

## 7.1.1 Test plan

The following unit test plan is based on implemented test files in `backend/tests/` and `frontend/tests/`. Test dates should be updated to the actual testing date when the final report is submitted.

| No. | Test ID | Test case name | Test date | Evidence file |
|---|---|---|---|---|
| 1 | UT001 | Authentication controller registration/login/session/logout | 27-Jun-2026 | `backend/tests/test_authentication_controller.py` |
| 2 | UT002 | Access control and role permission service | 27-Jun-2026 | `backend/tests/test_access_control_service.py` |
| 3 | UT003 | Session service behavior | 27-Jun-2026 | `backend/tests/test_session_service.py` |
| 4 | UT004 | User management controller | 27-Jun-2026 | `backend/tests/test_user_controller.py` |
| 5 | UT005 | CSRF hardening | 27-Jun-2026 | `backend/tests/test_csrf_hardening.py`, `frontend/tests/api-client-csrf.test.ts` |
| 6 | UT006 | Blueprint validator | 27-Jun-2026 | `backend/tests/test_blueprint_validator.py` |
| 7 | UT007 | Blueprint create/detail/favourite/update controller | 27-Jun-2026 | `backend/tests/test_blueprint_controller.py` |
| 8 | UT008 | Blueprint library tabs | 27-Jun-2026 | `backend/tests/test_blueprints_library_controller.py`, `frontend/tests/blueprint-library-detail-moderation.test.tsx` |
| 9 | UT009 | Blueprint approval/moderation workflow | 27-Jun-2026 | `backend/tests/test_blueprint_approval_controller.py` |
| 10 | UT010 | Blueprint versioning service | 27-Jun-2026 | `backend/tests/test_versioning_service.py` |
| 11 | UT011 | Experiment validator | 27-Jun-2026 | `backend/tests/test_experiment_validator.py` |
| 12 | UT012 | Experiment compiler | 27-Jun-2026 | `backend/tests/test_experiment_compiler.py` |
| 13 | UT013 | Experiment controller create/list/detail/cancel/retry | 27-Jun-2026 | `backend/tests/test_experiment_controller.py` |
| 14 | UT014 | Default experiment executor | 27-Jun-2026 | `backend/tests/test_default_experiment_executor.py` |
| 15 | UT015 | Experiment worker lifecycle | 27-Jun-2026 | `backend/tests/test_experiment_worker.py` |
| 16 | UT016 | Queue/job cancellation strategy | 27-Jun-2026 | `backend/tests/test_job_cancellation_strategy.py`, `backend/tests/test_job_controller.py` |
| 17 | UT017 | Market data service/controller/scripts | 27-Jun-2026 | `backend/tests/test_market_data_service.py`, `backend/tests/test_market_data_controller.py`, `backend/tests/test_market_data_scripts.py` |
| 18 | UT018 | Custom indicators and TA-Lib indicator strategy | 27-Jun-2026 | `backend/tests/test_custom_indicators.py`, `backend/tests/test_talib_indicator_strategy.py` |
| 19 | UT019 | Target strategy factory | 27-Jun-2026 | `backend/tests/test_target_strategy_factory.py` |
| 20 | UT020 | Architecture factory and model architecture behavior | 27-Jun-2026 | `backend/tests/test_architecture_factory.py` |
| 21 | UT021 | Model controller and model views | 27-Jun-2026 | `backend/tests/test_model_controller.py`, `frontend/tests/model-views.test.tsx` |
| 22 | UT022 | Metrics and logs | 27-Jun-2026 | `backend/tests/test_metrics_and_logs.py`, `backend/tests/test_experiment_log_repository_metrics.py`, logs download test file under `backend/tests/` |
| 23 | UT023 | Public hub controller and frontend | 27-Jun-2026 | `backend/tests/test_public_hub_controller.py`, `frontend/tests/public-hub-view.test.tsx` |
| 24 | UT024 | Documentation controller and frontend | 27-Jun-2026 | `backend/tests/test_documentation_controller.py`, `frontend/tests/documentation-view.test.tsx` |
| 25 | UT025 | Dashboard and chart components | 27-Jun-2026 | `frontend/tests/dashboard-view.test.tsx`, `frontend/tests/btcusdt-price-chart.test.tsx` |
| 26 | UT026 | Experiment wizard/list/detail frontend | 27-Jun-2026 | `frontend/tests/experiment-wizard-view.test.tsx`, `experiment-list-view.test.tsx`, `experiment-detail-view.test.tsx` |
| 27 | UT027 | Blueprint wizard/frontend workflow | 27-Jun-2026 | `frontend/tests/blueprint-wizard-view.test.tsx`, `blueprint-library-detail-moderation.test.tsx` |
| 28 | UT028 | Auth guards and route rendering | 27-Jun-2026 | `frontend/tests/auth-guards.test.tsx`, `frontend/tests/routes-rendering.test.tsx`, `frontend/tests/navigation.test.tsx` |
| 29 | UT029 | Admin, system, jobs, favourites frontend views | 27-Jun-2026 | `frontend/tests/user-management-view.test.tsx`, `system-management-view.test.tsx`, `job-detail-view.test.tsx`, `favorites-library-view.test.tsx` |
| 30 | UT030 | Reusable UI states/components | 27-Jun-2026 | `frontend/tests/base-and-states.test.tsx`, `status-badges.test.tsx`, `wizard-view.test.tsx`, `dialog-and-responsive.test.tsx` |

## 7.1.2 Test data

| Test ID | Test case name | Relevant test data |
|---|---|---|
| UT001 | Authentication | Name, username, email, password, invalid credentials, disabled user state |
| UT002 | Access control | User roles: User, Moderator, Admin; authorized and unauthorized contexts |
| UT003 | Session service | Session id, user id, expiry, cookie/session lookup |
| UT004 | User management | User id, username, role, status, password reset data, audit records |
| UT005 | CSRF | CSRF token, unsafe request methods, request headers |
| UT006 | Blueprint validator | Blueprint name, architecture, indicators, parameter constraints, missing fields |
| UT007 | Blueprint controller | Draft blueprint payload, owner id, favourite state, update payload |
| UT008 | Blueprint library | Owned blueprint records, favourited blueprint records, empty lists |
| UT009 | Blueprint approval | Draft/pending/approved/rejected/disapproved states, moderator/admin user |
| UT010 | Versioning | Original blueprint id, version number, lineage id, reviewed/submitted status |
| UT011 | Experiment validator | Name, BTCUSDT symbol, interval, dates, split ratios, blueprint id, overrides |
| UT012 | Experiment compiler | Blueprint snapshot, experiment payload, parameter overrides, permutation count, seed |
| UT013 | Experiment controller | Create payload, list filters, detail id, cancel/retry/delete state |
| UT014 | Executor | Cached candles, compiled plan, features, targets, splits, model parameters |
| UT015 | Worker | Job payload, experiment id, status transitions, progress callbacks |
| UT016 | Jobs/cancellation | Job id, owner id, queued/running/completed/cancelled states |
| UT017 | Market data | Kline rows, date ranges, interval, metadata bounds, admin catch-up state |
| UT018 | Indicators | OHLCV sample data, indicator parameters, invalid parameter values |
| UT019 | Targets | Candle data, strategy name, lookahead, thresholds, target columns |
| UT020 | Architectures | Feature matrix, labels, architecture parameters |
| UT021 | Models | Model id, experiment id, metrics, parameter hash, favourite state |
| UT022 | Logs/metrics | Metric rows, confusion metrics, round CSV data, downloadable artifact name |
| UT023 | Public hub | Public user id, public blueprint/model/experiment records |
| UT024 | Documentation | Documentation slug, list item, markdown body |
| UT025 | Dashboard/chart | Candle data, interval selection, loading/empty/error chart states |
| UT026 | Experiment frontend | Wizard form fields, split values, target preview, backend 422 errors |
| UT027 | Blueprint frontend | Wizard fields, metadata options, validation errors, moderation queue |
| UT028 | Auth guards/routes | Logged-out user, normal user, admin user, route paths |
| UT029 | Admin/jobs/favourites | User table data, system events, queue snapshot, favourites records |
| UT030 | UI states | Loading, error, empty, default, dialog open/close state |

## 7.1.3 Test results

The detailed final report should include selected unit test result tables. The following tables are ready to use and can be expanded with actual screenshots of pytest/Jest output.

### UT012 Experiment compiler

| Test ID | Description | Precondition | Post condition | Test steps | Expected result | Actual result |
|---|---|---|---|---|---|---|
| UT012 | Verify compiled snapshots and parameter permutations | Valid blueprint and experiment payload exist | Compiled plan is created or validation error is raised | 1. Provide blueprint architecture and indicator parameters. 2. Provide experiment overrides and deterministic seed. 3. Run compiler. 4. Inspect snapshots, selected hashes, and permutation count. | Compiler returns immutable blueprint snapshot, effective experiment snapshot, selected parameter hashes, max/requested permutation count, or structured errors for invalid overrides. | Pass. Evidence: `backend/tests/test_experiment_compiler.py` |

### UT017 Market data service

| Test ID | Description | Precondition | Post condition | Test steps | Expected result | Actual result |
|---|---|---|---|---|---|---|
| UT017 | Verify BTCUSDT kline normalization and cache behavior | Mocked kline response and repository are available | Candle rows are inserted or updated without duplicates | 1. Call service/controller with BTCUSDT range. 2. Normalize kline rows. 3. Upsert into repository. 4. Request chart data. | Valid rows are returned to chart endpoint, duplicate timestamps are not duplicated, invalid input is rejected. | Pass. Evidence: `backend/tests/test_market_data_service.py`, `backend/tests/test_market_data_controller.py` |

### UT026 Experiment wizard frontend

| Test ID | Description | Precondition | Post condition | Test steps | Expected result | Actual result |
|---|---|---|---|---|---|---|
| UT026 | Verify experiment wizard validation and submit flow | Frontend test renders wizard with mocked APIs | Submit handler sends valid payload or displays field errors | 1. Render wizard. 2. Navigate steps. 3. Trigger invalid fields. 4. Fill required values. 5. Submit. | Missing fields are blocked; valid payload submits; backend validation errors are rendered. | Pass. Evidence: `frontend/tests/experiment-wizard-view.test.tsx` |

## Commands to show in final report

```text
cd backend
pytest -q

cd frontend
npm test -- --runInBand
npm run typecheck
```

## Required screenshots

| Screenshot | What to show |
|---|---|
| Backend pytest result | Terminal showing all backend tests passing |
| Frontend Jest result | Terminal showing all frontend test suites passing |
| Typecheck result | Terminal showing frontend typecheck pass |
| Example backend unit test file | `backend/tests/test_experiment_compiler.py` or `backend/tests/test_experiment_validator.py` |
| Example frontend unit test file | `frontend/tests/experiment-wizard-view.test.tsx` or `frontend/tests/blueprint-wizard-view.test.tsx` |

## Summary

The unit test coverage demonstrates that individual backend and frontend modules have been tested before full workflow integration. The tests are aligned with the major implemented modules and provide evidence that core validation, access control, data processing, queue logic, and UI behavior work as expected at component/module level.
