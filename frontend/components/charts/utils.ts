import type { BTCUSDTChartPoint } from './BTCUSDTPriceChart';

const BTCUSDT_CACHE_UPDATE_KEY = 'btcusdt-cache-update';
const BTCUSDT_CACHE_UPDATED_EVENT = 'btcusdt-cache-updated';

export function normalizeAscUnique(points: BTCUSDTChartPoint[]): BTCUSDTChartPoint[] {
  const latestByTime = new Map<number, BTCUSDTChartPoint>();
  for (const point of points) {
    latestByTime.set(Number(point.time), point);
  }
  return Array.from(latestByTime.values()).sort((a, b) => Number(a.time) - Number(b.time));
}

export function notifyBTCUSDTCacheUpdated(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BTCUSDT_CACHE_UPDATE_KEY, String(Date.now()));
  } catch {
    // ignore storage failures; the in-tab event still handles the common case
  }
  window.dispatchEvent(new Event(BTCUSDT_CACHE_UPDATED_EVENT));
}

export function subscribeBTCUSDTCacheUpdates(onUpdate: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === BTCUSDT_CACHE_UPDATE_KEY) {
      onUpdate();
    }
  };

  window.addEventListener(BTCUSDT_CACHE_UPDATED_EVENT, onUpdate);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(BTCUSDT_CACHE_UPDATED_EVENT, onUpdate);
    window.removeEventListener('storage', handleStorage);
  };
}
