---
title: Exports
category: Metrics
order: 8
---

# Exports

Completed successful experiments can be exported as CSV or JSON artifacts. Exports require authentication. Owners, staff users, and users viewing public successful artifacts may access experiment-level exports. Model round-log endpoints are owner-only.

## Availability rules

An experiment export is available only when:

- experiment status is `Completed`;
- experiment success is `true`;
- the requesting user has access;
- the requested artifact exists or can be regenerated.

If data is missing, the API returns a conflict response instead of an empty success file.

## Experiment artifact exports

| Artifact | Format | Headers / shape | Meaning |
| --- | --- | --- | --- |
| `backtest` | CSV | `modelId`, all backtest fields | One row per model backtest log. |
| `confusion` | CSV | `modelId`, all confusion fields | One row per model confusion log. |
| `parameter-correlation` | CSV | `cohort_pct`, `feature`, `n_rows`, `corr`, `corr_med`, `ci_lo`, `ci_hi`, `sign_stability` | Correlation between numeric parameters and `total_return_net_pct`. |
| `console` | CSV | `timestamp`, `level`, `message` | Operational log messages when present. |
| `split-metadata` | CSV | `split`, `start`, `end`, `rows` | Split boundaries and row counts when present. |
| `model-metrics` | CSV | `modelId`, `parameter_hash`, `sharpe`, `accuracy`, `precision`, `recall` | Model table metrics. |
| `experiment-config` | JSON | `id`, `name`, `interval`, `parameterOverrides` | Lightweight experiment configuration export. |

## Model round-log exports

| Endpoint concept | Format | Fields | Meaning |
| --- | --- | --- | --- |
| model round log | JSON | `experimentId`, `modelId`, `rows` | Per-row prediction details for one public model index. |
| model round log CSV | CSV | `roundIndex`, `timestamp`, `predicted`, `actual`, `outcome`, `signal`, `parameterHash` | Same rows as CSV. |

Round logs may be persisted during execution if `max_round_log_rows` is greater than zero. If not persisted, BEE attempts to regenerate them by rerunning the relevant deterministic preparation, model training, and prediction path for that model.

## Public `modelId` mapping

Exports use zero-based public model IDs ordered by the experiment's model list. These are not database primary keys. Use `modelId` and `parameter_hash` together when joining exports.
