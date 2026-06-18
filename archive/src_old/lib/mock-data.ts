import { mockExperiments } from '@/data/mock_experiments';
import { mockModels } from '@/data/mock_models';
import { mockBlueprints } from '@/data/mock_blueprints';
import { mockUsers } from '@/data/mock_users';
import { mockIndicators, mockFeatures, mockIntervals, systemConfig } from '@/data/mock_meta';
import type {
  ApiExperimentRecord,
  ApiModelRecord,
  ApiBlueprintRecord,
  ApiUserRecord,
} from '@/lib/data-utils';

const normalizeId = (value: string) => value.toLowerCase().replace(/\s+/g, '_');

const getUserByUsername = (username?: string) =>
  mockUsers.find((user) => user.username === username) ?? mockUsers[0];

const buildIndicatorParams = () =>
  Object.fromEntries(
    mockIndicators.slice(0, 3).map((indicator) => [
      normalizeId(indicator.name),
      Object.fromEntries((indicator.params || []).map((param) => [param.name, param.default])),
    ])
  );

const buildFeatureParams = () =>
  Object.fromEntries(
    mockFeatures.slice(0, 3).map((feature) => [normalizeId(feature.name), {}])
  );

const deriveBlueprintTags = (name: string) => {
  const lower = name.toLowerCase();
  const tags = new Set<string>();

  if (lower.includes('momentum')) tags.add('momentum');
  if (lower.includes('volatility') || lower.includes('regime')) tags.add('volatility');
  if (lower.includes('mean reversion') || lower.includes('reversion')) tags.add('mean-reversion');
  if (lower.includes('funding')) tags.add('funding');
  if (lower.includes('liquidity') || lower.includes('sweep')) tags.add('liquidity');
  if (lower.includes('vwap')) tags.add('intraday');

  if (tags.size === 0) tags.add('baseline');
  return Array.from(tags);
};

const deriveReferenceFamily = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('funding') || lower.includes('regime')) return 'xgboost';
  if (lower.includes('vwap') || lower.includes('liquidity')) return 'lightgbm';
  if (lower.includes('volatility')) return 'random_forest';
  return 'logreg';
};

export const mockApiUsers = (): ApiUserRecord[] =>
  mockUsers.map((user) => ({
    user_id: user.id,
    id: user.id,
    username: user.username,
    name: user.name,
  }));

export const mockApiExperiments = (): ApiExperimentRecord[] =>
  mockExperiments.map((experiment, index) => {
    const owner = getUserByUsername(experiment.owner);
    return {
      experiment_id: experiment.id,
      owner_user_id: owner?.id || '1',
      code: `EX-${experiment.id}`,
      name: experiment.name,
      description: experiment.description,
      visibility: 'PUBLIC',
      market_symbol: experiment.symbol,
      exchange: 'binance',
      data_interval: experiment.interval,
      start_date: experiment.date_range.start,
      end_date: experiment.date_range.end,
      status: experiment.status,
      progress: experiment.progress,
      queue_position: experiment.status === 'queued' ? index + 1 : null,
      created_at: experiment.created_at,
      completed_at: experiment.status === 'completed' ? experiment.updated_at : null,
      config_json: {
        symbol: experiment.symbol,
        exchange: 'binance',
        interval: experiment.interval,
        dateRange: experiment.date_range,
        indicators: ['SMA', 'RSI'],
        features: ['momentum'],
        blueprint: 'momentum',
      },
      results_json: {
        sharpe: experiment.metrics.sharpe ?? 0,
        accuracy: experiment.metrics.accuracy ?? 0,
        maxDrawdown: experiment.metrics.max_drawdown ?? 0,
        winRate: experiment.metrics.win_rate ?? 0,
        totalReturn: (experiment.metrics.win_rate ?? 0) * 100,
        tradesCount: 120,
      },
    };
  });

export const mockApiModels = (): ApiModelRecord[] =>
  mockModels.map((model) => {
    const owner = getUserByUsername(model.owner);
    return {
      model_id: model.id,
      experiment_id: model.experiment_id,
      owner_user_id: owner?.id || '1',
      code: `MD-${model.id}`,
      model_name: model.name,
      blueprint_type: 'manifest',
      visibility: 'PUBLIC',
      training_state: 'completed',
      created_at: model.created_at,
      metrics_json: {
        testAccuracy: model.metrics.accuracy ?? 0,
        sharpe: model.metrics.sharpe ?? 0,
        totalReturn: (model.metrics.win_rate ?? 0) * 100,
        maxDrawdown: model.metrics.max_drawdown ?? 0,
        winRate: model.metrics.win_rate ?? 0,
        profitFactor: 1.6,
      },
      parameters_json: model.parameters,
      indicator_params_json: {},
      feature_params_json: {},
      data_split_json: { train: 70, val: 15, test: 15 },
    };
  });

export const mockApiBlueprints = (): ApiBlueprintRecord[] => {
  const indicatorParams = buildIndicatorParams();
  const featureParams = buildFeatureParams();

  return mockBlueprints.map((blueprint) => {
    const owner = getUserByUsername(blueprint.owner);
    const isPublished = blueprint.status === 'published';
    const category = owner?.username === 'alex' ? 'Custom' : 'Literature';
    return {
      blueprint_id: blueprint.id,
      base_id: null,
      name: blueprint.name,
      version: '1.0',
      category,
      blueprint_type: 'manifest',
      description: blueprint.description,
      visibility: 'public',
      status: isPublished ? 'active' : 'pending',
      approval_status: isPublished ? 'approved' : 'pending',
      approval_requested_at: isPublished ? null : blueprint.updated_at,
      approved_at: isPublished ? blueprint.updated_at : null,
      tags: deriveBlueprintTags(blueprint.name),
      indicators: indicatorParams,
      features: featureParams,
      reference_model: {
        name: 'Reference',
        family: deriveReferenceFamily(blueprint.name),
        params: { lr: 0.01, l2: 0.1 },
      },
      author_user_id: owner?.id || '1',
      author_username: owner?.username || 'alex',
      created_at: blueprint.created_at,
    };
  });
};

export const mockMeta = () => ({
  indicators: mockIndicators.map((indicator) => ({
    id: normalizeId(indicator.name),
    name: indicator.name,
    category: indicator.category || indicator.type,
    params: indicator.params || [],
  })),
  features: mockFeatures.map((feature) => ({
    id: normalizeId(feature.name),
    name: feature.name,
    description: feature.description,
  })),
  intervals: mockIntervals.map((interval) => ({
    value: interval.name,
    label: interval.description || interval.name,
  })),
  systemConfig,
  jobQueue: {
    experiment: mockExperiments
      .filter((exp) => exp.status === 'queued' || exp.status === 'running')
      .map((exp, index) => ({
        id: exp.id,
        username: exp.owner,
        position: index + 1,
        submittedAt: exp.created_at,
        status: exp.status,
      })),
  },
});