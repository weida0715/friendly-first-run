# Backend Architectures Module

Architectures wrap trainable scikit-learn classifiers behind the shared architecture strategy interface.

## `backend/app/architectures/logistic_regressor_architecture.py`

Explanation: Implements logistic regression training and prediction. It cleans Polars frames, extracts feature columns excluding target/time columns, fits `LogisticRegression`, and predicts labels.

Pseudocode:

```text
metadata():
  return architecture name and parameter constraints

train(train_frame, params):
  collect lazy frame
  drop invalid/null model rows
  feature_columns = all non-target/time columns unless supplied
  X, y = frame[feature_columns], frame[target]
  model = LogisticRegression(params)
  fit model
  return TrainedModel(model, feature_columns)

predict(model, data):
  collect data
  clean rows
  X = selected feature columns
  return model.predict(X)
```

## `backend/app/architectures/ridge_classifier_architecture.py`

Explanation: Implements ridge classifier training and prediction. It normalizes boolean and class-weight params, handles single-class data safely, fits `RidgeClassifier`, and returns predictions.

Pseudocode:

```text
metadata():
  return architecture name and parameter constraints

train(train_frame, params):
  normalize boolean params
  normalize class_weight null/none values
  collect feature and target arrays
  if target has one class:
    use constant-class behavior
  else:
    fit RidgeClassifier
  return TrainedModel

predict(model, data):
  extract feature columns
  return predicted class labels
```
