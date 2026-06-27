# 6.9 Challenges Encountered and Solutions

This section discusses the main implementation challenges and how they were handled in the source code. The challenges were not limited to interface layout. The system had to connect user workflows, database rules, experiment reproducibility, BTCUSDT data availability, queue execution, role-based access, model comparison, and operational management.

## 6.9.1 Challenges Encountered

| No. | Challenge | Why it mattered | Affected modules |
|---:|---|---|---|
| 1 | Keeping blueprints reusable while allowing experiment-specific changes | A user may want to reuse an approved blueprint but adjust parameters for one experiment. The system must not accidentally change the original blueprint. | Blueprint module, experiment module, compiler, database snapshots |
| 2 | Protecting blueprint versions and moderation states | A blueprint can move from draft to pending, approved, rejected, or disapproved. Editing an already reviewed artefact must not destroy historical meaning. | Blueprint controller, approval controller, versioning service |
| 3 | Preventing invalid experiments from reaching the queue | Experiment jobs are expensive compared with normal API requests. Invalid split values, date ranges, or blueprint selections should fail early. | Experiment validator, experiment controller, compiler |
| 4 | Handling long-running experiments | Experiment execution can take longer than a normal web request. The user still needs progress, status, and failure information. | Queue service, Redis job queue, worker, executor, experiment repository |
| 5 | Using cached BTCUSDT data reliably | Charts and experiments must read the same persisted market data. Missing or duplicate candles can affect results. | Binance client, market-data service, market-data repository, market-data controller |
| 6 | Managing several strategy types | Indicators, targets, splits, architectures, metrics, and logs must fit into one execution flow without hardcoding every combination into the controller. | Strategy modules, factories, compiler, executor |
| 7 | Enforcing security on both frontend and backend | Hiding a link in the sidebar is not enough. Restricted routes must also reject unauthorized API calls. | Navigation, route guards, access-control service, controllers |
| 8 | Presenting complex states in the UI | Users need understandable states for loading, empty data, validation failure, queued jobs, running jobs, completed experiments, failed experiments, and cancelled jobs. | Frontend components, experiment pages, job pages, chart component |
| 9 | Keeping frontend payloads aligned with backend validators | The wizard must send data in a format the backend accepts. If frontend and backend drift, users get confusing errors. | Frontend API client, experiment wizard, blueprint wizard, validators |
| 10 | Testing a broad system | The system includes backend logic, database rules, queue logic, execution logic, and frontend views. A narrow test set would miss integration faults. | `backend/tests/`, `frontend/tests/` |

## 6.9.2 Solutions

The implementation solves these problems through separation of concerns. Controllers handle HTTP requests. Validators reject invalid input. Services coordinate workflows. Repositories isolate database access. Factories and strategies keep experiment components interchangeable. The compiler records effective parameters. The queue and worker isolate long-running jobs from the web request cycle. The frontend renders clear states for users, while backend access checks protect the actual data and operations.

| Challenge | Solution implemented | Source-code evidence |
|---|---|---|
| Blueprint reuse with experiment overrides | Store experiment-specific `parameter_overrides` and compiled snapshots on the experiment, not on the blueprint. | `backend/app/infrastructure/database/orm/experiment_orm.py` lines 57-84, `backend/app/execution/experiment_compiler.py` lines 34-132 |
| Blueprint version and moderation protection | Use approval-state transitions and version-aware saving. Disapproved blueprints can create a new draft linked to the previous version. | `backend/app/controllers/blueprint_controller.py` lines 254-294, `backend/app/controllers/blueprint_approval_controller.py` lines 103-175 |
| Invalid experiments reaching queue | Validate payload and compile plan before queueing. Return structured validation errors when the request is invalid. | `backend/app/controllers/experiment_controller.py` lines 272-314, `backend/app/validators/experiment_validator.py` |
| Long-running execution | Enqueue experiment work through `QueueService`, process jobs with RQ worker, and update progress in the database. | `backend/app/services/queue_service.py` lines 28-120, `backend/app/workers/experiment_worker.py` lines 55-165 |
| BTCUSDT cache reliability | Store candles in `BTCUSDTKline` by timestamp and serve chart/execution data from the local cache. | `backend/app/infrastructure/database/orm/btcusdt_kline_orm.py` lines 17-32, `backend/app/controllers/market_data_controller.py` lines 424-513 |
| Strategy complexity | Use factories for indicators and targets, and strategy classes for targets and splits. | `backend/app/factories/indicator_factory.py`, `backend/app/factories/target_strategy_factory.py`, `backend/app/strategies/splits/` |
| Frontend and backend security | Use role-based navigation for usability and backend checks for enforcement. | `frontend/lib/routes/nav.ts` lines 32-68, `backend/app/controllers/user_controller.py`, `backend/app/controllers/system_controller.py` |
| UI state complexity | Add loading, empty, error, status, and detail views, then test them with Jest and React Testing Library. | `frontend/components/states/`, `frontend/components/status/`, `frontend/tests/` |
| Payload alignment | Centralize frontend calls in `frontend/lib/api/client.ts` and validate backend payloads with dedicated validators. | `frontend/lib/api/client.ts`, `backend/app/validators/blueprint_validator.py`, `backend/app/validators/experiment_validator.py` |
| Broad testing needs | Maintain backend pytest tests and frontend Jest tests across modules. | `backend/tests/`, `frontend/tests/` |

The most important solution is the split between configuration and execution. The frontend collects a structured experiment configuration. The backend validates it. The compiler converts it into a deterministic plan with snapshots and parameter hashes. The queue stores the work item. The worker executes the job and updates progress. This keeps each stage understandable and testable.

## Implementation lessons

Several lessons can be drawn from the implementation:

1. Reproducibility must be built into the data model. Storing compiled snapshots and parameter hashes helps preserve what was actually executed.
2. Queue-based execution is necessary once an experiment can take longer than a normal request.
3. Role-based navigation improves the interface, but backend checks are still required.
4. Market-data caching reduces repeated external dependency during charting and experiment execution.
5. Test files are useful implementation evidence because they show the expected behaviour of controllers, services, strategies, workers, and frontend views.

## Required screenshots and code snippets

| Evidence | What to show | Suggested source or page |
|---|---|---|
| Validation challenge screenshot | Blueprint or experiment validation error | `frontend/app/blueprints/new/` or `frontend/app/experiments/new/` |
| Queue challenge screenshot | Queued or running job with progress | `frontend/app/jobs/` or `frontend/app/experiments/[id]/` |
| Market-data challenge screenshot | Empty chart state and populated chart state | Dashboard or experiment wizard chart |
| Versioning challenge screenshot | Blueprint detail showing version and parent/child lineage | `frontend/app/blueprints/[id]/` |
| Security challenge screenshot | Normal user blocked from admin page | `frontend/app/system/` or `frontend/app/admin/users/` |
| Worker code snippet | Running, completed, failed state transitions | `backend/app/workers/experiment_worker.py` lines 55-150 |
| Compiler code snippet | Snapshot and parameter hash generation | `backend/app/execution/experiment_compiler.py` lines 34-132 |
