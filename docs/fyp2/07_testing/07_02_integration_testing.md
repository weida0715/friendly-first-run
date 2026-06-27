# 7.2 Integration Testing

Integration testing was carried out after the individual unit tests. The purpose was to confirm that the frontend, backend controllers, validators, services, repositories, database models, queue adapter, worker, executor, and market-data pipeline work together across module boundaries.

The actual automated test execution produced the following result:

| Test suite | Command and working directory | Actual result | Notes |
|---|---|---|---|
| Backend integration-related tests | `pytest -q` from `backend/` | Passed. The run reached 100% with 375 backend tests completed and 5 warnings. | The warnings came from scikit-learn future-warning messages in architecture and metrics tests. They did not fail the run. |
| Frontend integration-related tests | `npm test -- --runInBand` from `frontend/` | Passed. 25 test suites passed, 113 tests passed, 0 snapshots, time 19.087 seconds. | Jest printed React `act(...)` warnings in blueprint wizard and system management tests and a Next.js workspace-root warning. They did not fail the run. |

The tables below report integration test results using the implemented test files as evidence. Each result is marked against actual source-level tests and the test execution summary above.

## 7.2.1 Authentication, Session, and Role Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
|---:|---|---|---|---|---|
| 1 | User can register, log in, maintain a session, and access protected pages. | Authentication controller, password service, session service, user repository, frontend login/register views, route guards. | 1. Register user. 2. Log in. 3. Call current-user endpoint. 4. Render protected frontend route. | Valid user receives active session and protected dashboard renders. | Pass. Verified by `backend/tests/test_authentication_controller.py`, `backend/tests/test_session_service.py`, `frontend/tests/login-view.test.tsx`, `frontend/tests/registration-view.test.tsx`, and `frontend/tests/auth-guards.test.tsx`. |
| 2 | Normal user is blocked from admin and system pages. | Access-control service, backend restricted controllers, frontend route guards, navigation. | 1. Authenticate as normal user. 2. Attempt restricted frontend route. 3. Attempt restricted API route. | Restricted pages are hidden or blocked, and backend denies unauthorized API access. | Pass. Verified by `backend/tests/test_access_control_service.py`, `backend/tests/test_user_controller.py`, `backend/tests/test_system_controller.py`, `frontend/tests/auth-guards.test.tsx`, and `frontend/tests/navigation.test.tsx`. |
| 3 | Moderator can access blueprint moderation but not unrestricted admin-only actions. | Role model, blueprint approval controller, moderation page, user management role rules. | 1. Authenticate as moderator. 2. Open moderation route. 3. Attempt admin-only system action. | Moderator can moderate blueprints but cannot perform admin-only system actions. | Pass. Verified by `backend/tests/test_blueprint_approval_controller.py`, `backend/tests/test_user_controller.py`, `backend/tests/test_system_controller.py`, `frontend/tests/blueprint-library-detail-moderation.test.tsx`, and `frontend/tests/user-management-view.test.tsx`. |
| 4 | Admin can manage users and system functions. | User controller, system controller, system settings service, system management view, user management view. | 1. Authenticate as admin. 2. Load user management. 3. Load system management. 4. Update allowed admin settings/actions. | Admin sees user and system management functions and can access role-gated endpoints. | Pass. Verified by `backend/tests/test_user_controller.py`, `backend/tests/test_system_controller.py`, `frontend/tests/user-management-view.test.tsx`, and `frontend/tests/system-management-view.test.tsx`. |

Pseudocode for authentication integration:

```text
PROCEDURE VerifyAuthenticatedAccess
    Register or load a valid user
    Submit login credentials
    Confirm the backend creates a session
    Render protected route with authenticated context
    Confirm protected content is visible
    Attempt restricted route with lower role
    Confirm restricted content is blocked
END PROCEDURE
```

Suggested screenshots:

| Screenshot | What to show |
|---|---|
| Login success | User reaches authenticated dashboard after valid login. |
| Normal user blocked | Normal user cannot access system management or admin user page. |
| Moderator access | Moderator sees blueprint moderation queue. |
| Admin access | Admin sees user management and system management pages. |

## 7.2.2 Blueprint Workflow Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
|---:|---|---|---|---|---|
| 1 | Create blueprint draft from wizard. | Frontend blueprint wizard, API client, blueprint controller, validator, factory, repository, ORM. | 1. Fill blueprint wizard. 2. Submit valid payload. 3. Query owned library. | Blueprint draft is persisted and appears in owned library. | Pass. Verified by `backend/tests/test_blueprint_controller.py`, `backend/tests/test_blueprints_library_controller.py`, and `frontend/tests/blueprint-wizard-view.test.tsx`. |
| 2 | Reject invalid blueprint configuration. | Frontend wizard validation states, backend blueprint validator, response helpers. | 1. Submit missing or invalid architecture/indicator data. 2. Inspect error response and UI error state. | User receives validation error; invalid blueprint is not persisted. | Pass. Verified by `backend/tests/test_blueprint_validator.py`, `backend/tests/test_blueprint_controller.py`, and `frontend/tests/blueprint-wizard-view.test.tsx`. |
| 3 | Favourite and unfavourite blueprint. | Blueprint controller, favourite blueprint repository/ORM, blueprint detail view, favourites page. | 1. Open accessible blueprint. 2. Favourite. 3. Verify favourite list. 4. Unfavourite. | Favourite state is stored and removed correctly. | Pass. Verified by `backend/tests/test_blueprint_controller.py`, `backend/tests/repositories/test_favorites_repositories.py`, and `frontend/tests/favorites-library-view.test.tsx`. |
| 4 | Submit blueprint for moderation and approve/reject. | Blueprint approval controller, access-control service, moderation view, approval state. | 1. Request approval. 2. Log in as moderator/admin. 3. Approve or reject. | Only staff roles can moderate; approval state updates correctly. | Pass. Verified by `backend/tests/test_blueprint_approval_controller.py` and `frontend/tests/blueprint-library-detail-moderation.test.tsx`. |
| 5 | Preserve version integrity after reviewed or submitted blueprint edit. | Versioning service, blueprint repository, blueprint controller, ORM parent-child relation. | 1. Create reviewed/submitted blueprint. 2. Attempt edit. 3. Inspect saved version behaviour. | Version-aware behaviour prevents destructive mutation of reviewed artefacts. | Pass. Verified by `backend/tests/test_versioning_service.py` and `backend/tests/test_blueprint_controller.py`. |

Pseudocode for blueprint integration:

```text
PROCEDURE VerifyBlueprintWorkflow
    Authenticate user
    Submit blueprint wizard payload
    Validate payload on backend
    Normalize architecture, indicators, and features
    Save draft blueprint
    Request approval
    Authenticate staff user
    Moderate pending blueprint
    Confirm approval state and library visibility
END PROCEDURE
```

Suggested screenshots:

| Screenshot | What to show |
|---|---|
| Blueprint wizard review | Metadata, architecture, indicators, and features before submit. |
| Blueprint library | Created blueprint in owned list. |
| Blueprint detail | Version, approval state, lineage, and favourite state. |
| Moderation queue | Pending blueprint and staff actions. |

## 7.2.3 Experiment Configuration and Execution Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
|---:|---|---|---|---|---|
| 1 | Create experiment from approved blueprint. | Experiment wizard, API client, experiment controller, validator, blueprint repository, experiment repository. | 1. Select accessible blueprint. 2. Set BTCUSDT range and split. 3. Submit experiment. | Valid experiment is persisted and queued with status metadata. | Pass. Verified by `backend/tests/test_experiment_controller.py` and `frontend/tests/experiment-wizard-view.test.tsx`. |
| 2 | Reject invalid experiment split or date range. | Experiment wizard, backend validator, API response mapping. | 1. Submit invalid split. 2. Submit invalid date order. | Backend returns validation error and frontend shows the error state. | Pass. Verified by `backend/tests/test_experiment_validator.py`, `backend/tests/test_experiment_controller.py`, and `frontend/tests/experiment-wizard-view.test.tsx`. |
| 3 | Compile experiment without mutating selected blueprint. | Experiment controller, compiler, repositories, ORM snapshots. | 1. Submit experiment with parameter overrides. 2. Inspect compiled plan and original blueprint. | Overrides are stored on the experiment; the original blueprint remains unchanged. | Pass. Verified by `backend/tests/test_experiment_compiler.py` and `backend/tests/test_experiment_controller.py`. |
| 4 | Execute queued experiment through worker. | Queue service, Redis job queue, worker, executor, repositories. | 1. Enqueue experiment job. 2. Run worker handler. 3. Inspect experiment status and output result. | Experiment moves from queued/running to completed or failed with persisted state. | Pass. Verified by `backend/tests/test_experiment_worker.py`, `backend/tests/workers/test_experiment_worker.py`, and `backend/tests/test_default_experiment_executor.py`. |
| 5 | Cancel eligible job or experiment. | Job controller, cancellation strategy, queue service, experiment controller. | 1. Create queued/running job. 2. Request cancellation as owner. 3. Try cancellation as non-owner. | Owner can cancel eligible job; non-owner is blocked. | Pass. Verified by `backend/tests/test_job_controller.py`, `backend/tests/test_job_cancellation_strategy.py`, and `frontend/tests/job-detail-view.test.tsx`. |
| 6 | Display experiment detail with configuration, progress, models, logs, and downloads. | Experiment detail API, logs repository, model repository, frontend experiment detail view. | 1. Load experiment detail. 2. Render configuration, result model list, chart/modal, and downloads. | Experiment detail page shows accessible configuration and result data. | Pass. Verified by `backend/tests/test_experiment_controller.py`, `backend/tests/test_metrics_and_logs.py`, and `frontend/tests/experiment-detail-view.test.tsx`. |

Pseudocode for experiment integration:

```text
PROCEDURE VerifyExperimentWorkflow
    Authenticate user
    Select approved blueprint
    Configure BTCUSDT range, split, target, and overrides
    Validate experiment payload
    Compile immutable experiment plan
    Save experiment record
    Enqueue experiment job
    Worker executes job and updates progress
    User opens experiment detail and model outputs
END PROCEDURE
```

Suggested screenshots:

| Screenshot | What to show |
|---|---|
| Experiment wizard review | Dataset range, split, blueprint, target, and overrides. |
| Experiment list | Created experiment with status and progress. |
| Experiment detail | Configuration, progress, logs, models, and downloads. |
| Job detail | Queue state, worker state, timestamps, and cancellation action. |

## 7.2.4 Market Data, Chart, and Data Ingestion Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
|---:|---|---|---|---|---|
| 1 | Retrieve and normalize Binance kline data. | Binance kline client, market-data service, BTCUSDT domain entity. | 1. Provide mocked Binance kline response. 2. Normalize rows. | Data is converted into BTCUSDT kline structure with valid OHLCV fields. | Pass. Verified by `backend/tests/infrastructure/test_binance_kline_client.py` and `backend/tests/test_market_data_service.py`. |
| 2 | Upsert BTCUSDT candles into PostgreSQL cache. | Market-data service, market-data repository, BTCUSDTKline ORM. | 1. Insert candle rows. 2. Insert same timestamp again. | Duplicate timestamp updates existing row; inserted/updated counts are correct. | Pass. Verified by `backend/tests/repositories/test_market_data_repository.py` and `backend/tests/test_market_data_service.py`. |
| 3 | Serve cached chart data to frontend. | Market-data controller, API client, BTCUSDT chart component. | 1. Query klines endpoint. 2. Render chart with returned data. | Chart displays data or a correct loading, empty, or error state. | Pass. Verified by `backend/tests/test_market_data_controller.py` and `frontend/tests/btcusdt-price-chart.test.tsx`. |
| 4 | Preview target output from cached data. | Market-data controller, target strategy factory, target strategy, frontend experiment wizard. | 1. Submit target preview payload. 2. Inspect statistics and labels. | Target preview returns aligned labels and summary statistics. | Pass. Verified by `backend/tests/test_market_data_controller.py`, `backend/tests/test_target_strategy_factory.py`, and `frontend/tests/experiment-wizard-view.test.tsx`. |
| 5 | Admin controls market-data catch-up. | Market-data controller, system management view, role checks. | 1. Log in as admin. 2. Trigger catch-up/status/stop/clear actions. | Admin-only market-data actions are exposed and protected. | Pass. Verified by `backend/tests/test_market_data_controller.py` and `frontend/tests/system-management-view.test.tsx`. |

Suggested screenshots:

| Screenshot | What to show |
|---|---|
| Dashboard chart | BTCUSDT chart rendered from cached data. |
| Chart empty/error state | Empty or error state when data is unavailable. |
| Target preview | Experiment wizard target preview statistics. |
| System market-data controls | Admin catch-up/status/stop/clear controls. |

## 7.2.5 Model, Logs, Favourites, Public Hub, Documentation, and Admin Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
|---:|---|---|---|---|---|
| 1 | View generated model rankings and details. | Model repository, model controller, frontend model views, API client. | 1. Persist model records. 2. Query rankings/detail. 3. Render model page. | Model metrics and parameters display correctly. | Pass. Verified by `backend/tests/test_model_controller.py` and `frontend/tests/model-views.test.tsx`. |
| 2 | Download model and experiment logs. | Logs download controller, experiment log repository, frontend detail/download action. | 1. Request log artefact for accessible experiment/model. | Authorized user can access download response. | Pass. Verified by `backend/tests/test_metrics_and_logs.py`, `backend/tests/test_experiment_log_repository_metrics.py`, and `frontend/tests/experiment-detail-view.test.tsx`. |
| 3 | Favourite models and blueprints. | Favourite repositories, model/blueprint controllers, frontend favourites page. | 1. Favourite model and blueprint. 2. Query favourites library. | Favourites appear in the correct user library. | Pass. Verified by `backend/tests/domain/test_favorites_entities.py`, `backend/tests/repositories/test_favorites_repositories.py`, and `frontend/tests/favorites-library-view.test.tsx`. |
| 4 | Browse public hub and documentation. | Public hub controller, documentation controller, frontend hub/docs views. | 1. Query public hub. 2. Query documentation list/detail. 3. Render pages. | Public and documentation content displays with expected filters/details. | Pass. Verified by `backend/tests/test_public_hub_controller.py`, `backend/tests/test_documentation_controller.py`, `frontend/tests/public-hub-view.test.tsx`, and `frontend/tests/documentation-view.test.tsx`. |
| 5 | Admin manages users and views system state. | User controller, system controller, frontend user/system management views. | 1. Admin lists or updates users. 2. Admin views queue/settings/events. | Admin APIs and views return expected data and enforce access rules. | Pass. Verified by `backend/tests/test_user_controller.py`, `backend/tests/test_system_controller.py`, `frontend/tests/user-management-view.test.tsx`, and `frontend/tests/system-management-view.test.tsx`. |

Required screenshots for this subsection:

| Screenshot | What to show |
|---|---|
| Model rankings | Model table, sorting, filters, and metrics. |
| Model detail | Metric cards, parameters, logs, and favourite action. |
| Favourites page | Saved models and blueprints. |
| Public hub | Public records and tab switching. |
| Documentation | Documentation list and detail page. |
| Admin user management | User table and staff actions. |
| System management | Queue snapshot, settings, event log, and market-data controls. |

## Integration Testing Conclusion

The integration test results show that the main workflows are connected across the application layers. The backend test run passed from the correct `backend/` working directory, and the frontend test run passed from the `frontend/` working directory. The integration evidence covers authentication, role checks, blueprint creation and moderation, experiment setup and execution, market-data caching, chart rendering, model result inspection, favourites, public hub, documentation, user management, system management, queue monitoring, and jobs.
