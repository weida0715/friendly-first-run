"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ApiExperimentRecord,
  ApiModelRecord,
  ApiBlueprintRecord,
  ApiUserRecord,
  ExperimentRun,
  ModelResult,
  BlueprintDefinition,
  SortField,
  SortOrder,
  createUserLookup,
  getPublicModels,
  getPublicBlueprints,
  mapApiExperiment,
  mapApiModel,
  mapApiBlueprint,
  rankModels,
} from '@/lib/data-utils';
import { mockApiExperiments, mockApiModels, mockApiBlueprints, mockApiUsers } from '@/data/app-data';
import { ModelDetailsIconButton } from '@/components/ModelDetailsDialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  Users,
  Boxes,
  UserPlus,
  UserMinus,
  Eye,
  Star,
  FlaskConical,
  Calendar,
  FileCode,
  Sparkles,
  Layers,
  Shapes,
  Cpu,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PublicHub() {
  const { user, users, followUser, unfollowUser } = useAuth();
  const [userSearch, setUserSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [experimentSearch, setExperimentSearch] = useState('');
  const [blueprintSearch, setBlueprintSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [modelsPerPage, setModelsPerPage] = useState(10);
  const [modelSortField, setModelSortField] = useState<SortField>('createdAt');
  const [modelSortOrder, setModelSortOrder] = useState<SortOrder>('desc');
  const [modelPage, setModelPage] = useState(1);
  const [experimentPage, setExperimentPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [experimentResultsPerPage, setExperimentResultsPerPage] = useState(10);
  const [userResultsPerPage, setUserResultsPerPage] = useState(12);
  const [blueprintPage, setBlueprintPage] = useState(1);
  const [blueprintResultsPerPage, setBlueprintResultsPerPage] = useState(10);
  const [favoritedModelIds, setFavoritedModelIds] = useState<Set<string>>(() => new Set());
  const [experiments, setExperiments] = useState<ExperimentRun[]>([]);
  const [models, setModels] = useState<ModelResult[]>([]);
  const [blueprints, setBlueprints] = useState<BlueprintDefinition[]>([]);

  const publicModels = useMemo(() => getPublicModels(models), [models]);
  const publicBlueprints = useMemo(() => getPublicBlueprints(blueprints), [blueprints]);

  useEffect(() => {
    let active = true;
    const loadData = () => {
      const userLookup = createUserLookup(mockApiUsers() as ApiUserRecord[]);
      const mappedExperiments = mockApiExperiments()
        .map((exp) => mapApiExperiment(exp as ApiExperimentRecord, userLookup))
        .filter((exp) => exp.visibility === 'public');
      const experimentMap = new Map(mappedExperiments.map((exp) => [exp.id, exp] as const));
      const mappedModels = mockApiModels().map((model) =>
        mapApiModel(model as ApiModelRecord, experimentMap, userLookup)
      );
      const mappedBlueprints = mockApiBlueprints().map((blueprint) => mapApiBlueprint(blueprint as ApiBlueprintRecord));

      if (!active) return;
      setExperiments(mappedExperiments);
      setModels(mappedModels);
      setBlueprints(mappedBlueprints);
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    setFavoritedModelIds(new Set(publicModels.filter((m) => m.favoritedBy.includes(user.id)).map((m) => m.id)));
  }, [publicModels, user?.id]);

  const experimentCounts = experiments.reduce<Record<string, number>>((acc, exp) => {
    acc[exp.ownerId] = (acc[exp.ownerId] || 0) + 1;
    return acc;
  }, {});

  const publicUsers = users.map((u) => ({
    ...u,
    status: 'active' as const,
    experiments: experimentCounts[u.id] || 0,
  }));

  // Filter users (exclude current user)
  const filteredUsers = publicUsers
    .filter(u => u.id !== user?.id && u.status === 'active')
    .filter(u => 
      userSearch === '' || 
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.name.toLowerCase().includes(userSearch.toLowerCase())
    );

  // Filter models
  const filteredModels = publicModels.filter(m =>
    (modelSearch === '' ||
      m.modelName.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.ownerUsername.toLowerCase().includes(modelSearch.toLowerCase())) &&
    (ownerFilter === 'all' || m.ownerUsername === ownerFilter)
  );

  const sortedModels = useMemo(
    () => rankModels(filteredModels, modelSortField, modelSortOrder),
    [filteredModels, modelSortField, modelSortOrder]
  );

  const totalPages = Math.max(1, Math.ceil(sortedModels.length / modelsPerPage));
  const currentPage = Math.min(modelPage, totalPages);
  const startIndex = (currentPage - 1) * modelsPerPage;
  const visibleModels = sortedModels.slice(startIndex, startIndex + modelsPerPage);

  useEffect(() => {
    setModelPage(1);
  }, [modelsPerPage, modelSortField, modelSortOrder, modelSearch, ownerFilter]);

  const filteredExperiments = experiments.filter((exp) => {
    if (exp.visibility !== 'public') return false;
    if (!experimentSearch) return true;
    const search = experimentSearch.toLowerCase();
    return (
      exp.name.toLowerCase().includes(search) ||
      exp.ownerUsername.toLowerCase().includes(search) ||
      exp.config.symbol.toLowerCase().includes(search)
    );
  });

  const experimentTotalPages = Math.max(1, Math.ceil(filteredExperiments.length / experimentResultsPerPage));
  const experimentCurrentPage = Math.min(experimentPage, experimentTotalPages);
  const experimentStartIndex = (experimentCurrentPage - 1) * experimentResultsPerPage;
  const visibleExperiments = filteredExperiments.slice(
    experimentStartIndex,
    experimentStartIndex + experimentResultsPerPage
  );

  useEffect(() => {
    setExperimentPage(1);
  }, [experimentSearch, experimentResultsPerPage]);

  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / userResultsPerPage));
  const userCurrentPage = Math.min(userPage, userTotalPages);
  const userStartIndex = (userCurrentPage - 1) * userResultsPerPage;
  const visibleUsers = filteredUsers.slice(userStartIndex, userStartIndex + userResultsPerPage);

  useEffect(() => {
    setUserPage(1);
  }, [userSearch, userResultsPerPage]);

  const filteredBlueprints = useMemo(() => {
    if (!blueprintSearch) return publicBlueprints;
    const query = blueprintSearch.toLowerCase();
    return publicBlueprints.filter((blueprint) =>
      blueprint.name.toLowerCase().includes(query) ||
      blueprint.description.toLowerCase().includes(query) ||
      blueprint.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      (blueprint.authorUsername ?? 'loop-api').toLowerCase().includes(query)
    );
  }, [publicBlueprints, blueprintSearch]);

  const blueprintTotalPages = Math.max(1, Math.ceil(filteredBlueprints.length / blueprintResultsPerPage));
  const blueprintCurrentPage = Math.min(blueprintPage, blueprintTotalPages);
  const blueprintStartIndex = (blueprintCurrentPage - 1) * blueprintResultsPerPage;
  const visibleBlueprints = filteredBlueprints.slice(blueprintStartIndex, blueprintStartIndex + blueprintResultsPerPage);

  useEffect(() => {
    setBlueprintPage(1);
  }, [blueprintSearch, blueprintResultsPerPage]);

  const handleFollow = (userId: string) => {
    if (user?.following?.includes(userId)) {
      unfollowUser(userId);
      toast.success('Unfollowed user');
    } else {
      followUser(userId);
      toast.success('Now following user');
    }
  };


  const toggleFavorite = (model: ModelResult) => {
    setFavoritedModelIds((prev) => {
      const next = new Set(prev);
      if (next.has(model.id)) {
        next.delete(model.id);
        toast.success('Removed from favorites');
      } else {
        next.add(model.id);
        toast.success('Favorited model');
      }
      return next;
    });
  };

  const getAdjustedCount = (baseIds: string[], localSet: Set<string>, modelId: string) => {
    const baseHas = baseIds.includes(user?.id || '');
    const localHas = localSet.has(modelId);
    if (baseHas === localHas) return baseIds.length;
    return baseIds.length + (localHas ? 1 : -1);
  };

  const handleFavoriteBlueprint = (blueprint: BlueprintDefinition) => {
    toast.success(`Favorited ${blueprint.name}`);
  };


  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl font-bold">Public Hub</h1>
          <p className="mt-1 text-muted-foreground">
            Explore public models first, then discover users
          </p>
        </div>

        <Tabs defaultValue="models" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-muted/40 p-2 sm:grid-cols-4">
            <TabsTrigger value="models" className="gap-2">
              <Boxes className="h-4 w-4" />
              Models
            </TabsTrigger>
            <TabsTrigger value="blueprints" className="gap-2">
              <FileCode className="h-4 w-4" />
              Blueprints
            </TabsTrigger>
            <TabsTrigger value="experiments" className="gap-2">
              <FlaskConical className="h-4 w-4" />
              Experiments
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Discover Users
            </TabsTrigger>
          </TabsList>

          {/* Models Tab */}
          <TabsContent value="models" className="mt-4 space-y-6 rounded-xl border border-border bg-muted/20 p-4 sm:mt-6 sm:p-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by model name or owner..."
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="w-full">
              <label className="text-xs text-muted-foreground">Filter by owner username</label>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="all">All owners</option>
                {[...new Set(publicModels.map((m) => m.ownerUsername))].map((owner) => (
                  <option key={owner} value={owner}>
                    @{owner}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div>
                  <label className="text-xs text-muted-foreground">Sort by</label>
                  <select
                    value={modelSortField}
                    onChange={(e) => setModelSortField(e.target.value as SortField)}
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="testAccuracy">Test Accuracy</option>
                    <option value="sharpe">Sharpe</option>
                    <option value="totalReturn">Total Return</option>
                    <option value="winRate">Win Rate</option>
                    <option value="profitFactor">Profit Factor</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Order</label>
                  <select
                    value={modelSortOrder}
                    onChange={(e) => setModelSortOrder(e.target.value as SortOrder)}
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="desc">High → Low</option>
                    <option value="asc">Low → High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {visibleModels.map((model) => (
                <Card key={model.id} className="bg-gradient-card">
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">{model.modelName}</CardTitle>
                        <Badge variant="outline">{model.blueprintType}</Badge>
                      </div>
                      <CardDescription className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs">{model.code}</span>
                        <span>•</span>
                        <span>by @{model.ownerUsername}</span>
                      </CardDescription>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span>Accuracy {(model.metrics.testAccuracy * 100).toFixed(0)}%</span>
                        <span>Sharpe {model.metrics.sharpe.toFixed(2)}</span>
                        <span>Return {model.metrics.totalReturn.toFixed(1)}%</span>
                        <span>Win rate {(model.metrics.winRate * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3.5 w-3.5" />
                        {getAdjustedCount(model.favoritedBy, favoritedModelIds, model.id)}
                      </span>
                      <ModelDetailsIconButton model={model} />
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
                  </CardContent>
                </Card>
              ))}
              {visibleModels.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No public models found matching your search
                </div>
              )}
            </div>
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-background/60 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Showing {sortedModels.length === 0 ? 0 : startIndex + 1}-
                  {Math.min(startIndex + modelsPerPage, sortedModels.length)} of {sortedModels.length} public models.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModelPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModelPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-xs text-muted-foreground">Results per page</label>
                <select
                  value={modelsPerPage}
                  onChange={(e) => setModelsPerPage(Number(e.target.value))}
                  className="h-9 rounded-md border border-border bg-background px-3 text-xs"
                >
                  {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </TabsContent>

          {/* Blueprints Tab */}
          <TabsContent value="blueprints" className="mt-4 space-y-6 rounded-xl border border-border bg-muted/20 p-4 sm:mt-6 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search Blueprints by name, tag, or author..."
                  value={blueprintSearch}
                  onChange={(e) => setBlueprintSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/blueprints">
                  <Sparkles className="h-4 w-4" />
                  Open My Blueprints
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {visibleBlueprints.map((blueprint) => (
                <Card key={blueprint.id} className="bg-gradient-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{blueprint.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xs">v{blueprint.version}</span>
                          <span>•</span>
                          <span>by @{blueprint.authorUsername ?? 'loop-api'}</span>
                        </CardDescription>
                      </div>
                      <Badge variant={blueprint.category === 'Literature' ? 'default' : 'outline'}>
                        {blueprint.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{blueprint.description}</p>
                    <div className="grid gap-2 text-xs sm:grid-cols-3">
                      <div className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{Object.keys(blueprint.indicators).length} Indicators</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1">
                        <Shapes className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{Object.keys(blueprint.features).length} Features</span>
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
                    <div className="flex flex-col gap-2 pt-2 border-t border-border sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {blueprint.type === 'manifest' ? 'Manifest' : 'Custom'}
                        </Badge>
                        <Badge variant="outline">{blueprint.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleFavoriteBlueprint(blueprint)}
                        >
                          <Star className="h-3.5 w-3.5" />
                          Favorite
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {visibleBlueprints.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No Blueprints found matching your search
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border bg-background/60 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">

                  Showing {filteredBlueprints.length === 0 ? 0 : blueprintStartIndex + 1}-
                  {Math.min(blueprintStartIndex + blueprintResultsPerPage, filteredBlueprints.length)} of {filteredBlueprints.length} Blueprints.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBlueprintPage((prev) => Math.max(1, prev - 1))}
                    disabled={blueprintCurrentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {blueprintCurrentPage} of {blueprintTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBlueprintPage((prev) => Math.min(blueprintTotalPages, prev + 1))}
                    disabled={blueprintCurrentPage === blueprintTotalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-xs text-muted-foreground">Results per page</label>
                <select
                  value={blueprintResultsPerPage}
                  onChange={(e) => setBlueprintResultsPerPage(Number(e.target.value))}
                  className="h-9 rounded-md border border-border bg-background px-3 text-xs"
                >
                  {[10, 20, 30, 40, 50].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </TabsContent>

          {/* Experiments Tab */}
          <TabsContent value="experiments" className="mt-4 space-y-6 rounded-xl border border-border bg-muted/20 p-4 sm:mt-6 sm:p-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search experiments by name, owner, or symbol..."
                value={experimentSearch}
                onChange={(e) => setExperimentSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-3">
              {visibleExperiments.map((exp) => (
                <Card key={exp.id} className="bg-gradient-card">
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">{exp.name}</CardTitle>
                        <Badge variant="outline" className="capitalize">
                          {exp.status}
                        </Badge>
                      </div>
                      <CardDescription className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs">{exp.code}</span>
                        <span>•</span>
                        <span>by @{exp.ownerUsername}</span>
                      </CardDescription>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FlaskConical className="h-3.5 w-3.5" />
                          {exp.config.blueprint}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {exp.createdAt.toLocaleDateString()}
                        </span>
                        <span>
                          Dataset {exp.config.symbol} · {exp.config.interval}
                        </span>
                        {exp.results && (
                          <span>Sharpe {exp.results.sharpe.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:justify-end">
                      <Link href={`/experiments/${exp.id}`}>
                        <Button variant="outline" size="sm">
                          View Experiment
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {visibleExperiments.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No public experiments found matching your search
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-background/60 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Showing {filteredExperiments.length === 0 ? 0 : experimentStartIndex + 1}-
                  {Math.min(experimentStartIndex + experimentResultsPerPage, filteredExperiments.length)} of {filteredExperiments.length} experiments.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExperimentPage((prev) => Math.max(1, prev - 1))}
                    disabled={experimentCurrentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {experimentCurrentPage} of {experimentTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExperimentPage((prev) => Math.min(experimentTotalPages, prev + 1))}
                    disabled={experimentCurrentPage === experimentTotalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-xs text-muted-foreground">Results per page</label>
                <select
                  value={experimentResultsPerPage}
                  onChange={(e) => setExperimentResultsPerPage(Number(e.target.value))}
                  className="h-9 rounded-md border border-border bg-background px-3 text-xs"
                >
                  {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4 space-y-6 rounded-xl border border-border bg-muted/20 p-4 sm:mt-6 sm:p-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by username or name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleUsers.map(u => (
                <Card key={u.id} className="bg-gradient-card">
                  <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {u.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/users/${u.username}`}
                        className="font-semibold hover:text-primary truncate block"
                      >
                        {u.name}
                      </Link>
                      <p className="text-sm text-muted-foreground truncate">@{u.username}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{u.followers.length} followers</span>
                        <span>{u.experiments} experiments</span>
                      </div>
                    </div>
                    <Button
                      variant={user?.following?.includes(u.id) ? 'outline' : 'default'}
                      size="sm"
                      className="self-start sm:self-auto"
                      onClick={() => handleFollow(u.id)}
                    >
                      {user?.following?.includes(u.id) ? (
                        <UserMinus className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {visibleUsers.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No users found matching your search
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-background/60 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Showing {filteredUsers.length === 0 ? 0 : userStartIndex + 1}-
                  {Math.min(userStartIndex + userResultsPerPage, filteredUsers.length)} of {filteredUsers.length} users.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
                    disabled={userCurrentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {userCurrentPage} of {userTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUserPage((prev) => Math.min(userTotalPages, prev + 1))}
                    disabled={userCurrentPage === userTotalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-xs text-muted-foreground">Results per page</label>
                <select
                  value={userResultsPerPage}
                  onChange={(e) => setUserResultsPerPage(Number(e.target.value))}
                  className="h-9 rounded-md border border-border bg-background px-3 text-xs"
                >
                  {[6, 9, 12, 18, 24, 30].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
