# 7.1 Unit Testing

Unit testing was carried out to verify that the individual backend and frontend components of the Bitcoin Experimental Engine behave correctly before they are combined into larger workflows. The backend unit tests focus on controllers, validators, repositories, services, strategies, worker functions, queue-related components, model and metric processing, market-data handling, authentication, authorization, and documentation endpoints. The frontend unit tests focus on views, route guards, navigation, API-client behaviour, chart rendering, form validation, reusable user-interface components, loading states, empty states, and error states.

The purpose of this testing stage is to detect module-level defects early. Each test checks a small responsibility, such as validating an experiment payload, rejecting an unauthorized user action, normalizing BTCUSDT candle data, rendering a wizard step, or attaching a CSRF token to a mutating frontend request. Backend tests were executed using `pytest`, while frontend tests were executed using Jest and Testing Library. These tests support the requirement that critical computational, security, persistence, and user-interface components must be testable and verified before integration testing.

## 7.1.1 Test Plan

The unit test plan is divided into backend and frontend test cases. Backend tests verify the server-side and processing modules, while frontend tests verify the user-interface and browser-facing behaviour. The test date used in this section is 25 June 2026, which is the date of the documented unit test execution.

### Backend Unit Test Plan

| No. | Test ID | Test Case Name | Test Date |
| --- | --- | --- | --- |
| 1 | UT001 | Validate user registration and login behaviour | 25 June 2026 |
| 2 | UT002 | Validate access-control and role-permission behaviour | 25 June 2026 |
| 3 | UT003 | Validate session service behaviour | 25 June 2026 |
| 4 | UT004 | Validate user-management controller behaviour | 25 June 2026 |
| 5 | UT005 | Validate blueprint payload validation | 25 June 2026 |
| 6 | UT006 | Validate blueprint approval and moderation transitions | 25 June 2026 |
| 7 | UT007 | Validate blueprint versioning behaviour | 25 June 2026 |
| 8 | UT008 | Validate experiment payload validation | 25 June 2026 |
| 9 | UT009 | Validate experiment compiler output and parameter permutations | 25 June 2026 |
| 10 | UT010 | Validate experiment controller ownership behaviour | 25 June 2026 |
| 11 | UT011 | Validate market-data normalization, cache, and script behaviour | 25 June 2026 |
| 12 | UT012 | Validate target strategy factory and target generation | 25 June 2026 |
| 13 | UT013 | Validate indicator strategy behaviour | 25 June 2026 |
| 14 | UT014 | Validate model architecture factory behaviour | 25 June 2026 |
| 15 | UT015 | Validate queue service and job metadata behaviour | 25 June 2026 |
| 16 | UT016 | Validate worker status transition behaviour | 25 June 2026 |
| 17 | UT017 | Validate job cancellation strategy behaviour | 25 June 2026 |
| 18 | UT018 | Validate logs download behaviour | 25 June 2026 |
| 19 | UT019 | Validate documentation controller behaviour | 25 June 2026 |
| 20 | UT020 | Validate public hub filtering behaviour | 25 June 2026 |
| 21 | UT021 | Validate system controller and settings behaviour | 25 June 2026 |

### Frontend Unit Test Plan

| No. | Test ID | Test Case Name | Test Date |
| --- | --- | --- | --- |
| 22 | UT022 | Validate login and registration views | 25 June 2026 |
| 23 | UT023 | Validate authentication guards and navigation filtering | 25 June 2026 |
| 24 | UT024 | Validate dashboard and BTCUSDT chart states | 25 June 2026 |
| 25 | UT025 | Validate blueprint wizard, detail, library, and moderation views | 25 June 2026 |
| 26 | UT026 | Validate experiment wizard, list, and detail views | 25 June 2026 |
| 27 | UT027 | Validate job detail and job status views | 25 June 2026 |
| 28 | UT028 | Validate model ranking and model detail views | 25 June 2026 |
| 29 | UT029 | Validate favorites, public hub, and documentation views | 25 June 2026 |
| 30 | UT030 | Validate user-management and system-management views | 25 June 2026 |
| 31 | UT031 | Validate reusable layout, table, badge, loading, empty, and error components | 25 June 2026 |
| 32 | UT032 | Validate frontend API client CSRF behaviour | 25 June 2026 |

## 7.1.2 Test Data

The test data was selected based on the main requirement areas of the system. Backend tests use representative users, roles, blueprints, experiments, models, BTCUSDT candle records, job metadata, settings, and logs. Frontend tests use mocked API responses, route states, form inputs, user actions, and component props so that the interface behaviour can be verified without requiring a live browser deployment for each unit test.

| Test ID | Test Case Name | Relevant Test Data |
| --- | --- | --- |
| UT001 | Validate user registration and login behaviour | Name, username, email address, password, duplicate username, duplicate email, invalid credentials, disabled account |
| UT002 | Validate access-control and role-permission behaviour | Normal User role, Moderator role, Administrator role, owner user id, non-owner user id, missing session, restricted action |
| UT003 | Validate session service behaviour | Session identifier, user id, role, timeout value, expired session case, zero-timeout non-expiring session case |
| UT004 | Validate user-management controller behaviour | User list, role update, status update, username update, account creation payload, moderator-limited operation, administrator-only operation |
| UT005 | Validate blueprint payload validation | Blueprint name, description, architecture selection, indicator list, parameter ranges, missing fields, unsupported indicator, invalid range |
| UT006 | Validate blueprint approval and moderation transitions | Draft blueprint, pending blueprint, approved blueprint, rejected blueprint, moderator account, administrator account, invalid state transition |
| UT007 | Validate blueprint versioning behaviour | Original blueprint id, parent blueprint id, version number, owner id, editable draft, reviewed blueprint, edited payload |
| UT008 | Validate experiment payload validation | Experiment name, BTCUSDT symbol, interval, start date, end date, train/validation/test split, blueprint id, parameter overrides |
| UT009 | Validate experiment compiler output and parameter permutations | Blueprint configuration, override payload, fixed parameter, range parameter, allowed value list, deterministic seed, permutation cap |
| UT010 | Validate experiment controller ownership behaviour | Owner id, non-owner id, staff actor, experiment id, status filter, queue response, stale queue metadata |
| UT011 | Validate market-data normalization, cache, and script behaviour | Raw kline rows, timestamps, open/high/low/close/volume values, duplicate timestamp rows, invalid interval, cache range, refresh script inputs |
| UT012 | Validate target strategy factory and target generation | Candle direction target, lookahead setting, forward return value, invalid target configuration, binary target output |
| UT013 | Validate indicator strategy behaviour | OHLCV candle frame, SMA, RSI, VWAP, rolling volatility, TA-Lib indicator parameters, malformed parameters, warmup rows |
| UT014 | Validate model architecture factory behaviour | Logistic regression, ridge classifier, architecture metadata, indicator metadata, target metadata, invalid architecture name |
| UT015 | Validate queue service and job metadata behaviour | Experiment id, job id, queue position, queued job state, running job state, terminal metadata cache, unsupported job type |
| UT016 | Validate worker status transition behaviour | Experiment id, valid worker payload, invalid worker payload, missing experiment, executor success result, executor failure result |
| UT017 | Validate job cancellation strategy behaviour | Queued job, running job, completed job, unsupported job, owner cancellation, unauthorized cancellation attempt |
| UT018 | Validate logs download behaviour | Completed experiment id, incomplete experiment id, artifact type, model id, CSV output, unsupported export request |
| UT019 | Validate documentation controller behaviour | Documentation slug, Markdown title, document list, missing document slug, authentication state |
| UT020 | Validate public hub filtering behaviour | Enabled user, disabled user, completed experiment, incomplete experiment, approved blueprint, rejected blueprint, successful model |
| UT021 | Validate system controller and settings behaviour | Queue snapshot, setting key, setting value, system event filter, request trace, event CSV download |
| UT022 | Validate login and registration views | Form fields, validation messages, mocked successful response, mocked failed response, redirect expectation |
| UT023 | Validate authentication guards and navigation filtering | Authenticated user, guest user, Moderator role, Administrator role, protected route, staff route, navigation item metadata |
| UT024 | Validate dashboard and BTCUSDT chart states | Chart candle data, interval selection, loading state, empty state, error state, fallback dashboard values |
| UT025 | Validate blueprint wizard, detail, library, and moderation views | Blueprint metadata, wizard steps, validation errors, library tabs, detail payload, approval status, moderation action |
| UT026 | Validate experiment wizard, list, and detail views | Experiment form data, dataset preview, split fields, blueprint options, overrides, status list, detail payload, model leaderboard |
| UT027 | Validate job detail and job status views | Job id, job status, queue metadata, cancellation action, missing-job response, friendly error message |
| UT028 | Validate model ranking and model detail views | Model metrics, ranking list, filter operator, sort field, pagination, favorite toggle, detail payload, log data |
| UT029 | Validate favorites, public hub, and documentation views | Favorite models, favorite blueprints, hub tabs, public users, public experiments, Markdown document content |
| UT030 | Validate user-management and system-management views | User list, role controls, status controls, queue snapshot, system settings, system events, BTCUSDT cache controls |
| UT031 | Validate reusable layout, table, badge, loading, empty, and error components | Component props, page shell content, table rows, empty message, error message, status badge values, dialog state |
| UT032 | Validate frontend API client CSRF behaviour | Mutating request, CSRF token response, credentials flag, API error shape, mocked fetch calls |

## 7.1.3 Test Results

The backend test command completed successfully and reached 100% execution. The backend suite collected 375 tests and no backend test failures were reported. The frontend test command also completed successfully, with 25 test suites and 113 tests passing. Non-failing console warnings were observed during the frontend run, but they did not cause any test failure.

### Test Execution Evidence

| Area | Command Executed | Execution Result |
| --- | --- | --- |
| Backend unit tests | `cd backend && .venv/bin/pytest -q` | Passed. The pytest run reached 100% completion with no failures. A separate collection check reported 375 backend tests collected. |
| Frontend unit tests | `cd frontend && npm test -- --runInBand` | Passed. Jest reported 25 passed test suites, 113 passed tests, 0 snapshots, and all test suites completed. |

### Unit Test Results Table

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
| --- | --- | --- | --- | --- | --- | --- |
| UT001 | Test account registration and login unit behaviour | Backend test environment is available | Account validation and login response are verified | Run authentication controller tests | Valid users are accepted, invalid credentials are rejected, disabled accounts are blocked, and session data is created | Passed in backend pytest run |
| UT002 | Test RBAC decision logic | Test users with Normal User, Moderator, and Administrator roles exist | Authorization result is returned | Run access-control service tests | Staff/admin access is permitted only for allowed roles, and unauthorized users are blocked | Passed in backend pytest run |
| UT003 | Test session creation, lookup, and expiry | Session service is initialized | Session state is created, resolved, expired, or rejected | Run session service tests | Active sessions resolve user identity, expired sessions are rejected, and configured timeout behaviour is respected | Passed in backend pytest run |
| UT004 | Test user-management controller actions | Staff or administrator actor is authenticated | User-management response is returned | Run user controller tests | Staff operations follow role restrictions and administrator-only actions remain protected | Passed in backend pytest run |
| UT005 | Test blueprint validation rules | Blueprint payloads are available | Validation result is returned | Run blueprint validator tests | Valid payloads pass and invalid payloads return structured field errors | Passed in backend pytest run |
| UT006 | Test blueprint approval transitions | Blueprint records with different states exist | State transition is persisted or rejected | Run blueprint approval controller tests | Only valid staff actions change approval state, and invalid transitions are rejected | Passed in backend pytest run |
| UT007 | Test blueprint versioning | Existing blueprint is available | Original or new version is saved | Run versioning service tests | Editable drafts update safely and reviewed artifacts are preserved through versioned copies | Passed in backend pytest run |
| UT008 | Test experiment validation rules | Experiment payloads and blueprint options exist | Validation result is returned | Run experiment validator tests | Invalid split, date, blueprint, interval, and override payloads are rejected | Passed in backend pytest run |
| UT009 | Test experiment compiler | Blueprint and experiment configuration are available | Compiled snapshots and permutations are produced | Run experiment compiler tests | Stable compiled snapshots and deterministic parameter permutations are generated without mutating source blueprint data | Passed in backend pytest run |
| UT010 | Test experiment ownership and controller behaviour | Owner, non-owner, and staff actors exist | Access result and experiment response are returned | Run experiment controller tests | Owners can view own experiments, unauthorized users are blocked, and queue/error responses are controlled | Passed in backend pytest run |
| UT011 | Test market-data normalization, cache, and scripts | Raw candle data and cache inputs are supplied | Normalized cache or script result is returned | Run market-data service, controller, repository, and script tests | Candles are normalized, invalid ranges are rejected, duplicate timestamps are not duplicated, and script flows handle refresh/gap behaviour | Passed in backend pytest run |
| UT012 | Test target strategy generation | Candle data and target configuration are available | Target column is produced or validation error is returned | Run target strategy and target factory tests | Correct target values are generated and invalid target settings are rejected | Passed in backend pytest run |
| UT013 | Test indicator strategies | Candle data and indicator configuration exist | Feature columns are generated or validation error is returned | Run indicator strategy tests | Indicator outputs match expected calculation behaviour and malformed parameters are rejected | Passed in backend pytest run |
| UT014 | Test architecture factory | Architecture names and metadata are supplied | Architecture metadata or instance is returned | Run architecture factory tests | Known architectures resolve correctly and unknown architecture names are rejected | Passed in backend pytest run |
| UT015 | Test queue metadata | Queue adapter or queue fake is available | Queue metadata is returned | Run queue service and job metadata tests | Job id, queue position, job detail, terminal metadata fallback, and unsupported job handling behave correctly | Passed in backend pytest run |
| UT016 | Test worker transitions | Experiment and worker payload are available | Experiment state is updated | Run worker tests | Worker payload validation and Queued to Running to Completed or Failed transitions behave correctly | Passed in backend pytest run |
| UT017 | Test cancellation behaviour | Job states and experiment records are available | Cancellation result is returned | Run job cancellation tests | Eligible jobs can be cancelled and completed, unsupported, or unauthorized jobs are blocked | Passed in backend pytest run |
| UT018 | Test log download units | Experiment log data exists | CSV or error response is generated | Run logs download tests | Supported artifacts return downloadable output and incomplete experiment exports are rejected | Passed in backend pytest run |
| UT019 | Test documentation units | Markdown document data exists | Document response is returned | Run documentation controller tests | Existing documents render and missing document slugs return controlled errors | Passed in backend pytest run |
| UT020 | Test public hub units | Users, experiments, models, and blueprints exist | Public hub payload is returned | Run public hub tests | Only enabled users and allowed public research artifacts appear | Passed in backend pytest run |
| UT021 | Test system units | Queue, settings, and event data exist | System payload is returned | Run system controller tests | Administrator-visible queue, settings, events, tracing, and export responses are returned correctly | Passed in backend pytest run |
| UT022 | Test login and registration views | Frontend test renderer and mocked API responses are available | View behaviour is verified | Run login and registration view tests | Validation, blocked invalid submission, successful submission, and redirect behaviour render correctly | Passed in frontend Jest run |
| UT023 | Test auth guards and navigation | Mock authentication contexts are available | Route and navigation behaviour is verified | Run auth guard and navigation tests | Guests and insufficient roles are redirected or blocked, while allowed roles see the correct navigation items | Passed in frontend Jest run |
| UT024 | Test dashboard and chart states | Mock chart API responses exist | Chart and dashboard states are rendered | Run dashboard and BTCUSDT chart tests | Loading, empty, error, and success states render correctly and chart data is passed to the chart component | Passed in frontend Jest run |
| UT025 | Test blueprint views | Mock blueprint API responses exist | Blueprint view behaviour is verified | Run blueprint wizard, library, detail, and moderation tests | Wizard validation, library tabs, detail rendering, favorite behaviour, and moderation actions render correctly | Passed in frontend Jest run |
| UT026 | Test experiment views | Mock experiment API responses exist | Experiment view behaviour is verified | Run experiment wizard, list, and detail tests | Wizard validation, list filtering, detail rendering, model leaderboard, and download controls behave correctly | Passed in frontend Jest run |
| UT027 | Test job views | Mock job API responses exist | Job view behaviour is verified | Run job detail tests | Job status and friendly missing-resource states render correctly | Passed in frontend Jest run |
| UT028 | Test model views | Mock model API responses exist | Model view behaviour is verified | Run model ranking and detail tests | Rankings, sorting, filtering, pagination, detail links, metrics, logs, and favorite behaviour render correctly | Passed in frontend Jest run |
| UT029 | Test favorites, public hub, and documentation views | Mock API responses exist | Related view behaviour is verified | Run favorites, public hub, and documentation tests | Favorite lists, public hub tabs, and Markdown documentation content render correctly | Passed in frontend Jest run |
| UT030 | Test user-management and system-management views | Mock staff/admin API responses exist | Admin and staff screen behaviour is verified | Run user-management and system-management tests | Staff and administrator screens render expected controls, queue information, settings, events, and cache controls | Passed in frontend Jest run |
| UT031 | Test reusable user-interface components | Component props are supplied | Rendered output is verified | Run shared component tests | Layout, wizard, dialog, status badge, loading, empty, and error states render consistently | Passed in frontend Jest run |
| UT032 | Test API client CSRF behaviour | Mock fetch and CSRF endpoint exist | Request behaviour is verified | Run API client tests | Mutating requests fetch and attach CSRF tokens with credentials and return controlled API errors | Passed in frontend Jest run |

## 7.1.4 Unit Testing Summary

The unit testing stage confirmed that the main backend and frontend units behave according to their expected responsibilities. Backend tests verified authentication, sessions, access control, user management, blueprint validation and moderation, experiment validation and compilation, market-data handling, target and indicator processing, architecture selection, queue metadata, worker execution, job cancellation, logs, documentation, public hub filtering, and system management. Frontend tests verified login, registration, protected routing, navigation, dashboard rendering, chart states, blueprint workflows, experiment workflows, job detail behaviour, model rankings, favorites, public hub, documentation, staff views, administrative views, reusable components, and API-client CSRF handling.

Based on the executed test commands, the unit test stage passed for the current implementation. The backend command completed without failures, and the frontend command reported all Jest suites and tests as passed. These results provide confidence that individual components are stable enough to proceed into integration testing, where the same modules are evaluated as connected workflows across the frontend, backend, database, queue, worker, and supporting scripts.

---

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

---

# 7.3 Usability Testing

Usability testing was carried out to determine whether the Bitcoin Experimental Engine was developed in a usable fashion for its intended end-users. Unlike unit testing and integration testing, which focus on internal correctness and module communication, usability testing focuses on whether the intended actors can complete the required tasks through the web interface with understandable labels, visible feedback, and clear navigation.

The usability tests were derived from the functional requirements defined in Chapter 3. The tested subjects are mapped to the main actor roles of the system: Guest, Normal User, Moderator, Administrator, Staff User, and Authenticated User. The `Time` column is skipped because exact task duration was not measured. The status values used are `Success`, `Moderate Success`, and `Failure`.

## 7.3.1 Usability Test Status Legend

| Status | Meaning |
| --- | --- |
| Success | The subject was able to complete the task without assistance and the interface provided sufficient feedback. |
| Moderate Success | The subject was able to complete the task but the workflow required minor interpretation, careful reading, or additional confirmation. |
| Failure | The subject was unable to complete the task or the workflow prevented completion. |

## 7.3.2 User Authentication and Authorization Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F1.1 | Guest | - | The subject was able to locate the registration page and submit an account using a valid email address. | Success | Email-based registration is usable for new users. |
| 25 June 2026 | F1.2 | Guest | - | The subject was able to register without needing to understand the internal credential-storage mechanism. | Success | Credential handling is hidden from the user and does not interrupt the registration flow. |
| 25 June 2026 | F1.3 | Guest | - | The subject was able to enter a username during registration. | Success | Username entry is clear in the registration form. |
| 25 June 2026 | F1.4 | Guest | - | The subject received clear feedback when attempting to register with an existing username. | Success | Duplicate-username prevention is understandable from the user interface. |
| 25 June 2026 | F1.5 | Normal User | - | The subject was able to access normal user functions after account creation. | Success | Standard user privileges are usable after login. |
| 25 June 2026 | F1.6 | Moderator | - | The subject was able to see moderation-related navigation after logging in as a moderator. | Success | Moderator capabilities are discoverable from the interface. |
| 25 June 2026 | F1.7 | Administrator | - | The subject was able to see administrator functions after logging in as an administrator. | Success | Administrator privileges are visible and accessible to the correct actor. |
| 25 June 2026 | F1.8 | Normal User / Staff User | - | The subject observed that staff-only routes were hidden or blocked for normal users and available to staff users. | Success | Staff-only access is clear and protected in the interface. |
| 25 June 2026 | F1.9 | Guest | - | The subject was able to authenticate using email and password on the login page. | Success | Login is usable for returning users. |
| 25 June 2026 | F1.10 | Authenticated User | - | The subject was able to find the logout action and return to unauthenticated state. | Success | Logout is clear and easy to complete. |
| 25 June 2026 | F1.11 | Guest | - | The subject was able to submit username input without needing to manually normalize spacing or case. | Success | Username normalization does not create confusion during registration. |
| 25 June 2026 | F1.12 | Guest | - | The subject received validation feedback when username characters did not meet the allowed format. | Success | Username format restrictions are communicated clearly. |
| 25 June 2026 | F1.13 | Guest | - | The subject received validation feedback for username length constraints. | Success | Username length rules are understandable during registration. |
| 25 June 2026 | F1.14 | Guest / New User | - | The subject was redirected into the authenticated area after successful authentication. | Success | Session creation is visible through immediate access to authenticated pages. |
| 25 June 2026 | F1.15 | Authenticated User | - | The subject was able to remain logged in during normal application navigation until logout or timeout conditions. | Success | Session persistence is usable and does not interrupt normal navigation. |
| 25 June 2026 | F1.16 | Administrator | - | The subject was able to locate session-timeout settings in the system-management interface. | Success | Session-timeout configuration is usable for administrators. |

## 7.3.3 User Management Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F2.1 | Staff User | - | The subject was able to open the user-management page and view registered user profiles and statuses. | Success | User profile listing is usable for staff users. |
| 25 June 2026 | F2.2 | Staff User | - | The subject was able to access the create-user form for creating a Normal User account. | Success | Staff account creation flow is understandable. |
| 25 June 2026 | F2.3 | Administrator | - | The subject was able to locate administrator-only user removal controls. | Success | User removal is visible only to the appropriate actor. |
| 25 June 2026 | F2.4 | Administrator | - | The subject was able to locate and use role assignment controls. | Success | Role management is usable for administrators. |
| 25 June 2026 | F2.5 | Administrator | - | The subject was able to locate the reset-password action for user accounts. | Success | Password reset is discoverable in the user-management interface. |
| 25 June 2026 | F2.6 | Administrator | - | The subject was able to update usernames from the user-management interface. | Success | Username administration is usable for administrators. |
| 25 June 2026 | F2.7 | Staff User | - | The subject was able to enable or disable user access from the user list. | Success | Account status control is clear for staff users. |
| 25 June 2026 | F2.8 | Moderator | - | The subject observed that moderator controls were limited compared with administrator controls. | Success | Moderator restrictions are understandable because unavailable controls are hidden or blocked. |

## 7.3.4 Experiment Configuration Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F3.1 | Normal User | - | The subject was able to start a new experiment and enter experiment metadata. | Success | Experiment record creation is usable through the wizard. |
| 25 June 2026 | F3.2 | Normal User | - | The subject observed that the dataset scope is fixed to BTCUSDT, reducing selection ambiguity. | Success | Fixed dataset scope is clear to the user. |
| 25 June 2026 | F3.3 | Normal User | - | The subject was able to choose a supported interval from the interval selection control. | Success | Interval selection is usable. |
| 25 June 2026 | F3.4 | Normal User | - | The subject was able to specify the experiment start date. | Success | Start-date input is clear in the dataset step. |
| 25 June 2026 | F3.5 | Normal User | - | The subject was able to specify the experiment end date. | Success | End-date input is clear in the dataset step. |
| 25 June 2026 | F3.6 | Normal User | - | The subject was able to enter validation and test split values through the split configuration step. | Success | Split configuration is usable. |
| 25 June 2026 | F3.7 | Normal User | - | The subject received validation feedback when split values did not form a valid total. | Success | Split total validation is understandable. |
| 25 June 2026 | F3.8 | Normal User | - | The subject received clear feedback when the validation split was too small. | Success | Minimum validation split rule is communicated clearly. |
| 25 June 2026 | F3.9 | Normal User | - | The subject received clear feedback when the test split was too small. | Success | Minimum test split rule is communicated clearly. |
| 25 June 2026 | F3.10 | Normal User | - | The subject could see the training split derived from the remaining allocation. | Success | Derived training split is understandable. |
| 25 June 2026 | F3.11 | Normal User | - | The subject was able to choose an accessible approved Blueprint during experiment setup. | Success | Blueprint selection is usable. |
| 25 June 2026 | F3.12 | Normal User | - | The subject was able to configure interval and date-range settings together. | Success | Temporal configuration is clear in the wizard. |
| 25 June 2026 | F3.13 | Normal User | - | The subject was able to view and change experiment-specific parameter overrides. | Success | Parameter overrides are usable, although they require careful review. |
| 25 June 2026 | F3.14 | Normal User | - | The subject could review generated parameter combinations before submission. | Moderate Success | Permutation generation is usable, but users must understand that many combinations can increase execution size. |
| 25 June 2026 | F3.15 | Normal User | - | The subject could understand from the review/result workflow that each parameter variant produces model output. | Moderate Success | Model-per-variant behaviour is understandable after reviewing experiment output. |
| 25 June 2026 | F3.16 | Normal User | - | The subject could open experiment detail and see generated models associated with the experiment. | Success | Relationship between experiment and models is visible in the result interface. |

## 7.3.5 Experiment Execution Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F4.1 | Normal User | - | The subject did not need to control the internal pipeline sequence and could rely on the system workflow. | Success | Pipeline ordering is hidden from the user and does not complicate execution. |
| 25 June 2026 | F4.2 | Normal User | - | The subject was able to submit a validated experiment from the review step. | Success | Experiment submission is usable. |
| 25 June 2026 | F4.3 | Normal User | - | The subject could observe execution state changes from experiment or job detail screens. | Success | State transitions are visible to the user. |
| 25 June 2026 | F4.4 | Normal User | - | The subject could view progress or status information while an experiment was queued or running. | Success | Progress feedback is understandable. |
| 25 June 2026 | F4.5 | Normal User | - | The subject was able to request cancellation for a pending experiment job. | Success | Pending job cancellation is usable. |
| 25 June 2026 | F4.6 | Normal User | - | The subject was able to access cancellation controls for an eligible running job. | Success | Running job cancellation is discoverable when available. |
| 25 June 2026 | F4.7 | Normal User | - | The subject could access confusion metrics logs from completed experiment results. | Success | Confusion metric outputs are available from the result interface. |
| 25 June 2026 | F4.8 | Normal User | - | The subject could access test evaluation metrics after completion. | Success | Evaluation metrics are usable for result inspection. |
| 25 June 2026 | F4.9 | Normal User | - | The subject could retrieve experiment artifacts through the application without managing files manually. | Success | Database-backed artifact access is transparent to the user. |
| 25 June 2026 | F4.10 | Normal User | - | The subject was able to view available results from the browser without handling intermediate files. | Success | Result access is usable without manual file management. |
| 25 June 2026 | F4.11 | Normal User | - | The subject could locate download actions for experiment artifacts. | Success | Artifact downloads are discoverable. |
| 25 June 2026 | F4.12 | Normal User | - | The subject could download confusion metrics logs when available. | Success | Confusion log download is usable. |
| 25 June 2026 | F4.13 | Normal User | - | The subject could access internal backtest log download actions when available. | Success | Backtest log download is usable from result pages. |
| 25 June 2026 | F4.14 | Normal User | - | The subject could inspect aggregated performance metrics in experiment detail. | Success | Aggregated metrics are visible and readable. |

## 7.3.6 Model Output Processing Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F5.1 | Normal User | - | The subject could inspect persisted prediction-related output through model and log views after completion. | Success | Prediction output storage is represented through result views. |
| 25 June 2026 | F5.2 | Normal User | - | The subject could understand that model outputs are transformed into signals through the displayed metrics and logs. | Moderate Success | Signal transformation is available, but users may need documentation to interpret it fully. |
| 25 June 2026 | F5.3 | Normal User | - | The subject could interpret long-position signal behaviour from result documentation and logs. | Moderate Success | Long signal meaning is available but benefits from documentation support. |
| 25 June 2026 | F5.4 | Normal User | - | The subject could interpret flat-position signal behaviour from result documentation and logs. | Moderate Success | Flat signal meaning is available but benefits from documentation support. |
| 25 June 2026 | F5.5 | Normal User | - | The subject did not need to manually enforce repeated-position restrictions during result viewing. | Success | Position-management protection is automatic and does not burden the user. |
| 25 June 2026 | F5.6 | Normal User | - | The subject could view results without configuring unsupported short-selling behaviour. | Success | Long-only evaluation is handled by the system and is usable. |
| 25 June 2026 | F5.7 | Normal User | - | The subject was not presented with short-position controls in the normal workflow. | Success | Unsupported short-position actions are not exposed to the user. |
| 25 June 2026 | F5.8 | Normal User | - | The subject received controlled result output without manually validating position constraints. | Success | Position-management validation is automatic from the user perspective. |

## 7.3.7 Experiment Discovery and Reuse Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F6.1 | Authenticated User | - | The subject could see owner usernames associated with public or listed model records. | Success | Model ownership is visible. |
| 25 June 2026 | F6.2 | Authenticated User | - | The subject could identify the model owner from model listings. | Success | Username display supports model discovery. |
| 25 June 2026 | F6.3 | Authenticated User | - | The subject could use user-related discovery from Public Hub or profile links. | Success | User discovery is usable. |
| 25 June 2026 | F6.4 | Authenticated User | - | The subject could filter or browse models by user context where available. | Success | User-based model browsing is understandable. |
| 25 June 2026 | F6.5 | Normal User | - | The subject could browse Blueprint libraries and open Blueprint details. | Success | Blueprint repository browsing is usable. |
| 25 June 2026 | F6.6 | Authenticated User | - | The subject could open profile views containing activity or artifact summaries. | Success | Profile detail viewing is usable. |
| 25 June 2026 | F6.7 | Normal User | - | The subject could favorite a model from model detail or listing context. | Success | Model favoriting is usable. |
| 25 June 2026 | F6.8 | Normal User | - | The subject could favorite a Blueprint from Blueprint detail or library context. | Success | Blueprint favoriting is usable. |
| 25 June 2026 | F6.9 | Normal User | - | The subject could open the Favorites page and view saved items. | Success | Favorites library is usable. |
| 25 June 2026 | F6.10 | Normal User | - | The subject could understand reuse through model or Blueprint detail actions and experiment setup paths. | Moderate Success | Reuse is possible, but users may need to read labels carefully before starting a new configuration. |

## 7.3.8 Model Catalog and Rankings Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F7.1 | Authenticated User | - | The subject could open model rankings and view models ordered by performance metrics. | Success | Ranking display is usable. |
| 25 June 2026 | F7.2 | Authenticated User | - | The subject could open model detail and inspect metrics, parameters, and experiment context. | Success | Model detail page is usable. |
| 25 June 2026 | F7.3 | Normal User | - | The subject could locate actions or navigation paths for initiating further experiments from model context. | Moderate Success | Experiment initiation from model context is usable but requires users to understand the reuse path. |

## 7.3.9 Favorites Library Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F8.1 | Normal User | - | The subject could open a consolidated Favorites page for saved models and Blueprints. | Success | Favorites overview is usable. |
| 25 June 2026 | F8.2 | Normal User | - | The subject could distinguish saved models from saved Blueprints using the favorites interface. | Success | Favorites segmentation is understandable. |
| 25 June 2026 | F8.3 | Normal User | - | The subject could remove items from favorites and observe the updated state. | Success | Removing favorites is usable. |

## 7.3.10 Server-Side Experiment Execution and Queueing Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F9.1 | Normal User | - | The subject could submit experiment run requests from an authenticated client session. | Success | Authenticated job submission is usable. |
| 25 June 2026 | F9.2 | Normal User | - | The subject could submit an experiment and understand that execution continues asynchronously. | Success | Asynchronous execution is clear from queue/status feedback. |
| 25 June 2026 | F9.3 | Normal User | - | The subject did not need to provide local computing resources after job submission. | Success | Server-side execution is transparent to the user. |
| 25 June 2026 | F9.4 | Normal User | - | The subject could view completed evaluation results from the server-side workflow. | Success | Server-side evaluation output is accessible. |
| 25 June 2026 | F9.5 | Administrator | - | The subject could observe concurrency-related settings or queue controls in system management. | Success | Concurrent job limit visibility is usable for administrators. |
| 25 June 2026 | F9.6 | Administrator | - | The subject could locate administrative controls for job-execution limits. | Success | Concurrency-limit management is usable for administrators. |
| 25 June 2026 | F9.7 | Normal User | - | The subject could view relative queue position or queue status after submission. | Success | Queue position feedback is usable. |
| 25 June 2026 | F9.8 | Normal User | - | The subject could view running job status updates. | Success | Running job status is understandable. |
| 25 June 2026 | F9.9 | Normal User | - | The subject could request cancellation before execution begins. | Success | Pending job cancellation is usable. |
| 25 June 2026 | F9.10 | Normal User | - | The subject could request cancellation for a running job where cancellation is allowed. | Success | Running job cancellation is usable when available. |
| 25 June 2026 | F9.11 | Normal User | - | The subject could inspect job execution state from the job or experiment detail interface. | Success | Job state visibility is usable. |
| 25 June 2026 | F9.12 | Normal User | - | The subject could access result artifacts after successful job completion. | Success | Persisted result access is usable. |
| 25 June 2026 | F9.13 | Normal User | - | The subject could see failed job status and diagnostic information where available. | Success | Failure feedback is usable and avoids silent failure. |
| 25 June 2026 | F9.14 | Normal User | - | The subject could understand retry-related behaviour through controlled job status feedback where applicable. | Moderate Success | Retry handling is mostly internal and may require documentation for full user understanding. |
| 25 June 2026 | F9.15 | Administrator | - | The subject could interpret resource-related execution controls from the system-management screen. | Moderate Success | Resource allocation controls are usable for administrators but require careful configuration. |

## 7.3.11 Administration and System Monitoring Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F10.1 | Administrator | - | The subject could access the administrative system-management dashboard. | Success | Administrative dashboard access is usable. |
| 25 June 2026 | F10.2 | Administrator | - | The subject could inspect system health and data availability indicators from system management. | Success | System health visibility is usable. |
| 25 June 2026 | F10.3 | Administrator | - | The subject could view active job items and their current execution state. | Success | Operational job monitoring is usable. |

## 7.3.12 Blueprint Authoring and Approval Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F11.1 | Normal User | - | The subject could create a Blueprint with indicator selections and architecture parameters. | Success | Blueprint creation is usable. |
| 25 June 2026 | F11.2 | Normal User | - | The subject could define configurable parameter ranges for selected indicators. | Success | Indicator range input is usable. |
| 25 June 2026 | F11.3 | Normal User | - | The subject could define feature-related parameter settings in the Blueprint workflow. | Success | Feature configuration is usable. |
| 25 June 2026 | F11.4 | Normal User | - | The subject could configure reference architecture hyperparameter ranges. | Success | Architecture parameter configuration is usable. |
| 25 June 2026 | F11.5 | Normal User | - | The subject could edit drafts and observe version-aware behaviour after review-related states. | Moderate Success | Versioning is usable but requires users to understand reviewed artifacts are preserved. |
| 25 June 2026 | F11.6 | Normal User | - | The subject could identify that non-administrator Blueprints must be submitted for approval. | Success | Approval requirement is visible to normal users. |
| 25 June 2026 | F11.7 | Normal User | - | The subject could request approval and observe the Blueprint moving to pending status. | Success | Approval request flow is usable. |
| 25 June 2026 | F11.8 | Moderator / Administrator | - | The subject could approve a pending Blueprint from the moderation interface. | Success | Blueprint approval is usable for staff actors. |
| 25 June 2026 | F11.9 | Moderator / Administrator | - | The subject could reject a pending Blueprint from the moderation interface. | Success | Blueprint rejection is usable for staff actors. |
| 25 June 2026 | F11.10 | Moderator / Administrator | - | The subject could disapprove an approved Blueprint and trigger an editable remediation state. | Moderate Success | Disapproval workflow is usable but users must understand the remediation state. |
| 25 June 2026 | F11.11 | Normal User | - | The subject could see their own Blueprints regardless of approval state. | Success | Owner Blueprint visibility is usable. |
| 25 June 2026 | F11.12 | Staff User | - | The subject could see staff-visible Blueprint states in moderation or library views. | Success | Staff Blueprint visibility is usable. |
| 25 June 2026 | F11.13 | Authenticated User | - | The subject could see only approved Blueprints in public selection contexts. | Success | Public Blueprint visibility is clear. |
| 25 June 2026 | F11.14 | Normal User | - | The subject could save Blueprint specifications through the structured wizard. | Success | Structured Blueprint persistence is usable. |
| 25 June 2026 | F11.15 | Normal User | - | The subject could select a Blueprint during experiment submission without manually compiling it. | Success | Blueprint compilation is automatic and does not burden the user. |
| 25 June 2026 | F11.16 | Normal User | - | The subject could inject experiment-specific interval and split values through the experiment wizard. | Success | Experiment-specific parameter injection is usable. |
| 25 June 2026 | F11.17 | Normal User / Staff User | - | The subject could inspect version and lineage cues where shown in Blueprint detail. | Moderate Success | Version lineage is available but requires careful reading by the user. |

## 7.3.13 Documentation Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F12.1 | Guest / Authenticated User | - | The subject could open the documentation page and read rendered Markdown content. | Success | Documentation viewer is usable and readable. |

## 7.3.14 Public Hub Visibility Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F13.1 | Authenticated User | - | The subject could browse completed experiments through the Public Hub. | Success | Completed experiment discovery is usable. |
| 25 June 2026 | F13.2 | Guest / Authenticated User | - | The subject observed that Public Hub access requires authentication. | Success | Public Hub access restriction is clear. |
| 25 June 2026 | F13.3 | Authenticated User | - | The subject could browse enabled user accounts in the Public Hub Users tab. | Success | Public user browsing is usable. |
| 25 June 2026 | F13.4 | Authenticated User | - | The subject could browse completed experiments in the Public Hub Experiments tab. | Success | Public experiment browsing is usable. |
| 25 June 2026 | F13.5 | Authenticated User | - | The subject could browse models from successful experiments in the Public Hub Models tab. | Success | Public model browsing is usable. |
| 25 June 2026 | F13.6 | Authenticated User | - | The subject could browse approved Blueprints in the Public Hub Blueprints tab. | Success | Public Blueprint browsing is usable. |

## 7.3.15 Usability Testing Summary

The usability testing results show that the system is generally usable for its intended actor roles. Guests can register and log in, authenticated users can access research workflows, normal users can create Blueprints and experiments, moderators can perform moderation-related actions, and administrators can access user-management and system-management features. The interface provides clear navigation, validation feedback, protected-route behavior, status indicators, and result-display screens for the main workflows.

Most requirements were marked as `Success` because the subject could complete the required task through the interface without assistance. A small number of requirements were marked as `Moderate Success` because the function is usable but conceptually more complex, such as parameter permutation generation, model-signal interpretation, retry/resource behavior, Blueprint version lineage, and model reuse. These areas can be improved through clearer inline explanations, tooltips, and documentation links.

---

# 7.4 Acceptance Testing

Acceptance testing was carried out to demonstrate that the completed Bitcoin Experimental Engine meets the predefined functional requirements and is acceptable to the end user or client. This testing stage serves as the final verification step before deployment, final demonstration, or project handover. The tests are written from the perspective of the actors who use the system rather than from the internal implementation perspective.

Each functional requirement is represented in the acceptance test tables below. The table columns follow the required format: Tester, Test Date, Test Objective, Test Inputs, Test Procedures, Expected Test Outputs, Actual Test Results, and Tester Comments. The Actual Test Results column is intentionally left blank so that it can be completed during the final acceptance demonstration. Tester comments assume that the expected and actual results are generally aligned unless the final handover test shows otherwise.

## 7.4.1 User Authentication and Authorization Acceptance Tests

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / Guest | 25 June 2026 | F1.1: To confirm that a guest can register using a valid email address | Registration form, name, username, valid email, password | 1. Open application. 2. Open registration. 3. Enter valid account details. 4. Submit form. | New account is created and user can proceed to authenticated access. |  | Accepted if valid email registration succeeds. |
| Project evaluator / Guest | 25 June 2026 | F1.2: To confirm password credentials are stored securely before persistence | Registration form, password field | 1. Open registration. 2. Enter password. 3. Submit account creation. 4. Confirm no raw password is displayed back to user. | Account is created and credential handling remains hidden from the user interface. |  | Accepted if sensitive credential value is never exposed. |
| Project evaluator / Guest | 25 June 2026 | F1.3: To confirm users can define a unique username | Registration form, username field | 1. Open registration. 2. Enter a valid unique username. 3. Complete form. 4. Submit. | Account is created with the chosen username. |  | Accepted if username input is clear and required. |
| Project evaluator / Guest | 25 June 2026 | F1.4: To confirm duplicate usernames are prevented | Existing username, registration form | 1. Open registration. 2. Enter existing username. 3. Submit form. | Registration is rejected with a clear validation message. |  | Accepted if duplicate username error is understandable. |
| Project evaluator / Normal User | 25 June 2026 | F1.5: To confirm Normal User role has standard privileges | Normal User account, authenticated routes | 1. Login as Normal User. 2. Open dashboard. 3. Navigate to research features. | Normal User can access dashboard, Blueprints, experiments, models, favorites, Public Hub, documentation, and profile pages. |  | Accepted if standard features are available without staff controls. |
| Project evaluator / Moderator | 25 June 2026 | F1.6: To confirm Moderator role has moderation capabilities | Moderator account, moderation route | 1. Login as Moderator. 2. Open staff navigation. 3. Open moderation screen. | Moderator can access permitted moderation functions. |  | Accepted if moderation capabilities are visible only to staff roles. |
| Project evaluator / Administrator | 25 June 2026 | F1.7: To confirm Administrator role has full management privileges | Administrator account, management routes | 1. Login as Administrator. 2. Open user management. 3. Open system management. | Administrator can access full management controls. |  | Accepted if administrator functions are available only to administrators. |
| Project evaluator / Normal User and Staff User | 25 June 2026 | F1.8: To confirm staff-only operations are restricted to staff accounts | Normal User, Moderator, Administrator, staff route | 1. Attempt staff page as Normal User. 2. Access staff page as Moderator. 3. Access administrator page as Administrator. | Normal User is blocked, Moderator receives permitted staff access, and Administrator receives full permitted access. |  | Accepted if frontend and backend restrictions match. |
| Project evaluator / Guest | 25 June 2026 | F1.9: To confirm users can authenticate using email and password | Login form, registered email, password | 1. Open login page. 2. Enter valid email and password. 3. Submit login form. | User is authenticated and redirected to dashboard. |  | Accepted if valid login succeeds and invalid login is rejected. |
| Project evaluator / Authenticated User | 25 June 2026 | F1.10: To confirm logout terminates the active session | Authenticated account, logout control | 1. Login. 2. Click logout. 3. Attempt to open protected page. | Session is terminated and protected pages are no longer accessible. |  | Accepted if logout clearly returns user to public state. |
| Project evaluator / Guest | 25 June 2026 | F1.11: To confirm usernames are normalized before validation | Username with uppercase characters or spacing | 1. Open registration. 2. Enter username with case or spacing variation. 3. Submit form. | Username is normalized consistently before validation. |  | Accepted if normalization does not confuse the user. |
| Project evaluator / Guest | 25 June 2026 | F1.12: To confirm usernames are restricted to lowercase alphanumeric characters | Username with unsupported characters | 1. Open registration. 2. Enter invalid username characters. 3. Submit form. | System rejects invalid username format with feedback. |  | Accepted if username format rule is clear. |
| Project evaluator / Guest | 25 June 2026 | F1.13: To confirm username length is between six and twelve characters | Too-short username, too-long username, valid username | 1. Enter too-short username. 2. Submit. 3. Enter too-long username. 4. Submit. 5. Enter valid username. | Invalid lengths are rejected and valid length is accepted. |  | Accepted if length feedback is understandable. |
| Project evaluator / Guest | 25 June 2026 | F1.14: To confirm successful authentication establishes a session | Login or registration form, valid credentials | 1. Login or register successfully. 2. Open dashboard. 3. Refresh page. | Authenticated session is established and restored after refresh. |  | Accepted if user remains authenticated after successful login. |
| Project evaluator / Authenticated User | 25 June 2026 | F1.15: To confirm sessions persist until logout, restart, or timeout | Authenticated session, page refresh, navigation | 1. Login. 2. Navigate between pages. 3. Refresh page. 4. Logout. | Session remains active during normal use and ends after logout or timeout condition. |  | Accepted if session persistence supports normal use. |
| Project evaluator / Administrator | 25 June 2026 | F1.16: To confirm administrators can configure session timeout duration | Administrator account, system settings form | 1. Login as Administrator. 2. Open system management. 3. Locate session-timeout setting. 4. Submit allowed value. | Session-timeout setting is updated within the allowed range. |  | Accepted if timeout control is clear and administrator-only. |

## 7.4.2 User Management Acceptance Tests

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / Staff User | 25 June 2026 | F2.1: To confirm staff can view registered user profiles and status information | Staff account, user-management page | 1. Login as staff. 2. Open user-management page. 3. Inspect user list and statuses. | Registered users and status information are displayed. |  | Accepted if user list is readable and protected. |
| Project evaluator / Staff User | 25 June 2026 | F2.2: To confirm staff can create Normal User accounts | Staff account, create-user form | 1. Login as staff. 2. Open user management. 3. Submit valid Normal User details. | New Normal User account is created. |  | Accepted if account creation is clear. |
| Project evaluator / Administrator | 25 June 2026 | F2.3: To confirm administrators can permanently remove user accounts | Administrator account, existing user, remove action | 1. Login as Administrator. 2. Open user management. 3. Select user removal action. 4. Confirm. | Selected user account is removed according to system rules. |  | Accepted if removal is administrator-only and confirmed. |
| Project evaluator / Administrator | 25 June 2026 | F2.4: To confirm administrators can modify user role assignments | Administrator account, user record, role control | 1. Open user management as Administrator. 2. Select user. 3. Change role. 4. Save. | User role is updated and reflected in the list. |  | Accepted if role control is clear. |
| Project evaluator / Administrator | 25 June 2026 | F2.5: To confirm administrators can reset user passwords | Administrator account, user record, reset action | 1. Open user management. 2. Select reset password action. 3. Submit reset details. | Password reset action completes successfully. |  | Accepted if reset control is administrator-only. |
| Project evaluator / Administrator | 25 June 2026 | F2.6: To confirm administrators can update usernames | Administrator account, username edit input | 1. Open user management. 2. Edit username. 3. Save changes. | Username is updated and invalid values are rejected. |  | Accepted if username editing gives clear feedback. |
| Project evaluator / Staff User | 25 June 2026 | F2.7: To confirm staff can enable or disable user account access | Staff account, target user, status control | 1. Open user management. 2. Change user status. 3. Save. | User access status changes to enabled or disabled. |  | Accepted if status change is visible. |
| Project evaluator / Moderator | 25 June 2026 | F2.8: To confirm moderators are restricted to creating Normal users and managing status only | Moderator account, user-management controls | 1. Login as Moderator. 2. Create Normal User. 3. Enable or disable user. 4. Attempt administrator-only action. | Moderator can perform permitted actions and cannot perform administrator-only actions. |  | Accepted if moderator limits are enforced and clear. |

## 7.4.3 Experiment Configuration Acceptance Tests

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / Normal User | 25 June 2026 | F3.1: To confirm users can create persistent experiment records with metadata | Experiment wizard, name, description | 1. Login. 2. Open experiment wizard. 3. Enter metadata. 4. Submit valid experiment. | Experiment record is saved with metadata. |  | Accepted if experiment appears after creation. |
| Project evaluator / Normal User | 25 June 2026 | F3.2: To confirm dataset source is fixed to BTCUSDT spot market data | Experiment wizard dataset step | 1. Open experiment wizard. 2. Inspect dataset section. | BTCUSDT is shown as fixed dataset source. |  | Accepted if dataset scope is unambiguous. |
| Project evaluator / Normal User | 25 June 2026 | F3.3: To confirm users can select supported intervals | Interval dropdown | 1. Open dataset step. 2. Select supported interval. 3. Continue. | Selected interval is accepted and shown in review. |  | Accepted if interval selection is usable. |
| Project evaluator / Normal User | 25 June 2026 | F3.4: To confirm users can specify start date | Start-date input | 1. Open dataset step. 2. Enter valid start date. 3. Continue. | Start date is accepted and shown in review. |  | Accepted if start-date input is clear. |
| Project evaluator / Normal User | 25 June 2026 | F3.5: To confirm users can specify end date | End-date input | 1. Open dataset step. 2. Enter valid end date. 3. Continue. | End date is accepted and shown in review. |  | Accepted if end-date input is clear. |
| Project evaluator / Normal User | 25 June 2026 | F3.6: To confirm users can define train, validation, and test split allocations | Split configuration step, percentage inputs | 1. Open split step. 2. Enter validation and test split. 3. Review training split. | Split values are accepted and displayed. |  | Accepted if split configuration is understandable. |
| Project evaluator / Normal User | 25 June 2026 | F3.7: To confirm split allocations must sum to one hundred percent | Invalid split values | 1. Enter invalid split values. 2. Attempt to continue or submit. | System rejects invalid split total with validation error. |  | Accepted if error explains the issue. |
| Project evaluator / Normal User | 25 June 2026 | F3.8: To confirm validation split minimum is ten percent | Validation split below ten percent | 1. Enter invalid validation split. 2. Continue or submit. | System rejects validation split below minimum. |  | Accepted if minimum rule is clear. |
| Project evaluator / Normal User | 25 June 2026 | F3.9: To confirm test split minimum is ten percent | Test split below ten percent | 1. Enter invalid test split. 2. Continue or submit. | System rejects test split below minimum. |  | Accepted if minimum rule is clear. |
| Project evaluator / Normal User | 25 June 2026 | F3.10: To confirm training split is derived as remainder | Validation split, test split | 1. Enter validation and test split. 2. Observe training split value. | Training split updates as remaining percentage. |  | Accepted if derived split is visible. |
| Project evaluator / Normal User | 25 June 2026 | F3.11: To confirm users can select accessible Blueprint | Approved Blueprint, Blueprint selection step | 1. Open Blueprint selection. 2. Select accessible approved Blueprint. | Blueprint is selected and shown in review. |  | Accepted if selectable Blueprints are clear. |
| Project evaluator / Normal User | 25 June 2026 | F3.12: To confirm temporal parameters can be configured | Interval, start date, end date | 1. Select interval. 2. Enter date range. 3. Review settings. | Temporal configuration is saved. |  | Accepted if date and interval settings are grouped clearly. |
| Project evaluator / Normal User | 25 June 2026 | F3.13: To confirm users can override parameter ranges for current experiment only | Selected Blueprint, override inputs | 1. Select Blueprint. 2. Open overrides. 3. Change parameter range. 4. Review. | Override applies to current experiment without changing source Blueprint. |  | Accepted if override scope is clear. |
| Project evaluator / Normal User | 25 June 2026 | F3.14: To confirm parameter permutations are generated from configurable ranges | Blueprint ranges, override values, review page | 1. Configure ranges. 2. Open review. 3. Inspect permutation summary. | Expected parameter permutation count is produced. |  | Accepted if permutation count is visible before submission. |
| Project evaluator / Normal User | 25 June 2026 | F3.15: To confirm one model artifact is produced per permutation | Completed experiment with multiple permutations | 1. Submit experiment with multiple permutations. 2. Allow completion. 3. Inspect generated models. | Generated model artifacts correspond to parameter variants. |  | Accepted if model outputs can be traced to variants. |
| Project evaluator / Normal User | 25 June 2026 | F3.16: To confirm generated models remain linked to parent experiment | Completed experiment, model detail | 1. Open experiment detail. 2. Open generated model. 3. Inspect experiment context. | Model remains linked to its parent experiment. |  | Accepted if relationship is visible. |

## 7.4.4 Experiment Execution Acceptance Tests

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / Normal User | 25 June 2026 | F4.1: To confirm immutable pipeline sequence prevents look-ahead bias | Valid experiment configuration | 1. Submit valid experiment. 2. Allow execution. 3. Inspect resulting logs and metrics. | Pipeline executes in the required raw data, split, indicator, target, scaling, training, and evaluation sequence. |  | Accepted if output is generated through controlled pipeline. |
| Project evaluator / Normal User | 25 June 2026 | F4.2: To confirm execution starts after validated submission | Valid experiment review page, submit button | 1. Complete experiment wizard. 2. Submit configuration. | Experiment run request is created. |  | Accepted if valid submission initiates execution workflow. |
| Project evaluator / Normal User | 25 June 2026 | F4.3: To confirm execution state transitions are persisted | Submitted experiment, detail page | 1. Submit experiment. 2. Open detail. 3. Refresh during state changes. | State changes remain available after refresh. |  | Accepted if execution state is persistent. |
| Project evaluator / Normal User | 25 June 2026 | F4.4: To confirm progress updates are visible | Running job, experiment detail | 1. Submit experiment. 2. Open job or experiment detail. 3. Observe progress. | Progress or stage values are visible. |  | Accepted if user can understand processing state. |
| Project evaluator / Normal User | 25 June 2026 | F4.5: To confirm pending requests can be cancelled | Pending job, cancel action | 1. Open pending job detail. 2. Click cancel. 3. Confirm. | Pending request is cancelled. |  | Accepted if cancellation status updates clearly. |
| Project evaluator / Normal User | 25 June 2026 | F4.6: To confirm running jobs can be cancelled | Running job, cancel action | 1. Open running job detail. 2. Click cancel. 3. Confirm. | Running job receives cancellation request and updates state. |  | Accepted if running cancellation feedback is clear. |
| Project evaluator / Normal User | 25 June 2026 | F4.7: To confirm confusion metrics logs are generated | Completed experiment | 1. Open completed experiment. 2. Inspect confusion metrics or downloads. | Confusion metrics log is available. |  | Accepted if confusion output can be reviewed. |
| Project evaluator / Normal User | 25 June 2026 | F4.8: To confirm test evaluation metrics logs are generated | Completed experiment | 1. Open completed experiment. 2. Inspect evaluation metrics. | Test-set evaluation metrics log is available. |  | Accepted if metrics can be reviewed. |
| Project evaluator / Normal User | 25 June 2026 | F4.9: To confirm database is authoritative source for artifacts | Completed experiment, refresh action | 1. Open completed experiment. 2. Refresh page. 3. Reopen artifacts. | Artifacts remain accessible through persisted records. |  | Accepted if results do not disappear after refresh. |
| Project evaluator / Normal User | 25 June 2026 | F4.10: To confirm artifacts are accessible without intermediate files | Completed experiment detail | 1. Open result detail page. 2. View models, metrics, and logs. | Artifacts are accessible through the application. |  | Accepted if no manual file management is needed. |
| Project evaluator / Normal User | 25 June 2026 | F4.11: To confirm experiment artifacts can be downloaded in CSV format | Download control, completed experiment | 1. Open completed experiment detail. 2. Click artifact download. | Supported artifact is downloaded as CSV. |  | Accepted if download action works clearly. |
| Project evaluator / Normal User | 25 June 2026 | F4.12: To confirm confusion metrics logs can be downloaded | Confusion metrics download action | 1. Open completed experiment detail. 2. Click confusion metrics download. | Confusion metrics CSV is generated. |  | Accepted if confusion log download is available. |
| Project evaluator / Normal User | 25 June 2026 | F4.13: To confirm backtest logs can be downloaded | Backtest log download action | 1. Open completed experiment detail. 2. Click backtest log download. | Backtest log output is downloaded. |  | Accepted if backtest log download is available. |
| Project evaluator / Normal User | 25 June 2026 | F4.14: To confirm aggregated performance metrics are displayed | Completed experiment detail | 1. Open completed experiment. 2. Inspect metric summary and model table. | Aggregated performance metrics are displayed. |  | Accepted if performance summary is readable. |

## 7.4.5 Model Output Processing Acceptance Tests

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / Normal User | 25 June 2026 | F5.1: To confirm raw prediction values are persisted | Completed model output | 1. Open completed experiment. 2. Inspect model outputs or logs. | Prediction-related output remains available. |  | Accepted if output can be retrieved after completion. |
| Project evaluator / Normal User | 25 June 2026 | F5.2: To confirm model outputs transform into binary signals using threshold | Model result, signal logs | 1. Open model or logs. 2. Inspect signal output. | Binary signal output is generated using configured threshold. |  | Accepted if signal output is available. |
| Project evaluator / Normal User | 25 June 2026 | F5.3: To confirm signal one means enter long position | Result log or documentation | 1. Open signal logs or documentation. 2. Inspect signal meaning. | Signal value one is interpreted as long-position entry. |  | Accepted if long signal meaning is understandable. |
| Project evaluator / Normal User | 25 June 2026 | F5.4: To confirm signal zero means flat position | Result log or documentation | 1. Open signal logs or documentation. 2. Inspect signal meaning. | Signal value zero is interpreted as flat position. |  | Accepted if flat signal meaning is understandable. |
| Project evaluator / Normal User | 25 June 2026 | F5.5: To confirm new long signals are rejected while a position is active | Completed backtest logs | 1. Run or inspect completed experiment. 2. Review position logs. | Overlapping long positions are prevented. |  | Accepted if rule is enforced automatically. |
| Project evaluator / Normal User | 25 June 2026 | F5.6: To confirm long-only position management is enforced | Completed experiment logs | 1. Open result logs. 2. Inspect position behaviour. | Evaluation follows long-only position management. |  | Accepted if no unsupported position behaviour appears. |
| Project evaluator / Normal User | 25 June 2026 | F5.7: To confirm short position signals are rejected | Completed experiment signal logs | 1. Inspect generated signals. 2. Confirm short signals are absent or rejected. | Short-position signals are rejected. |  | Accepted if short actions are not available. |
| Project evaluator / Normal User | 25 June 2026 | F5.8: To confirm position constraints are validated before evaluation | Experiment execution result | 1. Submit experiment. 2. Inspect result or failure diagnostics. | Invalid position-management behaviour is prevented before evaluation. |  | Accepted if validation is automatic and reliable. |

## 7.4.6 Experiment Discovery and Reuse Acceptance Tests

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / Authenticated User | 25 June 2026 | F6.1: To confirm model artifact is associated with originating username | Model listing, model record | 1. Open model ranking or detail. 2. Inspect owner field. | Model shows originating username. |  | Accepted if ownership is visible. |
| Project evaluator / Authenticated User | 25 June 2026 | F6.2: To confirm owner username is shown beside model listings | Model rankings page | 1. Open model rankings. 2. Inspect listed models. | Owner username appears beside model records. |  | Accepted if model creator is identifiable. |
| Project evaluator / Authenticated User | 25 June 2026 | F6.3: To confirm username-based search supports discovery | Public Hub search, username query | 1. Open Public Hub. 2. Enter username query. 3. Inspect results. | Matching user records are shown. |  | Accepted if user search is usable. |
| Project evaluator / Authenticated User | 25 June 2026 | F6.4: To confirm models can be filtered by username | Model list or hub filter | 1. Open model discovery area. 2. Apply username filter. | Models are filtered by selected user context. |  | Accepted if filtered result is clear. |
| Project evaluator / Authenticated User | 25 June 2026 | F6.5: To confirm Blueprint repositories can be browsed | Blueprint library | 1. Open Blueprint library. 2. Browse available Blueprints. 3. Open detail. | Blueprint repository entries are displayed. |  | Accepted if browsing is usable. |
| Project evaluator / Authenticated User | 25 June 2026 | F6.6: To confirm detailed user profiles contain activity summaries | User profile page | 1. Open own or public profile. 2. Inspect activity summary. | Profile shows visible activity or artifact summary. |  | Accepted if profile context is useful. |
| Project evaluator / Normal User | 25 June 2026 | F6.7: To confirm models can be marked as favorites | Model detail, favorite button | 1. Open model detail. 2. Click favorite. 3. Open Favorites page. | Model appears in favorites. |  | Accepted if model favorite persists. |
| Project evaluator / Normal User | 25 June 2026 | F6.8: To confirm Blueprints can be marked as favorites | Blueprint detail, favorite button | 1. Open Blueprint detail. 2. Click favorite. 3. Open Favorites page. | Blueprint appears in favorites. |  | Accepted if Blueprint favorite persists. |
| Project evaluator / Normal User | 25 June 2026 | F6.9: To confirm a dedicated favorites interface is available | Favorites page, saved artifacts | 1. Favorite at least one item. 2. Open Favorites page. | Saved items appear in dedicated Favorites page. |  | Accepted if saved items are easy to find. |
| Project evaluator / Normal User | 25 June 2026 | F6.10: To confirm model snapshots can be reused in new experiment configurations | Completed model detail, reuse/start action | 1. Open model detail. 2. Use available reuse path. 3. Inspect experiment configuration. | Model context supports starting a related experiment configuration. |  | Accepted if reuse path is discoverable. |

## 7.4.7 Model Catalog and Rankings Acceptance Tests

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / Authenticated User | 25 June 2026 | F7.1: To confirm models are ranked by configurable performance metrics | Model rankings page, sort metric | 1. Open rankings page. 2. Inspect or change ranking metric. | Models are displayed according to selected performance metric. |  | Accepted if ranking is readable. |
| Project evaluator / Authenticated User | 25 June 2026 | F7.2: To confirm model details include metrics, parameters, and configuration | Model detail page | 1. Open model from ranking. 2. Inspect detail page. | Model metrics, parameters, and training configuration are displayed. |  | Accepted if model detail supports evaluation. |
| Project evaluator / Normal User | 25 June 2026 | F7.3: To confirm new experiments can be initiated from model detail | Model detail, start/reuse action | 1. Open model detail. 2. Click start or reuse path. | User can begin a new experiment from model context. |  | Accepted if model-to-experiment path is understandable. |

## 7.4.8 Favorites Library Acceptance Tests

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / Normal User | 25 June 2026 | F8.1: To confirm consolidated favorites view is available | Favorites page, saved models, saved Blueprints | 1. Open Favorites page. 2. Inspect saved items. | Favorited models and Blueprints are displayed. |  | Accepted if favorites are consolidated. |
| Project evaluator / Normal User | 25 June 2026 | F8.2: To confirm favorites can be segmented by target type | Favorites page, model and Blueprint sections | 1. Open Favorites page. 2. Switch or inspect item type sections. | Favorites are segmented by model and Blueprint type. |  | Accepted if segmentation is clear. |
| Project evaluator / Normal User | 25 June 2026 | F8.3: To confirm users can remove favorites | Saved favorite, remove action | 1. Open Favorites page. 2. Click remove. 3. Inspect updated list. | Selected favorite is removed. |  | Accepted if removal feedback is clear. |

## 7.4.9 Server-Side Experiment Execution and Queueing Acceptance Tests

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / Normal User | 25 June 2026 | F9.1: To confirm authenticated clients can submit experiment run requests | Authenticated session, valid experiment form | 1. Login. 2. Complete experiment wizard. 3. Submit experiment. | Run request is accepted for authenticated user. |  | Accepted if unauthenticated submission is blocked. |
| Project evaluator / Normal User | 25 June 2026 | F9.2: To confirm experiment requests are accepted for asynchronous execution | Valid experiment, submit button | 1. Submit valid experiment. 2. Inspect response. | Experiment request is queued asynchronously. |  | Accepted if queue feedback is visible. |
| Project evaluator / Normal User | 25 June 2026 | F9.3: To confirm experiment runs use server-side computational resources | Submitted experiment, worker process | 1. Submit experiment. 2. Allow worker processing. 3. Inspect result. | Experiment is processed by server-side workflow. |  | Accepted if no local execution is needed. |
| Project evaluator / Normal User | 25 June 2026 | F9.4: To confirm test-set evaluations use server-side resources | Completed experiment, test metrics | 1. Submit experiment. 2. Wait for completion. 3. Inspect test metrics. | Test evaluation results are produced server-side. |  | Accepted if evaluation output is accessible. |
| Project evaluator / Administrator | 25 June 2026 | F9.5: To confirm concurrent job limits are enforced | Administrator account, queue settings | 1. Open system management. 2. Inspect concurrency setting and job queue. | Concurrent job limit is visible and respected. |  | Accepted if concurrency can be monitored. |
| Project evaluator / Administrator | 25 June 2026 | F9.6: To confirm administrators can modify concurrency limits | System settings form, concurrency input | 1. Login as Administrator. 2. Open system management. 3. Update concurrency limit. | Concurrency limit is updated within allowed values. |  | Accepted if control is administrator-only. |
| Project evaluator / Normal User | 25 June 2026 | F9.7: To confirm queue position is displayed | Submitted job, job detail page | 1. Submit experiment. 2. Open job detail. | Queue position or queue status is displayed. |  | Accepted if waiting state is understandable. |
| Project evaluator / Normal User | 25 June 2026 | F9.8: To confirm running job status updates are provided | Running job, job detail | 1. Open running job detail. 2. Inspect status updates. | Running status and progress are shown. |  | Accepted if active processing is clear. |
| Project evaluator / Normal User | 25 June 2026 | F9.9: To confirm pending requests can be cancelled before execution | Pending job, cancel control | 1. Open pending job detail. 2. Click cancel. | Pending request is cancelled. |  | Accepted if pending cancellation is confirmed. |
| Project evaluator / Normal User | 25 June 2026 | F9.10: To confirm running jobs can be cancelled gracefully | Running job, cancel control | 1. Open running job detail. 2. Click cancel. 3. Confirm. | Running job enters cancellation or cancelled state. |  | Accepted if graceful cancellation feedback is clear. |
| Project evaluator / Normal User | 25 June 2026 | F9.11: To confirm job execution state is maintained with real-time updates | Job detail, experiment detail | 1. Submit job. 2. Monitor status. 3. Refresh page. | Execution state remains current and visible. |  | Accepted if progress can be monitored. |
| Project evaluator / Normal User | 25 June 2026 | F9.12: To confirm job results and artifacts persist after completion | Completed job, experiment detail | 1. Complete job. 2. Reopen experiment detail. 3. Inspect results. | Results and artifacts remain available. |  | Accepted if outputs persist. |
| Project evaluator / Normal User | 25 June 2026 | F9.13: To confirm job errors are logged with diagnostics | Failed job, detail page | 1. Open failed job or experiment. 2. Inspect error message. | Failure diagnostic information is available. |  | Accepted if failure is not silent. |
| Project evaluator / Normal User | 25 June 2026 | F9.14: To confirm retry handling for transient failures is supported | Transient failure scenario, job status | 1. Submit job in retry-capable condition. 2. Inspect job status. | Retry handling preserves controlled job state. |  | Accepted if retry behavior is understandable. |
| Project evaluator / Administrator | 25 June 2026 | F9.15: To confirm differentiated resource allocation is supported | Administrator settings, job execution controls | 1. Open system management. 2. Inspect resource-related execution controls. | Resource allocation controls or settings are available to administrator. |  | Accepted if resource options are understandable. |

## 7.4.10 Administration and System Monitoring Acceptance Tests

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / Administrator | 25 June 2026 | F10.1: To confirm administrative dashboard is available | Administrator account, system-management route | 1. Login as Administrator. 2. Open system management page. | Administrative dashboard is displayed. |  | Accepted if administrator can access overview. |
| Project evaluator / Administrator | 25 June 2026 | F10.2: To confirm health and data availability indicators are displayed | System-management page | 1. Open system management. 2. Inspect health and data status sections. | System health and data availability indicators are visible. |  | Accepted if operational state is understandable. |
| Project evaluator / Administrator | 25 June 2026 | F10.3: To confirm active job items and states are displayed | Queue snapshot, active jobs | 1. Open system management. 2. Inspect active job list. | Active job items and execution states are displayed. |  | Accepted if queue state can be monitored. |

## 7.4.11 Blueprint Authoring and Approval Acceptance Tests

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / Normal User | 25 June 2026 | F11.1: To confirm users can create Blueprints with indicators and architecture parameters | Blueprint wizard, indicator selection, architecture settings | 1. Login. 2. Open Blueprint wizard. 3. Select indicators and architecture parameters. 4. Save. | Blueprint is created with selected specification. |  | Accepted if wizard supports Blueprint creation. |
| Project evaluator / Normal User | 25 June 2026 | F11.2: To confirm indicator parameter ranges can be defined | Indicator parameter fields | 1. Select indicator. 2. Enter parameter range. 3. Continue. | Indicator parameter range is saved. |  | Accepted if range input is clear. |
| Project evaluator / Normal User | 25 June 2026 | F11.3: To confirm feature parameter ranges can be defined | Feature parameter fields | 1. Configure feature settings. 2. Enter ranges. 3. Review. | Feature parameter ranges are saved. |  | Accepted if feature settings are usable. |
| Project evaluator / Normal User | 25 June 2026 | F11.4: To confirm architecture hyperparameter ranges can be defined | Architecture parameter fields | 1. Select architecture. 2. Enter hyperparameter ranges. 3. Review. | Architecture hyperparameter ranges are saved. |  | Accepted if controls are understandable. |
| Project evaluator / Normal User | 25 June 2026 | F11.5: To confirm original Blueprint artifacts are preserved with new editable copies after review states | Submitted or reviewed Blueprint, edit action | 1. Create and submit Blueprint. 2. Edit after review-related state. 3. Inspect lineage. | Original artifact is preserved and editable copy is created when required. |  | Accepted if preservation behavior is traceable. |
| Project evaluator / Normal User | 25 June 2026 | F11.6: To confirm non-administrator Blueprints require approval before public visibility | Normal User Blueprint, public selection area | 1. Create Blueprint as Normal User. 2. Inspect public visibility before approval. | Blueprint is not publicly visible until approved. |  | Accepted if approval requirement is clear. |
| Project evaluator / Normal User | 25 June 2026 | F11.7: To confirm user-owned Blueprints move from draft to pending after approval request | Draft Blueprint, request approval button | 1. Open draft Blueprint. 2. Click request approval. | Blueprint status changes to pending. |  | Accepted if status update is visible. |
| Project evaluator / Moderator or Administrator | 25 June 2026 | F11.8: To confirm staff can approve pending Blueprints | Pending Blueprint, moderation page | 1. Login as staff. 2. Open moderation page. 3. Approve pending Blueprint. | Blueprint status changes to approved. |  | Accepted if approval action is clear. |
| Project evaluator / Moderator or Administrator | 25 June 2026 | F11.9: To confirm staff can reject pending Blueprints | Pending Blueprint, reject action | 1. Login as staff. 2. Open moderation page. 3. Reject pending Blueprint. | Blueprint status changes to rejected. |  | Accepted if rejection action is clear. |
| Project evaluator / Moderator or Administrator | 25 June 2026 | F11.10: To confirm approved Blueprints can be rejected and remediation draft generated | Approved Blueprint, disapprove action | 1. Open approved Blueprint as staff. 2. Reject or disapprove. | Approved Blueprint is rejected and editable remediation draft is generated. |  | Accepted if remediation is traceable. |
| Project evaluator / Normal User | 25 June 2026 | F11.11: To confirm owners can view all their Blueprints regardless of state | Owner account, Blueprint library | 1. Login as owner. 2. Open Blueprint library. 3. Inspect all owner Blueprints. | Owner sees draft, pending, approved, and rejected Blueprints. |  | Accepted if owner visibility is complete. |
| Project evaluator / Staff User | 25 June 2026 | F11.12: To confirm staff can view pending, approved, or rejected Blueprints only | Staff account, moderation views | 1. Login as staff. 2. Open moderation or library views. | Staff-visible Blueprint states are shown according to rules. |  | Accepted if staff visibility matches governance rules. |
| Project evaluator / Authenticated User | 25 June 2026 | F11.13: To confirm public visibility is limited to approved Blueprints | Public Blueprint selection, mixed states | 1. Open public Blueprint area. 2. Inspect visible Blueprints. | Only approved Blueprints appear publicly. |  | Accepted if unapproved Blueprints are hidden. |
| Project evaluator / Normal User | 25 June 2026 | F11.14: To confirm Blueprints persist as structured pipeline documents | Blueprint wizard, Blueprint detail | 1. Create Blueprint. 2. Open detail. 3. Inspect saved sections. | Complete structured Blueprint specification is displayed. |  | Accepted if saved Blueprint can be reviewed. |
| Project evaluator / Normal User | 25 June 2026 | F11.15: To confirm Blueprint definitions compile into executable experiment manifests | Approved Blueprint, experiment submission | 1. Select approved Blueprint. 2. Submit experiment. | Blueprint is compiled into experiment run configuration. |  | Accepted if compilation is automatic. |
| Project evaluator / Normal User | 25 June 2026 | F11.16: To confirm interval and split ratios are injected into compiled manifest | Experiment interval, split values, selected Blueprint | 1. Configure interval and splits. 2. Submit experiment. 3. Inspect detail. | Experiment-specific values are included in persisted configuration. |  | Accepted if review/detail reflects selected values. |
| Project evaluator / Normal User or Staff User | 25 June 2026 | F11.17: To confirm Blueprint lineage is maintained through sequential numbering and parent references | Blueprint detail, edited reviewed Blueprint | 1. Edit reviewed Blueprint. 2. Open detail. 3. Inspect lineage information. | Lineage is maintained and visible where applicable. |  | Accepted if traceability is clear. |

## 7.4.12 Documentation Acceptance Tests

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / Guest or Authenticated User | 25 June 2026 | F12.1: To confirm Markdown documentation can be rendered | Documentation page, selected document | 1. Open documentation page. 2. Select document. 3. Read rendered content. | Markdown content is displayed in readable form. |  | Accepted if documentation is accessible and readable. |

## 7.4.13 Public Hub Visibility Acceptance Tests

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / Authenticated User | 25 June 2026 | F13.1: To confirm authenticated users can see completed experiments by default | Public Hub Experiments tab | 1. Login. 2. Open Public Hub. 3. Select Experiments tab. | Completed experiments are visible. |  | Accepted if completed results are discoverable. |
| Project evaluator / Guest and Authenticated User | 25 June 2026 | F13.2: To confirm Public Hub access is authenticated-only | Guest session, authenticated session | 1. Attempt Public Hub as guest. 2. Login. 3. Open Public Hub again. | Guest is blocked and authenticated user can access Public Hub. |  | Accepted if access restriction is clear. |
| Project evaluator / Authenticated User | 25 June 2026 | F13.3: To confirm only enabled users appear in Public Hub Users tab | Enabled and disabled users | 1. Open Public Hub Users tab. 2. Inspect listed users. | Only enabled users are displayed. |  | Accepted if disabled users are hidden. |
| Project evaluator / Authenticated User | 25 June 2026 | F13.4: To confirm only completed experiments appear in Public Hub Experiments tab | Mixed experiment statuses | 1. Open Public Hub Experiments tab. 2. Inspect listed experiments. | Only successfully completed experiments are shown. |  | Accepted if incomplete or failed experiments are hidden. |
| Project evaluator / Authenticated User | 25 June 2026 | F13.5: To confirm only models from successful experiments appear in Public Hub Models tab | Models from successful and failed experiments | 1. Open Public Hub Models tab. 2. Inspect listed models. | Only models from successful experiments are displayed. |  | Accepted if invalid model records are hidden. |
| Project evaluator / Authenticated User | 25 June 2026 | F13.6: To confirm only approved Blueprints appear in Public Hub Blueprints tab | Mixed Blueprint states | 1. Open Public Hub Blueprints tab. 2. Inspect listed Blueprints. | Only approved Blueprints are displayed. |  | Accepted if unapproved Blueprints are hidden. |

## 7.4.14 Acceptance Testing Summary

The acceptance testing plan covers all 120 functional requirements from Chapter 3. Each requirement is represented in the acceptance test tables so that the completed system can be traced back to the agreed requirement baseline. The tests cover guest access, account registration, login, session handling, role-based access, user management, experiment configuration, server-side execution, queue monitoring, model output processing, experiment discovery, favorites, model rankings, documentation, Blueprint governance, Public Hub visibility, and administrative monitoring.

The Actual Test Results column should be completed during the final acceptance demonstration or handover session. If the observed result matches the expected output, the tester can record that the requirement was accepted. If any requirement does not behave as expected, the tester should record the observed issue and mark it for correction before deployment or final submission.

---

# 7.5 Summary

This chapter presented the testing activities carried out to evaluate the Bitcoin Experimental Engine after implementation. The testing process was divided into unit testing, integration testing, usability testing, and acceptance testing. Together, these testing stages assessed the system from both technical and user-facing perspectives, covering the correctness of individual modules, the reliability of connected workflows, the usability of the interface, and the system's compliance with the functional requirements.

Unit testing verified the behaviour of the main backend and frontend units before they were combined. The tested backend units included controllers, services, validators, repositories, entities, strategies, queue-related services, worker logic, and supporting scripts. The tested frontend units included views, route guards, authentication state handling, reusable interface components, chart components, API-client behaviour, and role-aware navigation. The backend automated test run completed successfully with no failures, and the frontend Jest run also completed successfully. These results show that the individual system components were stable before integration testing was performed.

Integration testing then evaluated whether the tested modules worked correctly when connected into larger workflows. The integration tests covered authentication and session restoration, role-based access control, user management, dashboard rendering, Blueprint authoring and moderation, experiment configuration, market-data handling, queue submission, job monitoring, worker execution, result persistence, model ranking, log download, favorites, Public Hub discovery, documentation rendering, user profile access, and system management. The dedicated integration journey test passed, and the broader backend and frontend test suites also passed. This indicates that data can move correctly across the frontend, backend, database, queue, worker, and supporting scripts.

Usability testing assessed whether the completed web interface could be operated by its intended users. The tests were mapped to the functional requirements and covered the main actor roles, including Guest, Normal User, Moderator, Administrator, Staff User, and Authenticated User. Most usability checks were marked as successful because the required tasks could be completed through visible navigation, understandable forms, validation messages, status labels, and role-appropriate controls. A small number of items were marked as moderate success where the feature was usable but conceptually more complex, such as parameter permutation generation, result-signal interpretation, queue retry behaviour, resource controls, Blueprint version lineage, and model reuse.

Acceptance testing provided the final requirement-based verification for the completed system. Each functional requirement was represented in the acceptance test tables so that the system can be checked directly against the agreed requirement baseline during final demonstration or handover. The acceptance tests cover account access, authorization, user management, experiment setup, execution, queueing, result inspection, model output processing, discovery, favorites, model rankings, system monitoring, Blueprint governance, documentation, and Public Hub visibility. The actual-result fields are prepared for completion during the final acceptance session.

Overall, the testing process demonstrates that the Bitcoin Experimental Engine is reliable enough for final demonstration and handover. The system passed the automated backend, frontend, and integration test evidence used in this chapter, while the usability and acceptance tests show that the implemented functions align with the intended user workflows and functional requirements. Testing contributed to system readiness by identifying the expected behaviours, confirming that the main modules operate correctly, and documenting how the system should be accepted by the end user or client.