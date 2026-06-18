"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockApiExperiments, mockApiModels, mockApiBlueprints, mockApiUsers, mockMeta } from '@/data/app-data';
import {
  ApiExperimentRecord,
  ApiModelRecord,
  ApiBlueprintRecord,
  ApiUserRecord,
  ModelResult,
  createUserLookup,
  mapApiExperiment,
  mapApiModel,
  mapApiBlueprint,
} from '@/lib/data-utils';
import { ArrowLeft, ArrowRight, Check, ClipboardList, Cpu, Layers, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

type WizardStep = 1 | 2 | 3 | 4;

type ParamState = Record<string, string>;

interface BlueprintConfig {
  name: string;
  description: string;
  category: 'Literature' | 'Custom';
  tags: string;
  indicators: Record<string, ParamState>;
  features: Record<string, ParamState>;
  referenceModelId: string;
  referenceModelParams: ParamState;
}

const featureParamCatalog: Record<string, { name: string; default: number; type: 'number' }[]> = {
  atr_percent_sma: [{ name: 'period', default: 14, type: 'number' }],
  breakout_features: [
    { name: 'lookback', default: 20, type: 'number' },
    { name: 'threshold', default: 0.02, type: 'number' },
  ],
  close_position: [],
  momentum: [{ name: 'window', default: 10, type: 'number' }],
  volatility: [{ name: 'lookback', default: 20, type: 'number' }],
  trend_strength: [
    { name: 'lookback', default: 14, type: 'number' },
    { name: 'smoothing', default: 3, type: 'number' },
  ],
};

export default function NewBlueprint() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { user, isAdmin } = useAuth();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [availableIndicators, setAvailableIndicators] = useState<Array<{ id: string; name: string; category: string; params: Array<{ name: string; default: number }> }>>([]);
  const [availableFeatures, setAvailableFeatures] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [models, setModels] = useState<ModelResult[]>([]);
  const [blueprintOptions, setBlueprintOptions] = useState<ReturnType<typeof mapApiBlueprint>[]>([]);
  const [loadedBlueprint, setLoadedBlueprint] = useState<ReturnType<typeof mapApiBlueprint> | null>(null);
  useEffect(() => {
    let active = true;
    const loadData = () => {
      const meta = mockMeta();
      if (!active) return;
      if (meta.indicators) {
        setAvailableIndicators(meta.indicators as Array<{ id: string; name: string; category: string; params: Array<{ name: string; default: number }> }>);
      }
      if (meta.features) {
        setAvailableFeatures(meta.features as Array<{ id: string; name: string; description: string }>);
      }

      const userLookup = createUserLookup(mockApiUsers() as ApiUserRecord[]);
      const mappedExperiments = mockApiExperiments().map((exp) =>
        mapApiExperiment(exp as ApiExperimentRecord, userLookup)
      );
      const experimentMap = new Map(mappedExperiments.map((exp) => [exp.id, exp] as const));
      const mappedModels = mockApiModels().map((model) =>
        mapApiModel(model as ApiModelRecord, experimentMap, userLookup)
      );
      setModels(mappedModels);
      setBlueprintOptions(mockApiBlueprints().map((blueprint) => mapApiBlueprint(blueprint as ApiBlueprintRecord)));
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const featuresWithParams = useMemo(
    () =>
      availableFeatures.map((feature) => ({
        ...feature,
        params: featureParamCatalog[feature.id] ?? [],
      })),
    [availableFeatures]
  );
  const [config, setConfig] = useState<BlueprintConfig>({
    name: '',
    description: '',
    category: 'Custom',
    tags: '',
    indicators: {},
    features: {},
    referenceModelId: '',
    referenceModelParams: {},
  });

  useEffect(() => {
    if (!editId || blueprintOptions.length === 0) return;
    const match =
      blueprintOptions.find((blueprint) => blueprint.id === editId) ||
      blueprintOptions.find((blueprint) => blueprint.name.toLowerCase() === editId.toLowerCase());
    if (!match) return;
    setConfig({
      name: match.name,
      description: match.description,
      category: match.category,
      tags: match.tags.join(', '),
      indicators: Object.fromEntries(
        Object.entries(match.indicators).map(([key, params]) => [
          key,
          Object.fromEntries(Object.entries(params).map(([pKey, value]) => [pKey, String(value)])),
        ])
      ),
      features: Object.fromEntries(
        Object.entries(match.features).map(([key, params]) => [
          key,
          Object.fromEntries(Object.entries(params).map(([pKey, value]) => [pKey, String(value)])),
        ])
      ),
      referenceModelId: match.referenceModel.name,
      referenceModelParams: Object.fromEntries(
        Object.entries(match.referenceModel.params).map(([key, value]) => [key, String(value)])
      ),
    });
    setLoadedBlueprint(match);
    setCurrentStep(1);
  }, [editId, blueprintOptions]);

  const steps = [
    { number: 1, title: 'Basics', icon: Settings },
    { number: 2, title: 'Indicators & Features', icon: Layers },
    { number: 3, title: 'Reference Architecture', icon: Cpu },
    { number: 4, title: 'Review', icon: Check },
  ];

  const architectureOptions = useMemo(() => {
    const byName = new Map<string, ModelResult>();
    models.forEach((model) => {
      if (!byName.has(model.modelName)) {
        byName.set(model.modelName, model);
      }
    });
    return Array.from(byName.values());
  }, [models]);

  const selectedArchitecture = architectureOptions.find((model) => model.id === config.referenceModelId);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  const toggleIndicator = (id: string) => {
    const indicator = availableIndicators.find((item) => item.id === id);
    if (!indicator) return;

    setConfig((prev) => {
      if (prev.indicators[id]) {
        const { [id]: _, ...rest } = prev.indicators;
        return { ...prev, indicators: rest };
      }

      const paramDefaults: ParamState = {};
      indicator.params.forEach((param) => {
        paramDefaults[param.name] = String(param.default);
      });

      return {
        ...prev,
        indicators: { ...prev.indicators, [id]: paramDefaults },
      };
    });
  };

  const toggleFeature = (id: string) => {
    const feature = featuresWithParams.find((item) => item.id === id);
    if (!feature) return;

    setConfig((prev) => {
      if (prev.features[id]) {
        const { [id]: _, ...rest } = prev.features;
        return { ...prev, features: rest };
      }

      const paramDefaults: ParamState = {};
      feature.params.forEach((param) => {
        paramDefaults[param.name] = String(param.default);
      });

      return {
        ...prev,
        features: { ...prev.features, [id]: paramDefaults },
      };
    });
  };

  const updateIndicatorParam = (id: string, paramName: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      indicators: {
        ...prev.indicators,
        [id]: {
          ...prev.indicators[id],
          [paramName]: value,
        },
      },
    }));
  };

  const updateFeatureParam = (id: string, paramName: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [id]: {
          ...prev.features[id],
          [paramName]: value,
        },
      },
    }));
  };

  const selectReferenceModel = (id: string) => {
    const architecture = architectureOptions.find((item) => item.id === id);
    if (!architecture) return;

    const params: ParamState = {};
    Object.entries(architecture.parameters).forEach(([key, value]) => {
      params[key] = String(value);
    });

    setConfig((prev) => ({
      ...prev,
      referenceModelId: id,
      referenceModelParams: params,
    }));
  };

  const updateModelParam = (paramName: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      referenceModelParams: {
        ...prev.referenceModelParams,
        [paramName]: value,
      },
    }));
  };

  const getPermutationCount = (params: ParamState) => {
    return Object.values(params).reduce((total, value) => {
      const count = value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean).length;
      return total * (count || 1);
    }, 1);
  };

  const permutationCount = useMemo(() => {
    const indicatorPermutations = Object.values(config.indicators).reduce(
      (total, params) => total * getPermutationCount(params),
      1
    );
    const featurePermutations = Object.values(config.features).reduce(
      (total, params) => total * getPermutationCount(params),
      1
    );
    const architecturePermutations = getPermutationCount(config.referenceModelParams);
    return indicatorPermutations * featurePermutations * architecturePermutations;
  }, [config.indicators, config.features, config.referenceModelParams]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return config.name.trim().length > 0;
      case 2:
        return Object.keys(config.indicators).length + Object.keys(config.features).length > 0;
      case 3:
        return config.referenceModelId.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const toPayload = () => ({
    name: config.name,
    description: config.description,
    category: isAdmin ? 'Literature' : 'Custom',
    tags: config.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    indicators: config.indicators,
    features: config.features,
    reference_model: {
      name: selectedArchitecture?.modelName || config.referenceModelId || 'Reference',
      family: selectedArchitecture?.blueprintType || 'unknown',
      params: config.referenceModelParams,
    },
  });

  const handleCreate = async () => {
    if (!user?.id) {
      toast.error('Please sign in to save Blueprints.');
      return;
    }
    toPayload();
    await new Promise((resolve) => setTimeout(resolve, 600));

    toast.success(editId ? 'Blueprint updated!' : 'Blueprint created!', {
      description: editId
        ? 'Your Blueprint updates have been saved.'
        : 'Your Blueprint is ready to use in experiments.',
    });
    router.push('/blueprints');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{editId ? 'Edit Blueprint' : 'Create New Blueprint'}</h1>
          <p className="mt-1 text-muted-foreground">
            {editId
              ? 'Update indicators, features, and the reference architecture for this Blueprint.'
              : 'Assemble indicators, features, and a reference architecture for a new Blueprint.'}
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    currentStep >= step.number
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span
                  className={`ml-2 hidden text-sm font-medium sm:block ${
                    currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-4 h-0.5 w-8 sm:w-16 lg:w-24 ${
                      currentStep > step.number ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Step {currentStep}: {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Describe the Blueprint and set core details'}
              {currentStep === 2 && 'Choose indicators/features and define parameter permutations'}
              {currentStep === 3 && 'Select a reference architecture from the backend catalog and tune its parameters'}
              {currentStep === 4 && 'Review the Blueprint setup before creating'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="blueprint-name">Blueprint Name *</Label>
                  <Input
                    id="blueprint-name"
                    placeholder="e.g., Momentum Breakout Blueprint"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blueprint-description">Description</Label>
                  <Textarea
                    id="blueprint-description"
                    placeholder="Summarize the modeling intent and signals..."
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={isAdmin ? 'Literature' : 'Custom'} disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Literature">Literature</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blueprint-tags">Tags (comma separated)</Label>
                  <Input
                    id="blueprint-tags"
                    placeholder="momentum, breakout, ensemble"
                    value={config.tags}
                    onChange={(e) => setConfig({ ...config, tags: e.target.value })}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-background/50 p-4 text-sm text-muted-foreground">
                  Enter multiple values separated by commas to create parameter permutations.
                </div>

                <div>
                  <h4 className="mb-3 font-medium">Indicators</h4>
                  <div className="space-y-3">
                    {availableIndicators.map((indicator) => {
                      const selected = Boolean(config.indicators[indicator.id]);
                      return (
                        <div
                          key={indicator.id}
                          className={`rounded-lg border p-4 transition-colors ${
                            selected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => toggleIndicator(indicator.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{indicator.name}</p>
                              <p className="text-xs text-muted-foreground">{indicator.category}</p>
                            </div>
                          </div>
                          {selected && indicator.params.length > 0 && (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {indicator.params.map((param) => (
                                <div key={param.name} className="space-y-1">
                                  <Label className="text-xs">{param.name}</Label>
                                  <Input
                                    value={config.indicators[indicator.id]?.[param.name] ?? ''}
                                    onChange={(e) =>
                                      updateIndicatorParam(indicator.id, param.name, e.target.value)
                                    }
                                    placeholder={`${param.default}`}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 font-medium">Features</h4>
                  <div className="space-y-3">
                    {featuresWithParams.map((feature) => {
                      const selected = Boolean(config.features[feature.id]);
                      return (
                        <div
                          key={feature.id}
                          className={`rounded-lg border p-4 transition-colors ${
                            selected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => toggleFeature(feature.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{feature.name}</p>
                              <p className="text-xs text-muted-foreground">{feature.description}</p>
                            </div>
                          </div>
                          {selected && feature.params.length > 0 && (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {feature.params.map((param) => (
                                <div key={param.name} className="space-y-1">
                                  <Label className="text-xs">{param.name}</Label>
                                  <Input
                                    value={config.features[feature.id]?.[param.name] ?? ''}
                                    onChange={(e) =>
                                      updateFeatureParam(feature.id, param.name, e.target.value)
                                    }
                                    placeholder={`${param.default}`}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-background/50 p-4 text-sm text-muted-foreground">
                  Reference architectures are fixed ML definitions stored in the backend docs (e.g., logreg_binary.py, xgboost_regressor.py). You can select from the catalog but cannot add, remove, or edit them here.
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {architectureOptions.map((architecture) => (
                    <div
                      key={architecture.id}
                      className={`rounded-lg border p-4 transition-colors cursor-pointer ${
                        config.referenceModelId === architecture.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => selectReferenceModel(architecture.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{architecture.modelName}</p>
                          <p className="text-sm text-muted-foreground">
                            {architecture.blueprintType} · {architecture.status}
                          </p>
                        </div>
                        {config.referenceModelId === architecture.id && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary">{architecture.visibility}</Badge>
                        <Badge variant="outline">{architecture.ownerUsername}</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedArchitecture && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Reference Architecture Parameters</h4>
                      <Badge variant="outline">{selectedArchitecture.modelName}</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.keys(config.referenceModelParams).map((param) => (
                        <div key={param} className="space-y-1">
                          <Label className="text-xs">{param}</Label>
                          <Input
                            value={config.referenceModelParams[param]}
                            onChange={(e) => updateModelParam(param, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <h4 className="mb-4 font-medium">Blueprint Summary</h4>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Name</dt>
                      <dd className="font-medium">{config.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Category</dt>
                      <dd className="font-mono">{config.category}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Indicators</dt>
                      <dd className="font-mono">{Object.keys(config.indicators).length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Features</dt>
                      <dd className="font-mono">{Object.keys(config.features).length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Reference Architecture</dt>
                      <dd className="font-mono">{selectedArchitecture?.modelName ?? 'Not selected'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Estimated Permutations</dt>
                      <dd className="font-mono">{permutationCount}</dd>
                    </div>
                  </dl>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-border/60 p-4">
                    <h5 className="mb-3 text-sm font-medium">Selected Indicators</h5>
                    <div className="space-y-2 text-xs">
                      {Object.keys(config.indicators).length === 0 && (
                        <p className="text-muted-foreground">No indicators selected.</p>
                      )}
                      {Object.entries(config.indicators).map(([id, params]) => (
                        <div key={id} className="rounded border border-border/50 p-2">
                          <span className="font-mono font-medium">{id}</span>
                          {Object.keys(params).length > 0 && (
                            <span className="ml-2 text-muted-foreground">
                              ({Object.entries(params)
                                .map(([key, value]) => `${key}=${value}`)
                                .join(', ')})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/60 p-4">
                    <h5 className="mb-3 text-sm font-medium">Selected Features</h5>
                    <div className="space-y-2 text-xs">
                      {Object.keys(config.features).length === 0 && (
                        <p className="text-muted-foreground">No features selected.</p>
                      )}
                      {Object.entries(config.features).map(([id, params]) => (
                        <div key={id} className="rounded border border-border/50 p-2">
                          <span className="font-mono font-medium">{id}</span>
                          {Object.keys(params).length > 0 && (
                            <span className="ml-2 text-muted-foreground">
                              ({Object.entries(params)
                                .map(([key, value]) => `${key}=${value}`)
                                .join(', ')})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {currentStep < 4 ? (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleCreate} variant="hero">
                  <Check className="mr-2 h-4 w-4" />
                  {editId ? 'Save Blueprint' : 'Create Blueprint'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}