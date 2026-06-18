"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WizardView } from './WizardView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BTCUSDTPriceChart, useBTCUSDTChartData } from '@/components/charts';
import { TokenizedParameterInput, describeConstraint, tokensFromValue, validateParamToken, type ParameterConstraint, type TokenizedParamDefinition } from '@/components/forms/TokenizedParameterInput';
import { ApiClientError, apiGet, createExperiment, getBlueprintMetadata, getBTCUSDTMetadata, getExperimentBlueprintOptions, ExperimentBlueprintOption } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

type StepId =
  | 'basics'
  | 'dataset-range'
  | 'split-config'
  | 'blueprint-selection'
  | 'target-selection'
  | 'parameter-overrides'
  | 'deterministic-seed'
  | 'review'
  | 'submit';

type BlueprintConfigDetail = { indicators?: Record<string, unknown>; architecture?: Record<string, unknown> };
type TargetMetadata = { name: string; parameterConstraints?: Record<string, ParameterConstraint>; parameter_constraints?: Record<string, ParameterConstraint>; defaultValues?: Record<string, unknown>; default_values?: Record<string, unknown> };

interface ExperimentDraft {
  name: string;
  description: string;
  symbol: 'BTCUSDT';
  interval: '1m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '1d';
  datasetMode: 'datetime-range' | 'candlestick-count';
  startDateTime: string;
  endDateTime: string;
  candlestickAmount: string;
  splitStrategy: 'time_based_sequential' | 'random';
  targetStrategy: 'forward_return' | 'roc_lookahead';
  targetParams: Record<string, string>;
  architectureOverrides: Record<string, string>;
  indicatorOverrides: Record<string, Record<string, string>>;
  targetOverrides: Record<string, string>;
  trainSplit: string;
  valSplit: string;
  testSplit: string;
  blueprintId: string;
  parameterOverrides: string;
  deterministic: boolean;
  seed: string;
  requestedPermutationCount: string;
}

interface WizardFieldErrors {
  name?: string;
  datasetMode?: string;
  startDateTime?: string;
  endDateTime?: string;
  dateRange?: string;
  trainSplit?: string;
  valSplit?: string;
  testSplit?: string;
  splitTotal?: string;
  blueprintId?: string;
  targetStrategy?: string;
  parameterOverrides?: string;
  requestedPermutationCount?: string;
}

const STEP_META: Array<{ id: StepId; label: string; description: string }> = [
  { id: 'basics', label: 'Basics', description: 'Set experiment name and run description.' },
  { id: 'dataset-range', label: 'Dataset Range', description: 'Confirm BTCUSDT datetime range and interval.' },
  { id: 'split-config', label: 'Split Configuration', description: 'Define train/validation/test splits.' },
  { id: 'blueprint-selection', label: 'Blueprint Selection', description: 'Choose an approved blueprint for this experiment.' },
  { id: 'target-selection', label: 'Target Selection', description: 'Choose the binary target strategy.' },
  { id: 'parameter-overrides', label: 'Parameter Overrides', description: 'Provide optional experiment-specific overrides.' },
  { id: 'deterministic-seed', label: 'Deterministic Seed', description: 'Choose seed and sampled permutation count.' },
  { id: 'review', label: 'Review', description: 'Review all configuration details before submission.' },
  { id: 'submit', label: 'Submit', description: 'Submit request and confirm queued experiment state.' },
];

const SUPPORTED_INTERVALS: Array<ExperimentDraft['interval']> = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '1d'];

const TARGET_PARAMETER_DEFAULTS = {
  forward_return: { lookahead_period: '1', return_threshold: '0' },
  roc_lookahead: { lookahead_period: '1', roc_threshold: '0' },
} as const;

const BACKEND_OWNED_PARAMETER_KEYS = ['column', 'source_column', 'input', 'inputs', 'output', 'outputs'];

function scalarEntries(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [] as Array<[string, unknown]>;
  return Object.entries(value as Record<string, unknown>).filter(([key, item]) =>
    !BACKEND_OWNED_PARAMETER_KEYS.includes(key) && (typeof item !== 'object' || item === null),
  );
}

function architectureParams(architecture?: Record<string, unknown>) {
  if (!architecture) return [] as Array<[string, unknown]>;
  return scalarEntries(architecture.parameters ?? architecture.params ?? architecture.settings ?? {});
}

function constraintRecord(value: Record<string, unknown> | undefined) {
  return ((value?.parameterConstraints ?? value?.parameter_constraints ?? {}) as Record<string, ParameterConstraint>) || {};
}

function toParamDefinition(name: string, fallback: unknown, constraint?: ParameterConstraint): TokenizedParamDefinition {
  return {
    name,
    default: String(constraint?.default ?? fallback ?? ''),
    type: constraint?.type === 'integer' ? 'integer-list' : constraint?.type === 'number' ? 'number-list' : constraint?.type === 'boolean' ? 'boolean' : 'string',
    constraint,
  };
}

function indicatorParams(indicators?: Record<string, unknown>) {
  if (!indicators) return [] as Array<readonly [string, Array<[string, unknown]>]>;
  const paramsByName = ((indicators.params ?? indicators.parameters ?? {}) as Record<string, unknown>) || {};
  const selected = Array.isArray(indicators.selected) ? indicators.selected.map(String) : [];
  const definitions = Array.isArray(indicators.definitions) ? indicators.definitions as Record<string, unknown>[] : [];
  const names = selected.length > 0 ? selected : definitions.map((item) => String(item.name ?? item.id ?? '')).filter(Boolean);
  const items = names.length > 0 ? names.map((name) => ({ name, params: paramsByName[name] ?? definitions.find((item) => String(item.name ?? item.id) === name)?.parameters ?? definitions.find((item) => String(item.name ?? item.id) === name)?.params ?? {} })) : Object.entries(indicators).map(([name, params]) => ({ name, params }));
  return items.map((item) => [item.name, scalarEntries(item.params)] as const).filter(([, entries]) => entries.length > 0);
}


function permutationOptionCount(value: unknown): number {
  if (Array.isArray(value)) return Math.max(1, value.length);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.allowed_values)) return Math.max(1, record.allowed_values.length);
    if ('min' in record && 'max' in record) return String(record.min) === String(record.max) ? 1 : 2;
    return 1;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 1;
    if (trimmed.startsWith('[')) {
      try { const parsed = JSON.parse(trimmed); if (Array.isArray(parsed)) return Math.max(1, parsed.length); } catch { /* fall through */ }
    }
    return Math.max(1, trimmed.split(',').map((item) => item.trim()).filter(Boolean).length);
  }
  return 1;
}

function multiplyPermutationEntries(entries: Array<[string, unknown]>): number {
  return entries.reduce((total, [, value]) => total * permutationOptionCount(value), 1);
}

function countIndicatorPermutations(entries: Array<readonly [string, Array<[string, unknown]>]>): number {
  return entries.reduce((total, [, fields]) => total * multiplyPermutationEntries(fields), 1);
}

function compactValues(values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim() !== ''));
}

function parseOverrideInput(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('[')) {
    try { return JSON.parse(trimmed); } catch { /* fall through */ }
  }
  if (trimmed.includes(',')) return trimmed.split(',').map((item) => parseOverrideInput(item.trim())).filter((item) => item !== '');
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  const numberValue = Number(trimmed);
  if (trimmed !== '' && Number.isFinite(numberValue)) return numberValue;
  return trimmed;
}

function compactParsedValues(values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim() !== '').map(([key, value]) => [key, parseOverrideInput(value)]));
}

function toDatetimeLocalValue(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function formatBlueprintUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toISOString();
}

export function ExperimentWizardView() {
  const router = useRouter();
  const [options, setOptions] = useState<Array<ExperimentBlueprintOption & BlueprintConfigDetail>>([]);
  const [targetMetadata, setTargetMetadata] = useState<Record<string, TargetMetadata>>({});
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [blueprintDetails, setBlueprintDetails] = useState<Record<string, BlueprintConfigDetail>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errors, setErrors] = useState<WizardFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitQueueInfo, setSubmitQueueInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedExperimentId, setSubmittedExperimentId] = useState<string | number | null>(null);
  const [draft, setDraft] = useState<ExperimentDraft>({
    name: '',
    description: '',
    symbol: 'BTCUSDT',
    interval: '1m',
    datasetMode: 'datetime-range',
    startDateTime: '',
    endDateTime: '',
    candlestickAmount: '1000',
    splitStrategy: 'time_based_sequential',
    targetStrategy: 'forward_return',
    targetParams: { lookahead_period: '1', return_threshold: '0' },
    architectureOverrides: { C: '', max_iter: '', penalty: '', solver: '', class_weight: '', fit_intercept: '', tol: '', alpha: '', calibrator_method: '', calibrator_cv: '' },
    indicatorOverrides: {
      vwap: { output: '' },
      ichimoku_cloud: { conversion_period: '', base_period: '', span_b_period: '', displacement: '' },
      quantile_flag: { column: '', window: '', quantile: '', output: '' },
    },
    targetOverrides: { lookahead_period: '', return_threshold: '' },
    trainSplit: '80',
    valSplit: '10',
    testSplit: '10',
    blueprintId: '',
    parameterOverrides: '{\n  \n}',
    deterministic: true,
    seed: '42',
    requestedPermutationCount: '',
  });
  const marketChart = useBTCUSDTChartData();

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await getExperimentBlueprintOptions();
      if (active) {
        setOptions(res.data?.items ?? []);
        setLoadingOptions(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getBlueprintMetadata()
      .then((response) => {
        if (!active) return;
        const targets = Object.fromEntries(((response.data?.targets ?? []) as Record<string, unknown>[])
          .map((item) => [String(item.name ?? ''), item as TargetMetadata])
          .filter(([name]) => Boolean(name)));
        setTargetMetadata(targets);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const metadata = await getBTCUSDTMetadata();
      const latest = metadata.data?.latestTimestamp;
      if (!active || !latest) return;
      const end = new Date(latest);
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      setDraft((prev) => ({
        ...prev,
        startDateTime: prev.startDateTime || toDatetimeLocalValue(start),
        endDateTime: prev.endDateTime || toDatetimeLocalValue(end),
      }));
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!draft.blueprintId || blueprintDetails[draft.blueprintId]) return;
    apiGet<{ ok: boolean; data?: { blueprint?: BlueprintConfigDetail } }>(API_ENDPOINTS.blueprints.byId(draft.blueprintId))
      .then((response) => {
        if (!active || !response.data?.blueprint) return;
        setBlueprintDetails((prev) => ({ ...prev, [draft.blueprintId]: response.data!.blueprint! }));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [draft.blueprintId, blueprintDetails]);

  const steps = STEP_META.map((step, index) => ({
    label: step.label,
    description: step.description,
    status: (index < currentStepIndex ? 'completed' : index === currentStepIndex ? 'current' : 'upcoming') as
      | 'completed'
      | 'current'
      | 'upcoming',
  }));

  const currentStep = STEP_META[currentStepIndex];
  const selectedBlueprint = options.find((option) => String(option.id) === draft.blueprintId);
  const selectedBlueprintDetail = draft.blueprintId ? (blueprintDetails[draft.blueprintId] ?? selectedBlueprint) : undefined;
  const architectureConstraints = useMemo(() => constraintRecord(selectedBlueprintDetail?.architecture), [selectedBlueprintDetail]);
  const selectedTargetMetadata = targetMetadata[draft.targetStrategy];
  const targetConstraints = useMemo(() => constraintRecord(selectedTargetMetadata as unknown as Record<string, unknown> | undefined), [selectedTargetMetadata]);
  const architectureOverrideEntries = useMemo(() => architectureParams(selectedBlueprintDetail?.architecture), [selectedBlueprintDetail]);
  const indicatorOverrideEntries = useMemo(() => indicatorParams(selectedBlueprintDetail?.indicators), [selectedBlueprintDetail]);
  const blueprintConfigLoading = Boolean(draft.blueprintId && !blueprintDetails[draft.blueprintId]);
  const basePermutationCount = Math.max(1, multiplyPermutationEntries(architectureOverrideEntries) * countIndicatorPermutations(indicatorOverrideEntries) * multiplyPermutationEntries(Object.entries(draft.targetParams)));
  const overridePermutationCount = Math.max(1, multiplyPermutationEntries(Object.entries(compactParsedValues(draft.architectureOverrides))) * countIndicatorPermutations(Object.entries(draft.indicatorOverrides).map(([name, values]) => [name, Object.entries(compactParsedValues(values))] as const)) * multiplyPermutationEntries(Object.entries(compactParsedValues(draft.targetOverrides))));
  const maxPermutationCount = Math.max(1, basePermutationCount * overridePermutationCount);

  useEffect(() => {
    setDraft((prev) => {
      return { ...prev, requestedPermutationCount: String(maxPermutationCount) };
    });
  }, [maxPermutationCount]);
  const atFirstStep = currentStepIndex === 0;
  const atLastStep = currentStepIndex === STEP_META.length - 1;

  const splitTrain = Number(draft.trainSplit);
  const splitVal = Number(draft.valSplit);
  const splitTest = Number(draft.testSplit);
  const splitTotal = splitTrain + splitVal + splitTest;
  const splitTotalValid = Number.isFinite(splitTotal) && Math.abs(splitTotal - 100) < 0.001;

  function validateParameterOverrides(): string | undefined {
    for (const [field, value] of Object.entries(draft.architectureOverrides)) {
      if (!value.trim()) continue;
      const def = toParamDefinition(field, selectedBlueprintDetail?.architecture && (selectedBlueprintDetail.architecture as Record<string, unknown>).parameters ? ((selectedBlueprintDetail.architecture as Record<string, unknown>).parameters as Record<string, unknown>)[field] : '', architectureConstraints[field]);
      const invalid = tokensFromValue(value).map((token) => validateParamToken(token, def)).find(Boolean);
      if (invalid) return `${field}: ${invalid}`;
    }
    for (const [field, value] of Object.entries(draft.targetParams)) {
      if (!value.trim()) return `${field}: This parameter is required.`;
      const def = toParamDefinition(field, value, targetConstraints[field]);
      const invalid = tokensFromValue(value).map((token) => validateParamToken(token, def)).find(Boolean);
      if (invalid) return `${field}: ${invalid}`;
    }
    for (const [field, value] of Object.entries(draft.targetOverrides)) {
      if (!value.trim()) continue;
      const def = toParamDefinition(field, draft.targetParams[field], targetConstraints[field]);
      const invalid = tokensFromValue(value).map((token) => validateParamToken(token, def)).find(Boolean);
      if (invalid) return `${field}: ${invalid}`;
    }
    return undefined;
  }

  function validateSplitStep(): WizardFieldErrors {
    const nextErrors: WizardFieldErrors = {};

    if (!Number.isFinite(splitTrain) || splitTrain < 0) {
      nextErrors.trainSplit = 'Train split must be a non-negative number.';
    }
    if (!Number.isFinite(splitVal)) {
      nextErrors.valSplit = 'Validation split must be a number.';
    } else if (splitVal < 10) {
      nextErrors.valSplit = 'Validation split must be at least 10%.';
    }

    if (!Number.isFinite(splitTest)) {
      nextErrors.testSplit = 'Test split must be a number.';
    } else if (splitTest < 10) {
      nextErrors.testSplit = 'Test split must be at least 10%.';
    }

    if (!splitTotalValid) {
      nextErrors.splitTotal = 'Train + Validation + Test must total 100%.';
    }

    return nextErrors;
  }

  function handleNext() {
    if (currentStep.id === 'basics') {
      const name = draft.name.trim();
      if (!name) {
        setErrors((prev) => ({ ...prev, name: 'Experiment name is required.' }));
        return;
      }
      setErrors((prev) => ({ ...prev, name: undefined }));
    }

    if (currentStep.id === 'dataset-range') {
      const nextErrors: WizardFieldErrors = {};
        if (draft.datasetMode === 'datetime-range' && !draft.startDateTime) {
          nextErrors.startDateTime = 'Start datetime is required.';
        }
        if (!draft.endDateTime) {
          nextErrors.endDateTime = 'End datetime is required.';
        }
        const normalizedStart = draft.startDateTime.includes('T') ? draft.startDateTime : `${draft.startDateTime}T00:00`;
        const normalizedEnd = draft.endDateTime.includes('T') ? draft.endDateTime : `${draft.endDateTime}T00:00`;
        if (draft.datasetMode === 'datetime-range' && draft.startDateTime && draft.endDateTime && normalizedStart >= normalizedEnd) {
          nextErrors.dateRange = 'Start date must be before end date.';
        }

      if (Object.keys(nextErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...nextErrors }));
        return;
      }

      setErrors((prev) => ({
        ...prev,
          startDateTime: undefined,
          endDateTime: undefined,
        dateRange: undefined,
      }));
    }

    if (currentStep.id === 'split-config') {
      const nextErrors = validateSplitStep();
      if (Object.keys(nextErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...nextErrors }));
        return;
      }

      setErrors((prev) => ({
        ...prev,
        trainSplit: undefined,
        valSplit: undefined,
        testSplit: undefined,
        splitTotal: undefined,
      }));
      setCurrentStepIndex((prev) => Math.min(prev + 1, STEP_META.length - 1));
      return;
    }

    if (currentStep.id === 'blueprint-selection') {
      if (!draft.blueprintId) {
        setErrors((prev) => ({ ...prev, blueprintId: 'Please select a Blueprint to continue.' }));
        return;
      }
      setErrors((prev) => ({ ...prev, blueprintId: undefined }));
    }

    if (currentStep.id === 'target-selection') {
      if (!draft.targetStrategy) {
        setErrors((prev) => ({ ...prev, targetStrategy: 'Please select a target strategy.' }));
        return;
      }
      const targetError = validateParameterOverrides();
      if (targetError) {
        setErrors((prev) => ({ ...prev, parameterOverrides: targetError }));
        return;
      }
      setErrors((prev) => ({ ...prev, targetStrategy: undefined }));
    }

    if (currentStep.id === 'parameter-overrides') {
      const overrideError = validateParameterOverrides();
      if (overrideError) {
        setErrors((prev) => ({ ...prev, parameterOverrides: overrideError }));
        return;
      }
      setErrors((prev) => ({ ...prev, parameterOverrides: undefined }));
    }

    setCurrentStepIndex((prev) => Math.min(prev + 1, STEP_META.length - 1));
  }

  function handleBack() {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }

  async function handleSubmitExperiment() {
    setSubmitError(null);
    setSubmitQueueInfo(null);
    setSubmitting(true);
    try {
      const parsedOverrides = {
        architecture: compactParsedValues(draft.architectureOverrides),
        indicators: Object.fromEntries(Object.entries(draft.indicatorOverrides).map(([name, values]) => [name, compactParsedValues(values)]).filter(([, values]) => Object.keys(values).length > 0)),
        target: compactParsedValues(draft.targetOverrides),
        target_params: compactParsedValues(draft.targetParams),
      } as Record<string, unknown>;
      const payload = {
        name: draft.name,
        description: draft.description || undefined,
        symbol: draft.symbol,
        interval: draft.interval,
        start_datetime: draft.datasetMode === 'datetime-range' ? draft.startDateTime || undefined : undefined,
        end_datetime: draft.endDateTime || undefined,
        candlestick_amount: draft.datasetMode === 'candlestick-count' ? Number(draft.candlestickAmount) : undefined,
        train_split: Number(draft.trainSplit),
        val_split: Number(draft.valSplit),
        test_split: Number(draft.testSplit),
        split_strategy: draft.splitStrategy,
        target_strategy: draft.targetStrategy,
        blueprint_id: Number(draft.blueprintId),
        parameter_overrides: parsedOverrides,
        deterministic: draft.deterministic,
        seed: draft.deterministic ? Number(draft.seed || 42) : undefined,
        requested_permutation_count: Math.min(maxPermutationCount, Math.max(1, Number(draft.requestedPermutationCount || maxPermutationCount))),
      };

      const res = await createExperiment(payload);
      const fieldErrors = res.data?.errors;
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...(fieldErrors as Partial<WizardFieldErrors>) }));
        const errorSummary = Object.entries(fieldErrors).map(([field, messages]) => field + ': ' + (Array.isArray(messages) ? messages.join(', ') : String(messages))).join(' ');
          setSubmitError('Please fix validation errors before submitting. ' + errorSummary);
        return;
      }

      const experimentId = res.data?.experiment?.id;
      if (experimentId === undefined || experimentId === null) {
        setSubmitError('Experiment was submitted but no experiment id was returned.');
        return;
      }

      const queuePosition = res.data?.queue?.position;
      const jobId = res.data?.job?.id;
      if (jobId) {
        const queueLabel = queuePosition === null || queuePosition === undefined ? 'pending' : `#${queuePosition}`;
        setSubmitQueueInfo(`Queued as job ${jobId} (position ${queueLabel}). Redirecting...`);
      }

      setSubmittedExperimentId(experimentId);
      router.push(`/experiments/${experimentId}`);
    } catch (error) {
      if (error instanceof ApiClientError) {
        const maybeErrors = (error.details as { data?: { errors?: Record<string, string | string[]> } } | undefined)?.data?.errors;
        if (maybeErrors) {
          setErrors((prev) => ({ ...prev, ...(maybeErrors as Partial<WizardFieldErrors>) }));
          const errorSummary = Object.entries(maybeErrors).map(([field, messages]) => field + ': ' + (Array.isArray(messages) ? messages.join(', ') : String(messages))).join(' ');
          setSubmitError('Please fix validation errors before submitting. ' + errorSummary);
        } else {
          setSubmitError(error.message);
        }
      } else {
        setSubmitError('Failed to submit experiment.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function renderStepContent() {
    switch (currentStep.id) {
      case 'basics':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="experiment-name">Experiment Name</Label>
              <Input
                id="experiment-name"
                placeholder="e.g., BTCUSDT Momentum Validation"
                value={draft.name}
                onChange={(event) => {
                  setDraft((prev) => ({ ...prev, name: event.target.value }));
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
              />
              {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="experiment-description">Description</Label>
              <textarea
                id="experiment-description"
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Describe your experiment objective..."
                value={draft.description}
                onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
          </div>
        );
      case 'dataset-range':
        async function handleUseDefaults() {
          const metadata = await getBTCUSDTMetadata();
          const latest = metadata.data?.latestTimestamp;
          if (!latest) return;
          const end = new Date(latest);
          const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
          setDraft((prev) => ({ ...prev, startDateTime: toDatetimeLocalValue(start), endDateTime: toDatetimeLocalValue(end) }));
          setErrors((prev) => ({ ...prev, startDateTime: undefined, endDateTime: undefined, dateRange: undefined }));
        }
        return (
          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Fixed Dataset Scope</CardTitle>
                <CardDescription>
                  This wizard enforces BTCUSDT as the dataset symbol. You can choose a supported interval for experimentation.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge variant="secondary">Symbol: {draft.symbol}</Badge>
                <Badge variant="secondary">Interval: {draft.interval}</Badge>
              </CardContent>
            </Card>
            <Button type="button" variant="outline" onClick={handleUseDefaults}>Use defaults</Button>
            <div className="space-y-2">
              <Label htmlFor="dataset-mode">Dataset Input Mode</Label>
              <select
                id="dataset-mode"
                aria-label="Dataset Input Mode"
                value={draft.datasetMode}
                onChange={(event) => setDraft((prev) => ({ ...prev, datasetMode: event.target.value as ExperimentDraft['datasetMode'] }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="datetime-range">Datetime Range</option>
                <option value="candlestick-count">Candlestick Count</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interval-select">Interval</Label>
      <select
                id="interval-select"
        aria-label="Interval"
                value={draft.interval}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    interval: event.target.value as ExperimentDraft['interval'],
                  }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SUPPORTED_INTERVALS.map((interval) => (
                  <option key={interval} value={interval}>
                    {interval}
                  </option>
                ))}
              </select>
            </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {draft.datasetMode === 'datetime-range' ? (
                  <div className="space-y-2">
                    <Label htmlFor="start-datetime">Start Datetime</Label>
                    <Input
                      id="start-datetime"
                      aria-label="Start Datetime"
                      type="datetime-local"
                      step="60"
                      value={draft.startDateTime}
                      onChange={(event) => {
                        setDraft((prev) => ({ ...prev, startDateTime: event.target.value }));
                        setErrors((prev) => ({ ...prev, startDateTime: undefined, dateRange: undefined }));
                      }}
                    />
                    {errors.startDateTime ? <p className="text-xs text-destructive">{errors.startDateTime}</p> : null}
                  </div>
                  ) : (
                  <div className="space-y-2">
                    <Label htmlFor="candlestick-amount">Candlestick Amount</Label>
                    <Input
                      id="candlestick-amount"
                      aria-label="Candlestick Amount"
                      type="number"
                      min="1"
                      step="1"
                      value={draft.candlestickAmount}
                      onChange={(event) => setDraft((prev) => ({ ...prev, candlestickAmount: event.target.value }))}
                    />
                  </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="end-datetime">End Datetime</Label>
                    <Input
                      id="end-datetime"
        aria-label="End Datetime"
                      type="datetime-local"
                      step="60"
                      value={draft.endDateTime}
                      onChange={(event) => {
                        setDraft((prev) => ({ ...prev, endDateTime: event.target.value }));
                        setErrors((prev) => ({ ...prev, endDateTime: undefined, dateRange: undefined }));
                      }}
                    />
                    {errors.endDateTime ? <p className="text-xs text-destructive">{errors.endDateTime}</p> : null}
                  </div>
                </div>
                {errors.dateRange ? <p className="text-xs text-destructive">{errors.dateRange}</p> : null}
            <div>
              <p className="mb-2 text-sm font-medium">BTCUSDT 1m Dataset Preview</p>
              <BTCUSDTPriceChart
                data={marketChart.data}
                loading={marketChart.loading}
                error={marketChart.error}
                height={240}
                onRequestOlder={marketChart.loadOlder}
              />
            </div>
          </div>
        );
      case 'split-config':
        return (
          <div className="space-y-4">
            <Card className={splitTotalValid ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}>
              <CardHeader>
                <CardTitle className="text-base">Split Summary</CardTitle>
                <CardDescription>Target total split must be exactly 100%.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">Computed Total: {Number.isFinite(splitTotal) ? splitTotal.toFixed(2) : '—'}%</p>
                <p className={splitTotalValid ? 'text-emerald-600' : 'text-amber-600'}>
                  {splitTotalValid ? 'Split total is valid.' : 'Split total is invalid.'}
                </p>
                {errors.splitTotal ? <p className="text-xs text-destructive">{errors.splitTotal}</p> : null}
              </CardContent>
            </Card>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="train-split">Train Split</Label>
                <Input
                  id="train-split"
                  type="number"
                  step="0.01"
                  value={draft.trainSplit}
                  onChange={(event) => {
                    setDraft((prev) => ({ ...prev, trainSplit: event.target.value }));
                    setErrors((prev) => ({ ...prev, trainSplit: undefined, splitTotal: undefined }));
                  }}
                />
                {errors.trainSplit ? <p className="text-xs text-destructive">{errors.trainSplit}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="val-split">Validation Split</Label>
                <Input
                  id="val-split"
                  type="number"
                  step="0.01"
                  value={draft.valSplit}
                  onChange={(event) => {
                    setDraft((prev) => ({ ...prev, valSplit: event.target.value }));
                    setErrors((prev) => ({ ...prev, valSplit: undefined, splitTotal: undefined }));
                  }}
                />
                <p className="text-xs text-muted-foreground">Minimum 10%</p>
                {errors.valSplit ? <p className="text-xs text-destructive">{errors.valSplit}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-split">Test Split</Label>
                <Input
                  id="test-split"
                  type="number"
                  step="0.01"
                  value={draft.testSplit}
                  onChange={(event) => {
                    setDraft((prev) => ({ ...prev, testSplit: event.target.value }));
                    setErrors((prev) => ({ ...prev, testSplit: undefined, splitTotal: undefined }));
                  }}
                />
                <p className="text-xs text-muted-foreground">Minimum 10%</p>
                {errors.testSplit ? <p className="text-xs text-destructive">{errors.testSplit}</p> : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="split-strategy">Split Strategy</Label>
      <select
                id="split-strategy"
        aria-label="Split Strategy"
                value={draft.splitStrategy}
                onChange={(event) => setDraft((prev) => ({ ...prev, splitStrategy: event.target.value as ExperimentDraft['splitStrategy'] }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="time_based_sequential">Time-based sequential</option>
                <option value="random">Random</option>
              </select>
            </div>
          </div>
        );
      case 'blueprint-selection':
        return (
          <div className="space-y-4">
            <p className="text-sm font-medium">Accessible Blueprints</p>
            {loadingOptions ? (
              <p className="text-sm text-muted-foreground">Loading approved blueprints...</p>
            ) : options.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approved blueprints available.</p>
            ) : (
              <div className="space-y-2">
                {options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setDraft((prev) => ({ ...prev, blueprintId: String(option.id) }));
                      setErrors((prev) => ({ ...prev, blueprintId: undefined }));
                    }}
                    className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                      draft.blueprintId === String(option.id) ? 'border-primary bg-primary/5' : 'border-border bg-background'
                    }`}
                  >
                    <p className="font-medium">{option.name} (v{option.version})</p>
                    <p className="text-xs text-muted-foreground">Owner #{option.ownerId}</p>
                  </button>
                ))}
              </div>
            )}
            {errors.blueprintId ? <p className="text-xs text-destructive">{errors.blueprintId}</p> : null}
            {selectedBlueprint ? (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Selected Blueprint</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> {selectedBlueprint.name}</p>
                  <p><span className="text-muted-foreground">Version:</span> v{selectedBlueprint.version}</p>
                  <p><span className="text-muted-foreground">Owner:</span> #{selectedBlueprint.ownerId}</p>
                  <p><span className="text-muted-foreground">Updated:</span> {formatBlueprintUpdatedAt(selectedBlueprint.updatedAt)}</p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        );
      case 'target-selection':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target-strategy">Target Strategy</Label>
      <select
                id="target-strategy"
        aria-label="Target Strategy"
                value={draft.targetStrategy}
                onChange={(event) => {
                  const targetStrategy = event.target.value as ExperimentDraft['targetStrategy'];
                  const metadata = targetMetadata[targetStrategy];
                  const defaults = Object.fromEntries(Object.entries((metadata?.defaultValues ?? metadata?.default_values ?? TARGET_PARAMETER_DEFAULTS[targetStrategy]) as Record<string, unknown>).map(([key, item]) => [key, String(item ?? '')]));
                  setDraft((prev) => ({
                    ...prev,
                    targetStrategy,
                    targetParams: { ...defaults },
                    targetOverrides: Object.fromEntries(Object.keys(defaults).map((key) => [key, ''])),
                  }));
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="forward_return">Forward return</option>
                <option value="roc_lookahead">ROC lookahead</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(draft.targetParams).map(([param, value]) => (
                <div key={param} className="space-y-1">
                  <Label className="text-xs">{param}</Label>
                  {describeConstraint(toParamDefinition(param, value, targetConstraints[param])) ? <p className="text-[11px] text-muted-foreground">{describeConstraint(toParamDefinition(param, value, targetConstraints[param]))}</p> : null}
                  <TokenizedParameterInput
                    value={value}
                    param={toParamDefinition(param, value, targetConstraints[param])}
                    error={errors.parameterOverrides}
                    onChange={(nextValue) => setDraft((prev) => ({
                      ...prev,
                      targetParams: { ...prev.targetParams, [param]: nextValue },
                      targetOverrides: { ...prev.targetOverrides, [param]: nextValue },
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      case 'parameter-overrides':
        return (
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="font-medium">Architecture Overrides</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {blueprintConfigLoading ? <p className="text-sm text-muted-foreground">Loading selected Blueprint parameters...</p> : architectureOverrideEntries.length === 0 ? <p className="text-sm text-muted-foreground">No architecture parameters are available from the selected Blueprint.</p> : architectureOverrideEntries.map(([field, value]) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs">{field}</Label>
                    {describeConstraint(toParamDefinition(field, value, architectureConstraints[field])) ? <p className="text-[11px] text-muted-foreground">{describeConstraint(toParamDefinition(field, value, architectureConstraints[field]))}</p> : null}
                    <TokenizedParameterInput value={draft.architectureOverrides[field] ?? ''} onChange={(nextValue) => setDraft((prev) => ({ ...prev, architectureOverrides: { ...prev.architectureOverrides, [field]: nextValue } }))} param={toParamDefinition(field, value, architectureConstraints[field])} error={errors.parameterOverrides} />
                  </div>
                ))}
              </div>
            </section>
            <section className="space-y-3">
              <h3 className="font-medium">Indicator Overrides</h3>
              {blueprintConfigLoading ? <p className="text-sm text-muted-foreground">Loading selected Blueprint parameters...</p> : indicatorOverrideEntries.length === 0 ? <p className="text-sm text-muted-foreground">The selected Blueprint has indicators, but none expose user-overridable parameters.</p> : indicatorOverrideEntries.map(([indicator, fields]) => (
                <div key={indicator} className="rounded-lg border p-3">
                  <p className="mb-2 font-mono text-xs">{indicator}</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {fields.map(([field, value]) => (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs">{field}</Label>
                        <Input value={draft.indicatorOverrides[indicator]?.[field] ?? ''} onChange={(event) => setDraft((prev) => ({ ...prev, indicatorOverrides: { ...prev.indicatorOverrides, [indicator]: { ...(prev.indicatorOverrides[indicator] ?? {}), [field]: event.target.value } } }))} placeholder={String(value ?? 'configured value')} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
            <section className="space-y-3">
              <h3 className="font-medium">Target Overrides</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {Object.keys(draft.targetParams).map((field) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs">{field}</Label>
                    {describeConstraint(toParamDefinition(field, draft.targetParams[field], targetConstraints[field])) ? <p className="text-[11px] text-muted-foreground">{describeConstraint(toParamDefinition(field, draft.targetParams[field], targetConstraints[field]))}</p> : null}
                    <TokenizedParameterInput value={draft.targetOverrides[field] ?? ''} onChange={(nextValue) => setDraft((prev) => ({ ...prev, targetOverrides: { ...prev.targetOverrides, [field]: nextValue } }))} param={toParamDefinition(field, draft.targetParams[field], targetConstraints[field])} error={errors.parameterOverrides} />
                  </div>
                ))}
              </div>
            </section>
            {errors.parameterOverrides ? <p className="text-xs text-destructive">{errors.parameterOverrides}</p> : null}
          </div>
        );
      case 'deterministic-seed':
        return (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardHeader><CardTitle className="text-base">Permutation Sampling</CardTitle><CardDescription>Max permutation count: {maxPermutationCount}. Desired permutations default to the max.</CardDescription></CardHeader><CardContent className="space-y-2"><Label htmlFor="requested-permutations">Desired permutations to run</Label><Input id="requested-permutations" type="number" min={1} max={maxPermutationCount} value={draft.requestedPermutationCount || String(maxPermutationCount)} onChange={(event) => setDraft((prev) => ({ ...prev, requestedPermutationCount: event.target.value }))} /></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Seed</CardTitle><CardDescription>Seed is required only when deterministic mode is enabled.</CardDescription></CardHeader><CardContent className="space-y-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.deterministic} onChange={(event) => setDraft((prev) => ({ ...prev, deterministic: event.target.checked, seed: event.target.checked ? (prev.seed || '42') : prev.seed }))} /> Deterministic mode</label>{draft.deterministic ? <div className="space-y-2"><Label htmlFor="seed">Seed</Label><Input id="seed" value={draft.seed || '42'} onChange={(event) => setDraft((prev) => ({ ...prev, seed: event.target.value }))} /></div> : null}</CardContent></Card>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-4 text-sm">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuration Review</CardTitle>
                <CardDescription>Complete experiment setup before queue submission.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border bg-background/70 p-4">
                  <h3 className="font-medium">Experiment Basics</h3>
                  <div className="mt-3 grid gap-2">
                    <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Name</p><p className="font-medium">{draft.name || '—'}</p></div>
                    <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Description</p><p className="font-medium">{draft.description || '—'}</p></div>
                    <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Symbol</p><p className="font-medium">{draft.symbol}</p></div>
                    <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Interval</p><p className="font-medium">{draft.interval}</p></div>
                  </div>
                </section>
                <section className="rounded-xl border bg-background/70 p-4">
                  <h3 className="font-medium">Dataset Range</h3>
                  <div className="mt-3 grid gap-2">
                    <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Input mode</p><p className="font-medium">{draft.datasetMode}</p></div>
                    <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Start</p><p className="font-mono">{draft.datasetMode === 'datetime-range' ? draft.startDateTime || '—' : 'Derived from candle count'}</p></div>
                    <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">End</p><p className="font-mono">{draft.endDateTime || '—'}</p></div>
                    <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Candles</p><p className="font-mono">{draft.datasetMode === 'candlestick-count' ? draft.candlestickAmount : 'Range based'}</p></div>
                  </div>
                </section>
                <section className="rounded-xl border bg-background/70 p-4">
                  <h3 className="font-medium">Split Configuration</h3>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-muted/30 px-3 py-2 text-center"><p className="text-[11px] uppercase text-muted-foreground">Train</p><p className="font-mono text-lg">{draft.trainSplit}%</p></div>
                    <div className="rounded-lg bg-muted/30 px-3 py-2 text-center"><p className="text-[11px] uppercase text-muted-foreground">Validation</p><p className="font-mono text-lg">{draft.valSplit}%</p></div>
                    <div className="rounded-lg bg-muted/30 px-3 py-2 text-center"><p className="text-[11px] uppercase text-muted-foreground">Test</p><p className="font-mono text-lg">{draft.testSplit}%</p></div>
                  </div>
                  <div className="mt-2 rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Strategy</p><p className="font-medium">{draft.splitStrategy}</p></div>
                </section>
                <section className="rounded-xl border bg-background/70 p-4">
                  <h3 className="font-medium">Blueprint</h3>
                  <div className="mt-3 grid gap-2">
                    <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Selected</p><p className="font-medium">{selectedBlueprint ? `${selectedBlueprint.name} (v${selectedBlueprint.version})` : 'Not selected'}</p></div>
                    <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Owner</p><p className="font-mono">{selectedBlueprint ? `#${selectedBlueprint.ownerId}` : '—'}</p></div>
                    <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Updated</p><p className="font-mono">{selectedBlueprint ? formatBlueprintUpdatedAt(selectedBlueprint.updatedAt) : '—'}</p></div>
                  </div>
                </section>
                <section className="rounded-xl border bg-background/70 p-4">
                  <h3 className="font-medium">Run Plan</h3>
                  <div className="mt-3 grid gap-2">
                    <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Max permutations</p><p className="font-mono">{maxPermutationCount}</p></div>
                    <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Requested permutations</p><p className="font-mono">{draft.requestedPermutationCount || String(maxPermutationCount)}</p></div>
                    <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Deterministic</p><p className="font-mono">{draft.deterministic ? true : false}</p></div>
                    {draft.deterministic ? <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Seed</p><p className="font-mono">{draft.seed || 42}</p></div> : null}
                  </div>
                </section>
                <section className="rounded-xl border bg-background/70 p-4 lg:col-span-2">
                  <h3 className="font-medium">Target Strategy</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Strategy</p><p className="font-medium">{draft.targetStrategy}</p></div>
                    {Object.entries({ ...draft.targetParams, ...compactValues(draft.targetOverrides) }).map(([key, value]) => (
                      <div key={key} className="rounded-lg bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">{key}</p><p className="font-mono">{value}</p></div>
                    ))}
                  </div>
                </section>
                <section className="rounded-xl border bg-background/70 p-4 lg:col-span-2">
                  <h3 className="font-medium">Parameter Overrides</h3>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-lg bg-muted/30 p-3"><p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Architecture</p>{architectureOverrideEntries.length === 0 ? <p className="text-muted-foreground">No architecture parameters.</p> : <div className="flex flex-wrap gap-2">{architectureOverrideEntries.map(([field, value]) => <span key={field} className="rounded border bg-background px-2 py-1 text-xs"><strong>{field}</strong>: {draft.architectureOverrides[field] || String(value ?? '')}</span>)}</div>}</div>
                    <div className="rounded-lg bg-muted/30 p-3"><p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Indicators</p>{indicatorOverrideEntries.length === 0 ? <p className="text-muted-foreground">No indicator override parameters.</p> : <div className="space-y-2">{indicatorOverrideEntries.map(([indicator, fields]) => <div key={indicator}><p className="font-mono text-xs">{indicator}</p><div className="mt-1 flex flex-wrap gap-2">{fields.map(([field, value]) => <span key={field} className="rounded border bg-background px-2 py-1 text-xs"><strong>{field}</strong>: {draft.indicatorOverrides[indicator]?.[field] || String(value ?? '')}</span>)}</div></div>)}</div>}</div>
                  </div>
                </section>
              </CardContent>
            </Card>
          </div>
        );
      case 'submit':
        return (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle>Ready to Submit</CardTitle>
              <CardDescription>
                Submit this experiment configuration to create a new experiment record.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
              {submittedExperimentId ? (
                <p className="text-sm text-emerald-600">Submitted successfully. Redirecting to experiment #{submittedExperimentId}...</p>
              ) : null}
              {submitQueueInfo ? <p className="text-xs text-muted-foreground">{submitQueueInfo}</p> : null}
              <Button onClick={handleSubmitExperiment} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Experiment'}
              </Button>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  }

  return (
    <WizardView
      title="New Experiment"
      description="Configure dataset, Blueprint, and launch settings."
      steps={steps}
      footer={
        <>
          <Button variant="outline" onClick={handleBack} disabled={atFirstStep}>Back</Button>
          <Button onClick={handleNext} disabled={atLastStep}>{currentStep.id === 'review' ? 'Proceed to Submit' : atLastStep ? 'Submitted' : 'Next'}</Button>
        </>
      }
    >
      {renderStepContent()}
    </WizardView>
  );
}