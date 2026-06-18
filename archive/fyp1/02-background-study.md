## Chapter 2: Background Study

### 2.1 Overview

This chapter establishes the conceptual foundation for the Bitcoin Experimental Engine (BEE), an independent academic framework grounded in reproducible quantitative research practices. BEE addresses workflow fragmentation by integrating data ingestion, feature engineering, model execution, and evaluation into a single parametric workflow. It extends these concepts with scoped implementation contributions required for multi-tenant research environments: authenticated web access, artifact governance, model comparison services, and public discovery catalogs.

### 2.2 Literature Review

This section reviews essential concepts for the required knowledge to plan the implementation of core BEE functionalities.

#### 2.2.1 Bitcoin Market Structure and Data Characteristics

Bitcoin is a decentralised digital asset whose market microstructure significantly differs from conventional equities or foreign exchange instruments. The dispersal of liquidity across exchanges and its 24/7 trading cycle create exchange-specific analytical challenges (Nakamoto, 2008). The BTCUSDT Bitcoin-to-Tether spot pair on Binance has grown into one of the most liquid venues among retail and institutional traders (CoinGecko, 2024). Such a concentration makes data acquisition easier, but also results in exchange-specific artifacts, such as liquidation cascades during increased volatility and asymmetries in order-book depth, which are not found in regulated markets.

Unlike equities, where clock skew is reduced by centralised exchanges where the timestamps are synchronised, cryptocurrency markets require multi-venue clock skew management and reconciliation of trade-level data with a contemporaneous snapshot of order-books. Data with a minute resolution is usually sufficient to develop a strategy to hold longer than a few seconds, avoiding the complexity of infrastructural support of tick processing on the sub-millisecond scale, although signal integrity is still available to support mean-reversion and trend-following strategies (Chan, 2017).

BEE adopts a Bitcoin-pair scope (BTCUSDT spot pair). This constraint simplifies data sourcing while maintaining focus on Bitcoin-specific dynamics. BEE explicitly excludes on-chain protocol metrics (e.g., mempool, blocks, UTXO sets) in alignment with the project scope.

#### 2.2.2 Quantitative Trading Workflow Fragmentation

The modern quantitative studies are fraught with toolchain fragmentation. Practitioners generally develop in Jupyter notebooks with pandas and scikit-learn, Backtrader and Zipline backtesting engines are used to test, exchange-specific API recap logic is recreated, and then executed in the live-trading gateway (Hull, 2022). This pipeline causes drift in the environment: small variations in the alignment of the data, the modelling of the fees or slippage assumptions make strategies that have been tested offline perform poorly in practice. The 2023 industry survey established that 68 per cent of quantitative teams dedicate greater than 30 per cent of development effort to determine inconsistencies between research and implementation settings (QuantInst, 2023).

Split-first sequencing patterns that chronologically separate data into training/validation/test sets before any transformations are applied help prevent look-ahead bias by ensuring indicators are computed only on temporally available data (López de Prado, 2020). BEE implements this pattern as a core pipeline constraint.

#### 2.2.3 Technical Indicators and Feature Engineering Practices

The bulk of the retail quantitative strategies is based on technical indicators. Atomic indicators like moving averages, Relative Strength Index (RSI), and the Moving Average Convergence/Divergence (MACD) are calculations of transformations on price series that incorporate explicit window parameters (Kirkpatrick and Dahlquist, 2010). Modern usage suggests more and more the use of compound features, which are combinations of many atomic indicators representing higher-order market conditions. Others include Ichimoku Cloud elements that combine short, medium and long term momentum, or breakout adjusting volatility-based breakouts that combine the Average True Range (ATR) and price extremes.

Most importantly, temporal integrity should be followed in computing indicators. The use of indicators over the full dataset then split into training, validation, and test makes the future information leak and performance estimates invalid (Lopez de Prado, 2020). A proper implementation uses only data available till that time and calculates indicators in each temporal split separately. The exploration should be guided by ranges of parameters: the simple moving average (SMA) period [10, 20, 50] should be tested on a set of permutations and it will show its robustness, which is not achieved by cherry–picking a single optimal value using historical data.

#### 2.2.4 Framework Selection Rationale

Front-end selection weighed out the visualization needs and the ergonomics of the developer. Next.js were a server-side renderer but used to render the first page and a client-side renderer. Others like React were alone not optimized to provide routing, SvelteKit had potential bundle sizes but was limited by immature TypeScript support of complex state management. Composable component architecture counteracted the inconsistency of styling compared to monolithic libraries like Material UI, and reduced the maintenance cost compared to a completely customized CSS (Vercel, 2025).

The requirements placed on the backend were based on the need to prioritise synchronous data processing with a low overhead. Lightweight request handling by Flask was more appropriate to CPU-bound execution of the experiment compared to the asynchronous model like FastAPI based on the workload profile. Although Django brought ORM convenience, it used monolithic architecture that brought abstract layers that were not required due to the narrow domain logic. Flask modelled explicit middleware made it easy to implement server-side session validation as well as role-based access control without introducing extra framework conventions. 

PostgreSQL became the best persistence layer due to the comparison of time-series databases (TimescaleDB, InfluxDB) and document stores (MongoDB). It had native JSONB support, which allowed its Blueprints definitions to be flexible, but had relational constraints on the integrity across experiments, models and user artefacts. Most importantly, the window functions of PostgreSQL and subsequent lateral joins allowed it to paginate large log tables with millions of rows without chunking the application layer, which was found to severely affect the cursor stability of MongoDB during the initial prototyping of the system (Stonebraker, 2024). PgBouncer connexion pooling ensured query latency of sub-50ms when executing simultaneous experiments.

### 2.3 Existing Systems Review

This section reviews some of the existing systems that shows some resemblance in BEE in terms of features they provide. The review conducts market survey to elicit requirements needed for BEE.

#### 2.3.1 Vaquum Limen

Vaquum Limen (Vaquum, 2024) is an open-source quantitative research framework that implements the Universal Experiment Loop (UEL) architecture for end-to-end experimentation workflows. The framework emphasizes temporal integrity through split-first execution sequencing—chronologically partitioning data before any transformations to prevent look-ahead bias—and provides declarative manifest specifications for reproducible pipeline definitions. Its core design centers on immutable pipeline enforcement where data flows strictly through temporal splits → indicator computation → feature composition → target transformation → modeling → evaluation without cross-contamination between stages. The publicly documented architecture demonstrates strong alignment with reproducible research principles for single-user quantitative experimentation.

Despite its robust execution architecture, Vaquum Limen exhibits significant limitations relative to BEE's multi-tenant research requirements. The framework operates exclusively as a command-line interface tool without web-based user management or role-based access controls, making it unsuitable for collaborative research environments requiring artifact governance. It lacks Blueprint lifecycle management with moderator approval workflows, immutable versioning with audit trails, and authenticated public discovery capabilities necessary for sharing validated research artifacts across users. Critically, BEE's execution architecture draws conceptual inspiration from publicly documented patterns such as Vaquum Limen's Universal Experiment Loop (UEL). However, BEE does not incorporate proprietary Vaquum Limen implementation code, internal APIs, or non-public architectural specifications. All pipeline enforcement mechanisms, temporal integrity constraints, permutation generation logic, and multi-tenant governance features are independently implemented for this academic prototype.

| Feature | Description |
|---------|-------------|
| Universal Experiment Loop (UEL) | Immutable pipeline architecture enforcing split-first execution sequencing with chronological data partitioning before transformations |
| Declarative manifests | Single-file pipeline specifications defining data sources, splits, indicators, features, and models |
| Temporal integrity enforcement | Strict per-split computation preventing look-ahead bias across training/validation/test boundaries |
| Exhaustive permutation generation | Built-in combinatorial expansion of parameter ranges during execution |
| Open-source transparency | Public GitHub repository with inspectable pipeline implementation |
| CLI-only interface | Command-line execution without web UI, user accounts, or multi-tenant capabilities |

#### 2.3.2 QuantConnect

QuantConnect (QuantConnect, 2024) is a cloud-based algorithmic trading platform supporting equities, forex, futures and cryptocurrencies with a single C Sharp/Python Application Programming Interface. The LEAN engine performs backtests on high-resolution historical data which is based on transaction cost modelling and the cloud system coordinates parameter sweeps on distributed computational nodes. Specific focus is given in the platform on the continuity of production deployment so that a set of strategies, which have been validated by backtesting, can be deployed based on the same engine logic as in the real live trading.

The architecture of QuantConnect is, in essence, a departure from a Bitcoin-pair focus as it considers Bitcoin (BTC) as only one of many tickers in a multi-asset design that is predisposed to conventional investments. Such a design distorts the distinctive market microstructure of Bitcoin, including exchange-specific liquidity patterns that differ from regulated markets. Moreover, search of parameters is conducted as a post-hoc grid-based search instead of defining each pipeline component as a more tractable and definite, and pursued as a defining parameter, through definition to execution, thus breaking the parametric rules. More importantly, the closed-source core engine is a violation of the transparency principle of open-source which hides the assumptions behind the slippage modelling and places environmental drift between research purpose and behaviour-at-execution.

| Feature                  | Description                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Cloud-based backtesting  | Distributed execution of historical simulations with minute-resolution data across multiple assets |
| Parameter optimization   | Grid search over user-defined ranges with parallel execution on cloud workers                      |
| Live trading integration | Direct deployment to brokerages with identical engine logic used in backtests                      |
| Strategy library         | Public repository of community-contributed algorithms with performance metrics                     |
| Multi-asset support      | Unified API for equities, options, forex, futures, and cryptocurrency markets                      |

#### 2.3.3 Backtrader

Backtrader (Vera, D., 2023) is an open-source Python framework that can be used as an event-driven backtester based on minimal abstractions. Strategies are defined by the users as Python classes based on bt.Strategy and containing methods including next() to perform per-bar logic. It uses only the pandas and matplotlib as the only external libraries to manage position accounting, simulate order execution, and calculate performance metrics. Its main strength is its transparency, when any constituent of the back -testing engine can be inspected and modified.

Despite satisfying the standards of open-source transparency, Backtrader has a significant weakness of excessive workflow fragmentation against the principle of closed-loop. The parameter space exploration requires the manual writing of scripts, which are out of the frame work, as it does not imply a permutation management feature. As a result, practitioners code in Jupyter notebooks and then re-engineer logic to be used in production, and thus, create environmental drift between research and production phases. This framework also does not have any long-term storage of configurations, output or model artefacts. Notably, it does not provide a Blueprint governance workflow to prevent shared resource consumption by unverified parameter combinations.

| Feature                       | Description                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Event-driven architecture     | Per-bar strategy logic execution with explicit control over order management |
| Pure Python implementation    | No compiled dependencies; full source visibility for engine behavior         |
| Flexible data ingestion       | Accepts pandas DataFrames or CSV files with customizable parsing             |
| Basic optimization            | Manual parameter sweeps via Python loops; no built-in permutation management |
| Visualization toolkit         | Integrated matplotlib plotting for equity curves and trade annotations       |

#### 2.3.4 Freqtrade

The Freqtrade (2024) platform is built to automate the work of cryptocurrency trading bots, and hyperparameter optimization is defined in the systemic workflow. The framework implements strategies expressed in Python against exchange API and supports both simulated, dry-run executions, and live trading as well as providing risk management settings which may be configured. It uses the Hyperopt module, which is a genetic algorithm based search in parameter space defined by the user, with the results being stored locally, which are to be analysed later. The fact that it has built-in support of common cryptocurrency indicators and exchange-specific features, including futures funding rates, adds more flexibility to its operations.  

The platform described above prioritises live connectivity to exchanges, which introduces complexity beyond BEE's research-only scope focused on minute-to-daily strategy evaluation. In addition, the fact that optimization has been approached as a single calibration step instead of an adaptive procedure conflicts with the closed-loop principle that requires systematic adaptation of parameters based on performance feedback. The genetic-algorithm method also favors a single optimal value rather than searching exhaustively through neighbourhoods of parameter space to map out robust regions.

| Feature                             | Description                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------- |
| Crypto-native execution             | Direct integration with 20+ exchanges including Binance perpetuals          |
| Hyperopt optimization               | Genetic algorithm search over parameter spaces with result persistence      |
| Dry-run simulation                  | Backtesting against historical OHLCV data with configurable slippage        |
| Strategy templates                  | Prebuilt examples for common approaches (SMA crossover, RSI mean reversion) |
| Telegram integration                | Real-time trade notifications and manual override commands                  |

#### 2.3.5 VectorBT

NumPy is used to achieve massive performance improvements in backtesting using VectorBT (VectorBT, 2024), which is a framework that uses NumPy to exploit the idea of vectorization to avoid event-driven execution. It does not process signal array data one bar, or block, at a time, but instead pre-processes large arrays of signals before using vectorized operations to operate on them, to extend position size, profitandloss measures, and metrics. This method allows exploiting parameter grids of millions of combinations in a few seconds. The library is compatible with pandas and Jupyter thus allowing quick prototyping.

One aspect of the design that VectorBT avoids is workflow-management features - experiment tracking, model versioning and user interface features are all absent. This means that users are forced to build their own infrastructure to save configurations and results. The parameter exploration process is a manual programming step, whereby grids are defined as arrays in NumPy, and has no declarative specifications or governance procedures to distribute validated parameter sets. More importantly, the library does not provide any closed-loop connection between research and execution, the process of transferring optimised parameters to execution systems has to be done manually, which may introduce environmental drift and undermine live performance.

| Feature                     | Description                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| Vectorized computation      | Full-array signal generation and P&L calculation avoiding per-bar loops |
| Parameter grid acceleration | Exhaustive exploration of multi-dimensional parameter spaces in seconds |
| Pandas integration          | Native handling of DataFrame inputs and outputs for seamless workflow   |
| Custom metric support       | User-defined functions for Sharpe, drawdown, or domain-specific metrics |

#### 2.3.6 TradingView

The field of retail technical analysis is controlled by TradingView (TradingView, 2024) due to its charting interface, which is based on the browser, and the Pine Script language. The rules of entry and exit are developed by the user using visual notation or using scripting and then analysed against historical time series, using some of the built-in performance measures like profit factor and maximum drawdown. The platform also may be especially well suited to interactive visualisation, providing the ability to overlay indicators, draw trend lines, and compare several assets together. Its Strategy Tester will provide a primitive kind of walk-forward analysis, and it is limited in the amount of parameter manipulation one can perform but it is not as sophisticated as more advanced back-testing needs.

Nevertheless, the application of complex feature engineering, which is necessary to conduct systematic research on Bitcoin, is hindered by the inherent domain-specific limitations of Pine Script at TradingView. Parameter explorations are limited to the manual manipulation of sliders, limiting exhaustive combinatorial expansion and the ability to automate parametric sweeps. Additionally, lack of a dedicated experiment-tracking system other than session-specific results inhibits the comparability of experiments across research iterations. More importantly, crypto exchange-based backtested strategies cannot be easily applied to cryptocurrency exchanges without third-party bridge intervention, thus breaking the research-execution continuity of the closed-loop trading system. Lastly, the platform is characterised by a general attitude to Bitcoin and is capable of treating BTC as one of thousands of assets, limiting its ability to support focused Bitcoin-pair research.

| Feature                           | Description                                                                |
| --------------------------------- | -------------------------------------------------------------------------- |
| Interactive charting              | Real-time price visualization with 100+ built-in technical indicators      |
| Pine Script language              | Domain-specific syntax for defining entry/exit rules with parameter inputs |
| Strategy Tester                   | Backtesting engine with metrics calculation and equity curve rendering     |
| Social features                   | Public script sharing with versioned forks and user comments               |
| Multi-timeframe analysis          | Simultaneous chart views across intervals with synchronized cursors        |

#### 2.3.7 Comparison Table

| Feature                                                                 | QuantConnect | Backtrader | Freqtrade | VectorBT | TradingView | Vaquum Limen | **BEE** |
| :---------------------------------------------------------------------: | :----------: | :--------: | :-------: | :------: | :---------: | :----------: | :-----: |
| Split-first execution sequencing (temporal partitioning before transforms) | ✗           | ✗         | ✗        | ✗       | ✗          | ✓           | **✓**  |
| Immutable pipeline enforcement (data→split→indicators→features→model)     | ✗           | ✗         | ✗        | ✗       | ✗          | ✓           | **✓**  |
| Bitcoin-pair focus (BTCUSDT spot only)*                                   | ✗           | ✗         | (✓)      | ✗       | ✗          | ✗           | **✓**  |
| LONG-ONLY signal enforcement (rejects short positions)                    | ✗           | ✗         | ✗        | ✗       | ✗          | ✗           | **✓**  |
| Exhaustive permutation generation                                         | (✓)         | ✗         | ✗        | ✓       | ✗          | ✓           | **✓**  |
| Parametric experiment runner                                              | (✓)         | ✗         | (✓)      | ✗       | ✗          | ✓           | **✓**  |
| Pipeline specification governance workflow                                | ✗           | ✗         | ✗        | ✗       | ✗          | ✗           | **✓**  |
| Immutable pipeline versioning with audit trail                            | ✗           | ✗         | ✗        | ✗       | ✗          | ✗           | **✓**  |
| Parameter overrides per experiment (non-destructive)                      | ✗           | ✗         | ✗        | ✗       | ✗          | ✗           | **✓**  |
| Authentication required for all access                                    | ✗           | ✗         | ✗        | ✗       | ✗          | ✗           | **✓**  |
| All successful experiments publicly visible by default                    | ✗           | ✗         | ✗        | ✗       | ✗          | ✗           | **✓**  |
| Role-based access control (4-tier hierarchy)                              | ✗           | ✗         | ✗        | ✗       | ✗          | ✗           | **✓**  |
| Authenticated public discovery hub                                        | ✗           | ✗         | ✗        | ✗       | (✓)        | ✗           | **✓**  |
| Web-based GUI                                                            | ✓           | ✗         | ✗        | ✗       | ✓          | ✓           | **✓**  |
| Model ranking by performance metrics                                       | (✓)         | ✗         | ✗        | ✗       | ✗          | ✓           | **✓**  |
| Public discovery with favoriting capability                                | ✗           | ✗         | ✗        | ✗       | (✓)        | ✗           | **✓**  |
| Multi-model backtest comparison                                            | ✗           | ✗         | ✗        | ✗       | ✗          | ✗           | **✓**  |
| On-demand log export (no stored files)                                     | ✗           | ✗         | ✗        | ✗       | ✗          | ✗           | **✓**  |
| Row-level security enforcement                                             | ✗           | ✗         | ✗        | ✗       | ✗          | ✗           | **✓**  |
| Server-managed concurrency controls                                        | ✗           | ✗         | ✗        | ✗       | ✗          | ✗           | **✓**  |

*✓ = fully supported, (✓) = partially supported with limitations, ✗ = not supported*

*Vaquum Limen supports BTC among a multi-asset universe but lacks BTCUSDT-spot exclusivity enforcement and on-chain data exclusion constraints required by BEE's scope (Section 1.5).*

**Key differentiators of BEE:**  
BEE uniquely combines exhaustive parametric exploration with multi-tenant governance controls within a strictly bounded Bitcoin-pair scope. Unlike single-user research libraries or multi-asset cloud platforms, BEE enforces explicit BTCUSDT symbol validation at the data ingestion layer while providing authenticated collaboration features absent in many research-grade tools. Its Blueprint governance workflow—with moderator approval, immutable versioning, and non-destructive parameter overrides—addresses reproducibility gaps in fragmented toolchains without introducing live trading complexity. The framework's strict temporal integrity enforcement (split-first execution) aligns with reproducible research principles (López de Prado, 2020) while maintaining accessibility through a role-governed web interface with model ranking and personalized discovery via favoriting capabilities.

### 2.4 Theoretical Framework

BEE's execution pipeline implements a temporally strict architecture grounded in reproducible experimentation principles, where every aspect of trading becomes a machine-readable, versionable artifact rather than static documents. Its core principle—split-first execution—enforces chronological data partitioning before any transformation occurs, guaranteeing indicators and features compute exclusively on information available at each timestamp within their respective split. This prevents look-ahead bias by ensuring training sets never influence validation or test set computations, even for derived statistics like volatility normalization (López de Prado, 2020). The pipeline's immutability constraint further strengthens temporal integrity by eliminating hidden state mutations that commonly introduce subtle data leakage.

Parametric exploration operates as systematic topology mapping rather than opportunistic tuning—directly implementing the parametric tenet. Instead of searching for a single "optimal" parameter set (the "just-in-case" mindset), the framework treats every configurable value as a dimension in strategy space. Permutations generate exhaustive coverage across user-defined ranges, revealing regions of robustness versus fragility. This aligns with research showing strategies validated across parameter neighborhoods generalize better than those cherry-picked for peak historical performance. Blueprint specifications formalize this exploration by declaring parameters symbolically, then resolving concrete values during execution—enabling reproducible permutation generation without manual scripting loops.

Indicators implement single mathematical transformations (SMA, RSI)
with strict input/output contracts. Critically, this layer operates per-split to maintain temporal boundaries, ensuring a feature consuming SMA output never sees validation-set SMA values during training-phase computation.

Reproducibility emerges from three constraints derived from the project requirements: deterministic data sourcing, fixed random seeds across execution environments (NumPy, Python stdlib), and explicit dependency declaration in Blueprints. Every experiment run with identical manifest content and seed values produces consistent outputs. Artifact logging captures not just final metrics but intermediate states: raw splits, indicator outputs, fitted transformer parameters. This enables forensic validation when performance diverges, directly supporting the closed-loop tenet's requirement for full-system feedback awareness.

Blueprint governance introduces artifact lifecycle management absent in many research-grade tools. Draft Blueprints undergo moderator approval before execution against shared resources, preventing unvetted parameter combinations—such as extreme leverage values or lookback windows shorter than exchange tick intervals—from consuming compute resources. Blueprint modifications after submission create new versioned DRAFT artifacts while preserving original submissions for auditability, ensuring immutable lineage tracking throughout the approval lifecycle. Approved Blueprints become immutable references; subsequent runs with identical Blueprint content retrieve cached results rather than re-executing, establishing canonical performance baselines for strategy configurations.

### 2.5 Summary

As shown in this chapter, the fact that Bitcoin is a continuous market and the level of liquidity concentration in the BTCUSDT trading pair is high creates a need to address data handling habits that are not reflected in traditional quantitative analytics systems. At the same time, tooling ecosystem fragmentation creates high levels of inefficiency in the current workflows: researchers usually test their algorithms through interactive notebooks, then test them in the backtesting environment and then re-implement the logic to deploy it, which in most cases introduces environmental drift. An overview of existing platforms revealed the following salient shortcomings: TradingView lacks the ability to explore parameters comprehensively, QuantConnect obscures the internals of engines, Backtrader and VectorBT do not define the governance procedures required to make the scholarship reproducible, and Freqtrade prioritises direct connectivity to live feeds, outside BEE's research-only scope.

The design considerations above form the basis of the Bitcoin Experimental Engine (BEE) as an integrated framework, which integrates specification of strategies, validation and performance monitoring in one end-to-end pipeline. This framework enables technically skilled researchers to optimize Bitcoin-pair historical markets without unnecessary sophistication. Using strict temporal integrity and careful Blueprint versioning, working in simulated settings only, BEE achieves the main promise of keeping a strategy under test identical to the strategy that was originally defined.
