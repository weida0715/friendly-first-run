const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

// In browser, prefer same-origin proxy path to avoid CORS issues during local dev.
// Allow overriding only with another relative path.
export const API_BASE_URL =
  typeof window !== 'undefined'
    ? configuredApiBaseUrl?.startsWith('/')
      ? configuredApiBaseUrl
      : '/api/backend'
    : configuredApiBaseUrl ?? '/api/backend';

export const API_ENDPOINTS = {
  health: '/health',
  auth: {
    csrf: '/auth/csrf',
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  users: {
    list: '/users',
    me: '/users/me',
    byId: (userId: string | number) => `/users/${userId}`,
    status: (userId: string | number) => `/users/${userId}/status`,
    password: (userId: string | number) => `/users/${userId}/password`,
    role: (userId: string | number) => `/users/${userId}/role`,
    delete: (userId: string | number) => `/users/${userId}`,
  },
  blueprints: {
    owned: '/blueprints/library/owned',
    favorited: '/blueprints/library/favorited',
    byId: (blueprintId: string | number) => `/blueprints/${blueprintId}`,
    metadata: '/blueprints/metadata',
  },
  experiments: {
    create: '/experiments',
    list: '/experiments',
    byId: (experimentId: string | number) => `/experiments/${experimentId}`,
    cancel: (experimentId: string | number) => `/experiments/${experimentId}/cancel`,
    retry: (experimentId: string | number) => `/experiments/${experimentId}/retry`,
    delete: (experimentId: string | number) => `/experiments/${experimentId}`,
    blueprintOptions: '/experiments/blueprint-options',
  },
  models: {
    rankings: '/models/rankings',
    highlights: '/models/highlights',
    favorited: '/models/library/favorited',
    byId: (modelId: string | number) => `/models/${modelId}`,
    favorite: (modelId: string | number) => `/models/${modelId}/favorite`,
  },
  hub: {
    list: '/hub/',
    user: (userId: string | number) => `/hub/users/${userId}`,
  },
  docs: {
    list: '/docs/',
    bySlug: (slug: string) => `/docs/${slug}`,
  },
  logs: {
    download: (experimentId: string | number, artifact: string) => `/logs/experiments/${experimentId}/${artifact}`,
    modelRound: (experimentId: string | number, modelId: string | number) => `/logs/experiments/${experimentId}/models/${modelId}/round`,
  },
  jobs: {
    list: '/jobs/',
    byId: (jobId: string | number) => `/jobs/${jobId}`,
    cancel: (jobId: string | number) => `/jobs/${jobId}/cancel`,
  },
  marketData: {
    btcusdtKlines: '/market-data/btcusdt/klines',
    btcusdtMetadata: '/market-data/btcusdt/metadata',
  },
  system: {
    activeQueue: '/system/queue/active',
    settings: '/system/settings',
  },
} as const;

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
