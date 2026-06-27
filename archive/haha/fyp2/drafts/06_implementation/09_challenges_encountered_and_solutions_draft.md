# 6.9 Challenges Encountered and Solutions

## Section Purpose

This section explains the main technical difficulties faced during implementation and how they were mitigated. It should be honest, specific, and connected to the implemented modules. Each challenge should include the affected area, cause, impact, and solution.

## 6.9.1 Challenges Encountered

### Recommended Structure

Use one introductory paragraph and a challenge table. Then expand the most important challenges in short paragraphs.

| No. | Challenge | Affected Area | Impact |
| --- | --- | --- | --- |
| 1 | Keeping long-running experiments from blocking the web interface | Experiment submission and execution | Users could experience slow responses if jobs ran directly inside request handlers |
| 2 | Preserving reproducibility while allowing blueprint edits | Blueprint and experiment modules | Edited blueprints could change the meaning of previous experiments |
| 3 | Preventing invalid experiment configurations | Experiment wizard and backend validator | Incorrect split ratios, date ranges, or inaccessible blueprints could create unusable jobs |
| 4 | Handling market-data availability and duplicate candles | Market data and charting | Repeated refreshes could create duplicate records or inconsistent charts |
| 5 | Coordinating frontend auth state with backend sessions | Authentication and route guards | Protected pages could render incorrectly if session state was not restored after refresh |
| 6 | Enforcing role restrictions consistently | RBAC and admin/moderator screens | UI hiding alone would not secure protected operations |
| 7 | Maintaining a clear project structure as features grew | Full-stack codebase | Controllers, services, repositories, workers, and views could become tightly coupled |
| 8 | Providing useful error feedback | Forms, API client, backend responses | Users need actionable validation messages instead of generic failures |

### Expansion Paragraphs

Write one short paragraph for each of the top five challenges. Focus on the technical reason and the module affected. Avoid blaming tools or users.

> Note: Include screenshots only for user-visible challenges, such as validation errors or job status handling. For architectural challenges, diagrams and tables are better than screenshots.

## 6.9.2 Solutions

### Recommended Structure

Use one solution table and two to four explanatory paragraphs.

| Challenge | Solution Implemented |
| --- | --- |
| Long-running experiments blocking UI | Added Redis/RQ queue service and separate worker process; experiment submission returns queued metadata |
| Blueprint edits affecting reproducibility | Added immutable compiled snapshots and versioned blueprint editing behavior |
| Invalid experiment configuration | Added frontend step validation and backend experiment validator before persistence and queueing |
| Market-data duplicates | Added normalized candle upsert behavior keyed by timestamp |
| Auth state restoration | Added frontend `AuthProvider`, current-user endpoint, and protected route guards |
| Inconsistent role enforcement | Added backend access-control service and frontend role guards/navigation filtering |
| Growing codebase complexity | Separated controllers, services, repositories, validators, workers, strategies, and views |
| Poor error feedback | Standardized JSON response shapes and frontend API error handling |

### Pseudocode Requirement

Use pseudocode only for one representative solution: asynchronous experiment submission.

```text
PROCEDURE Submit Experiment Without Blocking UI
  RECEIVE experiment request
  VALIDATE request
  SAVE experiment as queued
  ENQUEUE worker job
  RETURN queue metadata to user interface
  WORKER later processes job in background
ENDPROCEDURE
```

### Screenshots / Evidence

> Note: Add a screenshot of a queued/running job and a screenshot of a validation error. These directly support the discussion of asynchronous processing and safer form submission.

## Draft Content to Use in the Report

Several implementation challenges were encountered while developing the system. The first major challenge was handling long-running experiment execution without blocking the web interface. Experiment execution involves data loading, feature generation, target generation, model training, evaluation, and log persistence, which makes it unsuitable for direct execution inside a normal HTTP request. If handled synchronously, the user would have to wait for the request to finish and the server could become less responsive.

Another challenge was preserving reproducibility while still allowing users to improve their blueprints. Blueprints are reusable templates, but experiments must retain the exact definition used at submission time. Without versioning and compiled snapshots, a later blueprint edit could make previous experiment results ambiguous.

Validation was also a significant challenge because experiment configuration involves multiple dependent fields. Date ranges, fixed BTCUSDT scope, split percentages, minimum validation/test allocations, blueprint accessibility, and parameter override shapes must all be checked before an experiment can safely enter the queue. Similar validation was required for blueprint authoring to ensure that submitted definitions can be compiled later.

The implemented solutions address these challenges through separation of responsibilities. Long-running execution is moved into a Redis-backed queue and worker process. Blueprint changes are controlled through versioning and compiled snapshots. Experiment and blueprint inputs are checked through backend validators before persistence. Market data is normalized and upserted by timestamp to prevent duplicate candle rows. Authentication and role authorization are enforced through backend services and mirrored in frontend guards for usability.
