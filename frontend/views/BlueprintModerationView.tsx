"use client";

import { useEffect, useState } from 'react';
import { BaseView } from './BaseView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/states/EmptyState';
import { approveBlueprint, disapproveBlueprint, getBlueprintModerationQueue, ModerationQueueItem, rejectBlueprint } from '@/lib/api/client';

export function BlueprintModerationView() {
  const [items, setItems] = useState<ModerationQueueItem[]>([]);
  const [query, setQuery] = useState('');

  const load = async () => {
    const res = await getBlueprintModerationQueue();
    setItems(res.data?.items ?? []);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await getBlueprintModerationQueue();
      if (active) {
        setItems(res.data?.items ?? []);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const filtered = items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <BaseView
      title="Blueprint Moderation"
      description="Review and approve submitted Blueprints."
      actions={<div className="flex gap-2"><Button variant="outline" onClick={load}>Refresh Queue</Button></div>}
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold">0</p></CardContent></Card>
          <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Approved Today</p><p className="text-2xl font-bold">0</p></CardContent></Card>
          <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Rejected Today</p><p className="text-2xl font-bold">0</p></CardContent></Card>
          <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Escalated</p><p className="text-2xl font-bold">0</p></CardContent></Card>
        </div>

        <Card className="bg-gradient-card">
          <CardHeader><CardTitle>Moderation Filters</CardTitle><CardDescription>Search and narrow moderation queue items.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input placeholder="Search blueprint title..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <Input placeholder="Status" />
            <Input placeholder="Category" />
            <Input placeholder="Reviewer" />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-gradient-card"><CardHeader><CardTitle>Moderation Queue</CardTitle></CardHeader><CardContent>{filtered.length === 0 ? <EmptyState title="No blueprints in queue" description="Pending blueprint submissions will appear here." /> : <div className="space-y-3">{filtered.map((item) => <div key={item.id} className="rounded border p-3"><div className="flex items-center justify-between gap-2"><div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">v{item.version} • submitted {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'n/a'}</p></div><div className="flex gap-2"><Button variant="outline" onClick={async () => { await approveBlueprint(item.id); await load(); }}>Approve</Button><Button variant="outline" onClick={async () => { await rejectBlueprint(item.id); await load(); }}>Reject</Button><Button variant="hero" onClick={async () => { await disapproveBlueprint(item.id); await load(); }}>Disapprove</Button></div></div></div>)}</div>}</CardContent></Card>
          <Card className="bg-gradient-card"><CardHeader><CardTitle>Queue Snapshot</CardTitle></CardHeader><CardContent>{filtered.length === 0 ? <EmptyState title="No queue snapshot" description="Pending queue status entries appear here." /> : <div className="space-y-2 text-sm">{filtered.map((item) => <p key={`audit-${item.id}`}><strong>{item.name}</strong> currently <em>{item.approvalState}</em> (updated {new Date(item.updatedAt).toLocaleString()})</p>)}</div>}</CardContent></Card>
        </div>
      </div>
    </BaseView>
  );
}