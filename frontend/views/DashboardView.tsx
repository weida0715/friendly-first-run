"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, ArrowRight, BarChart3, FileCode, FlaskConical, Layers, TrendingUp } from 'lucide-react';
import { BaseView } from './BaseView';
import { BackendHealthStatus } from '@/components/status/BackendHealthStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/states/EmptyState';
import { LoadingState } from '@/components/states/LoadingState';
import { StatusBadge } from '@/components/status/StatusBadge';
import { BTCUSDTPriceChart, useBTCUSDTChartData } from '@/components/charts';
import { useAuth } from '@/lib/auth/useAuth';
import { getModelRankings, listExperiments, listOwnedBlueprints } from '@/lib/api/client';

type DashboardItem = { id: string; label: string; meta?: string; status?: string };

interface DashboardWidget<T> {
  loading?: boolean;
  items: T[];
}

interface DashboardData {
  totalExperiments: number;
  totalModels: number;
  approvedBlueprints: number;
  market: { loading?: boolean; price: string; change24h: string; status: string };
}

export interface DashboardViewProps {
  data?: Partial<DashboardData>;
}

const defaultData: DashboardData = {
  totalExperiments: 0,
  totalModels: 0,
  approvedBlueprints: 0,
  market: { price: '69,842.50', change24h: '+1.84%', status: 'active' },
};

export function DashboardView({ data }: DashboardViewProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData>({ ...defaultData, ...data, market: { ...defaultData.market, ...data?.market } });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const marketChart = useBTCUSDTChartData();

  useEffect(() => {
    let active = true;
    (async () => {
      const [experimentsResult, modelsResult, blueprintsResult] = await Promise.allSettled([
        listExperiments(),
        getModelRankings({ pageSize: 1 }),
        listOwnedBlueprints({ status: 'Approved' }),
      ]);
      if (!active) return;
      const nextStats = {
        totalExperiments: experimentsResult.status === 'fulfilled' ? experimentsResult.value.data?.items?.length ?? 0 : defaultData.totalExperiments,
        totalModels: modelsResult.status === 'fulfilled' ? modelsResult.value.data?.total ?? modelsResult.value.data?.items?.length ?? 0 : defaultData.totalModels,
        approvedBlueprints: blueprintsResult.status === 'fulfilled' ? blueprintsResult.value.data?.items?.length ?? 0 : defaultData.approvedBlueprints,
      };
      setDashboard((current) => ({ ...current, ...nextStats }));
      const failures = [experimentsResult, modelsResult, blueprintsResult].filter((result) => result.status === 'rejected');
      if (failures.length) {
        setStatsError('Some dashboard stats failed to load');
      }
      if (active) setLoadingStats(false);
    })();
    return () => {
      active = false;
    };
  }, []);
  const formatCompact = (value: number) => {
    if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
    if (value >= 1000) return `${Math.round(value / 100) / 10}k`;
    return String(value);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace('/login');
      setIsLoggingOut(false);
    }
  };

  return (
    <BaseView
      title="Dashboard"
      description="Monitor market context, experiment status, and quick actions."
      actions={
        <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? 'Signing out...' : 'Sign out'}
        </Button>
      }
    >
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Experiments</CardTitle>
            <FlaskConical className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loadingStats ? '—' : dashboard.totalExperiments.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">All experiments you can access</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Models</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loadingStats ? '—' : formatCompact(dashboard.totalModels)}</p>
            <p className="text-xs text-muted-foreground">Ranked models in the library</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Approved Blueprints</CardTitle>
            <FileCode className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loadingStats ? '—' : dashboard.approvedBlueprints.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Approved blueprints you own</p>
          </CardContent>
        </Card>
      </div>

      {statsError ? <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{statsError}</div> : null}

      <div className="mb-4">
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>BTCUSDT Market Status</CardTitle>
            <CardDescription>Cached BTCUSDT 1m candles from local market-data storage.</CardDescription>
          </CardHeader>
          <CardContent>
            <BTCUSDTPriceChart
              data={marketChart.data}
              loading={dashboard.market.loading || marketChart.loading}
              error={marketChart.error}
              height={300}
              onRequestOlder={marketChart.loadOlder}
            />
            {!dashboard.market.loading ? (
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>24h: {dashboard.market.change24h}</span>
                <StatusBadge status={dashboard.market.status} label={dashboard.market.status} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-1">
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump to common workflows and continue where you left off.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/experiments/new" className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3 transition-colors hover:border-primary/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary"><FlaskConical className="h-4 w-4" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Create Experiment</p>
                <p className="text-xs text-muted-foreground">Launch a new run quickly</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/experiments" className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3 transition-colors hover:border-primary/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary"><Activity className="h-4 w-4" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Browse Experiments</p>
                <p className="text-xs text-muted-foreground">Open the full experiment list</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/blueprints/new" className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3 transition-colors hover:border-primary/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10 text-amber-500"><FileCode className="h-4 w-4" /></div>
              <div className="flex-1"><p className="text-sm font-medium">Create Blueprint</p><p className="text-xs text-muted-foreground">Define strategy architecture</p></div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/models" className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3 transition-colors hover:border-primary/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500"><BarChart3 className="h-4 w-4" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium">View Rankings</p>
                <p className="text-xs text-muted-foreground">Inspect model leaderboard</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild variant="outline"><Link href="/blueprints"><Layers className="mr-2 h-4 w-4" />Open Blueprints</Link></Button>
              <Button asChild variant="outline"><Link href="/jobs">Open Jobs</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <BackendHealthStatus />
      </div>
    </BaseView>
  );
}
