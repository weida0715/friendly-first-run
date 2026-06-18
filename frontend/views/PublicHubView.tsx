"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BaseView } from './BaseView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/states/EmptyState';
import { LoadingState } from '@/components/states/LoadingState';
import { getPublicHub, type HubTab } from '@/lib/api/client';

const tabs: HubTab[] = ['users', 'experiments', 'models', 'blueprints'];

function title(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function itemTitle(item: Record<string, unknown>) {
  return String(item.name ?? item.username ?? `#${String(item.id ?? '')}`);
}

function itemDetail(item: Record<string, unknown>) {
  const owner = item.owner as { username?: string; name?: string } | undefined;
  const blueprint = item.blueprint as { name?: string } | undefined;
  const bits = [owner?.username || owner?.name, blueprint?.name, item.status, item.approvalState].filter(Boolean);
  return bits.join(' · ');
}

export function PublicHubView() {
  const [tab, setTab] = useState<HubTab>('users');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getPublicHub({ tab, q }).then((response) => {
      if (cancelled) return;
      setItems(response.data?.items ?? []);
    }).catch((err: Error) => {
      if (!cancelled) setError(err.message);
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [tab, q]);

  return (
    <BaseView
      title="Public Hub"
      description="Discover public models, experiments, Blueprints, and researchers."
      actions={<Button asChild variant="outline"><Link href="/models">Explore Models</Link></Button>}
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((name) => (
                <Button key={name} type="button" variant={tab === name ? 'default' : 'outline'} onClick={() => setTab(name)}>
                  {title(name)}
                </Button>
              ))}
            </div>
            <Input aria-label="Search Public Hub" placeholder={`Search ${tab}...`} value={q} onChange={(event) => setQ(event.target.value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{title(tab)}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <LoadingState message={`Loading public ${tab}...`} /> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {!isLoading && !error && !items.length ? <EmptyState title={`No public ${tab} yet`} description="Visible public records will appear here." /> : null}
            {!isLoading && !error && items.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((item) => (
                  <Link key={`${tab}-${String(item.id)}`} href={String(item.detailPath ?? '#')} className="rounded border p-4 hover:bg-muted/30">
                    <p className="font-medium">{itemTitle(item)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{itemDetail(item) || `ID ${String(item.id ?? '—')}`}</p>
                  </Link>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </BaseView>
  );
}
