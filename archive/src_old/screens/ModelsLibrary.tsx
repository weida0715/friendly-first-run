"use client";

import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockApiExperiments, mockApiModels, mockApiUsers } from '@/data/app-data';
import {
  ApiExperimentRecord,
  ApiModelRecord,
  ApiUserRecord,
  ModelResult,
  createUserLookup,
  getUserFavoritedModels,
  getUserOwnedModels,
  mapApiExperiment,
  mapApiModel,
} from '@/lib/data-utils';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { 
  Heart, 
  Boxes,
  Download,
  Beaker,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

function ModelCard({ model, showOwner = false }: { model: ModelResult; showOwner?: boolean }) {
  const handleDownload = () => {
    toast.success(`Downloading logs for ${model.modelName}`);
  };

  const handleCreateExperiment = () => {
    toast.success(`Creating experiment from ${model.modelName} blueprint`);
  };

  return (
    <Card className="bg-gradient-card">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{model.modelName}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs">{model.code}</span>
              {showOwner && (
                <>
                  <span>•</span>
                  <span>by @{model.ownerUsername}</span>
                </>
              )}
            </CardDescription>
          </div>
          <Badge variant="outline">{model.blueprintType}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-lg font-semibold">
              {(model.metrics.testAccuracy * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-success">
              {model.metrics.sharpe.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Sharpe</p>
          </div>
          <div>
            <p className="text-lg font-semibold">
              {model.metrics.totalReturn.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Return</p>
          </div>
          <div>
            <p className="text-lg font-semibold">
              {(model.metrics.winRate * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <Link href={`/models/${model.id}`}>
            <Button variant="outline" size="sm" className="gap-1">
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-1" onClick={handleCreateExperiment}>
            <Beaker className="h-3.5 w-3.5" />
            New Experiment
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
            Logs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, title, description }: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center py-12">
      <Icon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1">{description}</p>
      <Link href="/public-hub">
        <Button variant="outline" className="mt-4">
          Browse Public Models
        </Button>
      </Link>
    </div>
  );
}

export default function ModelsLibrary() {
  const { user, isAdmin, isStaff } = useAuth();
  const userId = user?.id || '';
  const username = user?.username || '';
  const [models, setModels] = useState<ModelResult[]>([]);

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
    };
    loadModels();
    return () => {
      active = false;
    };
  }, []);

  const ownedModels = (isAdmin || isStaff)
    ? models
    : getUserOwnedModels(models, userId, username);
  const favoritedModels = getUserFavoritedModels(models, userId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Models Library</h1>
          <p className="mt-1 text-muted-foreground">
            {isAdmin || isStaff
              ? 'Manage all models across the platform'
              : 'Manage your owned and favorited models'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-gradient-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Boxes className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{ownedModels.length}</p>
                  <p className="text-sm text-muted-foreground">Owned</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{favoritedModels.length}</p>
                  <p className="text-sm text-muted-foreground">Favorited</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="owned" className="space-y-6">
          <TabsList>
            <TabsTrigger value="owned" className="gap-2">
              <Boxes className="h-4 w-4" />
              Owned ({ownedModels.length})
            </TabsTrigger>
            <TabsTrigger value="favorited" className="gap-2">
              <Heart className="h-4 w-4" />
              Favorited ({favoritedModels.length})
            </TabsTrigger>
          </TabsList>

          {/* Owned Models */}
          <TabsContent value="owned" className="space-y-4">
            {ownedModels.length === 0 ? (
              <EmptyState 
                icon={Boxes}
                title="No owned models yet"
                description="Create experiments to generate your own models"
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {ownedModels.map(model => (
                  <ModelCard key={model.id} model={model} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Favorited Models */}
          <TabsContent value="favorited" className="space-y-4">
            {favoritedModels.length === 0 ? (
              <EmptyState 
                icon={Heart}
                title="No favorited models yet"
                description="Favorite models to quickly find them later"
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {favoritedModels.map(model => (
                  <ModelCard key={model.id} model={model} showOwner />
                ))}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
