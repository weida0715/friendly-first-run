"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BaseView } from './BaseView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/states/EmptyState';
import { LoadingState } from '@/components/states/LoadingState';
import { StatusBadge } from '@/components/status/StatusBadge';
import { apiGet, favoriteBlueprint, unfavoriteBlueprint } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

type Tab = 'owned' | 'favorited';
type Item = { id: number; name: string; approvalState: string; version: number; updatedAt: string; isFavorited?: boolean };

export function BlueprintsLibraryView() {
  const [tab, setTab] = useState<Tab>('owned');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [author, setAuthor] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (name) q.set('name', name);
    if (status) q.set('status', status);
    if (author && tab === 'favorited') q.set('author', author);
    return q.toString();
  }, [name, status, author, tab]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const base = tab === 'owned' ? API_ENDPOINTS.blueprints.owned : API_ENDPOINTS.blueprints.favorited;
      const path = query ? `${base}?${query}` : base;
      const res = await apiGet<{ ok: boolean; data?: { items?: Item[] } }>(path);
      if (!cancelled) {
        setItems(res.data?.items ?? []);
        setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [tab, query]);

  return (
    <BaseView
      title="Blueprints Library"
      description="Manage reusable experiment Blueprints."
      actions={<Button asChild><Link href="/blueprints/new">New Blueprint</Link></Button>}
    >
      {/* TODO: connect BlueprintsLibraryController.listBlueprints() + moderation summary */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button variant={tab === 'owned' ? 'default' : 'outline'} onClick={() => setTab('owned')}>Owned</Button>
          <Button variant={tab === 'favorited' ? 'default' : 'outline'} onClick={() => setTab('favorited')}>Favorited</Button>
        </div>

        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search by name, author, and approval status.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input placeholder="Search blueprint name..." value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Approval state: Draft/Pending/Approved/Rejected" value={status} onChange={(e) => setStatus(e.target.value)} />
            <Input placeholder="Author username (favorited tab)" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader><CardTitle>{tab === 'owned' ? 'Owned Blueprints' : 'Favorited Blueprints'}</CardTitle></CardHeader>
          <CardContent>
            {loading ? <LoadingState message="Loading blueprints..." /> : items.length === 0 ? (
              <EmptyState title="No blueprints found" description="Try adjusting filters or create/favorite more blueprints." />
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/blueprints/${item.id}`} className="font-medium hover:underline">{item.name}</Link>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={async () => {
                            const was = Boolean(item.isFavorited);
                            setItems((prev) => prev.map((row) => row.id === item.id ? { ...row, isFavorited: !was } : row));
                            try {
                              if (was) {
                                await unfavoriteBlueprint(item.id);
                                if (tab === 'favorited') {
                                  setItems((prev) => prev.filter((row) => row.id !== item.id));
                                }
                              } else {
                                await favoriteBlueprint(item.id);
                              }
                            } catch {
                              setItems((prev) => prev.map((row) => row.id === item.id ? { ...row, isFavorited: was } : row));
                            }
                          }}
                        >
                          {item.isFavorited ? 'Unfavorite' : 'Favorite'}
                        </Button>
                        <StatusBadge status={item.approvalState} />
                        <span className="rounded border px-2 py-0.5 text-xs">v{item.version}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BaseView>
  );
}