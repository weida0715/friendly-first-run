# System Architecture Implementation

## Frontend Presentation Layer

The frontend presentation layer is a Next.js application under `frontend/`. Route entrypoints live in `frontend/app`, while user-facing screen logic lives in `frontend/views`.

The root layout wraps every page with `ThemeProvider`, `AuthProvider`, and `AppShell`. Individual route files decide which view to render and whether the page requires authentication or a minimum role. For example, dashboard, experiments, blueprints, models, profile, jobs, and system pages are protected by route guards, while landing, documentation, and hub pages are public entrypoints.

Reusable presentation components live under `frontend/components`. Layout components provide the shell, top bar, sidebar navigation, page header, and breadcrumbs. UI primitives provide buttons, cards, inputs, labels, badges, status displays, tables, loading states, empty states, and error states.

## Backend Presentation Layer

The backend presentation layer is the Flask API under `backend/app/controllers`. The application factory in `backend/app/__init__.py` creates the Flask app, configures CSRF handling, applies CORS headers for API routes, records system events, registers routes, and initializes database metadata.

Route composition happens in `backend/app/routes.py`. It registers controller blueprints under the `/api` prefix for authentication, users, blueprints, experiments, jobs, logs, market data, models, public hub, documentation, and system endpoints.

Controllers translate HTTP requests into application actions. They validate request payloads, resolve authenticated actors, call services and repositories through the unit of work, and return consistent JSON responses.

## Business Logic Layer

Business logic is kept outside route files where it has reusable behavior.

Services under `backend/app/services` handle access control, password hashing, sessions, queue orchestration, market data, system settings, job metadata, and blueprint versioning. Validators under `backend/app/validators` enforce blueprint and experiment payload rules before persistence. Factories under `backend/app/factories` resolve architectures, indicators, target strategies, and blueprint execution components by name.

Experiment execution logic is split into compilers, executors, and strategies. The compiler converts a selected blueprint and experiment payload into immutable snapshots and parameter permutations. Execution strategies handle data splitting, feature scaling, indicators, targets, model training, metrics, trading simulation, logging, and cancellation.

## Data Access Layer

The data access layer uses SQLAlchemy repositories and a unit-of-work boundary.

ORM mappings live under `backend/app/infrastructure/database/orm`. Domain dataclasses live under `backend/app/domain/models` and value objects live under `backend/app/domain/value_objects`. Repositories under `backend/app/repositories` convert between ORM rows and domain objects, then expose persistence operations such as add, update, list, search, and lookup.

`UnitOfWork` creates one SQLAlchemy session and attaches all repositories to that session. On successful exit it commits the transaction. On error it rolls back and closes the session.

## Infrastructure Layer

Infrastructure code isolates external systems and runtime services.

- `backend/app/infrastructure/database` configures SQLAlchemy metadata, engine creation, session factory binding, enums, and ORM mappings.
- `backend/alembic` contains schema migrations.
- `backend/app/infrastructure/redis` provides Redis-backed queue integration.
- `backend/app/infrastructure/binance` provides BTCUSDT kline retrieval.
- `backend/app/scripts/run_worker.py` starts the background experiment worker.
- `scripts/start_app.sh` checks local prerequisites and runs backend, worker, and frontend processes together.

## Overall Project Structure

The source project is organized as follows, excluding ignored outputs such as dependency folders, build folders, virtual environments, caches, local environment files, logs, runtime databases, and test directories.

```text
.
├── backend/
│   ├── alembic/                  Schema migrations
│   ├── app/
│   │   ├── architectures/        Concrete model architecture adapters
│   │   ├── controllers/          Flask API controllers
│   │   ├── domain/               Domain entities and value objects
│   │   ├── execution/            Experiment compilation support
│   │   ├── executors/            Experiment executor interfaces
│   │   ├── factories/            Strategy and metadata registries
│   │   ├── infrastructure/       Database, Redis, Binance adapters
│   │   ├── repositories/         Data access repositories and unit of work
│   │   ├── scripts/              Backend command entrypoints
│   │   ├── services/             Application services
│   │   ├── strategies/           Indicator, target, split, metric, log, trading strategies
│   │   ├── validators/           Blueprint and experiment validators
│   │   ├── workers/              Background worker runtime
│   │   ├── __init__.py           Flask application factory
│   │   ├── config.py             Environment-aware backend config
│   │   ├── responses.py          JSON response helpers
│   │   └── routes.py             API blueprint registry
│   ├── pyproject.toml            Backend package and pytest config
│   ├── requirements.txt          Backend runtime dependencies
│   └── wsgi.py                   Backend WSGI entrypoint
├── docs/                         User and system documentation
├── frontend/
│   ├── app/                      Next.js route entrypoints
│   ├── components/               Layout, UI, form, chart, state, table components
│   ├── lib/                      API client, auth, routes, theme, validators
│   ├── views/                    Page-level React views
│   └── package.json              Frontend scripts and dependencies
├── scripts/                      Local orchestration and verification scripts
├── .env.example                  Environment variable template
├── README.md                     Project overview
└── VERSION                       Application version marker
```

### Backend Implementation Coverage

`backend/alembic` contains database schema history. It defines the baseline PostgreSQL schema and later schema changes for BTCUSDT update tracking, experiment job ids, experiment datetime ranges, compiled snapshots, model parameter hashes, and system settings.

`backend/app/__init__.py` is the application factory. It creates the Flask app, loads config, initializes CSRF protection, handles API CORS, records system activity, warns about unsafe local session mode, registers API routes, and initializes database metadata.

`backend/app/config.py` centralizes runtime configuration. It reads environment variables for the app name/version, Flask environment, secret key, database URL, Redis URL, queue name, Binance base URL, session timeout, auth session cookie, Flask CSRF session cookie, cookie flags, session backend, CORS origins, and testing/debug flags.

`backend/app/routes.py` is the API composition point. It registers authentication, user, experiment, blueprint, blueprint approval, blueprint library, model, public hub, documentation, job, log, market data, and system blueprints under the configured API prefix.

`backend/app/responses.py` standardizes JSON responses. Controllers use it for successful responses, generic errors, and validation errors so frontend error handling receives predictable payload shapes.

`backend/app/architectures` implements model architecture adapters. Logistic regression and ridge classifier adapters convert prepared feature frames into scikit-learn training, prediction, probability, and evaluation behavior.

`backend/app/controllers` is the HTTP boundary. Authentication handles registration, login, logout, current user, and CSRF token retrieval. User routes handle profile and staff management. Blueprint routes handle draft persistence, detail, favorites, metadata, versioned edits, approval requests, and moderation. Experiment routes handle creation, listing, detail, retry, cancellation, blueprint options, model mapping, and queue reconciliation. Other controllers expose jobs, logs, market data, models, public hub, documentation, dashboard, and system management.

`backend/app/domain` defines durable business concepts. Domain models represent users, blueprints, experiments, models, experiment logs, favorites, market candles, and system events. Value objects represent validation results, experiment configs, job specifications, queue positions, cancellation results, split results, trained models, evaluation results, and execution results.

`backend/app/execution` compiles experiments before execution. `ExperimentCompiler` validates and normalizes blueprint and experiment settings, builds immutable snapshots, expands parameter permutations, assigns stable parameter hashes, and limits requested permutations. `feature_scaler` applies configured scaler behavior to generated feature columns.

`backend/app/executors` defines and implements experiment execution. The default executor refreshes or loads BTCUSDT data, materializes intervals, splits data, builds features and targets, trains architecture strategies, evaluates models, records logs, and reports progress.

`backend/app/factories` resolves pluggable behavior by name. It exposes metadata and constructors for architectures, blueprint executors, indicators, TA-Lib indicators, target strategies, and blueprint payload normalization.

`backend/app/infrastructure` isolates external systems. The database package owns SQLAlchemy metadata, session factories, enums, and ORM mappings. The Redis package adapts RQ/Redis queue operations. The Binance package retrieves BTCUSDT klines. Placeholder CSRF and sessions packages mark infrastructure boundaries.

`backend/app/repositories` owns persistence operations. Repositories query and mutate users, blueprints, experiments, models, experiment logs, favorites, market data, system events, and system settings. Mappers convert ORM rows to domain entities. `UnitOfWork` opens one session, attaches repositories, commits on success, and rolls back on failure.

`backend/app/scripts` contains backend command entrypoints. Market-data scripts ingest or refresh BTCUSDT candles, cleanup scripts reset database content for controlled contexts, and the worker script starts background experiment processing.

`backend/app/services` contains reusable application services. Access control resolves authenticated actors and role permissions. Password service hashes and verifies credentials. Session service manages Redis or in-memory server-side sessions. Queue service coordinates jobs. Job metadata service resolves queue details. Market data service refreshes and reads candle data. System settings service reads runtime settings. Versioning service preserves immutable blueprint version rules.

`backend/app/strategies` contains execution plug-ins and shared strategy interfaces. It covers architecture strategies, indicators, targets, data splits, scaling, metrics, log generation, trading simulation, job execution, cancellation, and registry logic. Subfolders separate indicator implementations, log strategies, metric strategies, split strategies, target strategies, and trading strategies.

`backend/app/validators` enforces request rules before persistence. Blueprint validation checks metadata, architecture, indicators, scalers, and parameter ranges. Experiment validation checks BTCUSDT scope, interval, dates, split totals, blueprint access, override shapes, deterministic settings, and permutation bounds.

`backend/app/workers` runs queued experiments. The worker receives job payloads, validates the referenced experiment, moves status through queued/running/completed/failed states, invokes the default executor, persists progress, and handles cancellation or failure paths.

`backend/wsgi.py` exposes the Flask WSGI app and local run entrypoint. `backend/pyproject.toml`, `backend/requirements.txt`, and backend dependency files define Python package metadata, runtime dependencies, and tooling assumptions.

### Frontend Implementation Coverage

`frontend/app` contains route entrypoints and global app wiring. `layout.tsx` wraps all pages in theme, authentication, and shell providers. `page.tsx` chooses dashboard or landing based on auth state. Route folders render dashboard, experiments, blueprints, models, public hub, documentation, jobs, profile, system management, login, and registration surfaces through view components and route guards.

`frontend/app/globals.css` defines global Tailwind layers, theme variables, responsive behavior, and base visual styling used by every screen.

`frontend/components/charts` isolates BTCUSDT chart rendering. It fetches chart data through a hook, normalizes chart series values, and renders the Lightweight Charts price chart with loading, empty, and error boundaries.

`frontend/components/forms` provides reusable form controls. Date, number, select, tokenized parameter, field-row, and error-text components keep wizard and settings forms consistent.

`frontend/components/layout` implements the shell. App shell, top bar, sidebar navigation, navbar, breadcrumbs, page shell, and page header define the repeated structure around module views.

`frontend/components/states` contains reusable loading, empty, and error states. Views use these components instead of duplicating fallback markup.

`frontend/components/status` contains status badges. User role, user status, generic status, and backend health badges normalize visual state language across user, system, and workflow views.

`frontend/components/tables` contains reusable table helpers. Data table, empty row, and toolbar components support dense administrative and listing screens.

`frontend/components/ui` contains low-level UI primitives. Buttons, cards, inputs, labels, badges, and confirmation dialogs provide the shared design vocabulary used by higher-level components.

`frontend/lib/api` is the frontend-backend integration layer. `endpoints.ts` centralizes endpoint paths and base URL handling. `client.ts` wraps `fetch`, includes credentials, obtains CSRF tokens for mutating requests, parses JSON, raises typed API errors, and exposes typed functions for auth, users, blueprints, experiments, models, jobs, logs, market data, docs, hub, and system operations.

`frontend/lib/auth` manages client-side auth state and guards. `AuthProvider` loads the current user from `/auth/me`, stores login state, exposes logout and refresh behavior, and provides `useAuth`. Guards redirect unauthenticated users or users below the required role.

`frontend/lib/routes` defines navigation metadata. It lists app routes, icons, sections, minimum roles, role ranking, and helpers for filtering visible navigation items.

`frontend/lib/theme` provides theme state around the application shell. It manages theme mode and exposes the current theme context to components.

`frontend/lib/validators` contains frontend input validation for registration and login forms. These checks improve user feedback before backend validation still enforces final correctness.

`frontend/lib/utils.ts` contains shared frontend utility helpers, including class-name composition used by components.

`frontend/views` contains page-level implementations. Auth views handle login and registration. User views handle profile and staff management. Dashboard, public hub, documentation, models, jobs, system, blueprints, and experiments each own their module-specific state, API calls, forms, filters, dialogs, and rendering. Wizard views coordinate multi-step blueprint and experiment creation while leaving validation and persistence authority on the backend.

`frontend/package.json`, `frontend/package-lock.json`, `frontend/next.config.ts`, `frontend/tsconfig.json`, Tailwind/PostCSS config, ESLint config, and Jest setup define the frontend runtime, build, typechecking, styling, linting, and test tooling.

### Supporting Root Components

`docs` stores user-facing guides and report chapters. Existing documentation is served by the backend documentation controller only for Markdown files directly under `docs`, while `docs/report` remains a standalone report folder.

`scripts` contains project-level orchestration. The startup script checks required commands and services, verifies backend and frontend dependencies exist, requires `DATABASE_URL`, starts backend, starts worker, starts frontend, and shuts child processes down together.

`.env.example` documents local and deployment environment variables. `README.md` summarizes the project purpose, implemented scope, workflows, role model, and manual verification guidance. `VERSION` provides the application version read by backend health and diagnostics responses.
