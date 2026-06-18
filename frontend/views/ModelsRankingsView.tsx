"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BaseView } from './BaseView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ErrorState } from '@/components/states/ErrorState';
import { EmptyState } from '@/components/states/EmptyState';
import { LoadingState } from '@/components/states/LoadingState';
import { getFavoritedModels, getModelHighlights, getModelRankings, type ModelHighlightItem, type ModelItem, unfavoriteModel } from '@/lib/api/client';

type FilterRule = { column: string; op: string; value?: string; min?: string; max?: string };

const FILTER_COLUMNS = [
  ['model_id', 'Model ID'],
  ['experiment_id', 'Experiment ID'],
  ['experiment_name', 'Experiment name'],
  ['blueprint_id', 'Blueprint ID'],
  ['blueprint_name', 'Blueprint name'],
  ['owner', 'Owner'],
  ['sharpe', 'Sharpe'],
  ['accuracy', 'Accuracy'],
  ['precision', 'Precision'],
  ['total_return_net_pct', 'Total Return'],
  ['trade_win_rate_pct', 'Win Rate'],
  ['created_at', 'Created'],
];

const SORT_COLUMNS = [
  ['model_id', 'Model'],
  ['experiment_name', 'Experiment'],
  ['blueprint_name', 'Blueprint'],
  ['owner', 'Owner'],
  ['sharpe', 'Sharpe'],
  ['accuracy', 'Accuracy'],
  ['precision', 'Precision'],
  ['total_return_net_pct', 'Total Return'],
  ['trade_win_rate_pct', 'Win Rate'],
  ['created_at', 'Created'],
];

const COLUMN_TYPES: Record<string, 'text' | 'id' | 'numeric' | 'date'> = {
  model_id: 'id',
  experiment_id: 'id',
  experiment_name: 'text',
  blueprint_id: 'id',
  blueprint_name: 'text',
  owner: 'text',
  sharpe: 'numeric',
  accuracy: 'numeric',
  precision: 'numeric',
  total_return_net_pct: 'numeric',
  trade_win_rate_pct: 'numeric',
  created_at: 'date',
};

const OPERATORS = {
  text: ['contains', 'equals'],
  id: ['equals'],
  numeric: ['min', 'max', 'between', 'equals'],
  date: ['min', 'max', 'between', 'equals'],
};

function fmt(value: unknown): string {
  if (typeof value === 'number') return value.toFixed(Math.abs(value) >= 100 ? 1 : 3);
  return String(value ?? '—');
}

function isRange(rule: FilterRule) {
  return ['min', 'max', 'between'].includes(rule.op);
}

const DEFAULT_DESC = new Set(['model_id', 'created_at', 'sharpe', 'accuracy', 'precision', 'total_return_net_pct', 'trade_win_rate_pct']);

function HighlightCard({ title, items, loading = false, error }: { title: string; items?: ModelHighlightItem[]; loading?: boolean; error?: string | null }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {error ? <ErrorState message={error} /> : loading ? <LoadingState message="Loading rankings..." /> : !items?.length ? <p className="text-sm text-muted-foreground">No ranked models yet.</p> : (
          <div className="space-y-2">
            {items.slice(0, 3).map((item, index) => (
              <Link className={`block rounded-md border p-3 hover:bg-muted/40 ${index === 0 ? 'border-primary bg-primary/5' : ''}`} href={item.detailPath} key={item.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">#{index + 1} Model {item.id}</span>
                  <span className="text-sm text-muted-foreground">{fmt(item.rankMetric?.value)}</span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{item.experiment?.name ?? `Experiment ${item.experiment?.id}`}</p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ModelsRankingsView() {
  const [sort, setSort] = useState('sharpe');
  const [order, setOrder] = useState('desc');
  const [qDraft, setQDraft] = useState('');
  const [q, setQ] = useState('');
  const [draftRules, setDraftRules] = useState<FilterRule[]>([]);
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [includeIncomplete, setIncludeIncomplete] = useState(false);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ModelItem[]>([]);
  const [favorites, setFavorites] = useState<ModelItem[]>([]);
  const [highlights, setHighlights] = useState<{ sharpe?: ModelHighlightItem[]; totalReturn?: ModelHighlightItem[]; accuracy?: ModelHighlightItem[]; winRate?: ModelHighlightItem[] }>({});
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [rankingsError, setRankingsError] = useState<string | null>(null);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);

  const activeRules = useMemo(() => rules.filter((rule) => rule.column && rule.op && (isRange(rule) ? rule.min || rule.max : rule.value)), [rules]);
  const params = useMemo(() => ({ sort, order, q: q || undefined, filters: activeRules, includeIncomplete, page, pageSize: 20 }), [sort, order, q, activeRules, includeIncomplete, page]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRankingsError(null);
    getModelRankings(params).then((res) => {
      if (cancelled) return;
      setItems(res.data?.items ?? []);
      setTotalPages(res.data?.totalPages ?? 1);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setItems([]);
        setRankingsError('Unable to load model rankings.');
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [params]);

  useEffect(() => {
    let cancelled = false;
    setFavoritesLoading(true);
    setFavoritesError(null);
    getFavoritedModels().then((favoriteRes) => {
      if (!cancelled) {
        setFavorites(favoriteRes.data?.items ?? []);
        setFavoritesLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setFavorites([]);
        setFavoritesError('Unable to load favorited models.');
        setFavoritesLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setHighlightsLoading(true);
    setHighlightsError(null);
    getModelHighlights().then((res) => {
      if (!cancelled) {
        setHighlights({
          sharpe: res.data?.sharpe ?? [],
          totalReturn: res.data?.totalReturn ?? [],
          accuracy: res.data?.accuracy ?? [],
          winRate: res.data?.winRate ?? [],
        });
        setHighlightsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setHighlights({});
        setHighlightsError('Unable to load model highlights.');
        setHighlightsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  async function removeFavorite(modelId: number) {
    const previous = favorites;
    setFavorites((rows) => rows.filter((item) => item.id !== modelId));
    try {
      await unfavoriteModel(modelId);
    } catch {
      setFavorites(previous);
    }
  }

  function applyFilters() {
    setQ(qDraft.trim());
    setRules(draftRules);
    setPage(1);
  }

  function operatorsFor(column: string) {
    return OPERATORS[COLUMN_TYPES[column] ?? 'text'];
  }

  function updateRuleColumn(index: number, column: string) {
    setDraftRules((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      const operators = operatorsFor(column);
      return { ...item, column, op: operators.includes(item.op) ? item.op : operators[0], value: '', min: '', max: '' };
    }));
  }

  function sortBy(column: string) {
    setPage(1);
    if (sort === column) {
      setOrder((value) => value === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(column);
      setOrder(DEFAULT_DESC.has(column) ? 'desc' : 'asc');
    }
  }

  function heading(column: string, label: string) {
    const active = sort === column;
    const nextOrder = active ? (order === 'asc' ? 'desc' : 'asc') : (DEFAULT_DESC.has(column) ? 'desc' : 'asc');
    return <button type="button" className="inline-flex items-center gap-1 font-medium hover:text-foreground" aria-label={`Sort ${label} ${nextOrder === 'asc' ? 'ascending' : 'descending'}`} onClick={() => sortBy(column)}>{label}{active ? <span>{order === 'asc' ? '↑' : '↓'}</span> : null}</button>;
  }

  return (
    <BaseView title="Model Rankings" description="Compare trained models by research metrics." actions={<Button asChild><Link href="/experiments/new">New Experiment</Link></Button>}>
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <HighlightCard title="Best Sharpe" items={highlights.sharpe} loading={highlightsLoading} error={highlightsError} />
          <HighlightCard title="Best Total Return" items={highlights.totalReturn} loading={highlightsLoading} error={highlightsError} />
          <HighlightCard title="Best Accuracy" items={highlights.accuracy} loading={highlightsLoading} error={highlightsError} />
          <HighlightCard title="Best Win Rate" items={highlights.winRate} loading={highlightsLoading} error={highlightsError} />
        </div>

        <Card>
          <CardHeader><CardTitle>Favorited Models</CardTitle></CardHeader>
          <CardContent>
            {favoritesError ? <ErrorState message={favoritesError} /> : favoritesLoading ? <LoadingState message="Loading favorited models..." /> : favorites.length === 0 ? (
              <EmptyState title="No favorited models" description="Favorite models from detail pages to keep them here." />
            ) : (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {favorites.map((item) => (
                  <div className="rounded-md border p-3" key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link className="font-medium hover:underline" href={item.detailPath}>Model #{item.id}</Link>
                        <p className="text-sm text-muted-foreground">{item.experiment?.name ?? `Experiment ${item.experiment?.id}`}</p>
                      </div>
                      <Button type="button" variant="outline" onClick={() => removeFavorite(item.id)}>Unfavorite</Button>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Sharpe {fmt(item.metrics?.sharpe)} · Accuracy {fmt(item.metrics?.accuracy)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input placeholder="Search model ID, experiment, blueprint, owner, hash..." value={qDraft} onChange={(event) => setQDraft(event.target.value)} />
              <Button type="button" onClick={applyFilters}>Apply</Button>
              <Button type="button" variant="outline" onClick={() => { setQDraft(''); setQ(''); setDraftRules([]); setRules([]); setPage(1); }}>Clear</Button>
            </div>
            <div className="space-y-2">
              {draftRules.map((rule, index) => (
                <div className="grid gap-2 md:grid-cols-[minmax(160px,1fr)_140px_minmax(120px,1fr)_minmax(120px,1fr)_auto]" key={index}>
                  <select className="h-10 rounded-md border bg-background px-3 text-sm" value={rule.column} onChange={(event) => updateRuleColumn(index, event.target.value)} aria-label="Filter column">
                    {FILTER_COLUMNS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <select className="h-10 rounded-md border bg-background px-3 text-sm" value={rule.op} onChange={(event) => setDraftRules((prev) => prev.map((item, i) => i === index ? { ...item, op: event.target.value } : item))} aria-label="Filter operator">
                    {operatorsFor(rule.column).map((operator) => <option key={operator} value={operator}>{operator}</option>)}
                  </select>
                  {isRange(rule) ? (
                    <>
                      <Input placeholder="Min" value={rule.min ?? ''} onChange={(event) => setDraftRules((prev) => prev.map((item, i) => i === index ? { ...item, min: event.target.value } : item))} />
                      <Input placeholder="Max" value={rule.max ?? ''} onChange={(event) => setDraftRules((prev) => prev.map((item, i) => i === index ? { ...item, max: event.target.value } : item))} />
                    </>
                  ) : (
                    <>
                      <Input placeholder="Value" value={rule.value ?? ''} onChange={(event) => setDraftRules((prev) => prev.map((item, i) => i === index ? { ...item, value: event.target.value } : item))} />
                      <div />
                    </>
                  )}
                  <Button type="button" variant="outline" onClick={() => setDraftRules((prev) => prev.filter((_, i) => i !== index))}>Remove</Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={() => setDraftRules((prev) => [...prev, { column: 'sharpe', op: 'between', min: '', max: '' }])}>Add filter</Button>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeIncomplete} onChange={(event) => { setIncludeIncomplete(event.target.checked); setPage(1); }} /> Include incomplete</label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Leaderboard</CardTitle></CardHeader>
          <CardContent>
            {rankingsError ? <ErrorState message={rankingsError} /> : loading ? <LoadingState message="Loading model rankings..." /> : items.length === 0 ? (
              <EmptyState title="No ranked models yet" description="Validated models will appear here once experiment runs complete." />
            ) : (
              <div className="space-y-3">
                <div className="overflow-auto">
                  <table className="w-full min-w-[860px] text-sm">
                    <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground">{SORT_COLUMNS.slice(0, 4).map(([column, label]) => <th className="py-2" key={column}>{heading(column, label)}</th>)}{SORT_COLUMNS.slice(4).map(([column, label]) => <th key={column}>{heading(column, label)}</th>)}</tr></thead>
                    <tbody>{items.map((item) => <tr className="border-b" key={item.id}><td className="py-2"><Link className="font-medium hover:underline" href={item.detailPath}>#{item.id}</Link></td><td>{item.experiment?.name ?? item.experiment?.id}</td><td>{item.blueprint?.name ?? item.blueprint?.id}</td><td>{item.owner?.username ?? item.owner?.id}</td><td>{fmt(item.metrics?.sharpe)}</td><td>{fmt(item.metrics?.accuracy)}</td><td>{fmt(item.metrics?.precision)}</td><td>{fmt(item.metrics?.total_return_net_pct)}</td><td>{fmt(item.metrics?.trade_win_rate_pct ?? item.metrics?.winRate)}</td><td>{item.createdAt?.slice(0, 10) ?? '—'}</td></tr>)}</tbody>
                  </table>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BaseView>
  );
}
