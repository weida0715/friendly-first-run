#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

log() {
  printf '[test_all] %s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "missing required command: $1"
    exit 1
  fi
}

require_cmd npm

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  log "frontend node_modules missing; run 'npm install' in frontend/ first"
  exit 1
fi

if [[ -x "$BACKEND_DIR/.venv/bin/pytest" ]]; then
  BACKEND_TEST_CMD=("$BACKEND_DIR/.venv/bin/pytest" -q)
elif command -v pytest >/dev/null 2>&1; then
  BACKEND_TEST_CMD=(pytest -q)
else
  log "pytest not found; install backend dev dependencies first"
  exit 1
fi

log "running backend tests"
(
  cd "$BACKEND_DIR"
  "${BACKEND_TEST_CMD[@]}"
)

log "running frontend tests"
(
  cd "$FRONTEND_DIR"
  npm test -- --runInBand
)

log "all tests passed"