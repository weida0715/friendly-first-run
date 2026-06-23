import { API_ENDPOINTS, buildApiUrl } from './endpoints';

export interface BackendHealthResponse {
  ok: boolean;
  service: string;
  version: string;
  environment: string;
  status: string;
}

export interface RegisterUserRequest {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface RegisterUserResponse {
  ok: boolean;
  data?: {
    user?: {
      id?: string | number;
      username?: string;
      email?: string;
      name?: string;
      role?: string;
      status?: string;
    };
  };
}

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  ok: boolean;
  data?: {
    user?: {
      id?: string | number;
      username?: string;
      email?: string;
      name?: string;
      role?: string;
      status?: string;
    };
  };
}

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.auth.csrf), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as { data?: { csrfToken?: string } };
    return payload.data?.csrfToken ?? null;
  } catch {
    return null;
  }
}

async function withCsrfHeaders(init: RequestInit | undefined, method: string): Promise<RequestInit> {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    return {
      ...init,
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
    };
  }

  const csrfToken = await fetchCsrfToken();
  return {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(method === 'GET' ? {} : { 'Content-Type': 'application/json' }),
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
      ...init?.headers,
    },
  };
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message =
      payload?.error?.message ?? payload?.message ?? `Request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status, payload);
  }

  return payload as T;
}

function toNetworkApiClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }
  const message =
    error instanceof Error && error.message
      ? `Network request failed: ${error.message}. This may be caused by ad/privacy blockers or backend unavailability.`
      : 'Network request failed. This may be caused by ad/privacy blockers or backend unavailability.';
  return new ApiClientError(message, 0, error);
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(buildApiUrl(path), {
      ...init,
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
    });

    return parseJsonResponse<T>(response);
  } catch (error) {
    throw toNetworkApiClientError(error);
  }
}

export async function apiPost<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(buildApiUrl(path), {
      ...await withCsrfHeaders(init, 'POST'),
      method: 'POST',
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    return parseJsonResponse<T>(response);
  } catch (error) {
    throw toNetworkApiClientError(error);
  }
}

export async function apiPatch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(buildApiUrl(path), {
      ...await withCsrfHeaders(init, 'PATCH'),
      method: 'PATCH',
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    return parseJsonResponse<T>(response);
  } catch (error) {
    throw toNetworkApiClientError(error);
  }
}

export async function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(buildApiUrl(path), {
      ...await withCsrfHeaders(init, 'DELETE'),
      method: 'DELETE',
      credentials: 'include',
    });

    return parseJsonResponse<T>(response);
  } catch (error) {
    throw toNetworkApiClientError(error);
  }
}

export function getBackendHealth(): Promise<BackendHealthResponse> {
  return apiGet<BackendHealthResponse>(API_ENDPOINTS.health);
}

export function registerUser(payload: RegisterUserRequest): Promise<RegisterUserResponse> {
  return apiPost<RegisterUserResponse>(API_ENDPOINTS.auth.register, payload);
}

export function loginUser(payload: LoginUserRequest): Promise<LoginUserResponse> {
  return apiPost<LoginUserResponse>(API_ENDPOINTS.auth.login, payload);
}

export interface LogoutUserResponse {
  ok: boolean;
  data?: {
    loggedOut?: boolean;
  };
}

export function logoutUser(): Promise<LogoutUserResponse> {
  return apiPost<LogoutUserResponse>(API_ENDPOINTS.auth.logout);
}

export interface CurrentUser {
  id: string | number;
  username: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

export interface CurrentUserResponse {
  ok: boolean;
  data?: {
    user?: CurrentUser;
  };
}

export function getCurrentUser(): Promise<CurrentUserResponse> {
  return apiGet<CurrentUserResponse>(API_ENDPOINTS.auth.me);
}

export type UserListItem = CurrentUser;

export interface UserListResponse {
  ok: boolean;
  data?: {
    items: UserListItem[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface UserProfileResponse {
  ok: boolean;
  data?: { user?: CurrentUser };
}

export interface UserAuditItem {
  action: string;
  actor: string;
  timestamp: string;
  details: string;
}

export interface UserAuditResponse {
  ok: boolean;
  data?: { items?: UserAuditItem[] };
}

export interface CreateManagedUserRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  role?: 'User' | 'Moderator' | 'Admin';
}

export function listUsers(params: {
  q?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<UserListResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.role) query.set('role', params.role);
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const suffix = query.toString();
  const path = suffix ? `${API_ENDPOINTS.users.list}?${suffix}` : API_ENDPOINTS.users.list;
  return apiGet<UserListResponse>(path);
}

export function getMyProfile(): Promise<UserProfileResponse> {
  return apiGet<UserProfileResponse>(API_ENDPOINTS.users.me);
}

export function getUserProfile(userId: string | number): Promise<UserProfileResponse> {
  return apiGet<UserProfileResponse>(API_ENDPOINTS.users.byId(userId));
}

export function getUserAuditTrail(userId: string | number): Promise<UserAuditResponse> {
  return apiGet<UserAuditResponse>(API_ENDPOINTS.users.audit(userId));
}

export function createManagedUser(payload: CreateManagedUserRequest): Promise<UserProfileResponse> {
  return apiPost<UserProfileResponse>(API_ENDPOINTS.users.list, payload);
}

export function updateManagedUserStatus(
  userId: string | number,
  status: 'Enabled' | 'Disabled',
): Promise<UserProfileResponse> {
  return apiPatch<UserProfileResponse>(API_ENDPOINTS.users.status(userId), { status });
}

export function resetManagedUserPassword(
  userId: string | number,
  password: string,
): Promise<UserProfileResponse> {
  return apiPatch<UserProfileResponse>(API_ENDPOINTS.users.password(userId), { password });
}

export function updateManagedUserRole(
  userId: string | number,
  role: 'User' | 'Moderator' | 'Admin',
): Promise<UserProfileResponse> {
  return apiPatch<UserProfileResponse>(API_ENDPOINTS.users.role(userId), { role });
}

export function deleteManagedUser(userId: string | number): Promise<{ ok: boolean; data?: { deleted?: boolean } }> {
  return apiDelete<{ ok: boolean; data?: { deleted?: boolean } }>(API_ENDPOINTS.users.delete(userId));
}

export interface FavoriteBlueprintResponse {
  ok: boolean;
  data?: {
    favorited?: boolean;
  };
}

export function favoriteBlueprint(blueprintId: string | number): Promise<FavoriteBlueprintResponse> {
  return apiPost<FavoriteBlueprintResponse>(`${API_ENDPOINTS.blueprints.byId(blueprintId)}/favorite`);
}

export function unfavoriteBlueprint(blueprintId: string | number): Promise<FavoriteBlueprintResponse> {
  return apiDelete<FavoriteBlueprintResponse>(`${API_ENDPOINTS.blueprints.byId(blueprintId)}/favorite`);
}

export interface ModelItem {
  id: number;
  experiment: { id: number; name?: string | null; status?: string | null };
  blueprint: { id: number; name?: string | null; approvalState?: string | null; version?: number | null };
  owner: { id: number; username?: string | null; name?: string | null };
  parameters: Record<string, unknown>;
  parameterHash?: string | null;
  metrics: Record<string, unknown>;
  logMetrics?: Array<Record<string, unknown>>;
  createdAt?: string | null;
  isFavorited?: boolean;
  detailPath: string;
}

export interface ModelHighlightItem extends ModelItem {
  rankMetric?: { key?: string; value?: number | null };
}

export interface ModelListResponse {
  ok: boolean;
  data?: {
    items?: ModelItem[];
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
    sort?: string;
    order?: string;
  };
}

export interface ModelHighlightsResponse {
  ok: boolean;
  data?: {
    sharpe?: ModelHighlightItem[];
    totalReturn?: ModelHighlightItem[];
    accuracy?: ModelHighlightItem[];
    winRate?: ModelHighlightItem[];
  };
}

export interface ModelDetailResponse {
  ok: boolean;
  data?: { model?: ModelItem };
}

export interface FavoriteModelResponse {
  ok: boolean;
  data?: { favorited?: boolean };
}

export interface ModelQueryParams {
  sort?: string;
  order?: string;
  q?: string;
  filters?: Array<Record<string, unknown>>;
  includeIncomplete?: boolean;
  experimentId?: string | number;
  blueprintId?: string | number;
  page?: number;
  pageSize?: number;
}

function modelQuery(params: ModelQueryParams = {}) {
  const query = new URLSearchParams();
  if (params.sort) query.set('sort', params.sort);
  if (params.order) query.set('order', params.order);
  if (params.q) query.set('q', params.q);
  if (params.filters?.length) query.set('filters', JSON.stringify(params.filters));
  if (params.includeIncomplete) query.set('includeIncomplete', 'true');
  if (params.experimentId) query.set('experimentId', String(params.experimentId));
  if (params.blueprintId) query.set('blueprintId', String(params.blueprintId));
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  return query.toString();
}

export function getModelRankings(params: ModelQueryParams = {}): Promise<ModelListResponse> {
  const suffix = modelQuery(params);
  return apiGet<ModelListResponse>(suffix ? `${API_ENDPOINTS.models.rankings}?${suffix}` : API_ENDPOINTS.models.rankings);
}

export function getModelHighlights(scope?: 'direct' | 'log'): Promise<ModelHighlightsResponse> {
  return apiGet<ModelHighlightsResponse>(scope ? `${API_ENDPOINTS.models.highlights}?scope=${scope}` : API_ENDPOINTS.models.highlights);
}

export function getFavoritedModels(params: Pick<ModelQueryParams, 'experimentId' | 'blueprintId'> = {}): Promise<ModelListResponse> {
  const suffix = modelQuery(params);
  return apiGet<ModelListResponse>(suffix ? `${API_ENDPOINTS.models.favorited}?${suffix}` : API_ENDPOINTS.models.favorited);
}

export function getModelDetail(modelId: string | number): Promise<ModelDetailResponse> {
  return apiGet<ModelDetailResponse>(API_ENDPOINTS.models.byId(modelId));
}

export type HubTab = 'users' | 'experiments' | 'models' | 'blueprints';

export interface PublicHubResponse {
  ok: boolean;
  data?: {
    tab?: HubTab;
    items?: Array<Record<string, unknown>>;
  };
}

export interface PublicProfileResponse {
  ok: boolean;
  data?: {
    user?: Record<string, unknown>;
    experiments?: Array<Record<string, unknown>>;
    models?: Array<Record<string, unknown>>;
    blueprints?: Array<Record<string, unknown>>;
  };
}

export interface SystemEventItem {
  id?: string | number;
  scope?: string;
  action?: string;
  actor?: string;
  targetType?: string | null;
  targetId?: string | null;
  message?: string;
  createdAt?: string;
}

export interface SystemEventsResponse {
  ok: boolean;
  data?: { items?: SystemEventItem[] };
}

export function getPublicHub(params: {
  tab?: HubTab;
  q?: string;
  ownerId?: string;
  metric?: string;
  status?: string;
  from?: string;
  to?: string;
} = {}): Promise<PublicHubResponse> {
  const query = new URLSearchParams();
  if (params.tab) query.set('tab', params.tab);
  if (params.q) query.set('q', params.q);
  if (params.ownerId) query.set('ownerId', params.ownerId);
  if (params.metric) query.set('metric', params.metric);
  if (params.status) query.set('status', params.status);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  const suffix = query.toString();
  return apiGet<PublicHubResponse>(suffix ? `${API_ENDPOINTS.hub.list}?${suffix}` : API_ENDPOINTS.hub.list);
}

export function getPublicProfile(userId: string | number): Promise<PublicProfileResponse> {
  return apiGet<PublicProfileResponse>(API_ENDPOINTS.hub.user(userId));
}

export function getSystemEvents(scope?: string, limit = 50): Promise<SystemEventsResponse> {
  const query = new URLSearchParams();
  if (scope) query.set('scope', scope);
  query.set('limit', String(limit));
  const suffix = query.toString();
  return apiGet<SystemEventsResponse>(suffix ? `${API_ENDPOINTS.system.events}?${suffix}` : API_ENDPOINTS.system.events);
}

export function getSystemEventsDownloadUrl(scope?: string, limit = 100000): string {
  const query = new URLSearchParams();
  if (scope) query.set('scope', scope);
  query.set('limit', String(limit));
  const suffix = query.toString();
  return suffix ? `${API_ENDPOINTS.system.eventsDownload}?${suffix}` : API_ENDPOINTS.system.eventsDownload;
}

export interface DocumentationResponse {
  ok: boolean;
  data?: {
    items?: Array<{ slug: string; title: string; category: string }>;
    doc?: { slug: string; title: string; category: string; body: string };
  };
}

export function listDocumentation(q?: string): Promise<DocumentationResponse> {
  return apiGet<DocumentationResponse>(q ? `${API_ENDPOINTS.docs.list}?q=${encodeURIComponent(q)}` : API_ENDPOINTS.docs.list);
}

export function getDocumentation(slug: string): Promise<DocumentationResponse> {
  return apiGet<DocumentationResponse>(API_ENDPOINTS.docs.bySlug(slug));
}

export function favoriteModel(modelId: string | number): Promise<FavoriteModelResponse> {
  return apiPost<FavoriteModelResponse>(API_ENDPOINTS.models.favorite(modelId));
}

export function unfavoriteModel(modelId: string | number): Promise<FavoriteModelResponse> {
  return apiDelete<FavoriteModelResponse>(API_ENDPOINTS.models.favorite(modelId));
}

export interface RequestBlueprintApprovalResponse {
  ok: boolean;
  data?: {
    blueprint?: {
      id?: string | number;
      approvalState?: string;
      submittedAt?: string | null;
      version?: number;
    };
  };
}

export function requestBlueprintApproval(blueprintId: string | number): Promise<RequestBlueprintApprovalResponse> {
  return apiPost<RequestBlueprintApprovalResponse>(`${API_ENDPOINTS.blueprints.byId(blueprintId)}/request-approval`);
}

export interface ModerationQueueItem {
  id: number;
  name: string;
  approvalState: string;
  version: number;
  submittedAt?: string | null;
  updatedAt: string;
}

export function getBlueprintModerationQueue(): Promise<{ ok: boolean; data?: { items?: ModerationQueueItem[] } }> {
  return apiGet<{ ok: boolean; data?: { items?: ModerationQueueItem[] } }>(`/blueprints/moderation/queue`);
}

export function approveBlueprint(blueprintId: string | number): Promise<RequestBlueprintApprovalResponse> {
  return apiPost<RequestBlueprintApprovalResponse>(`${API_ENDPOINTS.blueprints.byId(blueprintId)}/approve`);
}

export function rejectBlueprint(blueprintId: string | number): Promise<RequestBlueprintApprovalResponse> {
  return apiPost<RequestBlueprintApprovalResponse>(`${API_ENDPOINTS.blueprints.byId(blueprintId)}/reject`);
}

export function disapproveBlueprint(blueprintId: string | number): Promise<RequestBlueprintApprovalResponse> {
  return apiPost<RequestBlueprintApprovalResponse>(`${API_ENDPOINTS.blueprints.byId(blueprintId)}/disapprove`);
}

export interface CreateBlueprintRequest {
  metadata: {
    name: string;
    description?: string;
  };
  indicators: {
    selected: string[];
    params?: Record<string, Record<string, string>>;
    definitions?: Array<{ name: string; source?: string; outputs: string[] }>;
  };
  architecture: {
    name?: string;
    reference?: string;
    parameters?: Record<string, number | string>;
    settings?: Record<string, number | string>;
  };
  parameter_ranges: Record<string, { min: number; max: number }>;
}

export interface CreateBlueprintResponse {
  ok: boolean;
  data?: {
    blueprint?: {
      id?: string | number;
      version?: number;
      approvalState?: string;
      detailPath?: string;
    };
    errors?: Record<string, string>;
  };
}

export function createBlueprint(payload: CreateBlueprintRequest): Promise<CreateBlueprintResponse> {
  return apiPost<CreateBlueprintResponse>('/blueprints/', payload);
}

export interface BlueprintLibraryItem {
  id: number;
  name: string;
  approvalState: string;
  version: number;
  ownerId: number;
  updatedAt: string;
  isFavorited?: boolean;
}

export interface BlueprintLibraryResponse {
  ok: boolean;
  data?: {
    items?: BlueprintLibraryItem[];
  };
}

export function listOwnedBlueprints(params: { name?: string; status?: string } = {}): Promise<BlueprintLibraryResponse> {
  const query = new URLSearchParams();
  if (params.name) query.set('name', params.name);
  if (params.status) query.set('status', params.status);
  const suffix = query.toString();
  return apiGet<BlueprintLibraryResponse>(suffix ? `/blueprints/library/owned?${suffix}` : '/blueprints/library/owned');
}

export interface BlueprintMetadataResponse {
  ok: boolean;
  data?: { architectures?: Array<Record<string, unknown>>; indicators?: Array<Record<string, unknown>>; targets?: Array<Record<string, unknown>> };
}

export function getBlueprintMetadata(): Promise<BlueprintMetadataResponse> {
  return apiGet<BlueprintMetadataResponse>(API_ENDPOINTS.blueprints.metadata);
}

export interface ExperimentBlueprintOption {
  id: number;
  name: string;
  version: number;
  ownerId: number;
  updatedAt: string;
}

export function getExperimentBlueprintOptions(): Promise<{ ok: boolean; data?: { items?: ExperimentBlueprintOption[] } }> {
  return apiGet<{ ok: boolean; data?: { items?: ExperimentBlueprintOption[] } }>(API_ENDPOINTS.experiments.blueprintOptions);
}

export interface CreateExperimentRequest {
  name: string;
  description?: string;
  symbol: 'BTCUSDT';
  interval: '1m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '1d';
  start_datetime?: string;
  end_datetime?: string;
  start_date?: string;
  end_date?: string;
  candlestick_amount?: number;
  train_split: number;
  val_split: number;
  test_split: number;
  split_strategy?: 'random' | 'time_based_sequential';
  target_strategy?: string;
  deterministic?: boolean;
  seed?: number;
  blueprint_id: number;
  parameter_overrides: Record<string, unknown>;
}

export interface CreateExperimentResponse {
  ok: boolean;
  data?: {
    experiment?: {
      id?: string | number;
      detailPath?: string;
      status?: string;
      progress?: number;
    };
    job?: {
      id?: string;
    };
    queue?: {
      position?: number | null;
      queueName?: string;
      etaSeconds?: number | null;
    };
    errors?: Record<string, string>;
  };
}

export function createExperiment(payload: CreateExperimentRequest): Promise<CreateExperimentResponse> {
  return apiPost<CreateExperimentResponse>(API_ENDPOINTS.experiments.create, payload);
}

export interface ExperimentListItem {
  id: number;
  name: string;
  status: string;
  progress: number;
  interval: string;
  startDate: string;
  endDate: string;
  blueprintId: number;
  createdAt: string;
  completedAt?: string | null;
  detailPath: string;
}

export interface ExperimentDetailResponse {
  ok: boolean;
  data?: {
    experiment?: {
      id: number;
      name: string;
      description?: string | null;
      status: string;
      progress: number;
      interval: string;
      startDate: string;
      endDate: string;
      splits: { train: number; val: number; test: number };
      parameterOverrides: Record<string, unknown>;
      blueprint: { id: number; name?: string | null; version?: number | null };
      timestamps: { createdAt: string; completedAt?: string | null };
      links: { models: string; jobs: string; logs: string };
      queue?: { position?: number | null; queueName?: string; etaSeconds?: number | null };
      job?: { id?: string | null };
      canCancelQueued?: boolean;
    };
  };
}

export function listExperiments(params: { status?: string; search?: string } = {}): Promise<{ ok: boolean; data?: { items?: ExperimentListItem[] } }> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  const suffix = query.toString();
  const path = suffix ? `${API_ENDPOINTS.experiments.list}?${suffix}` : API_ENDPOINTS.experiments.list;
  return apiGet<{ ok: boolean; data?: { items?: ExperimentListItem[] } }>(path);
}

export function getExperimentDetail(experimentId: string | number): Promise<ExperimentDetailResponse> {
  return apiGet<ExperimentDetailResponse>(API_ENDPOINTS.experiments.byId(experimentId));
}

export function cancelExperiment(experimentId: string | number): Promise<{ ok: boolean; data?: { experiment?: { id: number; cancelled: boolean; jobId?: string } } }> {
  return apiPost(API_ENDPOINTS.experiments.cancel(experimentId));
}

export function retryExperiment(experimentId: string | number): Promise<{ ok: boolean; data?: { experiment?: { id: number; status: string; progress: number; jobId?: string } } }> {
  return apiPost(API_ENDPOINTS.experiments.retry(experimentId));
}

export function deleteExperiment(experimentId: string | number): Promise<{ ok: boolean; data?: { deleted?: boolean; experimentId?: number } }> {
  return apiDelete(API_ENDPOINTS.experiments.delete(experimentId));
}

export interface ModelRoundLogRow {
  roundIndex: number;
  timestamp?: string | null;
  predicted?: number | string | null;
  actual?: number | string | null;
  outcome?: 'win' | 'lose' | 'none' | string;
  signal?: number | null;
  parameterHash?: string | null;
}

export interface ModelRoundLogResponse {
  ok: boolean;
  data?: {
    modelId?: number;
    rows?: ModelRoundLogRow[];
  };
}

export function getModelRoundLog(experimentId: string | number, modelId: string | number): Promise<ModelRoundLogResponse> {
  return apiGet<ModelRoundLogResponse>(API_ENDPOINTS.logs.modelRound(experimentId, modelId));
}

export interface JobDetailResponse {
  ok: boolean;
  data?: {
    job?: {
      id: string;
      state: string;
      type: string;
      ownerId: number;
      queue?: { name?: string; position?: number | null };
      worker?: { name?: string | null };
      timestamps?: { enqueuedAt?: string | null; startedAt?: string | null; endedAt?: string | null };
      error?: { snippet?: string | null };
      experiment?: { id: number; name: string; status: string; progress: number };
    };
  };
}

export function getJobDetail(jobId: string | number): Promise<JobDetailResponse> {
  return apiGet<JobDetailResponse>(API_ENDPOINTS.jobs.byId(jobId));
}

export interface JobListResponse {
  ok: boolean;
  data?: {
    items?: Array<{
      id: string;
      state: string;
      type: string;
      ownerId: number;
      queue?: { name?: string; position?: number | null };
      experiment?: { id: number; name: string; status: string; progress: number };
      detailPath: string;
    }>;
  };
}

export function listJobs(): Promise<JobListResponse> {
  return apiGet<JobListResponse>(API_ENDPOINTS.jobs.list);
}

export interface CancelJobResponse {
  ok: boolean;
  data?: {
    job?: {
      id: string;
      state: string;
      cancelled: boolean;
    };
  };
}

export function cancelJob(jobId: string | number): Promise<CancelJobResponse> {
  return apiPost<CancelJobResponse>(API_ENDPOINTS.jobs.cancel(jobId));
}

export interface ActiveQueueSnapshotResponse {
  ok: boolean;
  data?: {
    queue?: {
      queue_depth: number;
      running_jobs: number;
      active_jobs_total: number;
      active_jobs: Array<{
        job_id: string;
        state: string;
        queue_name?: string;
        position?: number | null;
      }>;
    };
  };
}

export function getActiveQueueSnapshot(): Promise<ActiveQueueSnapshotResponse> {
  return apiGet<ActiveQueueSnapshotResponse>(API_ENDPOINTS.system.activeQueue);
}

export interface SystemSettingsResponse {
  ok: boolean;
  data?: {
    settings?: Record<string, number>;
    metadata?: Array<{
      key: string;
      default: number;
      min: number;
      max: number;
      label: string;
      description: string;
    }>;
  };
}

export function getSystemSettings(): Promise<SystemSettingsResponse> {
  return apiGet<SystemSettingsResponse>(API_ENDPOINTS.system.settings);
}

export function updateSystemSettings(payload: Record<string, number>): Promise<SystemSettingsResponse> {
  return apiPatch<SystemSettingsResponse>(API_ENDPOINTS.system.settings, payload);
}

export interface BTCUSDTKlineChartItem {
  time: number;
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface BTCUSDTKlineChartResponse {
  ok: boolean;
  data?: {
    symbol: 'BTCUSDT';
    interval: '1m';
    has_more?: boolean;
    next_before?: string | null;
    items: BTCUSDTKlineChartItem[];
  };
}

export interface BTCUSDTMetadataResponse {
  ok: boolean;
  data?: {
    symbol: 'BTCUSDT';
    interval: '1m';
    latestTimestamp?: string | null;
    earliestTimestamp?: string | null;
  };
}

export function getBTCUSDTMetadata(): Promise<BTCUSDTMetadataResponse> {
  return apiGet<BTCUSDTMetadataResponse>(API_ENDPOINTS.marketData.btcusdtMetadata);
}

export interface BTCUSDTAdminActionResponse {
  ok: boolean;
  data?: {
    updatedRows?: number;
    clearedRows?: number;
    hasMore?: boolean;
    range?: {
      start?: string | null;
      end?: string | null;
    };
  };
}

export function catchUpBTCUSDTKlines(): Promise<BTCUSDTAdminActionResponse> {
  return apiPost<BTCUSDTAdminActionResponse>(API_ENDPOINTS.marketData.btcusdtCatchUp);
}

export function clearBTCUSDTKlines(): Promise<BTCUSDTAdminActionResponse> {
  return apiDelete<BTCUSDTAdminActionResponse>(API_ENDPOINTS.marketData.btcusdtClearKlines);
}

export type BTCUSDTInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '1d';

export function getBTCUSDTKlines(params: {
  start?: string;
  end?: string;
  before?: string;
  limit?: number;
  interval?: BTCUSDTInterval;
}): Promise<BTCUSDTKlineChartResponse> {
  const query = new URLSearchParams();
  if (params.start) query.set('start', params.start);
  if (params.end) query.set('end', params.end);
  if (params.before) query.set('before', params.before);
  if (params.limit) query.set('limit', String(params.limit));
  query.set('interval', params.interval ?? '1m');

  return apiGet<BTCUSDTKlineChartResponse>(
    `${API_ENDPOINTS.marketData.btcusdtKlines}?${query.toString()}`,
  );
}

export interface BTCUSDTTargetPreviewRequest {
  interval: BTCUSDTInterval;
  target_strategy: string;
  target_params: Record<string, unknown>;
  start_datetime?: string;
  end_datetime?: string;
  candlestick_amount?: number;
  preview_mode?: 'true_label' | 'mock_prediction';
  entry_assumption?: 'next_open' | 'current_close';
  evaluation_cost_bps?: number;
  mock_precision?: number;
  mock_recall?: number;
  mock_seed?: number;
}

export interface BTCUSDTTargetPreviewRow extends BTCUSDTKlineChartItem {
  target?: number | null;
  candleDirection?: number | null;
  actualDirectionTarget?: number | null;
}

export interface BTCUSDTTargetPreviewResponse {
  ok: boolean;
  data?: {
    symbol: 'BTCUSDT';
    interval: BTCUSDTInterval;
    mode?: {
      previewMode?: 'true_label' | 'mock_prediction';
      entryAssumption?: 'next_open' | 'current_close';
      evaluationCostBps?: number;
      mockPrecision?: number | null;
      mockRecall?: number | null;
      mockSeed?: number | null;
    };
    strategy?: {
      name?: string;
      binaryLabelRule?: string | null;
      defaultValues?: Record<string, unknown>;
      parameters?: Record<string, unknown>;
    };
    range?: {
      start?: string | null;
      end?: string | null;
      candles?: number;
      previewTruncated?: boolean;
      previewRowLimit?: number;
    };
    rows?: BTCUSDTTargetPreviewRow[];
    summary?: {
      rowCount?: number;
      labeledCount?: number;
      positiveCount?: number;
      negativeCount?: number;
      unlabeledCount?: number;
      positiveRatePct?: number | null;
      actualPositiveRatePct?: number | null;
      actualPositiveCount?: number;
      actualNegativeCount?: number;
      directionUpCount?: number;
      directionDownCount?: number;
      directionFlatCount?: number;
      warmupNullCount?: number;
      tailNullCount?: number;
      lookaheadPeriod?: number | null;
      confusion?: Record<string, number | null>;
    };
    economics?: {
      horizons?: Array<{
        horizon?: number;
        allCount?: number;
        signalCount?: number;
        nonSignalCount?: number;
        allMeanPct?: number | null;
        signalMeanPct?: number | null;
        nonSignalMeanPct?: number | null;
        signalSpreadPct?: number | null;
        liftPct?: number | null;
        allMedianPct?: number | null;
        signalMedianPct?: number | null;
        allWinRatePct?: number | null;
        signalWinRatePct?: number | null;
        allProfitFactor?: number | null;
        signalProfitFactor?: number | null;
        positiveRatePct?: number | null;
      }>;
    };
    bridge?: {
      requestedPrecisionPct?: number | null;
      requestedRecallPct?: number | null;
      actualPrecisionPct?: number | null;
      actualRecallPct?: number | null;
      signalRatePct?: number | null;
      falsePositiveRatePct?: number | null;
      predictedPositiveCount?: number | null;
      truePositiveCount?: number | null;
      falsePositiveCount?: number | null;
      trueNegativeCount?: number | null;
      falseNegativeCount?: number | null;
    } | null;
  };
}

export function getBTCUSDTTargetPreview(payload: BTCUSDTTargetPreviewRequest): Promise<BTCUSDTTargetPreviewResponse> {
  return apiPost<BTCUSDTTargetPreviewResponse>(API_ENDPOINTS.marketData.btcusdtTargetPreview, payload);
}
