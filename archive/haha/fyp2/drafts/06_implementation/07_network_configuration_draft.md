# 6.7 Network Configuration

## Section Purpose

This section describes how the implemented system is hosted and connected in the development deployment. It should cover localhost hosting, configured ports, frontend-backend proxying, and the difference between local demonstration and future live deployment.

## 6.7.1 Hosting Setup

### Recommended Structure

Use two paragraphs and one table.

Paragraph 1 should explain that the implemented system is demonstrated in a local multi-service environment. The frontend, backend, worker, PostgreSQL, and Redis run as separate services on the development machine.

Paragraph 2 should explain that this setup reflects the deployable architecture because each service has a clear responsibility and can be moved to a server or containerized environment later.

| Service | Local Host Role | Responsibility |
| --- | --- | --- |
| Frontend | Local web server | Serves the Next.js application to the browser |
| Backend | Local API server | Exposes `/api` endpoints and handles business logic |
| Worker | Local background process | Executes queued experiment jobs |
| PostgreSQL | Local database service | Stores persistent application data |
| Redis | Local queue service | Stores queue and queue metadata |

> Note: A network diagram is recommended here. Show that the browser accesses the frontend, the frontend rewrites API calls to the backend, and the backend communicates with PostgreSQL, Redis, the worker, and the market-data provider.

## 6.7.2 Port Configuration

### Recommended Structure

Use one paragraph and one table.

| Component | Default Port / Address | Configuration Source |
| --- | --- | --- |
| Frontend | `http://localhost:3000` | Next.js development server |
| Backend API | `http://localhost:5000` | Flask backend runtime |
| Frontend API proxy | `/api/backend/*` | `frontend/next.config.ts` |
| Backend API prefix | `/api/*` | Backend application configuration |
| PostgreSQL | `localhost:5432` | `.env` database configuration |
| Redis | `localhost:6379` | `.env` queue configuration |

Explain that the frontend uses `BACKEND_API_ORIGIN` to rewrite `/api/backend/*` requests to the backend API. This allows the browser to use the frontend origin while still reaching Flask endpoints.

## 6.7.3 Deployment to Server or Live Environment

### Recommended Structure

Use three paragraphs.

Paragraph 1 should state that the current implementation is suitable for local demonstration and can be adapted for live deployment.

Paragraph 2 should explain what would be required for live deployment: production WSGI server for Flask, production build for Next.js, managed PostgreSQL, managed Redis or equivalent, HTTPS, secure environment variables, and process supervision for the worker.

Paragraph 3 should explain that deployment readiness depends on configuring the same logical services with production-grade security and monitoring.

### What to Show

> Note: If the report requires evidence of deployment only, show local deployment screenshots. If a live server is not used, explicitly state that the implemented deployment target is local demonstration and development deployment.

## Pseudocode Requirement

No pseudocode is required for this section. A network diagram and port table are more suitable.

## Draft Content to Use in the Report

The implemented system is configured for local multi-service hosting. The frontend application runs as a local Next.js web server, while the backend runs as a Flask API server. PostgreSQL and Redis run as supporting infrastructure services, and the experiment worker runs as a separate backend process. This setup allows the user interface, API, queue, worker, and database to be tested together without merging their responsibilities into one process.

The default local ports are `3000` for the frontend, `5000` for the backend API, `5432` for PostgreSQL, and `6379` for Redis. Browser requests to the backend are sent through the frontend path `/api/backend/*`, which is rewritten by Next.js to the backend `/api/*` route. This makes frontend API calls consistent and reduces local cross-origin complexity.

Although the current implementation is primarily configured for local development and assessment demonstration, the architecture can be adapted for deployment to a server environment. A production deployment would require a production WSGI server for Flask, a production build of the Next.js frontend, secured environment variables, managed PostgreSQL and Redis services, HTTPS termination, and process supervision for the worker.
