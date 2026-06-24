# Backend Scripts And Workers Module

Scripts are CLI entry points. Workers consume queued jobs and run experiments.

## `backend/app/scripts/_market_data_cli.py`

Explanation: Shared CLI helpers for market-data scripts. It parses ISO datetimes and resolves `start`/`end`/`lookback_hours` combinations.

Pseudocode:

```text
parse_iso_datetime(value):
  parse ISO string
  attach/normalize UTC timezone

resolve_range(start, end, lookback_hours):
  reject invalid argument combinations
  compute start/end datetimes
  return UTC range
```

## `backend/app/scripts/cleanup_database.py`

Explanation: Local reset command that clears mutable experiment/application data while preserving selected reference tables such as users and BTCUSDT klines.

Pseudocode:

```text
main():
  create app context
  open database session
  delete configured tables in dependency-safe order
  commit
  print summary
```

## `backend/app/scripts/ingest_btcusdt_klines.py`

Explanation: CLI for backfilling BTCUSDT 1m candles. It discovers missing ranges, chunks work, refreshes each range, can continue within a failure budget, and repairs gaps.

Pseudocode:

```text
main(argv):
  parse start/end/lookback/resume/reconcile options
  resolve requested range
  discover missing ranges from cache
  merge adjacent ranges
  for each chunk:
    call MarketDataService.refresh_btcusdt_1m
    print progress
    track failures
    stop if failure budget exceeded
  run post-ingest gap check/repair if configured
  return exit code
```

## `backend/app/scripts/refresh_btcusdt_klines.py`

Explanation: Smaller CLI wrapper around `MarketDataService.refresh_btcusdt_1m()` for a single requested range.

Pseudocode:

```text
main(argv):
  parse start/end/lookback
  resolve range
  call refresh service
  print fetched/inserted/updated counts
  return 0 or 1 on service error
```

## `backend/app/scripts/run_worker.py`

Explanation: CLI entry point that starts the experiment worker loop.

Pseudocode:

```text
main():
  call experiment_worker.run_worker()
```

## `backend/app/workers/experiment_worker.py`

Explanation: Validates experiment job payloads, marks experiments running/completed/failed, runs the default executor, and exposes a queue worker loop.

Pseudocode:

```text
validate_payload(payload):
  require object payload
  require integer experiment_id
  require experiment exists
  return experiment_id

handle_experiment_job(payload):
  experiment_id = validate_payload(payload)
  mark experiment running
  run DefaultExperimentExecutor with progress callback
  mark experiment completed with result summary
  on error: mark experiment failed and re-raise/return failure

run_worker():
  connect to Redis queue
  consume experiment jobs
  call handle_experiment_job for each payload
```
