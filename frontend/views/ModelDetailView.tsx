"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  ['Expectancy', 'expectancy'],
  ['Trades', 'trades'],
  ['Sharpe per bar', 'sharpe_per_bar'],
  ['Sharpe annualized', 'sharpe_annualized'],
];

const CLASSIFICATION_ROWS: Array<[string, string]> = [
  ['Accuracy', 'accuracy'],
  ['Precision', 'precision'],
  ['Recall', 'recall'],
  ['F1', 'f1'],
  ['Predicted positive rate', 'predicted_positive_rate'],
  ['Actual positive rate', 'actual_positive_rate'],
  ['False positive rate', 'false_positive_rate'],
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
    <BaseView title={model ? `Model #${model.id}` : 'Model Detail'} description="Review model metrics, provenance, and metadata." actions={model ? <Button variant="outline" onClick={toggleFavorite}>{model.isFavorited ? 'Unfavorite' : 'Favorite'}</Button> : undefined}>
      {loading ? <LoadingState message="Loading model detail..." /> : !model ? <EmptyState title="Model unavailable" description="The model was not found or is not accessible." /> : (
        <div className="space-y-4">
          <Card><CardHeader><CardTitle>Metrics</CardTitle></CardHeader><CardContent><KeyValues rows={[['Sharpe', model.metrics?.sharpe], ['Accuracy', model.metrics?.accuracy], ['Precision', model.metrics?.precision], ['Recall', model.metrics?.recall], ['Max drawdown', model.metrics?.maxDrawdown], ['Win rate', model.metrics?.winRate], ['AUC', model.metrics?.auc], ['False positive rate', model.metrics?.falsePositiveRate]]} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Context</CardTitle></CardHeader><CardContent><KeyValues rows={[['Experiment', model.experiment?.name ?? model.experiment?.id], ['Blueprint', model.blueprint?.name ?? model.blueprint?.id], ['Owner', model.owner?.username ?? model.owner?.id], ['Created', model.createdAt], ['Parameter hash', model.parameterHash]]} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Parameters</CardTitle></CardHeader><CardContent><Parameters parameters={model.parameters} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Log Summary</CardTitle></CardHeader><CardContent><LogSummary logs={model.logMetrics} /></CardContent></Card>
        </div>
      )}
    </BaseView>
  );
}
