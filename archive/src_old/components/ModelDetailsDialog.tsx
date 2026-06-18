"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Zap } from 'lucide-react';
import { ModelResult } from '@/lib/data-utils';

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

export function ModelDetailsDialog({ model }: { model: ModelResult }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {model.modelName}
          </DialogTitle>
          <DialogDescription>
            <span>From experiment: {model.experimentName}</span>
            <span className="mx-2">•</span>
            <span>SFM: {model.sfmType}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="metrics" className="mt-4">
          <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="indicators">Indicators & Features</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-background/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Train:</span>
                      <span className="font-mono text-success">{formatPercent(model.metrics.trainAccuracy)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Validation:</span>
                      <span className="font-mono text-primary">{formatPercent(model.metrics.valAccuracy)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Test:</span>
                      <span className="font-mono font-bold">{formatPercent(model.metrics.testAccuracy)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Sharpe Ratio:</span>
                      <span className="font-mono">{formatNumber(model.metrics.sharpe)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Return:</span>
                      <span
                        className={`font-mono ${
                          model.metrics.totalReturn >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {formatNumber(model.metrics.totalReturn)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Drawdown:</span>
                      <span className="font-mono text-destructive">
                        {formatNumber(model.metrics.maxDrawdown)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Trading Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Win Rate:</span>
                      <span className="font-mono">{formatPercent(model.metrics.winRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trades:</span>
                      <span className="font-mono">{model.metrics.tradesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit Factor:</span>
                      <span className="font-mono">{formatNumber(model.metrics.profitFactor)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Data Split</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Train:</span>
                      <span className="font-mono">{model.dataSplit.train}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Validation:</span>
                      <span className="font-mono">{model.dataSplit.val}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Test:</span>
                      <span className="font-mono">{model.dataSplit.test}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-4">
            <Card className="bg-background/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Model Type: {model.sfmType}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(model.parameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="indicators" className="space-y-4">
            <Card className="bg-background/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(model.indicatorParams).map(([indicator, params]) => (
                    <div key={indicator} className="rounded-lg border border-border/50 p-3">
                      <p className="font-medium text-sm mb-2">{indicator.toUpperCase()}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(params).map(([param, value]) => (
                          <div key={param} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{param}:</span>
                            <span className="font-mono">{value}</span>
                          </div>
                        ))}
                        {Object.keys(params).length === 0 && (
                          <span className="text-xs text-muted-foreground">No parameters</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(model.featureParams).map(([feature, params]) => (
                    <div key={feature} className="rounded-lg border border-border/50 p-3">
                      <p className="font-medium text-sm mb-2">{feature.replace(/_/g, ' ')}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(params).map(([param, value]) => (
                          <div key={param} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{param}:</span>
                            <span className="font-mono">{String(value)}</span>
                          </div>
                        ))}
                        {Object.keys(params).length === 0 && (
                          <span className="text-xs text-muted-foreground">No parameters</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-2 mt-4 sm:flex-row">
          <Button asChild className="w-full sm:flex-1">
            <Link href={`/experiments/${model.experimentId}`}>View Experiment</Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:flex-1">
            <Link href={`/sfms/${model.sfmType}`}>View Blueprint</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ModelDetailsIconButton({ model }: { model: ModelResult }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {model.modelName}
          </DialogTitle>
          <DialogDescription>
            <span>From experiment: {model.experimentName}</span>
            <span className="mx-2">•</span>
            <span>SFM: {model.sfmType}</span>
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="metrics" className="mt-4">
          <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="indicators">Indicators & Features</TabsTrigger>
          </TabsList>
          <TabsContent value="metrics" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-background/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Train:</span>
                      <span className="font-mono text-success">{formatPercent(model.metrics.trainAccuracy)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Validation:</span>
                      <span className="font-mono text-primary">{formatPercent(model.metrics.valAccuracy)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Test:</span>
                      <span className="font-mono font-bold">{formatPercent(model.metrics.testAccuracy)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Sharpe Ratio:</span>
                      <span className="font-mono">{formatNumber(model.metrics.sharpe)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Return:</span>
                      <span
                        className={`font-mono ${
                          model.metrics.totalReturn >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {formatNumber(model.metrics.totalReturn)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Drawdown:</span>
                      <span className="font-mono text-destructive">
                        {formatNumber(model.metrics.maxDrawdown)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Trading Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Win Rate:</span>
                      <span className="font-mono">{formatPercent(model.metrics.winRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trades:</span>
                      <span className="font-mono">{model.metrics.tradesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit Factor:</span>
                      <span className="font-mono">{formatNumber(model.metrics.profitFactor)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Data Split</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Train:</span>
                      <span className="font-mono">{model.dataSplit.train}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Validation:</span>
                      <span className="font-mono">{model.dataSplit.val}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Test:</span>
                      <span className="font-mono">{model.dataSplit.test}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-4">
            <Card className="bg-background/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Model Type: {model.sfmType}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(model.parameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="indicators" className="space-y-4">
            <Card className="bg-background/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(model.indicatorParams).map(([indicator, params]) => (
                    <div key={indicator} className="rounded-lg border border-border/50 p-3">
                      <p className="font-medium text-sm mb-2">{indicator.toUpperCase()}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(params).map(([param, value]) => (
                          <div key={param} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{param}:</span>
                            <span className="font-mono">{value}</span>
                          </div>
                        ))}
                        {Object.keys(params).length === 0 && (
                          <span className="text-xs text-muted-foreground">No parameters</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(model.featureParams).map(([feature, params]) => (
                    <div key={feature} className="rounded-lg border border-border/50 p-3">
                      <p className="font-medium text-sm mb-2">{feature.replace(/_/g, ' ')}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(params).map(([param, value]) => (
                          <div key={param} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{param}:</span>
                            <span className="font-mono">{String(value)}</span>
                          </div>
                        ))}
                        {Object.keys(params).length === 0 && (
                          <span className="text-xs text-muted-foreground">No parameters</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-2 mt-4 sm:flex-row">
          <Button asChild className="w-full sm:flex-1">
            <Link href={`/experiments/${model.experimentId}`}>View Experiment</Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:flex-1">
            <Link href={`/sfms/${model.sfmType}`}>View Blueprint</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
