# 7.2 Integration Testing

After individual units were tested, integration testing was carried out to verify that modules work together correctly across frontend, backend, database, queue, worker, and external data boundaries. The integration tests are based on workflows represented in the source code and automated tests, especially `backend/tests/test_fyp_integration_journey.py`, controller tests, repository tests, worker tests, and frontend view tests.

## 7.2.1 Authentication, Session, and Role Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
|---:|---|---|---|---|---|
| 1 | User can register, log in, maintain a session, and access protected pages | Authentication controller, password service, session service, user repository, frontend login/register views, route guards | 1. Register user. 2. Log in. 3. Call current-user endpoint. 4. Render dashboard. | Valid user receives active session and protected dashboard renders. | Covered by backend authentication tests and frontend login/guard tests. |
| 2 | Normal user is blocked from admin/system pages | Access control service, backend controllers, frontend route guards, navigation | 1. Authenticate as normal user. 2. Attempt admin/system route/API. | Admin-only resources are hidden or blocked; backend denies unauthorized API access. | Covered by access-control and auth-guard tests. |
| 3 | Moderator can access moderation but not unrestricted admin-only actions | Role model, blueprint approval controller, frontend moderation page | 1. Authenticate as moderator. 2. Open moderation route. 3. Attempt admin-only system action. | Moderator can moderate blueprints but cannot perform admin-only system actions. | Covered by role/navigation/moderation tests. |
| 4 | Admin can manage users and system functions | User controller, system controller, system management view, user management view | 1. Authenticate as admin. 2. Load user management. 3. Load system management. | Admin sees user/system management functions and can access role-gated endpoints. | Covered by user/system controller and frontend admin/system tests. |

## 7.2.2 Blueprint Workflow Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
|---:|---|---|---|---|---|
| 1 | Create blueprint draft from wizard | Frontend blueprint wizard, API client, blueprint controller, validator, repository, ORM | 1. Fill blueprint wizard. 2. Submit valid payload. 3. Query owned library. | Blueprint draft is persisted and appears in owned library. | Covered by blueprint controller/library and frontend blueprint wizard tests. |
| 2 | Reject invalid blueprint configuration | Frontend wizard validation states, backend blueprint validator, response helpers | 1. Submit missing/invalid architecture or indicator data. | User receives validation error; invalid blueprint is not persisted. | Covered by `backend/tests/test_blueprint_validator.py` and blueprint UI tests. |
| 3 | Favourite and unfavourite blueprint | Blueprint controller, favourite blueprint repository/ORM, frontend library/detail | 1. Open accessible blueprint. 2. Favourite. 3. Verify favourite list. 4. Unfavourite. | Favourite state is stored and removed correctly. | Covered by blueprint/favourites tests. |
| 4 | Submit blueprint for moderation and approve/reject | Blueprint approval controller, access control service, moderation view, version state | 1. Request approval. 2. Login as moderator/admin. 3. Approve or reject. | Only staff roles can moderate; approval state updates correctly. | Covered by blueprint approval and moderation tests. |
| 5 | Preserve version integrity after reviewed/submitted blueprint edit | Versioning service, blueprint repository, blueprint controller | 1. Create reviewed/submitted blueprint. 2. Attempt edit. | System creates/uses versioned behaviour instead of destructively mutating reviewed artefact. | Covered by `backend/tests/test_versioning_service.py`. |

## 7.2.3 Experiment Configuration and Execution Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
|---:|---|---|---|---|---|
| 1 | Create experiment from approved blueprint | Experiment wizard, API client, experiment controller, experiment validator, blueprint repository, experiment repository | 1. Select accessible blueprint. 2. Set BTCUSDT range and split. 3. Submit experiment. | Valid experiment is persisted and queued with status metadata. | Covered by experiment controller and wizard tests. |
| 2 | Reject invalid experiment split or date range | Experiment wizard, backend validator, API response mapping | 1. Submit split that does not satisfy rules. 2. Submit invalid date order. | Backend returns validation error; frontend shows error state. | Covered by `backend/tests/test_experiment_validator.py` and frontend wizard tests. |
| 3 | Compile experiment without mutating selected blueprint | Experiment controller, compiler, repositories, ORM snapshots | 1. Submit experiment with parameter overrides. 2. Inspect blueprint and experiment records. | Overrides are stored on experiment; original blueprint remains unchanged. | Covered by experiment controller/compiler tests. |
| 4 | Execute queued experiment through worker | Queue service, Redis job queue, worker, compiler, executor, repositories | 1. Enqueue experiment job. 2. Run worker handler. 3. Inspect status and output records. | Experiment moves from queued/running to completed or failed with persisted state. | Covered by worker, executor, and queue tests. |
| 5 | Cancel eligible job or experiment | Job controller, cancellation strategies, queue service, experiment controller | 1. Create queued/running job. 2. Request cancellation as owner. 3. Try cancellation as non-owner. | Owner can cancel eligible job; non-owner is blocked. | Covered by job controller and cancellation strategy tests. |

## 7.2.4 Market Data, Chart, and Data Ingestion Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
|---:|---|---|---|---|---|
| 1 | Retrieve and normalize Binance kline data | Binance kline client, market data service, BTCUSDT domain entity | 1. Provide mocked Binance kline response. 2. Normalize data. | Data is converted into BTCUSDT kline structure with valid OHLCV fields. | Covered by Binance client and market data service tests. |
| 2 | Upsert BTCUSDT candles into PostgreSQL cache | Market data service, market data repository, BTCUSDTKline ORM | 1. Insert candle rows. 2. Insert same timestamp again. | Duplicate timestamp does not create duplicate row; inserted/updated counts are correct. | Covered by market data repository/service tests. |
| 3 | Serve cached chart data to frontend | Market data controller, API client, BTCUSDT chart component | 1. Query klines endpoint. 2. Render chart with returned data. | Chart displays data, or loading/empty/error state when appropriate. | Covered by market data controller and frontend chart tests. |
| 4 | Admin controls market-data catch-up | Market data controller, system management view, role checks | 1. Login as admin. 2. Trigger catch-up/status/stop/clear actions. | Admin-only market-data actions are exposed and protected. | Covered by market data controller and system view tests. |

## 7.2.5 Model, Logs, Favourites, Public Hub, Documentation, and Admin Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
|---:|---|---|---|---|---|
| 1 | View generated model rankings and details | Model repository, model controller, frontend model views, API client | 1. Persist model records. 2. Query rankings/detail. 3. Render model page. | Model metrics and parameters are displayed correctly. | Covered by model controller and frontend model tests. |
| 2 | Download model/experiment logs | Logs download controller, experiment log repository, frontend detail/download action | 1. Request log artefact for accessible experiment/model. | Download response is available for authorized user. | Covered by log download tests. |
| 3 | Favourite models and blueprints | Favourite repositories, model/blueprint controllers, frontend favourites page | 1. Favourite a model and blueprint. 2. Query favourites library. | Favourites appear in the correct user library. | Covered by favourite entity/repository and frontend favourites tests. |
| 4 | Browse public hub and documentation | Public hub controller, documentation controller, frontend hub/docs views | 1. Query public hub. 2. Query documentation list/detail. 3. Render pages. | Public and documentation content is displayed with expected filters/details. | Covered by public hub and documentation tests. |
| 5 | Admin manages users and views system state | User controller, system controller, frontend user/system management views | 1. Admin lists/updates users. 2. Admin views queue/settings/events. | Admin APIs and views return expected data and enforce access rules. | Covered by user/system controller and frontend admin/system tests. |

Required screenshots for this subsection:

1. End-to-end experiment creation wizard review page.
2. Experiment detail page after queued/completed/failed state is visible.
3. Blueprint moderation queue page.
4. Model rankings/detail page.
5. System management page with queue/system information.
