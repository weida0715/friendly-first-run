import type { BTCUSDTChartPoint } from './BTCUSDTPriceChart';

export function normalizeAscUnique(points: BTCUSDTChartPoint[]): BTCUSDTChartPoint[] {
  const latestByTime = new Map<number, BTCUSDTChartPoint>();
  for (const point of points) {
    latestByTime.set(Number(point.time), point);
  }
  return Array.from(latestByTime.values()).sort((a, b) => Number(a.time) - Number(b.time));
}
