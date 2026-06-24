# Backend Services Module

Services hold reusable application logic that controllers and workers call.

## `backend/app/services/access_control_service.py`

Explanation: Resolves authenticated users from request/session data and checks ownership, profile access, staff/admin access, user management permissions, and role assignment rules.

Pseudocode:

```text
get_authenticated_context(request):
  read session cookie
  find session and user
  reject missing, expired, disabled
  return AuthContext

can_access_profile(actor, target_user_id):
  return actor owns profile or is staff

can_manage_user(actor, target):
  apply admin/moderator matrix

can_assign_role(actor, role):
  apply allowed role matrix
```

## `backend/app/services/job_metadata_service.py`

Explanation: Reads job metadata from the queue provider and keeps a short cache for recently terminal jobs so detail pages can still show completion/failure after Redis removes active entries.

Pseudocode:

```text
get_job_detail(job_id):
  try provider.get_job_detail(job_id)
    if terminal: cache it with expiry
    return metadata
  except not found:
    if cached and not expired: return cached
    raise QueueJobNotFoundError
```

## `backend/app/services/market_data_service.py`

Explanation: Coordinates BTCUSDT kline refreshes. It validates time ranges, fetches from Binance, persists through the market data repository, and returns insert/update summary counts.

Pseudocode:

```text
refresh_btcusdt_1m(start, end):
  normalize UTC datetimes
  reject invalid range
  fetch klines from Binance client
  open unit of work
  require market_data repository
  upsert klines
  commit
  return RefreshSummary(fetched, inserted, updated)

get latest/earliest/list cached timestamps:
  delegate to repository
```

## `backend/app/services/password_service.py`

Explanation: Wraps Werkzeug password hashing and verification.

Pseudocode:

```text
hash_password(password):
  return generate_password_hash(password)

verify_password(password, hash):
  return check_password_hash(hash, password)
```

## `backend/app/services/queue_service.py`

Explanation: Defines queue error types and the queue provider protocol, then wraps enqueue, read, active snapshot, remove, and cancel behavior with job-type validation.

Pseudocode:

```text
enqueue_job(spec):
  if job_type unsupported: raise UnsupportedJobTypeError
  delegate enqueue to queue provider
  return QueuePosition

get_job_detail/list/cancel/remove:
  delegate to provider
  normalize provider errors
```

## `backend/app/services/session_service.py`

Explanation: Provides the current in-memory server-side session store. It creates session IDs, purges expired sessions, supports no-expiry zero timeout, reads sessions, and deletes sessions.

Pseudocode:

```text
create_session(user_id, timeout):
  purge expired records
  generate random session id
  expires_at = now + timeout unless timeout is zero
  store SessionRecord
  return session id

get_session(id):
  if missing or expired: return None
  return record

delete_session(id):
  remove record
```

## `backend/app/services/system_settings_service.py`

Explanation: Defines runtime setting specs, coercion rules, defaults, repository-backed reads/writes, and a helper for settings needed in hot paths.

Pseudocode:

```text
SystemSettingsService.get_settings():
  load persisted settings
  merge with defaults
  coerce ints
  return dict

update_settings(payload):
  validate known keys
  coerce integer values and enforce minimums
  persist each setting
  return updated settings

get_runtime_settings():
  open unit of work
  return service.get_settings()
```

## `backend/app/services/versioning_service.py`

Explanation: Handles blueprint versioning rules. It updates never-submitted drafts in place and creates a new version when an already reviewed blueprint is edited.

Pseudocode:

```text
save_blueprint_update(blueprint, changes):
  if blueprint was never submitted:
    update same row
  else:
    create new blueprint row
    increment version
    link lineage to source
  return saved blueprint
```
