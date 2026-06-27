# 7.2 Integration Testing

## Section Purpose

This section presents tests where individually tested modules are combined and verified as connected workflows. Integration testing should demonstrate that frontend views, API client, backend controllers, services, repositories, database, queue, worker, and external market-data integration work correctly together.

## Opening Paragraph Structure

Write two paragraphs.

Paragraph 1 should explain that after unit testing, related modules were integrated and tested again to verify data flow across boundaries.

Paragraph 2 should explain that integration tests focus on end-to-end module communication, such as frontend request to backend API, backend persistence, queue submission, worker update, and frontend result rendering.

## 7.2.1 Authentication and Session Integration

| No. | Test Case | Units Integrated | Test to Execute Test Cases | Expected Results | Actual Results |
| --- | --- | --- | --- | --- | --- |
| 1 | Register and restore authenticated session | Registration view, API client, auth controller, user repository, session service, AuthProvider | Submit registration, refresh page, call current-user endpoint | User account is created, session is established, and dashboard is available after refresh |  |
| 2 | Login and logout flow | Login view, API client, auth controller, session service, route guards | Login with valid account, navigate to dashboard, logout | User is redirected to dashboard after login and public state after logout |  |
| 3 | Protected route enforcement | AuthProvider, route guards, backend session check | Access protected route as guest and authenticated user | Guest is redirected or blocked; authenticated user can access route |  |

> Note: Add screenshots of successful login and logout behavior if space allows.

## 7.2.2 RBAC and User Management Integration

| No. | Test Case | Units Integrated | Test to Execute Test Cases | Expected Results | Actual Results |
| --- | --- | --- | --- | --- | --- |
| 1 | Staff user listing | User management view, API client, user controller, access-control service, user repository | Login as staff and open user-management page | Staff account can view user list |  |
| 2 | Normal user access restriction | Route guards, backend authorization, user-management API | Login as normal user and attempt staff route/API | User is blocked by frontend guard and backend returns forbidden for protected API |  |
| 3 | Admin-only user operation | User management view, user controller, access-control service | Login as admin and perform admin-level operation | Admin operation succeeds and system state is updated |  |

## 7.2.3 Blueprint Workflow Integration

| No. | Test Case | Units Integrated | Test to Execute Test Cases | Expected Results | Actual Results |
| --- | --- | --- | --- | --- | --- |
| 1 | Create blueprint draft | Blueprint wizard, API client, blueprint controller, validator, repository, database | Complete blueprint wizard and submit draft | Blueprint is validated, persisted, and visible in owner library |  |
| 2 | Request blueprint approval | Blueprint detail view, approval controller, versioning/approval logic, repository | Submit draft for approval | Blueprint state changes to pending |  |
| 3 | Moderate blueprint | Moderation view, approval controller, access-control service, repository | Login as moderator/admin and approve pending blueprint | Blueprint state changes to approved and becomes available for experiment selection |  |
| 4 | Favorite blueprint | Blueprint detail/library view, API client, favorite repository | Favorite and unfavorite accessible blueprint | Favorite state is persisted and reflected in favorites view |  |

> Note: Add screenshots of blueprint wizard, moderation page, and approved blueprint detail.

## 7.2.4 Experiment Creation and Queue Integration

| No. | Test Case | Units Integrated | Test to Execute Test Cases | Expected Results | Actual Results |
| --- | --- | --- | --- | --- | --- |
| 1 | Create experiment from approved blueprint | Experiment wizard, blueprint options API, experiment controller, validator, compiler, repository | Submit valid experiment configuration | Experiment is created with queued status and compiled snapshots |  |
| 2 | Queue job after experiment submission | Experiment controller, queue service, Redis queue adapter, job metadata service | Submit valid experiment and inspect response | Queue metadata contains job id and queue position/status |  |
| 3 | Reject invalid split configuration | Experiment wizard, API client, experiment validator | Submit split totals that do not meet requirements | Validation error is returned and experiment is not queued |  |
| 4 | Enforce experiment ownership | Experiment detail view, experiment controller, access-control service | Attempt to view another user’s private experiment | Non-owner access is blocked unless actor has permitted staff scope |  |

## 7.2.5 Worker Execution and Result Persistence Integration

| No. | Test Case | Units Integrated | Test to Execute Test Cases | Expected Results | Actual Results |
| --- | --- | --- | --- | --- | --- |
| 1 | Worker processes queued experiment | Redis queue, worker, experiment repository, executor, model/log repositories | Run worker for queued experiment | Experiment progresses from queued to running and then completed or failed with recorded state |  |
| 2 | Progress callback updates experiment | Worker, executor, experiment repository, frontend detail view | Execute worker and refresh experiment detail | Progress/stage values are visible to user |  |
| 3 | Failed execution records diagnostics | Worker, executor, repository, frontend status view | Simulate executor failure | Experiment is marked failed and failure information is available |  |
| 4 | Cancellation request updates job/experiment | Job detail view, job controller, cancellation strategy, queue adapter, experiment repository | Cancel eligible job | Job/experiment state changes to cancelled or cancellation-requested as appropriate |  |

> Note: Add one sequence diagram showing experiment submission, queueing, worker execution, and result persistence.

## 7.2.6 Market Data and Chart Integration

| No. | Test Case | Units Integrated | Test to Execute Test Cases | Expected Results | Actual Results |
| --- | --- | --- | --- | --- | --- |
| 1 | Refresh BTCUSDT candles | Market-data controller, service, Binance connector, repository, database | Trigger refresh or ingestion command | Candle rows are normalized and inserted/updated without duplicates |  |
| 2 | Render chart from cached candles | Chart API, market-data repository, frontend chart hook, BTCUSDT chart component | Open dashboard or experiment chart | Chart renders candle data or proper empty/error state |  |
| 3 | Use cached candles in experiment execution | Market-data service, executor, repository, worker | Run experiment requiring candles | Executor loads deterministic local candle data after refresh attempt |  |

## 7.2.7 Models, Logs, Favorites, and Public Hub Integration

| No. | Test Case | Units Integrated | Test to Execute Test Cases | Expected Results | Actual Results |
| --- | --- | --- | --- | --- | --- |
| 1 | Display model rankings | Model repository, model controller, rankings view | Open model rankings page | Models are listed with metrics and ranking data |  |
| 2 | View model detail and favorite model | Model detail view, model controller, favorite repository | Open model detail and toggle favorite | Favorite state is saved and reflected in favorites page |  |
| 3 | Download experiment logs | Experiment detail view, logs controller, experiment log repository | Request supported log artifact | CSV or artifact response is generated |  |
| 4 | Public hub visibility | Public hub controller, repositories, public hub view | Open public hub | Only enabled users, approved blueprints, completed experiments, and valid models appear |  |

## 7.2.8 Documentation and System Management Integration

| No. | Test Case | Units Integrated | Test to Execute Test Cases | Expected Results | Actual Results |
| --- | --- | --- | --- | --- | --- |
| 1 | Render documentation | Documentation controller, Markdown docs, documentation view | Open documentation page and select document | Markdown document list and content are displayed |  |
| 2 | View system queue snapshot | System controller, queue metadata service, system management view | Login as admin and open system page | Active queue information is displayed |  |
| 3 | View system events | System controller, event repository, system management view | Open event list as admin | System events are listed with filters or pagination where available |  |

## Commands to Include

```bash
scripts/test_all.sh
```

```bash
cd backend
.venv/bin/pytest -q tests/test_fyp_integration_journey.py
```

## Screenshot / Evidence Notes

> Note: Integration testing should include screenshots of completed workflows, not only terminal output. Recommended screenshots: successful dashboard after login, approved blueprint, submitted experiment with queue metadata, job detail, experiment detail, model ranking, and public hub.

## Draft Closing Paragraph

The integration testing stage verifies that the system modules communicate correctly after being combined. The tests cover authentication, authorization, blueprint workflow, experiment creation, queueing, worker execution, market-data retrieval, chart rendering, model/log output, public hub visibility, documentation rendering, and system management. These tests demonstrate that the implemented modules operate as a connected research platform rather than isolated components.
