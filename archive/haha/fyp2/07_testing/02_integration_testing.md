# 7.2 Integration Testing

After testing the modules individually through unit testing, related modules were integrated and tested again to verify that they work correctly as connected workflows. Integration testing focuses on the data flow between frontend views, API client functions, backend controllers, services, validators, repositories, database persistence, queue processing, worker execution, scripts, and result-rendering views.

The test results are presented by system module. Each table shows the integrated units, the test action used to execute the test case, the expected result, and the actual result observed from the executed test suite. The dedicated integration journey test passed successfully, and the broader backend and frontend automated test runs also completed successfully. This provides evidence that the individual modules can communicate correctly when combined.

## 7.2.1 User Authentication and Session Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | Register account and create authenticated session | Registration view, frontend API client, authentication controller, user repository, password service, session service, database | Submit valid registration details and inspect returned authenticated user state | User account is created, credential is hashed, session is established, and safe user data is returned | Passed. Covered by backend authentication tests and frontend registration tests |
| 2 | Login and restore current user | Login view, frontend API client, authentication controller, session service, user repository, authentication provider | Submit valid login details and call current-user endpoint after session creation | User is authenticated, session cookie is accepted, and current user is restored | Passed. Covered by backend authentication tests and frontend login/auth-provider tests |
| 3 | Logout active session | Application shell, frontend API client, authentication controller, session service, route guard | Login, trigger logout, then attempt to access authenticated state | Session is cleared and user returns to unauthenticated state | Passed. Covered by backend authentication tests and frontend navigation/auth tests |
| 4 | Protect unsafe requests with CSRF token | Frontend API client, CSRF endpoint, backend request handling, protected controller action | Send unsafe request without token, then repeat with valid CSRF token | Missing token is rejected and valid token allows the request | Passed. Covered by backend CSRF tests and frontend API-client CSRF tests |

## 7.2.2 Role-Based Access Control and User Management Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | Enforce protected route access | Authentication provider, route guards, navigation metadata, protected frontend pages | Open protected routes as guest, normal user, moderator, and administrator | Guest is blocked, authenticated users access permitted pages, and role-restricted routes are protected | Passed. Covered by frontend auth-guard, navigation, and route-rendering tests |
| 2 | Restrict staff user-management API | User-management view, frontend API client, user controller, access-control service, user repository | Attempt user-management actions as normal user, moderator, and administrator | Normal user is blocked, moderator has limited access, and administrator has full permitted access | Passed. Covered by backend user-controller/access-control tests and frontend user-management tests |
| 3 | Display role-aware user-management interface | Authentication provider, user-management view, user controller, user repository | Login with staff account and open user-management page | Staff user list and allowed controls are shown according to role | Passed. Covered by frontend user-management tests |
| 4 | Apply user profile and audit access rules | User profile route, user controller, public/profile data loading, access-control service | Request own profile and staff audit-related user data | Own profile is accessible and staff-only audit information follows role restrictions | Passed. Covered by backend user-controller tests |

## 7.2.3 Dashboard and Application Shell Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | Render authenticated dashboard | Authentication provider, route guard, dashboard page, dashboard view, dashboard API data | Login and open dashboard route | Dashboard renders authenticated content, summary sections, quick links, and chart area | Passed. Covered by frontend dashboard and route-rendering tests |
| 2 | Render shared application shell | Application routes, navigation, top bar, sidebar, base view, reusable components | Open major application routes with mocked role states | Layout, navigation, page headers, loading, empty, and error states render consistently | Passed. Covered by base-state, navigation, dialog, route-rendering, and status-badge tests |
| 3 | Preserve role-aware navigation after auth state changes | Authentication provider, navigation definitions, sign-out control, route guards | Render shell as guest, normal user, moderator, and administrator | Navigation items match the user role and sign-out returns user to public state | Passed. Covered by frontend navigation and auth-guard tests |

## 7.2.4 Blueprint Authoring, Versioning, and Moderation Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | Create blueprint draft | Blueprint wizard view, frontend API client, blueprint controller, blueprint validator, blueprint repository, database | Complete blueprint wizard and submit a valid draft | Blueprint is validated, persisted as draft, and available to owner | Passed. Covered by backend blueprint-controller/validator tests and frontend blueprint-wizard tests |
| 2 | Display blueprint library and detail | Blueprint library view, blueprint detail view, blueprint library controller, blueprint repository, favorite repository | Open owned/favorited blueprint lists and select blueprint detail | Owned and favorited blueprints are listed and detail information is rendered | Passed. Covered by backend blueprint-library tests and frontend blueprint library/detail tests |
| 3 | Request blueprint approval | Blueprint detail view, frontend API client, blueprint approval controller, blueprint repository, access-control service | Submit a draft blueprint for approval | Blueprint changes from draft to pending and response reflects updated state | Passed. Covered by backend blueprint-approval tests and frontend blueprint detail tests |
| 4 | Moderate pending blueprint | Moderation view, blueprint approval controller, access-control service, blueprint repository, versioning service | Approve or reject pending blueprint as moderator or administrator | Staff action changes approval state according to valid transition rules | Passed. Covered by backend blueprint-approval/versioning tests and frontend moderation tests |
| 5 | Preserve blueprint lineage after reviewed edit | Blueprint detail view, versioning service, blueprint controller, blueprint repository | Edit a blueprint after review or submission | Previous artifact is preserved and a versioned editable record is produced where required | Passed. Covered by backend versioning tests |

## 7.2.5 Experiment Configuration and Management Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | Load experiment wizard options | Experiment wizard view, blueprint options API, experiment controller, blueprint repository, access-control service | Open experiment wizard as authenticated user | Accessible approved blueprints and required wizard metadata are loaded | Passed. Covered by backend experiment-controller tests and frontend experiment-wizard tests |
| 2 | Submit valid experiment configuration | Experiment wizard view, frontend API client, experiment controller, experiment validator, experiment compiler, experiment repository | Submit valid BTCUSDT experiment with date range, split values, blueprint, and overrides | Experiment is validated, compiled, persisted, and prepared for queueing | Passed. Covered by backend experiment-controller/compiler/validator tests and integration journey test |
| 3 | Reject invalid experiment configuration | Experiment wizard view, frontend API client, experiment validator, experiment controller | Submit invalid split, date, interval, blueprint, or override payload | Validation errors are returned and invalid experiment is not queued | Passed. Covered by backend experiment-validator/controller tests and frontend experiment-wizard tests |
| 4 | List and filter user experiments | Experiment list view, frontend API client, experiment controller, experiment repository | Open experiment list and apply status/search filters | User experiments are listed and filters update the displayed results | Passed. Covered by backend experiment-controller tests and frontend experiment-list tests |
| 5 | Display experiment detail | Experiment detail view, experiment controller, experiment repository, model/log repositories, job metadata service | Open experiment detail for an accessible experiment | Configuration, split values, status, job metadata, models, logs, and actions are displayed | Passed. Covered by backend experiment-controller tests and frontend experiment-detail tests |
| 6 | Enforce experiment ownership | Experiment detail view, experiment controller, access-control service, experiment repository | Attempt to open another user's restricted experiment | Unauthorized non-owner is blocked unless staff access is permitted | Passed. Covered by backend experiment-controller tests |

## 7.2.6 Market Data and BTCUSDT Charting Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | Refresh BTCUSDT market data | Market-data controller, market-data service, kline client, market-data repository, database | Trigger refresh with supported symbol, interval, and date range | Candle rows are fetched, normalized, and inserted or updated without duplicates | Passed. Covered by market-data controller/service/repository/client tests |
| 2 | Execute market-data ingestion scripts | Market-data scripts, market-data service, kline client, repository, database | Run script-level refresh or ingestion test cases | Script validates ranges, handles chunks, resumes or reconciles safely, and preserves data integrity | Passed. Covered by backend market-data script tests |
| 3 | Render BTCUSDT chart from cached candles | Market-data controller, repository, frontend API client, chart component, dashboard view | Open dashboard or chart view with candle response states | Chart renders candle data, or clear loading/empty/error states are shown | Passed. Covered by frontend BTCUSDT chart and dashboard tests |
| 4 | Provide target preview from market data | Experiment wizard, market-data controller, target strategy, market-data repository | Request target preview from experiment wizard | Target preview response is generated or validation error is returned for invalid input | Passed. Covered by market-data controller and frontend experiment-wizard tests |

## 7.2.7 Queue, Worker, and Job Management Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | Queue experiment after submission | Experiment controller, queue service, Redis job queue adapter, experiment repository, job metadata service | Submit valid experiment and inspect queue metadata | Experiment is persisted and queue metadata contains job id, status, and position where available | Passed. Covered by backend experiment-controller, queue-service, and Redis queue tests |
| 2 | Retrieve job detail | Job detail view, frontend API client, job controller, queue service, job metadata service, access-control service | Open job detail for owned job | Job status, queue metadata, and friendly state messages are returned and rendered | Passed. Covered by backend job-controller tests and frontend job-detail tests |
| 3 | Cancel eligible job | Job detail view, job controller, cancellation strategy, queue service, experiment repository | Request cancellation for queued or running job | Eligible job is cancelled or cancellation-requested; unauthorized or terminal jobs are blocked | Passed. Covered by backend job-controller and job-cancellation tests |
| 4 | Execute worker lifecycle | Worker script, experiment worker, experiment repository, default executor, progress callback, log/model repositories | Process valid worker payload and simulated failure payload | Experiment moves through running/completed or failed states and progress/failure information is recorded | Passed. Covered by backend worker tests |
| 5 | Display administrator queue snapshot | System-management view, system controller, job metadata service, queue adapter | Login as administrator and open system management page | Active queue information and job metadata are visible to administrator | Passed. Covered by backend system-controller tests and frontend system-management tests |

## 7.2.8 Experiment Execution, Model Training, Metrics, and Logs Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | Load cached data for experiment execution | Default executor, market-data repository, BTCUSDT candle records, experiment configuration | Execute data-loading path for configured experiment date range | Executor loads ordered local candle data and rejects insufficient cache safely | Passed. Covered by backend default-executor tests |
| 2 | Compile experiment into executable plan | Experiment compiler, blueprint configuration, parameter overrides, experiment validator | Compile blueprint and experiment-specific settings | Compiled snapshots and deterministic parameter permutations are produced | Passed. Covered by backend experiment-compiler tests |
| 3 | Run split, indicator, target, scaling, and evaluation flow | Data split strategy, indicator strategy, target strategy, feature-scaling logic, architecture factory, metrics logic | Execute strategy and metrics test cases with sample OHLCV frames | Temporal split boundaries are respected and generated outputs remain deterministic | Passed. Covered by backend strategy, architecture, and metrics tests |
| 4 | Persist generated models and experiment logs | Default executor, model repository, experiment log repository, metrics logic, database | Store and reload model and structured log records | Model records and metric/log payloads persist and reload correctly | Passed. Covered by backend model repository and experiment-log repository tests |
| 5 | Display result data in experiment detail | Experiment detail view, model controller, experiment controller, logs download controller, frontend API client | Open completed experiment detail and inspect result sections | Leaderboard, model detail, risk chart, metric logs, and download actions render correctly | Passed. Covered by frontend experiment-detail and model-view tests |

## 7.2.9 Model Catalog, Rankings, and Model Detail Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | Load ranked model catalog | Model ranking view, frontend API client, model controller, model repository, experiment/log repositories | Open model rankings and apply sorting/filtering | Models are listed with metrics, filters, sorting, pagination, and incomplete metric handling | Passed. Covered by backend model-controller tests and frontend model-view tests |
| 2 | Open model detail | Model detail view, model controller, model repository, experiment context, log data | Select model from ranking or detail link | Model parameters, metrics, logs, and experiment context are displayed | Passed. Covered by backend model-controller tests and frontend model-view tests |
| 3 | Enforce model visibility | Model controller, access-control service, model repository, public/private experiment state | Request private or inaccessible model | Unauthorized model access is blocked and accessible records are returned | Passed. Covered by backend model-controller tests |
| 4 | Favorite or unfavorite model | Model detail view, favorites view, model controller, favorite model repository | Toggle favorite state and open favorites page | Favorite state is saved or removed and reflected in favorites library | Passed. Covered by backend model-controller/favorites tests and frontend model/favorites tests |

## 7.2.10 Logs and Artifact Download Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | Download completed experiment artifact | Experiment detail view, frontend API client, logs download controller, experiment log repository, access-control service | Request supported log or artifact for completed accessible experiment | Downloadable CSV or artifact response is generated | Passed. Covered by backend logs-download tests and frontend experiment-detail tests |
| 2 | Reject incomplete experiment export | Logs download controller, experiment repository, access-control service | Request export for incomplete experiment | Request is rejected with controlled error | Passed. Covered by backend logs-download tests |
| 3 | Display download controls from result screen | Experiment detail view, model data, log metadata, API endpoint definitions | Open completed experiment detail | Download controls are visible only when supported by available result data | Passed. Covered by frontend experiment-detail tests |

## 7.2.11 Favorites Library Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | Add and remove blueprint favorite | Blueprint detail view, blueprint controller, favorite blueprint repository, favorites library view | Favorite and unfavorite an accessible blueprint | Favorite link is persisted or removed and reflected in favorites page | Passed. Covered by backend blueprint/favorite tests and frontend blueprint/favorites tests |
| 2 | Add and remove model favorite | Model detail view, model controller, favorite model repository, favorites library view | Favorite and unfavorite an accessible model | Favorite link is persisted or removed and reflected in favorites page | Passed. Covered by backend model/favorite tests and frontend model/favorites tests |
| 3 | Display consolidated favorites library | Favorites library view, frontend API client, model/blueprint controllers, favorite repositories | Open favorites page with saved models and blueprints | Saved model and blueprint items are displayed with remove actions and empty states | Passed. Covered by frontend favorites-library tests |

## 7.2.12 Public Hub Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | Load public hub content | Public hub view, frontend API client, public hub controller, user repository, experiment repository, model repository, blueprint repository | Open public hub as authenticated user | Users, experiments, models, and blueprints tabs load visible records | Passed. Covered by backend public-hub tests and frontend public-hub tests |
| 2 | Enforce public visibility rules | Public hub controller, repositories, access-control service | Request public hub data with mixed enabled/disabled and completed/incomplete records | Only enabled users, completed experiments, successful models, and approved blueprints are returned | Passed. Covered by backend public-hub controller tests |
| 3 | Switch public hub tabs | Public hub view, tab state, mocked API response | Switch between Users, Experiments, Models, and Blueprints tabs | Correct grouped public data is shown for each tab | Passed. Covered by frontend public-hub tests |

## 7.2.13 Documentation Viewer Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | Load documentation list | Documentation view, frontend API client, documentation controller, documentation files | Open documentation route | Documentation list is returned and displayed | Passed. Covered by backend documentation-controller tests and frontend documentation-view tests |
| 2 | Render selected Markdown document | Documentation view, API client, documentation controller, Markdown renderer | Select a document from the documentation page | Markdown content is loaded and rendered clearly | Passed. Covered by backend documentation-controller tests and frontend documentation-view tests |
| 3 | Handle missing documentation item | Documentation controller, frontend error state | Request missing document slug | Controlled not-found response or readable error state is shown | Passed. Covered by backend documentation-controller tests |

## 7.2.14 System Management and Operational Monitoring Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | View system queue snapshot | System-management view, frontend API client, system controller, job metadata service, queue adapter | Login as administrator and open system management page | Queue depth, active jobs, and empty queue state are displayed | Passed. Covered by backend system-controller tests and frontend system-management tests |
| 2 | Manage system settings display | System-management view, system controller, system settings service, settings repository | Load settings panel and submit valid setting changes | Current settings render and allowed updates return controlled response | Passed. Covered by backend system-controller tests and frontend system-management tests |
| 3 | Display system events and export data | System-management view, system controller, system event repository, frontend API client | Open event list and request export link | Events are listed and event export behaviour is available where supported | Passed. Covered by backend system-controller tests and frontend system-management tests |
| 4 | Control BTCUSDT cache operations from admin view | System-management view, market-data controller, market-data service, market-data repository | Trigger supported cache status or catch-up actions | Cache operation state is displayed and failures are shown clearly | Passed. Covered by backend market-data/system tests and frontend system-management tests |

## 7.2.15 User Profile Integration

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | Display own profile | User profile view, user controller, user repository, authentication provider | Open profile route as authenticated user | User profile information and activity summary are displayed | Passed. Covered by backend user-controller tests and frontend route-rendering/navigation tests |
| 2 | Display public user profile from hub | Public hub view, user profile view, public hub controller, user repository, artifact repositories | Select user profile from public hub data | Public profile and visible associated artifacts are shown | Passed. Covered by backend public-hub tests and frontend public-hub/user-profile route coverage |

## 7.2.16 End-to-End Module Integration Summary

| No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
| --- | --- | --- | --- | --- | --- |
| 1 | Main research workflow integration | Authentication, RBAC, blueprint workflow, experiment workflow, queue service, worker, market data, model/log persistence, result views | Run `cd backend && .venv/bin/pytest -q tests/test_fyp_integration_journey.py` | Core implemented workflow remains coherent across module boundaries | Passed. Dedicated integration journey test completed at 100% |
| 2 | Backend integrated regression coverage | Backend controllers, services, validators, repositories, strategies, queue, worker, scripts, database models | Run `cd backend && .venv/bin/pytest -q` | Backend integrated behaviours complete without failures | Passed. Backend pytest run reached 100% with no failures |
| 3 | Frontend integrated regression coverage | Frontend routes, views, API client, auth provider, guards, charts, reusable components | Run `cd frontend && npm test -- --runInBand` | Frontend view and interaction behaviours complete without failures | Passed. Jest reported 25 passed suites and 113 passed tests |

## 7.2.17 Integration Testing Summary

Integration testing verified that the modules tested individually in Section 7.1 also work correctly when combined. The tests covered authentication, session restoration, CSRF enforcement, role-based access control, user management, dashboard rendering, blueprint authoring and moderation, experiment creation, validation, queueing, worker execution, market-data retrieval, chart display, model ranking, log download, favorites, public hub visibility, documentation rendering, user profile access, and system management.

The integration test results show that data moves correctly across the frontend, backend, database, queue, worker, and supporting scripts. The dedicated integration journey test passed, and the broader backend and frontend test runs also passed. These results indicate that the implemented modules operate as a connected research platform rather than isolated components.
