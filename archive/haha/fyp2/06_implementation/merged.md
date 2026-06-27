# 6.1 Deployment

The Bitcoin Experimental Engine is implemented as a full-stack web-based system for configuring, executing, monitoring, and reviewing BTCUSDT quantitative research experiments. The implementation converts the analysis and design models into a working application consisting of a browser-facing frontend, a backend API, a relational database, an asynchronous job queue, and a background worker. This deployment structure supports the main project goal of providing a reproducible research environment where users can create reusable experiment templates, submit experiments, track execution progress, and inspect generated model results.

The deployed application separates user interaction from server-side computation. The frontend is implemented as a Next.js web application under `frontend/`, while the backend is implemented as a Flask API under `backend/`. The backend handles authentication, authorization, request validation, persistence, queue orchestration, market-data access, and experiment execution coordination. Long-running experiment processing is delegated to a worker process so that the user interface remains responsive after an experiment is submitted.

The system is deployed locally as a group of cooperating services. PostgreSQL is used as the persistent relational database, Redis is used for queue and supporting runtime infrastructure, the Flask backend exposes JSON APIs, the worker consumes queued experiment jobs, and the Next.js frontend serves the user interface. The startup script under `scripts/` coordinates the local runtime by checking prerequisites and starting the backend, worker, and frontend processes.

## 6.1.1 Implementation Scope

The implementation scope covers the major functional areas required by the system. These include account registration, login, authenticated session handling, role-based access control, staff user management, blueprint authoring, blueprint approval, experiment configuration, market-data retrieval, asynchronous experiment execution, job monitoring, model ranking, experiment log inspection, favorites, public discovery, documentation browsing, and administrative system monitoring.

The system is not implemented as a single monolithic script. Instead, it is organized as a layered web application. The frontend provides route-based pages and reusable interface components. The backend provides controllers, services, validators, repositories, strategies, and worker logic. The database stores durable records, while the queue separates immediate user requests from computationally heavier experiment execution. This structure allows the system to support both interactive workflows and longer-running research jobs.

Table 6.1 summarizes the implemented deployment components and their runtime responsibilities.

**Table 6.1: Deployment Components and Runtime Responsibilities**

| Component                | Source Location                                    | Runtime Responsibility                                                                                                      | Typical Local Runtime            |
| ------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Frontend web application | `frontend/`                                      | Serves the browser interface, route entrypoints, views, forms, charts, authentication state, and API client integration     | Next.js server on port`3000`   |
| Backend API              | `backend/app/`                                   | Exposes HTTP API endpoints, validates requests, enforces access control, coordinates services, and manages persistence      | Flask server on port`5000`     |
| Experiment worker        | `backend/app/workers/` and backend worker script | Consumes queued experiment jobs, updates experiment state, executes the experiment pipeline, and persists results           | Background backend process       |
| PostgreSQL database      | configured through`.env`                         | Stores users, sessions-related records, blueprints, experiments, models, logs, market data, favorites, settings, and events | Database service on port`5432` |
| Redis service            | configured through`.env`                         | Supports queue processing and runtime queue metadata                                                                        | Redis service on port`6379`    |
| Startup orchestration    | `scripts/start_app.sh`                           | Checks required local services and starts the backend, worker, and frontend processes                                       | Shell script                     |
| Test orchestration       | `scripts/test_all.sh`                            | Runs backend and frontend automated test suites in a repeatable sequence                                                    | Shell script                     |

## 6.1.2 Mapping of Modules to System Objectives

The implemented modules directly support the objectives defined for the system. The authentication and authorization modules support controlled access so that normal users, moderators, and administrators can only perform actions suitable for their role. The blueprint module supports reusable experiment design by allowing users to define, validate, submit, approve, and version experiment templates. The experiment module supports reproducible research by persisting experiment configuration and compiling snapshots before execution.

The asynchronous execution modules support server-side processing of long-running jobs. Instead of training models directly inside a browser request, the system queues an experiment job and allows the worker to process it separately. This improves responsiveness and gives users a job-oriented way to monitor progress. The market-data module supports BTCUSDT candle retrieval and local caching so that charts and experiments can use a consistent data source. The model, log, favorites, and public hub modules support result inspection and reuse after experiments are completed.

Table 6.2 maps the implementation modules to the main system objectives.

**Table 6.2: Implementation Modules Mapped to System Objectives**

| System Objective                                           | Implemented Module Support                                                                                                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provide a reproducible BTCUSDT experimentation environment | Experiment compiler, persisted experiment configuration, compiled snapshots, deterministic seed handling, parameter permutations, BTCUSDT market-data cache, and split-first execution flow |
| Allow users to create reusable experiment templates        | Blueprint wizard, blueprint validation, blueprint persistence, approval workflow, versioning behavior, and approved blueprint selection in the experiment wizard                            |
| Enforce controlled user access                             | Registration, login, logout, current-user session lookup, server-managed sessions, route guards, backend access-control service, and role-specific navigation                               |
| Support staff governance                                   | Moderator and administrator permissions, blueprint moderation, user-management operations, and administrative system views                                                                  |
| Execute experiments without blocking the web interface     | Queue service, Redis queue adapter, job metadata service, worker process, job detail endpoints, and cancellation handling                                                                   |
| Provide BTCUSDT market data and visualization              | Market-data controller, Binance-compatible kline connector, candle normalization, local upsert cache, metadata endpoints, and BTCUSDT chart components                                      |
| Support result inspection and research reuse               | Experiment detail view, model rankings, model detail view, experiment logs, downloads, favorites, and Public Hub browsing                                                                   |
| Support operational monitoring                             | System management view, active queue snapshot, settings handling, and system event recording                                                                                                |
| Provide user guidance                                      | Documentation API and Markdown documentation viewer                                                                                                                                         |

## 6.1.3 Deployed Component Interaction

The deployed system follows a clear request and processing flow. A user accesses the application through the browser. The browser loads the Next.js frontend, which renders the appropriate public or authenticated screen. When the user performs an action such as logging in, creating a blueprint, submitting an experiment, or opening a model ranking page, the frontend sends a JSON request to the backend through the configured API path.

The frontend uses the path `/api/backend` as the browser-facing API base. During local deployment, the Next.js configuration rewrites this path to the Flask backend API. The backend then processes the request through its registered controller, calls the relevant service or repository, applies validation and authorization, and returns a structured JSON response. This approach keeps frontend API calls consistent while still allowing the backend to remain a separate service.

When an experiment is submitted, the interaction flow is extended through the queue and worker. The backend first validates the experiment configuration and persists the experiment record. It then queues a background job and immediately returns job metadata to the frontend. The worker later consumes the queued job, loads the experiment, refreshes or reads BTCUSDT market data, executes the experiment pipeline, updates progress, and persists model and log outputs.

The following figure should be included in the final formatted report to illustrate the deployed component interaction.

> Note: Add a deployment interaction diagram here. The diagram should show: Browser -> Next.js Frontend -> Flask API -> PostgreSQL; Flask API -> Redis Queue; Worker -> Redis Queue; Worker -> PostgreSQL; Backend market-data service -> BTCUSDT market-data provider. The diagram should also show that the frontend sends browser API calls through `/api/backend`, while the backend exposes its own `/api` routes.

A text representation of the deployment interaction is shown below.

```text
Browser
  -> Next.js Frontend
      -> /api/backend rewrite
          -> Flask Backend API
              -> PostgreSQL Database
              -> Redis Queue
              -> Market-Data Service
          -> Worker Process
              -> Redis Queue
              -> Experiment Execution Services
              -> PostgreSQL Database
```

## 6.1.4 Local Deployment Flow

The local deployment flow is designed to make the system demonstrable in a development environment. Before the application is started, PostgreSQL and Redis must be available. The backend reads its runtime configuration from `.env`, including the database connection, Redis connection, backend API origin, session settings, and related environment values. The frontend also uses `.env` values to determine how browser API requests should reach the backend.

The backend is started from the `backend/` folder and serves the Flask API. The worker is started as a separate backend process so that it can process queued experiment jobs independently. The frontend is started from the `frontend/` folder and serves the web application. For convenience, the local startup script in `scripts/` performs the main checks and starts the backend, worker, and frontend together.

The typical local startup command is:

```bash
scripts/start_app.sh
```

The startup script checks that required commands are available, verifies that Redis can be reached, confirms that backend and frontend dependencies are installed, verifies that the database configuration exists, starts the backend API, starts the worker, and starts the frontend application. This scripted deployment flow reduces manual setup mistakes and supports repeatable demonstration.

## 6.1.5 Deployment Scope Against User Roles

The deployed system supports different runtime experiences depending on the user role. Guests can view public entry points such as the landing page and authentication screens. Authenticated users can access dashboards, experiments, blueprints, jobs, models, favorites, public hub, documentation, and profile views. Moderators can access staff-level moderation and limited user-management functions. Administrators can access full user-management and system-management functionality.

This role-aware deployment is important because the system includes both research workflows and governance workflows. The same deployed application must support ordinary experiment users, staff reviewers, and administrators without exposing all functions to every account. Frontend route guards improve navigation and usability, while backend access-control checks enforce the actual authorization decisions.

**Table 6.3: Deployed Access Scope by User Role**

| Actor / Role  | Deployed Access Scope                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Guest         | Landing page, registration, login, and readable public guidance where allowed                                       |
| User          | Dashboard, experiment workflow, blueprint workflow, jobs, models, favorites, public hub, documentation, and profile |
| Moderator     | User-level features plus blueprint moderation and staff-permitted user-management actions                           |
| Administrator | Full user-level and moderator-level features plus system management and administrator-only user-management actions  |

## 6.1.6 Deployment Evidence to Include

This subsection should be supported by deployment evidence in the final submitted report. The strongest evidence is a combination of a deployment diagram, a component responsibility table, and selected screenshots of the running application. Source-code screenshots are not necessary in this section because deployment is better explained through runtime structure and system composition.

Recommended visual evidence includes:

- A deployment architecture diagram showing frontend, backend, database, Redis, worker, and market-data provider interaction.
- A screenshot of the frontend running in the browser.
- A screenshot of the backend health endpoint or backend terminal showing the API is running.
- A screenshot of the startup script output showing backend, worker, and frontend services starting.
- A screenshot of a submitted experiment or job detail page showing that asynchronous execution is visible from the user interface.

> Note: Avoid showing local secrets, private database connection strings, or credential values in screenshots. If a terminal screenshot contains environment values, crop or mask them before including it in the report.

## 6.1.7 Summary

In summary, the system is deployed as a modular full-stack application rather than as an isolated experimental script. The Next.js frontend provides the user interface, the Flask backend provides the API and business logic, PostgreSQL provides durable persistence, Redis supports asynchronous queue processing, and the worker executes long-running experiments in the background. The deployment structure supports the project requirements for reproducibility, role-based access, asynchronous execution, result inspection, and administrative monitoring.

This deployment arrangement also prepares the system for future production hardening. Although the current implementation is primarily suited for local development and assessment demonstration, the same component separation can be adapted to a server environment with production process management, HTTPS, secured environment variables, managed database services, and monitoring.

---

# 6.2 Development Environment

This section describes the development environment used to implement the Bitcoin Experimental Engine. The system was developed as a full-stack web application; therefore, the environment combines backend technologies, frontend technologies, database services, queue services, testing tools, and local automation scripts. The purpose of documenting the development environment is to show how the system was built, how the implementation tools support the project objectives, and how another developer can reproduce the implementation environment.

The development environment is organized around three main source areas. The `backend/` folder contains the Flask API, services, repositories, validators, execution logic, worker code, and database integration. The `frontend/` folder contains the Next.js web application, views, reusable components, route guards, API client, and frontend tests. The `scripts/` folder contains project-level automation for starting the application and running tests. Runtime configuration values are supplied through `.env`, which defines environment-specific settings such as database connection, Redis connection, backend origin, session configuration, and frontend API behavior.

## 6.2.1 Programming Languages Used

The implementation uses multiple programming languages because the system includes backend services, frontend user interfaces, database persistence, automation scripts, and documentation. Python is used for the backend because the system requires server-side APIs, data processing, machine-learning experimentation, and background worker execution. TypeScript is used for the frontend because it provides typed React components, safer API integration, and maintainable state handling for complex forms such as the blueprint and experiment wizards.

SQL is used indirectly through PostgreSQL schema and migration work because the system stores durable relational records such as users, blueprints, experiments, models, experiment logs, market data, favorites, settings, and system events. Bash is used to automate repeated local operations such as starting the backend, worker, and frontend together. Markdown is used for user-facing documentation and technical report preparation. This combination of languages is suitable because each language is used where it is strongest: Python for backend and data-processing work, TypeScript for user-interface correctness, SQL for structured persistence, Bash for automation, and Markdown for documentation.

**Table 6.4: Programming Languages Used in the Implementation**

| Language           | Used In                                 | Implementation Purpose                                                                                                                                                                  |
| ------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Python 3.11        | `backend/`                            | Implements Flask API controllers, configuration loading, services, repositories, validators, experiment execution, worker processing, market-data handling, and automated backend tests |
| TypeScript         | `frontend/`                           | Implements route entrypoints, React views, reusable components, authentication guards, API client functions, frontend validators, and frontend test fixtures                            |
| JavaScript runtime | `frontend/`                           | Supports the Next.js and React runtime environment used by the browser-facing application                                                                                               |
| SQL                | PostgreSQL database and migration layer | Supports relational persistence, schema constraints, table relationships, and data integrity                                                                                            |
| Bash               | `scripts/`                            | Automates startup and testing workflows for local development and demonstration                                                                                                         |
| Markdown           | `docs/`                               | Stores system documentation, user guidance, and FYP report material                                                                                                                     |

> Note: No screenshot is required for this subsection. A table is more useful because it clearly maps each language to its implementation purpose.

## 6.2.2 Frameworks and Libraries

The project uses different frameworks and libraries for backend implementation, frontend implementation, data processing, model evaluation, queueing, charting, and testing. The backend libraries support API routing, security, persistence, data processing, market-data retrieval, and machine-learning workflows. The frontend libraries support route-based rendering, reusable components, responsive styling, chart display, and browser-based testing.

### Backend Frameworks and Libraries

The backend is built using Flask as the HTTP API framework. Flask is suitable for this project because it allows the backend to be organized into controllers, services, repositories, and worker entrypoints without forcing unnecessary framework complexity. SQLAlchemy provides the object-relational mapping layer used by repositories, while Alembic supports database migration management. Redis and RQ are used to separate long-running experiment execution from immediate API responses.

The experiment-related backend functionality uses scientific and machine-learning libraries. pandas, polars, and numpy support data processing for BTCUSDT candles, feature generation, split handling, and numerical calculations. scikit-learn supports model training and evaluation for implemented model architectures. The Binance connector is used by the market-data integration layer to retrieve BTCUSDT kline data before it is normalized and cached locally.

**Table 6.5: Backend Frameworks and Libraries**

| Framework / Library | Implementation Use                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Flask               | Creates the backend application, registers API routes, and handles HTTP requests and responses  |
| Flask-WTF           | Provides CSRF protection for state-changing backend requests                                    |
| SQLAlchemy          | Implements database engine setup, ORM mapping, sessions, and repository-backed persistence      |
| Alembic             | Manages database schema migration and database setup workflow                                   |
| Redis               | Provides queue-related runtime infrastructure and queue metadata support                        |
| RQ                  | Provides Redis-backed background job queue processing                                           |
| pandas              | Supports tabular data operations used in data preparation and experiment-related processing     |
| polars              | Supports efficient dataframe operations in experiment execution and feature processing          |
| numpy               | Supports numerical calculations required by indicators, targets, metrics, and model processing  |
| scikit-learn        | Supports model training and evaluation through implemented architecture adapters                |
| binance-connector   | Retrieves BTCUSDT market-data candles from a Binance-compatible API source                      |
| Werkzeug            | Supports secure backend utilities such as credential hashing and Flask runtime behavior         |
| pytest              | Executes backend automated tests for controllers, services, validators, workers, and strategies |

### Frontend Frameworks and Libraries

The frontend is implemented using Next.js and React. Next.js provides route entrypoints under `frontend/app`, development server support, build behavior, and API rewrite configuration. React provides the component model used to implement views, layout components, forms, tables, chart containers, state components, and interactive user workflows. TypeScript strengthens frontend maintainability by allowing API payloads, component props, and view state to be expressed more explicitly.

Tailwind CSS is used to implement consistent interface styling and responsive layout behavior. Reusable UI primitives and layout components are organized under `frontend/components`, while page-level behavior is organized under `frontend/views`. The BTCUSDT price chart is implemented using lightweight charting support, and frontend behavior is verified using Jest with Testing Library.

**Table 6.6: Frontend Frameworks and Libraries**

| Framework / Library | Implementation Use                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Next.js             | Provides route-based frontend application structure, development server, build workflow, and backend API rewrite behavior |
| React               | Implements reusable user-interface components, stateful views, forms, dialogs, tables, and page interactions              |
| TypeScript          | Provides static typing for component props, API payloads, view state, route behavior, and tests                           |
| Tailwind CSS        | Provides utility-based styling, responsive layout support, and consistent visual design across pages                      |
| Radix UI Slot       | Supports reusable and composable UI primitives                                                                            |
| lucide-react        | Provides icons used in navigation, buttons, status areas, and interface actions                                           |
| lightweight-charts  | Renders BTCUSDT price charts in dashboard and experiment-related views                                                    |
| Jest                | Runs frontend automated test suites                                                                                       |
| Testing Library     | Tests React components and user-facing behavior through rendered output                                                   |

> Note: If a figure is added here, use a technology-stack diagram with two columns: backend stack and frontend stack. Avoid screenshots of dependency files because summarized framework tables are clearer for a report reader.

## 6.2.3 IDEs and Tools

The implementation was developed using a code editor, terminal environment, package managers, testing tools, database tools, and browser developer tools. The code editor was used to edit Python backend files, TypeScript frontend files, automation scripts, and documentation. The terminal was used to run the backend API, frontend development server, worker process, automated tests, database commands, and startup scripts.

The project uses npm for frontend dependency management and frontend scripts. The backend uses a Python virtual environment to isolate Python dependencies from the system Python installation. pytest is used for backend testing, while Jest and Testing Library are used for frontend testing. Redis CLI is used by the startup process to check whether Redis is reachable before the application starts. Browser developer tools are used to inspect page rendering, network requests, authentication state, and API responses during manual verification.

**Table 6.7: Development Tools Used**

| Tool                       | Purpose in Development                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Code editor                | Editing backend source files, frontend source files, scripts, and Markdown documentation                            |
| Terminal / shell           | Running local services, startup scripts, tests, worker processes, and setup commands                                |
| npm                        | Installing frontend dependencies and running frontend commands such as development server, tests, and type checking |
| Python virtual environment | Isolating backend Python dependencies for consistent backend execution                                              |
| pytest                     | Running backend automated tests                                                                                     |
| Jest                       | Running frontend automated tests                                                                                    |
| Testing Library            | Testing frontend components from a user-interface perspective                                                       |
| Alembic                    | Managing database schema setup and migration workflow                                                               |
| Redis CLI                  | Checking Redis availability before starting local services                                                          |
| Browser developer tools    | Inspecting frontend rendering, network requests, API responses, and client-side behavior                            |
| `scripts/start_app.sh`   | Starting backend, worker, and frontend processes for local demonstration                                            |
| `scripts/test_all.sh`    | Running backend and frontend test suites in a repeatable order                                                      |

The use of project-level scripts reduces the number of manual commands required during development. Instead of starting each service independently every time, the startup script verifies important prerequisites and starts the backend, worker, and frontend together. Similarly, the test script provides a repeatable way to execute backend and frontend automated tests.

> Note: A screenshot may be added here showing the project opened in the code editor with only the relevant top-level folders visible: `backend`, `frontend`, `docs`, and `scripts`. Do not show hidden folders, generated folders, or local runtime files.

## 6.2.4 Version Control System

Git is used as the version control system for the project. It tracks changes to backend source code, frontend source code, scripts, and documentation. This is important for an implementation-heavy project because it allows development progress, bug fixes, test additions, and documentation changes to be traced over time.

The source-code organization also supports version control clarity. Backend implementation files are kept under `backend/`, frontend implementation files are kept under `frontend/`, report and documentation material is kept under `docs/`, and local automation scripts are kept under `scripts/`. This separation makes it easier to review changes by responsibility. For example, a change to an experiment validator can be reviewed separately from a change to a frontend wizard page or a startup script.

Version control also supports safer development because changes can be reviewed, reverted, compared, or grouped according to feature work. During implementation, this is useful when adding modules such as authentication, blueprint authoring, experiment execution, queue handling, market-data integration, and system management.

> Note: A screenshot of commit history is not required unless specifically requested by the faculty. If included, it should not show private repository information.

## 6.2.5 Operating System Used

The system was developed and tested in a Linux-based local development environment. This environment is suitable because the project uses Python, Node.js, PostgreSQL, Redis, shell scripts, and terminal-based workflow commands. The operating environment supports running multiple services at the same time, which is necessary because the implemented system requires a frontend server, backend API server, database service, Redis service, and background worker process.

**Table 6.8: Operating Environment Used for Development**

| Environment Aspect  | Description                                                          |
| ------------------- | -------------------------------------------------------------------- |
| Operating system    | Linux-based local development environment                            |
| Backend runtime     | Python 3.11 in a backend virtual environment                         |
| Frontend runtime    | Node.js and npm environment for Next.js and React                    |
| Database runtime    | PostgreSQL service configured through`.env`                        |
| Queue runtime       | Redis service configured through`.env`                             |
| Browser environment | Desktop-class browser used for UI testing and demonstration          |
| Shell environment   | Bash-compatible terminal used for startup scripts and test execution |

The local environment reflects the deployed component structure of the system. Even though the services run on the same development machine, they remain logically separated. The frontend communicates with the backend through the configured API route, the backend communicates with PostgreSQL and Redis, and the worker processes queued experiment jobs independently from the frontend request flow.

## 6.2.6 Environment Configuration

The project uses `.env` to define environment-specific configuration values. This allows the same source code to run in different environments by changing configuration values rather than modifying implementation files. The backend reads configuration values such as the Flask environment, application secret, database connection, Redis connection, session settings, market-data base URL, and allowed frontend origins. The frontend uses configuration values to determine how browser requests should reach the backend API.

The most important environment values are summarized in Table 6.9.

**Table 6.9: Environment Configuration Values**

| Configuration Value          | Used By                        | Purpose                                                                  |
| ---------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| `FLASK_ENV`                | Backend                        | Selects backend runtime environment behavior                             |
| `SECRET_KEY`               | Backend                        | Supports Flask security-related runtime behavior                         |
| `DATABASE_URL`             | Backend and database tooling   | Defines the PostgreSQL database connection used by the system            |
| `REDIS_URL`                | Backend and worker             | Defines the Redis connection used for queue-related runtime behavior     |
| `SESSION_BACKEND`          | Backend                        | Selects the session storage approach                                     |
| `SESSION_TIMEOUT_MINUTES`  | Backend                        | Controls session lifetime behavior                                       |
| `BINANCE_BASE_URL`         | Backend market-data service    | Defines the BTCUSDT market-data provider base URL                        |
| `BACKEND_API_ORIGIN`       | Frontend rewrite configuration | Defines where frontend rewrite requests should forward backend API calls |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API client            | Defines the browser-facing API base path used by frontend requests       |
| `CORS_ALLOW_ORIGINS`       | Backend                        | Defines allowed frontend origins for API requests                        |

> Note: Do not include a screenshot of the `.env` file if it contains private local values. If evidence is required, show only a sanitized table like Table 6.9.

## 6.2.7 Development Environment Summary

Overall, the development environment combines tools that are appropriate for a modular research web application. Python and Flask provide the backend API and experiment-processing foundation. PostgreSQL and SQLAlchemy provide relational persistence and traceability for research artifacts. Redis and RQ support asynchronous experiment execution. Next.js, React, TypeScript, and Tailwind CSS provide the frontend implementation foundation. pytest, Jest, and Testing Library support automated verification across backend and frontend modules.

This development environment supports the implementation objectives because it allows the system to be developed, tested, and demonstrated as a complete application. The environment also supports future maintainability: backend and frontend code are separated, dependencies are managed by their respective ecosystems, runtime values are configured through `.env`, and repeatable commands are provided through scripts.

---

# 6.3 System Configuration and Setup

This section explains how the implemented system is configured and started in the local development and demonstration environment. The system is not a single-process application; it consists of a frontend web application, backend API, database service, queue service, and worker process. Each component has a specific responsibility and is configured through source files, package tools, runtime services, and `.env` values.

The setup process supports the implementation requirements by making the application repeatable to run, test, and demonstrate. The backend must be able to connect to persistent storage and the queue service, the frontend must be able to forward browser API calls to the backend, and the worker must be able to process queued experiment jobs independently from the web request cycle. These setup decisions allow the system to support authentication, blueprint management, experiment configuration, asynchronous execution, market-data handling, result inspection, and administrative monitoring.

## 6.3.1 Backend Setup

The backend is implemented as a Flask application under `backend/app`. The application factory initializes the Flask runtime, loads environment-based configuration, configures CSRF handling, registers API routes, applies API response behavior, records system events, and initializes database metadata. The backend exposes its runtime application through `backend/wsgi.py`, which is used as the local backend entrypoint.

The backend is configured to run as a separate API service. In the local setup, the API is served on port `5000`, and all backend feature routes are registered under the `/api` route prefix. This includes authentication, users, blueprints, experiments, jobs, logs, market data, models, public hub, documentation, and system endpoints. This clear API boundary allows the frontend to treat the backend as a service rather than directly importing backend logic.

Runtime configuration is supplied through `.env`. The backend reads values for database connectivity, Redis connectivity, session behavior, market-data provider configuration, application environment, and cross-origin access. This prevents environment-specific values from being hard-coded into source files. It also allows the same backend implementation to be started with different local or deployment settings by changing configuration values rather than modifying code.

The backend uses PostgreSQL as the required relational database and Redis as the queue-related runtime service. PostgreSQL stores durable system data such as users, blueprints, experiments, models, logs, market candles, favorites, settings, and events. Redis supports job queue behavior and queue metadata used by asynchronous experiment execution. Because these services are external to the Flask process, they must be available before the backend and worker are used for a complete demonstration.

**Table 6.10: Backend Configuration Items**

| Configuration Item          | Source   | Used By                                      | Purpose                                                            |
| --------------------------- | -------- | -------------------------------------------- | ------------------------------------------------------------------ |
| `FLASK_ENV`               | `.env` | Backend application                          | Selects backend runtime environment behavior                       |
| `DATABASE_URL`            | `.env` | Backend database layer and migration tooling | Defines the PostgreSQL database connection used by the application |
| `REDIS_URL`               | `.env` | Queue service and worker                     | Defines the Redis connection used for asynchronous job processing  |
| `SESSION_BACKEND`         | `.env` | Backend session handling                     | Selects the session storage approach used by the backend           |
| `SESSION_TIMEOUT_MINUTES` | `.env` | Backend session handling and system settings | Controls how long authenticated sessions remain valid              |
| `BINANCE_BASE_URL`        | `.env` | Market-data service                          | Defines the BTCUSDT market-data provider base URL                  |
| `CORS_ALLOW_ORIGINS`      | `.env` | Backend API response handling                | Defines allowed frontend origins for browser API requests          |
| `BACKEND_API_ORIGIN`      | `.env` | Frontend rewrite configuration               | Defines the backend origin used by frontend request forwarding     |

The backend startup can be performed directly from the `backend/` folder when the required services are already running. The command below shows the local backend startup flow using environment-based configuration. Values that are environment-specific should be supplied from `.env` instead of being written directly into report screenshots.

```bash
cd backend
PYTHONPATH=$(pwd) .venv/bin/python wsgi.py
```

> Note: Add a screenshot of the backend terminal after startup and a browser or terminal check of the backend health endpoint. Crop or mask any local environment values before placing the screenshot in the final report.

## 6.3.2 Backend Request Handling Configuration

The backend request-handling setup includes route registration, CSRF handling, CORS handling, database access, and system event recording. These functions are configured at the application boundary so that individual feature controllers can focus on their own request logic. For example, the authentication controller handles login and registration, while the experiment controller handles experiment submission and detail retrieval.

CSRF handling protects state-changing requests. The frontend obtains a CSRF token and sends it with mutating API requests. If the token is invalid or missing for protected actions, the backend returns a structured error response. This configuration is important because the application uses browser-based sessions and performs actions such as creating experiments, creating blueprints, updating users, submitting approval requests, and cancelling jobs.

CORS handling is configured so that the frontend can communicate with the backend during local development. The backend accepts only configured origins. In the local setup, the frontend normally reaches the backend through the Next.js rewrite path, which reduces cross-origin complexity. However, the backend still includes explicit CORS handling for API requests so that local and future deployment environments can be configured safely.

System event recording is applied after API requests. This gives the administrative side of the system a record of operational activity, such as route access and management actions. The event recording behavior supports traceability and system monitoring, which are important for a system that includes user roles, administrative operations, queued jobs, and experiment execution.

**Table 6.11: Backend Setup Responsibilities**

| Backend Setup Area     | Implementation Responsibility                                           |
| ---------------------- | ----------------------------------------------------------------------- |
| Application factory    | Creates Flask application and loads configuration                       |
| Route registry         | Registers all API feature controllers under the backend API prefix      |
| CSRF handling          | Protects state-changing browser requests                                |
| CORS handling          | Allows configured frontend origins to access API routes                 |
| Database session setup | Connects repositories and ORM mappings to PostgreSQL                    |
| Queue setup            | Allows experiment jobs to be submitted to Redis-backed queue processing |
| System event recording | Captures operational events for administrative traceability             |
| Response helpers       | Standardizes success, error, and validation response shapes             |

## 6.3.3 Frontend Setup

The frontend is implemented as a Next.js application under `frontend/`. Route entrypoints are placed under `frontend/app`, while the main screen logic is implemented under `frontend/views`. This separation keeps route files simple and allows each view to focus on page-level behavior. For example, dashboard, experiment, blueprint, job, model, public hub, documentation, profile, user-management, and system-management screens are implemented as view components.

The frontend setup also includes reusable components under `frontend/components`. These components provide the application shell, navigation, page headers, forms, chart rendering, tables, loading states, empty states, error states, status badges, and UI primitives. This component structure allows screens to remain visually consistent and avoids duplicating layout or state-handling patterns across different modules.

The frontend communicates with the backend through a centralized API client and endpoint map under `frontend/lib/api`. Instead of hard-coding backend URLs inside individual views, the frontend uses shared endpoint definitions. This improves maintainability because endpoint changes can be managed in one location. Authentication state is handled under `frontend/lib/auth`, which includes the authentication provider, current-user handling, and route guards.

The local frontend runtime is started from the `frontend/` folder. During development, the frontend serves the browser application on port `3000`. The frontend also provides a rewrite configuration so that browser requests to `/api/backend/*` are forwarded to the backend API. This allows the browser to call the backend through the frontend origin while preserving a separate Flask API service behind it.

**Table 6.12: Frontend Configuration and Source Areas**

| Frontend Area                   | Purpose                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `frontend/app/`               | Defines Next.js route entrypoints                                              |
| `frontend/views/`             | Implements page-level screen behavior and workflow logic                       |
| `frontend/components/`        | Provides reusable layout, UI, form, chart, state, table, and status components |
| `frontend/lib/api/`           | Centralizes API endpoint definitions and request handling                      |
| `frontend/lib/auth/`          | Provides authentication state, current-user loading, and route guards          |
| `frontend/lib/routes/`        | Defines navigation metadata and role-aware route visibility                    |
| `frontend/lib/theme/`         | Provides frontend theme handling                                               |
| `frontend/lib/validators/`    | Provides client-side validation for selected forms                             |
| `frontend/next.config.ts`     | Configures frontend request rewriting to the backend API                       |
| `frontend/tailwind.config.ts` | Configures frontend styling behavior                                           |

The typical frontend startup command is:

```bash
cd frontend
npm run dev
```

> Note: Add screenshots of the landing page, dashboard, and one workflow page such as the Blueprint Wizard or Experiment Wizard. Use realistic demonstration data and avoid showing hidden folders, generated build folders, or local runtime files.

## 6.3.4 Frontend API Proxy and Route Configuration

The frontend API proxy is an important setup feature because it connects the browser-facing Next.js application to the Flask backend API. In browser runtime, the frontend uses `/api/backend` as its API base path. The Next.js rewrite configuration forwards this path to the backend API origin. As a result, the browser can make API requests through the frontend server, while the backend continues to expose its own `/api` route structure.

This setup improves local development because the frontend can call backend endpoints consistently without each view needing to know the full backend address. It also helps reduce common browser integration issues by keeping the browser-facing API path under the frontend server. The backend still performs its own authentication, authorization, validation, and response handling; the frontend rewrite only forwards the request.

The simplified flow is shown below.

```text
Browser request
  -> Next.js frontend route or view
  -> frontend API client
  -> /api/backend/*
  -> Next.js rewrite
  -> Flask backend /api/*
  -> backend controller, service, repository, or queue action
```

> Note: Add a small diagram showing the API proxy flow. The diagram should distinguish the frontend browser path `/api/backend/*` from the backend API route prefix `/api/*`.

## 6.3.5 Database Setup

The database setup uses PostgreSQL as the persistent storage service. The backend connects to PostgreSQL through the database value supplied by `.env`. The database stores the persistent records required by the system, including users, blueprints, experiments, models, experiment logs, market-data candles, favorites, system settings, and system events.

SQLAlchemy is used by the backend to configure the database engine, sessions, ORM mappings, and repository access. Repositories then provide focused persistence operations for each domain area. This prevents controllers from directly handling database details and supports a more maintainable data access structure.

Alembic is used for database schema management. It supports controlled database setup by applying schema changes through migration commands. This is important because the application uses several related tables and must preserve consistency between source code, database schema, and runtime behavior.

The typical database setup flow is:

```text
Configure PostgreSQL service
Set database connection in .env
Apply database schema setup or migration command
Start backend API
Verify backend can connect to the database
```

> Note: If a screenshot is included, show only a sanitized database tool view listing table names. Do not show local connection details or sensitive configuration values.

## 6.3.6 Queue and Worker Setup

The queue setup uses Redis as the runtime service for queued experiment jobs. When a user submits a valid experiment, the backend creates an experiment record and places a job into the queue. The backend then returns queue metadata to the frontend so that the user can see that the experiment has been accepted for asynchronous execution.

The worker is started as a separate backend process. Its responsibility is to consume queued experiment jobs, load the referenced experiment, update the experiment status, execute the experiment pipeline, report progress, and persist resulting model and log data. Keeping the worker separate from the backend API prevents long-running experiment work from blocking normal web requests.

The worker startup command is executed from the backend context:

```bash
cd backend
PYTHONPATH=$(pwd) .venv/bin/python -m app.scripts.run_worker
```

The queue-worker relationship is summarized in Table 6.13.

**Table 6.13: Queue and Worker Setup**

| Component              | Setup Requirement                                     | Runtime Responsibility                                   |
| ---------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| Redis service          | Must be reachable through`.env` queue configuration | Stores queued job information and queue metadata         |
| Backend queue service  | Configured inside backend service layer               | Enqueues validated experiment jobs                       |
| Worker process         | Started as a separate backend process                 | Consumes queued jobs and executes experiments            |
| Job detail API         | Registered through backend API routes                 | Allows users to view job status and request cancellation |
| System management view | Available to administrator role                       | Allows queue visibility and operational monitoring       |

> Note: Add a screenshot of the Job Detail page or System Management queue view after an experiment has been submitted. This provides better evidence than only showing a terminal process.

## 6.3.7 Build Tools and Package Managers

The project uses separate package and build tooling for backend and frontend development. The backend uses a Python virtual environment and Python dependency definitions under `backend/`. This keeps backend dependencies isolated from the operating system environment. The frontend uses npm scripts to run the development server, tests, type checking, and build-related workflows.

Testing tools are also part of the setup. Backend tests are executed using pytest, while frontend tests are executed using Jest and Testing Library. These testing tools are used during implementation to confirm that backend services, validators, controllers, workers, frontend views, route guards, and API behavior continue to work after changes.

**Table 6.14: Build Tools and Package Managers**

| Tool                            | Used In       | Purpose                                                  |
| ------------------------------- | ------------- | -------------------------------------------------------- |
| Python virtual environment      | `backend/`  | Isolates backend runtime dependencies                    |
| Python dependency configuration | `backend/`  | Defines backend runtime and development dependencies     |
| pytest                          | `backend/`  | Runs backend automated tests                             |
| Alembic                         | `backend/`  | Applies database schema setup and migration workflow     |
| npm                             | `frontend/` | Installs frontend dependencies and runs frontend scripts |
| Next.js scripts                 | `frontend/` | Starts, builds, and serves the frontend application      |
| TypeScript compiler             | `frontend/` | Checks frontend type correctness                         |
| Jest                            | `frontend/` | Runs frontend automated tests                            |
| Testing Library                 | `frontend/` | Verifies frontend behavior through rendered components   |
| Shell scripts                   | `scripts/`  | Automates startup and full test execution                |

The main frontend development commands are:

```bash
cd frontend
npm run dev
npm run typecheck
npm test -- --runInBand
```

The main backend development commands are:

```bash
cd backend
.venv/bin/pytest -q
```

> Note: If terminal evidence is shown in this section, prefer screenshots of command results for `npm run typecheck`, frontend tests, backend tests, or the startup script. Avoid showing generated folder listings.

## 6.3.8 Startup and Test Scripts

The project includes shell scripts under `scripts/` to reduce repeated manual setup commands. The startup script checks that required commands are available, checks that Redis is reachable, confirms that backend and frontend dependencies are present, verifies that the database configuration is available, starts the backend API, starts the worker, starts the frontend development server, and stops child processes when the startup session ends.

The high-level startup process is shown in the following Program Design Language style pseudocode.

```text
PROCEDURE Start Application
  VERIFY required runtime commands exist
  VERIFY Redis service is reachable
  VERIFY backend runtime environment is available
  VERIFY frontend dependencies are available
  IF database configuration is missing THEN
    DISPLAY configuration error
    TERMINATE startup
  ENDIF
  START backend API process
  START experiment worker process
  START frontend development server
  WAIT for service process status
  WHEN stopping application
    STOP backend, worker, and frontend processes safely
ENDPROCEDURE
```

The test script provides a repeatable way to execute the backend and frontend automated test suites. This supports implementation quality because the developer can verify both sides of the system using one project-level command.

The typical full test command is:

```bash
scripts/test_all.sh
```

> Note: Add a screenshot of the startup script output when all services start correctly. For the testing script, include either a terminal screenshot or a copied summary of passed test counts after the final verification run.

## 6.3.9 Setup Verification Checklist

After configuration and setup are completed, the system should be verified using a short checklist. This checklist ensures that the services are available before user workflows are tested.

**Table 6.15: Local Setup Verification Checklist**

| No. | Verification Item               | Expected Result                                                                      |
| --- | ------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | PostgreSQL service is running   | Backend can connect to the database using`.env` configuration                      |
| 2   | Redis service is running        | Startup script or worker can reach Redis                                             |
| 3   | Backend API starts successfully | Flask backend responds on local backend port                                         |
| 4   | Frontend starts successfully    | Browser can open the Next.js frontend on local frontend port                         |
| 5   | Frontend API rewrite works      | Browser API requests through`/api/backend` reach backend `/api` routes           |
| 6   | Worker starts successfully      | Worker waits for queued experiment jobs                                              |
| 7   | Authentication flow works       | User can register or log in and reach authenticated routes                           |
| 8   | Experiment submission works     | Valid experiment creates queued job metadata                                         |
| 9   | Job status is visible           | Job list or detail page shows queued, running, completed, failed, or cancelled state |
| 10  | Test script runs                | Backend and frontend test commands complete as expected                              |

## 6.3.10 Summary

The system configuration and setup are designed to support a modular full-stack application. The Flask backend is configured as a separate API service, the Next.js frontend is configured as the browser-facing application, PostgreSQL provides persistent storage, Redis supports queued job processing, and the worker performs long-running experiment execution outside the web request cycle.

Environment-specific values are placed in `.env`, while source code remains organized by responsibility under `backend/`, `frontend/`, and `scripts/`. The frontend API rewrite connects the browser-facing application to the backend API, and the startup script simplifies local demonstration by coordinating the backend, worker, and frontend processes. This setup supports the system requirements for authenticated workflows, role-based access, reproducible experiment configuration, asynchronous execution, and result inspection.

---

# 6.4 Database Implementation

This section describes how persistent storage is implemented for the Bitcoin Experimental Engine. The system uses a relational database design because the application must preserve users, roles, blueprints, experiments, jobs, models, logs, market data, favorites, settings, and system events in a structured and traceable way. Relational persistence is especially important for this project because experiment results must remain linked to the exact user, blueprint, configuration, model parameters, and generated logs that produced them.

The backend database implementation is located mainly under `backend/app/infrastructure/database`, `backend/app/repositories`, and `backend/app/domain`. The infrastructure layer defines SQLAlchemy database configuration and ORM mappings. The repository layer provides controlled data access operations. The domain layer defines application-level data objects used by services, controllers, workers, validators, and execution components. The database connection is configured through `.env`, allowing the source code to remain independent from local machine settings.

## 6.4.1 Database Schema Design

The database is implemented using PostgreSQL as the persistent relational storage engine. PostgreSQL was selected because the system requires durable relational records, uniqueness rules, foreign-key relationships, structured JSON fields, numeric precision for financial and evaluation values, and reliable transaction handling. SQLAlchemy is used as the object-relational mapping layer so that backend repositories can work with Python objects while still preserving relational database structure.

The database schema is designed around the main business objects of the system: users, blueprints, experiments, models, experiment logs, BTCUSDT candles, favorites, system settings, and system events. These objects map directly to the implemented source areas in the backend. For example, user records support authentication and role-based access, blueprint records support reusable experiment templates, experiment records support submitted execution requests, and model and log records support result inspection after execution.

The schema also supports reproducibility. Experiment records store configuration details such as selected blueprint, interval, date range, split ratios, deterministic setting, seed value, parameter overrides, job status, and compiled snapshots. Model records store parameter combinations, parameter hashes, and evaluation metrics. Experiment log records store structured execution artifacts. This means a completed experiment can be inspected later without relying on temporary runtime files.

The overall database design follows a normalized relational structure with selected JSON fields where flexible structured configuration is required. Blueprint indicator definitions, feature definitions, architecture configuration, experiment parameter overrides, compiled snapshots, model parameters, and log metrics are stored as structured JSON values. This hybrid approach keeps core ownership and relationship data relational while allowing experiment-specific configuration to remain flexible.

> Note: Add a simplified ERD figure after this paragraph. The ERD should show `User`, `Blueprint`, `Experiment`, `Model`, `ExperimentLog`, `BTCUSDTKline`, `FavoriteBlueprint`, `FavoriteModel`, `SystemSetting`, and `SystemEvent`. If the complete ERD becomes too large, place the full ERD in an appendix and keep a simplified version here.

**Table 6.16: Database Entity Responsibilities**

| Entity / Table        | Implementation Responsibility                                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`              | Stores account identity, username, email, credential hash, display name, role, status, and timestamps                                                                              |
| `Blueprint`         | Stores reusable experiment templates including metadata, indicators, features, architecture configuration, approval state, version, and parent relationship                        |
| `Experiment`        | Stores submitted experiment configuration, selected blueprint, dataset range, split configuration, execution state, job identifier, deterministic settings, and compiled snapshots |
| `Model`             | Stores trained model artifacts, parameter sets, parameter hashes, and evaluation metrics such as Sharpe, accuracy, precision, and recall                                           |
| `ExperimentLog`     | Stores structured experiment execution artifacts linked to experiments and models                                                                                                  |
| `BTCUSDTKline`      | Stores cached BTCUSDT candle data used by charts and experiment execution                                                                                                          |
| `FavoriteBlueprint` | Stores user-saved blueprint references                                                                                                                                             |
| `FavoriteModel`     | Stores user-saved model references                                                                                                                                                 |
| `SystemSetting`     | Stores key-value operational settings used by administrative functions                                                                                                             |
| `SystemEvent`       | Stores traceable system activity, route events, and administrative actions                                                                                                         |

## 6.4.2 SQL Database Tables

The implemented database tables are mapped using SQLAlchemy ORM classes under the backend infrastructure database layer. The table names use domain-oriented names so that they remain aligned with the analysis and design models. Each table has a specific responsibility and is accessed through a repository rather than being manipulated directly by frontend code.

**Table 6.17: Implemented Database Tables**

| Table                 | Primary Responsibility                                                    | Important Implemented Fields                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`              | Stores registered user accounts and role information                      | `UserID`, `Username`, `Email`, `PasswordHash`, `Name`, `Role`, `Status`, `CreatedAt`, `UpdatedAt`                                                                                                                                                                                                                                                                                                                                                 |
| `Blueprint`         | Stores reusable blueprint definitions and approval/versioning information | `BlueprintID`, `UserID`, `Name`, `Description`, `Indicators`, `Features`, `Architecture`, `ApprovalState`, `SubmittedAt`, `Version`, `ParentID`, `CreatedAt`, `UpdatedAt`                                                                                                                                                                                                                                                                 |
| `Experiment`        | Stores submitted experiment records and execution state                   | `ExperimentID`, `UserID`, `BlueprintID`, `Name`, `Description`, `Interval`, `StartDate`, `EndDate`, `StartDateTime`, `EndDateTime`, `TrainSplit`, `ValSplit`, `TestSplit`, `ParameterOverrides`, `Status`, `Progress`, `CurrentStage`, `EtaSeconds`, `Success`, `JobID`, `CompiledBlueprintSnapshot`, `CompiledExperimentSnapshot`, `Deterministic`, `Seed`, `MaxPermutationCount`, `RequestedPermutationCount` |
| `Model`             | Stores evaluated model outputs for each experiment parameter set          | `ModelID`, `ExperimentID`, `Parameters`, `ParameterHash`, `Sharpe`, `Accuracy`, `Precision`, `Recall`, `CreatedAt`                                                                                                                                                                                                                                                                                                                                |
| `ExperimentLog`     | Stores model-level experiment logs and metrics                            | `ExperimentLogID`, `ExperimentID`, `ModelID`, `Timestamp`, `Signal`, `Prediction`, `Metrics`, `CreatedAt`                                                                                                                                                                                                                                                                                                                                           |
| `BTCUSDTKline`      | Stores BTCUSDT OHLCV candle cache                                         | `Timestamp`, `Open`, `High`, `Low`, `Close`, `Volume`, `CreatedAt`, `UpdatedAt`                                                                                                                                                                                                                                                                                                                                                                     |
| `FavoriteBlueprint` | Stores many-to-many user-to-blueprint saved items                         | `UserID`, `BlueprintID`, `CreatedAt`                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `FavoriteModel`     | Stores many-to-many user-to-model saved items                             | `UserID`, `ModelID`, `CreatedAt`                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `SystemSetting`     | Stores administrative settings as key-value records                       | `Key`, `Value`, `UpdatedAt`                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `SystemEvent`       | Stores traceable system events                                            | `SystemEventID`, `Scope`, `Action`, `ActorID`, `ActorUsername`, `TargetType`, `TargetID`, `Message`, `CreatedAt`                                                                                                                                                                                                                                                                                                                                  |

The `User` table is the root of several ownership relationships. A user can own multiple blueprints and experiments, and can also save favorite blueprints or favorite models. The `Blueprint` table contains both relational fields and JSON fields because blueprint definitions contain flexible experiment configuration such as indicators, feature definitions, and model architecture settings. The `Experiment` table contains relational ownership links, numeric split values, execution status fields, and JSON snapshot fields that preserve the compiled state used for execution.

The `Model` and `ExperimentLog` tables store generated outputs. A single experiment can produce many model records because each parameter permutation may produce a separate evaluated model. Each model can have related experiment logs. Logs store structured metrics and execution information that can later be displayed or downloaded. The `BTCUSDTKline` table stores market-data candles using timestamp as the primary key, which allows repeated refresh operations to update existing candles instead of duplicating records.

System-level persistence is handled by `SystemSetting` and `SystemEvent`. `SystemSetting` stores configurable operational values used by administrative screens and services. `SystemEvent` stores trace data for route activity and system actions, allowing administrators to inspect operational behavior. These tables support monitoring and governance requirements without mixing administrative records with experiment artifacts.

## 6.4.3 Database Relationships

The database relationships preserve ownership, traceability, and access control. User ownership is central to the design because blueprints, experiments, favorites, and administrative visibility depend on the authenticated actor. Blueprint and experiment relationships are also central because experiments must record which reusable blueprint they were created from.

**Table 6.18: Main Database Relationships**

| Relationship                           | Type                           | Implementation Meaning                                    |
| -------------------------------------- | ------------------------------ | --------------------------------------------------------- |
| `User` to `Blueprint`              | One-to-many                    | A user can create and own multiple blueprints             |
| `User` to `Experiment`             | One-to-many                    | A user can submit and own multiple experiments            |
| `Blueprint` to `Experiment`        | One-to-many                    | A blueprint can be selected by multiple experiments       |
| `Experiment` to `Model`            | One-to-many                    | One experiment can produce multiple model outputs         |
| `Experiment` to `ExperimentLog`    | One-to-many                    | One experiment can produce multiple structured logs       |
| `Model` to `ExperimentLog`         | One-to-many                    | One model can be linked to multiple log entries           |
| `User` to `FavoriteBlueprint`      | One-to-many through join table | A user can save multiple blueprints as favorites          |
| `Blueprint` to `FavoriteBlueprint` | One-to-many through join table | A blueprint can be saved by multiple users                |
| `User` to `FavoriteModel`          | One-to-many through join table | A user can save multiple models as favorites              |
| `Model` to `FavoriteModel`         | One-to-many through join table | A model can be saved by multiple users                    |
| `Blueprint` to `Blueprint`         | Self-referencing parent-child  | Blueprint versions can refer to earlier blueprint records |

The self-referencing relationship in the `Blueprint` table supports version lineage. When a blueprint has already entered a reviewed or submitted workflow, later owner edits can be represented through a new version rather than overwriting the existing artifact. This supports traceability because earlier experiments can still be understood in terms of the blueprint state that existed when the experiment was created.

The join tables `FavoriteBlueprint` and `FavoriteModel` implement saved-item behavior without duplicating blueprint or model data. This design allows users to maintain personal libraries of saved artifacts while preserving a single source of truth for the actual blueprint or model record.

> Note: Include a relationship-focused ERD or Crow's Foot diagram here if space allows. The diagram should emphasize `User -> Blueprint -> Experiment -> Model -> ExperimentLog` as the main research artifact chain.

## 6.4.4 Constraints and Data Integrity Rules

The database schema includes constraints that protect important data integrity rules. Usernames and emails are unique in the `User` table, preventing duplicate account identities. Blueprint names are constrained by user and version so that versioned blueprint records can be distinguished. Model records include a uniqueness rule for the combination of experiment and parameter hash, which prevents duplicate model artifacts for the same parameter permutation within the same experiment.

The `Experiment` table includes split-ratio checks to ensure that train, validation, and test splits form a valid experiment configuration. The split sum must equal the complete dataset allocation, and validation and test allocations must meet minimum thresholds. These database-level constraints complement the backend validator. The backend validator catches invalid submissions early and returns user-friendly errors, while the database constraint provides a final integrity safeguard.

The `BTCUSDTKline` table uses timestamp as the primary key. This is important because BTCUSDT candle records are time-series data, and each candle timestamp should identify one unique record. The market-data repository can therefore perform upsert behavior, updating an existing timestamp if refreshed data is received rather than inserting duplicate candles.

**Table 6.19: Data Integrity Rules Implemented in the Database Layer**

| Data Integrity Area           | Implementation Mechanism                                 | Purpose                                                |
| ----------------------------- | -------------------------------------------------------- | ------------------------------------------------------ |
| Unique user identity          | Unique username and email columns                        | Prevent duplicate account identifiers                  |
| Blueprint version distinction | Unique combination of owner, blueprint name, and version | Preserve identifiable blueprint versions               |
| Blueprint lineage safety      | Parent reference and self-reference check                | Prevent invalid blueprint parent relationship          |
| Experiment split correctness  | Database check constraints on split values               | Ensure train, validation, and test ratios remain valid |
| Model permutation uniqueness  | Unique experiment and parameter hash combination         | Avoid duplicate model rows for the same parameter set  |
| Market-data uniqueness        | Timestamp primary key in`BTCUSDTKline`                 | Prevent duplicate candle rows                          |
| Referential traceability      | Foreign-key relationships                                | Preserve ownership and artifact links                  |

## 6.4.5 Repository and Unit-of-Work Implementation

The database is not accessed directly from frontend code or by raw database operations in controller logic. Instead, the backend uses repositories to encapsulate persistence operations for each entity area. For example, the user repository handles user lookups and account persistence, the blueprint repository handles blueprint operations, the experiment repository handles experiment records, and the market-data repository handles BTCUSDT candle storage and retrieval.

The repository layer improves maintainability by separating data access from business logic. Controllers can focus on HTTP request handling, services can focus on application workflows, validators can focus on rule enforcement, and repositories can focus on database operations. This also makes testing easier because persistence behavior can be exercised through controlled repository methods.

The `UnitOfWork` class provides a transaction boundary around repository operations. When a unit-of-work context is entered, it opens a database session and attaches the repositories to that session. If the operation completes successfully, the transaction is committed. If an exception occurs, the transaction is rolled back. The session is then closed. This pattern protects consistency for operations that modify multiple tables, such as creating an experiment and queue metadata, updating experiment status, or saving model and log outputs.

The transaction behavior can be represented using Program Design Language style pseudocode:

```text
PROCEDURE Execute Database Operation
  OPEN database session
  ATTACH user repository to session
  ATTACH blueprint repository to session
  ATTACH experiment repository to session
  ATTACH model repository to session
  ATTACH experiment log repository to session
  ATTACH favorite repositories to session
  ATTACH market data repository to session
  ATTACH system repositories to session

  TRY
    PERFORM requested application operation
    VALIDATE business rules before persistence
    SAVE or UPDATE affected records
    COMMIT database transaction
  CATCH any error
    ROLLBACK database transaction
    RETURN or RAISE operation error
  FINALLY
    CLOSE database session
  ENDTRY
ENDPROCEDURE
```

**Table 6.20: Repository Responsibilities**

| Repository                      | Responsibility                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `UserRepository`              | User creation, lookup, status, role, and profile-related persistence                              |
| `BlueprintRepository`         | Blueprint creation, lookup, listing, state changes, and version-related persistence               |
| `ExperimentRepository`        | Experiment creation, listing, detail lookup, status, progress, snapshots, and job-related updates |
| `ModelRepository`             | Model artifact persistence, ranking queries, detail lookup, and favorite integration              |
| `ExperimentLogRepository`     | Structured experiment log persistence and retrieval for display or export                         |
| `FavoriteBlueprintRepository` | Saved blueprint creation, removal, and listing                                                    |
| `FavoriteModelRepository`     | Saved model creation, removal, and listing                                                        |
| `MarketDataRepository`        | BTCUSDT candle upsert, lookup, range queries, and cache metadata support                          |
| `SystemSettingRepository`     | Administrative setting lookup and update                                                          |
| `SystemEventRepository`       | System event persistence and retrieval                                                            |

## 6.4.6 Migration and Schema Management

Database schema management is handled through Alembic in the backend. Alembic provides a controlled way to apply schema definitions to the PostgreSQL database. This is important because the application has multiple related tables, foreign keys, constraints, JSON fields, and numeric fields that must match the source code expectations.

The backend database configuration uses `.env` to resolve the database connection. This allows schema setup commands and the runtime backend to point to the same database environment. Keeping database connection values outside the source code also improves portability between development and deployment environments.

A typical schema setup flow is shown below.

```text
Prepare PostgreSQL database
Configure database connection in .env
Run schema setup or migration command from backend context
Start backend application
Verify backend health and database-backed routes
```

> Note: If evidence is required for migration or schema setup, include a sanitized terminal screenshot showing a successful schema command. Do not show local database connection values.

## 6.4.7 Stored Procedures or Triggers

No custom stored procedures or database triggers are required in the current implementation. The main business rules are implemented in backend validators, services, repositories, and the unit-of-work transaction boundary. This approach keeps business logic visible in the application source code and easier to test through backend automated tests.

Database constraints are still used for important integrity rules such as uniqueness, foreign-key relationships, split-ratio validity, and primary-key uniqueness. The combination of application-level validation and database-level constraints provides two layers of protection: user-friendly validation before persistence and database integrity enforcement at the storage layer.

Stored procedures may be considered in the future if the system requires database-side scheduled aggregation, reporting, or performance optimization. However, for the current implementation, keeping workflow logic in the backend is more maintainable because experiment validation, blueprint versioning, queue submission, and worker updates are already coordinated by backend services.

## 6.4.8 Tools Used for Database Management

The database implementation uses a small set of tools that support development, setup, testing, and verification. PostgreSQL provides the database service. SQLAlchemy provides ORM mapping and session behavior. Alembic supports schema management. Backend tests validate repository and persistence behavior. Terminal commands are used to run setup and verification tasks.

**Table 6.21: Database Management Tools**

| Tool                    | Purpose                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| PostgreSQL              | Runtime relational database for persistent system data                                        |
| SQLAlchemy              | ORM mapping, database engine setup, sessions, relationships, and repository access            |
| Alembic                 | Database schema setup and migration workflow                                                  |
| Backend automated tests | Verification of repository behavior, controller persistence, and transaction-related behavior |
| Terminal / shell        | Running backend database setup, test, and verification commands                               |
| `.env` configuration  | Supplies database connection information without hard-coding local values                     |

> Note: If a database management tool screenshot is added, show only the table list or ERD. Do not show private connection information or local machine-specific values.

## 6.4.9 Database Evidence to Include

The final report should include database implementation evidence that is readable to both technical and non-technical assessors. The most suitable evidence is an ERD, table summary, and one or two selected database screenshots. Source-code screenshots are less effective unless they are used to highlight a specific constraint or mapping.

Recommended database evidence:

- Simplified ERD showing the main tables and relationships.
- Table summary listing each table and its purpose.
- Screenshot of database table list from a database client, with sensitive values hidden.
- Screenshot or table showing a sample experiment record and its related model/log records, using non-sensitive demonstration data.
- Screenshot or table showing BTCUSDT candle cache fields.

> Note: Avoid showing credential hashes, local connection strings, private user email addresses, or environment values in screenshots. Use demonstration accounts and sanitized data in the report.

## 6.4.10 Summary

The database implementation provides the persistence foundation for the Bitcoin Experimental Engine. PostgreSQL stores all durable system records, including users, blueprints, experiments, models, logs, BTCUSDT candles, favorites, settings, and system events. SQLAlchemy maps these tables into backend ORM classes, repositories encapsulate persistence operations, and the unit-of-work boundary coordinates transactions.

The schema supports the main requirements of the system by preserving ownership, role-based access, blueprint versioning, experiment configuration, compiled snapshots, model parameters, evaluation metrics, logs, market-data cache records, and administrative events. Database constraints and application validators work together to protect data integrity. This allows the system to provide reproducible experiment workflows while maintaining traceable relationships between user actions, configuration inputs, execution results, and generated artifacts.

---

# 6.5 Key Modules and Features Developed

This section describes the main modules and features developed for the Bitcoin Experimental Engine. The system is implemented as a modular full-stack application, where each feature is supported by frontend views, backend controllers, service-layer logic, validation, repositories, database persistence, and, where required, asynchronous worker execution. The purpose of this section is to demonstrate how the system was built from its design into working modules.

The implemented modules are not isolated screens. They form a continuous workflow that begins with user access, continues through blueprint creation and experiment submission, and ends with queued execution, model generation, log inspection, favorites, public discovery, documentation, and administrative monitoring. The implementation therefore supports both the research workflow and the governance workflow required by the system.

## 6.5.1 User Authentication Module

The user authentication module allows guests to register an account, log in, restore authenticated session state, and log out. It is the entry point to most system functions because experiment configuration, blueprint authoring, job monitoring, model inspection, favorites, public hub access, profile viewing, user management, and system management all depend on authenticated identity.

The backend implementation is centered on `backend/app/controllers/authentication_controller.py`, supported by `backend/app/services/password_service.py`, `backend/app/services/session_service.py`, `backend/app/services/access_control_service.py`, and `backend/app/repositories/user_repository.py`. The frontend implementation is centered on `frontend/views/LoginView.tsx`, `frontend/views/RegistrationView.tsx`, `frontend/lib/auth/AuthProvider.tsx`, `frontend/lib/auth/current-user.ts`, `frontend/lib/auth/useAuth.ts`, and `frontend/lib/auth/guards.tsx`. API request behavior is centralized through `frontend/lib/api/client.ts` and `frontend/lib/api/endpoints.ts`.

During registration, the frontend collects account details and sends the request to the backend. The backend validates the account information, checks uniqueness rules, hashes the credential value, creates the user record, and establishes an authenticated session. During login, the backend verifies the submitted credential against the stored hash and checks the account status before creating a session. The frontend then updates its authentication state and redirects the user to the dashboard.

Session restoration is handled by the frontend authentication provider. When the application loads or refreshes, the frontend calls the current-user endpoint to determine whether a valid session exists. If the user is authenticated, protected routes are allowed to render. If the user is not authenticated, protected routes redirect or block access. This prevents the user interface from assuming identity based only on local page state.

The main authentication flow is shown in PDL-style pseudocode below.

```text
PROCEDURE Authenticate User
  RECEIVE email and credential from login form
  VALIDATE required fields
  FIND user record by email
  IF user record does not exist THEN
    RETURN authentication error
  ENDIF
  IF user account is disabled THEN
    RETURN access denied error
  ENDIF
  VERIFY submitted credential against stored credential hash
  IF verification fails THEN
    RETURN authentication error
  ENDIF
  CREATE server-managed session containing user identity and role
  RETURN safe user profile to frontend
ENDPROCEDURE
```

**Table 6.22: Authentication Module Implementation**

| Layer               | Implementation Files                                                           | Responsibility                                                        |
| ------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Backend controller  | `backend/app/controllers/authentication_controller.py`                       | Handles register, login, logout, CSRF, and current-user requests      |
| Backend services    | `password_service.py`, `session_service.py`, `access_control_service.py` | Handles credential hashing, session behavior, and identity resolution |
| Backend repository  | `user_repository.py`                                                         | Persists and retrieves user records                                   |
| Frontend views      | `LoginView.tsx`, `RegistrationView.tsx`                                    | Provides user-facing login and registration forms                     |
| Frontend auth state | `AuthProvider.tsx`, `current-user.ts`, `useAuth.ts`                      | Maintains session-aware frontend identity state                       |
| Frontend guards     | `guards.tsx`                                                                 | Protects authenticated and role-restricted routes                     |

> Note: Add screenshots of the registration form, login form, successful dashboard redirection, and logout result. Do not show real credentials or private user details in the screenshots.

## 6.5.2 Role-Based Access Control and User Management Module

The role-based access control module restricts system functions based on user role. The implemented roles are normal user, moderator, and administrator. Normal users can use research features such as dashboards, blueprints, experiments, jobs, models, favorites, public hub, documentation, and profile pages. Moderators can access staff moderation and limited user-management functions. Administrators can access the full user-management and system-management functions.

The backend access-control logic is implemented through `backend/app/services/access_control_service.py` and `backend/app/controllers/_access.py`. User-management operations are exposed through `backend/app/controllers/user_controller.py` and persisted through `backend/app/repositories/user_repository.py`. On the frontend, role-aware navigation and route protection are implemented through `frontend/lib/auth/guards.tsx`, authentication context, and views such as `frontend/views/UserManagementView.tsx` and `frontend/views/SystemManagementView.tsx`.

The implementation uses frontend restrictions for usability and backend restrictions for security. The frontend hides or blocks pages that are not suitable for the current user role, reducing confusion and preventing users from seeing unavailable controls. However, the backend remains the final authority. Even if a user manually calls an API endpoint, the backend resolves the authenticated actor and checks the required role before performing protected operations.

User management allows staff users to view and manage account records according to their permission level. Moderators are allowed to perform limited staff operations, while administrators can perform full user-management actions. This design supports governance requirements without giving every staff user unrestricted system control.

```text
PROCEDURE Enforce Protected Operation
  RESOLVE authenticated actor from session
  IF no actor is available THEN
    RETURN unauthenticated response
  ENDIF
  READ required role for requested operation
  IF actor role does not satisfy required role THEN
    RETURN forbidden response
  ENDIF
  EXECUTE requested protected operation
ENDPROCEDURE
```

**Table 6.23: RBAC and User Management Module Implementation**

| Layer                      | Implementation Files                                                                       | Responsibility                                                |
| -------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Backend access control     | `backend/app/services/access_control_service.py`, `backend/app/controllers/_access.py` | Resolves actor identity and enforces role requirements        |
| Backend user operations    | `backend/app/controllers/user_controller.py`                                             | Handles user profile and staff user-management API operations |
| Backend persistence        | `backend/app/repositories/user_repository.py`                                            | Reads and updates user records                                |
| Frontend guards            | `frontend/lib/auth/guards.tsx`                                                           | Restricts route rendering based on authentication and role    |
| Frontend user management   | `frontend/views/UserManagementView.tsx`                                                  | Provides staff user-management interface                      |
| Frontend system management | `frontend/views/SystemManagementView.tsx`                                                | Provides administrator-facing system controls                 |

> Note: Add one screenshot showing the user-management interface for a staff account and one screenshot showing restricted access for a normal user. The screenshots should demonstrate that role-based access is visible in the interface.

## 6.5.3 Dashboard and Application Shell Module

The dashboard and application shell module provides the main authenticated landing experience after login. The dashboard summarizes system activity and gives users quick access to important workflows, while the application shell provides navigation, layout, route structure, and consistent page presentation.

The backend dashboard data is exposed through `backend/app/controllers/dashboard_controller.py`. The frontend dashboard is implemented in `frontend/views/DashboardView.tsx`, and the base view structure is implemented through `frontend/views/BaseView.tsx`. Reusable layout and interface components are located under `frontend/components/`, while route-level pages under `frontend/app/` connect URLs to the correct views.

The dashboard gives users a central location to understand the current state of their experiments, models, and market-data availability. It is also a practical demonstration point because it shows that authentication, frontend rendering, API communication, and backend dashboard data are integrated. For administrators, the system-management view provides a separate operational dashboard for queue, settings, and event visibility.

**Table 6.24: Dashboard and Application Shell Implementation**

| Layer                   | Implementation Files                                | Responsibility                                                    |
| ----------------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| Backend dashboard API   | `backend/app/controllers/dashboard_controller.py` | Provides dashboard summary data                                   |
| Frontend dashboard view | `frontend/views/DashboardView.tsx`                | Displays user-facing dashboard content                            |
| Base view               | `frontend/views/BaseView.tsx`                     | Provides common view structure                                    |
| Reusable components     | `frontend/components/`                            | Provides layout, status, chart, table, form, and state components |
| Route entrypoints       | `frontend/app/`                                   | Connects browser routes to views                                  |

> Note: Add a dashboard screenshot after logging in with a demonstration account. This screenshot should show at least the navigation shell and one summary card or chart area.

## 6.5.4 Blueprint Authoring, Versioning, and Moderation Module

The blueprint module allows users to create reusable experiment templates. A blueprint contains the configuration needed to define a reusable experiment structure, including metadata, indicators, features, and architecture settings. This module is important because it separates reusable experiment design from individual experiment execution.

The backend implementation is distributed across `backend/app/controllers/blueprint_controller.py`, `backend/app/controllers/blueprint_wizard_controller.py`, `backend/app/controllers/blueprints_library_controller.py`, `backend/app/controllers/blueprint_approval_controller.py`, `backend/app/validators/blueprint_validator.py`, `backend/app/services/versioning_service.py`, and `backend/app/repositories/blueprint_repository.py`. Favorite behavior for blueprints is supported by `backend/app/repositories/favorite_blueprint_repository.py`. The frontend implementation is handled mainly by `frontend/views/BlueprintWizardView.tsx`, `frontend/views/BlueprintsLibraryView.tsx`, `frontend/views/BlueprintDetailView.tsx`, and `frontend/views/BlueprintModerationView.tsx`.

The blueprint wizard guides the user through authoring a blueprint. The user enters metadata, selects indicators, defines feature behavior, configures architecture values, and reviews the completed specification before saving or submitting. The frontend provides step-based interaction, while the backend validator performs authoritative validation before the blueprint is persisted or submitted for approval.

Blueprint approval is implemented so that reusable templates can be governed before wider use. Normal users can create drafts and submit them for approval. Moderators and administrators can approve or reject submissions. Approved blueprints can be selected during experiment creation, while drafts or rejected versions remain controlled according to ownership and staff visibility rules.

Blueprint versioning preserves traceability. When a blueprint has already entered a submitted or reviewed workflow, later modification should not silently overwrite the previously reviewed artifact. Instead, versioning behavior preserves the previous record and creates an editable version when required. This supports reproducibility because experiments created from a blueprint can remain linked to the blueprint state that existed when the experiment was configured.

```text
PROCEDURE Submit Blueprint For Approval
  RESOLVE authenticated owner
  LOAD blueprint by identifier
  VERIFY owner can access blueprint
  VALIDATE blueprint metadata, indicators, features, and architecture
  IF validation fails THEN
    RETURN validation errors
  ENDIF
  CHANGE blueprint approval state to pending
  SAVE blueprint changes
  RETURN updated blueprint detail
ENDPROCEDURE
```

```text
PROCEDURE Edit Blueprint
  LOAD existing blueprint
  VERIFY authenticated user owns blueprint
  IF blueprint is still editable draft THEN
    APPLY changes to existing draft
  ELSE
    CREATE new blueprint version
    COPY reusable specification from previous version
    APPLY owner changes to new version
    LINK new version to blueprint lineage
  ENDIF
  SAVE blueprint record
  RETURN saved blueprint detail
ENDPROCEDURE
```

**Table 6.25: Blueprint Module Implementation**

| Layer                  | Implementation Files                                                                                                     | Responsibility                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Backend blueprint APIs | `blueprint_controller.py`, `blueprint_wizard_controller.py`, `blueprints_library_controller.py`                    | Handles blueprint creation, listing, wizard data, and detail retrieval |
| Backend approval API   | `blueprint_approval_controller.py`                                                                                     | Handles approval request and moderation actions                        |
| Backend validation     | `blueprint_validator.py`                                                                                               | Validates blueprint structure before persistence or submission         |
| Backend versioning     | `versioning_service.py`                                                                                                | Preserves blueprint lineage and creates new versions when needed       |
| Backend persistence    | `blueprint_repository.py`, `favorite_blueprint_repository.py`                                                        | Stores blueprints and favorite references                              |
| Frontend views         | `BlueprintWizardView.tsx`, `BlueprintsLibraryView.tsx`, `BlueprintDetailView.tsx`, `BlueprintModerationView.tsx` | Provides blueprint authoring, library, detail, and moderation screens  |

> Note: Add screenshots of the Blueprint Wizard, Blueprint Library, Blueprint Detail, and Blueprint Moderation pages. Also include a state-transition diagram showing Draft, Pending, Approved, and Rejected states.

## 6.5.5 Experiment Configuration and Management Module

The experiment module allows authenticated users to create and manage BTCUSDT experiments. An experiment defines the dataset interval and date range, train-validation-test split ratios, selected approved blueprint, optional parameter overrides, deterministic setting, and execution parameters. This module turns a reusable blueprint into a concrete experiment run.

Backend experiment functionality is implemented through `backend/app/controllers/experiment_controller.py`, `backend/app/controllers/experiment_wizard_controller.py`, `backend/app/validators/experiment_validator.py`, `backend/app/execution/experiment_compiler.py`, and `backend/app/repositories/experiment_repository.py`. The frontend implementation is handled by `frontend/views/ExperimentWizardView.tsx`, `frontend/views/ExperimentListView.tsx`, and `frontend/views/ExperimentDetailView.tsx`.

The experiment wizard guides the user through a multi-step configuration process. The user enters the experiment name and description, selects the BTCUSDT interval and date range, defines validation and test split values, selects an approved blueprint, optionally applies parameter overrides, reviews the configuration, and submits the experiment. The frontend helps the user avoid common mistakes, but backend validation remains the final enforcement point.

The backend validator checks that the experiment configuration is valid before persistence and queueing. This includes checking BTCUSDT scope, supported interval values, valid start and end dates, valid split ratios, minimum validation and test allocations, accessible blueprint selection, and valid parameter override structure. If validation succeeds, the experiment compiler produces snapshots that preserve the blueprint and experiment configuration used for the run.

The experiment management views allow users to list experiments, filter or inspect their status, and open experiment details. Experiment detail pages show configuration, progress, job information, resulting models, and artifact download options. This gives users a complete view of the experiment lifecycle from submission to result inspection.

```text
PROCEDURE Create Experiment
  RESOLVE authenticated user
  RECEIVE experiment configuration from wizard
  VALIDATE symbol, interval, date range, split ratios, blueprint access, and overrides
  IF validation fails THEN
    RETURN validation errors
  ENDIF
  COMPILE selected blueprint and experiment-specific settings into snapshots
  CREATE experiment record with queued status
  SUBMIT experiment execution job to queue
  RETURN experiment detail and queue metadata
ENDPROCEDURE
```

**Table 6.26: Experiment Module Implementation**

| Layer                  | Implementation Files                                                                   | Responsibility                                                             |
| ---------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Backend experiment API | `experiment_controller.py`, `experiment_wizard_controller.py`                      | Handles experiment creation, listing, detail retrieval, and wizard options |
| Backend validation     | `experiment_validator.py`                                                            | Validates submitted experiment configuration                               |
| Backend compiler       | `experiment_compiler.py`                                                             | Produces compiled blueprint and experiment snapshots                       |
| Backend persistence    | `experiment_repository.py`                                                           | Stores experiment records and execution state                              |
| Frontend views         | `ExperimentWizardView.tsx`, `ExperimentListView.tsx`, `ExperimentDetailView.tsx` | Provides experiment setup, listing, and detail screens                     |

> Note: Add screenshots of the Experiment Wizard review screen, experiment list, and experiment detail page. The screenshots should show the selected blueprint, split values, status, and progress information where possible.

## 6.5.6 Market Data and BTCUSDT Charting Module

The market-data module retrieves, stores, and serves BTCUSDT candle data. It supports both user-facing chart display and backend experiment execution. Since the project focuses on BTCUSDT experimentation, the market-data implementation is designed around BTCUSDT kline records rather than arbitrary market symbols.

The backend implementation includes `backend/app/controllers/market_data_controller.py`, `backend/app/services/market_data_service.py`, `backend/app/repositories/market_data_repository.py`, and the Binance-compatible infrastructure client under `backend/app/infrastructure/binance/`. Supporting scripts under `backend/app/scripts/` are used for BTCUSDT kline ingestion and refresh operations. The frontend chart implementation is located under `frontend/components/charts/` and is used by views such as the dashboard and experiment-related screens.

The backend retrieves candle data, normalizes it into a consistent OHLCV structure, and stores it in the `BTCUSDTKline` table. Timestamp is used as the primary key so that repeated refreshes can update existing records instead of creating duplicates. This design supports data integrity and ensures that experiment execution and chart rendering can refer to a consistent local candle cache.

The charting implementation converts backend candle data into the format needed by the frontend chart component. The chart can show loaded data, loading state, empty state, or error state depending on the API response. This improves usability because users can distinguish between unavailable data, pending loading, and actual chart output.

```text
PROCEDURE Refresh BTCUSDT Market Data
  RECEIVE requested interval and date range
  VALIDATE supported market-data scope
  REQUEST candle pages from market-data provider
  FOR EACH candle record returned
    NORMALIZE timestamp, open, high, low, close, and volume values
    UPSERT candle by timestamp into local database
  ENDFOR
  RETURN refresh summary to caller
ENDPROCEDURE
```

**Table 6.27: Market Data and Charting Module Implementation**

| Layer                     | Implementation Files                    | Responsibility                                                       |
| ------------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| Backend API               | `market_data_controller.py`           | Exposes market-data endpoints for chart and administrative use       |
| Backend service           | `market_data_service.py`              | Coordinates market-data retrieval, normalization, and cache behavior |
| Backend repository        | `market_data_repository.py`           | Stores and retrieves BTCUSDT candle records                          |
| External connector        | `backend/app/infrastructure/binance/` | Retrieves BTCUSDT kline data from configured provider                |
| Frontend chart components | `frontend/components/charts/`         | Renders BTCUSDT chart data and chart states                          |

> Note: Add a screenshot of the BTCUSDT chart on the dashboard or experiment page. Include a small table of sample candle fields: timestamp, open, high, low, close, and volume.

## 6.5.7 Queue, Worker, and Job Management Module

The queue, worker, and job management module enables long-running experiment execution without blocking the web interface. This is necessary because an experiment may involve data loading, feature generation, target generation, model training, evaluation, backtesting, metric calculation, and log persistence. Running this work inside a normal web request would make the system less responsive and less reliable.

The backend queue implementation includes `backend/app/services/queue_service.py`, `backend/app/services/job_metadata_service.py`, `backend/app/infrastructure/redis/`, `backend/app/controllers/job_controller.py`, `backend/app/controllers/system_controller.py`, and `backend/app/workers/experiment_worker.py`. Worker startup is supported through the backend worker script. The frontend job interfaces are implemented in `frontend/views/JobListView.tsx`, `frontend/views/JobDetailView.tsx`, and `frontend/views/SystemManagementView.tsx`.

When a user submits a valid experiment, the backend persists the experiment and enqueues a job. The API response returns quickly with experiment and queue metadata. The worker process later receives the job, loads the experiment, updates the experiment status, executes the experiment pipeline, records progress, and persists the output. This separation allows users to continue using the application while experiments run in the background.

The job management views allow users to inspect queued, running, completed, failed, or cancelled jobs. Eligible jobs can be cancelled. The system-management view gives administrators a higher-level view of active queue state and operational controls. These features improve transparency because users can understand whether their submitted experiment is waiting, processing, finished, or interrupted.

```text
PROCEDURE Process Queued Experiment Job
  RECEIVE job payload from queue
  LOAD experiment by identifier
  IF experiment cannot be found THEN
    MARK job as failed
    STOP
  ENDIF
  MARK experiment as running
  EXECUTE experiment pipeline with progress updates
  IF cancellation is requested THEN
    MARK experiment as cancelled
  ELSE IF execution succeeds THEN
    SAVE generated models and logs
    MARK experiment as completed
  ELSE
    RECORD failure information
    MARK experiment as failed
  ENDIF
ENDPROCEDURE
```

**Table 6.28: Queue, Worker, and Job Module Implementation**

| Layer                | Implementation Files                                                     | Responsibility                                                     |
| -------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Queue service        | `queue_service.py`                                                     | Enqueues validated experiment execution jobs                       |
| Job metadata         | `job_metadata_service.py`                                              | Provides queue and job status metadata                             |
| Redis infrastructure | `backend/app/infrastructure/redis/`                                    | Integrates backend services with Redis-backed queue processing     |
| Worker               | `experiment_worker.py`                                                 | Executes queued experiments and updates experiment state           |
| Job API              | `job_controller.py`                                                    | Provides job list, detail, and cancellation behavior               |
| System API           | `system_controller.py`                                                 | Provides administrative queue visibility and system controls       |
| Frontend views       | `JobListView.tsx`, `JobDetailView.tsx`, `SystemManagementView.tsx` | Displays job status, cancellation controls, and system queue state |

> Note: Add screenshots of the job list page, job detail page, and administrator system queue view. A sequence diagram showing Experiment Submit -> Queue -> Worker -> Database Update -> Frontend Status is strongly recommended.

## 6.5.8 Experiment Execution, Model Training, Metrics, and Logs Module

The experiment execution module performs the core computational workflow of the system. It transforms a configured experiment into trained model artifacts and structured logs. This module is responsible for preserving temporal integrity, generating parameter permutations, processing BTCUSDT data, training models, evaluating outputs, and saving results.

The backend implementation includes `backend/app/execution/experiment_compiler.py`, `backend/app/execution/feature_scaler.py`, `backend/app/executors/experiment_executor.py`, `backend/app/executors/default_experiment_executor.py`, `backend/app/architectures/`, and `backend/app/strategies/`. Model and log outputs are persisted through `backend/app/repositories/model_repository.py` and `backend/app/repositories/experiment_log_repository.py`. The frontend result views include `frontend/views/ExperimentDetailView.tsx`, `frontend/views/ModelsRankingsView.tsx`, `frontend/views/ModelDetailView.tsx`, and `frontend/views/ModelDetailsView.tsx`.

The execution pipeline begins with a compiled experiment definition. The worker loads the experiment, resolves the selected blueprint snapshot, loads the required BTCUSDT data, and applies the configured split sequence. The split-first approach is important because indicators, targets, scaling, and evaluation must respect chronological boundaries and avoid look-ahead bias.

After splitting, the executor generates features and targets according to the compiled blueprint and experiment settings. It then generates parameter permutations and trains models for the selected configurations. Each model is evaluated using stored metrics, and the resulting parameter set is saved with a parameter hash. This allows the system to identify and rank model outputs consistently.

Logs are generated during evaluation and stored in the database. These logs allow experiment details, model metrics, backtest-style behavior, prediction signals, and structured metrics to be inspected later. The logs also support download features, which are implemented through the logs download controller.

```text
PROCEDURE Execute Compiled Experiment
  LOAD compiled experiment definition
  LOAD BTCUSDT candle data for selected interval and date range
  SPLIT data chronologically into train, validation, and test partitions
  FOR EACH parameter permutation
    GENERATE indicators within the appropriate data partition
    GENERATE target values according to selected target strategy
    SCALE features using training-data rules
    TRAIN selected model architecture
    EVALUATE model on validation and test data
    GENERATE trading signals and metrics
    SAVE model record and experiment logs
    UPDATE experiment progress
  ENDFOR
  RETURN execution summary
ENDPROCEDURE
```

**Table 6.29: Experiment Execution and Output Module Implementation**

| Layer                 | Implementation Files                                                              | Responsibility                                                         |
| --------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Experiment compiler   | `experiment_compiler.py`                                                        | Produces executable experiment snapshots and parameter structures      |
| Feature scaling       | `feature_scaler.py`                                                             | Applies feature-scaling behavior during execution                      |
| Executor interface    | `experiment_executor.py`                                                        | Defines the execution contract                                         |
| Default executor      | `default_experiment_executor.py`                                                | Runs the main experiment execution workflow                            |
| Architectures         | `backend/app/architectures/`                                                    | Provides trainable model architecture implementations                  |
| Strategies            | `backend/app/strategies/`                                                       | Provides indicators, targets, splits, metrics, logs, and trading logic |
| Model persistence     | `model_repository.py`                                                           | Stores model metrics and parameter records                             |
| Log persistence       | `experiment_log_repository.py`                                                  | Stores structured experiment logs                                      |
| Frontend result views | `ExperimentDetailView.tsx`, `ModelsRankingsView.tsx`, `ModelDetailView.tsx` | Displays experiment outputs and model details                          |

> Note: Add screenshots of experiment detail, model rankings, model detail, and log download controls. Use pseudocode and diagrams instead of long source-code screenshots because the execution pipeline spans multiple backend files.

## 6.5.9 Model Catalog, Rankings, and Model Detail Module

The model catalog module allows users to view generated model artifacts after experiments complete. Models can be ranked by performance metrics and opened for detailed inspection. This supports the project objective of helping users compare experimental outputs rather than only execute experiments.

Backend model functionality is implemented through `backend/app/controllers/model_controller.py`, `backend/app/controllers/models_rankings_controller.py`, `backend/app/controllers/models_library_controller.py`, and `backend/app/repositories/model_repository.py`. Favorite model behavior is supported through `backend/app/repositories/favorite_model_repository.py`. The frontend implementation includes `frontend/views/ModelsRankingsView.tsx`, `frontend/views/ModelDetailView.tsx`, `frontend/views/ModelDetailsView.tsx`, and `frontend/views/FavoritesLibraryView.tsx`.

The ranking interface displays model metrics such as Sharpe, accuracy, precision, and recall. The model detail view shows the selected model’s experiment context, parameters, metrics, owner information, and available actions. Users can also save models as favorites for quick retrieval.

```text
PROCEDURE Load Model Rankings
  RECEIVE optional ranking and filter criteria
  QUERY model records with related experiment and owner data
  ORDER models by selected performance metric
  RETURN ranked model list to frontend
ENDPROCEDURE
```

**Table 6.30: Model Catalog Module Implementation**

| Layer                   | Implementation Files                                                                         | Responsibility                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Backend model APIs      | `model_controller.py`, `models_rankings_controller.py`, `models_library_controller.py` | Provides model detail, ranking, highlight, library, and favorite behavior |
| Backend persistence     | `model_repository.py`, `favorite_model_repository.py`                                    | Retrieves model outputs and persists saved model references               |
| Frontend ranking view   | `ModelsRankingsView.tsx`                                                                   | Displays ranked model list and metrics                                    |
| Frontend detail views   | `ModelDetailView.tsx`, `ModelDetailsView.tsx`                                            | Displays selected model details                                           |
| Frontend favorites view | `FavoritesLibraryView.tsx`                                                                 | Displays saved models and blueprints                                      |

> Note: Add a screenshot of the model ranking table and model detail page. Include at least one example showing performance metric columns.

## 6.5.10 Logs and Artifact Download Module

The logs and artifact download module allows users to retrieve experiment artifacts in a standard downloadable form. This is important because experiment outputs should not only be visible in the browser; they should also be available for external analysis, reporting, and verification.

The backend implementation is centered on `backend/app/controllers/logs_download_controller.py` and `backend/app/repositories/experiment_log_repository.py`. Experiment log records are linked to experiments and models. The frontend exposes download actions mainly from `frontend/views/ExperimentDetailView.tsx` and model-related result screens.

The module retrieves the requested artifact type, validates access to the experiment, loads the relevant model or log data, formats the artifact, and returns it as a downloadable response. Access control is important because users should not retrieve artifacts for experiments they are not allowed to view.

```text
PROCEDURE Download Experiment Artifact
  RESOLVE authenticated user
  LOAD experiment by identifier
  VERIFY user can access experiment
  VALIDATE requested artifact type
  LOAD matching log or model data
  FORMAT data for download
  RETURN downloadable response
ENDPROCEDURE
```

**Table 6.31: Logs and Download Module Implementation**

| Layer                      | Implementation Files                                              | Responsibility                                 |
| -------------------------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| Backend download API       | `logs_download_controller.py`                                   | Handles artifact download requests             |
| Backend log persistence    | `experiment_log_repository.py`                                  | Retrieves stored experiment log records        |
| Frontend experiment detail | `ExperimentDetailView.tsx`                                      | Provides user-facing artifact download actions |
| Frontend API client        | `frontend/lib/api/client.ts`, `frontend/lib/api/endpoints.ts` | Sends download requests to backend endpoints   |

> Note: Add a screenshot of experiment detail showing available download buttons. A sample sanitized downloaded table may also be included if space allows.

## 6.5.11 Favorites Library Module

The favorites module allows users to save useful models and blueprints for quick retrieval. This feature supports reuse because users may want to return to a promising model or a reusable approved blueprint without searching through all public or owned artifacts again.

Backend favorite behavior is implemented through `backend/app/repositories/favorite_blueprint_repository.py`, `backend/app/repositories/favorite_model_repository.py`, blueprint library controllers, and model controllers. The frontend implementation is mainly handled by `frontend/views/FavoritesLibraryView.tsx`, with favorite actions also appearing on blueprint and model detail screens.

Favorites are stored as join records linking a user to a model or blueprint. The favorite tables do not duplicate the saved artifact itself; they only store the association. This preserves a single source of truth for the actual model or blueprint while still allowing each user to maintain a personalized saved library.

```text
PROCEDURE Toggle Favorite Artifact
  RESOLVE authenticated user
  VALIDATE target artifact exists and is accessible
  IF favorite record already exists THEN
    REMOVE favorite record
    RETURN unfavorited state
  ELSE
    CREATE favorite record
    RETURN favorited state
  ENDIF
ENDPROCEDURE
```

**Table 6.32: Favorites Module Implementation**

| Layer                   | Implementation Files                                                   | Responsibility                                    |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| Backend persistence     | `favorite_blueprint_repository.py`, `favorite_model_repository.py` | Stores and removes favorite associations          |
| Backend APIs            | Blueprint and model controllers/library controllers                    | Expose favorite actions and favorite library data |
| Frontend library view   | `FavoritesLibraryView.tsx`                                           | Displays saved models and blueprints              |
| Frontend detail screens | `BlueprintDetailView.tsx`, `ModelDetailView.tsx`                   | Provide favorite or unfavorite actions            |

> Note: Add a screenshot of the Favorites page showing separate saved model and blueprint records. Also include an example of a favorite toggle button on a detail page.

## 6.5.12 Public Hub Module

The Public Hub module allows authenticated users to discover visible system artifacts created by other users. It supports browsing of enabled users, completed experiments, generated models, and approved blueprints. This module helps transform the system from a private experiment runner into a shared research environment.

The backend implementation is handled by `backend/app/controllers/public_hub_controller.py`, supported by repositories for users, experiments, models, and blueprints. The frontend implementation is located in `frontend/views/PublicHubView.tsx`. The API client and endpoint definitions allow the frontend to request public hub data in a consistent format.

Public Hub visibility rules are important. Disabled users should not be shown as public user results, failed or incomplete experiments should not be treated as completed public research outputs, and only approved blueprints should appear as reusable public templates. These rules ensure that discovery surfaces useful and valid artifacts.

```text
PROCEDURE Load Public Hub
  LOAD enabled users
  LOAD completed successful experiments
  LOAD models from completed experiments
  LOAD approved blueprints
  APPLY search or filter criteria if provided
  RETURN grouped public hub payload
ENDPROCEDURE
```

**Table 6.33: Public Hub Module Implementation**

| Layer                | Implementation Files                                              | Responsibility                                         |
| -------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Backend API          | `public_hub_controller.py`                                      | Provides public hub data and user profile discovery    |
| Backend repositories | User, experiment, model, and blueprint repositories               | Retrieve visible public records                        |
| Frontend view        | `PublicHubView.tsx`                                             | Displays hub tabs, search, filters, and item summaries |
| API client           | `frontend/lib/api/client.ts`, `frontend/lib/api/endpoints.ts` | Connects frontend hub view to backend endpoints        |

> Note: Add screenshots of the Public Hub tabs for Users, Experiments, Models, and Blueprints. Show only demonstration data.

## 6.5.13 Documentation Viewer Module

The documentation viewer module allows users to browse documentation content inside the application. This supports the requirement that the system provide a documentation viewer capable of rendering Markdown-formatted content. It also improves usability because users can access guidance without leaving the application.

The backend documentation API is implemented in `backend/app/controllers/documentation_controller.py`. The frontend viewer is implemented in `frontend/views/DocumentationView.tsx`. Documentation content is served through backend routes and rendered on the frontend in a readable format.

The documentation module is intentionally simpler than the experiment and blueprint modules, but it is important for handover and usability. Users need guidance for workflows such as creating blueprints, configuring experiments, understanding model outputs, and using administrative features.

```text
PROCEDURE Load Documentation Page
  REQUEST documentation list from backend
  DISPLAY available document entries
  WHEN user selects a document
    REQUEST selected document content
    RENDER Markdown content in documentation view
ENDPROCEDURE
```

**Table 6.34: Documentation Module Implementation**

| Layer         | Implementation Files                                              | Responsibility                                   |
| ------------- | ----------------------------------------------------------------- | ------------------------------------------------ |
| Backend API   | `documentation_controller.py`                                   | Lists and serves documentation content           |
| Frontend view | `DocumentationView.tsx`                                         | Displays documentation list and selected content |
| API client    | `frontend/lib/api/client.ts`, `frontend/lib/api/endpoints.ts` | Retrieves documentation data from backend        |

> Note: Add a screenshot of the Documentation page showing the list of documents and rendered Markdown content.

## 6.5.14 System Management and Operational Monitoring Module

The system management module provides administrative visibility into operational aspects of the application. It includes queue visibility, settings behavior, and system events. This module is designed for administrator use and supports monitoring requirements.

The backend implementation is handled through `backend/app/controllers/system_controller.py`, `backend/app/services/system_settings_service.py`, `backend/app/services/job_metadata_service.py`, `backend/app/repositories/system_setting_repository.py`, and `backend/app/repositories/system_event_repository.py`. The frontend implementation is located in `frontend/views/SystemManagementView.tsx`.

The system management view allows administrators to inspect active queue state, view system settings, and review operational events. This is useful because experiment execution depends on queue and worker behavior. Administrators need a way to confirm whether jobs are waiting, running, completed, failed, or cancelled.

System events are recorded to support traceability. They can show important operations and route-level activity in a way that helps diagnose system behavior. This improves maintainability and operational visibility for a system that includes multiple user roles and asynchronous execution.

```text
PROCEDURE Load System Management Dashboard
  VERIFY authenticated actor is administrator
  LOAD queue snapshot
  LOAD system settings
  LOAD recent system events
  RETURN system dashboard payload
ENDPROCEDURE
```

**Table 6.35: System Management Module Implementation**

| Layer               | Implementation Files                                             | Responsibility                                                  |
| ------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| Backend system API  | `system_controller.py`                                         | Provides system dashboard, queue, settings, and event endpoints |
| Backend services    | `system_settings_service.py`, `job_metadata_service.py`      | Handles settings behavior and queue metadata                    |
| Backend persistence | `system_setting_repository.py`, `system_event_repository.py` | Stores settings and operational events                          |
| Frontend view       | `SystemManagementView.tsx`                                     | Displays administrative system status and controls              |
| Access control      | `access_control_service.py`, `guards.tsx`                    | Restricts system management to administrator role               |

> Note: Add a screenshot of the System Management page showing queue status, settings, or event records. The screenshot should be taken using an administrator demonstration account.

## 6.5.15 User Profile Module

The user profile module provides profile-level views for user activity and ownership. It allows users to inspect profile-related information and supports public discovery when other users are accessed through the Public Hub.

The backend profile data is provided through user-related controllers and repositories, while the frontend profile page is implemented in `frontend/views/UserProfileView.tsx`. The profile module integrates with experiments, models, blueprints, and public hub browsing because profile views often summarize a user's research artifacts.

This module improves discoverability and gives users a more complete view of activity ownership. In a research system, ownership is important because models, experiments, and blueprints should be traceable to the user who created them.

**Table 6.36: User Profile Module Implementation**

| Layer                 | Implementation Files                                     | Responsibility                                                        |
| --------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Backend user API      | `user_controller.py`, `public_hub_controller.py`     | Provides profile and public user detail data                          |
| Backend persistence   | `user_repository.py` and related artifact repositories | Loads user details and associated artifact summaries                  |
| Frontend profile view | `UserProfileView.tsx`                                  | Displays user profile and activity information                        |
| Frontend navigation   | Route and API client modules                             | Connects profile links from dashboard, public hub, and artifact views |

> Note: Add a screenshot of the user profile page showing activity summaries or associated artifacts.

## 6.5.16 Module Integration Summary

The completed modules form an integrated research workflow. A guest registers or logs in through the authentication module. The authenticated user then creates a blueprint through the blueprint wizard and submits it for approval. A moderator or administrator approves the blueprint. The user selects the approved blueprint in the experiment wizard, configures BTCUSDT data settings and split ratios, and submits the experiment. The backend validates the request, compiles snapshots, creates an experiment record, and queues the job. The worker executes the experiment, stores generated models and logs, and updates experiment progress. The user then reviews results through experiment detail, model ranking, downloads, favorites, and public hub pages.

The implementation also supports governance and operation. Role-based access control protects staff and administrator features. User management allows staff to manage accounts. System management provides queue and event visibility. Documentation provides guidance inside the application. These supporting modules make the system more complete than a standalone experiment execution tool.

The full workflow can be summarized as follows:

```text
Guest
  -> Register or Login
  -> Authenticated Dashboard
  -> Create Blueprint
  -> Request Blueprint Approval
  -> Staff Approves Blueprint
  -> Create Experiment from Approved Blueprint
  -> Backend Validates and Compiles Experiment
  -> Queue Experiment Job
  -> Worker Executes Experiment
  -> Store Models and Logs
  -> View Experiment Detail and Model Rankings
  -> Save Favorites or Browse Public Hub
```

**Table 6.37: End-to-End Module Integration**

| Workflow Stage      | Modules Involved                                 | Output                                      |
| ------------------- | ------------------------------------------------ | ------------------------------------------- |
| Access              | Authentication, sessions, route guards           | Authenticated user state                    |
| Governance          | RBAC, user management, blueprint moderation      | Controlled access and approved templates    |
| Template creation   | Blueprint wizard, validation, versioning         | Reusable blueprint record                   |
| Experiment setup    | Experiment wizard, validator, compiler           | Persisted experiment and compiled snapshots |
| Execution           | Queue, worker, market data, executor, strategies | Completed or failed experiment state        |
| Result storage      | Models, logs, repositories, database             | Model metrics and experiment artifacts      |
| Result inspection   | Experiment detail, model ranking, downloads      | User-readable research output               |
| Reuse and discovery | Favorites, public hub, user profile              | Saved and discoverable artifacts            |
| Operation           | System management, system events, settings       | Administrator visibility and control        |

> Note: Include one end-to-end workflow diagram after this section. The diagram should show the user journey from login to blueprint creation, experiment submission, queue execution, and result inspection.

## 6.5.17 Summary

The key modules developed for the Bitcoin Experimental Engine implement the system as a complete research platform. The authentication, authorization, dashboard, blueprint, experiment, market-data, queue, worker, model, log, favorites, public hub, documentation, user profile, user-management, and system-management modules work together to support the project objectives.

The implementation uses clear separation of responsibilities. Frontend views provide user interaction, backend controllers expose API boundaries, services coordinate workflows, validators enforce input correctness, repositories manage persistence, strategies encapsulate experiment behavior, and the worker executes long-running jobs in the background. This modular design improves maintainability and allows the system to support reproducible BTCUSDT experimentation with traceable outputs and role-aware governance.

---

# 6.6 APIs and Integration

This section explains how the frontend, backend, database, queue, worker, and market-data provider are integrated in the Bitcoin Experimental Engine. The implemented system uses JSON-based HTTP APIs as the main communication boundary between the Next.js frontend and Flask backend. The backend then integrates with PostgreSQL for persistence, Redis for queue-related runtime behavior, the worker process for asynchronous experiment execution, and a Binance-compatible market-data provider for BTCUSDT candle retrieval.

The API layer is important because it separates browser-facing user interaction from server-side business logic. Frontend views do not directly access the database, queue, worker, or market-data provider. Instead, the frontend calls backend API endpoints through a centralized API client. The backend receives the request, validates input, checks authentication and authorization, coordinates services, performs repository operations, and returns a structured response to the frontend.

## 6.6.1 API Architecture Overview

The backend exposes its feature endpoints under the `/api` route prefix. Route registration is centralized in `backend/app/routes.py`, where Flask blueprints are registered for authentication, users, experiments, blueprints, models, public hub, documentation, jobs, logs, market data, and system management. This keeps the API surface organized by module and allows each controller to focus on one feature area.

The frontend communicates with the backend using the same-origin browser path `/api/backend`. The endpoint map is defined in `frontend/lib/api/endpoints.ts`, while request functions are defined in `frontend/lib/api/client.ts`. During local development, `frontend/next.config.ts` rewrites `/api/backend/:path*` to the backend API route. As a result, browser code can call `/api/backend/auth/login`, and the request is forwarded to the backend route `/api/auth/login`.

This architecture gives the project a clear integration boundary. Frontend views only need to know the frontend API base path and endpoint map. The backend remains responsible for security, validation, persistence, queueing, and integration with supporting services.

**Table 6.38: API Architecture Components**

| Component                         | Source Area                                              | Implementation Responsibility                                                                   |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Backend route registry            | `backend/app/routes.py`                                | Registers all backend API blueprints under the configured API prefix                            |
| Backend controllers               | `backend/app/controllers/`                             | Expose module-specific HTTP endpoints and response payloads                                     |
| Frontend endpoint map             | `frontend/lib/api/endpoints.ts`                        | Centralizes browser-facing API paths used by frontend views                                     |
| Frontend API client               | `frontend/lib/api/client.ts`                           | Sends requests, includes credentials, obtains CSRF tokens, parses JSON, and raises typed errors |
| Frontend rewrite configuration    | `frontend/next.config.ts`                              | Forwards`/api/backend/*` browser calls to backend `/api/*` routes                           |
| Backend services and repositories | `backend/app/services/`, `backend/app/repositories/` | Execute business workflows and database operations behind the API layer                         |

> Note: Add one API architecture diagram here. The diagram should show: Browser -> Next.js Frontend -> `/api/backend/*` -> Next.js rewrite -> Flask `/api/*` -> controllers -> services/repositories -> PostgreSQL/Redis/worker/market-data provider.

## 6.6.2 Description of Internal APIs and External Integration

The internal API is implemented as REST-style JSON endpoints. Most frontend modules call backend endpoints through `apiGet`, `apiPost`, `apiPatch`, and `apiDelete`. GET requests are used for reading data such as dashboards, experiment details, model rankings, documentation, and public hub records. POST, PATCH, and DELETE requests are used for state-changing operations such as login, logout, blueprint creation, experiment submission, cancellation, favorite toggling, user updates, and system operations.

The backend integrates with PostgreSQL through SQLAlchemy repositories. Controllers and services open unit-of-work transactions, read or modify records, and return JSON responses. The frontend never communicates directly with PostgreSQL. This preserves the backend as the single authority for validation, authorization, and persistence.

The backend integrates with Redis through the queue service. When an experiment is created, the backend stores the experiment and then enqueues an experiment execution job. The worker consumes the job, executes the experiment, updates progress, and persists generated model and log records. The job and system APIs expose queue visibility to users and administrators.

The backend also integrates with a Binance-compatible market-data API for BTCUSDT candles. The market-data service retrieves candles, normalizes them, and stores them locally before charts or experiments use them. This design avoids making every chart or experiment execution depend directly on a live external request.

**Table 6.39: Internal and External Integration Points**

| Integration                     | Direction                                     | Purpose                                                                                                                           | Main Source Areas                                                                        |
| ------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Frontend to backend API         | Browser -> Next.js rewrite -> Flask API       | Allows views to perform authentication, blueprint, experiment, model, job, documentation, hub, market-data, and system operations | `frontend/lib/api/`, `frontend/views/`, `backend/app/controllers/`                 |
| Backend to PostgreSQL           | Controllers/services/repositories -> database | Persists users, blueprints, experiments, models, logs, candles, favorites, settings, and system events                            | `backend/app/repositories/`, `backend/app/infrastructure/database/`                  |
| Backend to Redis queue          | Queue service -> Redis                        | Enqueues experiment execution jobs and reads queue metadata                                                                       | `backend/app/services/queue_service.py`, `backend/app/infrastructure/redis/`         |
| Worker to persistence layer     | Worker/executor -> repositories -> database   | Updates experiment status, progress, model metrics, and logs after queued execution                                               | `backend/app/workers/`, `backend/app/executors/`, `backend/app/repositories/`      |
| Backend to market-data provider | Market-data service -> Binance-compatible API | Retrieves BTCUSDT candles for local cache refresh                                                                                 | `backend/app/services/market_data_service.py`, `backend/app/infrastructure/binance/` |
| Frontend to chart components    | View state -> reusable chart component        | Renders BTCUSDT chart data returned by backend APIs                                                                               | `frontend/components/charts/`, `frontend/views/`                                     |

## 6.6.3 API Endpoint Groups Implemented

The implemented endpoints are grouped by module. This makes the API easier to understand and test because each group maps to a feature area in the system. The endpoint groups listed in this section are based on the frontend endpoint map and backend route registration.

**Table 6.40: Implemented API Endpoint Groups**

| API Group          | Example Endpoints                                                                                                                                                                                                                                                                                                                                      | Main Purpose                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Health             | `GET /api/health`                                                                                                                                                                                                                                                                                                                                    | Checks backend service health and runtime status                                                                         |
| Authentication     | `GET /api/auth/csrf`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`                                                                                                                                                                                                                         | Handles CSRF token retrieval, registration, login, logout, and current-user session restoration                          |
| Users              | `GET /api/users`, `GET /api/users/me`, `GET /api/users/{id}`, `PATCH /api/users/{id}/status`, `PATCH /api/users/{id}/role`, `DELETE /api/users/{id}`                                                                                                                                                                                       | Provides profile and staff user-management operations                                                                    |
| Blueprints         | `POST /api/blueprints`, `GET /api/blueprints/{id}`, `PATCH /api/blueprints/{id}`, `GET /api/blueprints/metadata`, `POST /api/blueprints/{id}/favorite`                                                                                                                                                                                       | Supports blueprint creation, editing, detail retrieval, metadata loading, and favorites                                  |
| Blueprint library  | `GET /api/blueprints/library/owned`, `GET /api/blueprints/library/favorited`                                                                                                                                                                                                                                                                       | Lists owned and favorited blueprints                                                                                     |
| Blueprint approval | `POST /api/blueprints/{id}/request-approval`, `GET /api/blueprints/moderation/queue`, `POST /api/blueprints/{id}/approve`, `POST /api/blueprints/{id}/reject`, `POST /api/blueprints/{id}/disapprove`                                                                                                                                        | Supports owner approval requests and staff moderation                                                                    |
| Experiments        | `POST /api/experiments`, `GET /api/experiments`, `GET /api/experiments/{id}`, `POST /api/experiments/{id}/cancel`, `POST /api/experiments/{id}/retry`, `DELETE /api/experiments/{id}`, `GET /api/experiments/blueprint-options`                                                                                                          | Supports experiment creation, listing, detail retrieval, cancellation, retry, deletion, and selectable blueprint options |
| Jobs               | `GET /api/jobs/`, `GET /api/jobs/{id}`, `POST /api/jobs/{id}/cancel`                                                                                                                                                                                                                                                                             | Supports queue job listing, job detail, and cancellation                                                                 |
| Market data        | `GET /api/market-data/btcusdt/klines`, `GET /api/market-data/btcusdt/metadata`, `GET /api/market-data/btcusdt/target-preview`, `POST /api/market-data/btcusdt/admin/catch-up`, `GET /api/market-data/btcusdt/admin/catch-up/status`, `POST /api/market-data/btcusdt/admin/catch-up/stop`, `DELETE /api/market-data/btcusdt/admin/klines` | Provides BTCUSDT chart data, market-data metadata, target preview, and administrative cache maintenance                  |
| Models             | `GET /api/models/rankings`, `GET /api/models/highlights`, `GET /api/models/library/favorited`, `GET /api/models/{id}`, `POST /api/models/{id}/favorite`, `DELETE /api/models/{id}/favorite`                                                                                                                                                | Supports model ranking, model detail, highlights, and saved model behavior                                               |
| Logs               | `GET /api/logs/experiments/{id}/{artifact}`, `GET /api/logs/experiments/{id}/models/{modelId}/round`                                                                                                                                                                                                                                               | Supports experiment artifact downloads and model-level round logs                                                        |
| Public Hub         | `GET /api/hub`, `GET /api/hub/users/{id}`                                                                                                                                                                                                                                                                                                          | Supports public discovery of enabled users, approved blueprints, completed experiments, and generated models             |
| Documentation      | `GET /api/docs`, `GET /api/docs/{slug}`                                                                                                                                                                                                                                                                                                            | Lists and serves documentation content                                                                                   |
| System             | `GET /api/system/queue/active`, `GET /api/system/settings`, `GET /api/system/events`, `GET /api/system/events/download`                                                                                                                                                                                                                        | Provides administrator-facing queue, settings, event, and event-download operations                                      |

> Note: Add one API endpoint evidence screenshot from browser developer tools showing a successful `/api/backend/...` request and the corresponding JSON response. Use non-sensitive demonstration data only.

## 6.6.4 Frontend API Client Integration

The frontend API client is implemented in `frontend/lib/api/client.ts`. It provides helper functions for GET, POST, PATCH, and DELETE requests. All requests include browser credentials so that backend session cookies are sent with API calls. Mutating requests also obtain a CSRF token from the backend and attach it to the request headers.

The endpoint map is implemented in `frontend/lib/api/endpoints.ts`. It defines the API base path and all endpoint strings used by frontend views. The browser default is `/api/backend`, which matches the Next.js rewrite path. This prevents individual views from hard-coding backend origins or duplicating route strings.

The API client also standardizes error handling. If the backend returns a non-success response, the client parses the JSON payload and raises a typed `ApiClientError`. Frontend views can then display a form error, validation message, empty state, or page-level error message.

```text
PROCEDURE Send Frontend API Request
  RECEIVE endpoint path, HTTP method, optional payload, and optional headers
  BUILD browser URL from centralized API base path and endpoint map

  IF request method is GET THEN
    ATTACH Accept JSON header
  ELSE
    FETCH CSRF token from authentication endpoint
    ATTACH Accept JSON header
    ATTACH Content-Type JSON header
    ATTACH CSRF token header when available
  ENDIF

  INCLUDE browser credentials in request
  SEND request to `/api/backend` path
  WAIT for Next.js rewrite to forward request to backend `/api` route
  PARSE JSON response

  IF response status is not successful THEN
    CREATE typed frontend API error from backend error payload
    THROW error to calling view
  ENDIF

  RETURN parsed response payload
ENDPROCEDURE
```

**Table 6.41: Frontend API Client Responsibilities**

| Responsibility       | Implementation Detail                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Central API base     | Uses`/api/backend` in browser runtime unless overridden by a relative configured path                                                       |
| Endpoint consistency | Stores endpoint paths in`API_ENDPOINTS` instead of duplicating strings inside views                                                         |
| Credential handling  | Sends requests with browser credentials included                                                                                              |
| CSRF support         | Fetches CSRF token before POST, PUT, PATCH, or DELETE requests                                                                                |
| JSON parsing         | Parses JSON responses when the backend returns JSON content                                                                                   |
| Error handling       | Converts failed responses and network failures into`ApiClientError`                                                                         |
| View integration     | Exposes typed helper functions used by authentication, users, blueprints, experiments, models, hub, docs, jobs, market-data, and system views |

## 6.6.5 Backend API Controller Integration

Backend controllers are organized by feature area. Each controller receives an HTTP request, extracts path parameters or JSON payloads, calls the access-control service when authentication or authorization is required, validates input, coordinates services or repositories, and returns a standard response. This keeps request handling separate from frontend rendering and database internals.

For example, the authentication controller handles login and session lifecycle. The blueprint controllers handle draft creation, detail retrieval, favorites, versioning, and approval. The experiment controller validates and compiles experiment submissions before queueing execution jobs. The model controller exposes rankings, highlights, details, and favorites. The system controller exposes administrator-oriented queue, setting, and event data.

```text
PROCEDURE Handle Backend API Request
  RECEIVE HTTP request at Flask route
  READ path parameters, query parameters, or JSON payload
  IF endpoint requires authentication THEN
    RESOLVE authenticated user from session cookie
    IF user is missing THEN
      RETURN unauthenticated JSON response
    ENDIF
  ENDIF

  IF endpoint requires a role THEN
    VERIFY user role satisfies endpoint permission
    IF role is insufficient THEN
      RETURN forbidden JSON response
    ENDIF
  ENDIF

  VALIDATE request data
  IF validation fails THEN
    RETURN validation-error JSON response
  ENDIF

  OPEN unit of work when persistence is required
    CALL repository or service logic
    COMMIT operation if successful
  CLOSE unit of work

  RETURN standard success JSON response
ENDPROCEDURE
```

**Table 6.42: Backend Controller Integration by Module**

| Backend Controller Area              | Integration Responsibility                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `authentication_controller.py`     | Integrates user repository, password service, session service, CSRF token generation, and current-user lookup |
| `user_controller.py`               | Integrates user-management APIs with access control and user persistence                                      |
| `blueprint_controller.py`          | Integrates blueprint detail, creation, editing, favorite behavior, validation, and versioning                 |
| `blueprint_approval_controller.py` | Integrates staff moderation with blueprint approval-state transitions                                         |
| `experiment_controller.py`         | Integrates experiment validation, compiler snapshots, database persistence, and queue submission              |
| `job_controller.py`                | Integrates queue metadata with user-facing job detail and cancellation behavior                               |
| `market_data_controller.py`        | Integrates chart endpoints, metadata, target preview, and cache administration with market-data service       |
| `model_controller.py`              | Integrates model rankings, highlights, details, and model favorites                                           |
| `logs_download_controller.py`      | Integrates experiment log retrieval with downloadable artifact responses                                      |
| `public_hub_controller.py`         | Integrates public discovery of users, blueprints, experiments, and models                                     |
| `documentation_controller.py`      | Integrates documentation listing and detail retrieval                                                         |
| `system_controller.py`             | Integrates active queue snapshot, system settings, and system event retrieval                                 |

## 6.6.6 JSON Payload Structure

The backend uses JSON as the primary request and response format for application APIs. Successful responses commonly include an `ok` flag and a `data` object. Error responses include an `ok` flag set to false and an error object containing a machine-readable code and human-readable message. Validation responses include field-level error details where appropriate.

### Standard Success Response

```json
{
  "ok": true,
  "data": {
    "status": "success"
  }
}
```

### Standard Error Response

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted request is invalid."
  }
}
```

### Authentication Request Example

```json
{
  "email": "demo@example.com",
  "password": "example-password"
}
```

### Authentication Response Example

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": 1,
      "username": "demouser",
      "email": "demo@example.com",
      "name": "Demo User",
      "role": "User",
      "status": "Enabled"
    }
  }
}
```

### Blueprint Creation Payload Example

```json
{
  "metadata": {
    "name": "Baseline BTCUSDT Blueprint",
    "description": "Reusable baseline configuration for BTCUSDT experiments"
  },
  "indicators": {
    "parameters": {
      "sma": {
        "window": [20, 50]
      }
    },
    "parameter_constraints": {
      "sma": {
        "window": {
          "type": "integer",
          "min": 2,
          "max": 200
        }
      }
    }
  },
  "features": {},
  "architecture": {
    "name": "logistic_regression",
    "parameters": {
      "max_iter": 100
    },
    "parameter_constraints": {}
  }
}
```

### Experiment Creation Payload Example

```json
{
  "name": "BTCUSDT Baseline Experiment",
  "description": "Demonstration experiment using an approved blueprint",
  "symbol": "BTCUSDT",
  "interval": "1m",
  "start_datetime": "2026-01-01T00:00:00Z",
  "end_datetime": "2026-01-07T00:00:00Z",
  "train_split": 0.7,
  "val_split": 0.15,
  "test_split": 0.15,
  "blueprint_id": 1,
  "target_strategy": "forward_return",
  "split_strategy": "time_based_sequential",
  "deterministic": true,
  "seed": 42,
  "requested_permutation_count": 10,
  "parameter_overrides": {}
}
```

### Experiment Creation Response Example

```json
{
  "ok": true,
  "data": {
    "experiment": {
      "id": 10,
      "detailPath": "/experiments/10",
      "status": "Queued",
      "progress": 0,
      "maxPermutationCount": 20,
      "requestedPermutationCount": 10
    },
    "queue": {
      "jobId": "example-job-id",
      "queueName": "experiments",
      "position": 1
    }
  }
}
```

> Note: Keep all API payload examples in the final report non-sensitive. Demonstration email addresses, usernames, experiment names, and identifiers should not reveal real accounts or private local data.

## 6.6.7 Authentication, Session, and CSRF Integration

The system uses server-managed session authentication. After successful login, the backend creates a session record associated with the authenticated user id and role. The session identifier is sent to the browser as an HTTP-only cookie. The frontend does not store the credential value and does not decide authentication status by itself.

When the frontend loads, `AuthProvider` calls the current-user endpoint through the API client. If the backend confirms that the session is valid, the frontend stores the safe current-user object in its authentication state. If the session is missing, expired, or invalid, authenticated routes are blocked or redirected.

CSRF protection is used for state-changing requests. The frontend API client checks whether the HTTP method changes server state. For POST, PUT, PATCH, and DELETE requests, it obtains a CSRF token from the backend and attaches it to the request headers. The backend validates CSRF requirements before allowing protected mutations.

```text
PROCEDURE Authenticate And Use Session
  USER submits login form
  FRONTEND sends login payload through API client
  BACKEND validates credential and account status
  BACKEND creates server-managed session
  BACKEND sets HTTP-only session cookie
  FRONTEND receives safe user object
  FRONTEND stores current user in authentication provider

  WHEN page refreshes
    FRONTEND calls current-user endpoint with browser credentials
    BACKEND resolves session cookie and returns safe user object
    FRONTEND restores authenticated UI state
  ENDWHEN
ENDPROCEDURE
```

```text
PROCEDURE Send State-Changing Request
  DETERMINE request method
  IF method is POST, PUT, PATCH, or DELETE THEN
    REQUEST CSRF token from backend
    ADD CSRF token to request header
    ADD JSON content-type header
  ENDIF
  INCLUDE browser credentials
  SEND request through frontend API path
  PARSE backend response
  IF backend returns error THEN
    DISPLAY or store typed frontend error
  ELSE
    UPDATE frontend state with response data
  ENDIF
ENDPROCEDURE
```

**Table 6.43: Authentication and CSRF Integration**

| Mechanism                | Implementation Responsibility                                                         |
| ------------------------ | ------------------------------------------------------------------------------------- |
| Server-managed session   | Backend creates and validates session records associated with user identity and role  |
| HTTP-only cookie         | Browser stores session identifier without exposing it directly to frontend JavaScript |
| Current-user endpoint    | Frontend restores session-aware identity after page refresh                           |
| Route guards             | Frontend blocks or redirects unauthenticated and role-restricted screens              |
| Backend access control   | Backend enforces authentication and role checks before protected operations           |
| CSRF token endpoint      | Backend provides token used by frontend mutating requests                             |
| API client CSRF handling | Frontend attaches CSRF token to state-changing requests                               |

## 6.6.8 Experiment Submission and Worker Integration

Experiment submission demonstrates the deepest integration flow in the system. It involves the frontend experiment wizard, backend validation, blueprint access checking, experiment compilation, database persistence, queue submission, worker execution, model persistence, log persistence, and frontend status updates.

The frontend sends the experiment creation payload through `POST /api/experiments`. The backend validates the payload and selected blueprint, compiles immutable snapshots, stores the experiment, creates placeholder model rows for selected parameter hashes, and enqueues the job. The worker later consumes the job and updates the experiment status and result records.

```text
PROCEDURE Submit Experiment Through API
  FRONTEND collects wizard form state
  FRONTEND sends POST request to experiment creation endpoint
  BACKEND authenticates user
  BACKEND validates experiment fields and blueprint access
  BACKEND compiles blueprint and experiment snapshots
  BACKEND stores experiment as Queued
  BACKEND creates model placeholder rows for selected parameter hashes
  BACKEND enqueues experiment execution job
  BACKEND returns experiment id, detail path, status, permutation counts, and queue metadata
  FRONTEND navigates to experiment detail or job detail page
ENDPROCEDURE
```

```text
PROCEDURE Execute Queued Experiment Integration
  WORKER receives queued job payload
  WORKER validates experiment id
  WORKER marks experiment as Running
  EXECUTOR loads experiment configuration and persisted BTCUSDT data
  EXECUTOR runs split, features, targets, scaling, training, evaluation, and backtest
  EXECUTOR stores model metrics and experiment logs
  WORKER marks experiment as Completed or Failed
  FRONTEND refreshes experiment or job detail through API
ENDPROCEDURE
```

> Note: Add a sequence diagram for this integration. Recommended sequence: Experiment Wizard -> Frontend API Client -> Flask Experiment API -> PostgreSQL -> Queue Service -> Redis -> Worker -> Executor -> PostgreSQL -> Experiment Detail View.

## 6.6.9 Market Data and Chart Integration

Market-data integration supports both chart display and experiment execution. The frontend chart requests BTCUSDT kline data from the backend. The backend reads cached candle data from PostgreSQL and returns chart-ready records. Administrative market-data endpoints can trigger catch-up or cache maintenance when needed.

The backend market-data service also retrieves BTCUSDT candles from the configured provider. Retrieved candles are normalized and persisted into the local database. The experiment executor later reads persisted candles rather than relying directly on a live external request during every experiment run.

```text
PROCEDURE Load BTCUSDT Chart Data
  FRONTEND requests BTCUSDT kline endpoint with range and interval parameters
  BACKEND validates range and interval
  BACKEND queries cached candle records from market-data repository
  BACKEND maps database candles into chart response records
  FRONTEND receives candle array
  FRONTEND renders chart or empty/error state
ENDPROCEDURE
```

```text
PROCEDURE Refresh BTCUSDT Cache
  BACKEND receives refresh or catch-up request
  BACKEND determines missing or requested candle range
  BACKEND calls configured market-data provider
  BACKEND normalizes candle timestamps and OHLCV values
  BACKEND upserts candles into PostgreSQL
  BACKEND returns fetched, inserted, and updated counts
ENDPROCEDURE
```

**Table 6.44: Market Data API Integration**

| API Area                      | Data Source                                   | Output Consumer                             |
| ----------------------------- | --------------------------------------------- | ------------------------------------------- |
| Kline chart endpoint          | Cached BTCUSDT candles in PostgreSQL          | Dashboard and chart components              |
| Metadata endpoint             | Market-data repository summary                | Dashboard and administrative views          |
| Target preview endpoint       | Cached BTCUSDT data and target strategy logic | Experiment wizard preview or validation aid |
| Catch-up endpoints            | Market-data service and provider client       | Administrative market-data maintenance      |
| Experiment executor data load | Market-data repository                        | Worker execution pipeline                   |

## 6.6.10 Model, Log, Favorite, and Public Hub Integration

After an experiment completes, generated model and log records become available through model, log, favorite, and public hub APIs. The model endpoints provide rankings, highlights, detail pages, and favorite actions. The log endpoints provide downloadable artifacts and model-level round logs. The public hub endpoint exposes enabled users, approved blueprints, completed experiments, and generated models for discovery.

These APIs reuse the same persisted records created by the worker. This avoids duplicate result storage and keeps the application consistent. A model visible in rankings can also appear in public hub, be opened in a detail page, and be saved as a favorite.

```text
PROCEDURE Inspect Completed Experiment Results
  FRONTEND opens experiment detail view
  BACKEND returns experiment configuration, progress, models, logs, and compiled snapshots
  FRONTEND displays model summary and artifact actions

  IF user opens model ranking THEN
    FRONTEND requests ranking endpoint
    BACKEND orders models by selected metric
    FRONTEND renders ranking table
  ENDIF

  IF user downloads artifact THEN
    FRONTEND requests log download endpoint
    BACKEND verifies access and formats artifact
    FRONTEND receives downloadable file response
  ENDIF
ENDPROCEDURE
```

```text
PROCEDURE Save Artifact As Favorite
  FRONTEND sends favorite request for model or blueprint
  BACKEND authenticates user
  BACKEND verifies target artifact exists and is visible
  IF favorite already exists THEN
    RETURN existing favorite state
  ELSE
    CREATE favorite association record
    RETURN favorited state
  ENDIF
ENDPROCEDURE
```

## 6.6.11 Error Handling and Validation Integration

The API layer uses structured JSON responses for errors. Validation errors are returned when submitted payloads are incomplete, incorrectly formatted, or inconsistent with business rules. Authentication errors are returned when a session is missing or invalid. Authorization errors are returned when the user role is insufficient. Queue errors are returned when Redis-backed queue functionality is unavailable. Market-data errors are returned when candle retrieval or cache operations fail.

The frontend API client converts failed responses into typed errors. Views can display these errors as form-level messages, field-level validation messages, page-level alerts, or empty states. This prevents raw backend errors from appearing directly in the interface and makes user feedback more consistent.

**Table 6.45: API Error Handling Categories**

| Error Category       | Example Situation                                        | Expected API Behavior                           | Frontend Behavior                  |
| -------------------- | -------------------------------------------------------- | ----------------------------------------------- | ---------------------------------- |
| Validation error     | Invalid experiment split or missing blueprint field      | Return JSON validation error with field details | Show field or form error           |
| Authentication error | User accesses protected endpoint without valid session   | Return unauthenticated JSON response            | Redirect or show login requirement |
| Authorization error  | Normal user accesses administrator endpoint              | Return forbidden JSON response                  | Show restricted-access state       |
| Not found error      | Requested experiment, model, or blueprint does not exist | Return not-found JSON response                  | Show not-found or empty state      |
| Queue error          | Queue service cannot be reached                          | Return service-unavailable JSON response        | Show operational error message     |
| Market-data error    | Candle refresh fails or range is invalid                 | Return market-data error response               | Show chart or admin error state    |
| Network error        | Backend unreachable from browser                         | API client raises network-style error           | Show backend unavailable message   |

```text
PROCEDURE Handle API Error In Frontend View
  CALL API client function
  IF request succeeds THEN
    STORE response data
    RENDER normal content
  ELSE IF error contains validation details THEN
    MAP details to form fields or validation summary
  ELSE IF error status is unauthenticated THEN
    REDIRECT to login or show login prompt
  ELSE IF error status is forbidden THEN
    SHOW restricted-access message
  ELSE
    SHOW page-level error state
  ENDIF
ENDPROCEDURE
```

## 6.6.12 API Integration Evidence to Include

The final report should include API and integration evidence that demonstrates real communication between modules. The best evidence is not a long source-code listing, but a combination of diagrams, endpoint tables, request/response samples, and screenshots from the running system.

Recommended evidence:

- Integration diagram showing browser, frontend rewrite, backend API, database, Redis, worker, and market-data provider.
- Browser developer tools screenshot showing a frontend request to `/api/backend/...` and a successful JSON response.
- Backend terminal or health endpoint screenshot showing the API is running.
- Sample JSON request and response for login or experiment creation.
- Sequence diagram for experiment submission and worker execution.
- Screenshot of a failed validation response displayed in the frontend form.

> Note: Do not include real credentials, private session cookie values, local secrets, or private account data in screenshots. Use demonstration accounts and sanitized responses.

## 6.6.13 Summary

The implemented APIs and integration structure connect the full system together. The Next.js frontend communicates with the Flask backend through a centralized API client and `/api/backend` rewrite path. The backend exposes modular JSON APIs under `/api`, validates and authorizes requests, persists data through repositories, enqueues long-running experiment work through Redis-backed queueing, and integrates with BTCUSDT market-data retrieval.

This API design supports maintainability because each module has a clear boundary. Frontend views use endpoint definitions rather than hard-coded backend origins. Backend controllers handle HTTP requests and delegate business behavior to services, validators, repositories, and workers. Infrastructure integrations such as PostgreSQL, Redis, and market-data retrieval remain behind backend boundaries. As a result, the system can support secure user workflows, reproducible experiment submission, asynchronous execution, result inspection, documentation access, public discovery, and administrative monitoring.

---

# 6.7 Network Configuration

This section explains how the Bitcoin Experimental Engine is connected in the local development and demonstration environment. The implemented system is a multi-service application rather than a single process. The browser accesses the Next.js frontend, the frontend forwards API requests to the Flask backend, the backend connects to PostgreSQL and Redis, and the worker process consumes queued experiment jobs through the queue service.

The network configuration is important because the system depends on several cooperating services. Authentication, blueprint management, experiment submission, model inspection, market-data charting, job monitoring, and system management all require reliable communication between the frontend, backend, database, queue, and worker. The local configuration keeps these services separate while still allowing the system to run on one development machine for assessment demonstration.

## 6.7.1 Local Hosting Setup

The implemented system is hosted locally as a group of services. The frontend runs as a local Next.js development server. The backend runs as a Flask API server. PostgreSQL runs as the persistent database service. Redis runs as the queue and runtime support service. The worker runs as a separate backend process that listens for experiment execution jobs. This separation reflects the actual deployed architecture because each service has a clear responsibility.

In this setup, the browser does not call the database, queue, worker, or market-data provider directly. The browser communicates with the frontend application. The frontend communicates with the backend through the configured API rewrite path. The backend then controls all access to persistence, queueing, worker-triggered execution, and market-data integration. This protects the system boundaries and keeps sensitive runtime services away from direct browser access.

**Table 6.46: Local Hosting Components**

| Service              | Local Host Role                             | Responsibility                                                                                      |
| -------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Browser              | Client runtime                              | Displays the user interface and sends requests to the frontend application                          |
| Next.js frontend     | Local web server                            | Serves route pages, views, reusable components, and browser-facing API calls                        |
| Flask backend        | Local API server                            | Exposes JSON API routes, validates requests, applies access control, and coordinates business logic |
| Experiment worker    | Local background process                    | Executes queued experiments and updates progress, models, and logs                                  |
| PostgreSQL           | Local database service                      | Stores users, blueprints, experiments, models, logs, candles, favorites, settings, and events       |
| Redis                | Local queue service                         | Supports queued job processing and queue metadata                                                   |
| Market-data provider | External HTTP service configured by`.env` | Supplies BTCUSDT candle data that is normalized and cached by the backend                           |

> Note: Add a local network diagram here. The diagram should show Browser -> Next.js Frontend -> `/api/backend/*` -> Flask Backend `/api/*`; Flask Backend -> PostgreSQL; Flask Backend -> Redis; Worker -> Redis; Worker -> PostgreSQL; Backend market-data service -> BTCUSDT market-data provider.

## 6.7.2 Port Configuration

The local development environment uses fixed default ports so that services can find one another consistently. The frontend is served on port `3000`, and the backend API is served on port `5000`. PostgreSQL and Redis use their standard local service ports. The worker does not expose a browser-facing port because it operates as a background consumer of queue jobs.

The frontend uses `/api/backend/*` as the browser-facing API path. The Next.js rewrite configuration forwards that path to the backend origin and maps it to the backend `/api/*` route prefix. For example, a browser request to `/api/backend/auth/me` is forwarded to the backend route `/api/auth/me`. This allows frontend code to use a consistent same-origin API path while preserving the backend as a separate service.

**Table 6.47: Local Port and Address Configuration**

| Component                | Default Local Address or Path                      | Configuration Source                                   | Purpose                                                           |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| Frontend web application | `http://localhost:3000`                          | Next.js development server                             | Serves the browser user interface                                 |
| Backend API              | `http://localhost:5000`                          | Flask backend runtime                                  | Serves backend JSON API routes                                    |
| Frontend API path        | `/api/backend/*`                                 | `frontend/lib/api/endpoints.ts`                      | Browser-facing API base path used by frontend views               |
| Frontend rewrite         | `/api/backend/:path*` -> backend `/api/:path*` | `frontend/next.config.ts` and `.env`               | Forwards browser API calls from frontend server to backend server |
| Backend API prefix       | `/api/*`                                         | Backend application configuration                      | Groups backend feature routes under a common API prefix           |
| PostgreSQL               | `localhost:5432`                                 | `.env` database configuration                        | Provides persistent relational storage                            |
| Redis                    | `localhost:6379`                                 | `.env` queue configuration                           | Provides queue-related runtime support                            |
| Worker process           | No public port                                     | `scripts/start_app.sh` and backend worker entrypoint | Consumes queued experiment jobs in the background                 |

## 6.7.3 Frontend to Backend Proxy Configuration

The frontend to backend proxy is implemented through the Next.js rewrite configuration. The frontend reads the backend API origin from `.env`. If no custom backend origin is supplied, the local backend origin defaults to `http://localhost:5000`. Browser API calls use `/api/backend` as the base path, and the rewrite forwards the request to the Flask backend under `/api`.

This configuration reduces local cross-origin complexity because the browser sends requests to the same frontend origin. The Next.js server performs the forwarding step. The backend still validates the request, checks sessions, verifies CSRF tokens for state-changing operations, applies access control, and returns the final JSON response.

The proxy flow is shown below.

```text
Browser
  -> http://localhost:3000
  -> /api/backend/auth/me
  -> Next.js rewrite
  -> http://localhost:5000/api/auth/me
  -> Flask authentication controller
  -> JSON response back through frontend path
```

**Table 6.48: Frontend Proxy Configuration Responsibilities**

| Configuration Element             | Responsibility                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`      | Defines the browser-facing API base path used by frontend API helpers           |
| `BACKEND_API_ORIGIN`            | Defines the backend target origin used by the Next.js rewrite                   |
| `frontend/next.config.ts`       | Maps`/api/backend/:path*` to backend `/api/:path*`                          |
| `frontend/lib/api/endpoints.ts` | Centralizes endpoint paths so frontend views do not hard-code backend addresses |
| `frontend/lib/api/client.ts`    | Sends requests with credentials, JSON headers, CSRF handling, and error parsing |

> Note: Add a screenshot from browser developer tools showing a request to `/api/backend/auth/me` or `/api/backend/health`. The screenshot should show a successful JSON response and must not show private cookie values.

## 6.7.4 Backend Network Configuration

The backend API is hosted as a Flask server in the local environment. It exposes route groups under the `/api` prefix. These route groups include authentication, users, blueprints, experiments, jobs, market data, models, logs, public hub, documentation, and system management. The backend listens on the local backend address and receives requests forwarded by the frontend or sent directly during backend testing.

Backend configuration values are read from `.env`. The backend uses these values to determine database connection, Redis connection, API behavior, session behavior, cookie settings, market-data provider base address, and allowed frontend origins. This keeps local addresses and deployment-specific values outside source code.

The backend also includes allowed-origin configuration for browser access. In local demonstration, the frontend origin is expected to be `http://localhost:3000` or another explicitly configured local frontend address. The allowed-origin configuration supports browser-based API access while still preventing uncontrolled origins from interacting with protected API routes.

**Table 6.49: Backend Network Configuration Values**

| Configuration Value         | Used By                                   | Network Purpose                                           |
| --------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| `FLASK_ENV`               | Backend runtime                           | Selects backend environment behavior                      |
| `DATABASE_URL`            | Backend database layer                    | Provides PostgreSQL connection path                       |
| `REDIS_URL`               | Backend queue/session services and worker | Provides Redis connection path                            |
| `QUEUE_NAME`              | Queue service and worker                  | Identifies the queue names used for experiment execution  |
| `BINANCE_BASE_URL`        | Market-data service                       | Defines the configured market-data provider origin        |
| `SESSION_COOKIE_SAMESITE` | Backend session handling                  | Controls browser session cookie same-site behavior        |
| `SESSION_COOKIE_SECURE`   | Backend session handling                  | Controls whether session cookies require secure transport |
| `CORS_ALLOW_ORIGINS`      | Backend API response handling             | Defines allowed frontend origins for browser API access   |

> Note: If configuration evidence is included, use a sanitized table instead of a screenshot of `.env`. Do not show private secrets, local credentials, session cookie values, or private connection strings.

## 6.7.5 Database and Redis Connectivity

PostgreSQL and Redis are required supporting services in the local network configuration. PostgreSQL stores all durable system data, while Redis supports queued job processing and related runtime behavior. The backend and worker both depend on these services.

The startup script checks that Redis is reachable before starting the backend, worker, and frontend processes. The script also requires database configuration to be present before it starts the application. These checks help avoid confusing runtime failures where the frontend loads but backend operations fail because required infrastructure is unavailable.

The database and queue connectivity flow is shown below.

```text
Flask Backend
  -> PostgreSQL through database configuration
  -> Redis through queue configuration

Experiment Worker
  -> Redis queue to receive jobs
  -> PostgreSQL through repositories to update experiments, models, and logs
```

**Table 6.50: Supporting Service Connectivity**

| Service        | Connected Components                            | Purpose                                                 |
| -------------- | ----------------------------------------------- | ------------------------------------------------------- |
| PostgreSQL     | Flask backend, worker                           | Stores persistent system records and experiment outputs |
| Redis          | Flask backend, worker                           | Stores queued jobs and queue metadata                   |
| Queue service  | Flask backend -> Redis                          | Enqueues experiment jobs from API requests              |
| Worker process | Redis -> worker -> PostgreSQL                   | Consumes experiment jobs and persists execution results |
| Startup script | Local terminal -> Redis/backend/frontend/worker | Checks dependencies and starts services together        |

## 6.7.6 Worker Network Role

The worker is part of the backend runtime, but it does not expose a public HTTP address. Instead, it connects to Redis and waits for queued experiment jobs. When a job is available, the worker loads the referenced experiment from PostgreSQL, runs the experiment executor, and updates experiment status, progress, model metrics, and logs.

This design is important because long-running experiment work should not block normal API requests. The backend API only accepts and queues the experiment. The worker performs the computation separately. The frontend can then poll or refresh job and experiment endpoints to show updated status.

```text
User submits experiment
  -> Flask backend validates and queues job
  -> Redis stores job
  -> Worker consumes job
  -> Worker reads and writes PostgreSQL records
  -> Frontend reads updated status through backend API
```

> Note: Add a sequence diagram showing API submission and worker execution. The worker should be shown as a background process connected to Redis and PostgreSQL, not as a browser-accessible service.

## 6.7.7 Local Startup Network Flow

The local startup script under `scripts/` starts the integrated development environment after checking prerequisites. It verifies required commands, checks Redis connectivity, verifies the backend Python environment, verifies frontend dependencies, requires database configuration, starts the backend on `http://localhost:5000`, starts the worker, and starts the frontend on `http://localhost:3000`.

This startup flow makes the network configuration repeatable. Instead of manually starting each process and risking a missing service, the script starts the expected local network of cooperating services. It also stops child processes safely when the startup session ends.

```text
PROCEDURE Start Local Network Services
  VERIFY required runtime commands exist
  VERIFY Redis is reachable through configured Redis address
  VERIFY backend runtime environment exists
  VERIFY frontend dependencies exist
  VERIFY database configuration exists
  START backend API on local backend address
  START experiment worker process
  START frontend server on local frontend address
  WAIT until one process exits
  STOP remaining child processes safely
ENDPROCEDURE
```

**Table 6.51: Startup Script Network Responsibilities**

| Startup Step                 | Network Purpose                                                     |
| ---------------------------- | ------------------------------------------------------------------- |
| Check Redis reachability     | Confirms queue service is available before backend and worker start |
| Check database configuration | Confirms backend has database connection information                |
| Start backend                | Opens the local API server for frontend and test requests           |
| Start worker                 | Connects background experiment execution to the queue               |
| Start frontend               | Opens browser-facing web application                                |
| Cleanup on exit              | Stops child processes to avoid stale local services                 |

## 6.7.8 Local Demonstration Network Diagram

The recommended local network diagram for the report is shown conceptually below. This diagram can be redrawn as a formal figure in the final document.

```text
Browser
  |
  | http://localhost:3000
  v
Next.js Frontend
  |
  | /api/backend/* rewrite
  v
Flask Backend API
  |                |                 |
  |                |                 |
  v                v                 v
PostgreSQL       Redis Queue      Market-Data Provider
  ^                |
  |                v
  |             Worker Process
  |                |
  +----------------+
```

> Note: Label the final figure as a local network configuration diagram. It should show service boundaries and ports, but it should not include private environment values or secret keys.

## 6.7.9 Deployment to Server or Live Environment

The current implementation is configured primarily for local development and assessment demonstration. However, the logical service boundaries are suitable for adaptation to a server or managed deployment environment. The frontend, backend, database, Redis service, and worker can be deployed as separate processes or services while keeping the same communication responsibilities.

A production-oriented deployment would require a production-grade frontend build, a production WSGI or application server for Flask, secure `.env` values, a managed PostgreSQL service or properly administered database server, a managed Redis service or equivalent queue service, HTTPS termination, restricted allowed origins, secure cookie settings, logging, monitoring, and process supervision for the worker.

The most important deployment requirement is to preserve the same logical network structure with stronger security controls. The browser should only access the frontend and public API entry points. The database and Redis service should not be publicly exposed. The worker should remain a private background process. Secrets and connection values should be supplied through secure runtime configuration rather than being stored in source files.

**Table 6.52: Local Demonstration vs Production-Oriented Deployment**

| Area        | Local Demonstration                         | Production-Oriented Deployment                                           |
| ----------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| Frontend    | Next.js local development server            | Production frontend build served by managed hosting or process manager   |
| Backend     | Flask local server                          | Production application server behind HTTPS and reverse proxy             |
| Database    | Local PostgreSQL service                    | Managed or secured PostgreSQL service                                    |
| Queue       | Local Redis service                         | Managed or secured Redis-compatible service                              |
| Worker      | Local backend process                       | Supervised background process or worker service                          |
| API routing | `/api/backend/*` rewrite to local backend | Reverse proxy or hosted rewrite to backend API service                   |
| Security    | Local demonstration settings                | HTTPS, secure cookies, restricted origins, secret management, monitoring |

> Note: If the submitted project is demonstrated locally only, state that the implemented deployment target is local demonstration. Do not imply that a public live deployment exists unless it has actually been deployed and verified.

## 6.7.10 Network Configuration Evidence to Include

The final report should include evidence that the local network configuration works. The most useful evidence is a combination of diagrams, terminal output, browser screenshots, and API request evidence.

Recommended evidence:

- Screenshot of the startup script showing backend, worker, and frontend services starting.
- Screenshot of the frontend running at `http://localhost:3000`.
- Screenshot of backend health or API response from the browser or terminal.
- Browser developer tools screenshot showing `/api/backend/*` request forwarding successfully.
- Screenshot of job detail or experiment detail showing that worker updates are visible through the frontend.
- Local network configuration diagram showing the services and ports.

> Note: Crop or mask any terminal output that contains private local values. Do not show session cookie values, secrets, database connection strings, or private account data.

## 6.7.11 Summary

The network configuration of the Bitcoin Experimental Engine is based on a local multi-service setup. The frontend runs on port `3000`, the backend API runs on port `5000`, PostgreSQL provides persistent storage, Redis provides queue support, and the worker process handles long-running experiment execution in the background. The frontend communicates with the backend through the `/api/backend/*` path, which is rewritten to backend `/api/*` routes.

This configuration supports the system requirements because it allows browser interaction, secure backend processing, persistent storage, asynchronous execution, chart data access, result inspection, and administrative monitoring to work together. The same service boundaries can be adapted for a production-oriented environment by adding HTTPS, secure runtime configuration, managed services, restricted origins, and process supervision.

---

# 6.8 Security Measures

This section describes the security measures implemented in the Bitcoin Experimental Engine. The system includes browser-facing workflows, authenticated user actions, staff moderation, administrative functions, asynchronous jobs, and persisted research artifacts. Therefore, security is applied at multiple layers: frontend validation and route guards, backend authentication and authorization, server-managed sessions, CSRF protection, backend validators, repository-based persistence, standardized error responses, and operational event logging.

The security design follows an important principle: frontend checks improve usability, but backend checks remain authoritative. A user interface may hide restricted navigation or display validation feedback, but the backend still validates every protected operation before data is persisted, modified, queued, or returned. This is necessary because protected endpoints can be called directly even when frontend navigation is hidden.

## 6.8.1 Input Validation

Input validation is implemented at both frontend and backend levels. Frontend validation gives fast feedback to users when forms contain missing or incorrect values. Backend validation is the final enforcement point because backend controllers receive the actual submitted payload and decide whether the operation should continue.

The backend validates authentication payloads, blueprint payloads, experiment configuration, date ranges, split ratios, BTCUSDT scope, parameter override structure, role-management operations, and artifact access. For example, the experiment controller calls the experiment validator before compiling an experiment or queueing a job. The blueprint controller calls the blueprint validator before creating or updating a blueprint. Authentication routes validate registration and login inputs before checking persistence or session behavior.

This validation protects both data correctness and security. Invalid experiment splits could compromise experiment validity. Malformed parameter overrides could cause execution errors. Inaccessible blueprint identifiers could allow users to reference artifacts they should not use. Backend validation prevents these cases from becoming stored records or queued jobs.

**Table 6.53: Input Validation Controls**

| Validation Area          | Implementation Location                                                   | Security Purpose                                                                          |
| ------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Registration payload     | `backend/app/controllers/authentication_controller.py`                  | Ensures required account fields are present and formatted before user creation            |
| Login payload            | `backend/app/controllers/authentication_controller.py`                  | Ensures submitted login data is valid before credential verification                      |
| Blueprint payload        | `backend/app/validators/blueprint_validator.py`                         | Validates blueprint metadata, indicators, features, architecture, and parameter structure |
| Experiment payload       | `backend/app/validators/experiment_validator.py`                        | Validates experiment configuration before persistence and queue submission                |
| Experiment compilation   | `backend/app/execution/experiment_compiler.py`                          | Validates overrides and parameter constraints before execution snapshots are created      |
| Role and account updates | `backend/app/controllers/user_controller.py` and access-control service | Prevents unauthorized or invalid staff user-management changes                            |
| API request handling     | `backend/app/controllers/`                                              | Rejects invalid JSON and invalid path or query input before business logic continues      |
| Frontend forms           | `frontend/views/` and frontend validators                               | Provides immediate user-facing feedback before API submission                             |

```text
PROCEDURE Validate Protected Form Submission
  FRONTEND checks required fields and displays immediate feedback
  FRONTEND sends payload to backend API
  BACKEND verifies JSON payload structure
  BACKEND validates required fields and business rules
  BACKEND checks authenticated user and artifact access
  IF validation fails THEN
    RETURN structured validation error
  ENDIF
  CONTINUE persistence, queueing, or update operation
ENDPROCEDURE
```

> Note: Add a screenshot of a validation error in the frontend, such as an invalid experiment split or incomplete blueprint form. This demonstrates both security enforcement and user feedback.

## 6.8.2 Credential Protection

Credential protection is implemented using one-way hashing. During registration, the backend does not store the submitted credential value directly. Instead, it passes the value through the password service, which uses Werkzeug password hashing helpers. During login, the submitted credential is verified against the stored hash rather than compared to a stored plain value.

This design reduces risk if database records are inspected or exposed because the stored credential field is not the original credential. The authentication controller also returns only safe user fields such as id, username, email, name, role, and status. It does not return the stored credential hash to the frontend.

**Table 6.54: Credential Protection Measures**

| Measure                    | Implementation Location                                     | Description                                                    |
| -------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| One-way credential hashing | `backend/app/services/password_service.py`                | Hashes submitted credential values before storage              |
| Hash verification          | `backend/app/services/password_service.py`                | Verifies login submissions against stored hashes               |
| Safe user response         | `backend/app/controllers/authentication_controller.py`    | Returns safe profile fields without exposing credential hashes |
| Duplicate account checks   | `authentication_controller.py` and user repository        | Prevents duplicate username or email registration              |
| Disabled account check     | `authentication_controller.py` and access-control service | Blocks login or session restoration for disabled accounts      |

```text
PROCEDURE Store New User Credential
  RECEIVE registration credential
  VALIDATE credential length and account fields
  HASH credential using backend password service
  STORE credential hash in user record
  DISCARD original submitted credential after request handling
ENDPROCEDURE
```

```text
PROCEDURE Verify Login Credential
  RECEIVE email and credential from login request
  LOAD user by normalized email
  IF user is missing THEN
    RETURN invalid-credentials response
  ENDIF
  VERIFY submitted credential against stored hash
  IF verification fails THEN
    RETURN invalid-credentials response
  ENDIF
  IF user account is disabled THEN
    RETURN account-disabled response
  ENDIF
  CREATE authenticated session
ENDPROCEDURE
```

> Note: Do not include credential hashes, real passwords, real email addresses, or private account details in report screenshots. Use demonstration values only.

## 6.8.3 Server-Managed Sessions

Authenticated identity is maintained through server-managed sessions. After successful login, the backend creates a session record containing the session identifier, user id, role, creation time, and expiry time. The session identifier is stored in a browser cookie, while the session data itself is managed by the backend session service. The session service can use Redis-backed storage or memory-backed storage depending on configuration.

The access-control service resolves the current user from the session cookie. It checks whether the session exists, whether the user still exists, and whether the user is still enabled. If the user is missing or disabled, the session is destroyed and the request is treated as unauthenticated. This prevents disabled users from continuing to access the system through an old session.

Session behavior is configured through `.env`. Important settings include the session backend, timeout, cookie name, same-site behavior, and secure-cookie behavior. For local demonstration, development settings are used. For production-oriented deployment, secure cookie settings and HTTPS should be enabled.

**Table 6.55: Session Security Configuration**

| Session Area                  | Configuration or Source                           | Security Purpose                                                        |
| ----------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| Session identifier generation | `backend/app/services/session_service.py`       | Generates random session identifiers for authenticated users            |
| Session timeout               | `.env` and runtime settings                     | Controls how long authenticated sessions remain valid                   |
| Session backend               | `.env`                                          | Selects Redis-backed or memory-backed session behavior                  |
| Session cookie name           | `.env` and backend configuration                | Identifies the browser cookie used for authentication session lookup    |
| Same-site cookie behavior     | `.env`                                          | Reduces unintended cross-site session use                               |
| Secure cookie behavior        | `.env`                                          | Enables secure-cookie behavior for production-oriented HTTPS deployment |
| Session invalidation          | `session_service.py` and access-control service | Destroys sessions during logout or when user state is invalid           |

```text
PROCEDURE Create Server-Managed Session
  GENERATE random session identifier
  STORE user id, role, created time, and expiry time in backend session store
  IF Redis session backend is configured THEN
    STORE session with expiry time in Redis
  ELSE
    STORE session in in-memory session store
  ENDIF
  RETURN session identifier for HTTP-only browser cookie
ENDPROCEDURE
```

```text
PROCEDURE Resolve Session For Request
  READ session identifier from configured cookie name
  IF cookie is missing THEN
    RETURN unauthenticated context
  ENDIF
  LOAD session record from backend session store
  IF session is missing or expired THEN
    RETURN unauthenticated context
  ENDIF
  LOAD user by session user id
  IF user is missing or disabled THEN
    DESTROY session record
    RETURN unauthenticated context
  ENDIF
  RETURN authenticated context containing user identity and role
ENDPROCEDURE
```

## 6.8.4 CSRF Protection

CSRF protection is implemented using Flask-WTF CSRF support on the backend and CSRF-aware request handling in the frontend API client. The backend exposes a CSRF token endpoint, and the frontend API client obtains a token before sending state-changing requests.

The frontend API client treats POST, PUT, PATCH, and DELETE requests as mutating requests. Before sending one of these requests, it calls the CSRF token endpoint and attaches the token to the request header. The backend rejects requests that fail CSRF validation and returns a structured JSON error response.

This measure is important because the system uses browser-based sessions. Without CSRF protection, a malicious cross-site request could attempt to perform actions using the browser's existing session cookie. CSRF validation requires a valid token in addition to the session cookie.

**Table 6.56: CSRF Protection Measures**

| CSRF Measure              | Implementation Location          | Description                                                             |
| ------------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| CSRF initialization       | `backend/app/__init__.py`      | Initializes CSRF protection in the Flask application factory            |
| CSRF token endpoint       | `authentication_controller.py` | Provides token used by frontend API client                              |
| CSRF error handling       | `backend/app/__init__.py`      | Converts CSRF failures into structured JSON responses                   |
| Mutating request handling | `frontend/lib/api/client.ts`   | Obtains and attaches CSRF token for state-changing requests             |
| Credential inclusion      | `frontend/lib/api/client.ts`   | Sends browser credentials with API requests so sessions can be resolved |

```text
PROCEDURE Send CSRF-Protected Request
  FRONTEND determines request method
  IF method changes server state THEN
    REQUEST CSRF token from backend
    ATTACH token to CSRF request header
    ATTACH JSON content-type header
  ENDIF
  INCLUDE browser credentials
  SEND request through frontend API path
  BACKEND validates CSRF token before protected mutation continues
  IF token is invalid THEN
    RETURN structured CSRF error
  ENDIF
ENDPROCEDURE
```

## 6.8.5 Role-Based Access Control

The system implements three roles: User, Moderator, and Admin. These roles are ranked so that higher roles can access more privileged functions. Normal users can access research workflows such as dashboard, profile, blueprints, experiments, jobs, models, favorites, public hub, and documentation. Moderators can access staff moderation and limited user-management actions. Administrators can access full user-management, system-management, queue, settings, and event functions.

Role-based access is enforced in both frontend and backend layers. Frontend route guards improve usability by redirecting unauthenticated users and blocking insufficient-role pages. Backend access-control checks remain authoritative and must pass before protected API operations execute.

The backend access-control service normalizes role values, assigns role ranks, resolves authenticated context from sessions, checks whether users are staff or administrators, and verifies whether a user can manage another user. This centralizes security decisions so that controllers do not duplicate role-ranking logic.

**Table 6.57: Role-Based Access Matrix**

| Role      | Access Scope                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------ |
| User      | Dashboard, profile, experiment workflows, blueprint workflows, jobs, models, favorites, public hub, and documentation    |
| Moderator | User-level access plus blueprint moderation and limited user-management operations                                       |
| Admin     | Moderator-level access plus full user-management, system management, queue visibility, settings, and system event access |

```text
PROCEDURE Enforce Backend Role Requirement
  RESOLVE authenticated context from session cookie
  IF context is missing THEN
    RETURN unauthenticated response
  ENDIF
  NORMALIZE actor role
  COMPARE actor role rank against required role rank
  IF actor role rank is lower than required role rank THEN
    RETURN forbidden response
  ENDIF
  EXECUTE protected operation
ENDPROCEDURE
```

```text
PROCEDURE Enforce Frontend Route Guard
  READ authenticated user from authentication provider
  IF authentication state is loading THEN
    RENDER no protected content yet
  ENDIF
  IF user is not authenticated THEN
    REDIRECT to login page
  ENDIF
  IF route requires a minimum role AND user role is insufficient THEN
    REDIRECT to safe fallback page
  ENDIF
  RENDER protected page content
ENDPROCEDURE
```

> Note: Add one screenshot of an administrator-only page and one screenshot or explanation showing that a normal user cannot access the same page.

## 6.8.6 Data Access and Database Safety

Database access is performed through SQLAlchemy ORM mappings, repositories, and a unit-of-work transaction boundary. Controllers do not directly build raw database queries from user input. Instead, they call repositories and services that use controlled database access patterns.

The repository pattern supports data access safety by separating HTTP request handling from persistence operations. The unit-of-work pattern supports consistency by committing successful operations and rolling back failed operations. This is important for workflows such as experiment creation, where experiment records, model placeholders, and queue identifiers must remain consistent.

Database constraints also support security and integrity. Unique username and email constraints prevent duplicate account identities. Foreign-key relationships preserve ownership and artifact traceability. Experiment split constraints and model parameter-hash uniqueness protect the correctness of stored experiment records.

**Table 6.58: Data Access Safety Measures**

| Measure                      | Implementation Area                          | Security or Integrity Purpose                                                      |
| ---------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| ORM mappings                 | `backend/app/infrastructure/database/orm/` | Maps database tables through structured model classes                              |
| Repository layer             | `backend/app/repositories/`                | Encapsulates persistence operations away from controllers                          |
| Unit of work                 | `backend/app/repositories/unit_of_work.py` | Provides transaction commit and rollback behavior                                  |
| Database constraints         | ORM mappings and schema                      | Protects uniqueness, relationships, split validity, and duplicate model prevention |
| Access checks before queries | Controllers and access-control service       | Prevents users from retrieving or modifying unauthorized records                   |

```text
PROCEDURE Execute Secure Persistence Operation
  AUTHENTICATE current user
  AUTHORIZE operation against target record or required role
  VALIDATE request payload
  OPEN unit of work
    CALL repository methods using validated identifiers and values
    SAVE or UPDATE allowed records
    COMMIT transaction if no error occurs
  IF an error occurs THEN
    ROLLBACK transaction
    RETURN structured error response
  ENDIF
ENDPROCEDURE
```

## 6.8.7 HTTPS and Deployment Security Readiness

The current implementation is configured for local development and assessment demonstration. HTTPS termination is not shown as a local runtime service. In a production-oriented deployment, HTTPS should be enabled through a hosting platform or reverse proxy so that browser traffic, session cookies, and API requests are protected in transit.

The backend includes configuration values that support deployment hardening. Secure-cookie behavior can be enabled through `.env`, same-site cookie behavior can be configured, and allowed frontend origins can be restricted. The production configuration enables secure cookie behavior. These values should be combined with HTTPS, secret management, restricted network access, and process supervision.

Production-oriented deployment should also ensure that PostgreSQL and Redis are not publicly exposed. The frontend and backend API may be reachable from the browser, but database and queue services should remain private infrastructure services. Worker processes should run privately and consume queue jobs rather than expose public endpoints.

**Table 6.59: Deployment Security Readiness**

| Security Area              | Local Demonstration                   | Production-Oriented Requirement                    |
| -------------------------- | ------------------------------------- | -------------------------------------------------- |
| Transport security         | Local HTTP for development            | HTTPS termination through hosting or reverse proxy |
| Session cookie secure flag | Configurable through`.env`          | Enable secure-cookie behavior                      |
| Allowed origins            | Configured for local frontend origins | Restrict to approved production frontend origin    |
| Secrets                    | Local`.env` configuration           | Secure secret management outside source code       |
| Database access            | Local PostgreSQL service              | Private managed or secured database service        |
| Queue access               | Local Redis service                   | Private managed or secured queue service           |
| Worker process             | Local background process              | Supervised private worker service                  |

> Note: If the system is submitted as a local deployment, state that HTTPS is a production deployment requirement rather than claiming it is enabled locally.

## 6.8.8 Error Handling and Safe Responses

The backend uses standardized JSON response helpers for successful responses, general errors, and validation errors. This makes frontend behavior predictable and prevents raw framework error pages from being used as the normal API response format. Controllers return status codes and machine-readable error codes so frontend views can display appropriate feedback.

Validation errors are returned with field-level details. Authentication errors return an unauthenticated response. Authorization errors return a forbidden response. CSRF errors are caught by the Flask application factory and returned as structured JSON. Queue and worker errors are also handled so that experiments can be marked failed or cancelled instead of silently disappearing.

This approach supports security because error responses are controlled and consistent. It also improves usability because users receive understandable messages when they submit invalid data, lose authentication, attempt restricted actions, or encounter queue-related failures.

**Table 6.60: Error Handling Measures**

| Error Type           | Example Cause                                                        | Handling Approach                                            |
| -------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| Validation error     | Invalid experiment split, missing blueprint field, malformed payload | Return structured validation response with field errors      |
| Authentication error | Missing or expired session                                           | Return unauthenticated JSON response                         |
| Authorization error  | User role is insufficient                                            | Return forbidden JSON response                               |
| CSRF error           | Missing or invalid CSRF token on mutating request                    | Return structured CSRF failure response                      |
| Not found error      | Missing blueprint, experiment, model, or user                        | Return not-found JSON response                               |
| Queue error          | Redis-backed queue unavailable                                       | Return service-unavailable style response                    |
| Worker error         | Experiment execution exception                                       | Mark experiment failed and preserve diagnostic stage message |

```text
PROCEDURE Return Safe API Error
  DETECT error category
  SELECT appropriate HTTP status code
  BUILD JSON payload with ok false
  INCLUDE machine-readable error code when available
  INCLUDE human-readable message suitable for frontend display
  RETURN JSON response to frontend
ENDPROCEDURE
```

## 6.8.9 Logging and Traceability

The system records operational events for traceability. The Flask application factory records route activity after API requests, while important actions such as registration and login can also create system events. These events are stored through the backend event repository and displayed through administrator-facing system views.

Experiment-specific execution information is stored separately as experiment logs. The worker and executor persist model metrics, backtest metrics, confusion-style metrics, and round-level logs. These logs are not only diagnostic records; they also support research review and artifact downloads after an experiment completes.

Worker error handling improves traceability for asynchronous processing. If an experiment job fails, the worker marks the experiment as failed and records the failure stage. If an experiment is cancelled, the worker returns cancellation information. This prevents long-running jobs from failing silently.

**Table 6.61: Logging and Traceability Controls**

| Log / Event Type      | Implementation Purpose                                                            |
| --------------------- | --------------------------------------------------------------------------------- |
| System events         | Records route activity and important operational actions for administrator review |
| Authentication events | Records registration and login activity for traceability                          |
| API status events     | Records API method, path, and response status where applicable                    |
| Worker progress       | Updates experiment progress and current stage during execution                    |
| Worker failure state  | Marks failed experiments with diagnostic stage information                        |
| Experiment logs       | Stores model-level metrics and execution artifacts for result inspection          |
| System event download | Allows administrative export of system events for review                          |

```text
PROCEDURE Record API System Event
  AFTER API request completes
  IF request path is an API path THEN
    RESOLVE actor from session when available
    BUILD event containing scope, action, actor, target, and message
    STORE event through system event repository
  ENDIF
ENDPROCEDURE
```

```text
PROCEDURE Handle Worker Execution Failure
  TRY to execute queued experiment
  IF execution raises error THEN
    OPEN unit of work
      MARK experiment as Failed
      STORE current stage containing shortened diagnostic message
      SET completion timestamp
    CLOSE unit of work
    LOG worker failure for developer/operator review
    RAISE error to queue infrastructure
  ENDIF
ENDPROCEDURE
```

## 6.8.10 Security Evidence to Include

The final report should include evidence that demonstrates implemented security controls without exposing private information. Screenshots should use demonstration accounts and sanitized values.

Recommended evidence:

- Screenshot of registration or login validation feedback.
- Screenshot showing a normal user being redirected or blocked from an administrator-only page.
- Screenshot of an administrator-only system-management page.
- Screenshot of a CSRF-protected API request in browser developer tools, with cookie values hidden.
- Screenshot of a structured backend validation error displayed in a frontend form.
- Screenshot of system event records using non-sensitive demonstration data.

> Note: Do not show real credentials, session cookie values, secret keys, private database connection strings, credential hashes, or private user information in screenshots.

## 6.8.11 Summary

The implemented security measures protect the system at multiple levels. Backend validation prevents invalid or unauthorized data from being persisted or queued. Credential hashing protects stored account credentials. Server-managed sessions and CSRF tokens protect authenticated browser workflows. Role-based access control limits staff and administrative functions to suitable users. Repository and unit-of-work patterns provide safer database access and transaction control.

Error handling and logging further support reliability and traceability. Standard JSON responses allow frontend views to display predictable error messages, while system events and experiment logs provide visibility into application activity and execution results. Although the current deployment target is local demonstration, the implementation includes configuration points for production-oriented hardening such as secure cookies, restricted origins, HTTPS deployment, and private infrastructure services.

---

# 6.9 Challenges Encountered and Solutions

This section describes the main challenges encountered during implementation and the solutions applied. The challenges were not only interface-related; many of them came from coordinating a full-stack system that includes authentication, role-based access, blueprint versioning, experiment compilation, queue-based execution, market-data caching, model output storage, logs, and administrative monitoring.

The completed implementation solves these issues by separating responsibilities across frontend views, backend controllers, validators, services, repositories, worker processes, and reusable strategy components. This section explains the implementation difficulties, their impact, the solution applied, and the evidence that can be included in the final report.

## 6.9.1 Summary of Challenges Encountered

The implementation challenges can be grouped into workflow challenges, data integrity challenges, integration challenges, and usability challenges. Workflow challenges appeared when long-running experiments had to be executed without blocking the web interface. Data integrity challenges appeared when experiment configurations, blueprint edits, market candles, model outputs, and logs had to remain consistent. Integration challenges appeared when frontend views, backend APIs, PostgreSQL, Redis, and worker processes had to communicate correctly. Usability challenges appeared when users needed clear validation messages and visible job progress.

**Table 6.62: Implementation Challenges Encountered**

| No. | Challenge                                                                    | Affected Area                                                    | Cause                                                                                                                                       | Impact                                                                                                    |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | Long-running experiments could block web requests                            | Experiment submission, queue, worker, model execution            | Experiment execution includes data loading, splitting, feature generation, model training, evaluation, backtesting, and log persistence     | If executed synchronously, users would wait too long and normal API responsiveness could decrease         |
| 2   | Blueprint edits could affect reproducibility                                 | Blueprint module and experiment module                           | Blueprints are reusable and editable, while experiments must preserve the exact configuration used at submission time                       | Previous experiment results could become ambiguous if a later blueprint edit changed their meaning        |
| 3   | Experiment configuration has many dependent validation rules                 | Experiment wizard, backend validator, compiler                   | Date range, interval, split ratios, blueprint accessibility, parameter overrides, deterministic settings, and permutation counts must align | Invalid experiments could enter the queue and fail later during execution                                 |
| 4   | Market-data refresh could create duplicate or incomplete candles             | Market-data service, charting, executor data loading             | Repeated refreshes and external candle retrieval need timestamp normalization and cache reconciliation                                      | Charts and experiments could use inconsistent or duplicated BTCUSDT data                                  |
| 5   | Frontend authentication state had to remain consistent with backend sessions | Authentication, frontend guards, API client                      | Browser refreshes clear frontend state while the backend session may still be valid                                                         | Protected pages could render incorrectly or redirect unnecessarily                                        |
| 6   | Role restrictions had to be enforced beyond hidden navigation                | RBAC, moderation, user management, system management             | Users may call backend endpoints directly even when frontend navigation is hidden                                                           | Staff and administrator functions could be exposed if only frontend checks were used                      |
| 7   | The project grew into many modules                                           | Full-stack structure                                             | Controllers, services, repositories, validators, workers, strategies, and views all expanded during implementation                          | Code could become tightly coupled and difficult to maintain                                               |
| 8   | Users needed useful error feedback                                           | Forms, API client, backend responses                             | Validation and runtime failures can happen across different layers                                                                          | Generic failures would make it difficult for users to correct submissions                                 |
| 9   | Queue and worker status had to remain visible                                | Jobs, experiments, system management                             | Background execution happens outside the request-response cycle                                                                             | Users and administrators could lose visibility into queued, running, completed, cancelled, or failed work |
| 10  | Model and log outputs had to stay linked to the correct parameter set        | Experiment executor, model repository, experiment log repository | One experiment can generate multiple model permutations and logs                                                                            | Rankings and downloads could become misleading without stable parameter identifiers                       |

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

| Area                 | Solution Implemented                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| API responsiveness   | Experiment submission returns after queueing rather than waiting for full execution             |
| Background execution | Worker process consumes queued experiment jobs                                                  |
| Progress visibility  | Worker updates experiment progress and current stage                                            |
| Failure handling     | Worker marks experiment as failed and stores diagnostic stage information                       |
| User feedback        | Experiment and job detail views can show queued, running, completed, failed, or cancelled state |

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

| Problem                                           | Solution                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Blueprint content may change later                | Version-aware blueprint editing prevents silent overwrites of reviewed artifacts         |
| Experiment must preserve selected configuration   | Compiled blueprint and experiment snapshots are stored with the experiment               |
| Multiple parameter sets need stable identity      | Stable parameter hashes link model rows and logs to exact parameter payloads             |
| Worker may execute after the user leaves the page | Worker loads persisted experiment snapshots from the database                            |
| Result inspection must show context               | Experiment detail can display stored configuration, blueprint snapshot, models, and logs |

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

| Validation Issue         | Solution Implemented                                                       |
| ------------------------ | -------------------------------------------------------------------------- |
| Missing or invalid dates | Backend parses and validates experiment date fields before persistence     |
| Invalid split ratios     | Backend validator and database constraints protect split correctness       |
| Inaccessible blueprint   | Validator checks actor access before allowing the experiment               |
| Malformed overrides      | Compiler validates override keys, fixed values, allowed values, and ranges |
| Too many permutations    | Runtime setting limits requested permutation count                         |
| Invalid queued work      | Experiment is only queued after validation and compilation succeed         |

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

| Problem                                             | Solution Implemented                                             |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| Duplicate candles after repeated refresh            | Upsert behavior keyed by timestamp                               |
| Inconsistent time handling                          | UTC normalization in market-data service                         |
| Missing data for experiment execution               | Cache metadata and missing-range discovery                       |
| Slow or unreliable live dependency during execution | Experiments load persisted candles from database                 |
| Chart empty or outdated data                        | Market-data endpoints provide metadata and cache refresh support |

## 6.9.6 Challenge 5: Authentication State and Session Restoration

The frontend authentication state can be lost when the browser refreshes. However, the backend session may still be valid. This created a challenge: protected pages should not immediately assume the user is logged out just because frontend state was reset.

The solution was to implement a frontend authentication provider that calls the current-user endpoint during application loading. The backend resolves the server-managed session from the browser cookie and returns the safe user object if the session is valid. Frontend guards then use this restored state to allow or block protected routes.

Backend access control remains the final authority. Even if a frontend page accidentally renders a restricted control, protected API endpoints still resolve the authenticated context and enforce role checks before performing the operation.

**Table 6.67: Authentication State Solution**

| Problem                                     | Solution Implemented                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| Browser refresh clears frontend state       | Authentication provider calls current-user endpoint                            |
| Backend session may still be valid          | Server-managed session is resolved from cookie                                 |
| Protected pages need loading behavior       | Frontend guards wait for auth loading state                                    |
| Disabled users should not keep old sessions | Access-control service destroys invalid sessions for disabled or missing users |
| Frontend checks alone are insufficient      | Backend checks remain authoritative for protected endpoints                    |

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

| Problem                              | Solution Implemented                                                    |
| ------------------------------------ | ----------------------------------------------------------------------- |
| UI hiding alone is not secure        | Backend access-control checks protect actual operations                 |
| Role names may vary in spelling      | Role normalization converts role values to User, Moderator, or Admin    |
| Staff abilities differ               | Role ranking separates User, Moderator, and Admin scopes                |
| Direct URL access could reveal pages | Frontend route guards redirect insufficient-role users                  |
| User-management needs finer rules    | Access-control service checks whether an actor can manage a target user |

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

| Layer                    | Responsibility                                                                    |
| ------------------------ | --------------------------------------------------------------------------------- |
| Frontend views           | Page-level workflow and user interaction                                          |
| Frontend API client      | Request construction, CSRF token handling, response parsing, and error conversion |
| Backend controllers      | HTTP request handling and response shaping                                        |
| Validators               | Payload and business-rule validation before persistence                           |
| Services                 | Workflow coordination and integration with infrastructure                         |
| Repositories             | Database access through focused persistence methods                               |
| Unit of work             | Transaction commit and rollback boundary                                          |
| Worker                   | Background job handling                                                           |
| Executors and strategies | Experiment execution, data processing, modeling, metrics, and logs                |

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

| Error Source           | Solution Implemented                                               |
| ---------------------- | ------------------------------------------------------------------ |
| Validation failure     | Field-level validation response shape                              |
| Authentication failure | Standard unauthenticated response and frontend redirect behavior   |
| Authorization failure  | Standard forbidden response and frontend restricted route behavior |
| Queue unavailable      | Queue-specific error response during experiment creation           |
| Worker failure         | Experiment marked failed with diagnostic stage message             |
| API network issue      | Frontend API client converts failures into typed API errors        |

## 6.9.10 Challenge 9: Keeping Background Job Status Visible

After experiment submission, execution happens outside the original API request. This means users need a way to track what happened after submission. Without job and experiment status visibility, the system would feel unresponsive even if the worker were functioning correctly.

The solution was to store experiment status, progress, current stage, ETA field, job id, success flag, and completion timestamp. The worker updates progress through a callback and marks final state. Job and experiment APIs expose this information to the frontend. The user can inspect job detail, experiment detail, and system management views to understand execution state.

**Table 6.71: Job Status Visibility Solution**

| Status Need              | Solution Implemented                                            |
| ------------------------ | --------------------------------------------------------------- |
| Know job was accepted    | Experiment creation returns queue metadata                      |
| Know worker started      | Worker marks experiment as Running                              |
| Track execution progress | Executor emits progress updates through callback                |
| Know completion          | Worker marks experiment as Completed                            |
| Know failure             | Worker marks experiment as Failed with diagnostic stage         |
| Know cancellation        | Cancellation flow and worker cancellation handling update state |
| Administrator monitoring | System management API exposes active queue snapshot             |

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

| Problem                            | Solution Implemented                                        |
| ---------------------------------- | ----------------------------------------------------------- |
| Many model outputs per experiment  | One model row per selected parameter hash                   |
| Duplicate parameter sets           | Compiler deduplicates generated permutations by stable hash |
| Logs need correct model context    | Logs are saved with experiment id and model id              |
| Rankings need consistent metrics   | Executor updates metrics on the matching model row          |
| Downloads need traceable artifacts | Log records include model and parameter context             |

## 6.9.12 Overall Solutions Summary

The final implementation uses a combination of architectural and workflow solutions. The main strategy was to keep each responsibility in the correct layer. Frontend views provide interaction and feedback. Backend controllers expose APIs and enforce request-level checks. Validators reject invalid payloads early. Services coordinate infrastructure work. Repositories protect database access. The queue and worker isolate long-running execution. The compiler and executor preserve reproducibility and result traceability.

**Table 6.73: Challenges and Implemented Solutions**

| Challenge                                | Solution Implemented                                                                                     | Result                                                         |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Long-running experiments                 | Queue service and separate worker process                                                                | API remains responsive after experiment submission             |
| Reproducibility with editable blueprints | Blueprint versioning, compiled snapshots, and stable parameter hashes                                    | Previous experiments remain traceable                          |
| Complex experiment validation            | Backend validator and compiler validation                                                                | Invalid jobs are rejected before queueing                      |
| Market-data consistency                  | UTC normalization, cache metadata, missing-range discovery, and upsert behavior                          | Candle data is more consistent for charts and execution        |
| Authentication state restoration         | Current-user endpoint and frontend authentication provider                                               | Sessions can be restored after page refresh                    |
| Role restrictions                        | Backend access-control service and frontend route guards                                                 | Protected staff and admin features are consistently restricted |
| Growing codebase                         | Layered structure across controllers, services, repositories, validators, workers, strategies, and views | Implementation remains maintainable                            |
| Poor error feedback                      | Standard JSON responses and frontend API error handling                                                  | Users receive clearer feedback                                 |
| Background job visibility                | Experiment status fields, job APIs, worker progress updates, and system management view                  | Users and admins can monitor execution                         |
| Model/log traceability                   | Model placeholders, parameter hashes, and linked experiment logs                                         | Results remain tied to exact parameter configurations          |

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

---

# 6.10 Summary

This chapter described the implementation of the Bitcoin Experimental Engine as a full-stack web-based experimentation platform. The implemented system consists of a Next.js frontend, Flask backend API, PostgreSQL persistence layer, Redis-backed queue support, and a background worker process. These components work together to support user-facing research workflows, server-side experiment execution, model result inspection, and administrative monitoring.

The implementation follows the architectural separation established during system design. Frontend route files and views are responsible for user interaction and presentation. Backend controllers expose HTTP API boundaries. Services coordinate business workflows and infrastructure integration. Validators enforce request correctness before data is persisted or processed. Repositories manage database access through controlled persistence methods. Strategies encapsulate experiment-processing variations such as splitting, indicators, targets, metrics, and trading logic. The worker executes long-running experiment jobs outside the normal request-response cycle.

The deployment and setup sections showed that the system can be run as a local multi-service application. The frontend, backend, worker, PostgreSQL, and Redis services each have defined responsibilities. The startup workflow, `.env` configuration, frontend-to-backend rewrite, backend API prefix, database configuration, and queue configuration provide a repeatable local demonstration environment. This setup also reflects the logical structure needed for a future server-based deployment.

The database implementation provides the persistence foundation for the application. It stores user accounts, roles, blueprints, experiments, generated models, experiment logs, BTCUSDT candle data, favorite records, system settings, and system events. The schema supports ownership, traceability, blueprint versioning, experiment snapshots, parameter hashes, model metrics, and administrative monitoring. This is important because the system is not only a data-entry application; it must preserve the relationship between research configuration, execution, and generated results.

The key modules developed include authentication, role-based access control, user management, dashboard, blueprint authoring, blueprint moderation, experiment configuration, market-data charting, queue and worker management, experiment execution, model rankings, log downloads, favorites, public hub discovery, documentation viewing, user profile, and system management. Together, these modules support the main user journey from registration and login, to blueprint creation, experiment submission, asynchronous execution, result inspection, artifact reuse, and administrative oversight.

The API and integration implementation connects the full system together. The frontend uses a centralized API client and endpoint map to communicate with backend JSON APIs through the `/api/backend` path. The backend registers feature controllers under the `/api` prefix and integrates with repositories, services, Redis-backed queueing, the worker process, and the BTCUSDT market-data provider. This design avoids direct frontend access to persistence or infrastructure services and keeps backend validation and authorization as the final enforcement point.

Security measures were implemented across several layers. Credentials are protected through one-way hashing, sessions are managed on the server side, state-changing browser requests use CSRF protection, and role-based access control is enforced by backend services as well as frontend guards. Input validation protects blueprint creation, experiment submission, user management, and API operations. Standardized JSON responses, system events, and worker failure handling improve error reporting and operational traceability.

The implementation also addressed several practical challenges. Long-running experiment execution was moved into a queue and worker process so that web requests remain responsive. Blueprint versioning and compiled snapshots were used to preserve reproducibility. Experiment validators and compiler checks were used to prevent invalid jobs from entering execution. Market-data refresh behavior was centralized to avoid duplicate candle records and support local cache consistency. Frontend authentication restoration, backend access control, structured project layers, and standardized error handling improved usability and maintainability.

Overall, Chapter 6 demonstrates that the designed system has been implemented as an integrated full-stack application. The completed implementation supports the major functional areas required by the project, including user authentication, user roles, blueprint workflow, experiment configuration, asynchronous execution, market-data management, model result inspection, log access, favorites, public discovery, documentation browsing, and administrative monitoring.

Future improvements are mainly related to production hardening and further feature expansion. A production-oriented deployment would require HTTPS, secure cookie configuration, process supervision, centralized monitoring, restricted service exposure, and secure runtime configuration. Future functional enhancements may include additional model architectures, more indicator strategies, broader export formats, deeper runtime performance analysis, and expanded usability testing with more end users. These improvements would extend the system, but the current implementation already provides a working foundation for reproducible BTCUSDT experimentation and result analysis.
