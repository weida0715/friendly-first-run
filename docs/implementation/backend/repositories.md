# Backend Repositories Module

Repositories isolate SQLAlchemy persistence from controllers and services.

## `backend/app/repositories/blueprint_repository.py`

Explanation: Persists and queries blueprint ORM rows, including ownership lists, accessible/public blueprints, approval-state updates, and detail lookups.

Pseudocode:

```text
add(blueprint):
  map domain fields to BlueprintORM
  add row and flush

get_by_id(id):
  query BlueprintORM by primary key

list_by_user(user_id):
  query rows owned by user

update fields/state:
  load row
  mutate columns
  flush
```

## `backend/app/repositories/experiment_log_repository.py`

Explanation: Stores and retrieves experiment logs, including logs by type, logs by model, and structured metric payloads.

Pseudocode:

```text
add(log):
  map ExperimentLog domain object to ORM
  add and flush

list_by_experiment(experiment_id):
  query logs ordered by creation

list_by_type(experiment_id, log_type):
  filter by experiment and type
```

## `backend/app/repositories/experiment_repository.py`

Explanation: Manages experiment rows and status transitions. It creates experiments, lists by user, updates progress, marks running/completed/failed/cancelled, stores job IDs, and truncates long stage text to fit storage.

Pseudocode:

```text
add(experiment):
  map domain object to ExperimentORM
  add row and flush

get_by_id(id):
  query experiment

list_by_user(user_id, filters):
  apply owner/status/search filters
  return rows

update_progress(id, progress, current_stage, eta):
  clamp/truncate fields
  update row

mark_running/completed/failed/cancelled(id):
  update status timestamps and stage fields
```

## `backend/app/repositories/favorite_blueprint_repository.py`

Explanation: Manages user favorite links to blueprints.

Pseudocode:

```text
add(user_id, blueprint_id):
  insert if not already favorited

remove(user_id, blueprint_id):
  delete link

exists/list_for_user:
  query favorite links
```

## `backend/app/repositories/favorite_model_repository.py`

Explanation: Manages user favorite links to trained models.

Pseudocode:

```text
add(user_id, model_id):
  insert favorite if absent

remove(user_id, model_id):
  delete favorite

list_model_ids_for_user(user_id):
  return model IDs
```

## `backend/app/repositories/mappers/blueprint_mapper.py`

Explanation: Converts `BlueprintORM` rows into `Blueprint` domain objects.

Pseudocode:

```text
orm_to_blueprint_domain(row):
  copy scalar columns
  copy JSON config fields
  return Blueprint(...)
```

## `backend/app/repositories/market_data_repository.py`

Explanation: Manages BTCUSDT candle cache persistence. It upserts candles, returns inserted/updated counts, lists ranges, returns timestamp bounds, deletes cache rows, and can query pre-aggregated interval projections.

Pseudocode:

```text
upsert_klines(klines):
  for each candle:
    if timestamp exists: update OHLCV fields
    else: insert new row
  return UpsertSummary

list_range(start, end, interval):
  validate interval
  query candles in timestamp range
  return domain objects

list_range_projection(start, end, interval):
  if interval is 1m: select raw rows
  else: group candles into interval buckets in SQL

earliest/latest/list timestamps:
  delegate aggregate queries

clear_all():
  delete candle rows
```

## `backend/app/repositories/model_repository.py`

Explanation: Persists trained model rows and performs model listing/ranking queries. It joins experiments, blueprints, owners, favorites, and log metrics for model library/ranking use cases.

Pseudocode:

```text
add(model):
  map domain model to ModelORM
  add and flush

get_by_id(id):
  query model

list_by_experiment(experiment_id):
  return models for experiment

rankings(filters, sort, pagination):
  build visible model query
  apply search/filter rules
  join metric logs when needed
  sort and paginate
  return rows/count
```

## `backend/app/repositories/system_event_repository.py`

Explanation: Persists and queries audit/system event records for the system terminal and user audit views.

Pseudocode:

```text
add(event):
  map SystemEvent to ORM
  add and flush

list(filters):
  filter by scope, actor, target, limit
  order newest first
```

## `backend/app/repositories/system_setting_repository.py`

Explanation: Reads and writes key/value runtime settings.

Pseudocode:

```text
get_all():
  return key/value map

set(key, value):
  upsert SystemSettingORM row
```

## `backend/app/repositories/unit_of_work.py`

Explanation: Owns the SQLAlchemy session lifecycle and exposes repository instances under one transaction boundary.

Pseudocode:

```text
enter:
  create session
  attach repositories using session
  return self

exit:
  if exception: rollback
  else: commit
  close session
```

## `backend/app/repositories/user_repository.py`

Explanation: Manages user CRUD, uniqueness lookups, search/count filtering, and role/status updates.

Pseudocode:

```text
add(user):
  map User domain object to UserORM
  add and flush

get_by_id/email/username:
  query matching user

list(filters, pagination):
  apply role/status/search filters
  return rows and count

update_status/update_role/update_username:
  load user
  mutate column
  flush
```
