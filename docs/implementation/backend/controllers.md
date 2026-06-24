# Backend Controllers Module

Controllers define the HTTP boundary. They parse requests, call services/repositories, enforce access rules, and return the shared JSON response format.

## `backend/app/controllers/_access.py`

Explanation: Builds the access-control service and provides a shared staff gate for routes that require moderator/admin users.

Pseudocode:

```text
function build_access_control():
  return AccessControlService(session service, user repository)

function require_staff(access_control, context):
  if context is missing or role is not staff:
    return 403 error
  return null
```

## `backend/app/controllers/_services.py`

Explanation: Builds queue-related services from the configured Redis queue adapter.

Pseudocode:

```text
function build_queue_service():
  return QueueService(RedisJobQueue.from_config())

function build_job_metadata_service():
  return JobMetadataService(queue provider)
```

## `backend/app/controllers/authentication_controller.py`

Explanation: Handles auth index, CSRF token creation, registration, login, current-user lookup, and logout. It validates credentials, hashes passwords, stores server-side sessions, and returns safe user payloads.

Pseudocode:

```text
GET /auth/:
  return available auth routes

GET /auth/csrf:
  create CSRF token
  return token

POST /auth/register:
  validate name, username, email, password
  reject duplicates
  hash password
  create enabled User
  return safe user fields

POST /auth/login:
  find user by email
  verify password and enabled status
  create session record
  set session cookie
  return safe user fields

GET /auth/me:
  load session from cookie
  return current user or 401

POST /auth/logout:
  delete session if present
  clear cookie
  return loggedOut
```

## `backend/app/controllers/blueprint_approval_controller.py`

Explanation: Handles approval workflow for blueprints: owners request review, staff list pending items, moderators/admins approve, reject, or disapprove.

Pseudocode:

```text
POST /blueprints/{id}/request-approval:
  require owner
  move draft/rejected blueprint to Pending
  save event and return blueprint

GET /blueprints/moderation/queue:
  require staff
  list pending/approved moderation records

function moderate_blueprint(id, target_state):
  require staff
  validate current state transition
  update approval state
  record event
  return blueprint

approve/reject/disapprove routes:
  call moderate_blueprint with target state
```

## `backend/app/controllers/blueprint_controller.py`

Explanation: Serves blueprint list/detail, favorite toggles, metadata, draft creation, and updates. It enforces public/private/moderation access and validates blueprint payloads.

Pseudocode:

```text
GET /blueprints/:
  return accessible blueprints

GET /blueprints/{id}:
  load blueprint
  require owner, public approval, or staff moderation access
  return blueprint detail and favorite flag

POST/DELETE /blueprints/{id}/favorite:
  require auth
  add or remove favorite
  return favorite state

GET /blueprints/metadata:
  return indicator and architecture metadata

POST /blueprints/:
  require auth
  validate payload
  create draft blueprint

PATCH /blueprints/{id}:
  require owner-edit access
  validate and update blueprint
```

## `backend/app/controllers/blueprint_wizard_controller.py`

Explanation: Defines the wizard payload shape and controller placeholder used by blueprint wizard flows. The actual route work is handled in blueprint routes.

Pseudocode:

```text
BlueprintWizardSubmitPayload:
  store name, description, indicators, architecture, visibility

BlueprintWizardController:
  exists as feature controller namespace
```

## `backend/app/controllers/blueprints_library_controller.py`

Explanation: Lists blueprints owned by the current user and blueprints favorited by the current user.

Pseudocode:

```text
GET /blueprints/library/owned:
  require auth
  query owned blueprints
  return items

GET /blueprints/library/favorited:
  require auth
  query favorite rows joined to accessible blueprints
  return items
```

## `backend/app/controllers/dashboard_controller.py`

Explanation: Placeholder class for dashboard controller naming. Dashboard data is currently assembled from existing feature endpoints.

Pseudocode:

```text
class DashboardController:
  pass
```

## `backend/app/controllers/documentation_controller.py`

Explanation: Reads markdown docs from `docs/`, extracts title/category/body metadata, lists available docs, and returns detail by slug. Requires authentication.

Pseudocode:

```text
function auth():
  return authenticated context or 401

function parse_doc(path):
  read markdown
  title = first heading or filename
  category = parent/fallback category
  return doc metadata and body

GET /docs/:
  require auth
  parse all markdown docs
  return sorted list

GET /docs/{slug}:
  require auth
  find matching doc
  return detail or 404
```

## `backend/app/controllers/experiment_controller.py`

Explanation: Owns experiment lifecycle endpoints. It validates creation payloads, compiles blueprint snapshots, enqueues jobs, lists and details experiments, reconciles stale queue state, exposes blueprint options, and supports cancel/retry/delete.

Pseudocode:

```text
POST /experiments:
  require auth
  parse date or candlestick range
  validate payload against accessible blueprint
  enforce max concurrent jobs
  compile experiment plan and parameter permutations
  persist experiment with compiled snapshot
  enqueue experiment job
  return created experiment and queue position

GET /experiments:
  require auth
  list user's experiments
  normalize active queued statuses
  reconcile missing queue jobs
  return rows

GET /experiments/{id}:
  require owner/staff
  load experiment, models, logs, queue job
  compute public model IDs, progress, metrics, correlations
  return full detail

GET /experiments/blueprint-options:
  require auth
  list approved/accessible blueprints with search, sort, pagination

POST /experiments/{id}/cancel:
  require owner/staff
  cancel queue job or mark experiment cancelled

POST /experiments/{id}/retry:
  require owner/staff
  reset failed/cancelled experiment
  enqueue new job

DELETE /experiments/{id}:
  require owner/staff
  delete experiment
```

## `backend/app/controllers/experiment_wizard_controller.py`

Explanation: Placeholder class for experiment wizard naming. The wizard UI consumes experiment metadata and creation routes from `experiment_controller.py`.

Pseudocode:

```text
class ExperimentWizardController:
  pass
```

## `backend/app/controllers/job_controller.py`

Explanation: Lists accessible queue jobs, returns job details, and cancels jobs while checking owner/staff access.

Pseudocode:

```text
GET /jobs/:
  require auth
  fetch active jobs
  filter to owner/staff-visible jobs
  return list

GET /jobs/{job_id}:
  require auth
  fetch job metadata
  require owner/staff
  return detail

POST /jobs/{job_id}/cancel:
  require auth and owner/staff
  cancel through QueueService
  return cancellation result
```

## `backend/app/controllers/logs_download_controller.py`

Explanation: Exports experiment artifacts as JSON or CSV. It checks experiment access/completion, fetches stored logs, maps internal model IDs to public IDs, and regenerates round logs when missing.

Pseudocode:

```text
GET /logs/:
  return available log routes

GET /logs/experiments/{id}/{artifact}:
  require experiment access
  require completed experiment for export
  load requested log type
  add public model IDs
  return JSON or CSV artifact

GET /logs/experiments/{id}/models/{model_id}/round:
  require access and completion
  load or regenerate round rows
  return prediction history

GET /logs/experiments/{id}/models/{model_id}/round.csv:
  same as round endpoint, formatted as CSV
```

## `backend/app/controllers/market_data_controller.py`

Explanation: Serves BTCUSDT candle data, target previews, target economics, cache metadata, and admin cache controls. It includes helpers for interval aggregation, preview parameter coercion, label statistics, mock predictions, and catch-up state.

Pseudocode:

```text
GET /market-data/btcusdt/klines:
  parse start, end, interval, limit
  query cached klines
  aggregate if needed
  return chart rows

POST /market-data/btcusdt/target-preview:
  parse range, interval, target strategy, params, preview controls
  load cached candles and aggregate
  compute target labels
  compute class counts, null counts, returns, bridge/economics summaries
  return preview rows and summary

GET /market-data/btcusdt/metadata:
  return earliest/latest cached timestamps

POST /market-data/btcusdt/admin/catch-up:
  require admin
  start background catch-up from latest cache timestamp

GET/POST catch-up status/stop:
  return or update catch-up status

DELETE /market-data/btcusdt/admin/klines:
  require admin
  reject if catch-up running
  clear cached rows
```

## `backend/app/controllers/model_controller.py`

Explanation: Serves model highlights, rankings, libraries, details, and favorite toggles. It merges model rows with experiment, blueprint, owner, favorite, and log metric data.

Pseudocode:

```text
GET /models/highlights:
  require auth
  query top direct and backtest metrics
  return cards

GET /models/rankings:
  require auth
  parse paging, sort, filters, search
  query visible models
  attach metrics and favorite state
  return ranked rows

GET /models/library/owned|favorited:
  require auth
  return owned or favorited models

GET /models/{id}:
  require public/owner/staff access
  return model detail, parameters, logs

POST/DELETE /models/{id}/favorite:
  require auth
  add or remove favorite row
```

## `backend/app/controllers/models_library_controller.py`

Explanation: Placeholder class for the models library feature namespace. Active library routes live in `model_controller.py`.

Pseudocode:

```text
class ModelsLibraryController:
  pass
```

## `backend/app/controllers/models_rankings_controller.py`

Explanation: Placeholder class for the model rankings feature namespace. Active ranking routes live in `model_controller.py`.

Pseudocode:

```text
class ModelsRankingsController:
  pass
```

## `backend/app/controllers/public_hub_controller.py`

Explanation: Lists public users, experiments, models, and blueprints and serves public user profiles. It filters to approved/public artifacts and formats lightweight cards for the hub UI.

Pseudocode:

```text
GET /hub/:
  parse search/date filters
  query public users, experiments, models, blueprints
  return grouped hub data

GET /hub/users/{id}:
  find enabled user
  query user's public experiments, models, blueprints
  return profile or 404
```

## `backend/app/controllers/system_controller.py`

Explanation: Handles health checks, active queue snapshots, runtime settings, settings updates, system event listing, and CSV download. It also exposes `record_event()` used by request tracing.

Pseudocode:

```text
GET /health:
  return service, version, env, status

GET /system/queue/active:
  require admin
  return queue snapshot

GET/PATCH /system/settings:
  require admin
  read or update runtime settings

GET /system/events:
  require admin
  filter events by scope/user/limit
  return rows

GET /system/events/download:
  require admin
  stream event CSV

record_event(...):
  insert SystemEvent row, ignoring trace failures
```

## `backend/app/controllers/user_controller.py`

Explanation: Handles user profile and admin user-management routes. It enforces owner/staff/admin access, validates usernames/emails/roles, hashes reset passwords, and records audit events.

Pseudocode:

```text
GET /users:
  require staff
  parse filters
  return paged users

GET /users/me:
  require auth
  return own profile

GET /users/{id}:
  require owner or staff
  return profile

GET /users/{id}/audit:
  require staff
  return system events for user

POST /users:
  require staff with assignable role
  validate fields and uniqueness
  create user

PATCH status/password/role/username:
  require allowed staff/admin action
  validate payload
  update user and record event

DELETE /users/{id}:
  require admin
  delete user
```

## `backend/app/controllers/wizard_controller.py`

Explanation: Placeholder class for generic wizard naming. Concrete wizard behavior is implemented in blueprint and experiment controllers.

Pseudocode:

```text
class WizardController:
  pass
```
