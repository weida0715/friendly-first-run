# 6.2 Development Environment

This section describes the development environment used to implement the Bitcoin Experimental Engine. The system was developed as a full-stack web application; therefore, the environment combines backend technologies, frontend technologies, database services, queue services, testing tools, and local automation scripts. The purpose of documenting the development environment is to show how the system was built, how the implementation tools support the project objectives, and how another developer can reproduce the implementation environment.

The development environment is organized around three main source areas. The `backend/` folder contains the Flask API, services, repositories, validators, execution logic, worker code, and database integration. The `frontend/` folder contains the Next.js web application, views, reusable components, route guards, API client, and frontend tests. The `scripts/` folder contains project-level automation for starting the application and running tests. Runtime configuration values are supplied through `.env`, which defines environment-specific settings such as database connection, Redis connection, backend origin, session configuration, and frontend API behavior.

## 6.2.1 Programming Languages Used

The implementation uses multiple programming languages because the system includes backend services, frontend user interfaces, database persistence, automation scripts, and documentation. Python is used for the backend because the system requires server-side APIs, data processing, machine-learning experimentation, and background worker execution. TypeScript is used for the frontend because it provides typed React components, safer API integration, and maintainable state handling for complex forms such as the blueprint and experiment wizards.

SQL is used indirectly through PostgreSQL schema and migration work because the system stores durable relational records such as users, blueprints, experiments, models, experiment logs, market data, favorites, settings, and system events. Bash is used to automate repeated local operations such as starting the backend, worker, and frontend together. Markdown is used for user-facing documentation and technical report preparation. This combination of languages is suitable because each language is used where it is strongest: Python for backend and data-processing work, TypeScript for user-interface correctness, SQL for structured persistence, Bash for automation, and Markdown for documentation.

**Table 6.4: Programming Languages Used in the Implementation**

| Language | Used In | Implementation Purpose |
| --- | --- | --- |
| Python 3.11 | `backend/` | Implements Flask API controllers, configuration loading, services, repositories, validators, experiment execution, worker processing, market-data handling, and automated backend tests |
| TypeScript | `frontend/` | Implements route entrypoints, React views, reusable components, authentication guards, API client functions, frontend validators, and frontend test fixtures |
| JavaScript runtime | `frontend/` | Supports the Next.js and React runtime environment used by the browser-facing application |
| SQL | PostgreSQL database and migration layer | Supports relational persistence, schema constraints, table relationships, and data integrity |
| Bash | `scripts/` | Automates startup and testing workflows for local development and demonstration |
| Markdown | `docs/` | Stores system documentation, user guidance, and FYP report material |

> Note: No screenshot is required for this subsection. A table is more useful because it clearly maps each language to its implementation purpose.

## 6.2.2 Frameworks and Libraries

The project uses different frameworks and libraries for backend implementation, frontend implementation, data processing, model evaluation, queueing, charting, and testing. The backend libraries support API routing, security, persistence, data processing, market-data retrieval, and machine-learning workflows. The frontend libraries support route-based rendering, reusable components, responsive styling, chart display, and browser-based testing.

### Backend Frameworks and Libraries

The backend is built using Flask as the HTTP API framework. Flask is suitable for this project because it allows the backend to be organized into controllers, services, repositories, and worker entrypoints without forcing unnecessary framework complexity. SQLAlchemy provides the object-relational mapping layer used by repositories, while Alembic supports database migration management. Redis and RQ are used to separate long-running experiment execution from immediate API responses.

The experiment-related backend functionality uses scientific and machine-learning libraries. pandas, polars, and numpy support data processing for BTCUSDT candles, feature generation, split handling, and numerical calculations. scikit-learn supports model training and evaluation for implemented model architectures. The Binance connector is used by the market-data integration layer to retrieve BTCUSDT kline data before it is normalized and cached locally.

**Table 6.5: Backend Frameworks and Libraries**

| Framework / Library | Implementation Use |
| --- | --- |
| Flask | Creates the backend application, registers API routes, and handles HTTP requests and responses |
| Flask-WTF | Provides CSRF protection for state-changing backend requests |
| SQLAlchemy | Implements database engine setup, ORM mapping, sessions, and repository-backed persistence |
| Alembic | Manages database schema migration and database setup workflow |
| Redis | Provides queue-related runtime infrastructure and queue metadata support |
| RQ | Provides Redis-backed background job queue processing |
| pandas | Supports tabular data operations used in data preparation and experiment-related processing |
| polars | Supports efficient dataframe operations in experiment execution and feature processing |
| numpy | Supports numerical calculations required by indicators, targets, metrics, and model processing |
| scikit-learn | Supports model training and evaluation through implemented architecture adapters |
| binance-connector | Retrieves BTCUSDT market-data candles from a Binance-compatible API source |
| Werkzeug | Supports secure backend utilities such as credential hashing and Flask runtime behavior |
| pytest | Executes backend automated tests for controllers, services, validators, workers, and strategies |

### Frontend Frameworks and Libraries

The frontend is implemented using Next.js and React. Next.js provides route entrypoints under `frontend/app`, development server support, build behavior, and API rewrite configuration. React provides the component model used to implement views, layout components, forms, tables, chart containers, state components, and interactive user workflows. TypeScript strengthens frontend maintainability by allowing API payloads, component props, and view state to be expressed more explicitly.

Tailwind CSS is used to implement consistent interface styling and responsive layout behavior. Reusable UI primitives and layout components are organized under `frontend/components`, while page-level behavior is organized under `frontend/views`. The BTCUSDT price chart is implemented using lightweight charting support, and frontend behavior is verified using Jest with Testing Library.

**Table 6.6: Frontend Frameworks and Libraries**

| Framework / Library | Implementation Use |
| --- | --- |
| Next.js | Provides route-based frontend application structure, development server, build workflow, and backend API rewrite behavior |
| React | Implements reusable user-interface components, stateful views, forms, dialogs, tables, and page interactions |
| TypeScript | Provides static typing for component props, API payloads, view state, route behavior, and tests |
| Tailwind CSS | Provides utility-based styling, responsive layout support, and consistent visual design across pages |
| Radix UI Slot | Supports reusable and composable UI primitives |
| lucide-react | Provides icons used in navigation, buttons, status areas, and interface actions |
| lightweight-charts | Renders BTCUSDT price charts in dashboard and experiment-related views |
| Jest | Runs frontend automated test suites |
| Testing Library | Tests React components and user-facing behavior through rendered output |

> Note: If a figure is added here, use a technology-stack diagram with two columns: backend stack and frontend stack. Avoid screenshots of dependency files because summarized framework tables are clearer for a report reader.

## 6.2.3 IDEs and Tools

The implementation was developed using a code editor, terminal environment, package managers, testing tools, database tools, and browser developer tools. The code editor was used to edit Python backend files, TypeScript frontend files, automation scripts, and documentation. The terminal was used to run the backend API, frontend development server, worker process, automated tests, database commands, and startup scripts.

The project uses npm for frontend dependency management and frontend scripts. The backend uses a Python virtual environment to isolate Python dependencies from the system Python installation. pytest is used for backend testing, while Jest and Testing Library are used for frontend testing. Redis CLI is used by the startup process to check whether Redis is reachable before the application starts. Browser developer tools are used to inspect page rendering, network requests, authentication state, and API responses during manual verification.

**Table 6.7: Development Tools Used**

| Tool | Purpose in Development |
| --- | --- |
| Code editor | Editing backend source files, frontend source files, scripts, and Markdown documentation |
| Terminal / shell | Running local services, startup scripts, tests, worker processes, and setup commands |
| npm | Installing frontend dependencies and running frontend commands such as development server, tests, and type checking |
| Python virtual environment | Isolating backend Python dependencies for consistent backend execution |
| pytest | Running backend automated tests |
| Jest | Running frontend automated tests |
| Testing Library | Testing frontend components from a user-interface perspective |
| Alembic | Managing database schema setup and migration workflow |
| Redis CLI | Checking Redis availability before starting local services |
| Browser developer tools | Inspecting frontend rendering, network requests, API responses, and client-side behavior |
| `scripts/start_app.sh` | Starting backend, worker, and frontend processes for local demonstration |
| `scripts/test_all.sh` | Running backend and frontend test suites in a repeatable order |

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

| Environment Aspect | Description |
| --- | --- |
| Operating system | Linux-based local development environment |
| Backend runtime | Python 3.11 in a backend virtual environment |
| Frontend runtime | Node.js and npm environment for Next.js and React |
| Database runtime | PostgreSQL service configured through `.env` |
| Queue runtime | Redis service configured through `.env` |
| Browser environment | Desktop-class browser used for UI testing and demonstration |
| Shell environment | Bash-compatible terminal used for startup scripts and test execution |

The local environment reflects the deployed component structure of the system. Even though the services run on the same development machine, they remain logically separated. The frontend communicates with the backend through the configured API route, the backend communicates with PostgreSQL and Redis, and the worker processes queued experiment jobs independently from the frontend request flow.

## 6.2.6 Environment Configuration

The project uses `.env` to define environment-specific configuration values. This allows the same source code to run in different environments by changing configuration values rather than modifying implementation files. The backend reads configuration values such as the Flask environment, application secret, database connection, Redis connection, session settings, market-data base URL, and allowed frontend origins. The frontend uses configuration values to determine how browser requests should reach the backend API.

The most important environment values are summarized in Table 6.9.

**Table 6.9: Environment Configuration Values**

| Configuration Value | Used By | Purpose |
| --- | --- | --- |
| `FLASK_ENV` | Backend | Selects backend runtime environment behavior |
| `SECRET_KEY` | Backend | Supports Flask security-related runtime behavior |
| `DATABASE_URL` | Backend and database tooling | Defines the PostgreSQL database connection used by the system |
| `REDIS_URL` | Backend and worker | Defines the Redis connection used for queue-related runtime behavior |
| `SESSION_BACKEND` | Backend | Selects the session storage approach |
| `SESSION_TIMEOUT_MINUTES` | Backend | Controls session lifetime behavior |
| `BINANCE_BASE_URL` | Backend market-data service | Defines the BTCUSDT market-data provider base URL |
| `BACKEND_API_ORIGIN` | Frontend rewrite configuration | Defines where frontend rewrite requests should forward backend API calls |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API client | Defines the browser-facing API base path used by frontend requests |
| `CORS_ALLOW_ORIGINS` | Backend | Defines allowed frontend origins for API requests |

> Note: Do not include a screenshot of the `.env` file if it contains private local values. If evidence is required, show only a sanitized table like Table 6.9.

## 6.2.7 Development Environment Summary

Overall, the development environment combines tools that are appropriate for a modular research web application. Python and Flask provide the backend API and experiment-processing foundation. PostgreSQL and SQLAlchemy provide relational persistence and traceability for research artifacts. Redis and RQ support asynchronous experiment execution. Next.js, React, TypeScript, and Tailwind CSS provide the frontend implementation foundation. pytest, Jest, and Testing Library support automated verification across backend and frontend modules.

This development environment supports the implementation objectives because it allows the system to be developed, tested, and demonstrated as a complete application. The environment also supports future maintainability: backend and frontend code are separated, dependencies are managed by their respective ecosystems, runtime values are configured through `.env`, and repeatable commands are provided through scripts.
