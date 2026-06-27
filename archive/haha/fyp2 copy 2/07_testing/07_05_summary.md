# 7.5 Summary

This chapter presented the testing approach used to verify the reliability, functionality, and quality of the Bitcoin Experimental Engine. Testing was organized into unit testing, integration testing, usability testing, and acceptance testing. The tests were derived from the actual backend and frontend source tree, with backend tests located under `backend/tests/` and frontend tests located under `frontend/tests/`.

Unit testing verified individual backend and frontend components. Backend tests covered domain entities, ORM schema constraints, repositories, validators, controllers, services, strategies, market data, experiment execution, queues, workers, jobs, public hub, documentation, user management, and system management. Frontend tests covered login, registration, route guards, dashboard, navigation, base states, status badges, blueprint wizard, blueprint moderation, experiment wizard, experiment list/detail, BTCUSDT chart, job detail, model views, favourites, public hub, documentation, admin user management, and system management.

Integration testing demonstrated that the major modules work together. Authentication integrates with sessions, roles, protected frontend routes, and backend access control. Blueprint creation integrates frontend wizard input, backend validation, repository persistence, versioning, and moderation. Experiment execution integrates the experiment wizard, validators, approved blueprint selection, compiler, queue service, Redis/RQ worker, executor, market data cache, model persistence, logs, and job tracking. Market data integration connects Binance retrieval, normalization, database cache, backend chart endpoints, frontend charts, and admin catch-up controls.

Usability testing focused on whether the main user roles can complete their expected workflows. Normal users should be able to log in, view the dashboard, create blueprints, configure experiments, inspect jobs, view models, manage favourites, browse the public hub, and read documentation. Moderators should be able to review blueprint submissions. Admins should be able to manage users, inspect system state, view queue information, update settings, view events, and manage market-data operations. The usability testing draft includes observation fields that can be updated after manual test sessions.

Acceptance testing provides final verification that the implemented system satisfies the major functional requirements. The acceptance test cases cover registration/login, dashboard/chart viewing, blueprint creation, blueprint moderation, experiment configuration/submission, experiment/job monitoring, model inspection, public hub/documentation, admin user management, system management, market-data administration, and role restriction. The `Actual Test Results` column is intentionally left blank in the acceptance tables so that it can be filled after execution with real tester evidence.

Overall, the testing process contributes to system readiness by showing that BEE has automated test coverage across backend and frontend units, integration coverage for key workflows, usability checks aligned with user roles, and acceptance tests aligned with functional requirements. The remaining testing work before final submission is to capture actual screenshots, execute manual acceptance tests with users or evaluators, and paste real test-run outputs into the report.

Recommended evidence to attach in the final report:

| Evidence item | Purpose |
|---|---|
| Backend pytest terminal result | Demonstrates automated backend verification. |
| Frontend Jest terminal result | Demonstrates automated frontend verification. |
| Login/dashboard screenshots | Demonstrates normal user access. |
| Blueprint wizard and moderation screenshots | Demonstrates blueprint creation and staff governance. |
| Experiment wizard, detail, and job screenshots | Demonstrates core experiment workflow. |
| Model rankings/detail screenshots | Demonstrates output inspection. |
| Admin user and system management screenshots | Demonstrates role-protected administration. |
| Acceptance test tables filled by tester | Demonstrates final handover readiness. |
