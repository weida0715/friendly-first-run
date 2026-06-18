---
title: Blueprint Workflow
category: Blueprints
order: 4
---

# Blueprint Workflow

Blueprints capture reusable experiment definitions. A Blueprint is a template, not a completed experiment.

## Lifecycle

1. **Draft**: define indicators, features, target assumptions, architecture, and parameter ranges.
2. **Pending review**: submit for moderation.
3. **Approved / Rejected / Disapproved**: moderator decision.
4. **Experiment use**: approved Blueprints can be selected for Experiments.
5. **Public Hub discovery**: approved Blueprints with completed successful Experiments owned by enabled users can become public artifacts.

## What a Blueprint contains

### Architecture section

Identifies the model family and parameters, such as `logistic_regressor_arc` or `ridge_classifier_arc`. It exposes name, display name, default/search parameters, constraints, probability support, and prediction output shape.

See [Model Architectures](./model-architectures.md).

### Indicators section

Stores selected feature generators. Indicators can be custom project indicators or TA-Lib indicators. Each indicator has name, source, parameter schema, constraints, defaults, output columns, and warm-up period.

See [Indicators and Features](./indicators-and-features.md).

### Features section

Describes generated columns intended for model training. Architectures ultimately choose numeric feature columns and exclude `timestamp`, `target`, and `_row_id`.

### Target assumptions

Current target strategies are binary classifiers:

- `forward_return`: class `1` when future close return is above `return_threshold`.
- `roc_lookahead`: class `1` when future rate-of-change is above `roc_threshold`.

## Parameter constraints

| Field | Meaning |
| --- | --- |
| `type` | Expected type: `number`, `integer`, `string`, or `boolean`. |
| `default` | Value used when none is supplied. |
| `required` | Whether the parameter must be present. |
| `min` / `max` | Numeric bounds. |
| `allowed_values` | Explicit accepted values. |

## Search spaces and overrides

BEE supports scalar values and list-like values. A comma-separated value such as `10,20,30` becomes a list and participates in Cartesian search.

Compilation flow:

1. Blueprint parameters form the base search space.
2. Experiment overrides replace, narrow, or subset values.
3. Parameter dimensions are combined.
4. Every combination receives a stable `parameter_hash`.
5. Requested permutations are sampled from the full set if needed.

Override forms include fixed values, list values, `{min,max}` ranges, and `allowed_values` subsets.

## Approval and public visibility

A public artifact requires an approved Blueprint, completed successful Experiment, and enabled owner account.
