# 7.3 Usability Testing

## Section Purpose

This section evaluates whether the implemented system is usable by its intended actors. It should refer back to the functional requirements and show whether each actor can complete the required task through the user interface. Unlike unit and integration testing, usability testing focuses on user observation, clarity, navigation, feedback, and task completion.

## Opening Paragraph Structure

Write two paragraphs.

Paragraph 1 should explain that usability testing was carried out to determine whether the implemented web interface allows intended users to complete key workflows without unnecessary confusion.

Paragraph 2 should explain the actor roles used in testing: Guest, Normal User, Moderator, and Administrator. State that the tests are mapped to functional requirements from Chapter 3.

## Required Table Format

Use the faculty table format:

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |

The `Time` column can be marked as `Not recorded` if you do not measure exact completion time.

## Recommended Usability Test Table

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F1.1, F1.3, F1.4, F1.9, F1.14 | Guest / New User | Not recorded | Subject should be able to register, log in, and reach the dashboard with clear validation feedback for invalid fields |  | Authentication forms are usable if the subject can complete the process without assistance |
| 25 June 2026 | F1.10, F1.15 | Authenticated User | Not recorded | Subject should be able to identify account state and log out from the application shell |  | Logout is usable if the subject can return to public state clearly |
| 25 June 2026 | F2.1, F2.2, F2.7 | Moderator | Not recorded | Subject should be able to open user management, view users, create a normal user, and enable/disable accounts |  | Staff management is usable if allowed controls are visible and restricted controls are absent |
| 25 June 2026 | F2.3, F2.4, F2.5, F2.6 | Administrator | Not recorded | Subject should be able to perform administrator-only user-management actions |  | Admin management is usable if admin-only actions are clear and protected |
| 25 June 2026 | F11.1 to F11.4 | Normal User | Not recorded | Subject should be able to complete the blueprint wizard and understand required fields |  | Blueprint creation is usable if subject can complete all steps and review the result |
| 25 June 2026 | F11.6, F11.7 | Normal User | Not recorded | Subject should be able to request approval from blueprint detail page |  | Approval request is usable if state change and feedback are visible |
| 25 June 2026 | F11.8 to F11.10 | Moderator / Admin | Not recorded | Subject should be able to approve or reject pending blueprint submissions |  | Moderation is usable if pending items and action buttons are understandable |
| 25 June 2026 | F3.1 to F3.13 | Normal User | Not recorded | Subject should be able to complete experiment wizard steps, including dataset range, splits, blueprint selection, and overrides |  | Experiment setup is usable if invalid split/date/blueprint choices are explained clearly |
| 25 June 2026 | F4.2, F9.1, F9.2, F9.7, F9.8 | Normal User | Not recorded | Subject should be able to submit an experiment and see queued/running status |  | Queue feedback is usable if subject understands that execution is asynchronous |
| 25 June 2026 | F4.5, F4.6, F9.9, F9.10 | Normal User | Not recorded | Subject should be able to open job detail and request cancellation for an eligible job |  | Job cancellation is usable if confirmation and resulting status are clear |
| 25 June 2026 | F4.11 to F4.14 | Normal User | Not recorded | Subject should be able to inspect experiment detail and download available artifacts |  | Results are usable if metrics and download actions are easy to find |
| 25 June 2026 | F7.1, F7.2 | Normal User | Not recorded | Subject should be able to view model rankings and open model detail |  | Model discovery is usable if ranking metrics and detail links are clear |
| 25 June 2026 | F8.1 to F8.3 | Normal User | Not recorded | Subject should be able to favorite and unfavorite models or blueprints and view saved items |  | Favorites are usable if save/remove feedback is clear |
| 25 June 2026 | F13.1 to F13.6 | Authenticated User | Not recorded | Subject should be able to browse the Public Hub and understand visible users, experiments, models, and blueprints |  | Public discovery is usable if tabs, filters, and item summaries are understandable |
| 25 June 2026 | F12.1 | Guest / Authenticated User | Not recorded | Subject should be able to open documentation and read Markdown content |  | Documentation is usable if documents are discoverable and readable |
| 25 June 2026 | F10.1 to F10.3 | Administrator | Not recorded | Subject should be able to access system management and inspect queue/system status |  | System management is usable if admin can understand system state from the screen |
| 25 June 2026 | N5.1 to N5.4 | All Actors | Not recorded | Subject should be able to use the interface in supported browser dimensions and theme modes |  | Layout is usable if key actions remain visible and readable |

## How to Fill Status and Conclusion

Use one of these statuses:

| Status | Meaning |
| --- | --- |
| Success | User completed the task without assistance |
| Moderate Success | User completed the task with minor hesitation or one clarification |
| Failure | User could not complete the task or the workflow blocked completion |

The `Conclusion` field should briefly state whether the requirement is usable and what should be improved.

## Screenshot / Demo Requirement

> Note: Usability testing should include screenshots of user-facing pages rather than code. Recommended screenshots: registration/login, dashboard, blueprint wizard, experiment wizard, job detail, model ranking, favorites, public hub, documentation, user management, and system management.

> Note: If an actual participant test is performed later, replace the blank `Status` fields with the observed results and add a short paragraph describing the participant profile, for example role familiarity and prior system exposure.

## Pseudocode Requirement

No pseudocode is required for usability testing. Use observation tables and screenshots instead.

## Draft Content to Use in the Report

Usability testing was conducted to evaluate whether the implemented system can be operated by its intended user roles. The tests focus on task completion through the web interface rather than internal code correctness. The tested roles include guests, authenticated users, moderators, and administrators because each role has a different set of visible routes, permitted actions, and workflow responsibilities.

The usability test cases were derived from the functional requirements defined earlier in the project. Authentication tests focus on registration, login, logout, and session visibility. Research workflow tests focus on blueprint authoring, experiment configuration, job monitoring, result inspection, model discovery, and favorites. Staff and administrative usability tests focus on moderation, user management, queue visibility, and system monitoring.

The usability results should be interpreted by observing whether each subject can complete the task without assistance, whether labels and validation messages are understandable, whether navigation paths are clear, and whether the system provides enough feedback after actions such as submitting an experiment or requesting job cancellation.
