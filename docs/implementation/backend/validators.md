# Backend Validators Module

Validators keep request payload checks out of controllers.

## `backend/app/validators/blueprint_validator.py`

Explanation: Validates blueprint create/update payloads. It checks required fields, indicator support, indicator parameter constraints, output scaler choices, architecture support, architecture parameter types, and collects field-level errors.

Pseudocode:

```text
BlueprintValidator.validate(payload):
  errors = {}
  require non-empty name
  require config object
  validate indicators section:
    ensure selected indicators exist
    ensure params match constraints
    ensure output scalers are supported
  validate architecture section:
    ensure architecture exists
    ensure settings object is valid
    validate params through ArchitectureFactory
  if errors: return ValidationResult.failure(errors)
  return ValidationResult.success()
```

## `backend/app/validators/experiment_validator.py`

Explanation: Validates experiment creation payloads. It checks identity fields, date ranges, split ratios, interval support, selected blueprint accessibility, target strategy config, override shape, candlestick amount mode, and permutation limits.

Pseudocode:

```text
ExperimentValidator.validate(payload, context):
  errors = {}
  validate name and symbol
  validate date range or candlestick amount mode
  validate interval is supported
  validate train/validation/test split totals and minimums
  load selected blueprint and check owner/public/staff access
  validate target strategy and target params
  validate architecture/indicator override types and constraints
  validate requested permutations against settings
  if errors: return ValidationResult.failure(errors)
  return ValidationResult.success()
```
