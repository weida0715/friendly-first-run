# 6.9 Challenges Encountered and Solutions

This section describes the main challenges encountered during implementation and the solutions applied. The challenges were not only interface-related; many of them came from coordinating a full-stack system that includes authentication, role-based access, blueprint versioning, experiment compilation, queue-based execution, market-data caching, model output storage, logs, and administrative monitoring.

The completed implementation solves these issues by separating responsibilities across frontend views, backend controllers, validators, services, repositories, worker processes, and reusable strategy components. This section explains the implementation difficulties, their impact, the solution applied, and the evidence that can be included in the final report.

## 6.9.1 Summary of Challenges Encountered

The implementation challenges can be grouped into workflow challenges, data integrity challenges, integration challenges, and usability challenges. Workflow challenges appeared when long-running experiments had to be executed without blocking the web interface. Data integrity challenges appeared when experiment configurations, blueprint edits, market candles, model outputs, and logs had to remain consistent. Integration challenges appeared when frontend views, backend APIs, PostgreSQL, Redis, and worker processes had to communicate correctly. Usability challenges appeared when users needed clear validation messages and visible job progress.

**Table 6.62: Implementation Challenges Encountered**

| No. | Challenge | Affected Area | Cause | Impact |
| --- | --- | --- | --- | --- |
| 1 | Long-running experiments could block web requests | Experiment submission, queue, worker, model execution | Experiment execution includes data loading, splitting, feature generation, model training, evaluation, backtesting, and log persistence | If executed synchronously, users would wait too long and normal API responsiveness could decrease |
| 2 | Blueprint edits could affect reproducibility | Blueprint module and experiment module | Blueprints are reusable and editable, while experiments must preserve the exact configuration used at submission time | Previous experiment results could become ambiguous if a later blueprint edit changed their meaning |
| 3 | Experiment configuration has many dependent validation rules | Experiment wizard, backend validator, compiler | Date range, interval, split ratios, blueprint accessibility, parameter overrides, deterministic settings, and permutation counts must align | Invalid experiments could enter the queue and fail later during execution |
| 4 | Market-data refresh could create duplicate or incomplete candles | Market-data service, charting, executor data loading | Repeated refreshes and external candle retrieval need timestamp normalization and cache reconciliation | Charts and experiments could use inconsistent or duplicated BTCUSDT data |
| 5 | Frontend authentication state had to remain consistent with backend sessions | Authentication, frontend guards, API client | Browser refreshes clear frontend state while the backend session may still be valid | Protected pages could render incorrectly or redirect unnecessarily |
| 6 | Role restrictions had to be enforced beyond hidden navigation | RBAC, moderation, user management, system management | Users may call backend endpoints directly even when frontend navigation is hidden | Staff and administrator functions could be exposed if only frontend checks were used |
| 7 | The project grew into many modules | Full-stack structure | Controllers, services, repositories, validators, workers, strategies, and views all expanded during implementation | Code could become tightly coupled and difficult to maintain |
| 8 | Users needed useful error feedback | Forms, API client, backend responses | Validation and runtime failures can happen across different layers | Generic failures would make it difficult for users to correct submissions |
| 9 | Queue and worker status had to remain visible | Jobs, experiments, system management | Background execution happens outside the request-response cycle | Users and administrators could lose visibility into queued, running, completed, cancelled, or failed work |
| 10 | Model and log outputs had to stay linked to the correct parameter set | Experiment executor, model repository, experiment log repository | One experiment can generate multiple model permutations and logs | Rankings and downloads could become misleading without stable parameter identifiers |

## 6.9.2 Challenge 1: Long-Running Experiment Execution

The first major challenge was preventing experiment execution from blocking normal web requests. Experiment execution is computationally heavier than a typical CRUD operation. It involves loading BTCUSDT candles, materializing the selected interval, validating the range, splitting data chronologically, computing indicators, generating targets, scaling features, training model permutations, evaluating predictions, running backtest logic, saving model metrics, and saving logs.

Running this process directly inside `POST /api/experiments` would make the request take too long. A user could be left waiting for a response while the backend performs model training. It could also reduce responsiveness for other users because the web server would be occupied with computation instead of handling normal API requests.

The solution was to separate experiment submission from experiment execution. The backend experiment controller validates the request, compiles the experiment snapshots, stores the experiment as queued, creates model placeholder rows, and enqueues a job. A separate worker process consumes the job and performs execution. The frontend receives queue metadata immediately and can show the user that the experiment has been accepted.

```text
PROCEDURE Submit Experiment Without Blocking User Interface
  RECEIVE experiment creation request
  AUTHENTICATE user
  VALIDATE experiment payload and selected blueprint access
  COMPILE blueprint and experiment snapshots
  SAVE experiment with Queued status
  CREATE model placeholder rows for selected parameter hashes
  ENQUEUE experiment execution job
  RETURN experiment id, detail path, and queue metadata

  WORKER later receives queued job
  WORKER marks experiment as Running
  WORKER executes experiment pipeline
  WORKER marks experiment as Completed, Failed, or Cancelled
ENDPROCEDURE
```

**Table 6.63: Solution for Long-Running Experiment Execution**

| Area | Solution Implemented |
| --- | --- |
| API responsiveness | Experiment submission returns after queueing rather than waiting for full execution |
| Background execution | Worker process consumes queued experiment jobs |
| Progress visibility | Worker updates experiment progress and current stage |
| Failure handling | Worker marks experiment as failed and stores diagnostic stage information |
| User feedback | Experiment and job detail views can show queued, running, completed, failed, or cancelled state |

> Note: Add screenshots of an experiment submitted with queued status and a job detail page showing running or completed status.

## 6.9.3 Challenge 2: Preserving Reproducibility with Editable Blueprints

Blueprints are reusable templates, but they can also be improved by users over time. This created a reproducibility challenge. If experiments only referenced the current blueprint record, then an edited blueprint could change the meaning of previously executed experiments. This would make it difficult to explain what configuration produced a model or log artifact.

The solution was to combine blueprint versioning with compiled snapshots. Blueprint editing uses version-aware behavior so that reviewed or previously submitted definitions are not silently overwritten. Experiment creation then compiles the selected blueprint and experiment-specific settings into immutable snapshots. These snapshots are stored on the experiment record and used by the worker later.

The compiler also generates stable parameter hashes from parameter payloads. This supports consistent linking between selected permutations, model placeholder records, generated model metrics, logs, and rankings.

```text
PROCEDURE Preserve Experiment Reproducibility
  USER selects approved blueprint for experiment
  BACKEND loads blueprint record and version
  BACKEND deep-copies blueprint architecture, indicators, features, and approval state
  BACKEND applies experiment overrides
  BACKEND generates parameter permutations
  BACKEND computes stable hash for each permutation
  BACKEND stores compiled blueprint snapshot and compiled experiment snapshot
  WORKER executes stored snapshots instead of mutable form state
ENDPROCEDURE
```

**Table 6.64: Reproducibility Solution**

| Problem | Solution |
| --- | --- |
| Blueprint content may change later | Version-aware blueprint editing prevents silent overwrites of reviewed artifacts |
| Experiment must preserve selected configuration | Compiled blueprint and experiment snapshots are stored with the experiment |
| Multiple parameter sets need stable identity | Stable parameter hashes link model rows and logs to exact parameter payloads |
| Worker may execute after the user leaves the page | Worker loads persisted experiment snapshots from the database |
| Result inspection must show context | Experiment detail can display stored configuration, blueprint snapshot, models, and logs |

## 6.9.4 Challenge 3: Validating Complex Experiment Configuration

Experiment configuration contains several fields that depend on each other. The user must select the BTCUSDT scope, interval, date range or candle amount, train-validation-test splits, approved blueprint, target strategy, deterministic setting, seed, requested permutation count, and parameter overrides. These fields cannot be validated independently only at the frontend.

The backend validator is therefore required before persistence and queue submission. The experiment validator checks the submitted payload, actor access, blueprint availability, split rules, date and interval assumptions, and override structure. The compiler then performs a second layer of protection by validating parameter constraints during compilation.

This approach prevents invalid jobs from entering the queue. It also gives users earlier feedback. When validation fails, the backend returns structured errors that the frontend can display instead of allowing the worker to fail later with a less understandable execution error.

```text
PROCEDURE Validate Experiment Before Queueing
  RECEIVE experiment payload
  VERIFY authenticated actor exists
  VERIFY selected blueprint exists and is accessible
  VALIDATE symbol, interval, date range, and split values
  VALIDATE validation and test split minimums
  VALIDATE parameter override structure
  IF validation errors exist THEN
    RETURN validation error response
  ENDIF

  COMPILE experiment plan
  IF compilation errors exist THEN
    RETURN compilation validation response
  ENDIF

  ALLOW experiment persistence and queue submission
ENDPROCEDURE
```

**Table 6.65: Experiment Validation Solution**

| Validation Issue | Solution Implemented |
| --- | --- |
| Missing or invalid dates | Backend parses and validates experiment date fields before persistence |
| Invalid split ratios | Backend validator and database constraints protect split correctness |
| Inaccessible blueprint | Validator checks actor access before allowing the experiment |
| Malformed overrides | Compiler validates override keys, fixed values, allowed values, and ranges |
| Too many permutations | Runtime setting limits requested permutation count |
| Invalid queued work | Experiment is only queued after validation and compilation succeed |

> Note: Add a screenshot of an experiment wizard validation error, such as invalid split values or missing blueprint selection.

## 6.9.5 Challenge 4: Market-Data Availability and Duplicate Candle Handling

The system depends on BTCUSDT candle data for charts and experiment execution. This created two related challenges. First, the local database must contain enough candles for the requested experiment range. Second, repeated refreshes must not create duplicate records or inconsistent candle data.

The solution was to centralize market-data refresh behavior in the market-data service and repository. The service normalizes datetimes to UTC, validates refresh ranges, fetches candles from the configured provider, and then persists them through an upsert operation. Cached candle timestamps can also be scanned to discover missing ranges.

This means the chart and executor can use locally persisted candle data instead of fetching directly from the provider during every operation. It also means repeated refreshes can update existing candles instead of duplicating them.

```text
PROCEDURE Refresh Market Data Safely
  RECEIVE requested start and end datetime
  NORMALIZE datetimes to UTC
  IF start is not earlier than end THEN
    RETURN range error
  ENDIF
  FETCH BTCUSDT candles from configured provider
  OPEN unit of work
    UPSERT candles by timestamp
    RECORD inserted and updated counts
  CLOSE unit of work
  RETURN refresh summary
ENDPROCEDURE
```

```text
PROCEDURE Discover Missing Market Data Ranges
  NORMALIZE requested range to UTC
  SCAN cached candle timestamps in time chunks
  COMPARE expected one-minute sequence against cached timestamps
  CREATE missing ranges when timestamp gaps are found
  MERGE adjacent missing ranges
  RETURN missing ranges and cached count
ENDPROCEDURE
```

**Table 6.66: Market-Data Solution**

| Problem | Solution Implemented |
| --- | --- |
| Duplicate candles after repeated refresh | Upsert behavior keyed by timestamp |
| Inconsistent time handling | UTC normalization in market-data service |
| Missing data for experiment execution | Cache metadata and missing-range discovery |
| Slow or unreliable live dependency during execution | Experiments load persisted candles from database |
| Chart empty or outdated data | Market-data endpoints provide metadata and cache refresh support |

## 6.9.6 Challenge 5: Authentication State and Session Restoration

The frontend authentication state can be lost when the browser refreshes. However, the backend session may still be valid. This created a challenge: protected pages should not immediately assume the user is logged out just because frontend state was reset.

The solution was to implement a frontend authentication provider that calls the current-user endpoint during application loading. The backend resolves the server-managed session from the browser cookie and returns the safe user object if the session is valid. Frontend guards then use this restored state to allow or block protected routes.

Backend access control remains the final authority. Even if a frontend page accidentally renders a restricted control, protected API endpoints still resolve the authenticated context and enforce role checks before performing the operation.

**Table 6.67: Authentication State Solution**

| Problem | Solution Implemented |
| --- | --- |
| Browser refresh clears frontend state | Authentication provider calls current-user endpoint |
| Backend session may still be valid | Server-managed session is resolved from cookie |
| Protected pages need loading behavior | Frontend guards wait for auth loading state |
| Disabled users should not keep old sessions | Access-control service destroys invalid sessions for disabled or missing users |
| Frontend checks alone are insufficient | Backend checks remain authoritative for protected endpoints |

```text
PROCEDURE Restore Authentication After Refresh
  FRONTEND application loads
  FRONTEND calls current-user endpoint with browser credentials
  BACKEND resolves session cookie
  IF session is valid and user is enabled THEN
    BACKEND returns safe user object
    FRONTEND stores authenticated user state
  ELSE
    FRONTEND treats user as unauthenticated
  ENDIF
  ROUTE guards render, redirect, or block pages based on restored state
ENDPROCEDURE
```

## 6.9.7 Challenge 6: Consistent Role-Based Restrictions

Role restrictions must protect moderator and administrator functions. Hiding navigation links in the frontend is useful, but it is not enough. A user could still manually call an endpoint or navigate directly to a protected route.

The solution was to implement role checks in both frontend and backend layers. The frontend route guards improve navigation behavior and prevent normal users from seeing staff pages. The backend access-control service resolves authenticated context, normalizes role values, ranks roles, and enforces access at the endpoint level. This means the backend rejects unauthorized requests even if they are sent manually.

**Table 6.68: RBAC Solution**

| Problem | Solution Implemented |
| --- | --- |
| UI hiding alone is not secure | Backend access-control checks protect actual operations |
| Role names may vary in spelling | Role normalization converts role values to User, Moderator, or Admin |
| Staff abilities differ | Role ranking separates User, Moderator, and Admin scopes |
| Direct URL access could reveal pages | Frontend route guards redirect insufficient-role users |
| User-management needs finer rules | Access-control service checks whether an actor can manage a target user |

```text
PROCEDURE Protect Role-Restricted Feature
  FRONTEND guard checks current user role before rendering page
  IF role is insufficient THEN
    REDIRECT to fallback page
  ENDIF

  BACKEND endpoint receives request
  BACKEND resolves authenticated actor from session
  BACKEND compares actor role against required role
  IF role is insufficient THEN
    RETURN forbidden response
  ENDIF
  EXECUTE protected action
ENDPROCEDURE
```

## 6.9.8 Challenge 7: Maintaining Codebase Structure as Features Grew

As implementation progressed, the project expanded into many feature areas: authentication, users, blueprints, experiments, jobs, market data, models, logs, public hub, documentation, system management, and worker execution. Without clear boundaries, controllers could become too large, frontend views could duplicate logic, and database operations could become scattered.

The solution was to maintain a layered structure. Controllers handle HTTP requests. Services coordinate workflows. Validators enforce input rules. Repositories handle database access. The unit-of-work boundary coordinates transactions. Executors and strategies handle experiment execution behavior. Frontend views handle screen behavior, while reusable components handle layout, forms, charts, tables, and UI states.

This structure reduces coupling and makes the system easier to explain, test, and extend. For example, the experiment controller does not directly train models. It validates and queues work. The worker and executor are responsible for execution.

**Table 6.69: Codebase Structure Solution**

| Layer | Responsibility |
| --- | --- |
| Frontend views | Page-level workflow and user interaction |
| Frontend API client | Request construction, CSRF token handling, response parsing, and error conversion |
| Backend controllers | HTTP request handling and response shaping |
| Validators | Payload and business-rule validation before persistence |
| Services | Workflow coordination and integration with infrastructure |
| Repositories | Database access through focused persistence methods |
| Unit of work | Transaction commit and rollback boundary |
| Worker | Background job handling |
| Executors and strategies | Experiment execution, data processing, modeling, metrics, and logs |

## 6.9.9 Challenge 8: Providing Useful Error Feedback

A full-stack system can fail in many different ways. A form can be invalid, a session can expire, a role can be insufficient, queue infrastructure can be unavailable, market data can be missing, or experiment execution can fail. If all failures are reported as generic errors, users cannot understand what they should do next.

The solution was to standardize JSON response helpers for success, error, and validation responses. The frontend API client parses backend responses and raises typed API errors. Views can then show validation feedback, restricted-access messages, empty states, or operational error messages.

For background execution, the worker marks failed experiments and stores a shortened diagnostic stage. This allows the frontend to show that an experiment failed rather than leaving it in an unclear running state.

```text
PROCEDURE Show Useful Error Feedback
  FRONTEND sends request through API client
  BACKEND validates request and operation
  IF backend detects validation problem THEN
    RETURN structured validation response with field errors
  ELSE IF backend detects authentication or role problem THEN
    RETURN structured access error
  ELSE IF queue or worker fails THEN
    RETURN or store operational error state
  ENDIF

  FRONTEND parses error response
  FRONTEND displays field, form, page, or job status feedback
ENDPROCEDURE
```

**Table 6.70: Error Feedback Solution**

| Error Source | Solution Implemented |
| --- | --- |
| Validation failure | Field-level validation response shape |
| Authentication failure | Standard unauthenticated response and frontend redirect behavior |
| Authorization failure | Standard forbidden response and frontend restricted route behavior |
| Queue unavailable | Queue-specific error response during experiment creation |
| Worker failure | Experiment marked failed with diagnostic stage message |
| API network issue | Frontend API client converts failures into typed API errors |

## 6.9.10 Challenge 9: Keeping Background Job Status Visible

After experiment submission, execution happens outside the original API request. This means users need a way to track what happened after submission. Without job and experiment status visibility, the system would feel unresponsive even if the worker were functioning correctly.

The solution was to store experiment status, progress, current stage, ETA field, job id, success flag, and completion timestamp. The worker updates progress through a callback and marks final state. Job and experiment APIs expose this information to the frontend. The user can inspect job detail, experiment detail, and system management views to understand execution state.

**Table 6.71: Job Status Visibility Solution**

| Status Need | Solution Implemented |
| --- | --- |
| Know job was accepted | Experiment creation returns queue metadata |
| Know worker started | Worker marks experiment as Running |
| Track execution progress | Executor emits progress updates through callback |
| Know completion | Worker marks experiment as Completed |
| Know failure | Worker marks experiment as Failed with diagnostic stage |
| Know cancellation | Cancellation flow and worker cancellation handling update state |
| Administrator monitoring | System management API exposes active queue snapshot |

## 6.9.11 Challenge 10: Linking Models and Logs to Parameter Permutations

A single experiment can produce many model outputs because the compiler can generate multiple parameter permutations. Each model needs to remain linked to the exact parameter set that produced it. Logs must also be associated with the correct model, otherwise rankings, model detail pages, and artifact downloads could become misleading.

The solution was to compute stable parameter hashes during compilation. Model placeholder rows are created for selected permutations before queueing. During execution, the current parameter hash is used to update the matching model row and save related logs. This keeps the experiment result structure consistent.

```text
PROCEDURE Link Model And Logs To Parameter Permutation
  COMPILER generates selected parameter permutations
  FOR EACH selected permutation
    COMPUTE stable parameter hash
    CREATE model placeholder row with experiment id and parameter hash
  ENDFOR

  DURING execution FOR EACH permutation
    READ current parameter hash
    FIND matching model row by experiment id and parameter hash
    UPDATE model metrics
    SAVE backtest, confusion, and round logs linked to model id
  ENDFOR
ENDPROCEDURE
```

**Table 6.72: Model and Log Linking Solution**

| Problem | Solution Implemented |
| --- | --- |
| Many model outputs per experiment | One model row per selected parameter hash |
| Duplicate parameter sets | Compiler deduplicates generated permutations by stable hash |
| Logs need correct model context | Logs are saved with experiment id and model id |
| Rankings need consistent metrics | Executor updates metrics on the matching model row |
| Downloads need traceable artifacts | Log records include model and parameter context |

## 6.9.12 Overall Solutions Summary

The final implementation uses a combination of architectural and workflow solutions. The main strategy was to keep each responsibility in the correct layer. Frontend views provide interaction and feedback. Backend controllers expose APIs and enforce request-level checks. Validators reject invalid payloads early. Services coordinate infrastructure work. Repositories protect database access. The queue and worker isolate long-running execution. The compiler and executor preserve reproducibility and result traceability.

**Table 6.73: Challenges and Implemented Solutions**

| Challenge | Solution Implemented | Result |
| --- | --- | --- |
| Long-running experiments | Queue service and separate worker process | API remains responsive after experiment submission |
| Reproducibility with editable blueprints | Blueprint versioning, compiled snapshots, and stable parameter hashes | Previous experiments remain traceable |
| Complex experiment validation | Backend validator and compiler validation | Invalid jobs are rejected before queueing |
| Market-data consistency | UTC normalization, cache metadata, missing-range discovery, and upsert behavior | Candle data is more consistent for charts and execution |
| Authentication state restoration | Current-user endpoint and frontend authentication provider | Sessions can be restored after page refresh |
| Role restrictions | Backend access-control service and frontend route guards | Protected staff and admin features are consistently restricted |
| Growing codebase | Layered structure across controllers, services, repositories, validators, workers, strategies, and views | Implementation remains maintainable |
| Poor error feedback | Standard JSON responses and frontend API error handling | Users receive clearer feedback |
| Background job visibility | Experiment status fields, job APIs, worker progress updates, and system management view | Users and admins can monitor execution |
| Model/log traceability | Model placeholders, parameter hashes, and linked experiment logs | Results remain tied to exact parameter configurations |

## 6.9.13 Evidence to Include

The final report should include evidence that directly supports the challenges and solutions described in this section. Screenshots should focus on user-visible outcomes, while diagrams should explain architectural solutions.

Recommended evidence:

- Screenshot of experiment creation returning queued status or queue metadata.
- Screenshot of a running or completed job detail page.
- Screenshot of an experiment validation error in the frontend.
- Screenshot of a blueprint version or moderation state.
- Screenshot of model rankings showing generated model metrics.
- Diagram of asynchronous experiment execution from frontend submission to worker completion.
- Diagram showing how compiled snapshots and parameter hashes preserve reproducibility.

> Note: Use demonstration data and avoid showing private account details, local credentials, session values, or private environment configuration.

## 6.9.14 Summary

The main implementation challenges were caused by the system's full-stack and asynchronous nature. The application needed to provide a responsive web interface while supporting long-running experiment execution, reproducible research artifacts, editable blueprints, validated experiment configuration, cached BTCUSDT market data, session-based authentication, role-based access control, and useful result inspection.

The implemented solutions address these issues through modular design and clear responsibility boundaries. Long-running work is handled by a worker. Reproducibility is protected by blueprint versioning, compiled snapshots, and parameter hashes. Validation is enforced before persistence and queueing. Market data is normalized and cached. Authentication and role checks are enforced in the backend and supported by frontend guards. Standardized responses and progress updates improve user feedback. These solutions make the system more reliable, maintainable, and suitable for demonstration in the final report.
