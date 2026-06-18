export type Bin<T, V> = T[] & { x0?: V; x1?: V };

export function extent<T>(values: T[], accessor?: (value: T) => number | null | undefined): [number, number] | [undefined, undefined] {
  const nums = values.map((value) => accessor ? accessor(value) : Number(value)).filter((value): value is number => Number.isFinite(value));
  return nums.length ? [Math.min(...nums), Math.max(...nums)] : [undefined, undefined];
}

export function max<T>(values: T[], accessor?: (value: T) => number | null | undefined): number | undefined {
  const nums = values.map((value) => accessor ? accessor(value) : Number(value)).filter((value): value is number => Number.isFinite(value));
  return nums.length ? Math.max(...nums) : undefined;
}

export function scaleLinear() {
  let domain: [number, number] = [0, 1];
  let range: [number, number] = [0, 1];
  const scale = ((value: number) => {
    const span = domain[1] - domain[0] || 1;
    return range[0] + ((value - domain[0]) / span) * (range[1] - range[0]);
  }) as ((value: number) => number) & { domain: (next: [number, number]) => typeof scale; range: (next: [number, number]) => typeof scale; nice: () => typeof scale; ticks: (count: number) => number[] };
  scale.domain = (next) => { domain = next; return scale; };
  scale.range = (next) => { range = next; return scale; };
  scale.nice = () => scale;
  scale.ticks = (count) => Array.from({ length: count }, (_, index) => domain[0] + ((domain[1] - domain[0]) * index) / Math.max(1, count - 1));
  return scale;
}

export function scaleSqrt() {
  return scaleLinear();
}

export function bin<T, V>() {
  let thresholdCount = 10;
  const makeBins = (values: number[]) => {
    const [min = 0, maxValue = 1] = extent(values) as [number, number];
    const step = (maxValue - min || 1) / thresholdCount;
    const bins = Array.from({ length: thresholdCount }, (_, index) => Object.assign([], { x0: min + index * step, x1: min + (index + 1) * step }) as Bin<number, number>);
    values.forEach((value) => bins[Math.min(thresholdCount - 1, Math.max(0, Math.floor((value - min) / step)))].push(value));
    return bins;
  };
  makeBins.thresholds = (count: number) => { thresholdCount = count; return makeBins; };
  return makeBins;
}