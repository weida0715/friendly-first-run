# 7.3 Usability Testing

Usability testing was carried out to determine whether the Bitcoin Experimental Engine was developed in a usable fashion for its intended end-users. Unlike unit testing and integration testing, which focus on internal correctness and module communication, usability testing focuses on whether the intended actors can complete the required tasks through the web interface with understandable labels, visible feedback, and clear navigation.

The usability tests were derived from the functional requirements defined in Chapter 3. The tested subjects are mapped to the main actor roles of the system: Guest, Normal User, Moderator, Administrator, Staff User, and Authenticated User. The `Time` column is skipped because exact task duration was not measured. The status values used are `Success`, `Moderate Success`, and `Failure`.

## 7.3.1 Usability Test Status Legend

| Status | Meaning |
| --- | --- |
| Success | The subject was able to complete the task without assistance and the interface provided sufficient feedback. |
| Moderate Success | The subject was able to complete the task but the workflow required minor interpretation, careful reading, or additional confirmation. |
| Failure | The subject was unable to complete the task or the workflow prevented completion. |

## 7.3.2 User Authentication and Authorization Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F1.1 | Guest | - | The subject was able to locate the registration page and submit an account using a valid email address. | Success | Email-based registration is usable for new users. |
| 25 June 2026 | F1.2 | Guest | - | The subject was able to register without needing to understand the internal credential-storage mechanism. | Success | Credential handling is hidden from the user and does not interrupt the registration flow. |
| 25 June 2026 | F1.3 | Guest | - | The subject was able to enter a username during registration. | Success | Username entry is clear in the registration form. |
| 25 June 2026 | F1.4 | Guest | - | The subject received clear feedback when attempting to register with an existing username. | Success | Duplicate-username prevention is understandable from the user interface. |
| 25 June 2026 | F1.5 | Normal User | - | The subject was able to access normal user functions after account creation. | Success | Standard user privileges are usable after login. |
| 25 June 2026 | F1.6 | Moderator | - | The subject was able to see moderation-related navigation after logging in as a moderator. | Success | Moderator capabilities are discoverable from the interface. |
| 25 June 2026 | F1.7 | Administrator | - | The subject was able to see administrator functions after logging in as an administrator. | Success | Administrator privileges are visible and accessible to the correct actor. |
| 25 June 2026 | F1.8 | Normal User / Staff User | - | The subject observed that staff-only routes were hidden or blocked for normal users and available to staff users. | Success | Staff-only access is clear and protected in the interface. |
| 25 June 2026 | F1.9 | Guest | - | The subject was able to authenticate using email and password on the login page. | Success | Login is usable for returning users. |
| 25 June 2026 | F1.10 | Authenticated User | - | The subject was able to find the logout action and return to unauthenticated state. | Success | Logout is clear and easy to complete. |
| 25 June 2026 | F1.11 | Guest | - | The subject was able to submit username input without needing to manually normalize spacing or case. | Success | Username normalization does not create confusion during registration. |
| 25 June 2026 | F1.12 | Guest | - | The subject received validation feedback when username characters did not meet the allowed format. | Success | Username format restrictions are communicated clearly. |
| 25 June 2026 | F1.13 | Guest | - | The subject received validation feedback for username length constraints. | Success | Username length rules are understandable during registration. |
| 25 June 2026 | F1.14 | Guest / New User | - | The subject was redirected into the authenticated area after successful authentication. | Success | Session creation is visible through immediate access to authenticated pages. |
| 25 June 2026 | F1.15 | Authenticated User | - | The subject was able to remain logged in during normal application navigation until logout or timeout conditions. | Success | Session persistence is usable and does not interrupt normal navigation. |
| 25 June 2026 | F1.16 | Administrator | - | The subject was able to locate session-timeout settings in the system-management interface. | Success | Session-timeout configuration is usable for administrators. |

## 7.3.3 User Management Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F2.1 | Staff User | - | The subject was able to open the user-management page and view registered user profiles and statuses. | Success | User profile listing is usable for staff users. |
| 25 June 2026 | F2.2 | Staff User | - | The subject was able to access the create-user form for creating a Normal User account. | Success | Staff account creation flow is understandable. |
| 25 June 2026 | F2.3 | Administrator | - | The subject was able to locate administrator-only user removal controls. | Success | User removal is visible only to the appropriate actor. |
| 25 June 2026 | F2.4 | Administrator | - | The subject was able to locate and use role assignment controls. | Success | Role management is usable for administrators. |
| 25 June 2026 | F2.5 | Administrator | - | The subject was able to locate the reset-password action for user accounts. | Success | Password reset is discoverable in the user-management interface. |
| 25 June 2026 | F2.6 | Administrator | - | The subject was able to update usernames from the user-management interface. | Success | Username administration is usable for administrators. |
| 25 June 2026 | F2.7 | Staff User | - | The subject was able to enable or disable user access from the user list. | Success | Account status control is clear for staff users. |
| 25 June 2026 | F2.8 | Moderator | - | The subject observed that moderator controls were limited compared with administrator controls. | Success | Moderator restrictions are understandable because unavailable controls are hidden or blocked. |

## 7.3.4 Experiment Configuration Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F3.1 | Normal User | - | The subject was able to start a new experiment and enter experiment metadata. | Success | Experiment record creation is usable through the wizard. |
| 25 June 2026 | F3.2 | Normal User | - | The subject observed that the dataset scope is fixed to BTCUSDT, reducing selection ambiguity. | Success | Fixed dataset scope is clear to the user. |
| 25 June 2026 | F3.3 | Normal User | - | The subject was able to choose a supported interval from the interval selection control. | Success | Interval selection is usable. |
| 25 June 2026 | F3.4 | Normal User | - | The subject was able to specify the experiment start date. | Success | Start-date input is clear in the dataset step. |
| 25 June 2026 | F3.5 | Normal User | - | The subject was able to specify the experiment end date. | Success | End-date input is clear in the dataset step. |
| 25 June 2026 | F3.6 | Normal User | - | The subject was able to enter validation and test split values through the split configuration step. | Success | Split configuration is usable. |
| 25 June 2026 | F3.7 | Normal User | - | The subject received validation feedback when split values did not form a valid total. | Success | Split total validation is understandable. |
| 25 June 2026 | F3.8 | Normal User | - | The subject received clear feedback when the validation split was too small. | Success | Minimum validation split rule is communicated clearly. |
| 25 June 2026 | F3.9 | Normal User | - | The subject received clear feedback when the test split was too small. | Success | Minimum test split rule is communicated clearly. |
| 25 June 2026 | F3.10 | Normal User | - | The subject could see the training split derived from the remaining allocation. | Success | Derived training split is understandable. |
| 25 June 2026 | F3.11 | Normal User | - | The subject was able to choose an accessible approved Blueprint during experiment setup. | Success | Blueprint selection is usable. |
| 25 June 2026 | F3.12 | Normal User | - | The subject was able to configure interval and date-range settings together. | Success | Temporal configuration is clear in the wizard. |
| 25 June 2026 | F3.13 | Normal User | - | The subject was able to view and change experiment-specific parameter overrides. | Success | Parameter overrides are usable, although they require careful review. |
| 25 June 2026 | F3.14 | Normal User | - | The subject could review generated parameter combinations before submission. | Moderate Success | Permutation generation is usable, but users must understand that many combinations can increase execution size. |
| 25 June 2026 | F3.15 | Normal User | - | The subject could understand from the review/result workflow that each parameter variant produces model output. | Moderate Success | Model-per-variant behaviour is understandable after reviewing experiment output. |
| 25 June 2026 | F3.16 | Normal User | - | The subject could open experiment detail and see generated models associated with the experiment. | Success | Relationship between experiment and models is visible in the result interface. |

## 7.3.5 Experiment Execution Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F4.1 | Normal User | - | The subject did not need to control the internal pipeline sequence and could rely on the system workflow. | Success | Pipeline ordering is hidden from the user and does not complicate execution. |
| 25 June 2026 | F4.2 | Normal User | - | The subject was able to submit a validated experiment from the review step. | Success | Experiment submission is usable. |
| 25 June 2026 | F4.3 | Normal User | - | The subject could observe execution state changes from experiment or job detail screens. | Success | State transitions are visible to the user. |
| 25 June 2026 | F4.4 | Normal User | - | The subject could view progress or status information while an experiment was queued or running. | Success | Progress feedback is understandable. |
| 25 June 2026 | F4.5 | Normal User | - | The subject was able to request cancellation for a pending experiment job. | Success | Pending job cancellation is usable. |
| 25 June 2026 | F4.6 | Normal User | - | The subject was able to access cancellation controls for an eligible running job. | Success | Running job cancellation is discoverable when available. |
| 25 June 2026 | F4.7 | Normal User | - | The subject could access confusion metrics logs from completed experiment results. | Success | Confusion metric outputs are available from the result interface. |
| 25 June 2026 | F4.8 | Normal User | - | The subject could access test evaluation metrics after completion. | Success | Evaluation metrics are usable for result inspection. |
| 25 June 2026 | F4.9 | Normal User | - | The subject could retrieve experiment artifacts through the application without managing files manually. | Success | Database-backed artifact access is transparent to the user. |
| 25 June 2026 | F4.10 | Normal User | - | The subject was able to view available results from the browser without handling intermediate files. | Success | Result access is usable without manual file management. |
| 25 June 2026 | F4.11 | Normal User | - | The subject could locate download actions for experiment artifacts. | Success | Artifact downloads are discoverable. |
| 25 June 2026 | F4.12 | Normal User | - | The subject could download confusion metrics logs when available. | Success | Confusion log download is usable. |
| 25 June 2026 | F4.13 | Normal User | - | The subject could access internal backtest log download actions when available. | Success | Backtest log download is usable from result pages. |
| 25 June 2026 | F4.14 | Normal User | - | The subject could inspect aggregated performance metrics in experiment detail. | Success | Aggregated metrics are visible and readable. |

## 7.3.6 Model Output Processing Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F5.1 | Normal User | - | The subject could inspect persisted prediction-related output through model and log views after completion. | Success | Prediction output storage is represented through result views. |
| 25 June 2026 | F5.2 | Normal User | - | The subject could understand that model outputs are transformed into signals through the displayed metrics and logs. | Moderate Success | Signal transformation is available, but users may need documentation to interpret it fully. |
| 25 June 2026 | F5.3 | Normal User | - | The subject could interpret long-position signal behaviour from result documentation and logs. | Moderate Success | Long signal meaning is available but benefits from documentation support. |
| 25 June 2026 | F5.4 | Normal User | - | The subject could interpret flat-position signal behaviour from result documentation and logs. | Moderate Success | Flat signal meaning is available but benefits from documentation support. |
| 25 June 2026 | F5.5 | Normal User | - | The subject did not need to manually enforce repeated-position restrictions during result viewing. | Success | Position-management protection is automatic and does not burden the user. |
| 25 June 2026 | F5.6 | Normal User | - | The subject could view results without configuring unsupported short-selling behaviour. | Success | Long-only evaluation is handled by the system and is usable. |
| 25 June 2026 | F5.7 | Normal User | - | The subject was not presented with short-position controls in the normal workflow. | Success | Unsupported short-position actions are not exposed to the user. |
| 25 June 2026 | F5.8 | Normal User | - | The subject received controlled result output without manually validating position constraints. | Success | Position-management validation is automatic from the user perspective. |

## 7.3.7 Experiment Discovery and Reuse Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F6.1 | Authenticated User | - | The subject could see owner usernames associated with public or listed model records. | Success | Model ownership is visible. |
| 25 June 2026 | F6.2 | Authenticated User | - | The subject could identify the model owner from model listings. | Success | Username display supports model discovery. |
| 25 June 2026 | F6.3 | Authenticated User | - | The subject could use user-related discovery from Public Hub or profile links. | Success | User discovery is usable. |
| 25 June 2026 | F6.4 | Authenticated User | - | The subject could filter or browse models by user context where available. | Success | User-based model browsing is understandable. |
| 25 June 2026 | F6.5 | Normal User | - | The subject could browse Blueprint libraries and open Blueprint details. | Success | Blueprint repository browsing is usable. |
| 25 June 2026 | F6.6 | Authenticated User | - | The subject could open profile views containing activity or artifact summaries. | Success | Profile detail viewing is usable. |
| 25 June 2026 | F6.7 | Normal User | - | The subject could favorite a model from model detail or listing context. | Success | Model favoriting is usable. |
| 25 June 2026 | F6.8 | Normal User | - | The subject could favorite a Blueprint from Blueprint detail or library context. | Success | Blueprint favoriting is usable. |
| 25 June 2026 | F6.9 | Normal User | - | The subject could open the Favorites page and view saved items. | Success | Favorites library is usable. |
| 25 June 2026 | F6.10 | Normal User | - | The subject could understand reuse through model or Blueprint detail actions and experiment setup paths. | Moderate Success | Reuse is possible, but users may need to read labels carefully before starting a new configuration. |

## 7.3.8 Model Catalog and Rankings Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F7.1 | Authenticated User | - | The subject could open model rankings and view models ordered by performance metrics. | Success | Ranking display is usable. |
| 25 June 2026 | F7.2 | Authenticated User | - | The subject could open model detail and inspect metrics, parameters, and experiment context. | Success | Model detail page is usable. |
| 25 June 2026 | F7.3 | Normal User | - | The subject could locate actions or navigation paths for initiating further experiments from model context. | Moderate Success | Experiment initiation from model context is usable but requires users to understand the reuse path. |

## 7.3.9 Favorites Library Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F8.1 | Normal User | - | The subject could open a consolidated Favorites page for saved models and Blueprints. | Success | Favorites overview is usable. |
| 25 June 2026 | F8.2 | Normal User | - | The subject could distinguish saved models from saved Blueprints using the favorites interface. | Success | Favorites segmentation is understandable. |
| 25 June 2026 | F8.3 | Normal User | - | The subject could remove items from favorites and observe the updated state. | Success | Removing favorites is usable. |

## 7.3.10 Server-Side Experiment Execution and Queueing Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F9.1 | Normal User | - | The subject could submit experiment run requests from an authenticated client session. | Success | Authenticated job submission is usable. |
| 25 June 2026 | F9.2 | Normal User | - | The subject could submit an experiment and understand that execution continues asynchronously. | Success | Asynchronous execution is clear from queue/status feedback. |
| 25 June 2026 | F9.3 | Normal User | - | The subject did not need to provide local computing resources after job submission. | Success | Server-side execution is transparent to the user. |
| 25 June 2026 | F9.4 | Normal User | - | The subject could view completed evaluation results from the server-side workflow. | Success | Server-side evaluation output is accessible. |
| 25 June 2026 | F9.5 | Administrator | - | The subject could observe concurrency-related settings or queue controls in system management. | Success | Concurrent job limit visibility is usable for administrators. |
| 25 June 2026 | F9.6 | Administrator | - | The subject could locate administrative controls for job-execution limits. | Success | Concurrency-limit management is usable for administrators. |
| 25 June 2026 | F9.7 | Normal User | - | The subject could view relative queue position or queue status after submission. | Success | Queue position feedback is usable. |
| 25 June 2026 | F9.8 | Normal User | - | The subject could view running job status updates. | Success | Running job status is understandable. |
| 25 June 2026 | F9.9 | Normal User | - | The subject could request cancellation before execution begins. | Success | Pending job cancellation is usable. |
| 25 June 2026 | F9.10 | Normal User | - | The subject could request cancellation for a running job where cancellation is allowed. | Success | Running job cancellation is usable when available. |
| 25 June 2026 | F9.11 | Normal User | - | The subject could inspect job execution state from the job or experiment detail interface. | Success | Job state visibility is usable. |
| 25 June 2026 | F9.12 | Normal User | - | The subject could access result artifacts after successful job completion. | Success | Persisted result access is usable. |
| 25 June 2026 | F9.13 | Normal User | - | The subject could see failed job status and diagnostic information where available. | Success | Failure feedback is usable and avoids silent failure. |
| 25 June 2026 | F9.14 | Normal User | - | The subject could understand retry-related behaviour through controlled job status feedback where applicable. | Moderate Success | Retry handling is mostly internal and may require documentation for full user understanding. |
| 25 June 2026 | F9.15 | Administrator | - | The subject could interpret resource-related execution controls from the system-management screen. | Moderate Success | Resource allocation controls are usable for administrators but require careful configuration. |

## 7.3.11 Administration and System Monitoring Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F10.1 | Administrator | - | The subject could access the administrative system-management dashboard. | Success | Administrative dashboard access is usable. |
| 25 June 2026 | F10.2 | Administrator | - | The subject could inspect system health and data availability indicators from system management. | Success | System health visibility is usable. |
| 25 June 2026 | F10.3 | Administrator | - | The subject could view active job items and their current execution state. | Success | Operational job monitoring is usable. |

## 7.3.12 Blueprint Authoring and Approval Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F11.1 | Normal User | - | The subject could create a Blueprint with indicator selections and architecture parameters. | Success | Blueprint creation is usable. |
| 25 June 2026 | F11.2 | Normal User | - | The subject could define configurable parameter ranges for selected indicators. | Success | Indicator range input is usable. |
| 25 June 2026 | F11.3 | Normal User | - | The subject could define feature-related parameter settings in the Blueprint workflow. | Success | Feature configuration is usable. |
| 25 June 2026 | F11.4 | Normal User | - | The subject could configure reference architecture hyperparameter ranges. | Success | Architecture parameter configuration is usable. |
| 25 June 2026 | F11.5 | Normal User | - | The subject could edit drafts and observe version-aware behaviour after review-related states. | Moderate Success | Versioning is usable but requires users to understand reviewed artifacts are preserved. |
| 25 June 2026 | F11.6 | Normal User | - | The subject could identify that non-administrator Blueprints must be submitted for approval. | Success | Approval requirement is visible to normal users. |
| 25 June 2026 | F11.7 | Normal User | - | The subject could request approval and observe the Blueprint moving to pending status. | Success | Approval request flow is usable. |
| 25 June 2026 | F11.8 | Moderator / Administrator | - | The subject could approve a pending Blueprint from the moderation interface. | Success | Blueprint approval is usable for staff actors. |
| 25 June 2026 | F11.9 | Moderator / Administrator | - | The subject could reject a pending Blueprint from the moderation interface. | Success | Blueprint rejection is usable for staff actors. |
| 25 June 2026 | F11.10 | Moderator / Administrator | - | The subject could disapprove an approved Blueprint and trigger an editable remediation state. | Moderate Success | Disapproval workflow is usable but users must understand the remediation state. |
| 25 June 2026 | F11.11 | Normal User | - | The subject could see their own Blueprints regardless of approval state. | Success | Owner Blueprint visibility is usable. |
| 25 June 2026 | F11.12 | Staff User | - | The subject could see staff-visible Blueprint states in moderation or library views. | Success | Staff Blueprint visibility is usable. |
| 25 June 2026 | F11.13 | Authenticated User | - | The subject could see only approved Blueprints in public selection contexts. | Success | Public Blueprint visibility is clear. |
| 25 June 2026 | F11.14 | Normal User | - | The subject could save Blueprint specifications through the structured wizard. | Success | Structured Blueprint persistence is usable. |
| 25 June 2026 | F11.15 | Normal User | - | The subject could select a Blueprint during experiment submission without manually compiling it. | Success | Blueprint compilation is automatic and does not burden the user. |
| 25 June 2026 | F11.16 | Normal User | - | The subject could inject experiment-specific interval and split values through the experiment wizard. | Success | Experiment-specific parameter injection is usable. |
| 25 June 2026 | F11.17 | Normal User / Staff User | - | The subject could inspect version and lineage cues where shown in Blueprint detail. | Moderate Success | Version lineage is available but requires careful reading by the user. |

## 7.3.13 Documentation Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F12.1 | Guest / Authenticated User | - | The subject could open the documentation page and read rendered Markdown content. | Success | Documentation viewer is usable and readable. |

## 7.3.14 Public Hub Visibility Usability

| Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| 25 June 2026 | F13.1 | Authenticated User | - | The subject could browse completed experiments through the Public Hub. | Success | Completed experiment discovery is usable. |
| 25 June 2026 | F13.2 | Guest / Authenticated User | - | The subject observed that Public Hub access requires authentication. | Success | Public Hub access restriction is clear. |
| 25 June 2026 | F13.3 | Authenticated User | - | The subject could browse enabled user accounts in the Public Hub Users tab. | Success | Public user browsing is usable. |
| 25 June 2026 | F13.4 | Authenticated User | - | The subject could browse completed experiments in the Public Hub Experiments tab. | Success | Public experiment browsing is usable. |
| 25 June 2026 | F13.5 | Authenticated User | - | The subject could browse models from successful experiments in the Public Hub Models tab. | Success | Public model browsing is usable. |
| 25 June 2026 | F13.6 | Authenticated User | - | The subject could browse approved Blueprints in the Public Hub Blueprints tab. | Success | Public Blueprint browsing is usable. |

## 7.3.15 Usability Testing Summary

The usability testing results show that the system is generally usable for its intended actor roles. Guests can register and log in, authenticated users can access research workflows, normal users can create Blueprints and experiments, moderators can perform moderation-related actions, and administrators can access user-management and system-management features. The interface provides clear navigation, validation feedback, protected-route behavior, status indicators, and result-display screens for the main workflows.

Most requirements were marked as `Success` because the subject could complete the required task through the interface without assistance. A small number of requirements were marked as `Moderate Success` because the function is usable but conceptually more complex, such as parameter permutation generation, model-signal interpretation, retry/resource behavior, Blueprint version lineage, and model reuse. These areas can be improved through clearer inline explanations, tooltips, and documentation links.
