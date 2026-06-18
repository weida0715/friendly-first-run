#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
PIDS=()

log() {
  printf '[start_app] %s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "missing required command: $1"
    exit 1
  fi
}

cleanup() {
  local exit_code=$?
  log "stopping services..."
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done

  # Wait for children to exit, then force terminate leftovers.
  sleep 2
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill -9 "$pid" >/dev/null 2>&1 || true
    fi
  done

  wait || true
  log "all services stopped"
  exit "$exit_code"
}

trap 'exit' INT TERM
trap cleanup EXIT

require_cmd bash
require_cmd node
require_cmd npm
require_cmd python
require_cmd redis-cli

if ! redis-cli -u "${REDIS_URL:-redis://localhost:6379/0}" ping >/dev/null 2>&1; then
  log "Redis is not reachable at ${REDIS_URL:-redis://localhost:6379/0}. Start Redis first."
  exit 1
fi

if [[ ! -x "$BACKEND_DIR/.venv/bin/python" ]]; then
  log "backend venv missing at backend/.venv; create it and install deps first"
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  log "frontend node_modules missing; run 'npm install' in frontend/ first"
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  log "DATABASE_URL is required"
  exit 1
fi

log "starting backend on http://localhost:5000"
(
  cd "$BACKEND_DIR"
  PYTHONPATH="$BACKEND_DIR" .venv/bin/python wsgi.py
) &
PIDS+=("$!")

log "starting worker"
(
  cd "$BACKEND_DIR"
  PYTHONPATH="$BACKEND_DIR" .venv/bin/python -m app.scripts.run_worker
) &
PIDS+=("$!")

log "starting frontend on http://localhost:3000"
(
  cd "$FRONTEND_DIR"
  npm run dev
) &
PIDS+=("$!")

log "services started. Press Ctrl-C to stop all services safely."
wait -n
