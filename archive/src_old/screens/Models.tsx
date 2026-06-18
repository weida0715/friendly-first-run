"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModelDetailsDialog } from '@/components/ModelDetailsDialog';
import { Award, BarChart3, Trophy, TrendingUp, Zap, Star } from 'lucide-react';
import { mockApiExperiments, mockApiModels, mockApiUsers } from '@/data/app-data';
import {
  ApiExperimentRecord,
  ApiModelRecord,
  ApiUserRecord,
  ModelResult,
  SortField,
  createUserLookup,
  mapApiExperiment,
  mapApiModel,
  rankModels,
} from '@/lib/data-utils';

function getRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        <Trophy className="w-3 h-3 mr-1" /> #1
      </Badge>
    );
  }
  if (rank === 2) {
    return (
      <Badge className="bg-gray-400/20 text-gray-300 border-gray-400/30">
        <Award className="w-3 h-3 mr-1" /> #2
      </Badge>
    );
  }
  if (rank === 3) {
    return (
      <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30">
        <Award className="w-3 h-3 mr-1" /> #3
      </Badge>
    );
  }
  return <Badge variant="outline">#{rank}</Badge>;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

const rankingMetrics: Array<{
  field: SortField;
  title: string;
  description: string;
  icon: typeof Trophy;
}> = [
  {
    field: 'sharpe',
    title: 'Sharpe Ratio',
    description: 'Risk-adjusted performance',
    icon: Trophy,
  },
  {
    field: 'totalReturn',
    title: 'Total Return',
    description: 'Percent return leaders',
    icon: TrendingUp,
  },
  {
    field: 'testAccuracy',
    title: 'Test Accuracy',
    description: 'Top classification scores',
    icon: BarChart3,
  },
  {
    field: 'winRate',
    title: 'Win Rate',
    description: 'Consistency across trades',
    icon: Award,
  },
];

function formatMetricValue(model: ModelResult, field: SortField) {
  switch (field) {
    case 'sharpe':
      return { value: formatNumber(model.metrics.sharpe), className: '' };
    case 'totalReturn':
      return {
        value: `${formatNumber(model.metrics.totalReturn)}%`,
        className: model.metrics.totalReturn >= 0 ? 'text-success' : 'text-destructive',
      };
    case 'testAccuracy':
      return { value: formatPercent(model.metrics.testAccuracy), className: '' };
    case 'winRate':
      return { value: formatPercent(model.metrics.winRate), className: '' };
    case 'profitFactor':
      return { value: formatNumber(model.metrics.profitFactor), className: '' };
    default:
      return { value: formatNumber(model.metrics.sharpe), className: '' };
  }
}

export default function Models() {
  const [models, setModels] = useState<ModelResult[]>([]);
  const [favoritedModelIds, setFavoritedModelIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let active = true;
    const loadModels = () => {
      const userLookup = createUserLookup(mockApiUsers() as ApiUserRecord[]);
      const mappedExperiments = mockApiExperiments().map((exp) =>
        mapApiExperiment(exp as ApiExperimentRecord, userLookup)
      );
      const experimentMap = new Map(mappedExperiments.map((exp) => [exp.id, exp] as const));
      const mappedModels = mockApiModels().map((model) =>
        mapApiModel(model as ApiModelRecord, experimentMap, userLookup)
      );
      if (!active) return;
      setModels(mappedModels);
      setFavoritedModelIds(new Set(mappedModels.filter((m) => m.favoritedBy.length > 0).map((m) => m.id)));
    };

    loadModels();
    return () => {
      active = false;
    };
  }, []);

  const baseModels = useMemo(
    () => models.filter((m) => m.status === 'validated'),
    [models]
  );

  const rankingGroups = useMemo(
    () =>
      rankingMetrics.map((metric) => ({
        ...metric,
        models: rankModels(baseModels, metric.field, 'desc').slice(0, 3),
      })),
    [baseModels]
  );

  const toggleFavorite = (model: ModelResult) => {
    setFavoritedModelIds((prev) => {
      const next = new Set(prev);
      if (next.has(model.id)) {
        next.delete(model.id);
      } else {
        next.add(model.id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Model Rankings
            </h1>
            <p className="mt-1 text-muted-foreground">
              Compare and rank your trained models by performance metrics
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/experiments/new">
              <Zap className="mr-2 h-4 w-4" />
              New Experiment
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {rankingGroups.map((group) => {
            const [lead, ...rest] = group.models;
            return (
              <Card key={group.field} className="bg-gradient-card overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <group.icon className="h-5 w-5 text-primary" />
                    {group.title}
                  </CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lead && (
                    <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Top ranked</p>
                          <p className="text-lg font-semibold">{lead.modelName}</p>
                          <p className="text-xs text-muted-foreground">{lead.experimentName}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-lg font-mono ${
                              formatMetricValue(lead, group.field).className
                            }`}
                          >
                            {formatMetricValue(lead, group.field).value}
                          </span>
                          {getRankBadge(1)}
                          <ModelDetailsDialog model={lead} />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => toggleFavorite(lead)}
                          >
                            <Star className="h-3.5 w-3.5" />
                            {favoritedModelIds.has(lead.id) ? 'Unfavorite' : 'Favorite'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {rest.map((model, index) => {
                      const metric = formatMetricValue(model, group.field);
                      return (
                        <div
                          key={model.id}
                          className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium">{model.modelName}</p>
                            <p className="text-xs text-muted-foreground">{model.experimentName}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-sm font-mono ${metric.className}`}>{metric.value}</span>
                            {getRankBadge(index + 2)}
                            <ModelDetailsDialog model={model} />
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => toggleFavorite(model)}
                            >
                              <Star className="h-3.5 w-3.5" />
                              {favoritedModelIds.has(model.id) ? 'Unfavorite' : 'Favorite'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
} 