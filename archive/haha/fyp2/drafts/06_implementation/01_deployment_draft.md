# 6.1 Deployment

## Section Purpose

This section replaces the former implementation plan with an implementation-focused opening that tells the reader what was actually built. It should introduce the completed system scope, identify the implemented modules, and explain how the deployed components support the project objectives. The section should be written as a bridge between the design chapter and the detailed implementation subsections that follow.

## Recommended Writing Structure

### Paragraph 1: Implementation Scope

Write one paragraph explaining that the Bitcoin Experimental Engine is implemented as a web-based research platform for BTCUSDT experiment configuration, execution, monitoring, and result inspection. Mention that the implementation contains a browser-based frontend, a Flask backend API, a PostgreSQL persistence layer, a Redis-backed job queue, and a worker process for long-running experiments.

Suggested coverage:

- The system is implemented as a full-stack web application.
- The frontend provides workflows for authentication, dashboards, blueprints, experiments, jobs, models, public hub, documentation, user profile, user management, and system management.
- The backend provides authenticated APIs, domain validation, database access, queue orchestration, market-data retrieval, and experiment execution.
- The worker allows experiments to run asynchronously without blocking the user interface.

### Paragraph 2: Mapping Implementation to Objectives

Write one paragraph that maps the implemented modules to the project objectives. The objective mapping should be direct and technical.

| Project Objective | Implemented Support |
| --- | --- |
| Provide reproducible BTCUSDT experimentation | Experiment compiler, deterministic parameter hashing, compiled snapshots, fixed data source, split-first execution flow |
| Support reusable experiment templates | Blueprint authoring, validation, approval, versioning, and blueprint selection in experiment wizard |
| Support user access and governance | Registration, login, server-managed sessions, role-based authorization, staff moderation, user management |
| Support asynchronous server-side execution | Redis queue integration, job metadata, worker lifecycle, job detail and cancellation views |
| Support result inspection and reuse | Model ranking views, experiment detail views, logs, exports, favorites, and public hub surfaces |
| Support administrative monitoring | System management view, queue snapshot, system settings, system events |

### Paragraph 3: Deployment Composition

Write one paragraph explaining the deployment composition. State that a typical local deployment starts four services: PostgreSQL, Redis, Flask backend, worker, and Next.js frontend. Clarify that the frontend communicates with the backend through a Next.js rewrite path and that backend APIs are exposed under `/api`.

### Paragraph 4: Chapter Roadmap

Write one short paragraph explaining what the rest of Chapter 6 covers: development environment, setup, database implementation, modules, APIs, network setup, security, and implementation challenges.

## Evidence to Include

Include a small deployment composition table.

| Component | Folder / Source Area | Runtime Responsibility | Typical Port / Runtime |
| --- | --- | --- | --- |
| Frontend web app | `frontend/` | Browser UI, routes, views, forms, charts, API client | `3000` |
| Backend API | `backend/app/` | HTTP endpoints, validation, services, repositories | `5000` |
| Worker process | `backend/app/scripts/run_worker.py` and `backend/app/workers/` | Executes queued experiments | Background process |
| PostgreSQL database | configured by `.env` | Persistent users, blueprints, experiments, models, logs, settings | `5432` |
| Redis | configured by `.env` | Queue broker, queue metadata, session backend | `6379` |
| Startup script | `scripts/start_app.sh` | Starts backend, worker, and frontend after checking prerequisites | Shell script |

## Suggested Figure or Screenshot

> Note: Add one deployment diagram showing Browser -> Next.js Frontend -> Flask API -> PostgreSQL / Redis -> Worker -> Backend execution services. The figure can be redrawn from the actual folders and runtime flow. A screenshot is not required here unless you want to show the running frontend and backend terminal windows.

## Pseudocode Requirement

No pseudocode is required in this subsection. This subsection is a deployment and scope overview. If a code block is included, it should only show the high-level startup command:

```bash
scripts/start_app.sh
```

## Draft Content to Use in the Report

The implemented system is deployed as a full-stack web application for BTCUSDT quantitative research. The browser-facing layer is implemented using a Next.js frontend, while the server-side functionality is implemented using a Flask backend API. Persistent data is stored in PostgreSQL, and asynchronous experiment execution is coordinated through Redis-backed job queueing. This separation allows interactive user workflows to remain responsive even when experiment execution requires longer computational processing.

The implementation scope covers the main workflows required by the project: account registration and authentication, role-based access control, blueprint authoring and approval, experiment configuration, BTCUSDT market-data retrieval, queued experiment execution, job monitoring, model ranking, experiment log inspection, public discovery, documentation viewing, and administrative system monitoring. Each module directly supports the project objective of producing a reproducible experimentation environment rather than an isolated collection of scripts.

In a local deployment, PostgreSQL and Redis are started as supporting infrastructure services. The Flask backend is then started on port `5000`, the experiment worker is started as a separate backend process, and the Next.js frontend is started on port `3000`. Browser API calls are routed through the frontend path `/api/backend`, which is rewritten to the backend `/api` route prefix. This approach keeps the browser integration simple while preserving a clear separation between frontend and backend responsibilities.

The following sections describe the implementation in greater detail, beginning with the development environment and continuing through system setup, database implementation, feature modules, API integration, network configuration, security measures, implementation challenges, and final implementation summary.
