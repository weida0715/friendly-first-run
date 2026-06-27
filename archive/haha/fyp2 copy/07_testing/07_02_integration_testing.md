# 7.2 Integration Testing

Integration testing verifies that separately tested modules work together through real workflow boundaries. For BEE, the most important integration flows are authentication to dashboard access, blueprint creation to approval to experiment usage, experiment submission to queue/worker lifecycle, market-data retrieval to chart display, experiment execution to model/log persistence, and public hub visibility.

## Integration test plan

| No. | Test ID | Test case | Units integrated | Test steps to execute | Expected results | Actual results |
|---|---|---|---|---|---|---|
| 1 | IT001 | Authentication to protected dashboard | Auth controller, session service, user repository, frontend auth provider, route guard, dashboard view | 1. Register or seed user. 2. Log in. 3. Call `/api/auth/me`. 4. Open `/dashboard`. | Session is created, current user loads, dashboard route is accessible. | Pass. Evidence: `backend/tests/test_authentication_controller.py`, `frontend/tests/auth-guards.test.tsx`, `frontend/tests/dashboard-view.test.tsx` |
| 2 | IT002 | User role to admin/staff page access | Access control service, user controller, system controller, RequireRole, user/system views | 1. Log in as User, Moderator, Admin. 2. Attempt `/admin/users` and `/system`. 3. Call staff APIs. | Unauthorized roles are blocked; allowed roles can access intended pages/actions. | Pass. Evidence: `backend/tests/test_access_control_service.py`, `backend/tests/test_user_controller.py`, `backend/tests/test_system_controller.py`, `frontend/tests/user-management-view.test.tsx`, `frontend/tests/system-management-view.test.tsx` |
| 3 | IT003 | Blueprint creation to detail/library | Blueprint wizard view, blueprint controller, validator, repository, library/detail views | 1. Fill blueprint wizard. 2. Submit valid payload. 3. Open blueprint library. 4. Open blueprint detail. | Blueprint is persisted as draft and appears in owned list/detail page. | Pass. Evidence: `backend/tests/test_blueprint_controller.py`, `backend/tests/test_blueprints_library_controller.py`, `frontend/tests/blueprint-wizard-view.test.tsx`, `frontend/tests/blueprint-library-detail-moderation.test.tsx` |
| 4 | IT004 | Blueprint approval to experiment blueprint selection | Blueprint approval controller, access control, blueprint repository, experiment blueprint-options endpoint, experiment wizard | 1. Owner requests approval. 2. Moderator/Admin approves. 3. Open experiment wizard blueprint selection. | Approved blueprint appears as selectable experiment option. | Pass. Evidence: `backend/tests/test_blueprint_approval_controller.py`, `backend/tests/test_experiment_controller.py`, `frontend/tests/experiment-wizard-view.test.tsx` |
| 5 | IT005 | Experiment wizard to persisted queued experiment | Experiment wizard, experiment validator, experiment controller, repository, compiler, queue service | 1. Fill experiment wizard. 2. Select approved blueprint. 3. Submit. 4. Inspect created experiment and queue metadata. | Experiment is persisted with compiled snapshots and queued job metadata. | Pass. Evidence: `backend/tests/test_experiment_controller.py`, `backend/tests/test_experiment_compiler.py`, `frontend/tests/experiment-wizard-view.test.tsx` |
| 6 | IT006 | Queue to worker to experiment status | Queue service, Redis adapter, job metadata service, worker, executor, experiment repository | 1. Enqueue experiment job. 2. Run worker handler. 3. Simulate success/failure. 4. Read experiment detail. | Status moves through Queued/Running/Completed or Failed; progress/stage updates are stored. | Pass. Evidence: `backend/tests/test_experiment_worker.py`, `backend/tests/test_job_controller.py` |
| 7 | IT007 | Job detail and cancellation | Job controller, queue service, cancellation strategy, experiment cancellation handler, frontend job detail view | 1. Open job detail as owner. 2. Attempt cancel while eligible. 3. Attempt non-owner access. | Owner can view/cancel eligible job; non-owner is blocked. | Pass. Evidence: `backend/tests/test_job_controller.py`, `backend/tests/test_job_cancellation_strategy.py`, `frontend/tests/job-detail-view.test.tsx` |
| 8 | IT008 | Market data to dashboard/experiment charts | Binance client, market-data service, repository, controller, chart hook, chart component, dashboard/experiment views | 1. Seed or mock candles. 2. Request `/api/market-data/btcusdt/klines`. 3. Render dashboard and experiment chart. | Chart renders candles or correct loading/empty/error state. | Pass. Evidence: `backend/tests/test_market_data_service.py`, `backend/tests/test_market_data_controller.py`, `frontend/tests/btcusdt-price-chart.test.tsx`, `frontend/tests/dashboard-view.test.tsx` |
| 9 | IT009 | Experiment execution to model rankings/detail | Executor, architecture strategies, metrics/log strategies, model repository, model controller, rankings/detail views | 1. Complete experiment execution. 2. Persist model and metrics. 3. Open model rankings. 4. Open model detail. | Model appears with metrics, parameters, provenance, and favourite state. | Pass. Evidence: `backend/tests/test_default_experiment_executor.py`, `backend/tests/test_model_controller.py`, `frontend/tests/model-views.test.tsx` |
| 10 | IT010 | Logs and downloads from experiment detail | Experiment log repository, log strategies, logs download controller, experiment detail view | 1. Create stored logs/artifacts. 2. Open experiment detail. 3. Trigger download endpoints. | Logs/artifacts are visible and downloadable where permitted. | Pass. Evidence: `backend/tests/test_metrics_and_logs.py`, logs download test file under `backend/tests/`, `frontend/tests/experiment-detail-view.test.tsx` |
| 11 | IT011 | Favourites across blueprints/models and library page | Favourite repositories, blueprint/model controllers, detail views, favourites view | 1. Favourite blueprint and model. 2. Open favourites page. 3. Unfavourite item. | Favourited resources appear and disappear correctly. | Pass. Evidence: `frontend/tests/favorites-library-view.test.tsx`, `backend/tests/test_blueprint_controller.py`, `backend/tests/test_model_controller.py` |
| 12 | IT012 | Public hub visibility | Public hub controller, approved/public resources, public hub view | 1. Prepare public/approved records. 2. Open `/hub`. 3. Open public user detail. | Public resources are listed and private resources remain hidden. | Pass. Evidence: `backend/tests/test_public_hub_controller.py`, `frontend/tests/public-hub-view.test.tsx` |
| 13 | IT013 | Documentation browser | Documentation controller, markdown documents, documentation view | 1. Request docs list. 2. Select document slug. 3. Render markdown detail. | Document list and selected document content are displayed. | Pass. Evidence: `backend/tests/test_documentation_controller.py`, `frontend/tests/documentation-view.test.tsx` |
| 14 | IT014 | End-to-end FYP journey | Auth, blueprint, moderation, experiment, queue, model, logs, public hub | 1. Execute integration journey test. 2. Verify complete flow from account to public result. | Main project journey works across backend modules. | Pass. Evidence: `backend/tests/test_fyp_integration_journey.py` |

## Detailed integration flow: blueprint to experiment execution

```text
User logs in
  -> creates blueprint draft
  -> requests approval
  -> moderator/admin approves blueprint
  -> experiment wizard loads approved blueprint option
  -> user configures target, split, overrides, deterministic settings
  -> backend validates and compiles experiment snapshots
  -> experiment is persisted as Queued
  -> queue service enqueues execution job
  -> worker executes experiment
  -> model/log records are persisted
  -> user opens experiment detail and model rankings
```

## Integration evidence to include

| Evidence item | What to show |
|---|---|
| Test file screenshot | `backend/tests/test_fyp_integration_journey.py` showing the main sequence |
| Terminal output | Backend pytest run including integration journey pass |
| UI screenshot | Blueprint approval followed by experiment wizard blueprint selection |
| UI screenshot | Experiment detail showing completed status and model leaderboard |
| UI screenshot | Model rankings showing generated model |
| UI screenshot | Public hub showing public/approved resource visibility |

## Summary

The integration tests demonstrate that the system modules do not work only in isolation. The tested workflows cross authentication, role access, blueprints, experiment configuration, queue processing, model persistence, logs, and public discovery. This is important because BEE is a workflow-oriented platform: the value of the system depends on modules cooperating from user input to reproducible result output.
