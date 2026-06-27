# 6.2 Development Environment

## Section Purpose

This section documents the tools, languages, frameworks, and operating environment used to develop the system. It should be factual and specific so that another developer can understand the implementation environment and reproduce the project setup.

## 6.2.1 Programming Languages Used

### Structure

Use two paragraphs and one table.

Paragraph 1 should explain the programming languages used across the system. Paragraph 2 should explain why the combination is suitable for this project.

| Language | Used In | Purpose |
| --- | --- | --- |
| Python 3.11 | `backend/` | Flask API, services, repositories, workers, experiment execution, data processing |
| TypeScript | `frontend/` | Type-safe React components, views, API client, route guards, test code |
| JavaScript / JSX runtime | `frontend/` build ecosystem | React and Next.js runtime behavior |
| SQL | PostgreSQL and Alembic schema | Relational schema, constraints, and database persistence |
| Bash | `scripts/` | Local startup and test orchestration |
| Markdown | `docs/` | Documentation and report material |

### What to Show

- Mention Python for backend and experiment logic.
- Mention TypeScript for frontend maintainability.
- Mention SQL for relational persistence.
- Mention Bash scripts for repeatable local commands.

> Note: No screenshot is needed for this subsection. A table is more suitable than a screenshot.

## 6.2.2 Frameworks and Libraries

### Structure

Use one introductory paragraph followed by grouped tables.

#### Backend Frameworks and Libraries

| Framework / Library | Implementation Use |
| --- | --- |
| Flask | Backend application factory and API routing |
| Flask-WTF | CSRF protection for state-changing requests |
| SQLAlchemy | ORM mapping, database engine, repository persistence |
| Alembic | Database migration management |
| Redis and RQ | Queue broker and asynchronous experiment job handling |
| pandas, polars, numpy | Data processing for market candles, features, splits, and experiment execution |
| scikit-learn | Machine-learning model training and evaluation |
| binance-connector | BTCUSDT market-data retrieval |
| Werkzeug | Password hashing and supporting Flask runtime utilities |

#### Frontend Frameworks and Libraries

| Framework / Library | Implementation Use |
| --- | --- |
| Next.js | Routing, application shell, development server, rewrite proxy |
| React | Component-based user interface implementation |
| TypeScript | Static typing for UI, API client, test fixtures, and view state |
| Tailwind CSS | Utility-first styling and responsive layout |
| Radix UI Slot | Reusable UI composition support |
| lucide-react | Icons used in navigation and interface actions |
| lightweight-charts | BTCUSDT price chart rendering |
| Jest and Testing Library | Frontend component and route behavior testing |

### What to Show

Explain how these libraries support the implemented system instead of listing them only. For example, explain that Flask handles HTTP boundaries, SQLAlchemy isolates persistence, RQ decouples long-running jobs, and Next.js provides route-based frontend screens.

> Note: Include a dependency table rather than screenshots. Screenshots of package files are usually less useful than summarized tables.

## 6.2.3 IDEs and Tools

### Structure

Use one paragraph and one table.

| Tool | Purpose in Development |
| --- | --- |
| Visual Studio Code or equivalent code editor | Editing backend, frontend, scripts, and Markdown documentation |
| Terminal / shell | Running backend, frontend, tests, worker, and setup scripts |
| npm | Installing and running frontend dependencies and scripts |
| Python virtual environment | Isolating backend Python dependencies |
| pytest | Backend automated test execution |
| Jest | Frontend automated test execution |
| Alembic | Applying and checking database schema migrations |
| Redis CLI | Verifying Redis availability before startup |
| Browser developer tools | Inspecting frontend behavior, network requests, and UI rendering |

### What to Show

Describe the practical role of each tool in development and verification. Mention that the project also includes scripts for startup and testing to reduce manual command mistakes.

> Note: A screenshot of the IDE is optional. If included, show the project folder tree with `backend`, `frontend`, `docs`, and `scripts` visible.

## 6.2.4 Version Control System

### Structure

Use two paragraphs.

Paragraph 1 should state that Git is used as the version control system. Paragraph 2 should explain how source-control organization supports implementation traceability.

### Content to Include

- Git tracks changes to source code, documentation, and scripts.
- Source folders are separated into backend, frontend, documentation, and scripts.
- Generated folders and local runtime outputs should not be discussed as implementation evidence.
- Commit history can be used to trace the evolution of modules, bug fixes, and test additions.

> Note: Do not include screenshots of private commit history unless required by the faculty. A short paragraph is sufficient.

## 6.2.5 Operating System Used

### Structure

Use one paragraph and one table.

| Environment Aspect | Description |
| --- | --- |
| Operating system | Linux-based local development environment |
| Backend runtime | Python virtual environment with Python 3.11 |
| Frontend runtime | Node.js and npm environment |
| Database runtime | PostgreSQL service |
| Queue runtime | Redis service |
| Browser | Desktop-class browser for UI testing and demonstration |

### What to Show

Mention that the application is developed and tested in a local development environment with PostgreSQL and Redis running as local services. Avoid over-specifying hardware unless required.

## Pseudocode Requirement

No pseudocode is required for this section. This section is descriptive and environment-focused.

## Screenshot / Demonstration Requirement

> Note: If you include screenshots, use only one combined screenshot showing terminal commands or project structure. Do not include screenshots of generated dependency folders or hidden folders.

## Draft Content to Use in the Report

The system was developed using a mixed backend and frontend technology stack. Python 3.11 was used for the backend API, domain services, data processing logic, worker process, and experiment execution pipeline. TypeScript was used for the frontend application to improve maintainability of route components, views, authentication guards, and API client code. SQL was used through PostgreSQL schema definitions and Alembic migrations to support relational data integrity, while Bash scripts were used for repeatable local startup and test workflows.

The backend implementation is based on Flask, SQLAlchemy, Alembic, Redis/RQ, pandas, polars, numpy, scikit-learn, and the Binance connector. Flask provides the HTTP API boundary, SQLAlchemy and repositories provide database persistence, Redis/RQ supports asynchronous job processing, and the scientific Python libraries support BTCUSDT data processing and model evaluation. The frontend implementation is based on Next.js, React, TypeScript, Tailwind CSS, lightweight-charts, and Jest/Testing Library. These technologies provide route-based screens, reusable UI components, responsive layouts, price chart rendering, and automated frontend verification.

Development was performed using a local environment consisting of a code editor, terminal, Python virtual environment, Node.js/npm, PostgreSQL, Redis, pytest, Jest, and browser developer tools. This environment allowed the backend, frontend, worker, and supporting services to be developed and tested independently while still supporting full-system execution through the startup scripts.
