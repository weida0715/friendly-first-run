# 7.3 Usability Testing

Usability testing checks whether the implemented frontend lets each user role complete the required tasks without direct database access or backend knowledge. This subsection reports usability evidence from the implemented React views and the passing frontend test suite. The frontend test command was executed from `frontend/` using `npm test -- --runInBand`. The actual result was **25 test suites passed, 113 tests passed, 0 snapshots, and 19.087 seconds**.

The test run printed React `act(...)` warnings for asynchronous updates in `views/BlueprintWizardView.tsx` and `views/SystemManagementView.tsx`, and a Next.js workspace-root warning. These warnings did not fail the tests. They are recorded here because they affect test-output cleanliness, even though the tested user behaviours passed.

## 7.3.1 Usability Test Scope

| User role | Main workflows tested | Frontend evidence |
|---|---|---|
| User | Register, log in, open dashboard, create blueprint, configure experiment, inspect experiment detail, view jobs, view models, manage favourites, browse public hub, read documentation. | `frontend/tests/login-view.test.tsx`, `frontend/tests/registration-view.test.tsx`, `frontend/tests/dashboard-view.test.tsx`, `frontend/tests/blueprint-wizard-view.test.tsx`, `frontend/tests/experiment-wizard-view.test.tsx`, `frontend/tests/experiment-detail-view.test.tsx`, `frontend/tests/model-views.test.tsx`, `frontend/tests/favorites-library-view.test.tsx`, `frontend/tests/public-hub-view.test.tsx`, `frontend/tests/documentation-view.test.tsx` |
| Moderator | Open blueprint moderation queue and use staff-visible actions where allowed. | `frontend/tests/blueprint-library-detail-moderation.test.tsx`, `frontend/tests/navigation.test.tsx`, `frontend/tests/user-management-view.test.tsx` |
| Admin | Manage users, view system state, update system settings, inspect event output, and manage market-data controls. | `frontend/tests/user-management-view.test.tsx`, `frontend/tests/system-management-view.test.tsx`, `frontend/tests/navigation.test.tsx` |

## 7.3.2 Usability Test Results

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
|---|---|---|---|---|---|---|
| 27 June 2026 | User shall be able to register and log in securely. | User | Automated test | Login and registration views show validation errors for invalid input and submit valid payloads. The login view redirects to the dashboard after a successful login. | Pass | The authentication interface is usable and gives clear feedback for invalid input. Evidence: `frontend/tests/login-view.test.tsx`, `frontend/tests/registration-view.test.tsx`. |
| 27 June 2026 | User shall be able to access protected pages only after authentication. | User | Automated test | Route guards redirect unauthenticated users to login and block authenticated users who do not meet the required role. | Pass | Protected routes behave in a way that users can understand. Evidence: `frontend/tests/auth-guards.test.tsx`. |
| 27 June 2026 | User shall be able to view dashboard cards and BTCUSDT chart state. | User | Automated test | Dashboard cards, quick-action links, selected chart interval, loading state, and live statistic fallbacks render correctly. | Pass | The dashboard works as a clear entry page for the system. Evidence: `frontend/tests/dashboard-view.test.tsx`. |
| 27 June 2026 | User shall be able to create a blueprint using guided steps. | User | Automated test | The blueprint wizard supports step navigation, review summary, invalid-step error display, metadata-backed indicator constraints, token inputs, and backend validation error display. | Pass with warning | The workflow is usable. The test run printed React `act(...)` warnings for asynchronous metadata updates in `views/BlueprintWizardView.tsx`, but all blueprint wizard tests passed. Evidence: `frontend/tests/blueprint-wizard-view.test.tsx`. |
| 27 June 2026 | User shall be able to view owned and favourited blueprints. | User | Automated test | Owned and favourited lists render through tabs. Blueprint detail shows status, lineage, and favourite toggle behaviour. | Pass | Blueprint library and detail pages support reuse and inspection. Evidence: `frontend/tests/blueprint-library-detail-moderation.test.tsx`. |
| 27 June 2026 | Moderator shall be able to review submitted blueprints. | Moderator | Automated test | Moderation actions appear when the queue contains items. Navigation tests also confirm role-based visibility. | Pass | Moderator workflow is visible and separated from normal user flow. Evidence: `frontend/tests/blueprint-library-detail-moderation.test.tsx`, `frontend/tests/navigation.test.tsx`. |
| 27 June 2026 | User shall be able to configure and submit an experiment. | User | Automated test | The experiment wizard renders the seven-step shell, dataset preview, approved blueprint options, read-only blueprint preview, split controls, target selection, target preview, override fields, review step, backend error mapping, and successful submit redirect. | Pass | The experiment workflow is structured enough for complex configuration. Evidence: `frontend/tests/experiment-wizard-view.test.tsx`. |
| 27 June 2026 | User shall be able to inspect experiment status and details. | User | Automated test | Experiment detail renders configuration, risk chart modal, model leaderboard, retraining progress while logs are prepared, and completed experiment download actions. | Pass | Experiment monitoring and result inspection are usable from the detail page. Evidence: `frontend/tests/experiment-detail-view.test.tsx`. |
| 27 June 2026 | User shall be able to inspect job detail and understand missing jobs. | User | Automated test | Job detail renders fetched job data and shows a friendly message when a job is not found. | Pass | Job state is visible and missing-job feedback is understandable. Evidence: `frontend/tests/job-detail-view.test.tsx`. |
| 27 June 2026 | User shall be able to view model rankings, details, and favourites. | User | Automated test | Model rankings render sortable headings, filter rules, API errors, include-incomplete toggle, favourite removal, and model detail metrics with nested parameters and readable logs. | Pass | Model comparison and model detail review are usable. Evidence: `frontend/tests/model-views.test.tsx`. |
| 27 June 2026 | User shall be able to view favourited models and blueprints. | User | Automated test | Favourited models and blueprints load and can be filtered locally. | Pass | Favourite library supports retrieval of saved artefacts. Evidence: `frontend/tests/favorites-library-view.test.tsx`. |
| 27 June 2026 | User shall be able to browse public hub. | User | Automated test | Public records load and tab switching works. | Pass | Public discovery is reachable and understandable. Evidence: `frontend/tests/public-hub-view.test.tsx`. |
| 27 June 2026 | User shall be able to browse documentation. | User | Automated test | Documentation list and detail pages render correctly. | Pass | Support content is available through the documentation page. Evidence: `frontend/tests/documentation-view.test.tsx`. |
| 27 June 2026 | Admin shall be able to manage users. | Admin | Automated test | The user management page shows API errors, hides staff actions for normal users, shows moderator actions only for normal-user targets, shows the full admin action set, and renders audit entries. | Pass | User management is role-aware and understandable for staff users. Evidence: `frontend/tests/user-management-view.test.tsx`. |
| 27 June 2026 | Admin shall be able to inspect system state. | Admin | Automated test | System management renders queue snapshot cards, empty queue state, editable settings controls, terminal output truncation with download link, BTCUSDT controls, catch-up failures, and catch-up stop state. | Pass with warning | System management is usable. The test run printed React `act(...)` warnings for asynchronous state updates in `views/SystemManagementView.tsx`, but all system management tests passed. Evidence: `frontend/tests/system-management-view.test.tsx`. |
| 27 June 2026 | User shall be able to understand BTCUSDT chart states. | User | Automated test | BTCUSDT chart renders loading, error, empty, success, incremental update, and cleanup states. | Pass | The chart provides clear feedback across data states. Evidence: `frontend/tests/btcusdt-price-chart.test.tsx`. |
| 27 June 2026 | Navigation shall match user role. | User, Moderator, Admin | Automated test | Navigation labels, route targets, role-based visibility, sign-out behaviour, landing-page brand action, guest navigation, and admin dropdown behaviour render correctly. | Pass | The navigation model supports role-specific workflows. Evidence: `frontend/tests/navigation.test.tsx`. |

## 7.3.3 Usability Observations by Module

| Module | Actual observation | Result |
|---|---|---|
| Login and registration | Forms validate invalid data and submit valid payloads. | Pass |
| Dashboard | Cards, quick actions, chart interval, and loading/fallback states render. | Pass |
| Blueprint wizard | Step navigation, review, constraints, token inputs, and backend errors render. | Pass with warning from asynchronous test updates. |
| Blueprint library and moderation | Owned/favourited tabs, lineage, favourite toggle, and moderation actions render. | Pass |
| Experiment wizard | Dataset, split, blueprint selection, target preview, overrides, review, and submit flow render. | Pass |
| Experiment detail | Configuration, risk modal, leaderboard, progress, and downloads render. | Pass |
| Jobs | Job detail and not-found state render. | Pass |
| Models | Ranking, filter, favourite, error, and detail states render. | Pass |
| Favourites | Favourited model and blueprint lists render and filter locally. | Pass |
| Public hub | Public records load and tabs switch. | Pass |
| Documentation | List and detail content render. | Pass |
| Admin user management | Role-specific actions and audit entries render. | Pass |
| System management | Queue, settings, events, market-data controls, failures, and stop state render. | Pass with warning from asynchronous test updates. |
| Navigation | Role-specific navigation and sign-out behaviour render. | Pass |

## 7.3.4 Required Screenshots

The report should include screenshots for the following pages. These screenshots should show the actual browser UI after the tests or manual walkthrough:

| Screenshot | What to capture | Related path |
|---|---|---|
| Login page | Validation and successful login form state | `frontend/app/(auth)/login/` |
| Registration page | Form fields and validation state | `frontend/app/(auth)/register/` |
| Dashboard | Cards, quick actions, sidebar, and BTCUSDT chart | `frontend/app/dashboard/` |
| Blueprint wizard | Review step with architecture, indicators, and feature summary | `frontend/app/blueprints/new/` |
| Blueprint detail and moderation | Detail lineage/favourite state and moderation queue | `frontend/app/blueprints/`, `frontend/app/blueprints/moderation/` |
| Experiment wizard | Review step showing dataset, split, blueprint, target, and overrides | `frontend/app/experiments/new/` |
| Experiment detail | Status, progress, configuration, models, and downloads | `frontend/app/experiments/[id]/` |
| Job detail | Queue state, worker state, and not-found state if relevant | `frontend/app/jobs/[id]/` |
| Model rankings/detail | Metrics, filters, nested parameters, and favourite action | `frontend/app/models/` |
| Favourites | Saved models and blueprints | `frontend/app/favorites/` |
| Public hub and documentation | Public records and documentation body | `frontend/app/hub/`, `frontend/app/docs/` |
| Admin user management | User list, role-specific actions, and audit entries | `frontend/app/admin/users/` |
| System management | Queue snapshot, settings, events, and BTCUSDT controls | `frontend/app/system/` |

## 7.3.5 Usability Testing Conclusion

The implemented frontend passed its automated usability-oriented tests. The actual frontend result was 25 passing suites and 113 passing tests. The main user, moderator, and admin workflows are covered by the test files. The only observed concerns are test-output warnings related to asynchronous React updates in a few tests and a Next.js workspace-root warning. These warnings did not prevent the tested features from passing, but they should be cleaned up before final polishing if a warning-free test transcript is required.
