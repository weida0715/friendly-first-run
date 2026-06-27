# 7.4 Acceptance Testing

Acceptance testing verifies that the completed BEE system meets the functional requirements expected from the final project. The tests below are written as final verification cases. The `Actual Test Results` column may be filled after manual testing with real screenshots and terminal output.

## Acceptance test cases

### AT001 User authentication

| Tester | Test date | Test objective | Test inputs | Test procedures | Expected test outputs | Actual test results | Tester comments |
|---|---|---|---|---|---|---|---|
| Project evaluator / developer | 27-Jun-2026 | Verify that a user can register, log in, load session state, and log out. | Name, username, email, password | 1. Open `/register`. 2. Submit valid account. 3. Open `/login`. 4. Log in. 5. Open `/dashboard`. 6. Log out. | User account is created, session is established, dashboard is accessible, and logout clears session. | To be filled after manual run. | Expected to pass based on `backend/tests/test_authentication_controller.py` and frontend auth tests. |

### AT002 Dashboard and market chart

| Tester | Test date | Test objective | Test inputs | Test procedures | Expected test outputs | Actual test results | Tester comments |
|---|---|---|---|---|---|---|---|
| Project evaluator / developer | 27-Jun-2026 | Verify that authenticated user can view dashboard summary and BTCUSDT chart. | Authenticated user session, cached BTCUSDT candles | 1. Log in. 2. Open `/dashboard`. 3. Inspect summary cards and chart. 4. Change chart interval if available. | Dashboard cards and chart render successfully, or chart shows clear loading/empty/error state. | To be filled after manual run. | Expected to pass based on dashboard and chart tests. |

### AT003 Blueprint creation and library

| Tester | Test date | Test objective | Test inputs | Test procedures | Expected test outputs | Actual test results | Tester comments |
|---|---|---|---|---|---|---|---|
| Project evaluator / developer | 27-Jun-2026 | Verify that a user can create and view a blueprint. | Blueprint name, description, architecture, indicator selections, parameter constraints | 1. Open `/blueprints/new`. 2. Complete wizard steps. 3. Submit. 4. Open `/blueprints`. 5. Open blueprint detail. | Draft blueprint is created, appears in owned library, and detail page shows metadata, architecture, indicators, version/lineage, and approval state. | To be filled after manual run. | Include screenshots of wizard and detail page. |

### AT004 Blueprint approval and moderator panel

| Tester | Test date | Test objective | Test inputs | Test procedures | Expected test outputs | Actual test results | Tester comments |
|---|---|---|---|---|---|---|---|
| Project evaluator / developer | 27-Jun-2026 | Verify that blueprint approval workflow is usable and role-restricted. | Draft blueprint, moderator/admin account | 1. Owner requests approval on blueprint detail. 2. Log in as moderator/admin. 3. Open `/blueprints/moderation`. 4. Approve or reject blueprint. | Pending blueprint appears in moderation queue; staff action changes approval state. | To be filled after manual run. | Expected to pass based on approval controller and moderation view tests. |

### AT005 Experiment creation and queue submission

| Tester | Test date | Test objective | Test inputs | Test procedures | Expected test outputs | Actual test results | Tester comments |
|---|---|---|---|---|---|---|---|
| Project evaluator / developer | 27-Jun-2026 | Verify that a user can configure and submit an experiment. | Experiment name, date range, split ratios, target strategy, approved blueprint, overrides, deterministic seed | 1. Open `/experiments/new`. 2. Complete all wizard steps. 3. Review final configuration. 4. Submit. 5. Open experiment detail. | Experiment is created as queued, compiled snapshots are stored, job metadata is shown, and detail page shows configuration. | To be filled after manual run. | Include screenshots for each wizard step and review page. |

### AT006 Experiment execution and result viewing

| Tester | Test date | Test objective | Test inputs | Test procedures | Expected test outputs | Actual test results | Tester comments |
|---|---|---|---|---|---|---|---|
| Project evaluator / developer | 27-Jun-2026 | Verify that queued experiment can execute and produce model/log results. | Queued experiment, running worker, cached BTCUSDT data | 1. Start worker. 2. Wait for experiment processing. 3. Open `/experiments/[id]`. 4. Inspect status, leaderboard, logs/downloads. | Experiment moves to completed or failed state with clear status; completed experiment shows model leaderboard and logs/artifacts. | To be filled after manual run. | If using mocked/demo data, explain it in screenshot caption. |

### AT007 Model rankings, detail, and favourites

| Tester | Test date | Test objective | Test inputs | Test procedures | Expected test outputs | Actual test results | Tester comments |
|---|---|---|---|---|---|---|---|
| Project evaluator / developer | 27-Jun-2026 | Verify that users can compare models and favourite useful results. | Completed model records | 1. Open `/models`. 2. Inspect rankings table. 3. Open model detail. 4. Favourite model. 5. Open `/favorites`. | Rankings display metrics; detail shows provenance and parameter hash; favourited model appears in favourites page. | To be filled after manual run. | Use a model generated by experiment execution where possible. |

### AT008 Public hub and documentation

| Tester | Test date | Test objective | Test inputs | Test procedures | Expected test outputs | Actual test results | Tester comments |
|---|---|---|---|---|---|---|---|
| Project evaluator / developer | 27-Jun-2026 | Verify that public discovery and documentation pages are accessible. | Public/approved resources, documentation markdown files | 1. Open `/hub`. 2. Inspect public resources. 3. Open `/docs`. 4. Select a document. | Public hub lists only public/approved resources; documentation browser displays selected article content. | To be filled after manual run. | Include screenshots of both pages. |

### AT009 Admin user management

| Tester | Test date | Test objective | Test inputs | Test procedures | Expected test outputs | Actual test results | Tester comments |
|---|---|---|---|---|---|---|---|
| Project evaluator / developer | 27-Jun-2026 | Verify that admin/staff users can manage user accounts. | Admin or moderator account, target user account | 1. Log in as admin/staff. 2. Open `/admin/users`. 3. Inspect user table. 4. Change status/role/username/password where allowed. 5. Inspect audit details. | User-management actions are available only to authorized roles and changes are reflected in the table/audit information. | To be filled after manual run. | Do not show real passwords in screenshots. |

### AT010 System management and jobs

| Tester | Test date | Test objective | Test inputs | Test procedures | Expected test outputs | Actual test results | Tester comments |
|---|---|---|---|---|---|---|---|
| Project evaluator / developer | 27-Jun-2026 | Verify that admin can inspect queue/system state and users can inspect jobs. | Admin account, job id, system event records | 1. Open `/jobs` and `/jobs/[id]`. 2. Inspect job status. 3. Log in as admin. 4. Open `/system`. 5. Inspect queue, settings, events, market-data controls. | Jobs show lifecycle state; admin system page shows queue snapshot, settings/events, and maintenance controls. | To be filled after manual run. | Include queue screenshot and job detail screenshot. |

## Acceptance testing summary table

| Acceptance ID | Requirement area | Expected status |
|---|---|---|
| AT001 | Authentication | Accept if registration, login, session, and logout work |
| AT002 | Dashboard and chart | Accept if dashboard and chart states render clearly |
| AT003 | Blueprint creation/library | Accept if blueprint can be created and viewed |
| AT004 | Blueprint moderation | Accept if approval flow is role-restricted and stateful |
| AT005 | Experiment submission | Accept if experiment validates, compiles, persists, and queues |
| AT006 | Experiment execution | Accept if worker updates status and outputs are visible |
| AT007 | Model rankings/favourites | Accept if model comparison and favourite flow work |
| AT008 | Public hub/docs | Accept if public discovery and documentation are readable |
| AT009 | Admin user management | Accept if authorized staff can manage users and unauthorized users are blocked |
| AT010 | System/jobs | Accept if job and system monitoring pages work for allowed users |

## Evidence to attach

| Evidence | Location |
|---|---|
| Manual UI screenshots | All pages listed in acceptance tests |
| Backend test output | Terminal after `cd backend && pytest -q` |
| Frontend test output | Terminal after `cd frontend && npm test -- --runInBand` |
| Typecheck output | Terminal after `cd frontend && npm run typecheck` |
| Key code screenshots | Source paths listed in Chapter 6 snippet checklists |

## Summary

The acceptance tests verify that BEE is ready for final demonstration when the tester can complete the main workflow: log in, create and approve a blueprint, create and queue an experiment, execute it, view models/logs, save favourites, browse public outputs, read documentation, and use admin/moderator controls according to role. The actual-results column should be completed after the final manual demonstration run.
