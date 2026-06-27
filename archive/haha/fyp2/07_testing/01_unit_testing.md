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
