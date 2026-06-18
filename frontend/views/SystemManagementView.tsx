"use client";

import { useEffect, useState } from 'react';
import { BaseView } from './BaseView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/states/EmptyState';
import { getActiveQueueSnapshot, getSystemSettings, updateSystemSettings } from '@/lib/api/client';

type QueueJob = {
  job_id: string;
  state: string;
  queue_name?: string;
  position?: number | null;
};

type QueueSnapshot = {
  queue_depth: number;
  running_jobs: number;
  active_jobs_total: number;
  active_jobs: QueueJob[];
};

export function SystemManagementView() {
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);
  const [settings, setSettings] = useState<Record<string, number>>({});
  const [timeoutSeconds, setTimeoutSeconds] = useState('');
  const [maxPermutations, setMaxPermutations] = useState('');
  const [maxRoundLogs, setMaxRoundLogs] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [queueResponse, settingsResponse] = await Promise.all([getActiveQueueSnapshot(), getSystemSettings()]);
      if (active) {
        setSnapshot((queueResponse.data?.queue as QueueSnapshot | undefined) ?? null);
        const nextSettings = settingsResponse.data?.settings ?? {};
        setSettings(nextSettings);
        setTimeoutSeconds(String(nextSettings.queue_job_timeout_seconds ?? 21600));
        setMaxPermutations(String(nextSettings.max_requested_permutations ?? 500));
        setMaxRoundLogs(String(nextSettings.max_round_log_rows ?? 0));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const activeJobs = snapshot?.active_jobs ?? [];

  const saveSettings = async () => {
    setSaveMessage(null);
    const response = await updateSystemSettings({
      queue_job_timeout_seconds: Number(timeoutSeconds),
      max_requested_permutations: Number(maxPermutations),
      max_round_log_rows: Number(maxRoundLogs),
    });
    const nextSettings = response.data?.settings ?? {};
    setSettings(nextSettings);
    setTimeoutSeconds(String(nextSettings.queue_job_timeout_seconds ?? 21600));
    setMaxPermutations(String(nextSettings.max_requested_permutations ?? 500));
    setMaxRoundLogs(String(nextSettings.max_round_log_rows ?? 0));
    setSaveMessage('System settings saved.');
  };

  return (
    <BaseView
      title="System Management"
      description="Monitor system health and operational settings."
      actions={<div className="flex gap-2"><Button variant="outline">Refresh</Button><Button variant="outline">Export Health Snapshot</Button></div>}
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">System Status</p><p className="text-2xl font-bold">Healthy</p></CardContent></Card>
          <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Queue Depth</p><p className="text-2xl font-bold">{snapshot?.queue_depth ?? 0}</p></CardContent></Card>
          <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Running Jobs</p><p className="text-2xl font-bold">{snapshot?.running_jobs ?? 0}</p></CardContent></Card>
          <Card className="bg-gradient-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Errors (24h)</p><p className="text-2xl font-bold">0</p></CardContent></Card>
        </div>

        <Card className="bg-gradient-card">
          <CardHeader><CardTitle>Operational Controls</CardTitle><CardDescription>Admin-managed runtime limits for queue timeout, permutations, and logging.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Input value={timeoutSeconds} onChange={(event) => setTimeoutSeconds(event.target.value)} placeholder="Queue job timeout seconds" />
              <Input value={maxPermutations} onChange={(event) => setMaxPermutations(event.target.value)} placeholder="Max requested permutations" />
              <Input value={maxRoundLogs} onChange={(event) => setMaxRoundLogs(event.target.value)} placeholder="Max round log rows" />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={saveSettings}>Save system settings</Button>
              {saveMessage ? <span className="text-sm text-muted-foreground">{saveMessage}</span> : null}
            </div>
            <p className="text-xs text-muted-foreground">Current timeout: {settings.queue_job_timeout_seconds ?? 21600}s · permutation cap: {settings.max_requested_permutations ?? 500} · round logs: {settings.max_round_log_rows ?? 0}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-gradient-card">
            <CardHeader><CardTitle>Job Queue Snapshot</CardTitle></CardHeader>
            <CardContent>
              {activeJobs.length === 0 ? (
                <EmptyState title="No queued jobs" description="Queued and running jobs will appear here." />
              ) : (
                <div className="space-y-2 text-sm">
                  {activeJobs.map((job) => (
                    <div key={job.job_id} className="flex items-center justify-between rounded border p-2">
                      <span>{job.job_id}</span>
                      <span>{job.state}</span>
                      <span>{job.position ?? '-'}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-gradient-card"><CardHeader><CardTitle>Recent Errors</CardTitle></CardHeader><CardContent><EmptyState title="No errors" description="System error events in the last 24 hours appear here." /></CardContent></Card>
        </div>
      </div>
    </BaseView>
  );
}