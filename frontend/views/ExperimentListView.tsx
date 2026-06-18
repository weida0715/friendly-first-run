"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BaseView } from './BaseView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/states/EmptyState';
import { LoadingState } from '@/components/states/LoadingState';
import { cancelExperiment, listExperiments, type ExperimentListItem } from '@/lib/api/client';

export function ExperimentListView() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<ExperimentListItem[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedStatus, setDebouncedStatus] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async (nextStatus: string, nextSearch: string, active: boolean) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await listExperiments({
        status: nextStatus || undefined,
        search: nextSearch || undefined,
      });
      if (active) {
        setItems(res.data?.items ?? []);
      }
    } catch (error) {
      if (active) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to load experiments. Please try again.';
        setLoadError(message);
        setItems([]);
      }
    } finally {
      if (active) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedStatus(status);
      setDebouncedSearch(search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [status, search]);

  useEffect(() => {
    let active = true;
    (async () => {
      await load(debouncedStatus, debouncedSearch, active);
    })();

    return () => {
      active = false;
    };
  }, [debouncedStatus, debouncedSearch]);

  const hasData = items.length > 0;

  return (
    <BaseView
      title="Experiment Runs"
      description="Manage and monitor research experiment runs."
      actions={<Button asChild><Link href="/experiments/new">New Experiment</Link></Button>}
    >
      <div className="space-y-4">
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search and narrow experiment runs.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input placeholder="Search experiment name..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Input placeholder="Status (Queued/Running/Completed...)" value={status} onChange={(e) => setStatus(e.target.value)} />
            <div className="text-xs text-muted-foreground self-center">Showing your private experiments only</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Experiment Feed</CardTitle>
            <CardDescription>Recent and active experiment runs.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingState message="Loading experiment runs..." /> : null}
            {!isLoading && loadError ? (
              <EmptyState title="Unable to load experiments" description={loadError} />
            ) : null}
            {!isLoading && !loadError && !hasData ? (
              <EmptyState title="No experiments yet" description="Create an experiment to start collecting run history." />
            ) : null}
            {!isLoading && !loadError && hasData ? (
              <div className="space-y-2">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="pt-4 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-muted-foreground">{item.interval} · {item.startDate} → {item.endDate}</p>
                          <p className="text-muted-foreground">Created: {item.createdAt}</p>
                          <p className="text-muted-foreground">Completed: {item.completedAt ?? '—'}</p>
                        </div>
                        <div className="text-right">
                          <p>Status: {item.status}</p>
                          <p>Progress: {item.progress}%</p>
                          <Button asChild variant="outline" size="sm" className="mt-2">
                            <Link href={item.detailPath}>Open</Link>
                          </Button>
                          {String(item.status).toLowerCase() === 'queued' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={async () => {
                                await cancelExperiment(item.id);
                                await load(debouncedStatus, debouncedSearch, true);
                              }}
                            >
                              Cancel
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </BaseView>
  );
}