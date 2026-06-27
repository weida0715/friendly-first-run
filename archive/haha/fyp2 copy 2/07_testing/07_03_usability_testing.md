# 7.3 Usability Testing

Usability testing was planned around the functional requirements and user roles represented by the implemented system. The main subjects are normal users, moderators, and administrators. The goal is to verify that each actor can complete the required workflows through the frontend without needing direct database or backend access.

The table below should be completed during manual user testing. The observations are written as report-ready draft observations based on the intended UI behaviour and implemented pages. Replace or refine them after capturing actual user-test evidence.

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
|---|---|---|---|---|---|---|
| 27 June 2026 | User shall be able to register and log in securely. | User | - | Subject can open the registration/login pages, submit credentials, and reach the authenticated dashboard after successful login. | Success | Authentication workflow is understandable and directs the user to the main system area. |
| 27 June 2026 | User shall be able to view the dashboard and BTCUSDT chart. | User | - | Subject can identify dashboard cards, sidebar navigation, and BTCUSDT price chart or chart state. | Success | Dashboard provides an understandable entry point into the system. |
| 27 June 2026 | User shall be able to create a blueprint. | User | - | Subject can follow the blueprint wizard steps for metadata, architecture, indicators, and review. | Success | Blueprint creation is guided and reduces configuration confusion. |
| 27 June 2026 | User shall be able to view owned and favourited blueprints. | User | - | Subject can open the blueprint library/detail page and identify approval state, version, indicators, and favourite action. | Success | Blueprint reuse and discovery are visible to the user. |
| 27 June 2026 | User shall be able to configure and submit an experiment. | User | - | Subject can follow the experiment wizard from basics to dataset range, split configuration, blueprint selection, parameter overrides, review, and submit. | Success | Experiment setup is structured into manageable steps. |
| 27 June 2026 | User shall be able to inspect experiment status and details. | User | - | Subject can open experiment list/detail pages and identify configuration, blueprint summary, split summary, progress/status, and result sections. | Success | Experiment monitoring is understandable after submission. |
| 27 June 2026 | User shall be able to inspect job detail and cancel eligible jobs. | User | - | Subject can open the job detail page and find job status, queue information, and cancellation action where allowed. | Moderate Success | Job lifecycle is visible, but additional explanatory text may improve user confidence for queued/running states. |
| 27 June 2026 | User shall be able to view model rankings, details, and favourites. | User | - | Subject can open model pages, inspect metric cards/parameters, and favourite useful models. | Success | Model comparison and saving are usable for experiment review. |
| 27 June 2026 | User shall be able to browse public hub and documentation. | User | - | Subject can navigate to public hub and documentation pages and find listing/detail content. | Success | Discovery and support pages are accessible from navigation. |
| 27 June 2026 | Moderator shall be able to review submitted blueprints. | Moderator | - | Subject can open moderation queue and identify approve/reject/disapprove actions for pending blueprints. | Success | Moderator workflow is visible and role-separated. |
| 27 June 2026 | Admin shall be able to manage users. | Admin | - | Subject can open user management page, view users, and identify status/role/password/username actions. | Success | Administrative user control is clear for staff users. |
| 27 June 2026 | Admin shall be able to inspect system state. | Admin | - | Subject can open system management page and inspect queue snapshot, settings, events, and market-data controls. | Success | Admin has operational visibility into system state. |
| 27 June 2026 | Unauthorized users shall not access restricted pages. | User | - | Subject is prevented from accessing admin/system pages and moderator functions. | Success | Role-based navigation and guards reduce accidental unauthorized access. |

Required screenshots for this subsection:

1. User completing the login page.
2. User completing blueprint wizard review step.
3. User completing experiment wizard review step.
4. User viewing experiment detail after submission.
5. Moderator viewing blueprint moderation queue.
6. Admin viewing user management page.
7. Admin viewing system management page.
8. Normal user blocked from restricted admin/system route.

Suggested notes to include after manual testing:

- Record the number of participants per role.
- Record any confusion points such as parameter override labels, split configuration, job lifecycle wording, or chart empty states.
- Add improvement actions for any `Moderate Success` or `Failure` rows.
