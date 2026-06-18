export interface ExperimentRun {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  queuePosition?: number;
  visibility: 'private' | 'public';
  ownerId: string;
  ownerUsername: string;
  config: {
    symbol: string;
    exchange: string;
    interval: string;
    dateRange: { start: string; end: string };
    indicators: string[];
    features: string[];
    blueprint: string;
  };
  results?: {
    accuracy: number;
    sharpe: number;
    totalReturn: number;
    maxDrawdown: number;
    winRate: number;
    tradesCount: number;
  };
  createdAt: Date;
  completedAt?: Date;
}

export interface ModelResult {
  id: string;
  code: string;
  experimentId: string;
  experimentName: string;
  modelName: string;
  blueprintType: string;
  ownerId: string;
  ownerUsername: string;
  visibility: 'private' | 'public';
  createdAt: Date;
  status: 'trained' | 'validated' | 'failed';
  favoritedBy: string[];
  parameters: Record<string, number | string | boolean>;
  indicatorParams: Record<string, Record<string, number | string | boolean>>;
  featureParams: Record<string, Record<string, number | string | boolean>>;
  dataSplit: {
    train: number;
    val: number;
    test: number;
  };
  metrics: {
    trainAccuracy: number;
    valAccuracy: number;
    testAccuracy: number;
    sharpe: number;
    totalReturn: number;
    maxDrawdown: number;
    winRate: number;
    tradesCount: number;
    profitFactor: number;
  };
}

export interface BlueprintDefinition {
  id: string;
  baseId?: string;
  name: string;
  version: string;
  category: 'Literature' | 'Custom';
  type: 'manifest' | 'custom';
  description: string;
  authorId?: string;
  authorUsername?: string;
  visibility: 'public' | 'private';
  createdAt: Date;
  status: 'active' | 'pending' | 'deprecated';
  approvalStatus?: 'approved' | 'pending' | 'rejected' | 'not_requested';
  approvalRequestedAt?: Date | null;
  approvedAt?: Date | null;
  tags: string[];
  favoritedBy: string[];
  indicators: Record<string, Record<string, string | number | boolean>>;
  features: Record<string, Record<string, string | number | boolean>>;
  referenceModel: {
    name: string;
    family: string;
    params: Record<string, string | number | boolean>;
  };
}

export type SortField = 'testAccuracy' | 'sharpe' | 'totalReturn' | 'winRate' | 'profitFactor' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export function rankModels(models: ModelResult[], sortField: SortField, sortOrder: SortOrder): ModelResult[] {
  return [...models].sort((a, b) => {
    let aVal: number;
    let bVal: number;

    if (sortField === 'createdAt') {
      aVal = a.createdAt.getTime();
      bVal = b.createdAt.getTime();
    } else {
      aVal = a.metrics[sortField];
      bVal = b.metrics[sortField];
    }

    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });
}

export function getUserOwnedModels(models: ModelResult[], userId: string, username?: string): ModelResult[] {
  if (!userId && !username) return [];
  return models.filter((m) =>
    (userId && m.ownerId === userId) || (username && m.ownerUsername === username)
  );
}

export function getUserFavoritedModels(models: ModelResult[], userId: string): ModelResult[] {
  if (!userId) return [];
  return models.filter((m) => m.favoritedBy.includes(userId));
}

export function getPublicModels(models: ModelResult[]): ModelResult[] {
  return models.filter((m) => m.visibility === 'public' && m.status === 'validated');
}

export function getUserOwnedBlueprints(blueprints: BlueprintDefinition[], userId: string, username?: string): BlueprintDefinition[] {
  if (!userId && !username) return [];
  return blueprints.filter(
    (blueprint) =>
      (userId && blueprint.authorId === userId) || (username && blueprint.authorUsername === username)
  );
}

export function getUserFavoritedBlueprints(blueprints: BlueprintDefinition[], userId: string): BlueprintDefinition[] {
  if (!userId) return [];
  return blueprints.filter((blueprint) => blueprint.favoritedBy.includes(userId));
}

export function getPublicBlueprints(blueprints: BlueprintDefinition[]): BlueprintDefinition[] {
  return blueprints.filter(
    (blueprint) =>
      blueprint.visibility === 'public' &&
      (blueprint.approvalStatus ? blueprint.approvalStatus === 'approved' : blueprint.status === 'active')
  );
}

export type ApiExperimentRecord = {
  experiment_id: string;
  owner_user_id: string;
  code?: string;
  name?: string;
  description?: string | null;
  visibility: string;
  market_symbol: string;
  exchange?: string;
  data_interval: string;
  start_date?: string | null;
  end_date?: string | null;
  train_pct?: number;
  val_pct?: number;
  test_pct?: number;
  status?: string | null;
  progress?: number | null;
  queue_position?: number | null;
  created_at?: string;
  completed_at?: string | null;
  config_json?: {
    symbol?: string;
    exchange?: string;
    interval?: string;
    dateRange?: { start: string; end: string };
    indicators?: string[];
    features?: string[];
    blueprint?: string;
  } | null;
  results_json?: {
    accuracy?: number;
    sharpe?: number;
    totalReturn?: number;
    maxDrawdown?: number;
    winRate?: number;
    tradesCount?: number;
  } | null;
};

export type ApiModelRecord = {
  model_id: string;
  experiment_id: string;
  owner_user_id: string;
  code?: string;
  model_name?: string;
  blueprint_type?: string;
  visibility?: string;
  training_state?: string;
  created_at?: string;
  metrics_json?: Record<string, number> | null;
  parameters_json?: Record<string, number | string | boolean> | null;
  indicator_params_json?: Record<string, Record<string, number | string | boolean>> | null;
  feature_params_json?: Record<string, Record<string, number | string | boolean>> | null;
  data_split_json?: { train: number; val: number; test: number } | null;
};

export type ApiUserRecord = {
  user_id?: string;
  id?: string;
  username?: string;
  name?: string;
};

export type ApiBlueprintRecord = {
  blueprint_id: string;
  base_id?: string;
  name: string;
  version: string;
  category: string;
  blueprint_type: string;
  description: string;
  visibility: string;
  status: string;
  approval_status?: string;
  approval_requested_at?: string | null;
  approved_at?: string | null;
  tags: string[];
  indicators: Record<string, Record<string, string | number | boolean>>;
  features: Record<string, Record<string, string | number | boolean>>;
  reference_model: { name: string; family: string; params: Record<string, string | number | boolean> };
  author_user_id?: string;
  author_username?: string;
  created_at?: string;
};

export function createUserLookup(users: ApiUserRecord[]): Map<string, string> {
  return new Map(
    users
      .map((user) => {
        const id = user.user_id || user.id;
        if (!id) return null;
        return [id, user.username || user.name || 'unknown'] as const;
      })
      .filter(Boolean) as Array<[string, string]>
  );
}

export function mapApiExperiment(
  experiment: ApiExperimentRecord,
  userLookup: Map<string, string>
): ExperimentRun {
  const config = experiment.config_json || {};
  const results = experiment.results_json || undefined;
  return {
    id: experiment.experiment_id,
    code: experiment.code || `EX-${experiment.experiment_id.slice(0, 6)}`,
    name: experiment.name || 'Experiment',
    description: experiment.description || undefined,
    status: ((experiment.status || 'queued').toLowerCase() as ExperimentRun['status']) || 'queued',
    progress: Number(experiment.progress ?? 0),
    queuePosition: experiment.queue_position ?? undefined,
    visibility: (experiment.visibility || 'PRIVATE').toLowerCase() as ExperimentRun['visibility'],
    ownerId: experiment.owner_user_id,
    ownerUsername: userLookup.get(experiment.owner_user_id) || 'unknown',
    config: {
      symbol: config.symbol || experiment.market_symbol,
      exchange: config.exchange || experiment.exchange || 'binance',
      interval: config.interval || experiment.data_interval,
      dateRange: config.dateRange || {
        start: experiment.start_date || '',
        end: experiment.end_date || '',
      },
      indicators: config.indicators || [],
      features: config.features || [],
      blueprint: config.blueprint || '',
    },
    results: results
      ? {
          accuracy: results.accuracy ?? 0,
          sharpe: results.sharpe ?? 0,
          totalReturn: results.totalReturn ?? 0,
          maxDrawdown: results.maxDrawdown ?? 0,
          winRate: results.winRate ?? 0,
          tradesCount: results.tradesCount ?? 0,
        }
      : undefined,
    createdAt: new Date(experiment.created_at || Date.now()),
    completedAt: experiment.completed_at ? new Date(experiment.completed_at) : undefined,
  };
}

export function mapApiModel(
  model: ApiModelRecord,
  experimentLookup: Map<string, ExperimentRun>,
  userLookup: Map<string, string>
): ModelResult {
  const experiment = experimentLookup.get(model.experiment_id);
  const metrics = model.metrics_json || {};
  const dataSplit = model.data_split_json || { train: 70, val: 15, test: 15 };
  const trainingState = (model.training_state || 'trained').toLowerCase();
  const status = trainingState === 'completed' ? 'validated' : trainingState === 'failed' ? 'failed' : 'trained';
  return {
    id: model.model_id,
    code: model.code || `MD-${model.model_id.slice(0, 6)}`,
    experimentId: model.experiment_id,
    experimentName: experiment?.name || 'Experiment',
    modelName: model.model_name || 'Model',
    blueprintType: model.blueprint_type || 'unknown',
    ownerId: model.owner_user_id,
    ownerUsername: userLookup.get(model.owner_user_id) || 'unknown',
    visibility: (model.visibility || 'PRIVATE').toLowerCase() as ModelResult['visibility'],
    createdAt: new Date(model.created_at || Date.now()),
    status,
    favoritedBy: [],
    parameters: model.parameters_json || {},
    indicatorParams: model.indicator_params_json || {},
    featureParams: model.feature_params_json || {},
    dataSplit: {
      train: dataSplit.train ?? 70,
      val: dataSplit.val ?? 15,
      test: dataSplit.test ?? 15,
    },
    metrics: {
      trainAccuracy: metrics.trainAccuracy ?? 0,
      valAccuracy: metrics.valAccuracy ?? 0,
      testAccuracy: metrics.testAccuracy ?? 0,
      sharpe: metrics.sharpe ?? 0,
      totalReturn: metrics.totalReturn ?? 0,
      maxDrawdown: metrics.maxDrawdown ?? 0,
      winRate: metrics.winRate ?? 0,
      tradesCount: metrics.tradesCount ?? 0,
      profitFactor: metrics.profitFactor ?? 0,
    },
  };
}

export function mapApiBlueprint(blueprint: ApiBlueprintRecord): BlueprintDefinition {
  return {
    id: blueprint.blueprint_id,
    baseId: blueprint.base_id,
    name: blueprint.name,
    version: blueprint.version,
    category: (blueprint.category === 'Literature' ? 'Literature' : 'Custom') as BlueprintDefinition['category'],
    type: (blueprint.blueprint_type === 'custom' ? 'custom' : 'manifest') as BlueprintDefinition['type'],
    description: blueprint.description,
    authorId: blueprint.author_user_id,
    authorUsername: blueprint.author_username,
    visibility: (blueprint.visibility === 'private' ? 'private' : 'public') as BlueprintDefinition['visibility'],
    createdAt: new Date(blueprint.created_at || Date.now()),
    status: (blueprint.status === 'pending' ? 'pending' : blueprint.status === 'deprecated' ? 'deprecated' : 'active') as BlueprintDefinition['status'],
    approvalStatus: (blueprint.approval_status || 'approved') as BlueprintDefinition['approvalStatus'],
    approvalRequestedAt: blueprint.approval_requested_at ? new Date(blueprint.approval_requested_at) : null,
    approvedAt: blueprint.approved_at ? new Date(blueprint.approved_at) : null,
    tags: blueprint.tags || [],
    favoritedBy: [],
    indicators: blueprint.indicators || {},
    features: blueprint.features || {},
    referenceModel: {
      name: blueprint.reference_model?.name || 'Reference',
      family: blueprint.reference_model?.family || 'unknown',
      params: (blueprint.reference_model?.params || {}) as Record<string, string | number | boolean>,
    },
  };
}