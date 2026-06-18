"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, ClipboardList, Cpu, Layers, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SelectField } from '@/components/forms/SelectField';
import { FormErrorText } from '@/components/forms/FormErrorText';
import { TokenizedParameterInput, describeConstraint, tokensFromValue, validateParamToken, type ParameterConstraint, type TokenizedParamDefinition } from '@/components/forms/TokenizedParameterInput';
import { ApiClientError, createBlueprint, getBlueprintMetadata } from '@/lib/api/client';

type WizardMode = 'create' | 'edit';
type WizardStep = 1 | 2 | 3 | 4;
type ParamState = Record<string, string>;
type IndicatorParamType = TokenizedParamDefinition['type'];
type IndicatorParamOption = TokenizedParamDefinition;
interface IndicatorOption { id: string; name: string; category: string; source: 'custom' | 'ta-lib'; params: IndicatorParamOption[]; outputs: string[]; description: string }
type FieldErrors = Record<string, string>;

interface BlueprintConfig {
  name: string;
  description: string;
  category: 'Literature' | 'Custom';
  tags: string;
  indicators: Record<string, ParamState>;
  referenceModelId: string;
  referenceModelParams: ParamState;
}

const talibIndicatorNames = [
  'ACCBANDS', 'ACOS', 'AD', 'ADD', 'ADOSC', 'ADX', 'ADXR', 'APO', 'AROON', 'AROONOSC', 'ASIN', 'ATAN', 'ATR', 'AVGPRICE',
  'BBANDS', 'BETA', 'BOP', 'CCI', 'CDL2CROWS', 'CDL3BLACKCROWS', 'CDL3INSIDE', 'CDL3LINESTRIKE', 'CDL3OUTSIDE',
  'CDL3STARSINSOUTH', 'CDL3WHITESOLDIERS', 'CDLABANDONEDBABY', 'CDLADVANCEBLOCK', 'CDLBELTHOLD', 'CDLBREAKAWAY',
  'CDLCLOSINGMARUBOZU', 'CDLCONCEALBABYSWALL', 'CDLCOUNTERATTACK', 'CDLDARKCLOUDCOVER', 'CDLDOJI', 'CDLDOJISTAR',
  'CDLDRAGONFLYDOJI', 'CDLENGULFING', 'CDLEVENINGDOJISTAR', 'CDLEVENINGSTAR', 'CDLGAPSIDESIDEWHITE', 'CDLGRAVESTONEDOJI',
  'CDLHAMMER', 'CDLHANGINGMAN', 'CDLHARAMI', 'CDLHARAMICROSS', 'CDLHIGHWAVE', 'CDLHIKKAKE', 'CDLHIKKAKEMOD', 'CDLHOMINGPIGEON',
  'CDLIDENTICAL3CROWS', 'CDLINNECK', 'CDLINVERTEDHAMMER', 'CDLKICKING', 'CDLKICKINGBYLENGTH', 'CDLLADDERBOTTOM',
  'CDLLONGLEGGEDDOJI', 'CDLLONGLINE', 'CDLMARUBOZU', 'CDLMATCHINGLOW', 'CDLMATHOLD', 'CDLMORNINGDOJISTAR', 'CDLMORNINGSTAR',
  'CDLONNECK', 'CDLPIERCING', 'CDLRICKSHAWMAN', 'CDLRISEFALL3METHODS', 'CDLSEPARATINGLINES', 'CDLSHOOTINGSTAR',
  'CDLSHORTLINE', 'CDLSPINNINGTOP', 'CDLSTALLEDPATTERN', 'CDLSTICKSANDWICH', 'CDLTAKURI', 'CDLTASUKIGAP', 'CDLTHRUSTING',
  'CDLTRISTAR', 'CDLUNIQUE3RIVER', 'CDLUPSIDEGAP2CROWS', 'CDLXSIDEGAP3METHODS', 'CEIL', 'CMO', 'CORREL', 'COS', 'COSH',
  'DEMA', 'DIV', 'DX', 'EMA', 'EXP', 'FLOOR', 'HT_DCPERIOD', 'HT_DCPHASE', 'HT_PHASOR', 'HT_SINE', 'HT_TRENDLINE',
  'HT_TRENDMODE', 'KAMA', 'LINEARREG', 'LINEARREG_ANGLE', 'LINEARREG_INTERCEPT', 'LINEARREG_SLOPE', 'LN', 'LOG10', 'MA',
  'MACD', 'MACDEXT', 'MACDFIX', 'MAMA', 'MAVP', 'MAX', 'MAXINDEX', 'MEDPRICE', 'MFI', 'MIDPOINT', 'MIDPRICE', 'MIN',
  'MININDEX', 'MINMAX', 'MINMAXINDEX', 'MINUS_DI', 'MINUS_DM', 'MOM', 'MULT', 'NATR', 'OBV', 'PLUS_DI', 'PLUS_DM', 'PPO',
  'ROC', 'ROCP', 'ROCR', 'ROCR100', 'RSI', 'SAR', 'SAREXT', 'SIN', 'SINH', 'SMA', 'SQRT', 'STDDEV', 'STOCH', 'STOCHF',
  'STOCHRSI', 'SUB', 'SUM', 'T3', 'TAN', 'TANH', 'TEMA', 'TRANGE', 'TRIMA', 'TRIX', 'TSF', 'TYPPRICE', 'ULTOSC', 'VAR',
  'WCLPRICE', 'WILLR', 'WMA',
];

const talibOutputDefaults: Record<string, string> = {
  AROON: 'aroon_down,aroon_up', BBANDS: 'bbands_upper,bbands_middle,bbands_lower', MACD: 'macd,macd_signal,macd_hist',
  MACDEXT: 'macd,macd_signal,macd_hist', MACDFIX: 'macd,macd_signal,macd_hist', MAMA: 'mama,fama', MINMAX: 'min,max',
  MINMAXINDEX: 'min_index,max_index', STOCH: 'slowk,slowd', STOCHF: 'fastk,fastd', STOCHRSI: 'fastk,fastd', HT_PHASOR: 'inphase,quadrature', HT_SINE: 'sine,leadsine',
};

const talibIndicatorOptions: IndicatorOption[] = talibIndicatorNames.map((name) => ({
  id: name,
  name,
  category: 'TA-Lib',
  source: 'ta-lib',
  description: `TA-Lib ${name} feature generated after data splitting.`,
  outputs: (talibOutputDefaults[name] ?? name.toLowerCase()).split(','),
  params: [
    { name: 'timeperiod', default: '14', type: 'integer-list', description: 'TA-Lib function period parameter exposed by the backend adapter' },
  ],
}));

const customIndicatorOptions: IndicatorOption[] = [
  {
    id: 'vwap',
    name: 'VWAP',
    category: 'Custom · Volume',
    source: 'custom',
    description: 'Cumulative volume-weighted average price feature computed per split.',
    outputs: ['vwap'],
    params: [],
  },
  {
    id: 'ichimoku_cloud',
    name: 'Ichimoku Cloud',
    category: 'Custom · Trend',
    source: 'custom',
    description: 'Conversion, base, and leading span features with split-local warm-up handling.',
    outputs: ['ichimoku_conversion', 'ichimoku_base', 'ichimoku_span_a', 'ichimoku_span_b'],
    params: [
      { name: 'conversion_period', default: '9', type: 'integer-list' },
      { name: 'base_period', default: '26', type: 'integer-list' },
      { name: 'span_b_period', default: '52', type: 'integer-list' },
      { name: 'displacement', default: '26', type: 'integer-list' },
    ],
  },
  {
    id: 'quantile_flag',
    name: 'Quantile Flag',
    category: 'Custom · Flag',
    source: 'custom',
    description: 'Binary feature flag when a source column is above its rolling quantile threshold.',
    outputs: ['<column>_quantile_flag'],
    params: [
      { name: 'window', default: '20', type: 'integer-list' },
      { name: 'quantile', default: '0.8', type: 'number-list' },
    ],
  },
];

const fallbackIndicators: IndicatorOption[] = [...talibIndicatorOptions, ...customIndicatorOptions];

const fallbackArchitectures = [
  {
    id: 'logistic_regressor_arc',
    modelName: 'Logistic Regressor',
    blueprintType: 'Classification',
    status: 'Active',
    visibility: 'Internal',
    ownerUsername: 'system',
    parameters: { C: 1.0, max_iter: 200 },
    parameterConstraints: {
      C: { type: 'number', default: 1.0, min: 0.0001, max: 1000.0 },
      max_iter: { type: 'integer', default: 200, min: 50, max: 5000 },
    } as Record<string, ParameterConstraint>,
  },
  {
    id: 'ridge_classifier_arc',
    modelName: 'Ridge Classifier',
    blueprintType: 'Classification',
    status: 'Active',
    visibility: 'Internal',
    ownerUsername: 'system',
    parameters: { alpha: 1.0 },
    parameterConstraints: {
      alpha: { type: 'number', default: 1.0, min: 0.0001, max: 1000.0 },
    } as Record<string, ParameterConstraint>,
  },
];

const architectureOptions = fallbackArchitectures;

function indicatorFromMetadata(raw: Record<string, unknown>): IndicatorOption {
  const name = String(raw.name ?? raw.displayName ?? raw.display_name ?? '');
  const constraints = (raw.parameterConstraints ?? raw.parameter_constraints ?? {}) as Record<string, ParameterConstraint>;
  return {
    id: name,
    name: String(raw.displayName ?? raw.display_name ?? name),
    category: String(raw.category ?? (raw.source === 'ta-lib' ? 'TA-Lib' : 'Custom')),
    source: raw.source === 'ta-lib' ? 'ta-lib' : 'custom',
    description: `${String(raw.source ?? 'custom')} indicator computed after data splitting.`,
    outputs: (raw.outputColumns ?? raw.output_columns ?? []) as string[],
    params: Object.entries(constraints)
      .filter(([paramName]) => !['column', 'source_column', 'input', 'inputs', 'output', 'outputs'].includes(paramName))
      .map(([paramName, rule]) => ({
        name: paramName,
        default: String(rule.default ?? ''),
        type: rule.type === 'integer' ? 'integer-list' : rule.type === 'number' ? 'number-list' : rule.type === 'boolean' ? 'boolean' : 'string',
        constraint: rule,
      })),
  };
}


export function BlueprintWizardView({ mode = 'create', sourceBlueprintId }: { mode?: WizardMode; sourceBlueprintId?: string }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [config, setConfig] = useState<BlueprintConfig>({
    name: '',
    description: '',
    category: 'Custom',
    tags: '',
    indicators: {},
    referenceModelId: sourceBlueprintId ?? '',
    referenceModelParams: {},
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metadataIndicators, setMetadataIndicators] = useState<IndicatorOption[]>(fallbackIndicators);
  const [metadataArchitectures, setMetadataArchitectures] = useState(fallbackArchitectures);

  useEffect(() => {
    let active = true;
    getBlueprintMetadata()
      .then((response) => {
        if (!active) return;
        const indicators = response.data?.indicators?.map(indicatorFromMetadata).filter((indicator) => indicator.id) ?? [];
        if (indicators.length > 0) setMetadataIndicators(indicators);
        const architectures = (response.data?.architectures ?? []).map((item) => {
          const raw = item as Record<string, unknown>;
          const constraints = (raw.parameterConstraints ?? raw.parameter_constraints ?? {}) as Record<string, ParameterConstraint>;
          const parameters = Object.fromEntries(Object.entries(constraints).map(([key, rule]) => [key, rule.default ?? ''])) as Record<string, unknown>;
          return {
            id: String(raw.name ?? ''),
            modelName: String(raw.displayName ?? raw.display_name ?? raw.name ?? ''),
            blueprintType: 'Classification',
            status: 'Active',
            visibility: 'Internal',
            ownerUsername: 'system',
            parameters,
            parameterConstraints: constraints,
          };
        }).filter((item) => item.id);
        if (architectures.length > 0) setMetadataArchitectures(architectures);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const steps = [
    { number: 1, title: 'Basics', icon: Settings },
    { number: 2, title: 'Architecture', icon: Cpu },
    { number: 3, title: 'Indicators', icon: Layers },
    { number: 4, title: 'Review', icon: Check },
  ];

  const availableIndicators = metadataIndicators;
  const talibIndicators = availableIndicators.filter((indicator) => indicator.source === 'ta-lib');
  const customIndicators = availableIndicators.filter((indicator) => indicator.source === 'custom');
  const selectedArchitecture = metadataArchitectures.find((model) => model.id === config.referenceModelId);

  const architectureLabel = selectedArchitecture?.modelName ?? config.referenceModelId;

  const isNumericCsv = (raw: string) =>
    raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .every((entry) => !Number.isNaN(Number(entry)));

  const isIntegerCsv = (raw: string) =>
    raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .every((entry) => Number.isInteger(Number(entry)));

  const indicatorParam = (indicatorId: string, paramName: string): IndicatorParamOption =>
    availableIndicators.find((indicator) => indicator.id === indicatorId)?.params.find((param) => param.name === paramName) ?? { name: paramName, default: '', type: 'number-list' };

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleNext = () => currentStep < 4 && setCurrentStep((currentStep + 1) as WizardStep);
  const handleBack = () => currentStep > 1 && setCurrentStep((currentStep - 1) as WizardStep);

  const toggleIndicator = (id: string) => {
    const indicator = availableIndicators.find((item) => item.id === id);
    if (!indicator) return;
    setConfig((prev) => {
      if (prev.indicators[id]) {
        const { [id]: _, ...rest } = prev.indicators;
        return { ...prev, indicators: rest };
      }
      const paramDefaults: ParamState = {};
      indicator.params.forEach((param) => (paramDefaults[param.name] = String(param.default)));
      return { ...prev, indicators: { ...prev.indicators, [id]: paramDefaults } };
    });
    clearFieldError('indicators');
    setStepError(null);
  };

  const updateIndicatorParam = (id: string, paramName: string, value: string) => {
    setConfig((prev) => ({ ...prev, indicators: { ...prev.indicators, [id]: { ...prev.indicators[id], [paramName]: value } } }));
    clearFieldError(`indicators.${id}.${paramName}`);
    setStepError(null);
  };

  const selectReferenceModel = (id: string) => {
    const architecture = metadataArchitectures.find((item) => item.id === id);
    if (!architecture) return;
    const params: ParamState = {};
    Object.entries(architecture.parameters).forEach(([key, value]) => (params[key] = String(value)));
    setConfig((prev) => ({ ...prev, referenceModelId: id, referenceModelParams: params }));
    clearFieldError('referenceModelId');
    setStepError(null);
  };

  const updateModelParam = (paramName: string, value: string) => {
    setConfig((prev) => ({ ...prev, referenceModelParams: { ...prev.referenceModelParams, [paramName]: value } }));
    clearFieldError(`architecture.${paramName}`);
    setStepError(null);
  };

  const getPermutationCount = (params: ParamState) => Object.values(params).reduce((total, value) => {
    const count = value.split(',').map((entry) => entry.trim()).filter(Boolean).length;
    return total * (count || 1);
  }, 1);

  const permutationCount = useMemo(() => {
    const indicatorPermutations = Object.values(config.indicators).reduce((total, params) => total * getPermutationCount(params), 1);
    const architecturePermutations = getPermutationCount(config.referenceModelParams);
    return indicatorPermutations * architecturePermutations;
  }, [config.indicators, config.referenceModelParams]);

  const validateStep = (step: WizardStep): boolean => {
    const nextErrors: FieldErrors = {};

    if (step === 1) {
      if (!config.name.trim()) nextErrors.name = 'Blueprint name is required.';
    }

    if (step === 2) {
      if (!config.referenceModelId) {
        nextErrors.referenceModelId = 'Select an architecture.';
      }

      Object.entries(config.referenceModelParams).forEach(([paramName, value]) => {
        const key = `architecture.${paramName}`;
        const param = { name: paramName, default: String(selectedArchitecture?.parameterConstraints?.[paramName]?.default ?? ''), type: selectedArchitecture?.parameterConstraints?.[paramName]?.type === 'integer' ? 'integer-list' : selectedArchitecture?.parameterConstraints?.[paramName]?.type === 'number' ? 'number-list' : 'string', constraint: selectedArchitecture?.parameterConstraints?.[paramName] } as IndicatorParamOption;
        if (!value.trim()) {
          nextErrors[key] = 'This architecture parameter is required.';
        } else {
          const invalidToken = tokensFromValue(value).map((token) => validateParamToken(token, param)).find(Boolean);
          if (invalidToken) nextErrors[key] = invalidToken;
        }
      });
    }

    if (step === 3) {
      Object.entries(config.indicators).forEach(([indicatorId, params]) => {
        Object.entries(params).forEach(([paramName, value]) => {
          const key = `indicators.${indicatorId}.${paramName}`;
          const param = indicatorParam(indicatorId, paramName);
          if (!value.trim()) {
            nextErrors[key] = 'This parameter is required.';
          } else {
            const invalidToken = tokensFromValue(value).map((token) => validateParamToken(token, param)).find(Boolean);
            if (invalidToken) nextErrors[key] = invalidToken;
          }
        });
      });
    }

    setFieldErrors(nextErrors);
    const invalid = Object.keys(nextErrors).length > 0;
    setStepError(invalid ? 'Please fix the highlighted fields before continuing.' : null);

    return !invalid;
  };

  const handleNextClick = () => {
    if (!validateStep(currentStep)) return;
    handleNext();
  };

  const handleCreate = async () => {
    if (isSubmitting) return;

    setSubmitError(null);
    setFieldErrors({});

    const flattenedParams = [
      ...Object.entries(config.referenceModelParams).map(([key, value]) => [key, value] as const),
      ...Object.entries(config.indicators).flatMap(([indicatorId, params]) =>
        Object.entries(params).map(([paramName, value]) => [`${indicatorId}.${paramName}`, value] as const),
      ),
    ];

    const parameter_ranges: Record<string, { min: number; max: number }> = {};
    for (const [key, raw] of flattenedParams) {
      const values = raw
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => Number(entry))
        .filter((entry) => !Number.isNaN(entry));

      if (values.length === 0) continue;
      parameter_ranges[key] = { min: Math.min(...values), max: Math.max(...values) };
    }

    try {
      setIsSubmitting(true);
      const response = await createBlueprint({
        metadata: {
          name: config.name.trim(),
          description: config.description.trim() || undefined,
        },
        indicators: {
          selected: Object.keys(config.indicators),
          params: config.indicators,
          definitions: Object.keys(config.indicators).map((id) => {
            const indicator = availableIndicators.find((item) => item.id === id);
            return { name: id, source: indicator?.source, outputs: indicator?.outputs ?? [], parameters: config.indicators[id] ?? {} };
          }),
        },
        architecture: {
          name: config.referenceModelId,
          parameters: config.referenceModelParams,
        },
        parameter_ranges,
      });

      const detailPath = response.data?.blueprint?.detailPath;
      router.push(detailPath || '/blueprints');
    } catch (error) {
      if (error instanceof ApiClientError) {
        const maybeErrors = (error.details as { data?: { errors?: Record<string, string | string[]> } } | undefined)?.data?.errors;
        if (maybeErrors && Object.keys(maybeErrors).length > 0) {
          const firstError = (value: string | string[] | undefined) => {
            if (Array.isArray(value)) return value[0] ?? '';
            return value ? String(value) : '';
          };
          const mappedErrors: FieldErrors = {};
          if (maybeErrors['metadata.name']) mappedErrors.name = firstError(maybeErrors['metadata.name']);
          if (maybeErrors['architecture.reference']) mappedErrors.referenceModelId = firstError(maybeErrors['architecture.reference']);
          if (maybeErrors['indicators.selected']) mappedErrors.indicators = firstError(maybeErrors['indicators.selected']);
          setFieldErrors(mappedErrors);
          setSubmitError('Please fix the highlighted validation errors and try again.');
        } else {
          setSubmitError(error.message || 'Failed to create blueprint.');
        }
      } else {
        setSubmitError('Failed to create blueprint.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderIndicatorOption = (indicator: IndicatorOption) => {
    const selected = Boolean(config.indicators[indicator.id]);
    return (
      <div key={indicator.id} className={`rounded-lg border p-4 transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={selected} onChange={() => toggleIndicator(indicator.id)} />
          <div className="flex-1">
            <p className="font-medium">{indicator.name}</p>
            <p className="text-xs text-muted-foreground">{indicator.category}</p>
            <p className="mt-1 text-xs text-muted-foreground">{indicator.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant={indicator.source === 'custom' ? 'secondary' : 'outline'}>{indicator.source === 'custom' ? 'Custom' : 'TA-Lib'}</Badge>
              {indicator.outputs.map((output) => <Badge key={output} variant="outline">{output}</Badge>)}
            </div>
          </div>
        </div>
        {selected && indicator.params.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {indicator.params.map((param) => (
              <div key={param.name} className="space-y-1">
                <Label className="text-xs">{param.name}</Label>
                {describeConstraint(param) ? <p className="text-[11px] text-muted-foreground">{describeConstraint(param)}</p> : null}
                <TokenizedParameterInput value={config.indicators[indicator.id]?.[param.name] ?? ''} param={param} error={fieldErrors[`indicators.${indicator.id}.${param.name}`]} onChange={(value) => updateIndicatorParam(indicator.id, param.name, value)} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{mode === 'edit' ? 'Edit Blueprint' : 'Create New Blueprint'}</h1>
          <p className="mt-1 text-muted-foreground">
            {mode === 'edit'
              ? 'Update indicators and the architecture for this Blueprint.'
              : 'Assemble indicators and an architecture for a new Blueprint.'}
          </p>
        </div>

        <div className="mb-8">
          <div className="grid grid-cols-4 items-start">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div
                    className={`absolute left-[calc(50%+3rem)] top-5 h-0.5 w-[calc(100%-6rem)] ${currentStep > step.number ? 'bg-primary' : 'bg-border'}`}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${currentStep >= step.number ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground'}`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className={`mt-2 text-xs font-medium sm:text-sm ${currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
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
              {currentStep === 2 && 'Select an architecture from the backend catalog and tune its parameters'}
              {currentStep === 3 && 'Choose indicators and define parameter permutations'}
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
                    onChange={(e) => {
                      setConfig({ ...config, name: e.target.value });
                      clearFieldError('name');
                      setStepError(null);
                    }}
                  />
                  <FormErrorText message={fieldErrors.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blueprint-description">Description</Label>
                  <textarea id="blueprint-description" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Summarize the modeling intent and signals..." value={config.description} onChange={(e) => setConfig({ ...config, description: e.target.value })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <SelectField disabled value={config.category} options={[{ value: 'Literature', label: 'Literature' }, { value: 'Custom', label: 'Custom' }]} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blueprint-tags">Tags (comma separated)</Label>
                  <Input id="blueprint-tags" placeholder="momentum, breakout, ensemble" value={config.tags} onChange={(e) => setConfig({ ...config, tags: e.target.value })} />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-background/50 p-4 text-sm text-muted-foreground">Architectures are fixed ML definitions exposed by the backend catalog. You can select from the catalog but cannot add, remove, or edit them here.</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {metadataArchitectures.map((architecture) => (
                    <div key={architecture.id} className={`cursor-pointer rounded-lg border p-4 transition-colors ${config.referenceModelId === architecture.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={() => selectReferenceModel(architecture.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{architecture.modelName}</p>
                          <p className="text-sm text-muted-foreground">{architecture.blueprintType} · {architecture.status}</p>
                        </div>
                        {config.referenceModelId === architecture.id && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary"><Check className="h-4 w-4 text-primary-foreground" /></div>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary">{architecture.visibility}</Badge>
                        <Badge variant="outline">{architecture.ownerUsername}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <FormErrorText message={fieldErrors.referenceModelId} />
                {selectedArchitecture && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Architecture Parameters</h4>
                      <Badge variant="outline">{selectedArchitecture.modelName}</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.keys(config.referenceModelParams).map((param) => (
                        <div key={param} className="space-y-1">
                          <Label className="text-xs">{param}</Label>
                          {describeConstraint({ name: param, default: String(selectedArchitecture?.parameterConstraints?.[param]?.default ?? ''), type: selectedArchitecture?.parameterConstraints?.[param]?.type === 'integer' ? 'integer-list' : selectedArchitecture?.parameterConstraints?.[param]?.type === 'number' ? 'number-list' : 'string', constraint: selectedArchitecture?.parameterConstraints?.[param] }) ? <p className="text-[11px] text-muted-foreground">{describeConstraint({ name: param, default: String(selectedArchitecture?.parameterConstraints?.[param]?.default ?? ''), type: selectedArchitecture?.parameterConstraints?.[param]?.type === 'integer' ? 'integer-list' : selectedArchitecture?.parameterConstraints?.[param]?.type === 'number' ? 'number-list' : 'string', constraint: selectedArchitecture?.parameterConstraints?.[param] })}</p> : null}
                          <TokenizedParameterInput value={config.referenceModelParams[param]} onChange={(value) => updateModelParam(param, value)} error={fieldErrors[`architecture.${param}`]} param={{ name: param, default: String(selectedArchitecture?.parameterConstraints?.[param]?.default ?? ''), type: selectedArchitecture?.parameterConstraints?.[param]?.type === 'integer' ? 'integer-list' : selectedArchitecture?.parameterConstraints?.[param]?.type === 'number' ? 'number-list' : 'string', constraint: selectedArchitecture?.parameterConstraints?.[param] }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-background/50 p-4 text-sm text-muted-foreground">Type a value and press Space to preserve it as a parameter box. Discrete parameters use a dropdown; selected options are unique and removable.</div>

                <div>
                  <h4 className="mb-3 font-medium">Indicators</h4>
                  <FormErrorText message={fieldErrors.indicators} className="mb-2" />
                  <div className="space-y-6">
                    <section className="space-y-3">
                      <div>
                        <h5 className="font-medium">TA-Lib Indicators</h5>
                        <p className="text-xs text-muted-foreground">TA-Lib functions exposed by the backend adapter. Only backend-declared configurable parameters are shown.</p>
                      </div>
                      {talibIndicators.map(renderIndicatorOption)}
                    </section>
                    <section className="space-y-3">
                      <div>
                        <h5 className="font-medium">Custom Indicators</h5>
                        <p className="text-xs text-muted-foreground">BEE-native Polars indicators computed per split after train/validation/test separation.</p>
                      </div>
                      {customIndicators.map(renderIndicatorOption)}
                    </section>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <h4 className="mb-4 font-medium">Blueprint Summary</h4>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between"><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{config.name}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Category</dt><dd className="font-mono">{config.category}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Indicators</dt><dd className="font-mono">{Object.keys(config.indicators).length}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Architecture</dt><dd className="font-mono">{selectedArchitecture?.modelName ?? 'Not selected'}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Estimated Permutations</dt><dd className="font-mono">{permutationCount}</dd></div>
                  </dl>
                </div>

                <div className="rounded-lg border border-border/60 p-4">
                  <h5 className="mb-3 text-sm font-medium">Metadata</h5>
                  <dl className="space-y-2 text-xs">
                    <div className="flex justify-between"><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{config.name || '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Description</dt><dd className="max-w-[70%] text-right">{config.description || '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Tags</dt><dd>{config.tags || '—'}</dd></div>
                  </dl>
                </div>

                <div className="rounded-lg border border-border/60 p-4">
                  <h5 className="mb-3 text-sm font-medium">Architecture and Parameters</h5>
                  <div className="space-y-2 text-xs">
                    <p>
                      <span className="text-muted-foreground">Architecture:</span>{' '}
                      <span className="font-medium">{architectureLabel || 'Not selected'}</span>
                    </p>
                    {Object.keys(config.referenceModelParams).length === 0 ? (
                      <p className="text-muted-foreground">No architecture parameters configured.</p>
                    ) : (
                      Object.entries(config.referenceModelParams).map(([key, value]) => (
                        <div key={key} className="rounded border border-border/50 p-2">
                          <span className="font-mono font-medium">{key}</span>
                          <span className="ml-2 text-muted-foreground">{value}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 p-4">
                  <h5 className="mb-3 text-sm font-medium">Chosen Indicators and Parameters</h5>
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
              </div>
            )}

            {stepError && currentStep < 4 ? (
              <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {stepError}
              </div>
            ) : null}

            {submitError ? (
              <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {submitError}
              </div>
            ) : null}

            <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || isSubmitting}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
              {currentStep < 4 ? (
                <Button onClick={handleNextClick} disabled={isSubmitting}>Next<ArrowRight className="ml-2 h-4 w-4" /></Button>
              ) : (
                <Button onClick={handleCreate} disabled={isSubmitting} variant="default"><Check className="mr-2 h-4 w-4" />{isSubmitting ? 'Creating...' : (mode === 'edit' ? 'Save Blueprint' : 'Create Blueprint')}</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
