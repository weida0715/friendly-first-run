# 7.1 Unit Testing

## Section Purpose

This section presents the unit testing performed on individual backend and frontend units before integration testing. It should show which modules were tested, what test data was used, and what result was expected from each isolated test. Use tables heavily because the faculty format expects test plans, test data, and test results.

## Opening Paragraph Structure

Write two paragraphs before the tables.

Paragraph 1 should define unit testing in this project: testing individual backend services, validators, repositories, controllers, strategy units, worker functions, frontend views, auth guards, API client behavior, charts, and reusable UI components.

Paragraph 2 should explain that unit testing was performed to detect module-level defects before combining the modules into complete workflows. Mention that backend tests use pytest and frontend tests use Jest with Testing Library.

## 7.1.1 Test Plan

### Recommended Structure

Use one table per module group. The faculty-required columns are:

| No. | Test ID | Test Case Name | Test Date |
| --- | --- | --- | --- |

Use 25 June 2026 as the planned test date unless you later replace it with the actual execution date.

### Backend Unit Test Plan

| No. | Test ID | Test Case Name | Test Date |
| --- | --- | --- | --- |
| 1 | UT001 | Validate user registration and login behavior | 25 June 2026 |
| 2 | UT002 | Validate access-control and role permission behavior | 25 June 2026 |
| 3 | UT003 | Validate session service behavior | 25 June 2026 |
| 4 | UT004 | Validate user-management controller behavior | 25 June 2026 |
| 5 | UT005 | Validate blueprint payload validation | 25 June 2026 |
| 6 | UT006 | Validate blueprint approval and moderation transitions | 25 June 2026 |
| 7 | UT007 | Validate blueprint versioning behavior | 25 June 2026 |
| 8 | UT008 | Validate experiment payload validation | 25 June 2026 |
| 9 | UT009 | Validate experiment compiler output and parameter permutations | 25 June 2026 |
| 10 | UT010 | Validate experiment controller ownership behavior | 25 June 2026 |
| 11 | UT011 | Validate market-data service normalization and cache behavior | 25 June 2026 |
| 12 | UT012 | Validate target strategy factory and target generation | 25 June 2026 |
| 13 | UT013 | Validate indicator strategy behavior | 25 June 2026 |
| 14 | UT014 | Validate model architecture factory behavior | 25 June 2026 |
| 15 | UT015 | Validate queue service and job metadata behavior | 25 June 2026 |
| 16 | UT016 | Validate worker status transition behavior | 25 June 2026 |
| 17 | UT017 | Validate job cancellation strategy behavior | 25 June 2026 |
| 18 | UT018 | Validate logs download behavior | 25 June 2026 |
| 19 | UT019 | Validate documentation controller behavior | 25 June 2026 |
| 20 | UT020 | Validate public hub filtering behavior | 25 June 2026 |
| 21 | UT021 | Validate system controller and settings behavior | 25 June 2026 |

### Frontend Unit Test Plan

| No. | Test ID | Test Case Name | Test Date |
| --- | --- | --- | --- |
| 22 | UT022 | Validate login and registration views | 25 June 2026 |
| 23 | UT023 | Validate authentication guards and navigation filtering | 25 June 2026 |
| 24 | UT024 | Validate dashboard and BTCUSDT chart states | 25 June 2026 |
| 25 | UT025 | Validate blueprint wizard and library views | 25 June 2026 |
| 26 | UT026 | Validate experiment wizard, list, and detail views | 25 June 2026 |
| 27 | UT027 | Validate job list and job detail views | 25 June 2026 |
| 28 | UT028 | Validate model ranking and model detail views | 25 June 2026 |
| 29 | UT029 | Validate favorites, public hub, and documentation views | 25 June 2026 |
| 30 | UT030 | Validate user-management and system-management views | 25 June 2026 |
| 31 | UT031 | Validate reusable UI, table, status, loading, empty, and error components | 25 June 2026 |
| 32 | UT032 | Validate frontend API client CSRF behavior | 25 June 2026 |

> Note: If the final report becomes too long, keep the full table in this subsection and move detailed raw test command output to an appendix.

## 7.1.2 Test Data

### Recommended Structure

Use the faculty-required columns:

| Test ID | Test Case Name | Relevant Test Data |
| --- | --- | --- |

### Unit Test Data Table

| Test ID | Test Case Name | Relevant Test Data |
| --- | --- | --- |
| UT001 | Validate user registration and login behavior | Name, username, email, credential field, duplicate username, invalid email, disabled account |
| UT002 | Validate access-control and role permission behavior | User role, Moderator role, Admin role, missing session, unauthorized actor |
| UT003 | Validate session service behavior | Session identifier, user id, role, timeout value, expired session case |
| UT004 | Validate user-management controller behavior | User id, role update, status update, username update, account creation payload |
| UT005 | Validate blueprint payload validation | Blueprint name, description, architecture, indicator list, parameter ranges, invalid missing fields |
| UT006 | Validate blueprint approval and moderation transitions | Draft blueprint, pending blueprint, approved blueprint, rejected blueprint, moderator/admin actor |
| UT007 | Validate blueprint versioning behavior | Original blueprint id, parent blueprint id, version number, owner id, edited payload |
| UT008 | Validate experiment payload validation | Name, BTCUSDT symbol, interval, start date, end date, split ratios, blueprint id, overrides |
| UT009 | Validate experiment compiler output and parameter permutations | Blueprint parameters, override parameters, deterministic seed, expected permutation count |
| UT010 | Validate experiment controller ownership behavior | Owner id, non-owner id, staff actor, experiment id, status filter |
| UT011 | Validate market-data service normalization and cache behavior | Raw kline rows, timestamps, open/high/low/close/volume, duplicate timestamp rows |
| UT012 | Validate target strategy factory and target generation | Candle direction target, lookahead settings, forward return values |
| UT013 | Validate indicator strategy behavior | Candle frame, SMA, RSI, VWAP, rolling volatility, indicator parameters |
| UT014 | Validate model architecture factory behavior | Logistic regression, ridge classifier, architecture metadata, invalid architecture name |
| UT015 | Validate queue service and job metadata behavior | Experiment id, job id, queue position, queued/running job state |
| UT016 | Validate worker status transition behavior | Experiment id, valid payload, invalid payload, executor success, executor failure |
| UT017 | Validate job cancellation strategy behavior | Queued job, running job, completed job, unauthorized cancellation attempt |
| UT018 | Validate logs download behavior | Experiment id, artifact type, model id, CSV output expectation |
| UT019 | Validate documentation controller behavior | Documentation slug, Markdown title, missing document slug |
| UT020 | Validate public hub filtering behavior | Enabled user, disabled user, completed experiment, approved blueprint, failed experiment |
| UT021 | Validate system controller and settings behavior | Queue snapshot, setting key, setting value, system event filters |
| UT022 | Validate login and registration views | Form fields, validation messages, mocked API success/failure responses |
| UT023 | Validate authentication guards and navigation filtering | Authenticated user, guest, Moderator, Admin, route metadata |
| UT024 | Validate dashboard and BTCUSDT chart states | Chart candle data, loading state, empty state, error state |
| UT025 | Validate blueprint wizard and library views | Blueprint metadata, form steps, library list data, approval status |
| UT026 | Validate experiment wizard, list, and detail views | Experiment form data, split fields, blueprint options, status list, detail payload |
| UT027 | Validate job list and job detail views | Job id, job status, queue metadata, cancellation dialog |
| UT028 | Validate model ranking and model detail views | Model metrics, parameter hash, ranking list, favorite toggle |
| UT029 | Validate favorites, public hub, and documentation views | Favorite models, favorite blueprints, hub tabs, Markdown document content |
| UT030 | Validate user-management and system-management views | User list, role/status controls, queue snapshot, settings payload |
| UT031 | Validate reusable UI, table, status, loading, empty, and error components | Component props, table rows, empty message, error message, badge states |
| UT032 | Validate frontend API client CSRF behavior | Mutating request, CSRF token response, credentials flag, API error shape |

## 7.1.3 Test Results

### Recommended Structure

Use one detailed table. The faculty-required columns are:

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
| --- | --- | --- | --- | --- | --- | --- |

You may leave Actual Results blank until the final test run. If you have already run the tests, fill it with `Passed` and the relevant command output summary.

### Unit Test Results Table

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
| --- | --- | --- | --- | --- | --- | --- |
| UT001 | Test account registration and login unit behavior | Backend test environment is available | Account validation and login response are verified | Run authentication controller tests | Valid users are accepted, invalid credentials are rejected, session data is created |  |
| UT002 | Test RBAC decision logic | Test users with User, Moderator, and Admin roles exist | Authorization result is returned | Run access-control service tests | Staff/admin access is permitted only for allowed roles |  |
| UT003 | Test session creation, lookup, and expiry | Session service is initialized | Session state is created or rejected | Run session service tests | Active sessions resolve user identity; expired sessions are rejected |  |
| UT004 | Test user-management controller actions | Staff actor is authenticated | User-management response is returned | Run user controller tests | Staff operations follow role restrictions |  |
| UT005 | Test blueprint validation rules | Blueprint payloads are available | Validation result is returned | Run blueprint validator tests | Valid payloads pass; invalid payloads return field errors |  |
| UT006 | Test blueprint approval transitions | Blueprint records with different states exist | State transition is persisted | Run blueprint approval controller tests | Only valid staff actions change approval state |  |
| UT007 | Test blueprint versioning | Existing blueprint is available | Original or new version is saved | Run versioning service tests | Reviewed artifacts are preserved; editable drafts update safely |  |
| UT008 | Test experiment validation rules | Experiment payloads and blueprint options exist | Validation result is returned | Run experiment validator tests | Invalid split/date/blueprint/override payloads are rejected |  |
| UT009 | Test experiment compiler | Blueprint and experiment config are available | Compiled snapshots are produced | Run experiment compiler tests | Stable snapshots and expected parameter permutations are generated |  |
| UT010 | Test experiment ownership | Owner and non-owner actors exist | Access result is returned | Run experiment controller tests | Owners can view own experiments; unauthorized users are blocked |  |
| UT011 | Test market data normalization/cache | Raw candle data is supplied | Normalized cache result is returned | Run market data service tests | Candles are normalized and duplicate timestamps are not duplicated |  |
| UT012 | Test target strategy generation | Candle data is available | Target column is produced | Run target strategy tests | Correct target values are generated for configured strategy |  |
| UT013 | Test indicator strategies | Candle data and indicator config exist | Feature columns are generated | Run indicator tests | Indicator outputs match expected calculation behavior |  |
| UT014 | Test architecture factory | Architecture names are supplied | Architecture metadata/instance is returned | Run architecture factory tests | Known architectures resolve; unknown names are rejected |  |
| UT015 | Test queue metadata | Queue adapter is mocked or available | Queue metadata is returned | Run queue service tests | Job id and queue position are returned correctly |  |
| UT016 | Test worker transitions | Experiment and job payload are available | Experiment state is updated | Run worker tests | Queued -> Running -> Completed/Failed behavior is correct |  |
| UT017 | Test cancellation behavior | Job states are available | Cancellation result is returned | Run job cancellation tests | Eligible jobs can be cancelled; completed/unauthorized jobs are blocked |  |
| UT018 | Test log download units | Experiment log data exists | CSV response is generated | Run logs download tests | Supported artifacts return downloadable output |  |
| UT019 | Test documentation units | Markdown document data exists | Document response is returned | Run documentation controller tests | Existing docs render; missing docs return error |  |
| UT020 | Test public hub units | Users, experiments, models, blueprints exist | Hub payload is returned | Run public hub tests | Only allowed public records appear |  |
| UT021 | Test system units | Queue/settings/event data exists | System payload is returned | Run system controller tests | Admin-visible queue/settings/events are returned correctly |  |
| UT022 | Test login/register views | Frontend test renderer is available | View behavior is verified | Run login and registration view tests | Validation and submit behavior render correctly |  |
| UT023 | Test auth guards/navigation | Mock auth contexts are available | Route behavior is verified | Run auth guard tests | Guests and insufficient roles are redirected or blocked |  |
| UT024 | Test dashboard/chart states | Mock chart API responses exist | Chart states are rendered | Run chart and dashboard tests | Loading, empty, error, and success states render |  |
| UT025 | Test blueprint views | Mock blueprint API responses exist | View behavior is verified | Run blueprint view tests | Wizard and library render expected data and validation |  |
| UT026 | Test experiment views | Mock experiment API responses exist | View behavior is verified | Run experiment view tests | Wizard, list, and detail flows render expected states |  |
| UT027 | Test job views | Mock job API responses exist | View behavior is verified | Run job view tests | Job status and cancellation UI behave correctly |  |
| UT028 | Test model views | Mock model API responses exist | View behavior is verified | Run model view tests | Rankings, details, and favorite behavior render correctly |  |
| UT029 | Test favorites/hub/docs views | Mock API responses exist | View behavior is verified | Run related view tests | Data tabs and documents render correctly |  |
| UT030 | Test admin/system views | Mock admin API responses exist | View behavior is verified | Run admin/system view tests | Staff and admin screens render expected controls |  |
| UT031 | Test reusable components | Component props are supplied | Rendered output is verified | Run component tests | UI states and table behavior render consistently |  |
| UT032 | Test API client CSRF behavior | Mock fetch and CSRF endpoint exist | Request behavior is verified | Run API client tests | Mutating requests attach CSRF token and credentials |  |

## Commands to Include

```bash
cd backend
.venv/bin/pytest -q
```

```bash
cd frontend
npm test -- --runInBand
```

## Screenshot / Evidence Notes

> Note: Include terminal screenshots or copied command output summaries only after the tests are actually executed. Do not include screenshots of hidden folders, dependency folders, or generated build output.

## Draft Closing Paragraph

The unit testing stage validates that individual backend and frontend units behave correctly before the full system workflow is tested. Backend unit tests focus on controllers, services, validators, repositories, worker logic, queue behavior, strategies, and persistence-related functions. Frontend unit tests focus on views, route guards, API-client behavior, reusable components, charts, and screen states. These unit tests provide early confidence that each module satisfies its local responsibility before integration testing combines the modules into complete user workflows.
