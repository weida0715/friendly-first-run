# FYP Implementation Evidence

This repository contains implementation code and executable tests, not only test-plan Markdown.

## Latest Local Verification

Run from `/mnt/SSD/MMU Stuff/FYP/friendly-first-run`:

| Check | Command | Result |
| --- | --- | --- |
| Backend tests | `cd backend && .venv/bin/pytest` | Passing: 364 tests |
| Frontend tests | `cd frontend && npm test -- --runInBand` | Passing: 24 suites, 113 tests |
| Frontend typecheck | `cd frontend && npm run typecheck` | Passing |

## Traceability

| FYP outcome | Implementation evidence | Test evidence |
| --- | --- | --- |
| Execution core | `backend/app/executors`, `backend/app/execution`, strategy factories, metrics/log strategies | `backend/tests/test_fyp_integration_journey.py`, executor, compiler, metrics, and strategy tests |
| Browser UI | `frontend/app`, `frontend/views`, shared components, API client | `frontend/tests/*view*.test.tsx`, route, auth guard, status, and wizard tests |
| Account and role management | Auth, user, access-control, and moderation controllers/services | Auth, user, CSRF, RBAC, and blueprint approval tests |
| Blueprint versioning and moderation | Blueprint controllers, repositories, versioning service, approval workflow | Blueprint entity, repository, controller, approval, validator, and versioning tests |
| Public discovery and model comparison | Model rankings/detail/library controllers and Public Hub controller/views | Model controller, Public Hub, model views, experiment detail, and integration journey tests |
| Queue and worker lifecycle | Queue service, Redis adapter, job controller, worker strategies | Queue service, Redis queue, worker, job controller, cancellation, and system tests |

## Scope Note

Backtest references mean internal long-only evaluation/backtest simulation over test-set predictions. The project does not claim live trading, brokerage connectivity, exchange order placement, or production portfolio management.
