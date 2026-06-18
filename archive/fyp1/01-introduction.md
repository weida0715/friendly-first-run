## Chapter 1: Introduction

### 1.1 Overview

This project proposes the Bitcoin Experimental Engine (BEE), a frame-
work informed by publicly available research practices for reproducible quantitative experimentation. BEE does not incorporate proprietary implementation code, internal APIs, or non-public architectural specifications. BEE extends these public concepts with software engineering and product-layer capabilities required for a modern research framework, such as object-oriented analysis
and design (OOAD), a web user interface, user management, model ranking and comparison, and public discovery for sharing and reusing experiments.

Bitcoin markets demand specialized research infrastructure due to their
continuous 24/7 trading cycle and exchange-specific microstructure phenomena, including liquidation cascades and asymmetric order-book depth, that make strategy validation especially sensitive to data handling choices. The Bitcoin Experimental Engine (BEE) addresses this through four core components: Blueprints define versioned pipeline specifications with parameter ranges for indicators; Experiments execute Blueprints using split-first sequencing to eliminate look-ahead bias while generating exhaustive parameter permutations; Models represent individual permutation artifacts with evaluation metrics under long-only, single-position constraints; and the Public Hub provides authenticated discovery of successful experiments and approved Blueprints through role-governed visibility controls.

Overall, BEE is positioned as both a technical contribution—an inte-
grated architecture that unifies data, features, models, and evaluation into repeatable experiments—and a usability contribution—making experimentation accessible through an authenticated web experience with searchable catalogs and leaderboards. The remainder of this report presents background study
and system comparisons, derives functional and non-functional requirements, models the system using OOAD artifacts (use cases, dynamic/object models, ERD, wireframes), applying SOLID principles and design patterns, deciding on a software architecture and finalizing an implementable deployment plan leading to the prototype and conclusion.

### 1.2 Problem Statement

Bitcoin strategy research is difficult to execute rigorously because it
combines noisy and heterogeneous market data (often inconsistent across
providers and exchanges), an experimentation workflow that is typically fragmented across scripts and tools, and evaluation pitfalls (e.g., leakage and overstated performance) that are easy to introduce when configurations, datasets, and results are not tracked end-to-end. Recent evidence shows cryptocurrency datasets can suffer from mislabeling, identifier instability, and large cross-provider discrepancies in key fields such as prices, market caps, and volumes, undermining comparability and repeatability of results (Schwenkler et al., 2024). This fragmentation is compounded when researchers chase multiple assets or strategies simultaneously; focusing on a single pair with a single strategy avoids this greed-driven dispersion and instead concentrates effort on extracting consistent profit from one well-understood approach (Kotila, 2023). At the same time, reproducible computational experimentation requires packaging "everything necessary" to rerun an experiment consistently, some-
thing ad-hoc research stacks rarely enforce by design (Costa et al., 2024). There remains a gap for an OOAD-based, web-accessible framework that adds user management, model ranking/comparison, and public discovery while preserving reproducible execution and auditable experiment logs. Thus, the problem discussed motivated the development of the proposed Bitcoin Experimental Engine (BEE) framework.

### 1.3 Project Objectives

The primary objective of BEE (Bitcoin Experimental Engine) is to archi-
tect and prototype a reproducible, end-to-end Bitcoin-pair experimentation framework that consolidates data ingestion, feature engineering, model execution, and evaluation into a cohesive workflow, while extending it with OOAD driven structure and a web application that supports authenticated usage, model comparison, and public discovery.

* **To independently implement reproducible experimentation concepts**, including split-first execution sequencing for temporal integrity enforcement, Blueprint-based pipeline specification with immutable versioning, and exhaustive parameter permutation generation, unifying data ingestion, feature engineering, model training, and evaluation into a single auditable workflow without incorporating proprietary code or non-public architectural specifications.
* **To enforce experiment reproducibility and provenance** by capturing complete run context (configuration, parameters, metrics, artifacts, and code/environment traceability) so experiments can be re-executed consistently and results can be verified over time (Costa, 2024).
* **To design BEE using OOAD principles** by producing analyzable domain models and a maintainable design structure (clear responsibilities, modular components, and stable interfaces) that supports extension of indicators, features, models, and execution strategies.
* **To deliver a secure web-based user experience** by implementing authentication and authorization controls aligned with established web security guidance, enabling user management and role-based access to experiment creation, execution, and publication.
* **To implement model ranking and comparison services** that aggregate standardized metrics across runs to support systematic selection, similar to how ML systems use tracked runs and UI comparisons to identify best-performing configurations (MLflow, 2024).
* **To enable public discovery and reuse of experiments** via a “hub” capability that publishes selected models/experiments with metadata and outcomes, supporting transparent comparison and community-facing catalogs analogous to leaderboard-style evaluation ecosystems.

### 1.4 Project Outcomes

BEE (Bitcoin Experimental Engine) is expected to materialize as a web-
enabled experimentation framework that operationalizes quantitative research components within a maintainable software architecture. The outcomes focus on delivering a secure, role-governed access layer, reproducible and versioned strategy artifacts, discoverable public catalogs, and repeatable evaluation workflows that support consistent comparison of model snapshots across aligned test horizons.

* **An independently implemented experiment execution core** applying historical data access patterns, indicator/feature computation workflows, and split-first sequencing principles within a cohesive research workflow.
* **A Web UI interface** to provide access to BEE through a browser-based client so users can configure, execute, and review experiments independent of device and location.
* **A user account and role management system** to implement a three-tier authorization hierarchy (Normal User, Moderator, Administrator) with authenticated access and administrative account-state controls (enable/disable).
* **A Blueprint versioning mechanism** preserving artifact integrity through immutable lineage tracking by creating new editable versions upon owner modification while anchoring original submissions for auditability, adapted to the constraints of parametric Bitcoin-pair experimentation.
* **A public discovery interface** providing authenticated users access to a curated repository of validated research artifacts, with appropriate filtering by completion status and approval state, thereby establishing an explicit publication boundary between private experimentation and public discovery.
* **A model comparison capability** to enable users to compare standardized evaluation metrics across experiments, thereby providing an evaluation service that normalizes test conditions for fair model ranking and comparative analysis.

### 1.5 Project Scope

BEE defines a single, parametric experimentation framework whose scope is intentionally constrained to Bitcoin-pair quantitative research under historical and simulated evaluation conditions. This scope statement specifies the inclusions and explicit architectural boundaries necessary to preserve system cohesion, reproducibility, and a focused domain surface aligned with the project’s research objectives.

* **Bitcoin-pair asset coverage**: BEE shall restrict market-data ingestion to the BTCUSDT spot pair only. This constraint shall be enforced across all experiment configurations to maintain a Bitcoin-pair orientation and to prevent cross-asset confounding by excluding altcoins, equities, foreign exchange, and other asset classes. BEE explicitly excludes on-chain protocol data (e.g., mempool, blocks, UTXO sets) from scope.
* **Blueprint lifecycle management**: BEE shall implement a versioned artifact lifecycle for experimental pipeline specifications (Blueprints) with moderator review capabilities, addressing multi-tenant governance requirements through original mechanisms for artifact versioning and auditability.
* **Public model catalog**: BEE shall provide an authenticated catalog in which users can discover successful research artifacts by default, including completed experiments and derived model artifacts. BEE shall enforce access controls such that users may access artifacts they own and artifacts explicitly designated as publicly visible through approval and completion status, thereby establishing a publication boundary between private experimentation and discoverable outputs.
* **Timeframe and granularity limitations**: BEE shall support strategy experimentation over minute-to-daily bar intervals and shall not provide sub-second granularity operation or infrastructure intended for high-frequency trading (e.g., tick-level order routing, colocation-dependent latency optimization). BEE’s execution model shall remain research-oriented rather than ultra-low-latency deployment oriented.
* **Strategy constraint (long-only, single-position)**: BEE shall enforce long-only signal interpretation and single-position exposure during test set evaluation, rejecting short signals and overlapping long entries. This constraint keeps evaluation aligned with the project's research framing and is codified in the functional requirements.
* **No trading simulation capabilities**: Position management logic, P&L simulation with slippage modeling, and interactive backtesting interfaces are excluded. Evaluation is strictly limited to internal test set metrics (Sharpe ratio, maximum drawdown, win rate) computed during immutable pipeline execution.

### 1.6 Project Limitations

BEE incorporates deliberate technical and operational constraints to preserve architectural cohesion, ensure reproducibility, and maintain a Bitcoin-pair research focus. These limitations are intentional boundary conditions of the project scope rather than deficiencies of the underlying design; they define where BEE’s experimental results remain valid and where external systems or additional controls would be required to support production-grade decision-making.

* **Dependence on historical observations:** BEE shall generate performance estimates exclusively from historical BTCUSDT spot market data and shall not guarantee that observed results generalize to future market conditions. This limitation reflects the non-stationary nature of financial time series, where structural breaks and regime transitions can invalidate assumptions learned from prior data (Zhang et al., 2024).
* **Absence of backtest and live market interaction**: BEE shall not connect to live exchanges, execute real orders, or provide real-time performance feedback derived from live trading. BEE is restricted to research-time signal generation and internal evaluation, consistent with the project’s research positioning rather than an execution system.
* **Computational scale constraints**: BEE shall support server-side execution and queueing within single-server resource limits and shall not provide distributed computing infrastructure for large-scale parallel exploration across high-dimensional parameter spaces. As a result, exhaustive search depth may be bounded by available compute and configured concurrency limits.
* **User-defined performance thresholds**: BEE shall require users to specify their own sufficiency criteria (e.g., signal thresholds, evaluation cutoffs, acceptance metrics) rather than inferring optimal performance targets automatically. This limitation follows from the fact that acceptable trade-offs between risk and return depend on user-specific preferences and utility assumptions that are not objectively determined by the system.
* **No market regime prediction capability**: BEE shall support systematic evaluation of parameter sensitivity and comparative model performance under observed historical segments, but shall not predict regime transitions or incorporate macroeconomic event forecasting as part of its core functionality. This limitation is consistent with the broader challenge of regime-driven nonstationarity in financial modeling (Zhang et al., 2024).
* **Bitcoin-only microstructure coverage**: BEE shall not support multi-asset strategies that rely on cross-asset correlations, altcoin market structure, derivatives beyond the configured dataset, or traditional financial instruments. Research artifacts are constrained to BTCUSDT spot data as defined in the project scope.
* **Technical proficiency requirement**: BEE shall assume a technically literate user capable of configuring experiments, interpreting evaluation metrics, and understanding parameter tuning methodology. BEE does not aim to provide automated strategy generation or beginner-oriented tutorials as a primary design goal within the project constraints.

### 1.7 Methodology

This report will employ a systematic Object-Oriented Analysis and Design (OOAD) methodology to develop the Bitcoin Experimental Engine (BEE) as an independent academic prototype. The methodology follows a sequential, requirements-driven process that transforms domain understanding into an implementable software architecture while maintaining strict separation between public-domain inspiration and academic contributions.

The process will commence with comprehensive requirements elicitation, deriving atomic functional and non-functional specifications grounded exclusively in publicly available quantitative research challenges and Bitcoin market characteristics. These requirements will serve as the sole foundation for all subsequent modeling activities, ensuring implementation decisions emerge organically from observable system behaviors rather than predetermined architectural assumptions.

During the analysis phase, requirements will be translated into behavioral and structural artifacts without introducing design optimizations or implementation details. This includes: (1) a complete use case model capturing user goals and system boundaries across guest, researcher, moderator, and administrator roles; (2) dynamic models comprising sequence diagrams for component interactions, activity diagrams for workflow progression, and state diagrams for entity lifecycles; and (3) an object model establishing foundational class relationships and a normalized entity-relationship diagram with precise attribute specifications. All analysis artifacts will remain implementation-agnostic, strictly reflecting observable requirements without anticipating architectural solutions.

The design phase will then refactor analysis artifacts through principled software engineering techniques. SOLID design principles will be applied to improve modularity, reduce coupling, and increase cohesion across domain objects. Strategic design patterns will be introduced where they resolve specific architectural tensions—such as enforcing temporal integrity constraints or enabling extensible parameter exploration—while preserving core system invariants. Finally, a software architecture will be selected based on empirical evaluation of alternatives against BEE's primary constraints: strict unidirectional dependency flow to guarantee temporal integrity, sufficient abstraction to support multi-tenant governance, and minimal overhead to maintain accessibility for quantitative researchers.

Throughout this methodology, explicit boundaries will be maintained between concepts inspired by public documentation (e.g., split-first execution sequencing, Blueprint-based strategy specification) and academic contributions developed independently for this FYP (e.g., layered architecture enforcement mechanisms, web-native parameter override interfaces). This disciplined separation ensures all implementation decisions represent original academic work while ethically acknowledging public-domain inspiration sources.

### 1.8 Target Audience

BEE is intended for highly skilled quantitative researchers and software developers who design and evaluate systematic strategies specifically for Bitcoin-pair markets. BEE assumes proficiency in programming and quantitative finance, and is therefore not targeted at retail traders or non-technical users.

***Bitcoin-pair quantitative researchers**: Individuals developing alpha signals using exchange-derived data and Bitcoin market microstructure who require parametric control over the entire research-to-execution pipeline.

***Algorithmic trading engineers**: Developers building and maintaining production trading infrastructure who need transparent, open source components with consistent behavior between backtesting and live environments.

***Systematic trading teams focused on Bitcoin-pair research**: Small institutional teams managing capital allocated specifically to BTCUSDT strategies who require closed-loop feedback to adapt parameters without manual workflow reconciliation.

***Technical solo quants with programming proficiency**: Independent traders comfortable writing Python, managing infrastructure deployment, and interpreting parameter sensitivity results without guided UI workflows or automated strategy generation.

***All target users share common characteristics**: programming proficiency in Python or similar languages, understanding of quantitative finance concepts including backtesting methodology and performance metrics, comfort with infrastructure deployment and configuration, and ability to interpret parameter sensitivity results without guided workflows. The framework assumes technical self-sufficiency rather than catering to retail traders or non-technical users seeking automated strategy generation.

### 1.9 Interim Report Timeline

> Gantt chart

| Activity                                           | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | W9 | W10 | W11 | W12 | W13 | W14 | W15 | W16 |

|--------------------------------------------------|--|--|--|--|--|--|--|--|--|---|---|---|---|---|---|---|

| Introduction                                       ||| ✅ | ✅ |||||||||||||

| Background Study                                   |||| ✅ | ✅ | ✅ |||||||||||

| Requirements                                       ||||| ✅ | ✅ | ✅ | ✅ |||||||||

| Analysis                                           |||||||| ✅ | ✅ | ✅  |||||||

| Design                                             ||||||||| ✅ | ✅  | ✅  | ✅  |||||

| Implementation Plan                                ||||||||||| ✅  | ✅  | ✅  ||||

| Conclusion                                         |||||||||||| ✅  | ✅  ||||

| Interim Report Preparation (compile, edit, format) |||||||||||| ✅  | ✅  | ✅  |||

| Presentation Preparation and Report Submission     ||||||||||||| ✅  | ✅  | ✅  | ✅  |

### 1.10 Summary

This chapter established the motivation, direction, and boundaries for the Bitcoin Experimental Engine (BEE). Bitcoin's continuous, multi-venue trading environment exhibits distinctive microstructure behaviour at intraday horizons, which increases sensitivity to data handling choices and evaluation methodology in quantitative research. In parallel, quantitative research workflows are frequently fragmented across tools and ad-hoc scripts, which weakens reproducibility unless experiments are specified, executed, and packaged with sufficient context to support repeatable reruns. The chapter also highlighted a foundational risk for Bitcoin research: cryptocurrency market datasets may contain vendor-level inconsistencies that can undermine comparability and repeatability of results if not governed end-to-end.

BEE is proposed as an OOAD-driven, web-enabled experimentation framework that consolidates the data→feature→model→evaluation workflow into a single parametric execution cycle. BEE independently implements concepts such as split-first execution sequencing and Blueprint-based strategy specification, while extending these concepts into a multi-tenant research framework through academic contributions including authenticated access, artifact governance, model comparison, and public discovery capabilities.

The scope and limitations defined in this chapter deliberately constrain BEE to Bitcoin spot experimentation on BTCUSDT over minute-to-daily intervals, with explicit exclusion of live trading, brokerage connectivity, and production deployment. This narrow scope preserves architectural cohesion and ensures that outcomes remain interpretable as research evidence rather than execution assurance. In particular, the chapter emphasized that large-scale parameter exploration must be treated cautiously due to the known risk of backtest overfitting, where extensive search can produce statistically fragile results that fail out-of-sample. Finally, the methodology section defined a requirements-driven OOAD workflow that progresses from implementation-agnostic analysis artifacts to a justified architecture and design model, while maintaining an explicit boundary between publicly documented concepts and BEE's original academic contributions.
