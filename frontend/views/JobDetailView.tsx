"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BaseView } from './BaseView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/states/EmptyState';
import { ApiClientError, cancelJob, getJobDetail } from '@/lib/api/client';

type JobDetail = {
  id?: string;
  type?: string;
  ownerId?: number;
  state?: string;
  queue?: { position?: number | null };
  worker?: { name?: string | null };
  timestamps?: { startedAt?: string | null };
};

export function JobDetailView() {
  const params = useParams<{ id: string }>();
  const jobId = params?.id;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadJob = async (id: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await getJobDetail(id);
      setJob((res.data?.job as JobDetail | undefined) ?? null);
    } catch (error: unknown) {
      if (error instanceof ApiClientError && error.status === 404) {
        setJob(null);
        setErrorMessage('Job not found or no longer available.');
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load job detail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    let active = true;
    (async () => {
      await loadJob(jobId);
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [jobId]);

  const canCancel = ['queued', 'running'].includes(String(job?.state ?? '').toLowerCase());

  const handleCancel = async () => {
    if (!jobId || canceling) return;
    setCanceling(true);
    setErrorMessage(null);
    try {
      await cancelJob(jobId);
      await loadJob(jobId);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to cancel job.');
    } finally {
      setCanceling(false);
    }
  };

  return (
    <BaseView
      title="Job Detail"
      description="Inspect queued or running job state."
      actions={<div className="flex gap-2"><Button variant="outline" onClick={handleCancel} disabled={canceling || !jobId || !canCancel}>{canceling ? 'Cancelling...' : 'Cancel Job'}</Button></div>}
    >
      <div className="space-y-4">
        {errorMessage ? <Card><CardContent className="pt-6 text-sm text-destructive">{errorMessage} <Link href="/jobs" className="underline">Back to jobs list</Link></CardContent></Card> : null}
        <Card className="bg-gradient-card">
          <CardHeader><CardTitle>Job Summary</CardTitle><CardDescription>Job identity, owner, and current state.</CardDescription></CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <p><span className="text-muted-foreground">Job ID:</span> {String(job?.id ?? '—')}</p>
            <p><span className="text-muted-foreground">Type:</span> {String(job?.type ?? '—')}</p>
            <p><span className="text-muted-foreground">Owner:</span> {String(job?.ownerId ?? '—')}</p>
            <p><span className="text-muted-foreground">State:</span> {String(job?.state ?? '—')}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Queue Position</p><p className="text-2xl font-bold">{String(job?.queue?.position ?? '-')}</p></CardContent></Card>
          <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Assigned Worker</p><p className="text-2xl font-bold">{String(job?.worker?.name ?? '-')}</p></CardContent></Card>
          <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Retry Count</p><p className="text-2xl font-bold">0</p></CardContent></Card>
          <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Elapsed</p><p className="text-2xl font-bold">{job?.timestamps?.startedAt ? 'running' : '0m'}</p></CardContent></Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-gradient-card"><CardHeader><CardTitle>Lifecycle Timeline</CardTitle></CardHeader><CardContent><EmptyState title="No lifecycle events yet" description="Queued → Running → Completed/Failed transitions will appear here." /></CardContent></Card>
          <Card className="bg-gradient-card"><CardHeader><CardTitle>Job Logs</CardTitle></CardHeader><CardContent><EmptyState title="No logs available" description="Execution logs and events will be listed here." /></CardContent></Card>
        </div>
      </div>
    </BaseView>
  );
}