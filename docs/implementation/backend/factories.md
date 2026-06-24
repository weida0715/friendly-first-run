# Backend Factories Module

Factories centralize lookup, metadata, validation, and construction of pluggable experiment pieces.

## `backend/app/factories/architecture_factory.py`

Explanation: Registers supported architecture strategies, validates requested architecture parameters, exposes metadata, and constructs architecture instances.

Pseudocode:

```text
ArchitectureFactory:
  registry = logistic_regression, ridge_classifier

  metadata():
    return name, display name, description, constraints for each architecture

  validate(name, params):
    find constraints
    for each param candidate:
      enforce type, min/max, allowed values
    return field errors

  create(name, params):
    if invalid name or params: raise
    return architecture strategy instance
```

## `backend/app/factories/blueprint_executor_factory.py`

Explanation: Factory hook for blueprint execution. It currently keeps the executor construction point explicit for future blueprint execution support.

Pseudocode:

```text
BlueprintExecutorFactory:
  create(config):
    return configured blueprint executor
```

## `backend/app/factories/blueprint_factory.py`

Explanation: Normalizes raw blueprint data into a blueprint domain object, especially indicator and architecture configuration.

Pseudocode:

```text
BlueprintFactory.create(payload):
  read name, owner, description
  normalize config sections
  create Blueprint domain object
  return blueprint
```

## `backend/app/factories/indicator_factory.py`

Explanation: Registers custom and TA-Lib-backed indicators, exposes metadata and parameter constraints, validates requested indicators, and builds indicator strategies for execution.

Pseudocode:

```text
IndicatorFactory:
  load custom indicator registry
  load talib specs

  metadata():
    return indicators grouped by source/category

  validate(indicator config):
    ensure indicator name exists
    validate params against constraints
    validate output scaler config

  create(definition):
    if custom: return custom indicator strategy
    if talib: return TalibIndicatorStrategy
```

## `backend/app/factories/talib_registry.py`

Explanation: Defines the supported TA-Lib-style indicators, their categories, input columns, default params, and parameter constraints.

Pseudocode:

```text
TalibSpec:
  category
  inputs
  params

helper _p(params):
  return parameter definition dictionary

helper _s(category, inputs, params):
  return TalibSpec

TALIB_REGISTRY:
  map indicator name to TalibSpec

function parameter_constraints(parameters):
  convert registry parameter metadata into frontend/backend constraints
```

## `backend/app/factories/target_strategy_factory.py`

Explanation: Adapts the strategy target factory for the factory layer. It exposes target strategy metadata and creates concrete target strategies.

Pseudocode:

```text
TargetStrategyFactory:
  inherit strategy target factory
  metadata():
    return target names, defaults, constraints

  create(name, params):
    return matching TargetStrategy
```
