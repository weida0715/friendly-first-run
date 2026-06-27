# 6.9 Challenges Encountered and Solutions

## 6.9.1 Challenges Encountered

Several technical challenges were encountered during implementation because BEE is not a simple CRUD application. It combines user authentication, role-based access control, experiment configuration, reusable blueprint governance, BTCUSDT data ingestion, asynchronous execution, model generation, chart rendering, and admin operations.

| Challenge | Why it was difficult | Affected modules / paths |
|---|---|---|
| Maintaining reproducibility while allowing user overrides | Experiments need to store user-specific overrides without mutating the selected blueprint. | `backend/app/controllers/experiment_controller.py`, `backend/app/execution/experiment_compiler.py`, `backend/app/infrastructure/database/orm/experiment_orm.py`, `backend/app/infrastructure/database/orm/blueprint_orm.py` |
| Designing blueprint versioning and moderation | Submitted or reviewed blueprints should not be edited destructively, but users still need to improve their designs. | `backend/app/services/versioning_service.py`, `backend/app/controllers/blueprint_controller.py`, `backend/app/controllers/blueprint_approval_controller.py` |
| Handling long-running experiments | Model execution can take longer than a normal HTTP request, so the system needs queue-backed execution and progress tracking. | `backend/app/services/queue_service.py`, `backend/app/infrastructure/redis/job_queue.py`, `backend/app/workers/experiment_worker.py`, `frontend/app/jobs/` |
| Integrating market data reliably | BTCUSDT candle data must be retrieved, normalized, deduplicated, cached, and reused by charts and experiments. | `backend/app/infrastructure/binance/kline_client.py`, `backend/app/services/market_data_service.py`, `backend/app/repositories/market_data_repository.py` |
| Enforcing security consistently | UI-level route hiding is not enough; backend endpoints must also enforce roles, ownership, and active-user status. | `backend/app/services/access_control_service.py`, `backend/app/controllers/_access.py`, `frontend/lib/routes/nav.ts`, `frontend/lib/auth/` |
| Keeping frontend and backend payloads aligned | The frontend wizard and backend validators must agree on fields, data types, and error messages. | `frontend/lib/api/client.ts`, `frontend/views/experiment-wizard-view.tsx`, `backend/app/validators/experiment_validator.py` |
| Presenting complex experiment states clearly | Users need understandable statuses for queued, running, completed, failed, cancelled, and retryable experiments. | `frontend/app/experiments/`, `frontend/app/jobs/`, `backend/app/controllers/experiment_controller.py`, `backend/app/controllers/job_controller.py` |
| Testing broad functionality | The system has many workflows across backend, frontend, persistence, queue, and UI states. | `backend/tests/`, `frontend/tests/` |

## 6.9.2 Solutions

The implementation mitigates these challenges through layered architecture, validation-first request handling, repository-based persistence, queue-backed execution, strategy patterns, and broad automated tests.

| Challenge | Implemented solution | Evidence in source code |
|---|---|---|
| Reproducibility and overrides | Store experiment-specific `parameter_overrides`, compiled blueprint snapshot, compiled experiment snapshot, seed, and deterministic flags on the experiment record. | `backend/app/infrastructure/database/orm/experiment_orm.py`, `backend/app/execution/experiment_compiler.py` |
| Blueprint versioning | Use versioning service rules so reviewed/submitted artefacts are preserved and newer drafts can be created without overwriting history. | `backend/app/services/versioning_service.py`, `backend/tests/test_versioning_service.py` |
| Long-running jobs | Move execution into Redis/RQ-backed queue and worker flow; return job metadata immediately to the frontend. | `backend/app/services/queue_service.py`, `backend/app/infrastructure/redis/job_queue.py`, `backend/app/workers/experiment_worker.py`, `frontend/tests/job-detail-view.test.tsx` |
| Market data reliability | Use a dedicated Binance client, service-level normalization, timestamp-keyed upsert, and local cache reads. | `backend/app/infrastructure/binance/kline_client.py`, `backend/app/services/market_data_service.py`, `backend/tests/infrastructure/test_binance_kline_client.py`, `backend/tests/repositories/test_market_data_repository.py` |
| Security consistency | Implement backend access-control checks and frontend route guards, with tests for both. | `backend/app/services/access_control_service.py`, `backend/tests/test_access_control_service.py`, `frontend/tests/auth-guards.test.tsx` |
| Payload alignment | Centralize frontend API calls in one typed client and validate backend payloads before persistence. | `frontend/lib/api/client.ts`, `backend/app/validators/blueprint_validator.py`, `backend/app/validators/experiment_validator.py` |
| Complex status display | Use status badges, state components, job detail views, and progress fields. | `frontend/components/status/`, `frontend/components/states/`, `backend/app/infrastructure/database/orm/experiment_orm.py` |
| Test coverage | Maintain backend pytest tests and frontend Jest/React Testing Library tests for implemented workflows. | `backend/tests/`, `frontend/tests/` |

The most important architectural decision was to prevent the user interface from directly controlling execution details. Instead, the UI collects a structured configuration, the backend validates it, the compiler turns it into a deterministic plan, and the executor runs the compiled plan using strategies and cached data. This separation reduces implementation risk because each layer can be tested independently.

Required screenshots:

1. Failed validation example in experiment or blueprint wizard.
2. Job queue/detail screen showing queued or running state.
3. Completed experiment detail page showing generated results.
4. System event or admin page showing operational visibility.
