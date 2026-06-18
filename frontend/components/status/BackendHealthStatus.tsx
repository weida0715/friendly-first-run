'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiClientError, type BackendHealthResponse, getBackendHealth } from '@/lib/api/client';

type HealthState =
  | { status: 'loading' }
  | { status: 'healthy'; data: BackendHealthResponse }
  | { status: 'error'; message: string };

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return `${error.message} (${error.status})`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unable to reach backend health endpoint';
}

export function BackendHealthStatus() {
  const [state, setState] = useState<HealthState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    getBackendHealth()
      .then((data) => {
        if (!active) return;
        setState({ status: 'healthy', data });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ status: 'error', message: getErrorMessage(error) });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <Card className="bg-gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Backend Health
        </CardTitle>
        <CardDescription>Live diagnostic check against the Flask API.</CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking backend status...
          </div>
        )}

        {state.status === 'healthy' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                {state.data.status}
              </Badge>
              <Badge variant="outline">v{state.data.version}</Badge>
              <Badge variant="secondary">{state.data.environment}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{state.data.service}</p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Backend unavailable
            </div>
            <p>{state.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}