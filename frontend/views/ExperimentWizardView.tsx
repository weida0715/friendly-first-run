"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WizardView } from './WizardView';
import { CircleHelp, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BTCUSDTPriceChart, useBTCUSDTChartData } from '@/components/charts';
import { TokenizedParameterInput, describeConstraint, tokensFromValue, validateParamToken, type ParameterConstraint, type TokenizedParamDefinition } from '@/components/forms/TokenizedParameterInput';
import { ApiClientError, apiGet, createExperiment, getBlueprintMetadata, getBTCUSDTMetadata, getBTCUSDTTargetPreview, getExperimentBlueprintOptions, getSystemSettings, ExperimentBlueprintOption, type BTCUSDTTargetPreviewResponse } from '@/lib/api/client';
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
type TargetMetadata = { name: string; parameterConstraints?: Record<string, ParameterConstraint>; parameter_constraints?: Record<string, ParameterConstraint>; defaultValues?: Record<string, unknown>; default_values?: Record<string, unknown>; binaryLabelRule?: string; binary_label_rule?: string };
type ScalerStrategy = 'none' | 'normalization' | 'standardization' | 'log_transform';

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
  targetStrategy: string;
  targetParams: Record<string, string>;
  architectureOverrides: Record<string, string>;
  indicatorOverrides: Record<string, Record<string, string>>;
  indicatorOutputScalers: Record<string, Record<string, ScalerStrategy>>;
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

const TARGET_PARAMETER_DEFAULTS: Record<string, Record<string, string>> = {
  forward_return: { lookahead_period: '1', return_threshold: '0' },
  roc_lookahead: { lookahead_period: '1', roc_threshold: '0' },
  quantile_flag: { roc_period: '4', q: '0.5', lookahead_period: '1' },
  candle_direction: { lookahead_period: '1' },
};

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

function indicatorDefinition(indicators: Record<string, unknown> | undefined, name: string) {
  if (!indicators) return undefined;
  const definitions = Array.isArray(indicators.definitions) ? indicators.definitions as Record<string, unknown>[] : [];
  return definitions.find((item) => String(item.name ?? item.id) === name);
}

function indicatorScalerDefaults(indicators?: Record<string, unknown>) {
  if (!indicators) return [] as Array<readonly [string, Array<readonly [string, ScalerStrategy]>]>;
  const scalersByName = ((indicators.output_scalers ?? indicators.outputScalers ?? {}) as Record<string, Record<string, ScalerStrategy>>) || {};
  const selected = Array.isArray(indicators.selected) ? indicators.selected.map(String) : [];
  const definitions = Array.isArray(indicators.definitions) ? indicators.definitions as Record<string, unknown>[] : [];
  const names = selected.length > 0 ? selected : definitions.map((item) => String(item.name ?? item.id ?? '')).filter(Boolean);
  return names.map((name) => {
    const definition = definitions.find((item) => String(item.name ?? item.id) === name);
    const outputs = (definition?.outputColumns ?? definition?.output_columns ?? []) as string[];
    const byName = scalersByName[name] ?? (definition?.outputScalers as Record<string, ScalerStrategy> | undefined) ?? {};
    return [name, outputs.map((output) => [output, byName[output] ?? 'none' as ScalerStrategy] as const)] as const;
  }).filter(([, entries]) => entries.length > 0);
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
  if (trimmed.toLowerCase() === 'none' || trimmed.toLowerCase() === 'null') return null;
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

function buildTargetPreviewParams(
  metadata: TargetMetadata | undefined,
  constraints: Record<string, ParameterConstraint>,
  currentParams: Record<string, string>,
) {
  const defaults = (metadata?.defaultValues ?? metadata?.default_values ?? {}) as Record<string, unknown>;
  const keys = new Set<string>([
    ...Object.keys(defaults),
    ...Object.keys(constraints),
    ...Object.keys(currentParams),
  ]);

  return Object.fromEntries(Array.from(keys).map((key) => {
    const currentValue = currentParams[key];
    const defaultValue = defaults[key];
    const nextValue = currentValue && currentValue.trim() !== '' ? currentValue : String(defaultValue ?? '');
    return [key, nextValue];
  }));
}

function previewTargetParamEntries(
  metadata: TargetMetadata | undefined,
  constraints: Record<string, ParameterConstraint>,
  currentParams: Record<string, string>,
) {
  const defaults = (metadata?.defaultValues ?? metadata?.default_values ?? {}) as Record<string, unknown>;
  const keys = new Set<string>([
    ...Object.keys(defaults),
    ...Object.keys(constraints),
    ...Object.keys(currentParams),
  ]);

  return Array.from(keys).map((key) => [key, currentParams[key] ?? String(defaults[key] ?? '')] as const);
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

function buildTargetPreviewPayload(draft: ExperimentDraft, targetParams: Record<string, string>) {
  const target_params = compactParsedValues(targetParams);
  if (draft.datasetMode === 'datetime-range') {
    return {
      interval: draft.interval,
      target_strategy: draft.targetStrategy,
      target_params,
      start_datetime: draft.startDateTime || undefined,
      end_datetime: draft.endDateTime || undefined,
    };
  }
  return {
    interval: draft.interval,
    target_strategy: draft.targetStrategy,
    target_params,
    end_datetime: draft.endDateTime || undefined,
    candlestick_amount: draft.candlestickAmount ? Number(draft.candlestickAmount) : undefined,
  };
}

type TargetPreviewMode = 'true_label' | 'mock_prediction';

type TargetPreviewControls = {
  previewMode: TargetPreviewMode;
  entryAssumption: 'next_open' | 'current_close';
  evaluationCostBps: string;
  mockPrecision: string;
  mockRecall: string;
  mockSeed: string;
};

function buildTargetPreviewPayloadWithControls(
  draft: ExperimentDraft,
  targetParams: Record<string, string>,
  controls: TargetPreviewControls,
) {
  const payload = buildTargetPreviewPayload(draft, targetParams);
  return {
    ...payload,
    preview_mode: controls.previewMode,
    entry_assumption: controls.entryAssumption,
    evaluation_cost_bps: controls.evaluationCostBps.trim() === '' ? undefined : Number(controls.evaluationCostBps),
    mock_precision: controls.mockPrecision.trim() === '' ? undefined : Number(controls.mockPrecision),
    mock_recall: controls.mockRecall.trim() === '' ? undefined : Number(controls.mockRecall),
    mock_seed: controls.mockSeed.trim() === '' ? undefined : Number(controls.mockSeed),
  };
}

function targetLabel(name: string) {
  return name.replace(/_/g, ' ');
}

function targetParameterHelpText(name: string) {
  if (name === 'lookahead_period') return 'Bars to look ahead before computing the label. Preview allows 0; experiment targets still require at least 1.';
  if (name === 'roc_period') return 'Bars used to compute the ROC window.';
  if (name === 'q') return 'Quantile fraction used to fit the cutoff.';
  if (name === 'return_threshold') return 'Minimum future return required for a positive label.';
  if (name === 'roc_threshold') return 'Minimum future ROC required for a positive label.';
  return undefined;
}

function previewTargetConstraint(name: string, constraint?: ParameterConstraint): ParameterConstraint | undefined {
  if (name !== 'lookahead_period') return constraint;
  return {
    ...(constraint ?? {}),
    min: 0,
  };
}

function targetParameterConstraintText(param: TokenizedParamDefinition) {
  return describeConstraint(param) || 'No extra constraint metadata available.';
}

function targetParameterInputType(constraint?: ParameterConstraint) {
  if (constraint?.type === 'integer') return 'number';
  if (constraint?.type === 'number') return 'number';
  return 'text';
}

function targetParameterStep(constraint?: ParameterConstraint) {
  return constraint?.type === 'integer' ? 1 : 'any';
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(Math.abs(value) >= 100 ? 1 : 2)}%`;
}

function formatFactor(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (!Number.isFinite(value)) return 'inf';
  return value.toFixed(2);
}

type TargetPreviewSummary = NonNullable<BTCUSDTTargetPreviewResponse['data']>['summary'];
type TargetPreviewBridge = NonNullable<BTCUSDTTargetPreviewResponse['data']>['bridge'];
type TargetPreviewEconomics = NonNullable<BTCUSDTTargetPreviewResponse['data']>['economics'];
type TargetPreviewEconomicRow = NonNullable<TargetPreviewEconomics>['horizons'] extends Array<infer T> ? T : never;

function HelpDot({ label, description }: { label: string; description: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      aria-label={label}
      title={description}
    >
      <CircleHelp className="h-3.5 w-3.5" />
    </button>
  );
}

function TargetPreviewCountBars({ summary }: { summary?: TargetPreviewSummary }) {
  const positive = Number(summary?.positiveCount ?? 0);
  const negative = Number(summary?.negativeCount ?? 0);
  const unlabeled = Number(summary?.unlabeledCount ?? 0);
  const total = Math.max(1, positive + negative + unlabeled);
  const items = [
    { label: 'Positive', value: positive, className: 'bg-emerald-500' },
    { label: 'Negative', value: negative, className: 'bg-slate-500' },
    { label: 'Unlabeled', value: unlabeled, className: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-3 rounded-xl border bg-background/60 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Label balance</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>{item.label}</span>
              <span className="font-mono text-muted-foreground">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className={`h-full ${item.className}`} style={{ width: `${(item.value / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TargetPreviewConfusionGrid({ summary }: { summary?: TargetPreviewSummary }) {
  const confusion = summary?.confusion ?? {};
  const cells = [
    { label: 'TP', value: confusion.tp_count, className: 'bg-emerald-500/15', help: 'Target predicted up and the candle was up.' },
    { label: 'FP', value: confusion.fp_count, className: 'bg-red-500/15', help: 'Target predicted up but the candle was down.' },
    { label: 'FN', value: confusion.fn_count, className: 'bg-amber-500/15', help: 'Target predicted down but the candle was up.' },
    { label: 'TN', value: confusion.tn_count, className: 'bg-slate-500/15', help: 'Target predicted down and the candle was down.' },
  ];
  return (
    <div className="space-y-3 rounded-xl border bg-background/60 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Direction relationship</p>
      <div className="grid grid-cols-2 gap-2">
        {cells.map((cell) => (
          <div key={cell.label} className={`rounded-lg border p-3 ${cell.className}`}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase text-muted-foreground">{cell.label}</p>
              <HelpDot label={`${cell.label} help`} description={cell.help} />
            </div>
            <p className="mt-1 text-lg font-semibold">{String(cell.value ?? '—')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TargetPreviewEconomicTable({ economics, mode }: { economics?: TargetPreviewEconomics; mode?: string }) {
  const rows = economics?.horizons ?? [];
  if (!rows.length) {
    return (
      <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
        No forward-return separation rows available.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Forward-return separation</p>
          <p className="text-xs text-muted-foreground">
            {mode === 'mock_prediction' ? 'Mock prediction mode is active.' : 'True label mode is active.'}
          </p>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="min-w-[920px] w-full text-left text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-2 pr-3">Horizon</th>
              <th className="py-2 pr-3">All mean</th>
              <th className="py-2 pr-3">Target=1 mean</th>
              <th className="py-2 pr-3">Target=0 mean</th>
              <th className="py-2 pr-3">Spread</th>
              <th className="py-2 pr-3">Lift</th>
              <th className="py-2 pr-3">Target=1 win</th>
              <th className="py-2 pr-3">Target=1 PF</th>
              <th className="py-2 pr-3">Positive rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row?.horizon ?? '')} className="border-b last:border-b-0">
                <td className="py-2 pr-3 font-medium">{String(row?.horizon ?? '—')}</td>
                <td className="py-2 pr-3">{formatPercent(row?.allMeanPct)}</td>
                <td className="py-2 pr-3 text-emerald-600">{formatPercent(row?.signalMeanPct)}</td>
                <td className="py-2 pr-3 text-amber-600">{formatPercent(row?.nonSignalMeanPct)}</td>
                <td className={`py-2 pr-3 ${row?.signalSpreadPct == null ? '' : row.signalSpreadPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatPercent(row?.signalSpreadPct)}</td>
                <td className={`py-2 pr-3 ${row?.liftPct == null ? '' : row.liftPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatPercent(row?.liftPct)}</td>
                <td className="py-2 pr-3">{formatPercent(row?.signalWinRatePct)}</td>
                <td className="py-2 pr-3">{formatFactor(row?.signalProfitFactor)}</td>
                <td className="py-2 pr-3">{formatPercent(row?.positiveRatePct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TargetPreviewBridgeCard({ bridge }: { bridge?: TargetPreviewBridge }) {
  if (!bridge) {
    return (
      <div className="space-y-3 rounded-xl border bg-background/60 p-3">
        <p className="text-sm font-medium">Prediction bridge</p>
        <p className="text-xs text-muted-foreground">
          Switch the preview mode to mock prediction to see simulated precision/recall and tradeability at realistic signal quality.
        </p>
      </div>
    );
  }

  const items = [
    { label: 'Requested precision', value: bridge.requestedPrecisionPct, format: 'pct' as const },
    { label: 'Requested recall', value: bridge.requestedRecallPct, format: 'pct' as const },
    { label: 'Actual precision', value: bridge.actualPrecisionPct, format: 'pct' as const },
    { label: 'Actual recall', value: bridge.actualRecallPct, format: 'pct' as const },
    { label: 'Signal rate', value: bridge.signalRatePct, format: 'pct' as const },
    { label: 'False positive rate', value: bridge.falsePositiveRatePct, format: 'pct' as const },
    { label: 'Predicted positives', value: bridge.predictedPositiveCount, format: 'count' as const },
    { label: 'True positives', value: bridge.truePositiveCount, format: 'count' as const },
    { label: 'False positives', value: bridge.falsePositiveCount, format: 'count' as const },
    { label: 'True negatives', value: bridge.trueNegativeCount, format: 'count' as const },
    { label: 'False negatives', value: bridge.falseNegativeCount, format: 'count' as const },
  ];

  return (
    <div className="space-y-3 rounded-xl border bg-background/60 p-3">
      <p className="text-sm font-medium">Prediction bridge</p>
      <p className="text-xs text-muted-foreground">Mock labels are simulated from the true target using the chosen precision/recall settings.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border bg-muted/20 px-3 py-2">
            <p className="text-[11px] uppercase text-muted-foreground">{item.label}</p>
            <p className="mt-1 font-medium">{item.format === 'pct' ? formatPercent(item.value) : String(item.value ?? '—')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildSmoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return '';
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const previous = points[index - 1] ?? current;
    const following = points[index + 2] ?? next;
    const controlOneX = current.x + (next.x - previous.x) / 6;
    const controlOneY = current.y + (next.y - previous.y) / 6;
    const controlTwoX = next.x - (following.x - current.x) / 6;
    const controlTwoY = next.y - (following.y - current.y) / 6;
    path += ` C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${next.x} ${next.y}`;
  }
  return path;
}

function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function TargetEntryAlignedForwardReturnCurve({ rows }: { rows: NonNullable<BTCUSDTTargetPreviewResponse['data']>['rows'] }) {
  const width = 840;
  const height = 220;
  const margin = { top: 24, right: 20, bottom: 30, left: 44 };
  const points = rows ?? [];

  const chart = useMemo(() => {
    if (!points.length) return null;
    const horizon = Math.max(2, Math.min(20, points.length - 1));
    const entryRows = points
      .map((row, index) => ({ row, index, close: Number(row.close), target: row.target }))
      .filter((item) => item.target === 1 && Number.isFinite(item.close));
    const signalRows = entryRows.length > 0 ? entryRows : points
      .map((row, index) => ({ row, index, close: Number(row.close), target: row.target }))
      .filter((item) => item.target !== null && item.target !== undefined && Number.isFinite(item.close));
    if (signalRows.length === 0) return null;

    const cumulativeReturnsByHorizon: number[][] = Array.from({ length: horizon }, () => []);
    for (const entry of signalRows) {
      for (let step = 1; step <= horizon; step += 1) {
        const future = points[entry.index + step];
        if (!future) break;
        const futureClose = Number(future.close);
        if (!Number.isFinite(futureClose) || entry.close === 0) continue;
        const cumulativeReturn = ((futureClose / entry.close) - 1) * 100;
        cumulativeReturnsByHorizon[step - 1].push(cumulativeReturn);
      }
    }

    const curve = cumulativeReturnsByHorizon
      .map((values, index) => ({
        step: index + 1,
        value: mean(values),
        count: values.length,
      }))
      .filter((point) => point.count > 0);

    if (curve.length === 0) return null;

    const xScale = (step: number) => margin.left + (curve.length <= 1 ? 0 : ((step - 1) / (curve.length - 1)) * (width - margin.left - margin.right));
    const minValue = Math.min(0, ...curve.map((point) => point.value));
    const maxValue = Math.max(0, ...curve.map((point) => point.value));
    const yScale = (value: number) => {
      const span = Math.max(0.0001, maxValue - minValue);
      const ratio = (value - minValue) / span;
      return height - margin.bottom - ratio * (height - margin.top - margin.bottom);
    };
    const path = buildSmoothPath(curve.map((point) => ({ x: xScale(point.step), y: yScale(point.value) })));
    return {
      curve,
      yScale,
      path,
      minValue,
      maxValue,
    };
  }, [points]);

  if (!points.length || !chart) {
    return <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">No target preview rows available.</div>;
  }

  const ticks = [0, ...chart.curve.map((point) => point.step).slice(0, 1), Math.max(...chart.curve.map((point) => point.step))];
  const uniqueTicks = Array.from(new Set(ticks)).filter((tick) => tick > 0);
  const yTicks = [chart.minValue, (chart.minValue + chart.maxValue) / 2, chart.maxValue];

  return (
    <div className="rounded-xl border bg-background/60 p-3">
      <div className="mb-2">
        <p className="text-sm font-medium">Entry-aligned forward return curve</p>
        <p className="text-xs text-muted-foreground">Averages the forward return after each entry signal over the next 20 bars or the available window, whichever is smaller. If there are no positive entries in the window, it falls back to all labeled bars so the curve remains visible.</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full overflow-visible">
        {yTicks.map((value) => (
          <line
            key={value}
            x1={margin.left}
            x2={width - margin.right}
            y1={chart.yScale(value)}
            y2={chart.yScale(value)}
            stroke="currentColor"
            opacity={value === 0 ? 0.25 : 0.08}
          />
        ))}
        <path d={chart.path} fill="none" stroke="#0ea5e9" strokeWidth="2.75" strokeLinejoin="round" strokeLinecap="round" />
        <text x={width / 2} y={height - 5} textAnchor="middle" fontSize="11" fill="currentColor" opacity={0.7}>Bars after entry</text>
        <text x={14} y={height / 2} textAnchor="middle" fontSize="11" fill="currentColor" opacity={0.7} transform={`rotate(-90 14 ${height / 2})`}>Mean cumulative return (%)</text>
        {uniqueTicks.map((tick, index) => (
          <text key={tick} x={margin.left + (uniqueTicks.length <= 1 ? 0 : (index / (uniqueTicks.length - 1)) * (width - margin.left - margin.right))} y={height - 8} textAnchor="middle" fontSize="10" fill="currentColor" opacity={0.6}>
            {tick}
          </text>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500" /> Mean cumulative return</span>
      </div>
    </div>
  );
}

export function ExperimentWizardView() {
  const router = useRouter();
  const [options, setOptions] = useState<Array<ExperimentBlueprintOption & BlueprintConfigDetail>>([]);
  const [targetMetadata, setTargetMetadata] = useState<Record<string, TargetMetadata>>({});
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [blueprintDetails, setBlueprintDetails] = useState<Record<string, BlueprintConfigDetail>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetInfoOpen, setTargetInfoOpen] = useState(false);
  const [targetPreviewParams, setTargetPreviewParams] = useState<Record<string, string>>({});
  const [targetPreviewFieldErrors, setTargetPreviewFieldErrors] = useState<Record<string, string>>({});
  const [targetPreview, setTargetPreview] = useState<BTCUSDTTargetPreviewResponse['data'] | null>(null);
  const [targetPreviewLoading, setTargetPreviewLoading] = useState(false);
  const [targetPreviewError, setTargetPreviewError] = useState<string | null>(null);
  const [targetPreviewControls, setTargetPreviewControls] = useState<TargetPreviewControls>({
    previewMode: 'true_label',
    entryAssumption: 'next_open',
    evaluationCostBps: '0',
    mockPrecision: '0.60',
    mockRecall: '0.35',
    mockSeed: '42',
  });
  const [errors, setErrors] = useState<WizardFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitQueueInfo, setSubmitQueueInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedExperimentId, setSubmittedExperimentId] = useState<string | number | null>(null);
  const hydratedOutputScalersForBlueprint = useRef<string | null>(null);
  const requestedPermutationTouched = useRef(false);
  const [systemPermutationCap, setSystemPermutationCap] = useState<number | null>(null);
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
    indicatorOutputScalers: {},
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

  const currentStep = STEP_META[currentStepIndex];
  const selectedBlueprint = options.find((option) => String(option.id) === draft.blueprintId);
  const selectedBlueprintDetail = draft.blueprintId ? (blueprintDetails[draft.blueprintId] ?? selectedBlueprint) : undefined;
  const architectureConstraints = useMemo(() => constraintRecord(selectedBlueprintDetail?.architecture), [selectedBlueprintDetail]);
  const selectedTargetMetadata = targetMetadata[draft.targetStrategy];
  const targetConstraints = useMemo(() => constraintRecord(selectedTargetMetadata as unknown as Record<string, unknown> | undefined), [selectedTargetMetadata]);
  const architectureOverrideEntries = useMemo(() => architectureParams(selectedBlueprintDetail?.architecture), [selectedBlueprintDetail]);
  const indicatorOverrideEntries = useMemo(() => indicatorParams(selectedBlueprintDetail?.indicators), [selectedBlueprintDetail]);
  const indicatorOutputScalerEntries = useMemo(() => indicatorScalerDefaults(selectedBlueprintDetail?.indicators), [selectedBlueprintDetail]);
  const targetPreviewDefaultParams = useMemo(
    () => buildTargetPreviewParams(selectedTargetMetadata, targetConstraints, draft.targetParams),
    [draft.targetParams, selectedTargetMetadata, targetConstraints],
  );
  const activeTargetPreviewParams = useMemo(
    () => ({ ...targetPreviewDefaultParams, ...targetPreviewParams }),
    [targetPreviewDefaultParams, targetPreviewParams],
  );
  const blueprintConfigLoading = Boolean(draft.blueprintId && !blueprintDetails[draft.blueprintId]);
  const effectiveArchitectureEntries = architectureOverrideEntries.map(([field, value]) => {
    const current = draft.architectureOverrides[field] ?? '';
    return [field, current.trim() !== '' ? current : String(value ?? '')] as const;
  });
  const effectiveIndicatorEntries = indicatorOverrideEntries.map(([indicator, fields]) => [
    indicator,
    fields.map(([field, value]) => {
      const current = draft.indicatorOverrides[indicator]?.[field] ?? '';
      return [field, current.trim() !== '' ? current : String(value ?? '')] as const;
    }),
  ] as const);
  const effectiveTargetEntries = Object.entries(draft.targetParams).map(([field, value]) => {
    const current = draft.targetOverrides[field] ?? '';
    return [field, current.trim() !== '' ? current : value] as const;
  });
  const maxPermutationCount = Math.max(
    1,
    multiplyPermutationEntries(effectiveArchitectureEntries as Array<[string, unknown]>) *
      countIndicatorPermutations(effectiveIndicatorEntries as Array<readonly [string, Array<[string, unknown]>]>) *
      multiplyPermutationEntries(effectiveTargetEntries as Array<[string, unknown]>),
  );
  const requestedPermutationLimit = Math.max(1, Math.min(maxPermutationCount, systemPermutationCap ?? 500));
  const targetOptions = useMemo(() => {
    const items = Object.entries(targetMetadata);
    if (items.length > 0) {
      return items
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, metadata]) => ({ name, label: targetLabel(String(metadata.name ?? name)) }));
    }
    return Object.keys(TARGET_PARAMETER_DEFAULTS).map((name) => ({ name, label: targetLabel(name) }));
  }, [targetMetadata]);
  const steps = STEP_META.map((step, index) => ({
    label: step.label,
    description: step.description,
    status: (index < currentStepIndex ? 'completed' : index === currentStepIndex ? 'current' : 'upcoming') as
      | 'completed'
      | 'current'
      | 'upcoming',
  }));

  async function loadTargetPreview(paramsOverride?: Record<string, string>) {
    const targetParams = paramsOverride ?? activeTargetPreviewParams;
    setTargetPreviewLoading(true);
    setTargetPreviewError(null);
    try {
      const response = await getBTCUSDTTargetPreview(buildTargetPreviewPayloadWithControls(draft, targetParams, targetPreviewControls));
      setTargetPreview(response.data ?? null);
    } catch (error) {
      setTargetPreview(null);
      const message =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error && error.message
            ? error.message
            : typeof error === 'string' && error.trim()
              ? error
              : 'Failed to load target preview.';
      setTargetPreviewError(message);
    } finally {
      setTargetPreviewLoading(false);
    }
  }

  function validateTargetPreviewParams(targetParams: Record<string, string>) {
    const nextErrors: Record<string, string> = {};
    for (const [param, value] of previewTargetParamEntries(selectedTargetMetadata, targetConstraints, targetParams)) {
      const constraint = previewTargetConstraint(param, targetConstraints[param]);
      const definition = toParamDefinition(param, value, constraint);
      const tokens = tokensFromValue(value);
      if (tokens.length === 0) {
        nextErrors[param] = 'Value is required.';
        continue;
      }
      const invalid = tokens.map((token) => validateParamToken(token, definition)).find(Boolean);
      if (invalid) nextErrors[param] = invalid;
    }
    setTargetPreviewFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  useEffect(() => {
    if (!targetInfoOpen) return;
    void loadTargetPreview(targetPreviewDefaultParams);
  }, [
    draft.candlestickAmount,
    draft.endDateTime,
    draft.interval,
    draft.startDateTime,
    draft.targetStrategy,
    targetPreviewDefaultParams,
    targetInfoOpen,
  ]);

  useEffect(() => {
    if (!targetInfoOpen) return;
    setTargetPreviewParams({});
    setTargetPreviewFieldErrors({});
  }, [draft.targetStrategy, targetInfoOpen]);

  function handleApplyTargetPreview() {
    if (!validateTargetPreviewParams(activeTargetPreviewParams)) return;
    void loadTargetPreview(activeTargetPreviewParams);
  }

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
    getSystemSettings()
      .then((response) => {
        if (!active) return;
        const cap = response.data?.settings?.max_requested_permutations;
        setSystemPermutationCap(typeof cap === 'number' && Number.isFinite(cap) ? cap : 500);
      })
      .catch(() => {
        if (active) setSystemPermutationCap(500);
      });
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

  useEffect(() => {
    if (!draft.blueprintId || architectureOverrideEntries.length === 0) return;
    setDraft((prev) => {
      const next = Object.fromEntries(architectureOverrideEntries.map(([field, value]) => [
        field,
        (() => {
          const current = prev.architectureOverrides[field] ?? '';
          return current.trim() !== '' ? current : String(value ?? '');
        })(),
      ]));
      return JSON.stringify(prev.architectureOverrides) === JSON.stringify(next)
        ? prev
        : { ...prev, architectureOverrides: next };
    });
  }, [architectureOverrideEntries, draft.blueprintId]);

  useEffect(() => {
    if (!draft.blueprintId || indicatorOverrideEntries.length === 0) return;
    setDraft((prev) => {
      const next = Object.fromEntries(indicatorOverrideEntries.map(([indicator, fields]) => [
        indicator,
        Object.fromEntries(fields.map(([field, value]) => [
          field,
          (() => {
            const current = prev.indicatorOverrides[indicator]?.[field] ?? '';
            return current.trim() !== '' ? current : String(value ?? '');
          })(),
        ])),
      ]));
      return JSON.stringify(prev.indicatorOverrides) === JSON.stringify(next)
        ? prev
        : { ...prev, indicatorOverrides: next };
    });
  }, [draft.blueprintId, indicatorOverrideEntries]);

  useEffect(() => {
    const defaultsSource = (selectedTargetMetadata?.defaultValues ?? selectedTargetMetadata?.default_values ?? TARGET_PARAMETER_DEFAULTS[draft.targetStrategy] ?? {}) as Record<string, unknown>;
    const defaults = Object.fromEntries(Object.entries(defaultsSource).map(([key, value]) => [key, String(value ?? '')]));
    if (Object.keys(defaults).length === 0) return;
    setDraft((prev) => {
      const next = Object.fromEntries(Object.entries(defaults).map(([key, value]) => {
        const current = prev.targetOverrides[key] ?? '';
        return [key, current.trim() !== '' ? current : value];
      }));
      return JSON.stringify(prev.targetOverrides) === JSON.stringify(next)
        ? prev
        : { ...prev, targetOverrides: next };
    });
  }, [draft.targetStrategy, selectedTargetMetadata]);

  useEffect(() => {
    if (requestedPermutationTouched.current) return;
    setDraft((prev) => (prev.requestedPermutationCount.trim() === '' ? { ...prev, requestedPermutationCount: String(maxPermutationCount) } : prev));
  }, [maxPermutationCount]);

  useEffect(() => {
    if (!requestedPermutationTouched.current) return;
    const nextError = validateRequestedPermutationCount(draft.requestedPermutationCount);
    setErrors((prev) => (prev.requestedPermutationCount === nextError ? prev : { ...prev, requestedPermutationCount: nextError }));
  }, [draft.requestedPermutationCount, requestedPermutationLimit]);

  useEffect(() => {
    if (!draft.blueprintId || !selectedBlueprintDetail?.indicators) return;
    if (hydratedOutputScalersForBlueprint.current === draft.blueprintId) return;
    const defaults = Object.fromEntries(indicatorOutputScalerEntries.map(([indicator, entries]) => [indicator, Object.fromEntries(entries.map(([output, scaler]) => [output, scaler]))]));
    if (Object.keys(defaults).length === 0) return;
    setDraft((prev) => ({
      ...prev,
      indicatorOutputScalers: {
        ...defaults,
        ...prev.indicatorOutputScalers,
      },
    }));
    hydratedOutputScalersForBlueprint.current = draft.blueprintId;
  }, [draft.blueprintId, indicatorOutputScalerEntries, selectedBlueprintDetail?.indicators]);
  const atFirstStep = currentStepIndex === 0;
  const atLastStep = currentStepIndex === STEP_META.length - 1;

  function closeTargetInfo() {
    setTargetInfoOpen(false);
    setTargetPreviewParams({});
    setTargetPreviewFieldErrors({});
    setTargetPreview(null);
    setTargetPreviewError(null);
    setTargetPreviewLoading(false);
    setTargetPreviewControls({
      previewMode: 'true_label',
      entryAssumption: 'next_open',
      evaluationCostBps: '0',
      mockPrecision: '0.60',
      mockRecall: '0.35',
      mockSeed: '42',
    });
  }

  const splitTrain = Number(draft.trainSplit);
  const splitVal = Number(draft.valSplit);
  const splitTest = Number(draft.testSplit);
  const splitTotal = splitTrain + splitVal + splitTest;
  const splitTotalValid = Number.isFinite(splitTotal) && Math.abs(splitTotal - 100) < 0.001;
  const requestedPermutationError = requestedPermutationTouched.current ? validateRequestedPermutationCount(draft.requestedPermutationCount) : undefined;

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

  function validateRequestedPermutationCount(value: string) {
    if (value.trim() === '') return 'Requested permutations are required.';
    const requested = Number(value);
    if (!Number.isFinite(requested) || requested < 1) return 'Requested permutations must be at least 1.';
    if (requested > requestedPermutationLimit) return `Requested permutations cannot exceed ${requestedPermutationLimit}.`;
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

    if (currentStep.id === 'deterministic-seed') {
      const requestedError = validateRequestedPermutationCount(draft.requestedPermutationCount);
      if (requestedError) {
        setErrors((prev) => ({ ...prev, requestedPermutationCount: requestedError }));
        return;
      }
      setErrors((prev) => ({ ...prev, requestedPermutationCount: undefined }));
    }

    setCurrentStepIndex((prev) => Math.min(prev + 1, STEP_META.length - 1));
  }

  function handleBack() {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }

  async function handleSubmitExperiment() {
    const requestedError = validateRequestedPermutationCount(draft.requestedPermutationCount);
    if (requestedError) {
      setSubmitError(null);
      setErrors((prev) => ({ ...prev, requestedPermutationCount: requestedError }));
      return;
    }
    setSubmitError(null);
    setSubmitQueueInfo(null);
    setSubmitting(true);
    try {
      const parsedOverrides = {
        architecture: compactParsedValues(draft.architectureOverrides),
        indicators: Object.fromEntries(Object.entries(draft.indicatorOverrides).map(([name, values]) => [name, compactParsedValues(values)]).filter(([, values]) => Object.keys(values).length > 0)),
        target: compactParsedValues(draft.targetOverrides),
        target_params: compactParsedValues(draft.targetParams),
        indicator_output_scalers: draft.indicatorOutputScalers,
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
        requested_permutation_count: Math.max(1, Number(draft.requestedPermutationCount || maxPermutationCount)),
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
            <div className="flex items-end gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="target-strategy">Target Strategy</Label>
                <select
                  id="target-strategy"
                  aria-label="Target Strategy"
                  value={draft.targetStrategy}
                  onChange={(event) => {
                    const targetStrategy = event.target.value;
                    const metadata = targetMetadata[targetStrategy];
                    const defaultsSource = (metadata?.defaultValues ?? metadata?.default_values ?? TARGET_PARAMETER_DEFAULTS[targetStrategy] ?? {}) as Record<string, unknown>;
                    const defaults = Object.fromEntries(Object.entries(defaultsSource).map(([key, item]) => [key, String(item ?? '')]));
                    setDraft((prev) => ({
                      ...prev,
                      targetStrategy,
                      targetParams: { ...defaults },
                      targetOverrides: { ...defaults },
                    }));
                    setTargetPreviewParams({});
                  }}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {targetOptions.map((option) => (
                    <option key={option.name} value={option.name}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {selectedTargetMetadata?.binaryLabelRule || selectedTargetMetadata?.binary_label_rule ? (
                  <p className="text-xs text-muted-foreground">{selectedTargetMetadata.binaryLabelRule ?? selectedTargetMetadata.binary_label_rule}</p>
                ) : null}
              </div>
              <Button type="button" variant="outline" size="xs" onClick={() => setTargetInfoOpen(true)}>
                <Info className="mr-2 h-3.5 w-3.5" />
                Target info
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(draft.targetParams).map(([param, value]) => (
                <div key={param} className="space-y-1">
                  <Label className="text-xs">{param}</Label>
                  {targetParameterHelpText(param) ? <p className="text-[11px] text-muted-foreground">{targetParameterHelpText(param)}</p> : describeConstraint(toParamDefinition(param, value, targetConstraints[param])) ? <p className="text-[11px] text-muted-foreground">{describeConstraint(toParamDefinition(param, value, targetConstraints[param]))}</p> : null}
                  <Input
                    aria-label={`${param} value`}
                    type={targetParameterInputType(targetConstraints[param])}
                    step={targetParameterStep(targetConstraints[param])}
                    min={targetConstraints[param]?.min}
                    max={targetConstraints[param]?.max}
                    value={value}
                    placeholder={String(targetConstraints[param]?.default ?? '')}
                    onChange={(event) => setDraft((prev) => ({
                      ...prev,
                      targetParams: { ...prev.targetParams, [param]: event.target.value },
                      targetOverrides: { ...prev.targetOverrides, [param]: event.target.value },
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
                  <div className="mb-2 flex flex-wrap gap-1">
                    {(indicatorOutputScalerEntries.find(([name]) => name === indicator)?.[1] ?? []).map(([output]) => <span key={output} className="rounded border bg-background px-2 py-0.5 text-[11px]">{output}</span>)}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {fields.map(([field, value]) => (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs">{field}</Label>
                        {describeConstraint(toParamDefinition(field, value, constraintRecord(indicatorDefinition(selectedBlueprintDetail?.indicators, indicator) as Record<string, unknown> | undefined)[field])) ? <p className="text-[11px] text-muted-foreground">{describeConstraint(toParamDefinition(field, value, constraintRecord(indicatorDefinition(selectedBlueprintDetail?.indicators, indicator) as Record<string, unknown> | undefined)[field]))}</p> : null}
                        <TokenizedParameterInput value={draft.indicatorOverrides[indicator]?.[field] ?? ''} onChange={(nextValue) => setDraft((prev) => ({ ...prev, indicatorOverrides: { ...prev.indicatorOverrides, [indicator]: { ...(prev.indicatorOverrides[indicator] ?? {}), [field]: nextValue } } }))} param={toParamDefinition(field, value, constraintRecord(indicatorDefinition(selectedBlueprintDetail?.indicators, indicator) as Record<string, unknown> | undefined)[field])} error={errors.parameterOverrides} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Scaling method</p>
                      <p className="text-[11px] text-muted-foreground">Choose how each generated output column should be scaled.</p>
                    </div>
                    {(indicatorOutputScalerEntries.find(([name]) => name === indicator)?.[1] ?? []).map(([output, scaler]) => (
                      <div key={output} className="space-y-1">
                        <Label className="text-xs">{output}</Label>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={draft.indicatorOutputScalers[indicator]?.[output] ?? scaler}
                          onChange={(event) => setDraft((prev) => ({
                            ...prev,
                            indicatorOutputScalers: {
                              ...prev.indicatorOutputScalers,
                              [indicator]: { ...(prev.indicatorOutputScalers[indicator] ?? {}), [output]: event.target.value as ScalerStrategy },
                            },
                          }))}
                        >
                          <option value="none">none</option>
                          <option value="normalization">normalization</option>
                          <option value="standardization">standardization</option>
                          <option value="log_transform">log_transform</option>
                        </select>
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
            <Card><CardHeader><CardTitle className="text-base">Permutation Sampling</CardTitle><CardDescription>Search space max: {maxPermutationCount}. Admin cap: {systemPermutationCap ?? 500}. The requested count must stay under both.</CardDescription></CardHeader><CardContent className="space-y-2"><Label htmlFor="requested-permutations">Desired permutations to run</Label><Input id="requested-permutations" type="number" min={1} max={requestedPermutationLimit} value={draft.requestedPermutationCount} onChange={(event) => { requestedPermutationTouched.current = true; const nextValue = event.target.value; setDraft((prev) => ({ ...prev, requestedPermutationCount: nextValue })); }} aria-invalid={Boolean(requestedPermutationError)} /><p className="text-xs text-muted-foreground">Hard limit: {requestedPermutationLimit}.</p>{requestedPermutationError ? <p className="text-xs text-destructive">{requestedPermutationError}</p> : null}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Seed</CardTitle><CardDescription>This system is designed for deterministic execution. Set the seed used for repeatable permutation sampling.</CardDescription></CardHeader><CardContent className="space-y-2"><Label htmlFor="seed">Seed</Label><Input id="seed" value={draft.seed || '42'} onChange={(event) => setDraft((prev) => ({ ...prev, seed: event.target.value }))} /></CardContent></Card>
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
                    <div className="rounded-lg bg-muted/30 p-3"><p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Indicators</p>{indicatorOverrideEntries.length === 0 ? <p className="text-muted-foreground">No indicator override parameters.</p> : <div className="space-y-2">{indicatorOverrideEntries.map(([indicator, fields]) => <div key={indicator}><p className="font-mono text-xs">{indicator}</p><div className="mt-1 flex flex-wrap gap-2">{fields.map(([field, value]) => <span key={field} className="rounded border bg-background px-2 py-1 text-xs"><strong>{field}</strong>: {draft.indicatorOverrides[indicator]?.[field] || String(value ?? '')}</span>)}</div><div className="mt-2 flex flex-wrap gap-2">{Object.entries(draft.indicatorOutputScalers[indicator] ?? {}).map(([output, scaler]) => <span key={output} className="rounded border bg-background px-2 py-1 text-xs"><strong>{output}</strong>: {scaler}</span>)}</div></div>)}</div>}</div>
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
    <>
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

      {targetInfoOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Target information"
          onClick={closeTargetInfo}
        >
          <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-2xl bg-background p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedTargetMetadata?.name ?? draft.targetStrategy}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedTargetMetadata?.binaryLabelRule ?? selectedTargetMetadata?.binary_label_rule ?? targetPreview?.strategy?.binaryLabelRule ?? 'Target preview from backend.'}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={closeTargetInfo}>
                <X className="mr-2 h-4 w-4" />
                Close
              </Button>
            </div>

            {targetPreviewLoading ? (
              <div className="rounded-xl border bg-muted/20 p-6 text-sm text-muted-foreground">Loading target preview...</div>
            ) : targetPreviewError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{targetPreviewError}</div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Target Summary</CardTitle>
                        <CardDescription>
                          Applies the selected target directly to the current candle range. The backend recomputes labels for the selected interval and dataset range, and the controls on the right only affect this modal.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                          <p className="text-[11px] uppercase text-muted-foreground">Strategy</p>
                          <p className="font-medium">{targetPreview?.strategy?.name ?? draft.targetStrategy}</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                          <p className="text-[11px] uppercase text-muted-foreground">Interval</p>
                          <p className="font-medium">{targetPreview?.interval ?? draft.interval}</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                          <p className="text-[11px] uppercase text-muted-foreground">Preview target params</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">Edit the target parameters below, then click Apply preview to recompute the rows, metrics, and curve. This does not change the experiment submission.</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                          <p className="text-[11px] uppercase text-muted-foreground">Range</p>
                          <p className="font-medium">{String(targetPreview?.range?.start ?? '—')} to {String(targetPreview?.range?.end ?? '—')}</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                          <p className="text-[11px] uppercase text-muted-foreground">Candles</p>
                          <p className="font-medium">{String(targetPreview?.range?.candles ?? 0)}</p>
                        </div>
                        {targetPreview?.range?.previewTruncated ? (
                          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 sm:col-span-2">
                            <p className="text-[11px] uppercase text-amber-700">Preview capped</p>
                            <p className="font-medium text-amber-900">
                              Showing the latest {String(targetPreview.range.previewRowLimit ?? 0)} raw 1m candles to keep the modal responsive.
                            </p>
                          </div>
                        ) : null}
                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                          <p className="text-[11px] uppercase text-muted-foreground">Preview mode</p>
                          <p className="font-medium">{targetPreview?.mode?.previewMode ?? targetPreviewControls.previewMode}</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                          <p className="text-[11px] uppercase text-muted-foreground">Entry assumption</p>
                          <p className="font-medium">{targetPreview?.mode?.entryAssumption ?? targetPreviewControls.entryAssumption}</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                          <p className="text-[11px] uppercase text-muted-foreground">Evaluation cost</p>
                          <p className="font-medium">{formatPercent((targetPreview?.mode?.evaluationCostBps ?? Number(targetPreviewControls.evaluationCostBps || 0)) / 100)}</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                          <p className="text-[11px] uppercase text-muted-foreground">Lookahead</p>
                          <p className="font-medium">{String(targetPreview?.summary?.lookaheadPeriod ?? '—')} bars</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                          <p className="text-[11px] uppercase text-muted-foreground">Warmup nulls</p>
                          <p className="font-medium">{String(targetPreview?.summary?.warmupNullCount ?? 0)}</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                          <p className="text-[11px] uppercase text-muted-foreground">Tail nulls</p>
                          <p className="font-medium">{String(targetPreview?.summary?.tailNullCount ?? 0)}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <BTCUSDTPriceChart
                      data={(targetPreview?.rows ?? []).map((row) => ({
                        time: row.time,
                        timestamp: row.timestamp,
                        open: row.open,
                        high: row.high,
                        low: row.low,
                        close: row.close,
                        volume: row.volume,
                      }))}
                      height={240}
                    />
                    <TargetPreviewCountBars summary={targetPreview?.summary} />
                    <TargetEntryAlignedForwardReturnCurve rows={targetPreview?.rows ?? []} />
                  </div>
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Preview Controls</CardTitle>
                        <CardDescription>Switch between the true label view and the mock prediction bridge used to estimate the minimum usable model quality.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Preview mode</Label>
                            <select
                              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              value={targetPreviewControls.previewMode}
                              onChange={(event) => setTargetPreviewControls((prev) => ({ ...prev, previewMode: event.target.value as TargetPreviewMode }))}
                            >
                              <option value="true_label">True label</option>
                              <option value="mock_prediction">Mock prediction</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Entry assumption</Label>
                            <select
                              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              value={targetPreviewControls.entryAssumption}
                              onChange={(event) => setTargetPreviewControls((prev) => ({ ...prev, entryAssumption: event.target.value as 'next_open' | 'current_close' }))}
                            >
                              <option value="next_open">Next open</option>
                              <option value="current_close">Current close</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Evaluation cost bps</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={targetPreviewControls.evaluationCostBps}
                              onChange={(event) => setTargetPreviewControls((prev) => ({ ...prev, evaluationCostBps: event.target.value }))}
                            />
                          </div>
                          {targetPreviewControls.previewMode === 'mock_prediction' ? (
                            <>
                              <div className="space-y-1">
                                <Label className="text-xs">Mock precision</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="1"
                                  step="0.01"
                                  value={targetPreviewControls.mockPrecision}
                                  onChange={(event) => setTargetPreviewControls((prev) => ({ ...prev, mockPrecision: event.target.value }))}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Mock recall</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="1"
                                  step="0.01"
                                  value={targetPreviewControls.mockRecall}
                                  onChange={(event) => setTargetPreviewControls((prev) => ({ ...prev, mockRecall: event.target.value }))}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Mock seed</Label>
                                <Input
                                  type="number"
                                  step="1"
                                  value={targetPreviewControls.mockSeed}
                                  onChange={(event) => setTargetPreviewControls((prev) => ({ ...prev, mockSeed: event.target.value }))}
                                />
                              </div>
                            </>
                          ) : null}
                        </div>
                        <div className="flex justify-end">
                          <Button type="button" variant="secondary" onClick={handleApplyTargetPreview}>
                            Apply preview
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Target Parameters</CardTitle>
                        <CardDescription>These controls are preview-only and use the backend metadata for the selected target. Each field shows its constraint text and default.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {previewTargetParamEntries(selectedTargetMetadata, targetConstraints, activeTargetPreviewParams).map(([param, value]) => (
                            <div key={param} className="space-y-1">
                              <Label className="text-xs">{param}</Label>
                              <p className="text-[11px] text-muted-foreground">{targetParameterConstraintText(toParamDefinition(param, value, previewTargetConstraint(param, targetConstraints[param])))}</p>
                              {targetParameterHelpText(param) ? <p className="text-[11px] text-muted-foreground/80">{targetParameterHelpText(param)}</p> : null}
                              <Input
                                aria-label={`${param} value`}
                                type={targetParameterInputType(previewTargetConstraint(param, targetConstraints[param]))}
                                step={targetParameterStep(previewTargetConstraint(param, targetConstraints[param]))}
                                min={previewTargetConstraint(param, targetConstraints[param])?.min}
                                max={previewTargetConstraint(param, targetConstraints[param])?.max}
                                value={value}
                                placeholder={String(previewTargetConstraint(param, targetConstraints[param])?.default ?? '')}
                                onChange={(event) => {
                                  setTargetPreviewParams((prev) => ({ ...prev, [param]: event.target.value }));
                                  setTargetPreviewFieldErrors((prev) => {
                                    if (!prev[param]) return prev;
                                    const next = { ...prev };
                                    delete next[param];
                                    return next;
                                  });
                                }}
                              />
                              {targetPreviewFieldErrors[param] ? <p className="text-[11px] text-destructive">{targetPreviewFieldErrors[param]}</p> : null}
                            </div>
                          ))}
                        </div>
                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                          <p className="text-[11px] uppercase text-muted-foreground">How to read</p>
                          <p className="font-medium">The backend only refreshes after you click Apply preview. Use the controls above to inspect how the label balance, economics table, and entry-aligned return curve change for this dataset.</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Diagnostics</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-2 sm:grid-cols-2">
                        {[
                          { label: 'Rows', value: targetPreview?.summary?.rowCount, help: 'Total number of candles included in the preview.' },
                          { label: 'Labeled', value: targetPreview?.summary?.labeledCount, help: 'Candles that received a target value of 0 or 1.' },
                          { label: 'Unlabeled', value: targetPreview?.summary?.unlabeledCount, help: 'Candles left without a target because lookahead ran out or the strategy could not label them.' },
                          { label: 'Positive rate', value: formatPercent(targetPreview?.summary?.positiveRatePct), help: 'Share of labeled candles where the target is 1.' },
                          { label: 'Actual up rate', value: formatPercent(targetPreview?.summary?.actualPositiveRatePct), help: 'Share of candles whose close finished above open.' },
                          { label: 'Actual up count', value: targetPreview?.summary?.actualPositiveCount, help: 'Number of candles that closed higher than they opened.' },
                          { label: 'Actual non-up count', value: targetPreview?.summary?.actualNegativeCount, help: 'Number of candles that did not close higher than they opened.' },
                          { label: 'Direction +1', value: targetPreview?.summary?.directionUpCount, help: 'Candles with positive direction in the preview range.' },
                          { label: 'Direction 0', value: targetPreview?.summary?.directionFlatCount, help: 'Candles that closed exactly where they opened.' },
                          { label: 'Direction -1', value: targetPreview?.summary?.directionDownCount, help: 'Candles with negative direction in the preview range.' },
                          { label: 'Tail nulls', value: targetPreview?.summary?.tailNullCount, help: 'Trailing candles that could not be labeled because future bars were unavailable.' },
                          { label: 'Warmup nulls', value: targetPreview?.summary?.warmupNullCount, help: 'Leading candles that were dropped or left unlabeled because the strategy needed warmup history.' },
                          { label: 'Accuracy', value: formatPercent(targetPreview?.summary?.confusion?.accuracy_pct), help: 'Percent of baseline direction decisions that matched the target label.' },
                          { label: 'Precision', value: formatPercent(targetPreview?.summary?.confusion?.precision_pct), help: 'Of the target-positive candles, how many were actually up.' },
                          { label: 'Recall', value: formatPercent(targetPreview?.summary?.confusion?.recall_pct), help: 'Of the actual up candles, how many were caught by the target.' },
                          { label: 'F1', value: formatPercent(targetPreview?.summary?.confusion?.f1_score_pct), help: 'Balanced score combining precision and recall.' },
                        ].map((item) => (
                          <div key={item.label} className="rounded-lg border bg-muted/20 px-3 py-2">
                            <div className="flex items-center gap-1">
                              <p className="text-[11px] uppercase text-muted-foreground">{item.label}</p>
                              <HelpDot label={`${item.label} help`} description={item.help} />
                            </div>
                            <p className="mt-1 font-medium">{String(item.value ?? '—')}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    <TargetPreviewEconomicTable economics={targetPreview?.economics} mode={targetPreview?.mode?.previewMode} />
                    <TargetPreviewBridgeCard bridge={targetPreview?.bridge} />
                    <TargetPreviewConfusionGrid summary={targetPreview?.summary} />
                  </div>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Target rule notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>{selectedTargetMetadata?.binaryLabelRule ?? selectedTargetMetadata?.binary_label_rule ?? 'No rule text available.'}</p>
                    <p>The backend preview uses the same target factory as experiment execution, so the displayed rows match how the target is applied during runs.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
