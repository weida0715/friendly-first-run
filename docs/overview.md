---
title: Overview
category: General
order: 1
---

# Bitcoin Experimental Engine

Bitcoin Experimental Engine (BEE) is a BTCUSDT research system for building repeatable machine-learning experiments, comparing model configurations, inspecting logs, and exporting artifacts.

BEE is pipeline-oriented: users describe a reusable **Blueprint**, compile it into an immutable **Experiment** plan, execute model permutations against persisted BTCUSDT OHLCV data, then inspect **Model** records and **ExperimentLog** artifacts.

## Core system architecture

| Layer | Main responsibility | Important implementation concepts |
| --- | --- | --- |
| Frontend | Collect input and render dashboards, docs, experiments, jobs, models, hub, and system screens. | Next.js views, API client endpoints, forms, charts. |
| Controllers | Expose HTTP endpoints and enforce access rules. | Experiment, Blueprint, Logs Download, Market Data, System controllers. |
| Domain | Represent durable business concepts. | Experiment config, job specification, queue position, BTCUSDT kline records. |
| Factories and strategies | Resolve pluggable behavior by name. | Indicator, architecture, target, split, trading, and log strategies. |
| Execution | Compile plans and run permutations. | `ExperimentCompiler`, `DefaultExperimentExecutor`, worker progress callbacks. |
| Persistence | Store users, blueprints, experiments, models, logs, market data, and settings. | SQLAlchemy ORM, repositories, unit of work, Alembic migrations. |
| Public Hub | Expose approved successful research artifacts. | Enabled users, approved Blueprints, completed successful Experiments. |

## Main workflow

1. Create a **Blueprint** containing architecture, indicators, features, and reusable parameter constraints.
2. Submit the Blueprint for moderation.
3. Create an **Experiment** from an approved Blueprint with interval, date range, split strategy, target strategy, seed, and overrides.
4. Compile immutable snapshots and parameter permutations.
5. Run the worker pipeline: load candles, materialize interval, split data, build features, generate targets, train, evaluate, backtest, and persist logs.
6. Inspect and export results.

## Core objects

### Blueprint

A Blueprint is the reusable research template. It stores architecture metadata, selected indicators, feature metadata, approval state, and version.

### Experiment

An Experiment is one execution request. It stores interval, datetime range, split percentages, split strategy, target strategy, deterministic flag, seed, parameter overrides, and compiled snapshots.

### Model

A Model row represents one evaluated parameter set. Important fields are `ParameterHash`, `Parameters`, `Sharpe`, `Accuracy`, `Precision`, and `Recall`.

### ExperimentLog

Experiment logs store structured artifacts in `metrics`. Current log types include `backtest`, `confusion`, `round`, `split_metadata`, and `console`.

### Compiled snapshots

Compiled snapshots preserve the exact run definition even if a Blueprint changes later:

- `compiled_blueprint_snapshot`: Blueprint identity, architecture, indicators, features, and approval state at compile time.
- `compiled_experiment_snapshot`: symbol, interval, date range, target strategy, seed, deterministic flag, effective parameters, permutation counts, and selected parameter hashes.

## Reproducibility guarantees

- Parameter hashes are generated from sorted JSON.
- Deterministic sampling uses the Experiment seed.
- Random splits store seed and row permutation metadata.
- Features and targets are generated independently inside each split.
- Warm-up rows containing null, NaN, or infinite feature values are dropped before training.
