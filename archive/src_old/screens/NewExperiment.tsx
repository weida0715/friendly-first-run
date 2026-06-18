"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { mockApiBlueprints, mockMeta } from '@/data/app-data';
import { ApiBlueprintRecord, mapApiBlueprint } from '@/lib/data-utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Database,
  FlaskConical,
  Plus,
  Search,
  Settings,
  Smartphone,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

type WizardStep = 1 | 2 | 3 | 4;

interface DataSplit {
  train: number;
  val: number;
  test: number;
}

interface ExperimentConfig {
  name: string;
  description: string;
  interval: string;
  exchange: string;
  symbol: string;
  startDate: string;
  endDate: string;
  dataSplit: DataSplit;
  blueprint: string;
}

export default function NewExperiment() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [blueprintQuery, setBlueprintQuery] = useState('');
  const [availableBlueprints, setAvailableBlueprints] = useState<ReturnType<typeof mapApiBlueprint>[]>([]);
  const [intervals, setIntervals] = useState<Array<{ value: string; label: string }>>([]);
  
  const [config, setConfig] = useState<ExperimentConfig>({
    name: '',
    description: '',
    interval: '1h',
    exchange: 'binance',
    symbol: 'BTCUSDT',
    startDate: '2024-01-01',
    endDate: '2024-06-01',
    dataSplit: { train: 70, val: 15, test: 15 },
    blueprint: '',
  });

  const steps = [
    { number: 1, title: 'Basic Setup', icon: Settings },
    { number: 2, title: 'Dataset', icon: Database },
    { number: 3, title: 'Select Blueprint', icon: Zap },
    { number: 4, title: 'Review', icon: Check },
  ];

  useEffect(() => {
    let mounted = true;
    const loadMetadata = () => {
      const meta = mockMeta();
      if (!mounted) return;

      if (meta.intervals) {
        setIntervals(
          (meta.intervals as Array<{ value?: string; label?: string }>).
            map((item) => ({
              value: item.value || '',
              label: item.label || item.value || '',
            }))
            .filter((item) => item.value)
        );
      }

      const mapped = mockApiBlueprints().map((blueprint) => mapApiBlueprint(blueprint as ApiBlueprintRecord));
      const uniqueBlueprints = Array.from(
        new Map(mapped.map((blueprint) => [`${blueprint.id}-${blueprint.version}`, blueprint])).values()
      );
      setAvailableBlueprints(uniqueBlueprints);
    };

    loadMetadata();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredBlueprints = useMemo(() => {
    const query = blueprintQuery.trim().toLowerCase();
    if (!query) return availableBlueprints;
    return availableBlueprints.filter((blueprint) =>
      `${blueprint.name} ${blueprint.description}`.toLowerCase().includes(query)
    );
  }, [blueprintQuery, availableBlueprints]);

  // Validation for data split (min 10% for val and test)
  const isValidSplit = () => {
    const { train, val, test } = config.dataSplit;
    return val >= 10 && test >= 10 && train + val + test === 100;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return config.name.trim().length > 0;
      case 2:
        return config.symbol && config.startDate && config.endDate && isValidSplit();
      case 3:
        return config.blueprint.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

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

  const handleStart = async () => {
    if (!user?.id) {
      toast.error('Please sign in to start an experiment');
      return;
    }

    const payload = {
      name: config.name,
      description: config.description,
      visibility: 'PRIVATE',
      market_symbol: config.symbol,
      exchange: config.exchange,
      data_interval: config.interval,
      start_date: config.startDate,
      end_date: config.endDate,
      train_pct: config.dataSplit.train,
      val_pct: config.dataSplit.val,
      test_pct: config.dataSplit.test,
      config_json: {
        symbol: config.symbol,
        exchange: config.exchange,
        interval: config.interval,
        dateRange: { start: config.startDate, end: config.endDate },
        dataSplit: config.dataSplit,
        blueprint: config.blueprint,
      },
    };

    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success('Experiment queued!', {
      description: 'Your run request has been submitted for server-side execution.',
    });
    router.push('/experiments');
  };

  // Handle data split changes with validation
  const handleSplitChange = (field: keyof DataSplit, value: number) => {
    const newSplit = { ...config.dataSplit };
    const minVal = field === 'train' ? 0 : 10;
    const maxVal = field === 'train' ? 80 : 40;
    
    newSplit[field] = Math.max(minVal, Math.min(maxVal, value));
    
    // Auto-adjust train to keep total at 100
    if (field !== 'train') {
      newSplit.train = 100 - newSplit.val - newSplit.test;
    } else {
      // Distribute remaining between val and test proportionally
      const remaining = 100 - newSplit.train;
      const valRatio = config.dataSplit.val / (config.dataSplit.val + config.dataSplit.test);
      newSplit.val = Math.max(10, Math.round(remaining * valRatio));
      newSplit.test = Math.max(10, remaining - newSplit.val);
    }
    
    setConfig({ ...config, dataSplit: newSplit });
  };

  const selectedBlueprint = availableBlueprints.find((blueprint) => blueprint.id === config.blueprint);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl font-bold">New Experiment</h1>
          <p className="mt-1 text-muted-foreground">
            Configure UEL setup, dataset range, and select a Blueprint for this run
          </p>
        </div>

        {isMobile && (
          <Card className="bg-gradient-card mb-6">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Mobile Experiment Setup</CardTitle>
                <CardDescription>
                  You can submit runs from any device, but large-screen editing is recommended.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              For best results, switch to a desktop or tablet for detailed parameter tuning.
            </CardContent>
          </Card>
        )}

        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            {steps.map((step) => (
              <div key={step.number} className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    currentStep >= step.number
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Step {step.number}</p>
                  <p
                    className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Step {currentStep}: {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Name the run and define UEL execution settings'}
              {currentStep === 2 && 'Pick the dataset range and split for this experiment'}
              {currentStep === 3 && 'Choose the Blueprint that defines the experiment logic'}
              {currentStep === 4 && 'Review experiment setup and launch the UEL run'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Basic Setup */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Experiment Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., BTC Momentum Strategy v1"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your experiment hypothesis..."
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval">Interval</Label>
                  <Select
                    value={config.interval}
                    onValueChange={(value) => setConfig({ ...config, interval: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {intervals.map((int) => (
                        <SelectItem key={int.value} value={int.value}>
                          {int.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Dataset with Train/Val/Test Split */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="exchange">Exchange</Label>
                    <Select
                      value={config.exchange}
                      onValueChange={(value) => setConfig({ ...config, exchange: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="binance">Binance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol</Label>
                    <Select
                      value={config.symbol}
                      onValueChange={(value) => setConfig({ ...config, symbol: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTCUSDT">BTCUSDT</SelectItem>
                        <SelectItem value="ETHUSDT">ETHUSDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="startDate"
                        type="date"
                        value={config.startDate}
                        onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="endDate"
                        type="date"
                        value={config.endDate}
                        onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Train/Val/Test Split */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Data Split (Train / Validation / Test)</Label>
                    <div className="flex gap-2">
                      <Badge variant={isValidSplit() ? 'default' : 'destructive'}>
                        {config.dataSplit.train}% / {config.dataSplit.val}% / {config.dataSplit.test}%
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Visual split bar */}
                  <div className="h-4 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-primary h-full transition-all"
                      style={{ width: `${config.dataSplit.train}%` }}
                    />
                    <div 
                      className="bg-accent h-full transition-all"
                      style={{ width: `${config.dataSplit.val}%` }}
                    />
                    <div 
                      className="bg-success h-full transition-all"
                      style={{ width: `${config.dataSplit.test}%` }}
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                        <Label htmlFor="train">Train %</Label>
                      </div>
                      <Input
                        id="train"
                        type="number"
                        min={40}
                        max={80}
                        value={config.dataSplit.train}
                        onChange={(e) => handleSplitChange('train', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-accent" />
                        <Label htmlFor="val">Validation % (min 10%)</Label>
                      </div>
                      <Input
                        id="val"
                        type="number"
                        min={10}
                        max={40}
                        value={config.dataSplit.val}
                        onChange={(e) => handleSplitChange('val', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-success" />
                        <Label htmlFor="test">Test % (min 10%)</Label>
                      </div>
                      <Input
                        id="test"
                        type="number"
                        min={10}
                        max={40}
                        value={config.dataSplit.test}
                        onChange={(e) => handleSplitChange('test', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  
                  {!isValidSplit() && (
                    <p className="text-sm text-destructive">
                      Validation and Test must each be at least 10%. Total must equal 100%.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Select Blueprint */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Select a Blueprint</h3>
                    <p className="text-sm text-muted-foreground">
                      Pick a research-proven or custom Blueprint to drive this experiment.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => router.push('/blueprints')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Blueprint
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search Blueprints by name or description"
                    className="pl-9"
                    value={blueprintQuery}
                    onChange={(e) => setBlueprintQuery(e.target.value)}
                  />
                </div>

                {['Literature', 'Custom'].map((category) => {
                  const categoryBlueprints = filteredBlueprints.filter((blueprint) => blueprint.category === category);
                  return (
                    <div key={category}>
                      <h4 className="mb-3 font-medium">{category} Blueprints</h4>
                      {categoryBlueprints.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                          No Blueprints match your search for this category.
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {categoryBlueprints.map((blueprint, index) => (
                            <div
                              key={`${blueprint.id}-${blueprint.version}-${category}-${index}`}
                              className={`rounded-lg border p-4 transition-colors cursor-pointer ${
                                config.blueprint === blueprint.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => setConfig({ ...config, blueprint: blueprint.id })}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium">{blueprint.name}</p>
                                  <p className="text-sm text-muted-foreground">{blueprint.description}</p>
                                </div>
                                {config.blueprint === blueprint.id && (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                                    <Check className="h-4 w-4 text-primary-foreground" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <h4 className="mb-4 font-medium">Selected Blueprint</h4>
                  <div className="flex flex-col gap-2 text-sm">
                    <span className="text-muted-foreground">Blueprint</span>
                    <Badge className="bg-primary/10 text-primary font-mono w-fit">
                      {selectedBlueprint?.name ?? 'Not selected'}
                    </Badge>
                    {selectedBlueprint?.description && (
                      <p className="text-muted-foreground text-xs">{selectedBlueprint.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {currentStep < 4 ? (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleStart} variant="hero">
                  <Zap className="mr-2 h-4 w-4" />
                  Start Experiment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
