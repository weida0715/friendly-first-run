"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BaseView } from './BaseView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';
import { getFavoritedModels, listFavoritedBlueprints, type BlueprintLibraryItem, type ModelItem } from '@/lib/api/client';

type Filter = 'all' | 'models' | 'blueprints';

function modelTitle(item: ModelItem) {
  return item.experiment?.name ?? `Model #${item.id}`;
}

function blueprintTitle(item: BlueprintLibraryItem) {
  return item.name || `Blueprint #${item.id}`;
}

export function FavoritesLibraryView() {
  const [filter, setFilter] = useState<Filter>('all');
  const [models, setModels] = useState<ModelItem[]>([]);
  const [blueprints, setBlueprints] = useState<BlueprintLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getFavoritedModels(), listFavoritedBlueprints()])
      .then(([modelRes, blueprintRes]) => {
        if (cancelled) return;
        setModels(modelRes.data?.items ?? []);
        setBlueprints(blueprintRes.data?.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load favorites.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const items = useMemo(() => [
    ...(filter !== 'blueprints' ? models.map((item) => ({ type: 'Model' as const, id: item.id, title: modelTitle(item), detail: item.blueprint?.name ?? item.owner?.username ?? '', href: item.detailPath })) : []),
    ...(filter !== 'models' ? blueprints.map((item) => ({ type: 'Blueprint' as const, id: item.id, title: blueprintTitle(item), detail: `${item.approvalState} · v${item.version}`, href: `/blueprints/${item.id}` })) : []),
  ], [blueprints, filter, models]);

  return (
    <BaseView title="Favorites" description="Saved models and Blueprints.">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(['all', 'models', 'blueprints'] as const).map((value) => (
            <Button key={value} type="button" variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)}>
              {value === 'all' ? 'All' : value === 'models' ? 'Models' : 'Blueprints'}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Saved Items</CardTitle></CardHeader>
          <CardContent>
            {error ? <ErrorState message={error} /> : loading ? <LoadingState message="Loading favorites..." /> : items.length === 0 ? (
              <EmptyState title="No favorites found" description="Favorite models or Blueprints to keep them here." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <Link key={`${item.type}-${item.id}`} href={item.href} className="rounded-md border p-3 hover:bg-muted/30">
                    <p className="text-xs font-medium uppercase text-muted-foreground">{item.type}</p>
                    <p className="mt-1 font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail || `#${item.id}`}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BaseView>
  );
}
