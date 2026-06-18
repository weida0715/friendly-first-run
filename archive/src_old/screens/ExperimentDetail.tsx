"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { mockApiExperiments, mockApiModels, mockApiUsers } from '@/data/app-data';
import { createUserLookup, mapApiExperiment, ApiExperimentRecord } from '@/lib/data-utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  LineChart,
  Settings,
  Target,
  XCircle,
  Download,
  FileCode,
} from 'lucide-react';
import { toast } from 'sonner';

type ApiExperimentDetail = {
  experiment_id: string;
  owner_user_id: string;
  name: string;
  description?: string | null;
  status?: string;
  visibility: string;
  market_symbol: string;
  exchange: string;
  data_interval: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  completed_at?: string | null;
  config_json?: {
    blueprint?: string;
    indicators?: string[];
    features?: string[];
  } | null;
  results_json?: {
    sharpe?: number;
    totalReturn?: number;
    maxDrawdown?: number;
    testAccuracy?: number;
    winRate?: number;
    tradesCount?: number;
    accuracy?: number;
  } | null;
};

type ApiModelRecord = {
  model_id: string;
  model_name: string;
  blueprint_type: string;
  visibility: string;
  training_state?: string;
  metrics_json?: {
    sharpe?: number;
    totalReturn?: number;
    maxDrawdown?: number;
    testAccuracy?: number;
    winRate?: number;
  } | null;
};

type ApiModelLogRecord = {
  log_id: string;
  log_type: string;
  storage_uri: string;
  payload_json?: Record<string, unknown> | null;
};

export default function ExperimentDetail() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : params?.id?.[0];
  const { user, isAdmin } = useAuth();
  const [experiment, setExperiment] = useState<ApiExperimentDetail | null>(null);
  const [modelsForExperiment, setModelsForExperiment] = useState<ApiModelRecord[]>([]);
  const [modelLogs, setModelLogs] = useState<ApiModelLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = () => {
      if (!id) return;
      setIsLoading(true);
      const userLookup = createUserLookup(mockApiUsers());
      const mappedExperiments = mockApiExperiments().map((exp) =>
        mapApiExperiment(exp as ApiExperimentRecord, userLookup)
      );
      const experimentRecord = mappedExperiments.find((exp) => exp.id === id);
      if (!active) return;
      const experimentData: ApiExperimentDetail | null = experimentRecord
        ? {
            experiment_id: experimentRecord.id,
            owner_user_id: experimentRecord.ownerId,
            name: experimentRecord.name,
            description: experimentRecord.description,
            status: experimentRecord.status.toUpperCase(),
            visibility: experimentRecord.visibility.toUpperCase(),
            market_symbol: experimentRecord.config.symbol,
            exchange: experimentRecord.config.exchange,
            data_interval: experimentRecord.config.interval,
            start_date: experimentRecord.config.dateRange.start,
            end_date: experimentRecord.config.dateRange.end,
            created_at: experimentRecord.createdAt.toISOString(),
            completed_at: experimentRecord.completedAt?.toISOString() || null,
            config_json: {
              blueprint: experimentRecord.config.blueprint,
              indicators: experimentRecord.config.indicators,
              features: experimentRecord.config.features,
            },
            results_json: experimentRecord.results
              ? {
                  sharpe: experimentRecord.results.sharpe,
                  totalReturn: experimentRecord.results.totalReturn,
                  maxDrawdown: experimentRecord.results.maxDrawdown,
                  testAccuracy: experimentRecord.results.accuracy,
                  winRate: experimentRecord.results.winRate,
                  tradesCount: experimentRecord.results.tradesCount,
                  accuracy: experimentRecord.results.accuracy,
                }
              : null,
          }
        : null;
      setExperiment(experimentData || null);

      const mappedModels = mockApiModels().filter((model) => model.experiment_id === id) as ApiModelRecord[];
      setModelsForExperiment(mappedModels);
      setModelLogs([
        {
          log_id: 'log-1',
          log_type: 'training',
          storage_uri: '/logs/training.log',
        },
      ]);
      setIsLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [id, user?.id]);

  const canView = experiment
    ? isAdmin || experiment.owner_user_id === user?.id || experiment.visibility === 'PUBLIC'
    : false;

  const downloadLog = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Clock className="mb-4 h-16 w-16 text-muted-foreground animate-pulse" />
            <h1 className="text-2xl font-bold">Loading experiment...</h1>
            <p className="mt-2 text-muted-foreground">Fetching experiment details.</p>
          </div>
        </main>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <XCircle className="mb-4 h-16 w-16 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Experiment Not Found</h1>
            <p className="mt-2 text-muted-foreground">
              The experiment you're looking for doesn't exist
            </p>
            <Link href="/experiments">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Experiments
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <XCircle className="mb-4 h-16 w-16 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Access Restricted</h1>
            <p className="mt-2 text-muted-foreground">
              You do not have permission to view this experiment.
            </p>
            <Link href="/experiments">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Experiments
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/experiments"
            className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Experiments
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{experiment.name}</h1>
                <Badge
                  className={
                    experiment.status === 'COMPLETED'
                      ? 'bg-success/10 text-success'
                      : experiment.status === 'RUNNING'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-destructive/10 text-destructive'
                  }
                >
                  {experiment.status?.toLowerCase()}
                </Badge>
              </div>
              {experiment.description && (
                <p className="mt-2 text-muted-foreground">{experiment.description}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Config & Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Results */}
            {experiment.results_json && (
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Results Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg bg-background/50 p-4">
                      <p className="text-sm text-muted-foreground">Average Sharpe Ratio</p>
                      <p className="text-2xl font-bold text-success">
                        {(modelsForExperiment.reduce((acc, model) => acc + (model.metrics_json?.sharpe ?? 0), 0) /
                          Math.max(modelsForExperiment.length, 1)).toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-background/50 p-4">
                      <p className="text-sm text-muted-foreground">Average Total Return</p>
                      <p className="text-2xl font-bold text-success">
                        {(modelsForExperiment.reduce((acc, model) => acc + (model.metrics_json?.totalReturn ?? 0), 0) /
                          Math.max(modelsForExperiment.length, 1)).toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-background/50 p-4">
                      <p className="text-sm text-muted-foreground">Average Max Drawdown</p>
                      <p className="text-2xl font-bold text-destructive">
                        {(modelsForExperiment.reduce((acc, model) => acc + (model.metrics_json?.maxDrawdown ?? 0), 0) /
                          Math.max(modelsForExperiment.length, 1)).toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-background/50 p-4">
                      <p className="text-sm text-muted-foreground">Average Accuracy</p>
                      <p className="text-2xl font-bold">
                        {(
                          (modelsForExperiment.reduce((acc, model) => acc + (model.metrics_json?.testAccuracy ?? 0), 0) /
                            Math.max(modelsForExperiment.length, 1)) *
                          100
                        ).toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-background/50 p-4">
                      <p className="text-sm text-muted-foreground">Average Win Rate</p>
                      <p className="text-2xl font-bold">
                        {(
                          (modelsForExperiment.reduce((acc, model) => acc + (model.metrics_json?.winRate ?? 0), 0) /
                            Math.max(modelsForExperiment.length, 1)) *
                          100
                        ).toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-background/50 p-4">
                      <p className="text-sm text-muted-foreground">Average Trades</p>
                      <p className="text-2xl font-bold">{experiment.results_json.tradesCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Model Performance Summary */}
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Model Performance Summary
                </CardTitle>
                <CardDescription>All models generated for this experiment</CardDescription>
              </CardHeader>
              <CardContent>
                {modelsForExperiment.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No models available yet.</div>
                ) : (
                  <div className="space-y-3">
                    {modelsForExperiment.map((model) => (
                      <div
                        key={model.model_id}
                        className="rounded-lg border border-border bg-background/50 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{model.model_name}</p>
                              <Badge variant="outline" className="font-mono text-xs">
                                {model.training_state?.toLowerCase()}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{model.blueprint_type}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                Accuracy {((model.metrics_json?.testAccuracy ?? 0) * 100).toFixed(1)}%
                              </span>
                              <span>Sharpe {(model.metrics_json?.sharpe ?? 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="mb-3 text-sm font-medium text-muted-foreground">Dataset</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-background/50 p-3">
                      <p className="text-xs text-muted-foreground">Symbol</p>
                      <p className="font-mono font-medium">{experiment.market_symbol}</p>
                    </div>
                    <div className="rounded-lg bg-background/50 p-3">
                      <p className="text-xs text-muted-foreground">Exchange</p>
                      <p className="font-mono font-medium">{experiment.exchange}</p>
                    </div>
                    <div className="rounded-lg bg-background/50 p-3">
                      <p className="text-xs text-muted-foreground">Interval</p>
                      <p className="font-mono font-medium">{experiment.data_interval}</p>
                    </div>
                    <div className="rounded-lg bg-background/50 p-3">
                      <p className="text-xs text-muted-foreground">Date Range</p>
                      <p className="font-mono text-sm">
                        {experiment.start_date ?? 'N/A'} → {experiment.end_date ?? 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                    Indicators & Features
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(experiment.config_json?.indicators || []).map((ind) => (
                      <Badge key={ind} variant="secondary" className="font-mono">
                        {ind}
                      </Badge>
                    ))}
                    {(experiment.config_json?.features || []).map((feat) => (
                      <Badge key={feat} variant="outline" className="font-mono">
                        {feat}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-medium text-muted-foreground">Model</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary/10 text-primary font-mono">
                      {experiment.config_json?.blueprint ?? 'blueprint'}
                    </Badge>
                    {experiment.config_json?.blueprint && (
                      <Button variant="outline" size="sm" asChild className="gap-2">
                        <Link href={`/blueprints/${experiment.config_json.blueprint}`}>
                          <FileCode className="h-4 w-4" />
                          View Blueprint
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Timeline & Logs */}
          <div className="space-y-6">
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(experiment.created_at).toLocaleDateString()} at{' '}
                      {new Date(experiment.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {experiment.completed_at && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Completed</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(experiment.completed_at).toLocaleDateString()} at{' '}
                        {new Date(experiment.completed_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Logs
                </CardTitle>
                <CardDescription>Recent experiment logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-auto rounded-lg bg-background/80 p-3 font-mono text-xs">
                  <p className="text-muted-foreground">[INFO] Experiment started</p>
                  <p className="text-muted-foreground">[INFO] Loading dataset...</p>
                  <p className="text-muted-foreground">[INFO] Generating features...</p>
                  <p className="text-primary">[INFO] Training model...</p>
                  {modelLogs.map((log) => (
                    <p key={log.log_id} className="text-muted-foreground">
                      [LOG] {log.log_type} • {log.storage_uri}
                    </p>
                  ))}
                  {experiment.status === 'COMPLETED' && (
                    <>
                      <p className="text-success">[SUCCESS] Model trained</p>
                      <p className="text-success">[SUCCESS] Evaluation complete</p>
                    </>
                  )}
                  {experiment.status === 'FAILED' && (
                    <p className="text-destructive">[ERROR] Training failed</p>
                  )}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      downloadLog(
                        `experiment-${experiment.experiment_id}-performance.log`,
                        `[PERF] ${experiment.name} Sharpe=${experiment.results_json?.sharpe ?? 'N/A'}`
                      );
                      toast.success('Performance log downloaded');
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Performance Log
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      downloadLog(
                        `experiment-${experiment.experiment_id}-confusion.log`,
                        `[CONFUSION] ${experiment.name} Accuracy=${experiment.results_json?.accuracy ?? 'N/A'}`
                      );
                      toast.success('Confusion log downloaded');
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Confusion Log
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-muted-foreground" />
                  Quick Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">Chart preview coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
