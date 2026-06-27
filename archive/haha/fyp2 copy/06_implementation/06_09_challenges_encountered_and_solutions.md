# 6.9 Challenges Encountered and Solutions

This section explains technical challenges that appeared naturally from the implemented source code. The discussion should focus on engineering decisions that are visible in the implementation, not on historical planning notes.

## 6.9.1 Challenges encountered

| No. | Challenge | Why it mattered | Source-code evidence |
|---|---|---|---|
| 1 | Keeping experiments reproducible while allowing parameter overrides | Users need flexible experimentation, but results must remain traceable after execution | `backend/app/execution/experiment_compiler.py`, `backend/app/domain/models/experiment.py` |
| 2 | Preventing long-running experiment execution from blocking web requests | Model training, indicators, metrics, logs, and backtesting may take longer than a normal HTTP request | `backend/app/services/queue_service.py`, `backend/app/infrastructure/redis/job_queue.py`, `backend/app/workers/experiment_worker.py` |
| 3 | Validating complex experiment wizard input | Experiment payload includes dates, splits, targets, blueprint access, deterministic settings, and nested overrides | `backend/app/validators/experiment_validator.py`, `frontend/views/ExperimentWizardView.tsx` |
| 4 | Managing blueprint governance without breaking old experiments | Approved or reviewed blueprints should not be silently changed after they are used | `backend/app/services/versioning_service.py`, `backend/app/controllers/blueprint_approval_controller.py` |
| 5 | Handling BTCUSDT data reliability | External market-data calls can fail, duplicate, or return partial windows | `backend/app/infrastructure/binance/kline_client.py`, `backend/app/services/market_data_service.py`, `backend/app/repositories/market_data_repository.py` |
| 6 | Coordinating frontend, backend, database, queue, and worker state | Experiment state is visible in multiple UI pages and must stay consistent with backend job state | `frontend/views/ExperimentDetailView.tsx`, `frontend/views/JobDetailView.tsx`, `backend/app/controllers/job_controller.py` |
| 7 | Enforcing role and ownership rules consistently | Users, moderators, and admins have different privileges; users should not access others' experiments/jobs | `backend/app/services/access_control_service.py`, `backend/app/controllers/_access.py`, `backend/app/controllers/experiment_controller.py`, `backend/app/controllers/job_controller.py` |
| 8 | Presenting advanced ML/trading results in a usable interface | Metrics, logs, model parameters, rankings, and charts can overwhelm users | `frontend/views/ModelsRankingsView.tsx`, `frontend/views/ModelDetailView.tsx`, `frontend/views/ExperimentDetailView.tsx` |
| 9 | Maintaining modularity as features grew | The system includes many modules: auth, dashboard, blueprints, experiments, targets, indicators, queue, jobs, logs, models, hub, docs, admin | `backend/app/controllers/*.py`, `backend/app/services/*.py`, `backend/app/strategies/*`, `frontend/views/*.tsx` |

## 6.9.2 Solutions

### Challenge 1: Reproducible experiments with flexible overrides

The solution is the experiment compiler. Instead of directly mutating blueprints, `backend/app/execution/experiment_compiler.py` copies blueprint configuration, merges parameter overrides, validates constraints, expands parameter permutations, computes stable parameter hashes, and stores compiled snapshots on the experiment record. This lets the experiment keep a historical execution plan even if the source blueprint later changes.

Pseudocode:

```text
Compile experiment
  -> copy source blueprint into immutable snapshot
  -> merge allowed overrides
  -> reject invalid override fields
  -> generate parameter permutations
  -> hash each parameter set
  -> store compiled snapshots on experiment
```

### Challenge 2: Long-running execution

The solution is asynchronous queue execution. Experiment submission persists the experiment and enqueues a Redis/RQ job. A worker later executes the job and updates status/progress. This keeps the HTTP request responsive and allows users to inspect job detail pages.

Source paths: `backend/app/services/queue_service.py`, `backend/app/infrastructure/redis/job_queue.py`, `backend/app/workers/experiment_worker.py`, `frontend/views/JobDetailView.tsx`.

### Challenge 3: Complex wizard validation

The solution is layered validation: the frontend blocks obvious wizard-step errors, while backend validators remain the authority. This prevents invalid experiments from being persisted even if a user bypasses the frontend.

Source paths: `frontend/views/ExperimentWizardView.tsx`, `backend/app/validators/experiment_validator.py`, `backend/app/controllers/experiment_controller.py`.

### Challenge 4: Blueprint governance and version integrity

The solution is a blueprint approval workflow plus versioning service. Drafts can be edited, but reviewed/submitted artifacts use versioned-copy behavior so previous records remain traceable.

Source paths: `backend/app/services/versioning_service.py`, `backend/app/controllers/blueprint_approval_controller.py`, `backend/app/controllers/blueprint_controller.py`.

### Challenge 5: Market-data reliability

The solution is to cache BTCUSDT candles locally. Binance is used for retrieval and refresh, but charts and experiments read from the local `BTCUSDTKline` cache. The market-data service and repository upsert by timestamp to prevent duplicate candles.

Source paths: `backend/app/infrastructure/binance/kline_client.py`, `backend/app/services/market_data_service.py`, `backend/app/repositories/market_data_repository.py`, `backend/app/controllers/market_data_controller.py`.

### Challenge 6: Consistent lifecycle state across UI pages

The solution is to store experiment status, progress, current stage, job id, and completion fields in the experiment record and expose job-specific detail endpoints. The frontend uses experiment detail and job detail pages to show lifecycle state.

Source paths: `backend/app/domain/models/experiment.py`, `backend/app/controllers/experiment_controller.py`, `backend/app/controllers/job_controller.py`, `frontend/views/ExperimentDetailView.tsx`, `frontend/views/JobDetailView.tsx`.

### Challenge 7: Role and ownership enforcement

The solution is backend-first authorization. Frontend route guards hide unauthorized pages, but backend access-control and controller checks enforce real security. Staff-only routes use shared guards, while experiment/job/model/blueprint endpoints check ownership and resource visibility.

Source paths: `backend/app/services/access_control_service.py`, `backend/app/controllers/_access.py`, `frontend/components/auth/RequireAuth.tsx`, `frontend/components/auth/RequireRole.tsx`.

### Challenge 8: Usable presentation of technical outputs

The solution is to split results into views with specific purposes: dashboard for overview, experiment detail for run context, model rankings for comparison, model detail for provenance/metrics, logs/downloads for evidence, and public hub for discovery.

Source paths: `frontend/views/DashboardView.tsx`, `frontend/views/ExperimentDetailView.tsx`, `frontend/views/ModelsRankingsView.tsx`, `frontend/views/ModelDetailView.tsx`, `frontend/views/PublicHubView.tsx`.

### Challenge 9: Maintaining modularity

The solution is a layered architecture: controllers handle HTTP, services handle business coordination, repositories handle persistence, factories build strategies, strategies implement interchangeable algorithms, and views/components handle frontend presentation. This structure reduces coupling between feature modules.

## Required screenshots and code evidence

| Evidence | What to include |
|---|---|
| Compiler code | `backend/app/execution/experiment_compiler.py`, `compile()` section |
| Queue code | `backend/app/services/queue_service.py` and `backend/app/workers/experiment_worker.py` |
| Versioning code | `backend/app/services/versioning_service.py` |
| Market-data service | `backend/app/services/market_data_service.py` |
| Experiment detail UI | Screenshot of status/progress and model leaderboard |
| Job detail UI | Screenshot of queued/running/cancelled/completed state |
| System page | Screenshot of queue/system management summary |

## Summary

Most implementation challenges came from turning a research workflow into a reliable multi-user web platform. The final implementation solves these challenges through immutable experiment snapshots, queue-based execution, strict validators, local market-data caching, RBAC, modular strategies, and role-aware frontend views.
