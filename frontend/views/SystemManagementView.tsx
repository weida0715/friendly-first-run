"use client";

import { useEffect, useMemo, useState } from 'react';
import { BaseView } from './BaseView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/states/EmptyState';
import { getActiveQueueSnapshot, getSystemEvents, getSystemEventsDownloadUrl, getSystemSettings, updateSystemSettings } from '@/lib/api/client';

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

const SYSTEM_TERMINAL_REFRESH_MS = 5000;
const SYSTEM_TERMINAL_FETCH_LIMIT = 5000;
const SYSTEM_TERMINAL_VISIBLE_LIMIT = 5000;

export function SystemManagementView() {
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);
  const [settings, setSettings] = useState<Record<string, number>>({});
  const [timeoutSeconds, setTimeoutSeconds] = useState('');
  const [maxPermutations, setMaxPermutations] = useState('');
  const [maxRoundLogs, setMaxRoundLogs] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [events, setEvents] = useState<Array<Record<string, unknown>>>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;
    (async () => {
      const [queueResponse, settingsResponse, eventsResponse] = await Promise.all([getActiveQueueSnapshot(), getSystemSettings(), getSystemEvents(undefined, SYSTEM_TERMINAL_FETCH_LIMIT)]);
      if (active) {
        setSnapshot((queueResponse.data?.queue as QueueSnapshot | undefined) ?? null);
        const nextSettings = settingsResponse.data?.settings ?? {};
        setSettings(nextSettings);
        setTimeoutSeconds(String(nextSettings.queue_job_timeout_seconds ?? 21600));
        setMaxPermutations(String(nextSettings.max_requested_permutations ?? 500));
        setMaxRoundLogs(String(nextSettings.max_round_log_rows ?? 0));
        setEvents((eventsResponse.data?.items ?? []) as Array<Record<string, unknown>>);
      }
    })();
    timer = setInterval(() => {
      if (active) setRefreshTick((tick) => tick + 1);
    }, SYSTEM_TERMINAL_REFRESH_MS);
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getSystemEvents(undefined, SYSTEM_TERMINAL_FETCH_LIMIT).then((response) => {
      if (!cancelled) {
        setEvents((response.data?.items ?? []) as Array<Record<string, unknown>>);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const activeJobs = snapshot?.active_jobs ?? [];
  const terminalRows = useMemo(() => events.map((event) => {
    const scope = String(event.scope ?? 'system').toLowerCase();
    const action = String(event.action ?? 'event');
    const actor = String(event.actor ?? 'system');
    const message = String(event.message ?? '');
    const timestamp = String(event.createdAt ?? '');
    const statusMatch = action.match(/->\s*(\d{3})/);
    const status = statusMatch ? Number(statusMatch[1]) : null;
    const color =
      scope === 'auth' ? 'text-cyan-300' :
      scope === 'authentication' ? 'text-cyan-300' :
      scope === 'users' ? 'text-amber-300' :
      scope === 'user' ? 'text-amber-300' :
      scope === 'experiments' ? 'text-fuchsia-300' :
      scope === 'experiment' ? 'text-fuchsia-300' :
      scope === 'blueprint' ? 'text-emerald-300' :
      scope === 'blueprints' ? 'text-emerald-300' :
      scope === 'blueprints_library' ? 'text-emerald-300' :
      scope === 'models' ? 'text-sky-300' :
      scope === 'model' ? 'text-sky-300' :
      scope === 'market_data' ? 'text-violet-300' :
      scope === 'system' ? 'text-lime-300' :
      scope === 'jobs' ? 'text-yellow-300' :
      scope === 'job' ? 'text-yellow-300' :
      scope === 'docs' ? 'text-teal-300' :
      scope === 'documentation' ? 'text-teal-300' :
      scope === 'hub' ? 'text-pink-300' :
      scope === 'queue' ? 'text-orange-300' :
      'text-slate-200';
    const badge =
      status && status >= 500 ? 'text-red-300' :
      status && status >= 400 ? 'text-orange-300' :
      status && status >= 300 ? 'text-yellow-300' :
      status && status >= 200 ? 'text-emerald-300' :
      status && status >= 100 ? 'text-cyan-300' :
      'text-slate-300';

    return { key: String(event.id ?? timestamp ?? action), scope, actor, action, message, timestamp, color, badge };
  }), [events]);
  const visibleEvents = terminalRows.slice(0, SYSTEM_TERMINAL_VISIBLE_LIMIT);

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

        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>System Terminal</CardTitle>
              <CardDescription>Persisted system events showing who did what and when.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <a href={getSystemEventsDownloadUrl()} download>Download Log</a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {visibleEvents.length === 0 ? (
              <EmptyState title="No system events" description="Administrative actions will appear here once recorded." />
            ) : (
              <div className="max-h-[30rem] overflow-y-auto rounded-md border bg-black p-4 font-mono text-xs leading-5 text-slate-100">
                <div className="space-y-2">
                  {visibleEvents.map((row) => (
                    <div key={row.key} className="whitespace-pre-wrap">
                      <span className="text-slate-400">[{row.timestamp}]</span>{' '}
                      <span className={row.color}>{row.scope.toUpperCase()}</span>{' '}
                      <span className={row.badge}>{row.action}</span>{' '}
                      <span className="text-slate-300">::</span>{' '}
                      <span className="text-slate-200">{row.actor}</span>{' '}
                      <span className="text-slate-300">::</span>{' '}
                      <span className="text-slate-100">{row.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {events.length > SYSTEM_TERMINAL_VISIBLE_LIMIT ? <p className="mt-2 text-xs text-muted-foreground">Showing the newest {SYSTEM_TERMINAL_VISIBLE_LIMIT} events. Use Download Log for the full trace.</p> : null}
          </CardContent>
        </Card>
      </div>
    </BaseView>
  );
}
