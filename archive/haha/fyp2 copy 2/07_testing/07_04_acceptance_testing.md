# 7.4 Acceptance Testing

Acceptance testing verifies that the completed system meets the predefined user and project requirements and is ready for handover. The following acceptance test cases are written around the implemented BEE features and user roles. As requested, the `Actual Test Results` field is left blank so that it can be filled after manual execution with the supervisor/client/tester.

## AT001: User Registration and Login

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that a user can register and log in to BEE. | 1. Name. 2. Username. 3. Email. 4. Password. 5. Login credentials. | 1. Open registration page. 2. Fill registration form. 3. Submit registration. 4. Open login page. 5. Enter valid credentials. 6. Submit login form. | User account is created, user logs in successfully, and system redirects to authenticated dashboard. |  | Expected and actual results should match if registration and login complete without errors. |

## AT002: Dashboard and BTCUSDT Chart

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that the dashboard presents navigation, summary content, and BTCUSDT chart state. | 1. Authenticated user session. 2. Cached BTCUSDT candle data. | 1. Log in. 2. Open dashboard. 3. Observe dashboard cards. 4. Observe BTCUSDT chart or chart state. | Dashboard loads with sidebar/top navigation, system cards, and BTCUSDT chart or meaningful loading/empty/error state. |  | Dashboard should act as the main entry point to the system. |

## AT003: Blueprint Creation

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that a user can create a reusable experiment blueprint. | 1. Blueprint name. 2. Description. 3. Architecture selection. 4. Indicator configuration. 5. Feature configuration. | 1. Open blueprint wizard. 2. Fill basics step. 3. Configure architecture. 4. Add indicators/features. 5. Review configuration. 6. Submit blueprint. | Blueprint draft is saved and appears in the user's owned blueprint library with correct metadata and configuration summary. |  | Blueprint should remain reusable for future experiment configuration. |

## AT004: Blueprint Moderation

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| Moderator tester | 27 June 2026 | To verify that submitted blueprints can be reviewed by staff. | 1. Submitted blueprint. 2. Moderator or Admin account. 3. Approval/rejection decision. | 1. Log in as Moderator/Admin. 2. Open blueprint moderation page. 3. Select pending blueprint. 4. Approve, reject, or disapprove. | Blueprint approval state changes according to the moderation action, and normal users cannot perform the same action. |  | Moderation should support governance before public/experiment reuse. |

## AT005: Experiment Configuration and Submission

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that a user can configure and submit an experiment. | 1. Experiment name. 2. BTCUSDT dataset range. 3. Train/validation/test split. 4. Approved blueprint. 5. Parameter overrides. | 1. Open experiment wizard. 2. Fill basics. 3. Select dataset range. 4. Configure split. 5. Select blueprint. 6. Apply parameter overrides. 7. Review. 8. Submit. | Experiment is created, stored with selected configuration, and queued for execution with visible status/job metadata. |  | The wizard should guide the user without requiring backend knowledge. |

## AT006: Experiment Detail, Job Tracking, and Cancellation

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that users can monitor experiments and manage eligible jobs. | 1. Created experiment. 2. Queued or running job. 3. Cancellation click event if available. | 1. Open experiment list. 2. Select experiment detail. 3. Review status/progress/configuration. 4. Open job detail. 5. Cancel eligible job if appropriate. | Experiment detail displays configuration and progress. Job detail displays queue/running/completed/failed/cancelled state. Eligible owner cancellation succeeds. |  | Cancellation should only be available when state and ownership allow it. |

## AT007: Model Rankings, Model Detail, Logs, and Favourites

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that users can inspect model outputs and save useful artefacts. | 1. Completed experiment. 2. Generated model records. 3. Favourite button click. 4. Log download click. | 1. Open model rankings/library. 2. Open model detail. 3. Review metrics and parameters. 4. Favourite model. 5. Download logs if available. | Model metrics and parameters are shown. Favourite model appears in favourites. Logs are downloadable for authorized experiment/model. |  | Model inspection should support comparison and later reuse. |

## AT008: Public Hub and Documentation

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that users can browse public content and documentation. | 1. Public hub filters/search. 2. Documentation slug or search query. | 1. Open public hub. 2. Search/filter public content. 3. Open public profile if available. 4. Open documentation page. 5. Open documentation detail. | Public hub and documentation pages display accessible content and details clearly. |  | This supports user learning and artefact discovery. |

## AT009: Admin User Management

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| Admin tester | 27 June 2026 | To verify that administrators can manage platform users. | 1. Admin account. 2. Target user. 3. Status/role/password/username changes. | 1. Log in as Admin. 2. Open user management page. 3. View user list. 4. Update status/role/username or reset password. | Admin can view and manage users. Unauthorized users cannot access user management functions. |  | User management should remain role-protected. |

## AT010: System Management and Market Data Administration

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| Admin tester | 27 June 2026 | To verify that administrators can inspect system state and manage market-data operations. | 1. Admin account. 2. Queue snapshot request. 3. System settings. 4. Market data catch-up/status/stop/clear actions. | 1. Log in as Admin. 2. Open system management page. 3. Inspect queue snapshot. 4. Inspect or update system settings. 5. View system events. 6. Trigger market-data administration action if appropriate. | Admin can view queue/system events/settings and manage market-data operations through protected controls. |  | Operational controls should remain admin-only. |

## AT011: Role Restriction and Unauthorized Access

| Tester | Test date | Test Objective | Test Inputs | Test Procedures | Expected Test Outputs | Actual Test Results | Tester Comments |
|---|---|---|---|---|---|---|---|
| User tester | 27 June 2026 | To verify that unauthorized users cannot access restricted modules. | 1. Normal user account. 2. Moderator route. 3. Admin route. | 1. Log in as normal user. 2. Attempt to open moderation route. 3. Attempt to open admin user management route. 4. Attempt to open system management route. | System blocks or redirects unauthorized user, and backend APIs deny restricted requests. |  | Backend enforcement is required even if navigation hides restricted links. |

Required screenshots for this subsection:

1. Acceptance testing form/table captured during user test.
2. At least one screenshot per accepted functional workflow: login, dashboard, blueprint creation, experiment submission, model detail, public hub/docs, admin users, system management.
