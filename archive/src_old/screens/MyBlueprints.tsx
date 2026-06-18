"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { mockApiBlueprints } from '@/data/app-data';
import {
  ApiBlueprintRecord,
  BlueprintDefinition,
  getUserFavoritedBlueprints,
  getUserOwnedBlueprints,
  mapApiBlueprint,
} from '@/lib/data-utils';
import {
  FileCode,
  Heart,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Layers,
  Shapes,
  Cpu,
  Pencil,
  Eye,
} from 'lucide-react';

function BlueprintCard({
  blueprint,
  showOwner = false,
  canEdit = false,
}: {
  blueprint: BlueprintDefinition;
  showOwner?: boolean;
  canEdit?: boolean;
}) {
  const authorLabel = blueprint.authorUsername ?? 'loop-api';
  const indicatorCount = Object.keys(blueprint.indicators).length;
  const featureCount = Object.keys(blueprint.features).length;

  return (
    <Card className="bg-gradient-card">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{blueprint.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs">v{blueprint.version}</span>
              {showOwner && (
                <>
                  <span>•</span>
                  <span>by @{authorLabel}</span>
                </>
              )}
            </CardDescription>
          </div>
          <Badge variant={blueprint.category === 'Literature' ? 'default' : 'outline'}>{blueprint.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{blueprint.description}</p>
        <div className="grid gap-2 text-xs sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{indicatorCount} Indicators</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1">
            <Shapes className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{featureCount} Features</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1">
            <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{blueprint.referenceModel.family}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {blueprint.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="font-mono">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <Badge variant="outline" className="font-mono">
            {blueprint.type === 'manifest' ? 'Manifest' : 'Custom'}
          </Badge>
          <Badge variant="outline">{blueprint.status}</Badge>
          {blueprint.approvalStatus && (
            <Badge variant="outline">{blueprint.approvalStatus}</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link href={`/blueprints/${blueprint.id}`}>
              <Eye className="h-3.5 w-3.5" />
              View
            </Link>
          </Button>
          {canEdit && (
            <Button asChild variant="default" size="sm" className="gap-1">
              <Link href={`/blueprints/new?edit=${blueprint.id}`}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1">{description}</p>
      <Link href="/public-hub">
        <Button variant="outline" className="mt-4">
          Browse Public Hub
        </Button>
      </Link>
    </div>
  );
}

export default function MyBlueprints() {
  const { user } = useAuth();
  const userId = user?.id || '';
  const username = user?.username || '';
  const [search, setSearch] = useState('');
  const [blueprints, setBlueprints] = useState<BlueprintDefinition[]>([]);

  useEffect(() => {
    let active = true;
    const loadBlueprints = () => {
      const mapped = mockApiBlueprints().map((blueprint) => mapApiBlueprint(blueprint as ApiBlueprintRecord));
      if (!active) return;
      setBlueprints(mapped);
    };
    loadBlueprints();
    return () => {
      active = false;
    };
  }, []);

  const ownedBlueprints = useMemo(() => getUserOwnedBlueprints(blueprints, userId, username), [blueprints, userId, username]);
  const favoritedBlueprints = useMemo(() => getUserFavoritedBlueprints(blueprints, userId), [blueprints, userId]);

  const filterBySearch = (blueprints: BlueprintDefinition[]) => {
    if (!search) return blueprints;
    const q = search.toLowerCase();
    return blueprints.filter((blueprint) =>
      blueprint.name.toLowerCase().includes(q) ||
      blueprint.description.toLowerCase().includes(q) ||
      blueprint.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  };

  const filteredOwned = filterBySearch(ownedBlueprints);
  const filteredFavorited = filterBySearch(favoritedBlueprints);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Blueprints</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your Blueprints and discover new Blueprint templates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/blueprints/new">
                <PlusCircle className="h-4 w-4" />
                New Blueprint
              </Link>
            </Button>
            <Button asChild variant="hero" className="gap-2">
              <Link href="/public-hub">
                <Sparkles className="h-4 w-4" />
                Explore Public Hub
              </Link>
            </Button>
          </div>
        </div>

        <Card className="mb-6 bg-gradient-card">
          <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search your Blueprints by name, tag, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Reference Blueprints follow the Single-File Decoder guidelines.
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <Card className="bg-gradient-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileCode className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{ownedBlueprints.length}</p>
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
                  <p className="text-2xl font-bold">{favoritedBlueprints.length}</p>
                  <p className="text-sm text-muted-foreground">Favorited</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="owned" className="space-y-6">
          <TabsList>
            <TabsTrigger value="owned" className="gap-2">
              <FileCode className="h-4 w-4" />
              Owned ({ownedBlueprints.length})
            </TabsTrigger>
            <TabsTrigger value="favorited" className="gap-2">
              <Heart className="h-4 w-4" />
              Favorited ({favoritedBlueprints.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owned" className="space-y-4">
            {filteredOwned.length === 0 ? (
              <EmptyState
                icon={FileCode}
                title="No Blueprints yet"
                description="Create your first Blueprint to start experimenting."
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredOwned.map((blueprint) => (
                  <BlueprintCard
                    key={blueprint.id}
                    blueprint={blueprint}
                    canEdit
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorited" className="space-y-4">
            {filteredFavorited.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No favorites yet"
                description="Favorite Blueprints in the Public Hub to access them here."
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredFavorited.map((blueprint) => (
                  <BlueprintCard key={blueprint.id} blueprint={blueprint} showOwner />
                ))}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}