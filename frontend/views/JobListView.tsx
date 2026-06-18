"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BaseView } from './BaseView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/states/EmptyState';
import { cancelJob, listJobs } from '@/lib/api/client';

type JobItem = {
  id: string;
  state: string;
  type: string;
  detailPath: string;
  queue?: { position?: number | null };
  experiment?: { id: number; name: string; status: string };
};

export function JobListView() {
  const [items, setItems] = useState<JobItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = async () => {
    try {
      setErrorMessage(null);
      const res = await listJobs();
      setItems((res.data?.items as JobItem[] | undefined) ?? []);
    } catch (error) {
      setItems([]);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load jobs list.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <BaseView title="Jobs Queue" description="Your active queued/running jobs.">
      <Card>
        <CardHeader><CardTitle>Jobs</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {errorMessage ? <EmptyState title="Unable to load jobs" description={errorMessage} /> : null}
          {items.length === 0 ? <EmptyState title="No active jobs" description="Queued jobs will appear here." /> : null}
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded border p-2 text-sm">
              <div>
                <p className="font-medium">{item.experiment?.name ?? item.id}</p>
                <p className="text-muted-foreground">{item.state} · queue: {String(item.queue?.position ?? '-')}</p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline"><Link href={item.detailPath}>Detail</Link></Button>
                {item.state?.toLowerCase() === 'queued' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await cancelJob(item.id);
                      await load();
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </BaseView>
  );
}