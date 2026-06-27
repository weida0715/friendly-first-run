# 7.4 Acceptance Testing

## Section Purpose

This section demonstrates that the completed system meets the predefined functional requirements and is acceptable for deployment or handover. Acceptance tests should be written from the user/client perspective. Each test should identify the tester, test date, objective, inputs, procedures, expected outputs, actual results, and tester comments.

## Opening Paragraph Structure

Write two paragraphs.

Paragraph 1 should explain that acceptance testing verifies the final system against the requirements and confirms whether the implemented workflows satisfy user expectations.

Paragraph 2 should explain that the following acceptance tests are grouped by major functional requirement areas instead of listing all individual atomic requirements separately. This keeps the chapter readable while still tracing to the requirement groups.

## Required Acceptance Test Format

For each acceptance test, use this two-row table format:

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |

Actual Test Results may be left blank until final execution. Tester Comments can assume expected and actual results are similar unless final testing shows otherwise.

---

## AT001: User Registration, Login, and Session Access

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / test user | 25 June 2026 | To confirm that a guest can register or log in and access authenticated system functions | Name, username, email, credential field, login form submission | 1. Open the application. 2. Navigate to registration or login. 3. Submit valid account details. 4. Confirm dashboard access. 5. Refresh page. 6. Confirm session remains active. 7. Log out. | User is authenticated, dashboard is displayed, current-user state is restored after refresh, and logout returns the user to public state |  | The authentication workflow is acceptable if the user can complete login/logout without assistance and invalid input is clearly reported |

Requirements covered: F1.1 to F1.16.

> Note: Add screenshots of login/register, dashboard after login, and public state after logout.

---

## AT002: Role-Based Access and Staff User Management

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / staff account | 25 June 2026 | To confirm that Moderator and Admin users can perform permitted user-management tasks while normal users are restricted | User, Moderator, and Admin accounts; user list; status or role update actions | 1. Login as normal user and attempt staff page. 2. Login as Moderator and open user management. 3. Create or update a permitted user status. 4. Login as Admin and perform administrator-only user action. | Normal user is blocked from staff functions. Moderator can perform staff-permitted actions. Admin can access full user-management controls |  | Acceptance depends on both frontend guards and backend authorization enforcing role restrictions |

Requirements covered: F2.1 to F2.8, N3.2.

> Note: Add screenshots of user-management page for staff and restricted access behavior for a normal user.

---

## AT003: Blueprint Authoring, Approval, and Reuse

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / normal user and moderator | 25 June 2026 | To confirm that a user can create a blueprint and staff can approve it for later experiment use | Blueprint metadata, architecture selection, indicator configuration, parameter ranges | 1. Login as normal user. 2. Open blueprint wizard. 3. Enter valid blueprint details. 4. Submit draft. 5. Request approval. 6. Login as Moderator/Admin. 7. Approve submitted blueprint. 8. Verify blueprint appears in selectable experiment options. | Blueprint is saved, approval request changes state to pending, staff approval changes state to approved, and approved blueprint can be reused by experiment workflow |  | The blueprint workflow is acceptable if authoring, approval, and reuse operate as a continuous workflow |

Requirements covered: F11.1 to F11.17, F6.5, F6.8.

> Note: Add screenshots of blueprint wizard, blueprint detail after submission, and moderation approval screen.

---

## AT004: Experiment Configuration and Submission

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / normal user | 25 June 2026 | To confirm that a user can configure and submit a valid BTCUSDT experiment | Experiment name, BTCUSDT dataset scope, interval, start/end date, split percentages, approved blueprint, parameter overrides | 1. Login as authenticated user. 2. Open experiment wizard. 3. Complete basic details. 4. Select dataset range. 5. Configure train/validation/test split. 6. Select approved blueprint. 7. Review overrides. 8. Submit experiment. | Experiment is validated, persisted, linked to the selected blueprint, compiled into snapshots, and submitted to the queue |  | The experiment setup is acceptable if the user receives clear validation and submission feedback |

Requirements covered: F3.1 to F3.16, F4.2, F9.1, F9.2.

> Note: Add screenshots of the experiment wizard review page and submission result with queued status.

---

## AT005: Asynchronous Job Monitoring and Cancellation

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / experiment owner | 25 June 2026 | To confirm that submitted experiments run asynchronously and can be monitored or cancelled when eligible | Submitted experiment, queued job id, job detail page, cancellation action | 1. Submit a valid experiment. 2. Open job list or job detail. 3. Observe queued/running status. 4. Request cancellation for an eligible job. 5. Confirm status update. | Job metadata is visible, queue/running status is shown, and eligible cancellation request updates job or experiment state |  | The workflow is acceptable if users understand that jobs run in the background and can identify their status |

Requirements covered: F4.3 to F4.6, F9.3 to F9.15, F10.3.

> Note: Add screenshots of job detail page before and after cancellation, or queued/running/completed examples if cancellation is not demonstrated.

---

## AT006: Market Data Retrieval and Chart Display

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / authenticated user | 25 June 2026 | To confirm that BTCUSDT data can be loaded and displayed in the system | BTCUSDT symbol, interval, date range, chart view | 1. Start backend and supporting services. 2. Ensure BTCUSDT candles are available through cache or refresh. 3. Open dashboard or experiment wizard chart. 4. Observe chart state. | BTCUSDT candle data is displayed when available, and clear loading/empty/error states are shown otherwise |  | Market-data functionality is acceptable if data is available to both charts and experiment execution |

Requirements covered: F3.2, F3.3, F4.1, N1.2, N4.1.

> Note: Add a screenshot of the BTCUSDT chart with realistic candle data.

---

## AT007: Experiment Result Inspection, Models, and Logs

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / experiment owner | 25 June 2026 | To confirm that completed experiment outputs can be inspected and downloaded | Completed experiment, generated model rows, experiment logs, download action | 1. Open completed experiment detail. 2. Review split/configuration summary. 3. Inspect generated models and metrics. 4. Open model ranking/detail page. 5. Download available log artifacts. | Experiment detail shows configuration and results, model rankings are available, and logs can be downloaded in supported formats |  | Result inspection is acceptable if users can understand metrics and retrieve generated artifacts |

Requirements covered: F4.7 to F4.14, F5.1 to F5.8, F7.1 to F7.3.

> Note: Add screenshots of experiment detail, model rankings, model detail, and log download controls.

---

## AT008: Favorites and Public Hub Discovery

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / authenticated user | 25 June 2026 | To confirm that users can save artifacts and browse visible public research outputs | Approved blueprint, successful model, completed experiment, favorite action, Public Hub tabs | 1. Favorite a blueprint. 2. Favorite a model. 3. Open favorites page. 4. Remove a favorite. 5. Open Public Hub. 6. Browse users, experiments, models, and blueprints. | Favorites are added and removed correctly. Public Hub shows only permitted visible artifacts |  | Discovery features are acceptable if users can find, save, and revisit relevant artifacts |

Requirements covered: F6.1 to F6.10, F8.1 to F8.3, F13.1 to F13.6.

> Note: Add screenshots of favorites and Public Hub tabs.

---

## AT009: Documentation Viewer

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / guest or authenticated user | 25 June 2026 | To confirm that users can browse and read Markdown documentation inside the system | Documentation page, document slug, Markdown content | 1. Open documentation route. 2. View document list. 3. Select a document. 4. Confirm rendered content is readable. | Documentation list and selected Markdown content are displayed correctly |  | Documentation is acceptable if users can access guidance without leaving the system |

Requirements covered: F12.1.

> Note: Add one screenshot of the documentation viewer.

---

## AT010: Administrative System Monitoring

| Tester | Test Date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project evaluator / administrator | 25 June 2026 | To confirm that administrators can inspect queue status, settings, and system events | Admin account, queue snapshot, settings, system event list | 1. Login as administrator. 2. Open system management page. 3. View active queue information. 4. Inspect settings and system events. | Administrator can view operational information and system status from the system page |  | Administrative monitoring is acceptable if the admin can determine current queue and system state |

Requirements covered: F10.1 to F10.3, F9.5, F9.6.

> Note: Add screenshot of the system management page, especially active queue status.

## Summary Table of Requirement Coverage

| Acceptance Test | Requirement Areas Covered |
| --- | --- |
| AT001 | Authentication and sessions |
| AT002 | User management and RBAC |
| AT003 | Blueprint authoring, approval, and reuse |
| AT004 | Experiment configuration and submission |
| AT005 | Queue, worker, jobs, and cancellation |
| AT006 | Market data and chart display |
| AT007 | Results, models, metrics, and logs |
| AT008 | Favorites and public discovery |
| AT009 | Documentation |
| AT010 | Administration and system monitoring |

## Draft Closing Paragraph

The acceptance tests verify that the completed system satisfies its major functional requirement groups from the perspective of its intended users. The tests cover public access, authentication, role-based authorization, blueprint creation and approval, experiment submission, queue monitoring, market-data display, result inspection, favorites, public discovery, documentation, and administrative monitoring. Actual result fields should be completed during the final demonstration or handover test session.
