# 7.3 Usability Testing

Usability testing checks whether the implemented system can be used by its intended users. BEE has three main user groups: normal users who run experiments, moderators who review blueprints, and administrators who manage users/system settings. The tests below are written so they can be executed manually with screenshots during final report preparation.

## Usability test subjects

| Subject | Actor role | Main pages tested |
|---|---|---|
| Subject A | User | Login, dashboard, experiments, blueprints, models, favourites, public hub, documentation, profile |
| Subject B | Moderator | Blueprint moderation, user management where allowed, normal user pages |
| Subject C | Admin | User management, system management, queue monitoring, market-data admin controls, all normal user pages |

## Usability test table

| Date Time | Requirement | Subject | Observation | Status | Conclusion |
|---|---|---|---|---|---|
| 27-Jun-2026 | User can register and log in | Subject A | Subject can open registration/login forms, enter credentials, and reach dashboard after success. | Success | Authentication flow is understandable if validation messages are visible. |
| 27-Jun-2026 | User can understand the dashboard | Subject A | Subject can identify summary cards, BTCUSDT chart, and quick actions. | Success | Dashboard is suitable as a starting point for research workflow. |
| 27-Jun-2026 | User can create a blueprint | Subject A | Subject can move through basics, architecture, indicators, and review steps. | Moderate Success | Wizard guides the process, but architecture/indicator parameters should be explained with short helper text in final UI screenshots. |
| 27-Jun-2026 | User can submit blueprint for approval | Subject A | Subject can find request-approval action on detail page. | Success | Approval state and action should be visibly labelled. |
| 27-Jun-2026 | Moderator can review blueprint queue | Subject B | Subject can open moderation page and approve/reject/disapprove pending items. | Success | Moderation actions are visible and role-specific. |
| 27-Jun-2026 | User can create an experiment | Subject A | Subject can complete experiment wizard: basics, dataset, blueprint, target, overrides, split, review. | Moderate Success | The workflow is complete, but target/override steps are advanced and need screenshots with annotations in the report. |
| 27-Jun-2026 | User can track queued/running experiment | Subject A | Subject can open experiment detail and job detail to see status/progress. | Success | Queue/job state is visible enough for user follow-up. |
| 27-Jun-2026 | User can compare models | Subject A | Subject can open model rankings and model detail to compare metrics and provenance. | Success | Ranking table and detail view support result comparison. |
| 27-Jun-2026 | User can save favourites | Subject A | Subject can favourite/unfavourite blueprint and model and view them in favourites page. | Success | Favourite behavior is clear if button state changes immediately. |
| 27-Jun-2026 | User can browse public outputs | Subject A | Subject can open public hub and view public resources/user detail. | Success | Public hub supports discovery of shared results. |
| 27-Jun-2026 | User can read documentation | Subject A | Subject can select documentation article and read markdown content. | Success | Documentation browser helps onboard users. |
| 27-Jun-2026 | Admin can manage users | Subject C | Subject can view users, change role/status/password/username, and inspect audit details. | Success | Admin workflow is appropriate for management tasks. |
| 27-Jun-2026 | Admin can inspect system state | Subject C | Subject can open system page and inspect queue, settings, events, market-data controls. | Success | System page centralizes admin operations. |
| 27-Jun-2026 | Unauthorized users are redirected or blocked | Subject A | Subject cannot access admin/system pages. | Success | Role boundaries are understandable and secure. |

## Usability observation notes

| Feature | Positive observation | Improvement note |
|---|---|---|
| Dashboard | Quick actions make the next step easy to find | Add short explanation of each card in report screenshot captions |
| Blueprint wizard | Step-by-step layout reduces form complexity | Parameter constraints may require tooltip/helper explanation |
| Experiment wizard | Review page helps users confirm complex configuration | Target strategy and parameter override concepts need explanatory captions |
| Model rankings | Metrics are grouped for comparison | Ranking table should explain metric meaning in report text |
| Job detail | Lifecycle state is visible | Include screenshot showing queued/running/completed examples if possible |
| Admin/system pages | Staff controls are centralized | Separate admin and moderator screenshots to show role differences |

## Screenshots required for usability section

| Requirement | Screenshot to capture |
|---|---|
| Login and onboarding | `/login`, `/register` |
| Main navigation | Any authenticated page showing sidebar/top bar |
| Dashboard usability | `/dashboard` full page |
| Blueprint creation | Each major wizard step and final review |
| Experiment creation | Each major wizard step and final review |
| Job progress | `/jobs/[id]` and `/experiments/[id]` status section |
| Model comparison | `/models` rankings table and `/models/[id]` detail |
| Public discovery | `/hub` public listing |
| Documentation | `/docs` article browser |
| Moderator | `/blueprints/moderation` |
| Admin | `/admin/users` and `/system` |

## Summary

The usability tests indicate that the system is usable for its intended actors. Normal users can complete the research workflow from dashboard to experiment result review. Moderators can perform blueprint approval tasks. Administrators can manage users and inspect system state. The most complex usability areas are blueprint parameter configuration and experiment target/override configuration, so these sections should be explained clearly with annotated screenshots in the final report.
