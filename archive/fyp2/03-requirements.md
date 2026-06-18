## Chapter 3: Requirements

### 3.1 Overview

This chapter defines the complete set of functional, non-functional, and external interface requirements for the Bitcoin Experimental Engine (BEE) framework. Requirements are expressed as atomic, testable statements that specify system behavior, constraints, and integration points necessary to deliver a research framework for Bitcoin-pair quantitative experimentation.

### 3.2 Functional Requirements

This section defines atomic, testable system behaviors necessary to deliver an academic prototype supporting reproducible Bitcoin-pair research workflows. Each requirement specifies a single verifiable capability without implementation details.

#### 3.2.1 User Authentication and Authorization

- **F1.1** The system shall allow users to register an account us-ing a valid email address.
- **F1.2** The system shall store password credentials using cryptographic hashing before persistence.
- **F1.3** The system shall allow users to define a unique username for their account.
- **F1.4** The system shall prevent registration when a username already exists in the user registry.
- **F1.5** The system shall support a Normal User role with standard privileges.
- **F1.6** The system shall support a Moderator role with content moderation capabilities.
- **F1.7** The system shall support an Administrator role with full system management privileges.
- **F1.8** The system shall restrict staff-only operations to authenticated Administrator or Moderator accounts.
- **F1.9** The system shall authenticate users through email and password verification.
- **F1.10** The system shall terminate active sessions upon user logout request.
- **F1.11** The system shall normalize usernames by trimming whitespace and converting characters to lowercase prior to validation.
- **F1.12** The system shall restrict usernames to lowercase alphanumeric characters only.
- **F1.13** The system shall enforce a username length constraint between six and twelve characters inclusive.
- **F1.14** The system shall establish an authenticated session upon successful authentication.
- **F1.15** The system shall maintain authenticated sessions until explicit logout, system restart, or configured inactivity timeout duration.
- **F1.16** The system shall allow Administrators to configure session timeout duration between one minute and twenty four hours, with zero representing indefinite session persistence.

#### 3.2.2 User Management

- **F2.1** The system shall allow staff accounts to view registered user profiles and status information.
- **F2.2** The system shall allow staff accounts to create new Normal User accounts.
- **F2.3** The system shall allow Administrators to permanently remove user accounts from the system.
- **F2.4** The system shall allow Administrators to modify user role assignments.
- **F2.5** The system shall allow Administrators to reset user passwords.
- **F2.6** The system shall allow Administrators to update usernames for existing accounts.
- **F2.7** The system shall allow staff accounts to enable or disable user account access.
- **F2.8** The system shall restrict Moderators to creating Normal users and managing their account status only.

#### 3.2.3 Experiment Configuration

- **F3.1** The system shall allow users to create persistent experiment records with metadata.
- **F3.2** The system shall fix the experiment dataset source to BTCUSDT spot market data only.
- **F3.3** The system shall allow users to select data intervals from the discrete set {1m, 5m, 15m, 30m, 1h, 2h, 4h, 1d}.
- **F3.4** The system shall allow users to specify a start date for experiment data retrieval.
- **F3.5** The system shall allow users to specify an end date for experiment data retrieval.
- **F3.6** The system shall allow users to define proportional allocations for train, validation, and test data splits.
- **F3.7** The system shall enforce that train, validation, and test splits sum to exactly one hundred percent.
- **F3.8** The system shall enforce a minimum allocation of ten percent for the validation split.
- **F3.9** The system shall enforce a minimum allocation of ten percent for the test split.
- **F3.10** The system shall enforce that the training split allocation is derived as the remainder.
- **F3.11** The system shall allow users to select an accessible Blueprint for experiment execution.
- **F3.12** The system shall allow users to configure temporal parameters including interval selection and date range specification.
- **F3.13** The system shall allow users to override parameter ranges defined in a selected Blueprint for the current experiment run only.
- **F3.14** The system shall generate exhaustive combinatorial permutations from all configurable parameter ranges within the selected Blueprint.
- **F3.15** The system shall produce exactly one trained model artifact per parameter permutation variant.
- **F3.16** The system shall maintain referential integrity between generated models and their parent experiment record.

#### 3.2.4 Experiment Execution

- **F4.1** The system shall enforce an immutable pipeline execution sequence with strict temporal integrity: raw data loading, chronological train/validation/test splitting, per-split indicator computation, target transformation, feature scaling, model training, and test set evaluation, thereby preventing look-ahead bias.
- **F4.2** The system shall initiate experiment execution upon user submission of a validated configuration.
- **F4.3** The system shall persist experiment execution state transitions in persistent storage.
- **F4.4** The system shall provide real-time progress updates to users during experiment execution.
- **F4.5** The system shall cancel pending experiment requests upon explicit user cancellation request.
- **F4.6** The system shall terminate running experiment jobs upon explicit user cancellation request.
- **F4.7** The system shall generate a permutation-level confusion metrics log for each completed experiment run.
- **F4.8** The system shall generate a test set evaluation metrics log for each completed experiment run.
- **F4.9** The system shall treat the relational database as the authoritative source for all experiment artifacts.
- **F4.10** The system shall ensure experiment artifacts remain accessible without requiring persistent intermediate file storage.
- **F4.11** The system shall provide user-initiated download capability for experiment artifacts in standard CSV format.
- **F4.12** The system shall provide user-initiated download capability for confusion metrics logs.
- **F4.13** The system shall provide user-initiated download capability for internal backtest logs.
- **F4.14** The system shall display aggregated performance metrics across all models within an experiment.

#### 3.2.5 Model Output Processing

- **F5.1** The system shall persist raw prediction values produced by trained models.
- **F5.2** The system shall transform model outputs into binary trading signals using a configurable threshold parameter.
- **F5.3** The system shall interpret a binary signal value of one as an instruction to enter a long position.
- **F5.4** The system shall interpret a binary signal value of zero as an instruction to maintain a flat position.
- **F5.5** The system shall reject new long position signals while an existing position remains active during test set evaluation.
- **F5.6** The system shall enforce long-only position management during test set evaluation.
- **F5.7** The system shall reject short position signals during test set evaluation.
- **F5.8** The system shall validate position management constraints before test set evaluation.

#### 3.2.6 Experiment Discovery and Reuse

- **F6.1** The system shall associate each model artifact with the username of its originating user.
- **F6.2** The system shall display the owner's username along-side model listings.
- **F6.3** The system shall provide username-based search functionality for user discovery.
- **F6.4** The system shall provide filtering capability to display models by specific username.
- **F6.5** The system shall provide browsing interfaces for Blueprint repositories.
- **F6.6** The system shall provide detailed user profile views containing activity summaries.
- **F6.7** The system shall allow users to mark models as favorites for quick retrieval.
- **F6.8** The system shall allow users to mark Blueprints as favorites for quick retrieval.
- **F6.9** The system shall provide a dedicated interface for viewing a user's saved favorites.
- **F6.10** The system shall enable reuse of model snapshots from completed experiments within new experiment configurations.

#### 3.2.7 Model Catalog and Rankings

- **F7.1** The system shall display models ranked by configurable performance metrics.
- **F7.2** The system shall provide detailed views containing model metrics, parameters, and training configuration.
- **F7.3** The system shall provide direct initiation of new experiments from the model detail interface.

#### 3.2.8 Favorites Library

- **F8.1** The system shall provide a consolidated view of a user's favorited models and Blueprints.
- **F8.2** The system shall provide filtering capability to segment favorites by target type.
- **F8.3** The system shall allow users to remove items from their favorites collection.

#### 3.2.9 Server-Side Experiment Execution and Queueing

- **F9.1** The system shall accept experiment run requests from authenticated client devices.
- **F9.2** The system shall accept experiment requests for asynchronous server-side execution.
- **F9.3** The system shall execute experiment runs using dedicated server-side computational resources.
- **F9.4** The system shall execute test set evaluations using dedicated server-side computational resources.
- **F9.5** The system shall enforce configurable limits on concurrently executing jobs.
- **F9.6** The system shall allow Administrators to modify concurrency limits for job execution.
- **F9.7** The system shall display the relative position of submitted jobs awaiting execution.
- **F9.8** The system shall provide status updates for running jobs.
- **F9.9** The system shall allow users to cancel pending experiment requests before execution begins.
- **F9.10** The system shall allow users to cancel running experiment jobs with graceful termination.
- **F9.11** The system shall maintain job execution state with real-time updates.
- **F9.12** The system shall persist job results and artifacts upon successful completion.
- **F9.13** The system shall capture and log job execution errors with diagnostic information for failed jobs.
- **F9.14** The system shall support retry handling for transient job failures.
- **F9.15** The system shall support differentiated resource allocation for job execution.

#### 3.2.10 Administration & System Monitoring

- **F10.1** The system shall provide an administrative dashboard interface for system oversight.
- **F10.2** The system shall display indicators of system health and data availability status.
- **F10.3** The system shall display active job items with their current execution state.

#### 3.2.11 Blueprint Authoring and Approval

- **F11.1** The system shall allow users to create Blueprints containing indicator selections, and reference architecture parameters.
- **F11.2** The system shall allow users to define configurable parameter ranges for each selected indicator within a Blueprint.
- **F11.3** The system shall allow users to define configurable parameter ranges for each selected feature within a Blueprint.
- **F11.4** The system shall allow users to define configurable parameter ranges for reference architecture hyperparameters within a Blueprint.
- **F11.5** The system shall preserve original Blueprint records as immutable artifacts and create new versioned copies upon owner modification after first submission for approval, while allowing in-place mutation during initial DRAFT development prior to submission.
- **F11.6** The system shall require non-administrator users to submit Blueprints for approval prior to public visibility.
- **F11.7** The system shall transition user-owned Blueprints from DRAFT to PENDING state upon approval request submission.
- **F11.8** The system shall allow Moderators and Administrators to transition PENDING Blueprints to APPROVED state.
- **F11.9** The system shall allow Moderators and Administrators to transition PENDING Blueprints to REJECTED state.
- **F11.10** The system shall allow Moderators and Administrators to transition APPROVED Blueprints to REJECTED state and automatically generate a new editable DRAFT version for owner remediation.
- **F11.11** The system shall grant owners visibility to all their Blueprints regardless of approval state.
- **F11.12** The system shall grant staff accounts visibility to Blueprints in PENDING, APPROVED, or REJECTED states only.
- **F11.13** The system shall grant public visibility exclusively to APPROVED Blueprints.
- **F11.14** The system shall persist Blueprints as structured documents containing complete pipeline specifications.
- **F11.15** The system shall compile Blueprint definitions into executable experiment manifests during job submission.
- **F11.16** The system shall inject experiment-specific parameters including interval and split ratios into the compiled manifest.
- **F11.17** The system shall maintain version lineage for Blueprints through sequential version numbering, parent references, and original artifact anchoring.

#### 3.2.12 Documentation

- **F12.1** The system shall provide a documentation viewer capable of rendering Markdown-formatted content.

#### 3.2.13 Public Hub Visibility

- **F13.1** The system shall grant authenticated users visibility to all successfully completed experiments by default.
- **F13.2** The system shall restrict Public Hub access to authenticated users only.
- **F13.3** The system shall display only enabled user accounts within the Public Hub Users tab.
- **F13.4** The system shall display only successfully completed experiments within the Public Hub Experiments tab.
- **F13.5** The system shall display only models derived from successful experiments within the Public Hub Models tab.
- **F13.6** The system shall display only APPROVED Blueprints within the Public Hub Blueprints tab.

### 3.3 Non-Functional Requirements

This section defines quality attributes governing system behavior beyond core functionality. These requirements ensure the Bitcoin Experimental Engine (BEE) delivers robust performance, security, reliability, and usability essential for quantitative research workflows. All requirements are implementation-agnostic and verifiable through defined acceptance criteria.

#### 3.3.1 Performance Requirements

- **N1.1** The system shall provide a responsive user experience where configuration and navigation operations complete without perceptible delay (<1 second), and long-running experiment executions provide immediate acknowledgment with asynchronous status updates.
- **N1.2** The system shall ingest new market data within a bounded temporal window relative to source availability.
- **N1.3** The system shall process authentication requests with response times under five hundred milliseconds under normal load.
- **N1.4** The system shall acknowledge job requests within one hundred milliseconds of submission.
- **N1.5** The system shall provide job position feedback with response times under two hundred milliseconds.
- **N1.6** The system shall support concurrent execution of up to ten experiment jobs without performance degradation.

#### 3.3.2 Reliability and Availability Requirements

- **N2.1** The system shall recover from data ingestion failure without loss of previously ingested data.
- **N2.2** The system shall preserve experiment execution state across system restart events.
- **N2.3** The system shall ensure ninety-nine point five percent availability of the job processing subsystem during operational hours.
- **N2.4** The system shall preserve pending job requests across system restarts.
- **N2.5** The system shall recover from unexpected job execution interruptions without losing submitted requests.
- **N2.6** The system shall maintain job execution state consistency across system restarts.

#### 3.3.3 Security Requirements

- **N3.1** The system shall store user passwords using cryptographic hashing algorithms with salting.
- **N3.2** The system shall enforce role-based access control for all protected resources.
- **N3.3** The system shall construct all database queries using parameterized statements exclusively.
- **N3.4** The system shall prohibit string interpolation in query construction pathways.
- **N3.5** The system shall maintain authenticated session state with configurable lifetime ranging from one minute to twenty-four hours or indefinite persistence when timeout is disabled.
- **N3.6** The system shall enforce session expiration based on administrator-configured timeout settings.
- **N3.7** The system shall protect session identifiers using secure transmission and storage controls.
- **N3.8** The system shall enforce CSRF protection tokens for all state-changing operations.

#### 3.3.4 Data Integrity and Consistency Requirements

- **N4.1** The system shall prevent duplicate ingestion of identical market data records.
- **N4.2** The system shall produce identical outputs when presented with identical inputs and configuration.
- **N4.3** The system shall enforce transaction isolation for critical write operations including experiment creation and state transitions.
- **N4.4** The system shall produce bit-for-bit identical outputs when presented with identical inputs, configuration parameters, and execution environment, enforced through fixed random seeds for all stochastic operations.

#### 3.3.5 Usability and Accessibility Requirements

- **N5.1** The system shall support both light and dark theme presentation modes.
- **N5.2** The system shall provide functional user interfaces on desktop-class web browsers.
- **N5.3** The system shall provide functional user interfaces on tablet-class web browsers.
- **N5.4** The system shall adapt layout presentation appropriately across varying screen dimensions.

#### 3.3.6 Maintainability and Testability Requirements

- **N6.1** The system shall include automated test coverage for critical computational and security components.

### 3.4 Summary

This chapter has established a comprehensive requirements baseline
comprising 120 atomic functional requirements and 25 non-functional requirements. Each requirement is expressed as a single, testable statement that defines specific system behavior, constraints, or integration points. These requirements collectively form the foundation for subsequent analysis, design, and validation activities throughout the development lifecycle. The requirements specification provides unambiguous criteria against which system implementation and acceptance testing will be measured.
