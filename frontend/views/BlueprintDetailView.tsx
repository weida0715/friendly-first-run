"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { BaseView } from './BaseView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status/StatusBadge';
import { LoadingState } from '@/components/states/LoadingState';
import { EmptyState } from '@/components/states/EmptyState';
import {
  apiGet,
  approveBlueprint,
  disapproveBlueprint,
  favoriteBlueprint,
  rejectBlueprint,
  requestBlueprintApproval,
  unfavoriteBlueprint,
} from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';


type ParamEntry = [string, unknown];

function scalarEntries(value: unknown): ParamEntry[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).filter(([, item]) => typeof item !== 'object' || item === null);
}

function architectureSummary(architecture: Record<string, unknown>) {
  return {
    name: String(architecture.name ?? architecture.reference ?? architecture.architecture ?? 'Architecture'),
    params: scalarEntries(architecture.parameters ?? architecture.params ?? architecture.settings ?? {}),
  };
}

function indicatorSummaries(indicators: Record<string, unknown>) {
  const paramsByName = ((indicators.params ?? indicators.parameters ?? {}) as Record<string, unknown>) || {};
  const scalersByName = ((indicators.output_scalers ?? indicators.outputScalers ?? {}) as Record<string, Record<string, unknown>>) || {};
  const selected = Array.isArray(indicators.selected) ? indicators.selected.map(String) : [];
  const definitions = Array.isArray(indicators.definitions) ? indicators.definitions as Record<string, unknown>[] : [];
  const names = selected.length > 0 ? selected : definitions.map((item) => String(item.name ?? item.id ?? '')).filter(Boolean);
  const items = names.length > 0 ? names.map((name) => ({ name, source: definitions.find((item) => String(item.name ?? item.id) === name)?.source, params: paramsByName[name] ?? definitions.find((item) => String(item.name ?? item.id) === name)?.parameters ?? definitions.find((item) => String(item.name ?? item.id) === name)?.params ?? {}, scalers: scalersByName[name] ?? definitions.find((item) => String(item.name ?? item.id) === name)?.outputScalers ?? {} })) : Object.entries(indicators).map(([name, params]) => ({ name, source: undefined, params, scalers: scalersByName[name] ?? {} }));
  return items.map((item) => ({ name: item.name, source: String(item.source ?? 'indicator'), params: scalarEntries(item.params), scalers: Object.entries(item.scalers ?? {}) }));
}

type BlueprintDetail = {
  id: number;
  metadata: { name: string; description?: string | null; createdAt: string; updatedAt: string };
  indicators: Record<string, unknown>;
  architecture: Record<string, unknown>;
  approvalState: string;
  version: number;
  lineage: {
    parent: { id: number; name: string; version: number } | null;
    children: Array<{ id: number; name: string; version: number; approvalState: string }>;
  };
  owner: { id: number; username: string; name: string } | null;
  viewer: { isAuthenticated: boolean; isOwner: boolean; isStaff: boolean; role: string | null; isFavorited?: boolean };
};

export function BlueprintDetailView() {
  const formatDateTime = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(date);
  };

  const params = useParams<{ id: string }>();
  const blueprintId = params?.id;
  const normalizedBlueprintId = blueprintId && /^\d+$/.test(blueprintId) ? blueprintId : null;
  const [detail, setDetail] = useState<BlueprintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);

  const toggleFavorite = async () => {
    if (!detail) return;
    const prev = favorited;
    setFavorited(!prev);
    try {
      if (prev) {
        await unfavoriteBlueprint(detail.id);
      } else {
        await favoriteBlueprint(detail.id);
      }
    } catch {
      setFavorited(prev);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!normalizedBlueprintId) {
        setDetail(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await apiGet<{ ok: boolean; data?: { blueprint?: BlueprintDetail } }>(API_ENDPOINTS.blueprints.byId(normalizedBlueprintId));
      if (!cancelled) {
        const next = res.data?.blueprint ?? null;
        setDetail(next);
        setFavorited(Boolean(next?.viewer?.isFavorited));
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [normalizedBlueprintId]);

  const canRequestApproval = useMemo(() => {
    if (!detail) return false;
    return detail.viewer.isOwner && detail.approvalState === "Draft";
  }, [detail]);

  const onRequestApproval = async () => {
    if (!detail) return;
    await requestBlueprintApproval(detail.id);
    setDetail((prev) => (prev ? { ...prev, approvalState: "Pending" } : prev));
  };

  const moderate = async (target: 'Approved' | 'Rejected' | 'Disapproved') => {
    if (!detail) return;
    try {
      if (target === 'Approved') await approveBlueprint(detail.id);
      if (target === 'Rejected') await rejectBlueprint(detail.id);
      if (target === 'Disapproved') await disapproveBlueprint(detail.id);
      setDetail((prev) => (prev ? { ...prev, approvalState: target } : prev));
    } catch {
      // Keep existing UI state when moderation request fails.
    }
  };

  return (
    <BaseView title="Blueprint Detail" description="Inspect blueprint metadata, configuration, status, and lineage.">
      {loading ? <LoadingState message="Loading blueprint..." /> : !detail ? <EmptyState title="Blueprint not found" description="This blueprint may not exist or is not visible to you." /> : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>{detail.metadata.name}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={detail.approvalState} />
                  <span className="rounded border px-2 py-0.5 text-xs">v{detail.version}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{detail.metadata.description || 'No description provided.'}</p>
              <p><strong>Owner:</strong> {detail.owner ? `${detail.owner.name} (@${detail.owner.username})` : 'Unknown'}</p>
              <p><strong>Created:</strong> {formatDateTime(detail.metadata.createdAt)} UTC</p>
              <p><strong>Updated:</strong> {formatDateTime(detail.metadata.updatedAt)} UTC</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Indicators</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                  {indicatorSummaries(detail.indicators).map((indicator) => (
                    <div key={indicator.name} className="rounded-xl border bg-background/70 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-mono text-sm font-semibold">{indicator.name}</p>
                        <p className="text-xs text-muted-foreground">{indicator.source}</p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{indicator.params.length} parameters</span>
                    </div>
                    {indicator.params.length > 0 ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {indicator.params.map(([key, value]) => <div key={key} className="rounded-lg border bg-muted/20 px-3 py-2"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{key}</p><p className="font-mono text-sm">{String(value)}</p></div>)}
                      </div>
                    ) : <p className="mt-3 rounded-lg border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">No user-configurable parameters.</p>}
                    <div className="mt-3">
                      <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">Output scalers</p>
                      {indicator.scalers.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {indicator.scalers.map(([key, value]) => <div key={key} className="rounded-lg border bg-muted/20 px-3 py-2"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{key}</p><p className="font-mono text-sm">{String(value)}</p></div>)}
                        </div>
                      ) : <p className="rounded-lg border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">none</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Architecture</CardTitle></CardHeader>
              <CardContent>
                {(() => { const architecture = architectureSummary(detail.architecture); return (
                  <div className="rounded-xl border bg-background/70 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-sm font-semibold">{architecture.name}</p>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{architecture.params.length} parameters</span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {architecture.params.map(([key, value]) => <div key={key} className="rounded-lg border bg-muted/20 px-3 py-2"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{key}</p><p className="font-mono text-sm">{String(value)}</p></div>)}
                    </div>
                  </div>
                ); })()}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Lineage</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>Parent:</strong>{' '}
                {detail.lineage.parent ? (
                  <Link className="underline" href={`/blueprints/${detail.lineage.parent.id}`}>
                    {detail.lineage.parent.name} (v{detail.lineage.parent.version})
                  </Link>
                ) : 'None'}
              </div>
              <div>
                <strong>Child versions:</strong>
                {detail.lineage.children.length === 0 ? <span> None</span> : (
                  <ul className="mt-2 list-disc pl-5">
                    {detail.lineage.children.map((child) => (
                      <li key={child.id}>
                        <Link className="underline" href={`/blueprints/${child.id}`}>
                          {child.name} (v{child.version})
                        </Link>{' '}
                        <StatusBadge status={child.approvalState} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {canRequestApproval ? <Button variant="default" onClick={onRequestApproval}>Request Approval</Button> : null}
              {detail.viewer.isAuthenticated && !detail.viewer.isOwner ? (
                <Button variant="outline" onClick={toggleFavorite}>{favorited ? 'Unfavorite' : 'Favorite'}</Button>
              ) : null}
              {detail.viewer.isStaff ? (
                <>
                  <Button variant="outline" onClick={() => moderate('Approved')}>Approve</Button>
                  <Button variant="outline" onClick={() => moderate('Rejected')}>Reject</Button>
                  <Button variant="hero" onClick={() => moderate('Disapproved')}>Disapprove</Button>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </BaseView>
  );
}
