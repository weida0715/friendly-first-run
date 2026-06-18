"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { mockApiExperiments, mockApiUsers } from '@/data/app-data';
import { ApiExperimentRecord, ApiUserRecord, ExperimentRun, createUserLookup, mapApiExperiment } from '@/lib/data-utils';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  FlaskConical,
  FileCode,
  TrendingUp,
  XCircle,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { mode } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedChartType, setSelectedChartType] = useState('1D');
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [experiments, setExperiments] = useState<ExperimentRun[]>([]);

  useEffect(() => {
    let active = true;
    const loadExperiments = () => {
      if (!user?.id) {
        setExperiments([]);
        return;
      }
      const userLookup = createUserLookup(mockApiUsers() as ApiUserRecord[]);
      const mappedExperiments = mockApiExperiments().map((exp) =>
        mapApiExperiment(exp as ApiExperimentRecord, userLookup)
      );
      if (!active) return;
      setExperiments(mappedExperiments);
    };

    loadExperiments();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const totalRuns = experiments.length;
  const completedRuns = experiments.filter((e) => e.status === 'completed').length;
  const runningRuns = experiments.filter((e) => e.status === 'running').length;
  const successRate = totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0;

  const bestRun = experiments
    .filter((e) => e.results)
    .sort((a, b) => (b.results?.sharpe || 0) - (a.results?.sharpe || 0))[0];
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    container.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'BINANCE:BTCUSDT',
      interval: selectedChartType,
      timezone: 'Etc/UTC',
      theme: mode === 'dark' ? 'dark' : 'light',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: false,
      hide_side_toolbar: false,
      withdateranges: true,
      studies: [],
      support_host: 'https://www.tradingview.com',
    });

    script.onload = () => setIsWidgetReady(true);
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [selectedChartType, mode]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
            <p className="mt-1 text-muted-foreground">
              Here's an overview of your research experiments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/experiments/new">
              <Button variant="hero" className="gap-2">
                <FlaskConical className="h-4 w-4" />
                Start New Experiment
              </Button>
            </Link>
          </div>
        </div>

        {/* TradingView Embed */}
        <Card className="mb-8 bg-gradient-card">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>BTCUSDT Market View</CardTitle>
              <CardDescription>Embedded Binance spot feed with flexible chart modes</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: '1', label: '1m' },
                { value: '5', label: '5m' },
                { value: '15', label: '15m' },
                { value: '60', label: '1h' },
                { value: '240', label: '4h' },
                { value: '1D', label: '1D' },
              ].map((interval) => (
                <Button
                  key={interval.value}
                  size="sm"
                  variant={selectedChartType === interval.value ? 'default' : 'outline'}
                  onClick={() => {
                    setIsWidgetReady(false);
                    setSelectedChartType(interval.value);
                  }}
                >
                  {interval.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div
              ref={containerRef}
              className="relative h-[480px] w-full overflow-hidden rounded-lg border border-border bg-background/50"
            />
            {!isWidgetReady && (
              <div className="mt-3 text-xs text-muted-foreground">
                Loading TradingView widget...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Runs
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalRuns}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {runningRuns} currently running
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{successRate.toFixed(0)}%</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {completedRuns} of {totalRuns} completed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Latest Status
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {experiments[0]?.status === 'running' ? (
                  <>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    <span className="text-lg font-semibold text-primary">Running</span>
                  </>
                ) : experiments[0]?.status === 'completed' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-lg font-semibold text-success">Completed</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-lg font-semibold text-destructive">Failed</span>
                  </>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {experiments[0]?.name}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Best Sharpe
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {bestRun?.results?.sharpe.toFixed(2) || '-'}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {bestRun?.name || 'No completed runs'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Experiments + Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Recent Experiments</CardTitle>
              <CardDescription>Your latest research runs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {experiments.slice(0, 4).map((exp) => (
                  <Link
                    key={exp.id}
                    href={`/experiments/${exp.id}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-4 transition-colors hover:border-primary/50 hover:bg-background"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          exp.status === 'completed'
                            ? 'bg-success/10 text-success'
                            : exp.status === 'running'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {exp.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : exp.status === 'running' ? (
                          <Activity className="h-5 w-5 animate-pulse" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{exp.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {exp.config.symbol} • {exp.config.interval}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
              <Link href="/experiments">
                <Button variant="ghost" className="mt-4 w-full">
                  View All Experiments
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Jump into your workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Link href="/experiments/new">
                <div className="flex items-center gap-4 rounded-lg border border-border bg-background/50 p-4 transition-colors hover:border-primary/50 hover:bg-background">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">New Experiment</p>
                    <p className="text-sm text-muted-foreground">
                      Submit runs from any device; desktop is best for tuning
                    </p>
                  </div>
                </div>
              </Link>

              <Link href="/public-hub">
                <div className="flex items-center gap-4 rounded-lg border border-border bg-background/50 p-4 transition-colors hover:border-primary/50 hover:bg-background">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Open Public Hub</p>
                    <p className="text-sm text-muted-foreground">
                      Discover users, experiments, models, and Blueprints
                    </p>
                  </div>
                </div>
              </Link>

              <Link href="/blueprints/new">
                <div className="flex items-center gap-4 rounded-lg border border-border bg-background/50 p-4 transition-colors hover:border-primary/50 hover:bg-background">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                    <FileCode className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">New Blueprint</p>
                    <p className="text-sm text-muted-foreground">
                      Define indicators, features, and reference architecture
                    </p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
