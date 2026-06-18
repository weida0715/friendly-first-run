"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockApiBlueprints } from '@/data/app-data';
import { ApiBlueprintRecord, BlueprintDefinition, mapApiBlueprint } from '@/lib/data-utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  FileCode,
  Layers,
  Shapes,
  Cpu,
  Tag,
  Sparkles,
} from 'lucide-react';

function resolveBlueprintMatch(blueprints: BlueprintDefinition[], id: string) {
  return (
    blueprints.find((blueprint) => blueprint.id === id) ||
    blueprints.find((blueprint) => blueprint.name.toLowerCase() === id.toLowerCase()) ||
    blueprints.find((blueprint) => blueprint.type.toLowerCase() === id.toLowerCase()) ||
    null
  );
}

export default function BlueprintDetail() {
  const params = useParams();
  const blueprintId = typeof params?.id === 'string' ? params.id : params?.id?.[0];
  const { user } = useAuth();
  const [blueprints, setBlueprints] = useState<BlueprintDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = () => {
      setIsLoading(true);
      const mapped = mockApiBlueprints().map((blueprint) => mapApiBlueprint(blueprint as ApiBlueprintRecord));
      if (!active) return;
      setBlueprints(mapped);
      setIsLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const blueprint = useMemo(() => {
    if (!blueprintId) return null;
    return resolveBlueprintMatch(blueprints, blueprintId);
  }, [blueprintId, blueprints]);

  const isOwner = useMemo(() => {
    if (!blueprint || !user) return false;
    return Boolean(
      (blueprint.authorId && blueprint.authorId === user.id) ||
        (blueprint.authorUsername && blueprint.authorUsername === user.username)
    );
  }, [blueprint, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8">
          <div className="text-center py-16 text-muted-foreground">Loading Blueprint details...</div>
        </main>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold">Blueprint Not Found</h1>
            <p className="mt-2 text-muted-foreground">We couldn't locate that Blueprint.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/blueprints">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blueprints
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="mb-6">
          <Link
            href="/blueprints"
            className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Blueprints
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold">{blueprint.name}</h1>
                <Badge variant={blueprint.category === 'Literature' ? 'default' : 'outline'}>
                  {blueprint.category}
                </Badge>
                <Badge variant="outline" className="font-mono">
                  v{blueprint.version}
                </Badge>
              </div>
              <p className="mt-2 text-muted-foreground">{blueprint.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>by @{blueprint.authorUsername ?? 'loop-api'}</span>
                <span>•</span>
                <span>{blueprint.status}</span>
                {blueprint.approvalStatus && (
                  <>
                    <span>•</span>
                    <span>{blueprint.approvalStatus}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link href="/blueprints">
                  <Sparkles className="h-4 w-4" />
                  Browse Blueprints
                </Link>
              </Button>
              {isOwner && (
                <>
                  <Button asChild className="gap-2">
                    <Link href={`/blueprints/new?edit=${blueprint.id}`}>
                      <FileCode className="h-4 w-4" />
                      Edit Blueprint
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Indicators
                </CardTitle>
                <CardDescription>Indicators included in this Blueprint.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(blueprint.indicators).map(([indicator, params]) => (
                    <div key={indicator} className="rounded-lg border border-border/60 p-3">
                      <p className="font-medium text-sm mb-2">{indicator.toUpperCase()}</p>
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

            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shapes className="h-5 w-5 text-primary" />
                  Features
                </CardTitle>
                <CardDescription>Feature set for the Blueprint pipeline.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(blueprint.features).map(([feature, params]) => (
                    <div key={feature} className="rounded-lg border border-border/60 p-3">
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
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-muted-foreground" />
                  Reference Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Fixed backend ML definition (stored in backend/docs). You can select it for Blueprints, but it cannot be edited here.
                </p>
                <div>
                  <p className="text-xs text-muted-foreground">Architecture</p>
                  <p className="font-medium">{blueprint.referenceModel.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Family</p>
                  <p className="font-mono text-sm">{blueprint.referenceModel.family}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Parameters</p>
                  <div className="mt-2 space-y-1">
                    {Object.entries(blueprint.referenceModel.params).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-mono">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {blueprint.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="font-mono">
                    {tag}
                  </Badge>
                ))}
                {blueprint.tags.length === 0 && (
                  <span className="text-xs text-muted-foreground">No tags provided.</span>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}