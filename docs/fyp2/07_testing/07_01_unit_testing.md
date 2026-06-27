# 7.1 Unit Testing

Unit testing was carried out to check individual backend and frontend units before they were treated as part of a complete workflow. The backend tests are located under `backend/tests/`. They use pytest to test domain entities, validators, services, repositories, controllers, queue logic, market-data logic, strategy classes, compiler behaviour, executor behaviour, and worker state changes. The frontend tests are located under `frontend/tests/`. They use Jest and React Testing Library to test pages, components, route guards, navigation, chart states, wizard behaviour, and user-facing error states.

The unit tests listed below are based on the actual test folders in the project. The selected cases cover the core implementation modules: authentication, dashboard, experiments, blueprints, models, favourites, public hub, documentation, admin panel, moderator panel, blueprint architecture, indicators, data ingestion, splits, target strategies, experiment compiler, executor, queue, worker, jobs, and system management.

## 7.1.1 Actual Automated Unit Test Execution

| Test suite | Command and working directory | Actual result | Notes |
|---|---|---|---|
| Backend unit tests | `pytest -q` from `backend/` | Passed. The run reached 100% completion with 375 backend tests completed and 5 warnings. | Warnings came from scikit-learn future-warning messages in architecture and metrics-related tests. They did not fail the run. |
| Frontend unit and component tests | `npm test -- --runInBand` from `frontend/` | Passed. 25 test suites passed, 113 tests passed, 0 snapshots, time 19.087 seconds. | Jest printed React asynchronous-update warnings in blueprint wizard and system management tests and a Next.js workspace-root warning. They did not fail the run. |

The valid backend command was executed from `backend/` so the Python package path resolved correctly. The combined result shows that the implemented automated test suite passed for both backend and frontend modules.

## 7.1.2 Test Plan

The test plan contains more than 30 unit tests. Each row represents a distinct test case or tightly scoped test group taken from the existing backend or frontend test files.

| No. | Test ID | Test Case Name | Test Date | Source test file |
|---:|---|---|---|---|
| 1 | UT001 | Register user successfully with hashed password and safe returned user object | 27 June 2026 | `backend/tests/test_authentication_controller.py` |
| 2 | UT002 | Reject duplicate username during registration | 27 June 2026 | `backend/tests/test_authentication_controller.py` |
| 3 | UT003 | Reject duplicate email during registration | 27 June 2026 | `backend/tests/test_authentication_controller.py` |
| 4 | UT004 | Reject invalid or short username during registration | 27 June 2026 | `backend/tests/test_authentication_controller.py` |
| 5 | UT005 | Log in successfully and set a session cookie | 27 June 2026 | `backend/tests/test_authentication_controller.py` |
| 6 | UT006 | Reject invalid login credentials and disabled users | 27 June 2026 | `backend/tests/test_authentication_controller.py` |
| 7 | UT007 | Return current user with a valid session and reject missing session | 27 June 2026 | `backend/tests/test_authentication_controller.py` |
| 8 | UT008 | Log out and invalidate the active session | 27 June 2026 | `backend/tests/test_authentication_controller.py` |
| 9 | UT009 | Verify role checks, ownership checks, profile access, and role assignment rules | 27 June 2026 | `backend/tests/test_access_control_service.py` |
| 10 | UT010 | Create server sessions and handle session timeout behaviour | 27 June 2026 | `backend/tests/test_session_service.py` |
| 11 | UT011 | Validate a correct blueprint payload | 27 June 2026 | `backend/tests/test_blueprint_validator.py` |
| 12 | UT012 | Validate blueprint indicator output scalers and custom indicators | 27 June 2026 | `backend/tests/test_blueprint_validator.py` |
| 13 | UT013 | Reject blueprint payload with missing name or unsupported indicator | 27 June 2026 | `backend/tests/test_blueprint_validator.py` |
| 14 | UT014 | Reject invalid blueprint architecture settings and collect multiple validation errors | 27 June 2026 | `backend/tests/test_blueprint_validator.py` |
| 15 | UT015 | Create draft blueprint with default state and owner information | 27 June 2026 | `backend/tests/test_blueprint_controller.py` |
| 16 | UT016 | Return field-level blueprint validation errors from API | 27 June 2026 | `backend/tests/test_blueprint_controller.py` |
| 17 | UT017 | Show blueprint detail and persist favourite/unfavourite actions | 27 June 2026 | `backend/tests/test_blueprint_controller.py` |
| 18 | UT018 | Request blueprint approval and perform moderator approval transitions | 27 June 2026 | `backend/tests/test_blueprint_approval_controller.py` |
| 19 | UT019 | Reject invalid blueprint moderation transition | 27 June 2026 | `backend/tests/test_blueprint_approval_controller.py` |
| 20 | UT020 | Validate a correct experiment payload | 27 June 2026 | `backend/tests/test_experiment_validator.py` |
| 21 | UT021 | Reject experiment payload with missing fields, invalid ordering, or invalid split values | 27 June 2026 | `backend/tests/test_experiment_validator.py` |
| 22 | UT022 | Validate experiment blueprint access rules for owner, public approved blueprint, and staff | 27 June 2026 | `backend/tests/test_experiment_validator.py` |
| 23 | UT023 | Validate experiment override constraints and reject unsupported nested override values | 27 June 2026 | `backend/tests/test_experiment_validator.py` |
| 24 | UT024 | Return approved blueprint options for the experiment wizard | 27 June 2026 | `backend/tests/test_experiment_controller.py` |
| 25 | UT025 | Reject unauthenticated experiment creation | 27 June 2026 | `backend/tests/test_experiment_controller.py` |
| 26 | UT026 | Return structured validation errors for invalid experiment creation | 27 June 2026 | `backend/tests/test_experiment_controller.py` |
| 27 | UT027 | Create experiment, persist configuration, and return created payload | 27 June 2026 | `backend/tests/test_experiment_controller.py` |
| 28 | UT028 | Pass requested job priority to the queue during experiment creation | 27 June 2026 | `backend/tests/test_experiment_controller.py` |
| 29 | UT029 | Enforce experiment ownership on list and detail endpoints | 27 June 2026 | `backend/tests/test_experiment_controller.py` |
| 30 | UT030 | Compile experiment by merging overrides without mutating the blueprint | 27 June 2026 | `backend/tests/test_experiment_compiler.py` |
| 31 | UT031 | Generate parameter permutations, stable hashes, and deterministic sample selection | 27 June 2026 | `backend/tests/test_experiment_compiler.py` |
| 32 | UT032 | Reject disallowed compiler overrides and report multiple override errors | 27 June 2026 | `backend/tests/test_experiment_compiler.py` |
| 33 | UT033 | Preserve compiled snapshot after later blueprint changes | 27 June 2026 | `backend/tests/test_experiment_compiler.py` |
| 34 | UT034 | Load experiment data from persisted BTCUSDT cache without refreshing external data | 27 June 2026 | `backend/tests/test_default_experiment_executor.py` |
| 35 | UT035 | Raise executor error when persisted BTCUSDT candles are insufficient | 27 June 2026 | `backend/tests/test_default_experiment_executor.py` |
| 36 | UT036 | Follow the executor template-method order during experiment execution | 27 June 2026 | `backend/tests/test_default_experiment_executor.py` |
| 37 | UT037 | Validate queued worker payload and require existing experiment id | 27 June 2026 | `backend/tests/test_experiment_worker.py` |
| 38 | UT038 | Mark experiment completed when worker execution succeeds | 27 June 2026 | `backend/tests/test_experiment_worker.py` |
| 39 | UT039 | Mark experiment failed when worker executor raises an error | 27 June 2026 | `backend/tests/test_experiment_worker.py` |
| 40 | UT040 | Return cached BTCUSDT kline items from market-data endpoint | 27 June 2026 | `backend/tests/test_market_data_controller.py` |
| 41 | UT041 | Validate market-data endpoint parameters and return empty state for empty cache | 27 June 2026 | `backend/tests/test_market_data_controller.py` |
| 42 | UT042 | Return target preview labels and confusion statistics from cached market data | 27 June 2026 | `backend/tests/test_market_data_controller.py` |
| 43 | UT043 | Refresh BTCUSDT data and return fetched, inserted, and updated summary | 27 June 2026 | `backend/tests/test_market_data_service.py` |
| 44 | UT044 | Discover missing BTCUSDT ranges in head, internal, and tail gaps | 27 June 2026 | `backend/tests/test_market_data_service.py` |
| 45 | UT045 | Upsert BTCUSDT kline timestamps and preserve inserted/updated summary | 27 June 2026 | `backend/tests/repositories/test_market_data_repository.py` |
| 46 | UT046 | Verify time-based split is chronological and avoids future leakage | 27 June 2026 | `backend/tests/strategies/test_data_split_strategy.py` |
| 47 | UT047 | Verify random split is reproducible with the same seed and changes with a different seed | 27 June 2026 | `backend/tests/strategies/test_data_split_strategy.py` |
| 48 | UT048 | Verify target strategies produce binary labels and reject invalid lookahead | 27 June 2026 | `backend/tests/strategies/test_target_strategy.py` |
| 49 | UT049 | Enforce model detail access rules for public and private records | 27 June 2026 | `backend/tests/test_model_controller.py` |
| 50 | UT050 | Sort, filter, paginate, and favourite model rankings | 27 June 2026 | `backend/tests/test_model_controller.py` |
| 51 | UT051 | Return model highlights using direct and log-based metrics | 27 June 2026 | `backend/tests/test_model_controller.py` |
| 52 | UT052 | Enforce staff-only user listing and user management constraints | 27 June 2026 | `backend/tests/test_user_controller.py` |
| 53 | UT053 | Enforce admin-only username and role update rules | 27 June 2026 | `backend/tests/test_user_controller.py` |
| 54 | UT054 | Return admin queue snapshot, system settings, and system events | 27 June 2026 | `backend/tests/test_system_controller.py` |
| 55 | UT055 | Expose public hub visibility and public profile content | 27 June 2026 | `backend/tests/test_public_hub_controller.py` |
| 56 | UT056 | Expose documentation list and detail and return missing-page error | 27 June 2026 | `backend/tests/test_documentation_controller.py` |
| 57 | UT057 | Reject missing CSRF header and allow valid protected request | 27 June 2026 | `backend/tests/test_csrf_hardening.py`, `frontend/tests/api-client-csrf.test.ts` |
| 58 | UT058 | Render login validation errors and submit valid login form | 27 June 2026 | `frontend/tests/login-view.test.tsx` |
| 59 | UT059 | Render registration validation errors and submit valid registration form | 27 June 2026 | `frontend/tests/registration-view.test.tsx` |
| 60 | UT060 | Redirect unauthenticated users and block unauthorized roles in route guards | 27 June 2026 | `frontend/tests/auth-guards.test.tsx` |
| 61 | UT061 | Render dashboard cards, quick actions, chart interval, and loading state | 27 June 2026 | `frontend/tests/dashboard-view.test.tsx` |
| 62 | UT062 | Render blueprint wizard navigation, review summary, constraints, and backend errors | 27 June 2026 | `frontend/tests/blueprint-wizard-view.test.tsx` |
| 63 | UT063 | Render blueprint library, detail, lineage, favourite toggle, and moderation actions | 27 June 2026 | `frontend/tests/blueprint-library-detail-moderation.test.tsx` |
| 64 | UT064 | Render experiment wizard shell, blueprint selection, split controls, target preview, overrides, and submit flow | 27 June 2026 | `frontend/tests/experiment-wizard-view.test.tsx` |
| 65 | UT065 | Render experiment detail configuration, leaderboard, risk chart modal, progress, and downloads | 27 June 2026 | `frontend/tests/experiment-detail-view.test.tsx` |
| 66 | UT066 | Render job detail data and friendly not-found state | 27 June 2026 | `frontend/tests/job-detail-view.test.tsx` |
| 67 | UT067 | Render model rankings, filters, API errors, favourite removal, and detail metrics | 27 June 2026 | `frontend/tests/model-views.test.tsx` |
| 68 | UT068 | Load favourited models and blueprints and filter favourites locally | 27 June 2026 | `frontend/tests/favorites-library-view.test.tsx` |
| 69 | UT069 | Load public hub records and switch public hub tabs | 27 June 2026 | `frontend/tests/public-hub-view.test.tsx` |
| 70 | UT070 | Render documentation list and documentation detail | 27 June 2026 | `frontend/tests/documentation-view.test.tsx` |
| 71 | UT071 | Render admin user management errors, role-specific actions, and audit entries | 27 June 2026 | `frontend/tests/user-management-view.test.tsx` |
| 72 | UT072 | Render system queue, settings, events, market-data controls, and catch-up states | 27 June 2026 | `frontend/tests/system-management-view.test.tsx` |
| 73 | UT073 | Render BTCUSDT chart loading, error, empty, success, incremental update, and cleanup states | 27 June 2026 | `frontend/tests/btcusdt-price-chart.test.tsx` |
| 74 | UT074 | Render navigation labels, route targets, role visibility, sign-out, and admin dropdown | 27 June 2026 | `frontend/tests/navigation.test.tsx` |

## 7.1.3 Test Data

The unit tests use controlled test data rather than live user data. Backend controller tests use test users, roles, blueprint payloads, experiment payloads, market-data rows, queue job ids, and model metrics. Frontend tests use mocked API responses and rendered components.

| Test ID range | Test area | Relevant test data |
|---|---|---|
| UT001-UT008 | Authentication | Name, username, email, password, password hash, session id, enabled or disabled status, login form data. |
| UT009-UT010 | Access control and session service | User roles, ownership ids, profile ids, staff role matrix, session timeout values, expired and active session records. |
| UT011-UT019 | Blueprint validation, persistence, favourites, and moderation | Blueprint metadata, architecture JSON, indicator selections, indicator parameters, output scalers, approval state, version, parent id, owner id, favourite pair. |
| UT020-UT029 | Experiment validation and controller | Experiment name, BTCUSDT symbol, interval, start and end datetime, candlestick amount, split percentages, blueprint id, parameter overrides, requested priority, queue metadata, owner id. |
| UT030-UT033 | Experiment compiler | Blueprint snapshot, experiment payload, architecture overrides, indicator overrides, target parameters, split parameters, deterministic seed, requested permutation count, generated parameter hash. |
| UT034-UT039 | Executor and worker | Experiment id, cached candle rows, minimum candle threshold, progress callback, executor result, queue payload, running/completed/failed status values. |
| UT040-UT045 | Market data controller, service, and repository | BTCUSDT timestamp, open, high, low, close, volume, requested interval, date range, empty cache, missing range, inserted/updated count. |
| UT046-UT048 | Split and target strategies | Polars candle frames, timestamp ordering, seed value, train/validation/test split values, target lookahead, binary labels, feature scaler input. |
| UT049-UT051 | Model controller | Model id, experiment id, blueprint id, owner id, public/private access state, metric values, log-based metrics, favourite state, pagination and sorting parameters. |
| UT052-UT054 | User and system management | Staff user, normal user, admin user, target user, audit entries, status update payload, role update payload, queue snapshot, system settings, system event rows. |
| UT055-UT057 | Public hub, documentation, and request protection | Enabled user, public artefacts, approved blueprint, documentation slug, missing slug, protected request header state. |
| UT058-UT074 | Frontend views and components | Mocked API responses, form inputs, route path, role context, chart candles, loading state, empty state, error state, table rows, modal state, action click events. |

## 7.1.4 Test Results

The test results below summarize the expected and observed behaviour represented by the automated tests. The `Actual Results` column cites the source test files that implement the unit checks. The final report should also include a screenshot of the actual pytest and Jest terminal output after the tests are executed for submission.

### Authentication, session, and access-control tests

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
|---|---|---|---|---|---|---|
| UT001 | Register user successfully with hashed password and safe returned user object. | Registration payload is valid and username/email are unused. | User is created with hashed password and safe response data. | Submit registration payload to backend test client. | Response is successful, password is not returned, and stored password is hashed. | Implemented in `backend/tests/test_authentication_controller.py`. |
| UT002 | Reject duplicate username. | A user with the same username already exists. | New user is not created. | Submit registration payload using existing username. | API returns conflict error for username. | Implemented in `backend/tests/test_authentication_controller.py`. |
| UT003 | Reject duplicate email. | A user with the same email already exists. | New user is not created. | Submit registration payload using existing email. | API returns conflict error for email. | Implemented in `backend/tests/test_authentication_controller.py`. |
| UT004 | Reject invalid or short username. | Registration payload has invalid username format or length. | Invalid account is not created. | Submit invalid registration payload. | API returns validation error. | Implemented in `backend/tests/test_authentication_controller.py`. |
| UT005 | Log in successfully and set session cookie. | User exists, is enabled, and password is valid. | User receives authenticated session. | Submit login payload. | API returns user data and response sets session cookie. | Implemented in `backend/tests/test_authentication_controller.py`. |
| UT006 | Reject invalid login or disabled account. | User does not exist, password is wrong, or account is disabled. | Session is not created. | Submit invalid login payload. | API returns unauthorized or forbidden response. | Implemented in `backend/tests/test_authentication_controller.py`. |
| UT007 | Return current user with valid session and reject missing session. | Session cookie is present or absent depending on test branch. | Valid session returns user; missing session returns authentication error. | Call current-user endpoint. | Current user details are returned only for valid session. | Implemented in `backend/tests/test_authentication_controller.py`. |
| UT008 | Log out and invalidate session. | User has active session. | Session is no longer valid. | Call logout endpoint, then call current-user endpoint again. | Current-user endpoint becomes unauthorized after logout. | Implemented in `backend/tests/test_authentication_controller.py`. |
| UT009 | Verify roles, ownership, profile access, and role assignment. | Test users exist with User, Moderator, and Admin roles. | Access decisions match role rules. | Call access-control service methods with different actor and target roles. | Owners and staff are allowed where expected; lower roles are blocked where expected. | Implemented in `backend/tests/test_access_control_service.py`. |
| UT010 | Create server sessions and handle timeout behaviour. | Session service is initialized. | Expired sessions are purged or zero-timeout session remains valid. | Create session and inspect expiry behaviour. | Session lifecycle follows timeout settings. | Implemented in `backend/tests/test_session_service.py`. |
| UT057 | Enforce protected request header checks. | Protected request is sent with missing or valid protection header. | Missing header is rejected; valid header allows state change. | Submit protected state-changing request in backend and frontend tests. | Missing protection header returns JSON error; valid header succeeds. | Implemented in `backend/tests/test_csrf_hardening.py` and `frontend/tests/api-client-csrf.test.ts`. |

### Blueprint unit tests

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
|---|---|---|---|---|---|---|
| UT011 | Validate a correct blueprint payload. | Payload contains valid metadata, architecture, indicators, and features. | Validation succeeds. | Call blueprint validator. | Validator returns success. | Implemented in `backend/tests/test_blueprint_validator.py`. |
| UT012 | Validate indicator output scalers and custom indicators. | Payload includes supported custom indicators and scaler settings. | Indicator configuration is accepted. | Call blueprint validator with indicator settings. | Validator accepts supported indicator and scaler configuration. | Implemented in `backend/tests/test_blueprint_validator.py`. |
| UT013 | Reject missing blueprint name or unsupported indicator. | Payload is missing required metadata or selects unsupported indicator. | Invalid blueprint is rejected. | Call blueprint validator. | Validator returns field-level errors. | Implemented in `backend/tests/test_blueprint_validator.py`. |
| UT014 | Reject invalid architecture settings and collect multiple errors. | Payload has malformed architecture settings and other invalid sections. | Invalid blueprint is rejected with multiple messages. | Call blueprint validator. | Validator does not crash and returns collected errors. | Implemented in `backend/tests/test_blueprint_validator.py`. |
| UT015 | Create draft blueprint with defaults. | Authenticated user and valid blueprint payload exist. | Draft blueprint is persisted. | Submit create blueprint request. | Response returns blueprint id, version, approval state, and detail path. | Implemented in `backend/tests/test_blueprint_controller.py`. |
| UT016 | Return field-level blueprint validation errors from API. | Authenticated user submits invalid payload. | Blueprint is not saved. | Submit invalid create blueprint request. | API returns validation errors. | Implemented in `backend/tests/test_blueprint_controller.py`. |
| UT017 | Show blueprint detail and persist favourite/unfavourite. | Accessible blueprint exists. | Favourite state changes correctly. | Request detail, favourite, and unfavourite endpoints. | Detail is accessible and favourite state is stored and removed. | Implemented in `backend/tests/test_blueprint_controller.py`. |
| UT018 | Request blueprint approval and moderate it. | Owner has draft blueprint; moderator account exists. | Approval state changes through valid transitions. | Request approval, then approve or reject as moderator. | Draft becomes pending and moderation action updates state. | Implemented in `backend/tests/test_blueprint_approval_controller.py`. |
| UT019 | Reject invalid moderation transition. | Blueprint is in a state that does not allow the requested transition. | State is not changed. | Attempt invalid moderation action. | API returns invalid-transition error. | Implemented in `backend/tests/test_blueprint_approval_controller.py`. |

### Experiment, compiler, executor, queue, and worker unit tests

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
|---|---|---|---|---|---|---|
| UT020 | Validate a correct experiment payload. | Payload has valid BTCUSDT range, split, blueprint, and overrides. | Validation succeeds. | Call experiment validator. | Validator returns success. | Implemented in `backend/tests/test_experiment_validator.py`. |
| UT021 | Reject invalid experiment fields and split values. | Payload is missing required fields, has invalid date order, or invalid splits. | Invalid experiment is rejected. | Call experiment validator. | Validator returns structured field errors. | Implemented in `backend/tests/test_experiment_validator.py`. |
| UT022 | Validate blueprint access rules. | Blueprint exists with owner, approval, or staff access scenario. | Access decision is correct. | Validate payload with different actor and blueprint states. | Owner, approved public access, and staff access work; inaccessible blueprint is rejected. | Implemented in `backend/tests/test_experiment_validator.py`. |
| UT023 | Validate override constraints. | Payload includes architecture, indicator, target, or split overrides. | Unsupported overrides are rejected. | Call experiment validator with valid and invalid overrides. | Validator accepts allowed overrides and rejects unsupported nested values. | Implemented in `backend/tests/test_experiment_validator.py`. |
| UT024 | Return approved blueprint options. | Approved and non-approved blueprints exist. | Only valid options are returned to wizard. | Request blueprint options endpoint. | API returns approved options with search, pagination, and sorting behaviour. | Implemented in `backend/tests/test_experiment_controller.py`. |
| UT025 | Reject unauthenticated experiment creation. | Request has no authenticated user. | Experiment is not created. | Submit create experiment request. | API returns authentication error. | Implemented in `backend/tests/test_experiment_controller.py`. |
| UT026 | Return structured experiment creation errors. | Authenticated user submits invalid experiment payload. | Experiment is not created. | Submit invalid create experiment request. | API returns 422 validation response with fields. | Implemented in `backend/tests/test_experiment_controller.py`. |
| UT027 | Create experiment and return created payload. | Authenticated user, valid payload, accessible blueprint, and queue mock exist. | Experiment is stored and queued. | Submit create experiment request. | Response contains experiment id, status, detail path, and queue metadata. | Implemented in `backend/tests/test_experiment_controller.py`. |
| UT028 | Pass requested job priority to queue. | Experiment payload contains requested priority. | Queue receives expected priority. | Submit experiment request and inspect queue call. | Queue call includes requested priority. | Implemented in `backend/tests/test_experiment_controller.py`. |
| UT029 | Enforce experiment ownership on list and detail. | Experiments belong to different users. | Users can only view allowed records. | Request list and detail as different users. | Owner sees own experiment; other user is blocked. | Implemented in `backend/tests/test_experiment_controller.py`. |
| UT030 | Merge compiler overrides without mutating blueprint. | Blueprint and experiment override payload exist. | Blueprint remains unchanged and compiled plan contains effective values. | Call compiler. | Compiler returns merged plan without mutating source blueprint. | Implemented in `backend/tests/test_experiment_compiler.py`. |
| UT031 | Generate permutations, hashes, and deterministic sample. | Blueprint has parameter spaces and seed. | Compiled plan contains stable selected permutations. | Call compiler with deterministic settings. | Parameter hashes are stable and sample selection is reproducible. | Implemented in `backend/tests/test_experiment_compiler.py`. |
| UT032 | Reject disallowed compiler overrides. | Payload includes unsupported or conflicting overrides. | Compilation fails safely. | Call compiler. | Compiler raises structured compilation errors. | Implemented in `backend/tests/test_experiment_compiler.py`. |
| UT033 | Preserve snapshot after blueprint changes. | Compiled snapshot exists and blueprint later changes. | Original compiled plan remains stable. | Compile, modify blueprint, then inspect snapshot. | Snapshot stays immutable for executed experiment. | Implemented in `backend/tests/test_experiment_compiler.py`. |
| UT034 | Load executor data from persisted cache only. | Cached BTCUSDT rows exist. | Executor uses repository rows without refreshing external data. | Call executor data loading method. | Data is loaded from persisted cache. | Implemented in `backend/tests/test_default_experiment_executor.py`. |
| UT035 | Raise executor error for insufficient candles. | Cache has too few rows. | Execution is stopped before invalid modelling. | Call executor data loading method. | Executor raises a clear error. | Implemented in `backend/tests/test_default_experiment_executor.py`. |
| UT036 | Follow executor template-method order. | Executor dependencies are mocked. | Execution stages run in expected order. | Run executor and inspect call order. | Template-method sequence is followed. | Implemented in `backend/tests/test_default_experiment_executor.py`. |
| UT037 | Validate queued worker payload. | Queue payload is missing, malformed, or references missing experiment. | Invalid job is rejected. | Call worker payload validation. | Worker raises validation error. | Implemented in `backend/tests/test_experiment_worker.py`. |
| UT038 | Mark experiment completed on worker success. | Valid queued experiment and successful executor result exist. | Experiment status becomes completed. | Run worker handler. | Worker returns successful payload and marks completion. | Implemented in `backend/tests/test_experiment_worker.py`. |
| UT039 | Mark experiment failed on executor error. | Executor raises runtime error. | Experiment status becomes failed. | Run worker handler. | Worker marks experiment failed and raises error. | Implemented in `backend/tests/test_experiment_worker.py`. |

### Market data, strategy, model, user, system, public, and documentation unit tests

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
|---|---|---|---|---|---|---|
| UT040 | Return cached BTCUSDT kline items. | Cache contains BTCUSDT rows. | Chart-ready data is returned. | Request kline endpoint. | Response contains timestamp, open, high, low, close, and volume values. | Implemented in `backend/tests/test_market_data_controller.py`. |
| UT041 | Validate market-data request parameters and empty cache. | Request has invalid parameters or no rows are cached. | Invalid request is rejected or empty state is returned. | Request kline endpoint with invalid and empty-cache cases. | API validates limit/range and returns empty items when cache is empty. | Implemented in `backend/tests/test_market_data_controller.py`. |
| UT042 | Return target preview labels and statistics. | Cached market data and target preview payload exist. | Preview data is returned without creating an experiment. | Submit target preview request. | API returns aligned labels and statistics. | Implemented in `backend/tests/test_market_data_controller.py`. |
| UT043 | Refresh BTCUSDT cache and return summary. | Mock kline client and market-data repository exist. | Refresh summary is returned. | Call market-data service refresh method. | Summary includes fetched, inserted, and updated counts. | Implemented in `backend/tests/test_market_data_service.py`. |
| UT044 | Discover missing BTCUSDT ranges. | Cached timestamps have gaps. | Missing ranges are identified. | Call missing-range discovery method. | Head, internal, and tail gaps are detected. | Implemented in `backend/tests/test_market_data_service.py`. |
| UT045 | Upsert BTCUSDT kline timestamps. | Repository receives new and duplicate candle rows. | Insert and update counts are correct. | Call repository upsert and range retrieval. | Rows are inserted or updated by timestamp. | Implemented in `backend/tests/repositories/test_market_data_repository.py`. |
| UT046 | Verify chronological time-based split. | Ordered candle frame exists. | Train, validation, and test sets do not leak future rows. | Apply time-based split strategy. | Splits remain chronological. | Implemented in `backend/tests/strategies/test_data_split_strategy.py`. |
| UT047 | Verify seeded random split. | Candle frame and seed exist. | Same seed reproduces split; different seed changes it. | Apply random split strategy with repeated seeds. | Random split is reproducible by seed. | Implemented in `backend/tests/strategies/test_data_split_strategy.py`. |
| UT048 | Verify target strategy labels and invalid lookahead rejection. | Candle frame and target parameters exist. | Labels are binary and invalid settings are rejected. | Apply target strategies. | Target output contains valid binary labels, and invalid lookahead fails. | Implemented in `backend/tests/strategies/test_target_strategy.py`. |
| UT049 | Enforce model detail access. | Public and private model records exist. | Access follows ownership and visibility rules. | Request model detail as different users. | Public/private rules are enforced. | Implemented in `backend/tests/test_model_controller.py`. |
| UT050 | Sort, filter, paginate, and favourite model rankings. | Model records, metrics, and favourite records exist. | Ranking response reflects query parameters. | Request rankings with sort, filter, page, and favourite actions. | API returns expected ordered and filtered models. | Implemented in `backend/tests/test_model_controller.py`. |
| UT051 | Return model highlights. | Models and log metrics exist. | Highlight sections are populated. | Request model highlights endpoint. | API returns direct and log-based highlight groups. | Implemented in `backend/tests/test_model_controller.py`. |
| UT052 | Enforce staff user management constraints. | Normal, moderator, and admin users exist. | Restricted actions follow staff rules. | Call user listing and mutation endpoints. | Normal user is blocked; staff rules are enforced. | Implemented in `backend/tests/test_user_controller.py`. |
| UT053 | Enforce admin username and role update rules. | Admin and non-admin users exist. | Only admin can perform admin-only updates. | Submit username and role update requests. | Invalid duplicate/short username is rejected and role rules are enforced. | Implemented in `backend/tests/test_user_controller.py`. |
| UT054 | Return system queue, settings, and events for admin. | Admin session and system data exist. | System data is returned. | Request system queue, settings, events, and event download. | Admin receives queue snapshot, settings, and events; non-admin is blocked. | Implemented in `backend/tests/test_system_controller.py`. |
| UT055 | Expose public hub visibility and search. | Enabled users and public artefacts exist. | Public page shows only visible records. | Request public hub and public profile endpoints. | API returns visible public records only. | Implemented in `backend/tests/test_public_hub_controller.py`. |
| UT056 | Expose documentation list and detail. | Documentation entries exist. | Documentation is returned or missing slug is rejected. | Request documentation list and detail endpoints. | API returns list/detail and 404 for missing slug. | Implemented in `backend/tests/test_documentation_controller.py`. |

### Frontend unit and component tests

| Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
|---|---|---|---|---|---|---|
| UT058 | Render login validation and valid submit flow. | Login view is rendered with mocked router and API. | Invalid form blocks submit; valid form redirects. | Fill form with invalid and valid values. | Validation appears and valid login navigates to dashboard. | Implemented in `frontend/tests/login-view.test.tsx`. |
| UT059 | Render registration validation and valid submit flow. | Registration view is rendered with mocked API. | Invalid form blocks submit; valid form redirects. | Fill registration form. | Validation appears and valid registration navigates to login. | Implemented in `frontend/tests/registration-view.test.tsx`. |
| UT060 | Enforce frontend route guards. | Auth state and role state are mocked. | Route access follows authentication and role requirements. | Render guard components for unauthenticated, unauthorized, and admin users. | Unauthenticated user redirects to login; unauthorized user is blocked; admin is allowed. | Implemented in `frontend/tests/auth-guards.test.tsx`. |
| UT061 | Render dashboard cards, quick actions, chart interval, and loading state. | Dashboard view receives mocked props and API hooks. | Dashboard renders expected user-facing content. | Render dashboard under normal and loading states. | Cards, links, chart interval, and fallbacks appear. | Implemented in `frontend/tests/dashboard-view.test.tsx`. |
| UT062 | Render blueprint wizard. | Blueprint metadata and API calls are mocked. | Wizard steps and errors render correctly. | Navigate steps, review summary, submit, and simulate backend error. | Step navigation, constraints, review, and errors behave correctly. | Implemented in `frontend/tests/blueprint-wizard-view.test.tsx`. |
| UT063 | Render blueprint library, detail, and moderation actions. | Blueprint list/detail/moderation API responses are mocked. | Blueprint UI states are visible. | Render tabs, detail page, favourite action, and moderation queue. | Owned/favourited lists, lineage, favourite toggle, and staff actions appear. | Implemented in `frontend/tests/blueprint-library-detail-moderation.test.tsx`. |
| UT064 | Render experiment wizard. | Blueprint options, market data, target preview, and API calls are mocked. | Wizard supports full configuration flow. | Navigate wizard, select blueprint, configure split/target/overrides, submit. | Wizard validates inputs and redirects to detail on success. | Implemented in `frontend/tests/experiment-wizard-view.test.tsx`. |
| UT065 | Render experiment detail. | Experiment detail response is mocked. | Configuration, leaderboard, modal, progress, and downloads render. | Render detail view and open relevant actions. | Experiment sections and download actions appear. | Implemented in `frontend/tests/experiment-detail-view.test.tsx`. |
| UT066 | Render job detail. | Job API response is mocked. | Job detail or not-found message appears. | Render job detail view with success and missing job cases. | Job state is shown or friendly not-found message appears. | Implemented in `frontend/tests/job-detail-view.test.tsx`. |
| UT067 | Render model rankings and detail. | Model ranking/detail API responses are mocked. | Model table and detail content render correctly. | Apply filters, sort columns, open detail, handle API error. | Rankings, filters, errors, favourites, and nested metrics appear. | Implemented in `frontend/tests/model-views.test.tsx`. |
| UT068 | Render favourites page. | Favourited model and blueprint responses are mocked. | Favourites can be shown and filtered. | Render favourites view and apply local filters. | Favourited models and blueprints appear. | Implemented in `frontend/tests/favorites-library-view.test.tsx`. |
| UT069 | Render public hub tabs. | Public hub API responses are mocked. | Public records load and tab switching works. | Render hub and switch tabs. | Public records update according to active tab. | Implemented in `frontend/tests/public-hub-view.test.tsx`. |
| UT070 | Render documentation pages. | Documentation API responses are mocked. | Documentation list and detail appear. | Render list and detail views. | Documentation items and selected body are shown. | Implemented in `frontend/tests/documentation-view.test.tsx`. |
| UT071 | Render user management page. | User-management API responses and actor roles are mocked. | Role-specific actions and errors render. | Render normal user, moderator, and admin cases. | Normal user actions are hidden; moderator/admin actions appear according to role. | Implemented in `frontend/tests/user-management-view.test.tsx`. |
| UT072 | Render system management page. | Queue, settings, events, and market-data API responses are mocked. | System page states render correctly. | Render queue, settings, event terminal, and market-data controls. | Queue cards, settings controls, event output, and catch-up states appear. | Implemented in `frontend/tests/system-management-view.test.tsx`. |
| UT073 | Render BTCUSDT chart states. | Chart component receives loading, error, empty, and candle data cases. | Chart handles all display states. | Render chart in each state and update candles. | Loading, error, empty, chart success, incremental update, and cleanup work. | Implemented in `frontend/tests/btcusdt-price-chart.test.tsx`. |
| UT074 | Render navigation and role visibility. | Navigation receives authenticated role contexts. | Navigation shows only allowed pages. | Render navigation for user, moderator, and admin roles. | Labels, route targets, sign-out, and admin dropdown behave correctly. | Implemented in `frontend/tests/navigation.test.tsx`. |

## Required evidence for the final report

The following screenshots should be added after running the test commands:

| Evidence | What to show |
|---|---|
| Backend unit test terminal output | pytest summary showing backend tests passing. |
| Frontend unit test terminal output | Jest summary showing frontend tests passing. |
| Backend test folder screenshot | `backend/tests/` folder with representative controller, service, strategy, repository, and worker tests. |
| Frontend test folder screenshot | `frontend/tests/` folder with representative view and component tests. |
| Example backend test file screenshot | One authentication, experiment, market-data, or compiler test file. |
| Example frontend test file screenshot | One experiment wizard, blueprint wizard, model view, or system management test file. |

The unit testing section now covers 74 distinct unit tests or focused unit-test groups. This exceeds the minimum requirement of 30 unit tests and provides stronger evidence that the implemented system was tested at the module level.
