# Backend Application Module

This module boots the Flask API, loads runtime configuration, registers feature routes, and standardizes API responses.

## `backend/wsgi.py`

Explanation: Exposes the Flask `application` object for WSGI servers such as Gunicorn or Waitress. It imports the app factory and creates the runtime app once.

Pseudocode:

```text
import create_app
application = create_app()
```

## `backend/app/__init__.py`

Explanation: Defines `create_app()`. It loads config, configures CSRF, handles CORS preflight and response headers, records system trace events for API requests, warns about unsafe in-memory sessions, registers routes, and creates database tables.

Pseudocode:

```text
function create_app(config_name):
  app = Flask()
  app.config = get_config(config_name)
  configure session cookie name
  enable CSRF protection
  on CSRF error: return JSON error
  before API OPTIONS request: return CORS preflight response
  after API request: add CORS headers and record route event
  on unhandled API exception: record failed route event
  warn if memory sessions are risky
  register all route blueprints
  create database tables
  return app
```

## `backend/app/config.py`

Explanation: Defines environment-specific configuration classes. It reads the project version, secret key, database URL, API prefix, CORS origins, session settings, Redis URL, Binance base URL, and test overrides.

Pseudocode:

```text
function read_project_version():
  read VERSION file
  return version or fallback

class BaseConfig:
  define defaults from environment

class DevelopmentConfig(BaseConfig): set development mode
class TestingConfig(BaseConfig): use test database and testing flags
class ProductionConfig(BaseConfig): require production-style runtime settings

function get_config(config_name):
  choose explicit config or FLASK_ENV
  return matching config class
```

## `backend/app/routes.py`

Explanation: Registers all Flask blueprints under the configured API prefix and serves a browser-friendly backend status page at `/`.

Pseudocode:

```text
function register_routes(app):
  define GET / status HTML page
  api_prefix = app config API_PREFIX
  register system blueprint at /api
  register auth blueprint at /api/auth
  register users blueprint at /api/users
  register experiments blueprint at /api/experiments
  register blueprints and approval/library blueprints
  register models, hub, docs, jobs, logs, market-data blueprints
```

## `backend/app/responses.py`

Explanation: Provides tiny helpers for consistent JSON response shapes: successful payloads, single errors, and validation errors.

Pseudocode:

```text
function ok_response(data, status_code):
  return JSON { ok: true, data: data }

function error_response(message, status_code, code):
  return JSON { ok: false, error: { message, code } }

function validation_error_response(errors):
  return JSON { ok: false, errors: errors }
```
