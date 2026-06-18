from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.workers import experiment_worker as module


class _ExperimentsRepoStub:
    def __init__(self, experiment):
        self._experiment = experiment
        self.mark_running_calls = []
        self.mark_completed_calls = []
        self.mark_failed_calls = []
        self.update_progress_calls = []

    def get_by_id(self, experiment_id: int):
        _ = experiment_id
        return self._experiment

    def mark_running(self, experiment_id: int, **kwargs):
        self.mark_running_calls.append((experiment_id, kwargs))
        return self._experiment

    def mark_completed(self, experiment_id: int, **kwargs):
        self.mark_completed_calls.append((experiment_id, kwargs))
        return self._experiment

    def mark_failed(self, experiment_id: int, **kwargs):
        self.mark_failed_calls.append((experiment_id, kwargs))
        return self._experiment

    def update_progress(self, experiment_id: int, **kwargs):
        self.update_progress_calls.append((experiment_id, kwargs))
        return self._experiment


class _UnitOfWorkStub:
    def __init__(self, repo):
        self.experiments = repo

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        _ = (exc_type, exc, tb)
        return False


class _ExecutorStub:
    def run(self, experiment, progress_callback=None):
        _ = experiment
        if progress_callback is not None:
            progress_callback(30.0, "Loading market data", 90)

        class _Frame:
            def collect(self):
                class _Collected:
                    height = 42

                return _Collected()

        return _Frame()


class _DictExecutorStub:
    def run(self, experiment, progress_callback=None):
        _ = experiment
        if progress_callback is not None:
            progress_callback(100.0, "Experiment execution completed", None)
        return {"ok": True, "experiment_id": 56, "progress": 100}


def test_validate_payload_requires_object() -> None:
    with pytest.raises(module.ExperimentJobPayloadError, match="Payload must be an object"):
        module._validate_experiment_payload(None)


def test_validate_payload_requires_experiment_id() -> None:
    with pytest.raises(module.ExperimentJobPayloadError, match="payload.experiment_id is required"):
        module._validate_experiment_payload({})


def test_validate_payload_requires_int(monkeypatch) -> None:
    repo = _ExperimentsRepoStub(experiment=object())
    monkeypatch.setattr(module, "UnitOfWork",
                        lambda: _UnitOfWorkStub(repo=repo))
    with pytest.raises(module.ExperimentJobPayloadError, match="must be an integer"):
        module._validate_experiment_payload({"experiment_id": "abc"})


def test_validate_payload_requires_existing_experiment(monkeypatch) -> None:
    repo = _ExperimentsRepoStub(experiment=None)
    monkeypatch.setattr(module, "UnitOfWork",
                        lambda: _UnitOfWorkStub(repo=repo))
    with pytest.raises(module.ExperimentJobPayloadError, match="Experiment does not exist"):
        module._validate_experiment_payload({"experiment_id": 123})


def test_handle_experiment_job_success(monkeypatch) -> None:
    experiment = SimpleNamespace(ExperimentID=55)
    repo = _ExperimentsRepoStub(experiment=experiment)
    monkeypatch.setattr(module, "UnitOfWork",
                        lambda: _UnitOfWorkStub(repo=repo))
    monkeypatch.setattr(module, "DefaultExperimentExecutor",
                        lambda: _ExecutorStub())
    monkeypatch.setattr(module, "get_current_job",
                        lambda: SimpleNamespace(id="job-1"))

    result = module.handle_experiment_job({"experiment_id": 55})

    assert result["ok"] is True
    assert result["experiment_id"] == 55
    assert result["rows"] == 42
    assert len(repo.mark_running_calls) == 1
    assert len(repo.update_progress_calls) == 1
    assert len(repo.mark_completed_calls) == 1
    assert len(repo.mark_failed_calls) == 0


def test_handle_experiment_job_accepts_dict_executor_result(monkeypatch) -> None:
    experiment = SimpleNamespace(ExperimentID=56)
    repo = _ExperimentsRepoStub(experiment=experiment)
    monkeypatch.setattr(module, "UnitOfWork", lambda: _UnitOfWorkStub(repo=repo))
    monkeypatch.setattr(module, "DefaultExperimentExecutor", lambda: _DictExecutorStub())
    monkeypatch.setattr(module, "get_current_job", lambda: SimpleNamespace(id="job-dict"))

    result = module.handle_experiment_job({"experiment_id": 56})

    assert result["ok"] is True
    assert result["experiment_id"] == 56
    assert result["rows"] == 0
    assert result["execution_result"]["ok"] is True
    assert len(repo.mark_completed_calls) == 1
    assert len(repo.mark_failed_calls) == 0


def test_handle_experiment_job_marks_failed_on_executor_error(monkeypatch) -> None:
    class _FailingExecutor:
        def run(self, experiment, progress_callback=None):
            _ = (experiment, progress_callback)
            raise RuntimeError("boom")

    experiment = SimpleNamespace(ExperimentID=77)
    repo = _ExperimentsRepoStub(experiment=experiment)
    monkeypatch.setattr(module, "UnitOfWork",
                        lambda: _UnitOfWorkStub(repo=repo))
    monkeypatch.setattr(module, "DefaultExperimentExecutor",
                        lambda: _FailingExecutor())
    monkeypatch.setattr(module, "get_current_job",
                        lambda: SimpleNamespace(id="job-2"))

    with pytest.raises(RuntimeError, match="boom"):
        module.handle_experiment_job({"experiment_id": 77})

    assert len(repo.mark_running_calls) == 1
    assert len(repo.mark_failed_calls) == 1
