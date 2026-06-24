"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as d3 from 'd3';
import { BaseView } from './BaseView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/states/EmptyState';
import { LoadingState } from '@/components/states/LoadingState';
import { favoriteModel, getModelDetail, type ModelItem, unfavoriteModel } from '@/lib/api/client';

function fmt(value: unknown): string {
  if (typeof value === 'number') return value.toFixed(3);
  return String(value ?? '—');
}

function n(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: unknown): string {
  const parsed = n(value);
  if (parsed === null) return '—';
  return parsed.toFixed(Math.abs(parsed) >= 100 ? 1 : 3);
}

function formatPct(value: unknown): string {
  const parsed = n(value);
  if (parsed === null) return '—';
  return `${parsed.toFixed(Math.abs(parsed) >= 100 ? 1 : 3)}%`;
}

function firstValue(sources: Array<Record<string, unknown> | undefined>, keys: string[]) {
  for (const source of sources) {
    for (const key of keys) {
      if (source && source[key] !== undefined && source[key] !== null) return source[key];
    }
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function title(label: string): string {
  return label.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function ValueView({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return value.length ? <div className="mt-1 space-y-2">{value.map((item, index) => <div className="rounded border bg-background p-2" key={index}><ValueView value={item} /></div>)}</div> : <span>—</span>;
  }
  if (isRecord(value)) {
    const entries = Object.entries(value);
    return entries.length ? <div className="mt-2 grid gap-2">{entries.map(([key, item]) => <div key={key}><p className="text-xs uppercase text-muted-foreground">{title(key)}</p><div className="break-words font-medium"><ValueView value={item} /></div></div>)}</div> : <span>—</span>;
  }
  return <span>{fmt(value)}</span>;
}

function KeyValues({ rows }: { rows: Array<[string, unknown]> }) {
  return <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">{rows.map(([label, value]) => <div className="rounded-md border bg-muted/20 p-3" key={label}><p className="text-xs uppercase text-muted-foreground">{title(label)}</p><div className="mt-1 break-words font-medium"><ValueView value={value} /></div></div>)}</div>;
}

function latestLog(logs: Array<Record<string, unknown>>, keys: string[]) {
  return [...logs].reverse().find((log) => keys.some((key) => key in log));
}

const BACKTEST_ROWS: Array<[string, string]> = [
  ['Total return', 'total_return_net_pct'],
  ['Win rate', 'trade_win_rate_pct'],
  ['Drawdown', 'max_drawdown_pct'],
  ['Expectancy', 'trade_expectancy_pct'],
  ['Trades', 'trades_count'],
  ['Mean winning trade', 'trade_return_mean_win_pct'],
  ['Mean losing trade', 'trade_return_mean_loss_pct'],
  ['Bars in market', 'bars_in_market_pct'],
  ['Sharpe per bar', 'sharpe_per_bar'],
  ['Sharpe annualized', 'sharpe_annualized'],
];

const CLASSIFICATION_ROWS: Array<[string, string]> = [
  ['Accuracy', 'accuracy_pct'],
  ['Precision', 'precision_pct'],
  ['Recall', 'recall_pct'],
  ['F1', 'f1_score_pct'],
  ['Predicted positive rate', 'pred_pos_rate_pct'],
  ['Actual positive rate', 'actual_pos_rate_pct'],
  ['False positive rate', 'false_positive_rate'],
  ['TP', 'tp_count'],
  ['FP', 'fp_count'],
  ['TN', 'tn_count'],
  ['FN', 'fn_count'],
];

function LogSummary({ logs }: { logs?: Array<Record<string, unknown>> }) {
  if (!logs?.length) return <p className="text-sm text-muted-foreground">No model logs available.</p>;

  const backtest = latestLog(logs, BACKTEST_ROWS.map(([, key]) => key));
  const classification = latestLog(logs, CLASSIFICATION_ROWS.map(([, key]) => key));
  const shown = new Set([...BACKTEST_ROWS, ...CLASSIFICATION_ROWS].map(([, key]) => key).concat('type'));
  const other = Object.entries(Object.assign({}, ...logs)).filter(([key]) => !shown.has(key));

  return (
    <div className="space-y-4">
      {backtest ? <section><h3 className="mb-2 text-sm font-medium">Backtest Metrics</h3><KeyValues rows={BACKTEST_ROWS.filter(([, key]) => key in backtest).map(([label, key]) => [label, backtest[key]])} /></section> : null}
      {classification ? <section><h3 className="mb-2 text-sm font-medium">Classification Metrics</h3><KeyValues rows={CLASSIFICATION_ROWS.filter(([, key]) => key in classification).map(([label, key]) => [label, classification[key]])} /></section> : null}
      {other.length ? <section><h3 className="mb-2 text-sm font-medium">Other Metrics</h3><KeyValues rows={other} /></section> : null}
    </div>
  );
}

function D3PercentBars({ rows }: { rows: Array<{ label: string; value: unknown }> }) {
  const width = 460;
  const height = Math.max(160, rows.length * 34 + 28);
  const margin = { top: 12, right: 58, bottom: 24, left: 142 };
  const x = d3.scaleLinear().domain([0, 100]).range([margin.left, width - margin.right]);
  return <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full overflow-visible" role="img" aria-label="Classification percentage bar chart">
    {[0, 25, 50, 75, 100].map((tick) => <g key={tick}><line x1={x(tick)} x2={x(tick)} y1={margin.top} y2={height - margin.bottom} stroke="currentColor" opacity={0.12} /><text x={x(tick)} y={height - 6} textAnchor="middle" fontSize="10" fill="currentColor" opacity={0.65}>{tick}%</text></g>)}
    {rows.map((row, index) => {
      const value = n(row.value);
      const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
      const y = margin.top + index * 34 + 6;
      return <g key={row.label}>
        <text x={margin.left - 8} y={y + 14} textAnchor="end" fontSize="12" fill="currentColor">{row.label}</text>
        <rect x={margin.left} y={y} width={x(100) - margin.left} height="18" rx="4" fill="currentColor" opacity={0.1} />
        <rect x={margin.left} y={y} width={x(pct) - margin.left} height="18" rx="4" fill={pct >= 60 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'} />
        <text x={Math.min(width - 8, x(pct) + 8)} y={y + 14} fontSize="12" fill="currentColor">{formatPct(value)}</text>
      </g>;
    })}
  </svg>;
}

function D3ConfusionHeatmap({ stats }: { stats: Record<string, unknown> }) {
  const cells = [
    { label: 'TN', actual: 'Actual Negative', predicted: 'Predicted Negative', value: n(stats.tn) },
    { label: 'FP', actual: 'Actual Negative', predicted: 'Predicted Positive', value: n(stats.fp) },
    { label: 'FN', actual: 'Actual Positive', predicted: 'Predicted Negative', value: n(stats.fn) },
    { label: 'TP', actual: 'Actual Positive', predicted: 'Predicted Positive', value: n(stats.tp) },
  ];
  const width = 420;
  const height = 280;
  const cell = 118;
  const startX = 150;
  const startY = 54;
  const maxValue = d3.max(cells, (item) => item.value ?? 0) || 1;
  const opacity = d3.scaleLinear().domain([0, maxValue]).range([0.18, 1]);
  return <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full overflow-visible" role="img" aria-label="Confusion matrix heatmap">
    <text x={startX + cell / 2} y="24" textAnchor="middle" fontSize="12" fill="currentColor">Predicted Negative</text>
    <text x={startX + cell * 1.5} y="24" textAnchor="middle" fontSize="12" fill="currentColor">Predicted Positive</text>
    <text x="18" y={startY + cell / 2} textAnchor="middle" fontSize="12" fill="currentColor" transform={`rotate(-90 18 ${startY + cell / 2})`}>Actual Negative</text>
    <text x="18" y={startY + cell * 1.5} textAnchor="middle" fontSize="12" fill="currentColor" transform={`rotate(-90 18 ${startY + cell * 1.5})`}>Actual Positive</text>
    {cells.map((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + col * cell;
      const y = startY + row * cell;
      const fill = item.value === null ? '#e5e7eb' : `rgba(37, 99, 235, ${opacity(item.value)})`;
      const textColor = (item.value ?? 0) > maxValue * 0.55 ? '#fff' : '#111827';
      return <g key={item.label}>
        <rect x={x} y={y} width={cell - 8} height={cell - 8} rx="6" fill={fill} stroke="currentColor" opacity={0.95} />
        <text x={x + cell / 2 - 4} y={y + 44} textAnchor="middle" fontSize="18" fontWeight="700" fill={textColor}>{item.label} {String(item.value ?? '—')}</text>
        <text x={x + cell / 2 - 4} y={y + 68} textAnchor="middle" fontSize="11" fill={textColor} opacity={0.8}>{item.actual}</text>
        <text x={x + cell / 2 - 4} y={y + 84} textAnchor="middle" fontSize="11" fill={textColor} opacity={0.8}>{item.predicted}</text>
      </g>;
    })}
  </svg>;
}

function D3TradeOutcomeChart({ rows }: { rows: Array<{ label: string; value: unknown }> }) {
  const values = rows.map((row) => n(row.value)).filter((value): value is number => value !== null);
  const width = 460;
  const height = 160;
  const margin = { top: 14, right: 54, bottom: 26, left: 142 };
  const extent = d3.extent(values.length ? values : [0]) as [number, number];
  const maxAbs = Math.max(Math.abs(extent[0]), Math.abs(extent[1]), 0.01);
  const x = d3.scaleLinear().domain([-maxAbs, maxAbs]).range([margin.left, width - margin.right]);
  return <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full overflow-visible" role="img" aria-label="Trade outcome bar chart">
    <line x1={x(0)} x2={x(0)} y1={margin.top} y2={height - margin.bottom} stroke="currentColor" opacity={0.35} />
    {rows.map((row, index) => {
      const value = n(row.value) ?? 0;
      const y = margin.top + index * 36 + 5;
      const x0 = x(Math.min(0, value));
      const x1 = x(Math.max(0, value));
      return <g key={row.label}>
        <text x={margin.left - 8} y={y + 14} textAnchor="end" fontSize="12" fill="currentColor">{row.label}</text>
        <rect x={x0} y={y} width={Math.max(2, x1 - x0)} height="18" rx="4" fill={value >= 0 ? '#10b981' : '#ef4444'} />
        <text x={value >= 0 ? x1 + 8 : x0 - 8} y={y + 14} textAnchor={value >= 0 ? 'start' : 'end'} fontSize="12" fill="currentColor">{formatPct(row.value)}</text>
      </g>;
    })}
    <text x={x(0)} y={height - 6} textAnchor="middle" fontSize="10" fill="currentColor" opacity={0.65}>0%</text>
  </svg>;
}

function compactValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.map(compactValue).join(', ');
  if (isRecord(value)) return Object.entries(value).map(([key, item]) => `${title(key)} ${compactValue(item)}`).join(' · ');
  return String(value);
}

function indicatorEntries(parameters: Record<string, unknown>) {
  const indicators = parameters.indicators;
  if (Array.isArray(indicators)) {
    return indicators.map((item, index) => {
      if (isRecord(item)) {
        const name = String(item.name ?? item.indicator ?? `Indicator ${index + 1}`);
        const details = Object.entries(item).filter(([key]) => !['name', 'indicator'].includes(key)).map(([key, value]) => `${title(key)} ${compactValue(value)}`).join(' · ');
        return { name, details };
      }
      return { name: String(item), details: '' };
    });
  }
  if (isRecord(indicators)) {
    const selected = Array.isArray(indicators.selected) ? indicators.selected.map(String) : Object.keys(indicators);
    const config = isRecord(indicators.parameters) ? indicators.parameters : indicators;
    return selected.map((name) => ({ name, details: compactValue((config as Record<string, unknown>)[name]) }));
  }
  return [];
}

function D3PredictionDistributionChart({ actual, predicted }: { actual: unknown; predicted: unknown }) {
  return <D3PercentBars rows={[{ label: 'Actual positive rate', value: actual }, { label: 'Predicted positive rate', value: predicted }]} />;
}

function D3IndicatorDiagram({ entries }: { entries: Array<{ name: string; details: string }> }) {
  const width = 680;
  const height = Math.max(140, entries.length * 54 + 34);
  const y = d3.scaleLinear().domain([0, Math.max(1, entries.length - 1)]).range([42, height - 34]);
  if (!entries.length) return <p className="text-sm text-muted-foreground">No indicator configuration available.</p>;
  return <svg viewBox={`0 0 ${width} ${height}`} className="h-80 w-full overflow-visible" role="img" aria-label="Indicator configuration diagram">
    <line x1="54" x2="54" y1="42" y2={height - 34} stroke="currentColor" opacity={0.18} />
    {entries.map((entry, index) => {
      const cy = y(index);
      return <g key={`${entry.name}-${index}`}>
        <circle cx="54" cy={cy} r="8" fill="#10b981" />
        <rect x="84" y={cy - 20} width="520" height="40" rx="8" fill="currentColor" opacity={0.08} />
        <text x="104" y={cy - 3} fontSize="13" fontWeight="700" fill="currentColor">{entry.name}</text>
        <text x="104" y={cy + 14} fontSize="11" fill="currentColor" opacity={0.7}>{entry.details || 'Default parameters'}</text>
      </g>;
    })}
  </svg>;
}

function D3RiskRewardQuadrant({ totalReturn, drawdown, sharpeAnnualized, sharpePerBar }: { totalReturn: unknown; drawdown: unknown; sharpeAnnualized: unknown; sharpePerBar: unknown }) {
  const width = 460;
  const height = 300;
  const margin = { top: 30, right: 28, bottom: 44, left: 56 };
  const x = d3.scaleLinear().domain([-25, 150]).range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().domain([0, 60]).range([height - margin.bottom, margin.top]);
  const returnValue = Math.max(-25, Math.min(150, n(totalReturn) ?? 0));
  const drawdownValue = Math.max(0, Math.min(60, n(drawdown) ?? 0));
  return <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full overflow-visible" role="img" aria-label="Risk reward quadrant chart">
    <rect x={margin.left} y={margin.top} width={width - margin.left - margin.right} height={height - margin.top - margin.bottom} rx="8" fill="currentColor" opacity={0.06} />
    <line x1={x(25)} x2={x(25)} y1={margin.top} y2={height - margin.bottom} stroke="currentColor" opacity={0.25} />
    <line x1={margin.left} x2={width - margin.right} y1={y(30)} y2={y(30)} stroke="currentColor" opacity={0.25} />
    <text x={margin.left + 10} y={margin.top + 18} fontSize="11" fill="currentColor" opacity={0.65}>Low return / high drawdown</text>
    <text x={width - margin.right - 10} y={margin.top + 18} textAnchor="end" fontSize="11" fill="currentColor" opacity={0.65}>High return / high drawdown</text>
    <text x={margin.left + 10} y={height - margin.bottom - 10} fontSize="11" fill="currentColor" opacity={0.65}>Low return / low drawdown</text>
    <text x={width - margin.right - 10} y={height - margin.bottom - 10} textAnchor="end" fontSize="11" fill="currentColor" opacity={0.65}>High return / low drawdown</text>
    <circle cx={x(returnValue)} cy={y(drawdownValue)} r="8" fill="#f59e0b" stroke="#111827" strokeWidth="2" />
    <text x={x(returnValue)} y={Math.max(18, y(drawdownValue) - 14)} textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor">Model</text>
    <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="currentColor" opacity={0.7}>Total return %</text>
    <text x="14" y={height / 2} textAnchor="middle" fontSize="11" fill="currentColor" opacity={0.7} transform={`rotate(-90 14 ${height / 2})`}>Max drawdown %</text>
    <text x={margin.left} y={height - 24} fontSize="11" fill="currentColor" opacity={0.75}>Sharpe annualized {formatNumber(sharpeAnnualized)} · Per-bar Sharpe {formatNumber(sharpePerBar)}</text>
  </svg>;
}

function verdict(label: string, value: unknown, good: boolean, warn: boolean, format = formatPct) {
  return { label, value: format(value), tone: good ? 'green' : warn ? 'yellow' : 'red' };
}

function D3HealthVerdictDashboard({ rows }: { rows: Array<{ label: string; value: string; tone: string }> }) {
  const width = 620;
  const height = 180;
  const cellWidth = 148;
  const cellHeight = 62;
  const colors: Record<string, string> = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444' };
  return <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full overflow-visible" role="img" aria-label="Model health verdict dashboard">
    {rows.map((row, index) => {
      const col = index % 4;
      const line = Math.floor(index / 4);
      const x = 12 + col * cellWidth;
      const y = 12 + line * cellHeight;
      return <g key={row.label}>
        <rect x={x} y={y} width={cellWidth - 12} height={cellHeight - 12} rx="8" fill={colors[row.tone] ?? '#94a3b8'} opacity={0.2} stroke={colors[row.tone] ?? '#94a3b8'} />
        <circle cx={x + 18} cy={y + 18} r="6" fill={colors[row.tone] ?? '#94a3b8'} />
        <text x={x + 32} y={y + 19} fontSize="12" fontWeight="700" fill="currentColor">{row.label}</text>
        <text x={x + 32} y={y + 38} fontSize="11" fill="currentColor" opacity={0.75}>{row.value}</text>
      </g>;
    })}
  </svg>;
}

function ModelReviewDashboard({ model }: { model: ModelItem }) {
  const logs = model.logMetrics ?? [];
  const backtest = latestLog(logs, BACKTEST_ROWS.map(([, key]) => key));
  const classification = latestLog(logs, CLASSIFICATION_ROWS.map(([, key]) => key));
  const sources = [classification, backtest, model.metrics];
  const tp = n(firstValue(sources, ['tp_count', 'true_positive_count', 'true_positives']));
  const fp = n(firstValue(sources, ['fp_count', 'false_positive_count', 'false_positives']));
  const tn = n(firstValue(sources, ['tn_count', 'true_negative_count', 'true_negatives']));
  const fn = n(firstValue(sources, ['fn_count', 'false_negative_count', 'false_negatives']));
  const precision = firstValue(sources, ['precision_pct', 'precision']);
  const recall = firstValue(sources, ['recall_pct', 'recall']);
  const precisionN = n(precision);
  const recallN = n(recall);
  const precisionRatio = precisionN === null ? null : (Math.abs(precisionN) <= 1 ? precisionN : precisionN / 100);
  const recallRatio = recallN === null ? null : (Math.abs(recallN) <= 1 ? recallN : recallN / 100);
  const total = [tp, fp, tn, fn].every((value) => value !== null) ? Number(tp) + Number(fp) + Number(tn) + Number(fn) : null;
  const accuracy = firstValue(sources, ['accuracy_pct', 'accuracy']) ?? (total ? ((Number(tp) + Number(tn)) / total) * 100 : null);
  const f1 = firstValue(sources, ['f1_score_pct', 'f1_pct', 'f1']) ?? (precisionRatio !== null && recallRatio !== null && precisionRatio + recallRatio > 0 ? (2 * precisionRatio * recallRatio / (precisionRatio + recallRatio)) * 100 : null);
  const totalReturn = firstValue(sources, ['total_return_net_pct']);
  const drawdown = firstValue(sources, ['max_drawdown_pct', 'maxDrawdown']);
  const sharpeAnnualized = firstValue(sources, ['sharpe_annualized', 'sharpe']);
  const sharpePerBar = firstValue(sources, ['sharpe_per_bar']);
  const actualPositiveRate = firstValue(sources, ['actual_pos_rate_pct', 'actual_positive_rate']);
  const predictedPositiveRate = firstValue(sources, ['pred_pos_rate_pct', 'predicted_positive_rate']);
  const falsePositiveRate = firstValue(sources, ['false_positive_rate']) ?? (fp !== null && tn !== null && fp + tn > 0 ? (fp / (fp + tn)) * 100 : null);
  const predictionBias = n(predictedPositiveRate) !== null && n(actualPositiveRate) !== null ? Math.abs(Number(n(predictedPositiveRate)) - Number(n(actualPositiveRate))) : null;
  const indicators = indicatorEntries(model.parameters ?? {});
  const healthRows = [
    verdict('Return', totalReturn, (n(totalReturn) ?? -Infinity) > 0, (n(totalReturn) ?? -Infinity) > -5),
    verdict('Sharpe annualized', sharpeAnnualized, (n(sharpeAnnualized) ?? -Infinity) >= 1, (n(sharpeAnnualized) ?? -Infinity) >= 0.5, formatNumber),
    verdict('Drawdown', drawdown, (n(drawdown) ?? Infinity) <= 15, (n(drawdown) ?? Infinity) <= 35),
    verdict('Precision', precision, (n(precision) ?? -Infinity) >= 55, (n(precision) ?? -Infinity) >= 40),
    verdict('Recall', recall, (n(recall) ?? -Infinity) >= 60, (n(recall) ?? -Infinity) >= 40),
    verdict('False positives', falsePositiveRate, (n(falsePositiveRate) ?? Infinity) <= 20, (n(falsePositiveRate) ?? Infinity) <= 45),
    verdict('Prediction bias', predictionBias, (n(predictionBias) ?? Infinity) <= 10, (n(predictionBias) ?? Infinity) <= 30),
  ];

  return <div className="space-y-4">
    <Card><CardHeader><CardTitle>Performance KPI</CardTitle></CardHeader><CardContent><KeyValues rows={[['Sharpe annualized', formatNumber(sharpeAnnualized)], ['Total return', formatPct(totalReturn)], ['Max drawdown', formatPct(drawdown)], ['Win rate', formatPct(firstValue(sources, ['trade_win_rate_pct', 'winRate']))], ['Precision', formatPct(precision)], ['Recall', formatPct(recall)], ['Accuracy', formatPct(accuracy)], ['F1', formatPct(f1)], ['Trades', firstValue(sources, ['trades_count', 'trades'])]]} /></CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Confusion Matrix</CardTitle></CardHeader><CardContent><D3ConfusionHeatmap stats={{ tn, fp, fn, tp }} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Classification Bars</CardTitle></CardHeader><CardContent><D3PercentBars rows={[{ label: 'Precision', value: precision }, { label: 'Recall', value: recall }, { label: 'Accuracy', value: accuracy }]} /></CardContent></Card>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Prediction Distribution</CardTitle></CardHeader><CardContent><D3PredictionDistributionChart actual={actualPositiveRate} predicted={predictedPositiveRate} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Trade Outcome</CardTitle></CardHeader><CardContent><D3TradeOutcomeChart rows={[{ label: 'Mean winning trade', value: firstValue(sources, ['trade_return_mean_win_pct']) }, { label: 'Mean losing trade', value: firstValue(sources, ['trade_return_mean_loss_pct']) }, { label: 'Trade expectancy', value: firstValue(sources, ['trade_expectancy_pct', 'expectancy']) }]} /></CardContent></Card>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Backtest Summary</CardTitle></CardHeader><CardContent><KeyValues rows={[['Total return', formatPct(totalReturn)], ['Max drawdown', formatPct(drawdown)], ['Sharpe annualized', formatNumber(sharpeAnnualized)], ['Bars in market', formatPct(firstValue(sources, ['bars_in_market_pct']))], ['Trades', firstValue(sources, ['trades_count', 'trades'])]]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Model Provenance</CardTitle></CardHeader><CardContent><KeyValues rows={[['Model ID', `#${model.id}`], ['Experiment', model.experiment?.name ?? model.experiment?.id], ['Blueprint', model.blueprint?.name ?? model.blueprint?.id], ['Owner', model.owner?.username ?? model.owner?.id], ['Created', String(model.createdAt ?? '—').slice(0, 10)], ['Parameter hash', model.parameterHash], ['Split strategy', firstValue([model.parameters?.split as Record<string, unknown> | undefined, model.parameters], ['strategy', 'split_strategy'])]]} /></CardContent></Card>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Indicator Configuration</CardTitle></CardHeader><CardContent><D3IndicatorDiagram entries={indicators} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Risk vs Reward</CardTitle></CardHeader><CardContent><D3RiskRewardQuadrant totalReturn={totalReturn} drawdown={drawdown} sharpeAnnualized={sharpeAnnualized} sharpePerBar={sharpePerBar} /></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Model Health Verdict</CardTitle></CardHeader><CardContent><D3HealthVerdictDashboard rows={healthRows} /></CardContent></Card>
  </div>;
}

function Parameters({ parameters }: { parameters?: Record<string, unknown> }) {
  const params = parameters ?? {};
  const grouped = ['architecture', 'indicators', 'split', 'target'];
  const remaining = Object.entries(params).filter(([key]) => !grouped.includes(key));
  return (
    <div className="space-y-4">
      {grouped.filter((key) => key in params).map((key) => <section key={key}><h3 className="mb-2 text-sm font-medium">{title(key)}</h3><KeyValues rows={isRecord(params[key]) ? Object.entries(params[key] as Record<string, unknown>) : [[key, params[key]]]} /></section>)}
      {remaining.length ? <section><h3 className="mb-2 text-sm font-medium">Other Parameters</h3><KeyValues rows={remaining} /></section> : null}
    </div>
  );
}

export function ModelDetailView() {
  const params = useParams<{ id: string }>();
  const [model, setModel] = useState<ModelItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getModelDetail(params.id).then((res) => {
      if (!cancelled) {
        setModel(res.data?.model ?? null);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setModel(null);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [params.id]);

  async function toggleFavorite() {
    if (!model) return;
    const was = Boolean(model.isFavorited);
    setModel({ ...model, isFavorited: !was });
    try {
      if (was) await unfavoriteModel(model.id);
      else await favoriteModel(model.id);
    } catch {
      setModel({ ...model, isFavorited: was });
    }
  }

  return (
    <BaseView title={model ? `Model #${model.id}` : 'Model Detail'} description="Review model metrics, provenance, and metadata." actions={model ? <div className="flex gap-2"><Button asChild><Link href={`/experiments/new?modelId=${model.id}`}>New Experiment</Link></Button><Button variant="outline" onClick={toggleFavorite}>{model.isFavorited ? 'Unfavorite' : 'Favorite'}</Button></div> : undefined}>
      {loading ? <LoadingState message="Loading model detail..." /> : !model ? <EmptyState title="Model unavailable" description="The model was not found or is not accessible." /> : (
        <div className="space-y-4">
          <ModelReviewDashboard model={model} />
          <Card><CardHeader><CardTitle>Context</CardTitle></CardHeader><CardContent><KeyValues rows={[['Experiment', model.experiment?.name ?? model.experiment?.id], ['Blueprint', model.blueprint?.name ?? model.blueprint?.id], ['Owner', model.owner?.username ?? model.owner?.id], ['Created', model.createdAt], ['Parameter hash', model.parameterHash]]} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Parameters</CardTitle></CardHeader><CardContent><Parameters parameters={model.parameters} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Log Summary</CardTitle></CardHeader><CardContent><LogSummary logs={model.logMetrics} /></CardContent></Card>
        </div>
      )}
    </BaseView>
  );
}
