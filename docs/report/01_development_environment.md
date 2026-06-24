# Development Environment

## Programming Languages Used

Bitcoin Experimental Engine is implemented as a full-stack web application with a Python backend and a TypeScript frontend.

- Python 3.11 is used for the Flask API, domain logic, repositories, experiment execution, workers, and database integration.
- TypeScript is used for the Next.js frontend views, routing wrappers, authentication provider, API client, charts, and reusable UI components.
- SQL is used indirectly through SQLAlchemy ORM mappings and Alembic migrations for PostgreSQL schema management.
- Bash is used for local orchestration scripts such as starting the backend, worker, and frontend together.
- Markdown is used for product documentation and this report.

## Frameworks and Libraries

The backend is built with Flask and SQLAlchemy. Flask provides the HTTP application factory, route registration, request handling, response formatting, and CSRF integration through Flask-WTF. SQLAlchemy provides the database engine, ORM mappings, repository queries, and transaction sessions. Alembic provides schema migrations.

The experiment pipeline uses pandas, Polars, NumPy, scikit-learn, TA-Lib, and Binance connector libraries. Redis and RQ support asynchronous experiment queueing and worker execution.

The frontend is built with Next.js, React, TypeScript, Tailwind CSS, and a small set of reusable UI primitives. Lightweight Charts renders BTCUSDT price data. D3 is available for chart-related helpers. Lucide React provides icon components.

Testing is split between pytest for backend tests and Jest with React Testing Library for frontend tests.

## IDEs and Tools

The project is structured for normal software development with a source repository, commits, task-oriented implementation, design notes, pull requests, and automated checks. The remote project repository is:

https://github.com/weida0715/Bitcoin-Experimental-Engine

GitHub is used as the collaboration platform. The workflow includes committing work, creating design/task documents, implementing work from planned tasks, opening pull requests, and running GitHub Actions checks. The repository contains workflows for backend and frontend tests, plus a pull-request assistant workflow.

Common development tools include:

- Git for source control.
- GitHub Actions for continuous integration.
- Python virtual environments for backend dependency isolation.
- npm for frontend dependency installation and scripts.
- pytest for backend verification.
- Jest for frontend verification.
- Redis CLI for checking local Redis availability before running the app.

## Operating System Used

The current development workspace is a Linux environment. The project scripts use Bash and Unix-style paths. The local startup script expects common Linux command-line tools such as `bash`, `node`, `npm`, `python`, and `redis-cli`.

The application itself is not tied to a desktop operating system. It can run anywhere that supports Python 3.11, Node.js, PostgreSQL, Redis, and the required Python and npm packages.
