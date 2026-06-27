# 7.4 Acceptance Testing

Acceptance testing verifies that the completed system satisfies the main user and project requirements before handover. The acceptance cases below are based on the implemented BEE modules and the actual automated test evidence from the project.

The acceptance results use two evidence sources:

1. Backend test execution from `backend/` using `pytest -q`. Actual result: backend tests reached 100% completion with 375 tests completed and 5 warnings.
2. Frontend test execution from `frontend/` using `npm test -- --runInBand`. Actual result: 25 test suites passed, 113 tests passed, 0 snapshots, time 19.087 seconds.

The acceptance tests are marked as **Pass** where the implemented source code and automated tests verify the required function. The tester comments also state which files provide evidence. The report should still attach screenshots for visual proof during the final submission.

## AT001: User Registration and Login

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that a user can register and log in to BEE. | 1. Name. 2. Username. 3. Email. 4. Password. 5. Login credentials. | 1. Open registration page. 2. Fill registration form. 3. Submit registration. 4. Open login page. 5. Enter valid credentials. 6. Submit login form. | User account is created, user logs in successfully, and system redirects to authenticated dashboard. | Pass. Backend authentication tests verified registration, duplicate checks, password hashing, login session cookie, current-user lookup, and logout. Frontend tests verified login and registration validation plus valid submit flow. | Evidence: `backend/tests/test_authentication_controller.py`, `backend/tests/test_session_service.py`, `frontend/tests/login-view.test.tsx`, and `frontend/tests/registration-view.test.tsx`. Screenshot required: registration page, login page, and dashboard after login. |

## AT002: Dashboard and BTCUSDT Chart

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that the dashboard presents navigation, summary content, and BTCUSDT chart state. | 1. Authenticated user session. 2. Cached BTCUSDT candle data or empty-cache state. | 1. Log in. 2. Open dashboard. 3. Observe dashboard cards. 4. Observe BTCUSDT chart or chart state. | Dashboard loads with sidebar/top navigation, system cards, and BTCUSDT chart or meaningful loading/empty/error state. | Pass. Frontend dashboard tests verified required dashboard cards, quick-action links, selected BTCUSDT interval, loading state, and live statistic fallbacks. BTCUSDT chart tests verified loading, error, empty, success, incremental update, and cleanup states. | Evidence: `frontend/tests/dashboard-view.test.tsx`, `frontend/tests/btcusdt-price-chart.test.tsx`, and `backend/tests/test_market_data_controller.py`. Screenshot required: dashboard with sidebar, cards, and chart panel. |

## AT003: Blueprint Creation

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that a user can create a reusable experiment blueprint. | 1. Blueprint name. 2. Description. 3. Architecture selection. 4. Indicator configuration. 5. Feature configuration. | 1. Open blueprint wizard. 2. Fill basics step. 3. Configure architecture. 4. Add indicators/features. 5. Review configuration. 6. Submit blueprint. | Blueprint draft is saved and appears in the user's owned blueprint library with correct metadata and configuration summary. | Pass. Backend tests verified blueprint validation, draft persistence, field-level validation errors, detail access, and favourite/unfavourite persistence. Frontend tests verified wizard step navigation, review summary, constraint-backed inputs, backend validation errors, and submit navigation. | Evidence: `backend/tests/test_blueprint_validator.py`, `backend/tests/test_blueprint_controller.py`, `frontend/tests/blueprint-wizard-view.test.tsx`, and `frontend/tests/blueprint-library-detail-moderation.test.tsx`. Screenshot required: blueprint wizard review and owned blueprint library. |

## AT004: Blueprint Moderation

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| Moderator tester | 27 June 2026 | To verify that submitted blueprints can be reviewed by staff. | 1. Submitted blueprint. 2. Moderator or Admin account. 3. Approval/rejection decision. | 1. Log in as Moderator/Admin. 2. Open blueprint moderation page. 3. Select pending blueprint. 4. Approve, reject, or disapprove. | Blueprint approval state changes according to the moderation action, and normal users cannot perform the same action. | Pass. Backend tests verified approval request, moderator transitions, reject/disapprove behaviour, and invalid moderation transition rejection. Frontend tests verified moderation actions when queue items exist. | Evidence: `backend/tests/test_blueprint_approval_controller.py`, `frontend/tests/blueprint-library-detail-moderation.test.tsx`, and `frontend/tests/navigation.test.tsx`. Screenshot required: moderation queue and approval-state result. |

## AT005: Experiment Configuration and Submission

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that a user can configure and submit an experiment. | 1. Experiment name. 2. BTCUSDT dataset range. 3. Train/validation/test split. 4. Approved blueprint. 5. Target strategy. 6. Parameter overrides. | 1. Open experiment wizard. 2. Fill basics. 3. Select dataset range. 4. Configure split. 5. Select blueprint. 6. Configure target. 7. Apply parameter overrides. 8. Review. 9. Submit. | Experiment is created, stored with selected configuration, and queued for execution with visible status/job metadata. | Pass. Backend tests verified approved blueprint options, authentication requirement, structured validation errors, successful creation, priority passing, permutation cap, candlestick date derivation, queue unavailable handling, and ownership enforcement. Frontend tests verified the experiment wizard shell, blueprint selection, dataset bounds, split controls, target preview, override fields, review, backend error mapping, and successful redirect. | Evidence: `backend/tests/test_experiment_validator.py`, `backend/tests/test_experiment_controller.py`, `backend/tests/test_experiment_compiler.py`, and `frontend/tests/experiment-wizard-view.test.tsx`. Screenshot required: experiment wizard review before submit and created experiment detail after submit. |

## AT006: Experiment Detail, Job Tracking, and Cancellation

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that users can monitor experiments and manage eligible jobs. | 1. Created experiment. 2. Queued or running job. 3. Cancellation click event if available. | 1. Open experiment list. 2. Select experiment detail. 3. Review status/progress/configuration. 4. Open job detail. 5. Cancel eligible job if appropriate. | Experiment detail displays configuration and progress. Job detail displays queue/running/completed/failed/cancelled state. Eligible owner cancellation succeeds. | Pass. Backend tests verified experiment list/detail ownership, active queued status normalization, stale job reconciliation, completed result counts, job list/detail, job cancellation rules, worker success, worker failure, and executor order. Frontend tests verified experiment detail rendering, retraining progress while logs are prepared, completed download actions, fetched job detail data, and friendly not-found state. | Evidence: `backend/tests/test_experiment_controller.py`, `backend/tests/test_job_controller.py`, `backend/tests/test_job_cancellation_strategy.py`, `backend/tests/test_experiment_worker.py`, `backend/tests/test_default_experiment_executor.py`, `frontend/tests/experiment-detail-view.test.tsx`, and `frontend/tests/job-detail-view.test.tsx`. Screenshot required: experiment detail and job detail page. |

## AT007: Model Rankings, Model Detail, Logs, and Favourites

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that users can inspect model outputs and save useful artefacts. | 1. Completed experiment. 2. Generated model records. 3. Favourite button click. 4. Log download click. | 1. Open model rankings/library. 2. Open model detail. 3. Review metrics and parameters. 4. Favourite model. 5. Download logs if available. | Model metrics and parameters are shown. Favourite model appears in favourites. Logs are downloadable for authorized experiment/model. | Pass. Backend tests verified public/private model detail rules, ranking sort/filter/library/favourite behaviour, pagination, backtest metric sorting, model highlights, metrics/logs, and log download behaviour. Frontend tests verified ranking rows, sortable headings, search/filter serialization, error display, favourite removal, detail metrics, nested parameters, readable logs, and favourites filtering. | Evidence: `backend/tests/test_model_controller.py`, `backend/tests/test_metrics_and_logs.py`, `backend/tests/test_experiment_log_repository_metrics.py`, `frontend/tests/model-views.test.tsx`, and `frontend/tests/favorites-library-view.test.tsx`. Screenshot required: model ranking table, model detail, and favourites page. |

## AT008: Public Hub and Documentation

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that users can browse public content and documentation. | 1. Public hub filters/search. 2. Documentation slug or search query. | 1. Open public hub. 2. Search/filter public content. 3. Open public profile if available. 4. Open documentation page. 5. Open documentation detail. | Public hub and documentation pages display accessible content and details clearly. | Pass. Backend tests verified public hub visibility, public profile visibility, documentation list/detail, and missing documentation handling. Frontend tests verified public records loading, tab switching, documentation list, and documentation detail rendering. | Evidence: `backend/tests/test_public_hub_controller.py`, `backend/tests/test_documentation_controller.py`, `frontend/tests/public-hub-view.test.tsx`, and `frontend/tests/documentation-view.test.tsx`. Screenshot required: public hub tab, public profile if available, documentation list, and documentation detail. |

## AT009: Admin User Management

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| Admin tester | 27 June 2026 | To verify that administrators can manage platform users. | 1. Admin account. 2. Target user. 3. Status/role/password/username changes. | 1. Log in as Admin. 2. Open user management page. 3. View user list. 4. Update status/role/username or reset password. | Admin can view and manage users. Unauthorized users cannot access user management functions. | Pass. Backend tests verified profile access, staff-only listing, audit history, staff management constraints, normal-user blocking, admin username update validation, moderator restrictions, role changes, invalid create-user rejection, and role alias normalization. Frontend tests verified API error display, hidden actions for normal user actor, moderator-limited actions, full admin action set, forbidden/list errors, and audit entries. | Evidence: `backend/tests/test_user_controller.py`, `frontend/tests/user-management-view.test.tsx`, `frontend/tests/navigation.test.tsx`, and `frontend/tests/auth-guards.test.tsx`. Screenshot required: admin user table, role/status controls, and audit panel. |

## AT010: System Management and Market Data Administration

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| Admin tester | 27 June 2026 | To verify that administrators can inspect system state and manage market-data operations. | 1. Admin account. 2. Queue snapshot request. 3. System settings. 4. Market-data catch-up/status/stop/clear actions. | 1. Log in as Admin. 2. Open system management page. 3. Inspect queue snapshot. 4. Inspect or update system settings. 5. View system events. 6. Trigger market-data administration action if appropriate. | Admin can view queue/system events/settings and manage market-data operations through protected controls. | Pass with warning. Backend tests verified admin queue snapshot, non-admin rejection, settings view/update, system events, event download, market-data admin authorization, catch-up status/stop, clear-data protection, and gap-repair behaviour. Frontend system tests passed but printed React `act(...)` warnings for asynchronous state updates in `views/SystemManagementView.tsx`. | Evidence: `backend/tests/test_system_controller.py`, `backend/tests/test_market_data_controller.py`, `backend/tests/test_market_data_service.py`, and `frontend/tests/system-management-view.test.tsx`. Screenshot required: system queue cards, settings controls, event terminal, and market-data admin controls. |

## AT011: Role Restriction and Unauthorized Access

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that unauthorized users cannot access restricted modules. | 1. Normal user account. 2. Moderator route. 3. Admin route. 4. Protected API call. | 1. Log in as normal user. 2. Attempt to open moderation route. 3. Attempt to open admin user management route. 4. Attempt to open system management route. 5. Attempt restricted backend action. | System blocks or redirects unauthorized user, and backend APIs deny restricted requests. | Pass. Backend tests verified access-control role checks, ownership checks, profile access, staff/admin restrictions, blueprint moderation restrictions, job access restrictions, and protected request rejection. Frontend tests verified route guards, role-based navigation, and admin dropdown visibility. | Evidence: `backend/tests/test_access_control_service.py`, `backend/tests/test_user_controller.py`, `backend/tests/test_system_controller.py`, `backend/tests/test_blueprint_approval_controller.py`, `backend/tests/test_job_controller.py`, `backend/tests/test_csrf_hardening.py`, `frontend/tests/auth-guards.test.tsx`, and `frontend/tests/navigation.test.tsx`. Screenshot required: normal user blocked from staff-only route. |

## AT012: Data Ingestion, Target, Splits, Compiler, and Executor Readiness

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| Technical tester | 27 June 2026 | To verify that the technical experiment pipeline is ready for accepted use. | 1. BTCUSDT kline rows. 2. Target strategy parameters. 3. Split settings. 4. Blueprint architecture and indicator settings. 5. Experiment overrides. | 1. Refresh or mock market-data cache. 2. Validate missing-range discovery. 3. Apply target strategies. 4. Apply split strategies. 5. Compile experiment. 6. Execute with cached data. | BTCUSDT data is stored and read from cache. Target labels and splits are generated correctly. Compiler creates stable snapshots and hashes. Executor reads persisted data and follows expected execution order. | Pass. Backend tests verified market-data refresh and range discovery, repository upsert, target strategy labels, split reproducibility, compiler snapshot/hash behaviour, executor cached data loading, insufficient-cache failure, and execution order. | Evidence: `backend/tests/test_market_data_service.py`, `backend/tests/repositories/test_market_data_repository.py`, `backend/tests/strategies/test_target_strategy.py`, `backend/tests/strategies/test_data_split_strategy.py`, `backend/tests/test_experiment_compiler.py`, and `backend/tests/test_default_experiment_executor.py`. Screenshot required: market-data admin/cache state, target preview, experiment review, and experiment result detail. |

## Acceptance Testing Summary

| Acceptance area | Result | Evidence summary |
|---|---|---|
| Authentication and session | Pass | Backend authentication/session tests and frontend login/registration tests passed. |
| Dashboard and chart | Pass | Dashboard tests and BTCUSDT chart tests passed. |
| Blueprint creation and moderation | Pass | Blueprint validator/controller/moderation tests and frontend blueprint tests passed. |
| Experiment configuration and submission | Pass | Experiment validator/controller/compiler tests and frontend experiment wizard tests passed. |
| Experiment detail, jobs, and executor | Pass | Worker, executor, job, experiment detail, and job detail tests passed. |
| Models, logs, and favourites | Pass | Model controller, metrics/logs, favourite, and frontend model/favourite tests passed. |
| Public hub and documentation | Pass | Public hub and documentation backend/frontend tests passed. |
| Admin user and system management | Pass with warning | Backend admin tests passed. Frontend system management tests passed with React asynchronous-update warnings in test output. |
| Role restriction and protected access | Pass | Access control, route guards, navigation, restricted controller, and protected request tests passed. |
| Technical experiment pipeline | Pass | Market-data, target, split, compiler, executor, and worker tests passed. |

Required screenshots for this subsection:

| Screenshot | What to show |
|---|---|
| Acceptance evidence sheet | The completed acceptance testing table. |
| Backend pytest terminal | Backend test run showing 100% completion and warnings summary. |
| Frontend Jest terminal | Frontend test run showing 25 suites and 113 tests passed. |
| Login and dashboard | Successful user login and dashboard access. |
| Blueprint creation and moderation | Blueprint wizard review and moderator queue. |
| Experiment submission and detail | Experiment wizard review, experiment detail, and job detail. |
| Models and favourites | Model rankings/detail and favourites page. |
| Public hub and documentation | Hub tab and documentation detail. |
| Admin user/system pages | User management and system management. |
| Unauthorized access | Normal user blocked from staff-only page. |
