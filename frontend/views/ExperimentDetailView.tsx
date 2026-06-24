"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as d3 from 'd3';
import { Expand, Minus, Plus, X } from 'lucide-react';
import { BaseView } from './BaseView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cancelExperiment, deleteExperiment, getExperimentDetail, retryExperiment } from '@/lib/api/client';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api/endpoints';

type AnyRecord = Record<string, unknown>;
type TerminalLine = { key: string; text: string; tone?: string };

function KeyValueGrid({ items }: { items: Array<[string, unknown]> }) {
  return <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">{items.map(([label, value]) => <div className="rounded border bg-muted/20 p-3" key={label}><p className="text-xs uppercase text-muted-foreground">{label}</p><p className="mt-1 break-words font-medium">{String(value ?? '—')}</p></div>)}</div>;
}

function formatParamValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.map(formatParamValue).join(', ');
  if (typeof value === 'object') return Object.entries(value as AnyRecord).map(([key, nested]) => `${key}: ${formatParamValue(nested)}`).join(' · ');
  return String(value);
}

function ParameterList({ params }: { params: AnyRecord | undefined }) {
  const entries = Object.entries(params ?? {});
  if (!entries.length) return <p className="mt-2 text-sm text-muted-foreground">No parameters.</p>;
  return <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">{entries.map(([key, value]) => <div className="rounded-md border bg-muted/20 px-3 py-2" key={key}><span className="text-xs uppercase text-muted-foreground">{key}</span><div className="mt-1 font-medium">{formatParamValue(value)}</div></div>)}</div>;
}

function KeyValueList({ items, emptyLabel }: { items: AnyRecord | undefined; emptyLabel: string }) {
  const entries = Object.entries(items ?? {});
  if (!entries.length) return <p className="mt-2 text-sm text-muted-foreground">{emptyLabel}</p>;
  return <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">{entries.map(([key, value]) => <div className="rounded-md border bg-muted/20 px-3 py-2" key={key}><span className="text-xs uppercase text-muted-foreground">{key}</span><div className="mt-1 font-medium">{formatParamValue(value)}</div></div>)}</div>;
}

function n(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function fmt(value: unknown, suffix = ''): string {
  const parsed = n(value);
  if (parsed === null) return '—';
  return `${parsed.toFixed(Math.abs(parsed) >= 100 ? 1 : 3)}${suffix}`;
}

function axisTick(value: number): string {
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1);
  if (Math.abs(value) >= 1) return value.toFixed(2);
  return value.toFixed(3);
}

function confusionValue(row: AnyRecord | undefined, keys: string[]): number | null {
  for (const key of keys) {
    const value = n(row?.[key]);
    if (value !== null) return value;
  }
  return null;
}

function pickBest(rows: AnyRecord[], key: string, direction: 'max' | 'min' = 'max') {
  return rows.reduce<AnyRecord | null>((best, row) => {
    const value = n(row[key]);
    if (value === null) return best;
    if (!best) return row;
    const bestValue = n(best[key]);
    if (bestValue === null) return row;
    return direction === 'max' ? (value > bestValue ? row : best) : (value < bestValue ? row : best);
  }, null);
}

function MiniDistribution({ values }: { values: number[] }) {
  const width = 360;
  const height = 180;
  const margin = { top: 18, right: 12, bottom: 28, left: 32 };
  const [hovered, setHovered] = useState<{ bin: d3.Bin<number, number>; index: number } | null>(null);

  const bins = useMemo(() => {
    if (!values.length) return [];
    return d3.bin<number, number>()
      .thresholds(12)(values);
  }, [values]);

  const xScale = useMemo(() => {
    const extent = d3.extent(values) as [number, number] | [undefined, undefined];
    const [min, max] = extent[0] === undefined || extent[1] === undefined ? [0, 1] : extent;
    return d3.scaleLinear().domain([min, max]).nice().range([margin.left, width - margin.right]);
  }, [values]);

  const yScale = useMemo(() => d3.scaleLinear().domain([0, d3.max(bins, (bin) => bin.length) ?? 1]).nice().range([height - margin.bottom, margin.top]), [bins]);

  if (!values.length) return <p className="text-sm text-muted-foreground">No return distribution available.</p>;
  return <div className="rounded border bg-muted/10 p-3">
    <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full overflow-visible">
      <g opacity={0.25}>
        {yScale.ticks(4).map((tick) => <line key={tick} x1={margin.left} x2={width - margin.right} y1={yScale(tick)} y2={yScale(tick)} stroke="currentColor" />)}
      </g>
      {bins.map((bin, index) => {
        const x0 = xScale(bin.x0 ?? 0);
        const x1 = xScale(bin.x1 ?? 0);
        const barWidth = Math.max(2, x1 - x0 - 2);
        const barHeight = height - margin.bottom - yScale(bin.length);
        const isHovered = hovered?.index === index;
        return <g key={`${index}-${bin.x0}`} onMouseEnter={() => setHovered({ bin, index })} onMouseLeave={() => setHovered(null)}>
          <rect x={x0 + 1} y={yScale(bin.length)} width={barWidth} height={barHeight} rx={3} fill={isHovered ? '#059669' : '#10b981'} opacity={isHovered ? 1 : 0.75} />
        </g>;
      })}
      <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} stroke="currentColor" opacity={0.35} />
      <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} stroke="currentColor" opacity={0.35} />
      <text x={width / 2} y={height - 4} textAnchor="middle" fontSize="11" fill="currentColor" opacity={0.7}>Net Return %</text>
      <text x={10} y={height / 2} textAnchor="middle" fontSize="11" fill="currentColor" opacity={0.7} transform={`rotate(-90 10 ${height / 2})`}>Models</text>
      {hovered ? <g pointerEvents="none"><rect x={Math.min(width - 120, Math.max(margin.left + 8, xScale((hovered.bin.x0 ?? 0) as number) + 8))} y={Math.max(margin.top, yScale(hovered.bin.length) - 36)} width="112" height="30" rx="6" fill="#111827" opacity={0.92} /><text x={Math.min(width - 64, Math.max(margin.left + 64, xScale((hovered.bin.x0 ?? 0) as number) + 64))} y={Math.max(margin.top + 12, yScale(hovered.bin.length) - 17)} textAnchor="middle" fontSize="10" fill="#fff">{`${hovered.bin.length} model(s)`}</text><text x={Math.min(width - 64, Math.max(margin.left + 64, xScale((hovered.bin.x0 ?? 0) as number) + 64))} y={Math.max(margin.top + 24, yScale(hovered.bin.length) - 5)} textAnchor="middle" fontSize="10" fill="#fff">{`${fmt(hovered.bin.x0)} to ${fmt(hovered.bin.x1)}`}</text></g> : null}
    </svg>
    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded bg-emerald-500" /> Models per return bucket</span><span>Hover bars for range and count</span></div>
  </div>;
}

function MiniScatter({ title, rows, xKey, yKey, xLabel, yLabel, selectedId, onSelect }: { title: string; rows: AnyRecord[]; xKey: string; yKey: string; xLabel: string; yLabel: string; selectedId?: string; onSelect: (id: string) => void }) {
  const width = 360;
  const height = 210;
  const margin = { top: 18, right: 12, bottom: 28, left: 36 };
  const [hovered, setHovered] = useState<AnyRecord | null>(null);
  const points = useMemo(() => rows.map((row) => ({ row, x: n(row[xKey]), y: n(row[yKey]), id: String(row.modelId ?? '') })).filter((point): point is { row: AnyRecord; x: number; y: number; id: string } => point.x !== null && point.y !== null), [rows, xKey, yKey]);
  if (!points.length) return <div className="rounded border bg-muted/20 p-4 text-sm text-muted-foreground">No data for {title}.</div>;
  const xDomain = d3.extent(points, (point) => point.x) as [number, number];
  const yDomain = d3.extent(points, (point) => point.y) as [number, number];
  const xScale = d3.scaleLinear().domain(xDomain).nice().range([margin.left, width - margin.right]);
  const yScale = d3.scaleLinear().domain(yDomain).nice().range([height - margin.bottom, margin.top]);
  const tradeExtent = d3.extent(points, (point) => n(point.row.trades_count) ?? 0) as [number | undefined, number | undefined];
  const radiusScale = d3.scaleSqrt().domain([tradeExtent[0] ?? 0, tradeExtent[1] ?? 1]).range([3, 7]);
  const xTicks = xScale.ticks(4);
  const yTicks = yScale.ticks(4);
  return <div className="rounded border bg-muted/10 p-3">
    <p className="mb-2 text-sm font-medium">{title}</p>
    <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full overflow-visible">
      <g opacity={0.18}>
        {xTicks.map((tick) => <line key={`x-${tick}`} x1={xScale(tick)} x2={xScale(tick)} y1={margin.top} y2={height - margin.bottom} stroke="currentColor" />)}
        {yTicks.map((tick) => <line key={`y-${tick}`} x1={margin.left} x2={width - margin.right} y1={yScale(tick)} y2={yScale(tick)} stroke="currentColor" />)}
      </g>
      <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} stroke="currentColor" opacity={0.35} />
      <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} stroke="currentColor" opacity={0.35} />
      {points.map((point, index) => {
        const selected = selectedId && point.id === selectedId;
        const isHovered = hovered?.id === point.id;
        return <circle key={`${point.id}-${index}`} cx={xScale(point.x)} cy={yScale(point.y)} r={selected ? 6 : Math.max(3, radiusScale(n(point.row.trades_count) ?? 0))} fill={selected ? '#f59e0b' : '#10b981'} opacity={isHovered || selected ? 1 : 0.6} stroke={selected ? '#92400e' : 'none'} strokeWidth={selected ? 1.5 : 0} onMouseEnter={() => setHovered(point.row)} onMouseLeave={() => setHovered(null)} onClick={() => onSelect(point.id)} style={{ cursor: 'pointer' }} />;
      })}
      <text x={width / 2} y={height - 4} textAnchor="middle" fontSize="11" fill="currentColor" opacity={0.7}>{xLabel}</text>
      <text x={10} y={height / 2} textAnchor="middle" fontSize="11" fill="currentColor" opacity={0.7} transform={`rotate(-90 10 ${height / 2})`}>{yLabel}</text>
      {hovered ? <g pointerEvents="none"><rect x={Math.min(width - 142, xScale(n(hovered[xKey]) ?? 0) + 10)} y={Math.max(margin.top + 8, yScale(n(hovered[yKey]) ?? 0) - 42)} width="132" height="40" rx="6" fill="#111827" opacity={0.92} /><text x={Math.min(width - 76, xScale(n(hovered[xKey]) ?? 0) + 76)} y={Math.max(margin.top + 20, yScale(n(hovered[yKey]) ?? 0) - 24)} textAnchor="middle" fontSize="10" fill="#fff">{`Model #${String(hovered.modelId ?? '—')}`}</text><text x={Math.min(width - 76, xScale(n(hovered[xKey]) ?? 0) + 76)} y={Math.max(margin.top + 32, yScale(n(hovered[yKey]) ?? 0) - 10)} textAnchor="middle" fontSize="10" fill="#fff">{`${xLabel}: ${fmt(hovered[xKey])}`}</text></g> : null}
    </svg>
    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Model</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Selected</span><span>Bubble size follows trade count</span></div>
  </div>;
}

function D3BarChart({ title, rows, labelKey, valueKey, positiveLabel, negativeLabel }: { title: string; rows: AnyRecord[]; labelKey: string; valueKey: string; positiveLabel: string; negativeLabel: string }) {
  const width = 520;
  const height = 260;
  const margin = { top: 16, right: 24, bottom: 24, left: 130 };
  const data = rows.map((row) => ({ label: String(row[labelKey] ?? '-'), value: n(row[valueKey]) })).filter((item): item is { label: string; value: number } => item.value !== null).slice(0, 12);
  if (!data.length) return <p className="text-sm text-muted-foreground">No data for {title}.</p>;
  const maxAbs = Math.max(0.01, d3.max(data, (item) => Math.abs(item.value)) ?? 1);
  const x = d3.scaleLinear().domain([-maxAbs, maxAbs]).nice().range([margin.left, width - margin.right]);
  const step = (height - margin.top - margin.bottom) / data.length;
  return <div className="rounded border bg-muted/10 p-3"><p className="mb-2 text-sm font-medium">{title}</p><svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full overflow-visible"><line x1={x(0)} x2={x(0)} y1={margin.top} y2={height - margin.bottom} stroke="currentColor" opacity={0.35} />{data.map((item, index) => { const y = margin.top + index * step + step * 0.18; const barX = item.value >= 0 ? x(0) : x(item.value); const barW = Math.abs(x(item.value) - x(0)); return <g key={`${item.label}-${index}`}><text x={margin.left - 8} y={y + step * 0.32} textAnchor="end" fontSize="10" fill="currentColor">{item.label.slice(0, 24)}</text><rect x={barX} y={y} width={Math.max(2, barW)} height={Math.max(4, step * 0.58)} rx={3} fill={item.value >= 0 ? '#10b981' : '#ef4444'} opacity={0.8} /><text x={item.value >= 0 ? barX + barW + 4 : barX - 4} y={y + step * 0.36} textAnchor={item.value >= 0 ? 'start' : 'end'} fontSize="10" fill="currentColor">{fmt(item.value)}</text></g>; })}</svg><div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded bg-emerald-500" /> {positiveLabel}</span><span className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded bg-red-500" /> {negativeLabel}</span></div></div>;
}

function D3ModelRankCurve({ rows, selectedId }: { rows: AnyRecord[]; selectedId?: string }) {
  const width = 520;
  const height = 230;
  const margin = { top: 16, right: 18, bottom: 30, left: 44 };
  const data = rows.map((row) => ({ row, value: n(row.total_return_net_pct), id: String(row.modelId ?? '') })).filter((item): item is { row: AnyRecord; value: number; id: string } => item.value !== null).sort((a, b) => b.value - a.value);
  if (!data.length) return <p className="text-sm text-muted-foreground">No model rank data available.</p>;
  const x = d3.scaleLinear().domain([0, Math.max(1, data.length - 1)]).range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().domain(d3.extent(data, (item) => item.value) as [number, number]).nice().range([height - margin.bottom, margin.top]);
  const path = data.map((item, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(item.value)}`).join(' ');
  return <div className="rounded border bg-muted/10 p-3"><p className="mb-2 text-sm font-medium">Model Rank Curve</p><svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full overflow-visible"><line x1={margin.left} x2={width - margin.right} y1={y(0)} y2={y(0)} stroke="currentColor" opacity={0.25} /><path d={path} fill="none" stroke="#10b981" strokeWidth={2} />{data.map((item, index) => { const selected = selectedId && item.id === selectedId; return <circle key={`${item.id}-${index}`} cx={x(index)} cy={y(item.value)} r={selected ? 5 : 2.5} fill={item.value >= 0 ? '#10b981' : '#ef4444'} stroke={selected ? '#f59e0b' : 'none'} strokeWidth={selected ? 2 : 0} opacity={selected ? 1 : 0.65} />; })}<text x={width / 2} y={height - 5} textAnchor="middle" fontSize="11" fill="currentColor" opacity={0.7}>Rank by net return</text><text x={12} y={height / 2} textAnchor="middle" fontSize="11" fill="currentColor" opacity={0.7} transform={`rotate(-90 12 ${height / 2})`}>Net Return %</text></svg><div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded bg-emerald-500" /> Profitable</span><span className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded bg-red-500" /> Losing</span><span className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded bg-amber-500" /> Selected marker</span></div></div>;
}

function DashboardCard({ title, value, detail }: { title: string; value: unknown; detail?: string }) {
  return <Card><CardContent className="pt-4"><p className="text-xs uppercase text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-semibold">{String(value ?? '—')}</p>{detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}</CardContent></Card>;
}

type RiskChartConfig = {
  title: string;
  xKey: string;
  yKey: string;
  xLabel: string;
  yLabel: string;
  explanation: string[];
  pointHue: string;
  accentHue: string;
  selectionHue: string;
};

const riskChartConfigs: RiskChartConfig[] = [
  {
    title: 'Net Return vs Max Drawdown',
    xKey: 'max_drawdown_pct',
    yKey: 'total_return_net_pct',
    xLabel: 'Max Drawdown %',
    yLabel: 'Net Return %',
    explanation: [
      'Leftward points indicate lower drawdown risk, while upward points indicate stronger net return.',
      'Look for models that stay toward the upper-left area: those combine profit with controlled downside.',
      'The highlighted point is the currently selected model from the leaderboard.',
    ],
    pointHue: '#3b82f6',
    accentHue: '#93c5fd',
    selectionHue: '#f59e0b',
  },
  {
    title: 'Sharpe vs Net Return',
    xKey: 'sharpe_per_bar',
    yKey: 'total_return_net_pct',
    xLabel: 'Sharpe / Bar',
    yLabel: 'Net Return %',
    explanation: [
      'Rightward points indicate higher risk-adjusted return quality, while upward points indicate stronger profitability.',
      'Models clustered to the upper-right tend to balance consistency and absolute return better than isolated outliers.',
      'Check whether the selected model sits near the densest profitable cluster or is an isolated point.',
    ],
    pointHue: '#8b5cf6',
    accentHue: '#c4b5fd',
    selectionHue: '#f59e0b',
  },
  {
    title: 'Trades Count vs Net Return',
    xKey: 'trades_count',
    yKey: 'total_return_net_pct',
    xLabel: 'Trades Count',
    yLabel: 'Net Return %',
    explanation: [
      'Rightward points represent more trades, which can imply broader sample coverage but also more transaction exposure.',
      'Use this chart to detect whether the best returns come from only a few trades or from a steadier volume of activity.',
      'Models with many trades and respectable return are often easier to trust than sparse outliers.',
    ],
    pointHue: '#14b8a6',
    accentHue: '#99f6e4',
    selectionHue: '#f59e0b',
  },
];

function RiskScatterPlot({ rows, xKey, yKey, xLabel, yLabel, selectedId, onSelect, pointHue, accentHue, selectionHue, interactive = false, onActivePointChange }: { rows: AnyRecord[]; xKey: string; yKey: string; xLabel: string; yLabel: string; selectedId?: string; onSelect: (id: string) => void; pointHue: string; accentHue: string; selectionHue: string; interactive?: boolean; onActivePointChange?: (point: AnyRecord | null) => void }) {
  const width = interactive ? 760 : 360;
  const height = interactive ? 420 : 210;
  const margin = interactive ? { top: 24, right: 20, bottom: 40, left: 52 } : { top: 18, right: 12, bottom: 28, left: 36 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const [hovered, setHovered] = useState<AnyRecord | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const [activePoint, setActivePoint] = useState<AnyRecord | null>(null);

  const points = useMemo(() => rows.map((row) => ({ row, x: n(row[xKey]), y: n(row[yKey]), id: String(row.modelId ?? '') })).filter((point): point is { row: AnyRecord; x: number; y: number; id: string } => point.x !== null && point.y !== null), [rows, xKey, yKey]);
  const clusters = useMemo(() => {
    const grouped = new Map<string, { key: string; x: number; y: number; ids: string[]; rows: AnyRecord[] }>();
    points.forEach((point) => {
      const key = `${point.x}::${point.y}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.ids.push(point.id);
        existing.rows.push(point.row);
      } else {
        grouped.set(key, { key, x: point.x, y: point.y, ids: [point.id], rows: [point.row] });
      }
    });
    return [...grouped.values()];
  }, [points]);
  const selectedCluster = useMemo(() => clusters.find((cluster) => cluster.key === selectedId) ?? null, [clusters, selectedId]);

  useEffect(() => {
    const fallback = selectedCluster?.rows[0] ?? null;
    if (activePoint === null) {
      setActivePoint(fallback);
      onActivePointChange?.(fallback);
    }
  }, [activePoint, onActivePointChange, selectedCluster]);

  if (!clusters.length) return <div className="rounded border bg-muted/20 p-4 text-sm text-muted-foreground">No data for {xLabel} / {yLabel}.</div>;

  const xDomain = d3.extent(clusters, (point) => point.x) as [number, number];
  const yDomain = d3.extent(clusters, (point) => point.y) as [number, number];
  const paddedXDomain: [number, number] = xDomain[0] === xDomain[1] ? [xDomain[0] - 1, xDomain[1] + 1] : xDomain;
  const paddedYDomain: [number, number] = yDomain[0] === yDomain[1] ? [yDomain[0] - 1, yDomain[1] + 1] : yDomain;
  const xSpan = paddedXDomain[1] - paddedXDomain[0] || 1;
  const ySpan = paddedYDomain[1] - paddedYDomain[0] || 1;
  const visibleXSpan = xSpan / zoom;
  const visibleYSpan = ySpan / zoom;
  const xPanUnits = interactive ? (pan.x / Math.max(1, plotWidth)) * visibleXSpan : 0;
  const yPanUnits = interactive ? (pan.y / Math.max(1, plotHeight)) * visibleYSpan : 0;
  const xCenter = (paddedXDomain[0] + paddedXDomain[1]) / 2 - xPanUnits;
  const yCenter = (paddedYDomain[0] + paddedYDomain[1]) / 2 + yPanUnits;
  const visibleXDomain: [number, number] = interactive ? [xCenter - visibleXSpan / 2, xCenter + visibleXSpan / 2] : paddedXDomain;
  const visibleYDomain: [number, number] = interactive ? [yCenter - visibleYSpan / 2, yCenter + visibleYSpan / 2] : paddedYDomain;
  const xScale = d3.scaleLinear().domain(visibleXDomain).nice().range([margin.left, width - margin.right]);
  const yScale = d3.scaleLinear().domain(visibleYDomain).nice().range([height - margin.bottom, margin.top]);
  const xTicks = xScale.ticks(interactive ? 6 : 4);
  const yTicks = yScale.ticks(interactive ? 6 : 4);
  const visibleClusters = interactive ? clusters.filter((point) => point.x >= visibleXDomain[0] && point.x <= visibleXDomain[1] && point.y >= visibleYDomain[0] && point.y <= visibleYDomain[1]) : clusters;
  const hoveredCluster = hovered ? clusters.find((cluster) => cluster.rows.some((row) => row === hovered || String(row.modelId ?? '') === String(hovered.modelId ?? ''))) ?? null : null;
  const nearbyCount = hoveredCluster ? visibleClusters.filter((point) => Math.abs(xScale(point.x) - xScale(hoveredCluster.x)) <= (interactive ? 18 : 12) && Math.abs(yScale(point.y) - yScale(hoveredCluster.y)) <= (interactive ? 18 : 12)).reduce((total, cluster) => total + cluster.rows.length, 0) : 0;
  const clusterRadiusScale = d3.scaleSqrt().domain([1, Math.max(1, d3.max(clusters, (cluster) => cluster.rows.length) ?? 1)]).range(interactive ? [5, 14] : [4, 10]);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const zoomBy = (factor: number) => setZoom((value) => Math.max(0.7, Math.min(10, Number((value * factor).toFixed(3)))));
  const onWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    if (!interactive) return;
    event.preventDefault();
    event.stopPropagation();
    zoomBy(event.deltaY < 0 ? 1.08 : 0.92);
  };
  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    (event.currentTarget as SVGSVGElement).setPointerCapture?.(event.pointerId);
    setDragState({ startX: event.clientX, startY: event.clientY, panX: pan.x, panY: pan.y });
  };
  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive || !dragState) return;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    setPan({ x: dragState.panX + dx, y: dragState.panY + dy });
  };
  const onPointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    try {
      (event.currentTarget as SVGSVGElement).releasePointerCapture?.(event.pointerId);
    } catch {
      // ignore capture release errors when pointer capture was not set
    }
    setDragState(null);
  };

  const setPointActive = (point: AnyRecord) => {
    setActivePoint(point);
    onActivePointChange?.(point);
  };

  return <div className="rounded border bg-muted/10 p-3">
    <svg viewBox={`0 0 ${width} ${height}`} className={interactive ? 'h-[26rem] w-full overflow-visible touch-none' : 'h-56 w-full overflow-visible'} data-testid={interactive ? 'risk-expanded-scatter' : undefined} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
      <defs><clipPath id={`risk-plot-clip-${xKey}-${yKey}-${interactive ? 'expanded' : 'mini'}`}><rect x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} /></clipPath></defs>
      <g opacity={interactive ? 0.14 : 0.18}>
        {xTicks.map((tick) => <line key={`x-${tick}`} x1={xScale(tick)} x2={xScale(tick)} y1={margin.top} y2={height - margin.bottom} stroke="currentColor" />)}
        {yTicks.map((tick) => <line key={`y-${tick}`} x1={margin.left} x2={width - margin.right} y1={yScale(tick)} y2={yScale(tick)} stroke="currentColor" />)}
      </g>
      <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} stroke="currentColor" opacity={0.35} />
      <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} stroke="currentColor" opacity={0.35} />
      <g fontSize={interactive ? '10' : '9'} fill="currentColor" opacity={0.65}>
        {xTicks.map((tick) => <text key={`x-label-${tick}`} data-testid={interactive ? 'risk-x-tick-label' : undefined} x={xScale(tick)} y={height - margin.bottom + 14} textAnchor="middle">{axisTick(tick)}</text>)}
        {yTicks.map((tick) => <text key={`y-label-${tick}`} data-testid={interactive ? 'risk-y-tick-label' : undefined} x={margin.left - 6} y={yScale(tick) + 3} textAnchor="end">{axisTick(tick)}</text>)}
      </g>
      <g clipPath={`url(#risk-plot-clip-${xKey}-${yKey}-${interactive ? 'expanded' : 'mini'})`}>
        {visibleClusters.map((cluster, index) => {
          const selected = selectedId && cluster.key === selectedId;
          const isHovered = hoveredCluster?.key === cluster.key;
          const isActive = activePoint ? cluster.rows.some((row) => row.modelId === activePoint.modelId) : false;
          const fill = selected || isActive ? selectionHue : isHovered ? accentHue : pointHue;
          return <circle key={`${cluster.key}-${index}`} data-testid={interactive ? `risk-expanded-point-${cluster.key}` : undefined} cx={xScale(cluster.x)} cy={yScale(cluster.y)} r={selected || isActive ? clusterRadiusScale(cluster.rows.length) + 1.5 : clusterRadiusScale(cluster.rows.length)} fill={fill} opacity={isHovered || selected || isActive ? 1 : 0.72} stroke={selected || isActive ? '#111827' : 'none'} strokeWidth={selected || isActive ? 1.75 : 0} onPointerDown={(event) => event.stopPropagation()} onMouseEnter={() => setHovered(cluster.rows[0] ?? null)} onMouseLeave={() => setHovered(null)} onClick={(event) => { event.stopPropagation(); onSelect(cluster.key); setPointActive(cluster.rows[0]); }} style={{ cursor: 'pointer' }} />;
        })}
      </g>
      <text x={width / 2} y={height - 4} textAnchor="middle" fontSize={interactive ? '12' : '11'} fill="currentColor" opacity={0.7}>{xLabel}</text>
      <text x={12} y={height / 2} textAnchor="middle" fontSize={interactive ? '12' : '11'} fill="currentColor" opacity={0.7} transform={`rotate(-90 12 ${height / 2})`}>{yLabel}</text>
      {hovered && hoveredCluster ? <g pointerEvents="none"><rect x={Math.min(width - (interactive ? 210 : 156), Math.max(margin.left + 8, xScale(hoveredCluster.x) + 10))} y={Math.max(margin.top, yScale(hoveredCluster.y) - (interactive ? 96 : 56))} width={interactive ? '200' : '146'} height={interactive ? '88' : '50'} rx="6" fill="#111827" opacity={0.92} /><text x={Math.min(width - (interactive ? 110 : 83), Math.max(margin.left + (interactive ? 100 : 73), xScale(hoveredCluster.x) + (interactive ? 110 : 73)))} y={Math.max(margin.top + 14, yScale(hoveredCluster.y) - (interactive ? 76 : 37))} textAnchor="middle" fontSize="10" fill="#fff">{`${hoveredCluster.rows.length} model${hoveredCluster.rows.length === 1 ? '' : 's'} in dot`}</text><text x={Math.min(width - (interactive ? 110 : 83), Math.max(margin.left + (interactive ? 100 : 73), xScale(hoveredCluster.x) + (interactive ? 110 : 73)))} y={Math.max(margin.top + 27, yScale(hoveredCluster.y) - (interactive ? 61 : 24))} textAnchor="middle" fontSize="10" fill="#fff">{`${xLabel}: ${fmt(hoveredCluster.x, xKey.includes('pct') ? '%' : '')}`}</text><text x={Math.min(width - (interactive ? 110 : 83), Math.max(margin.left + (interactive ? 100 : 73), xScale(hoveredCluster.x) + (interactive ? 110 : 73)))} y={Math.max(margin.top + 40, yScale(hoveredCluster.y) - (interactive ? 46 : 11))} textAnchor="middle" fontSize="10" fill="#fff">{`${yLabel}: ${fmt(hoveredCluster.y, yKey.includes('pct') ? '%' : '')}`}</text>{interactive ? <><text x={Math.min(width - 110, Math.max(margin.left + 100, xScale(hoveredCluster.x) + 110))} y={Math.max(margin.top + 53, yScale(hoveredCluster.y) - 31)} textAnchor="middle" fontSize="10" fill="#fff">{`Models: ${hoveredCluster.rows.map((row) => `#${String(row.modelId ?? '—')}`).join(', ')}`}</text><text x={Math.min(width - 110, Math.max(margin.left + 100, xScale(hoveredCluster.x) + 110))} y={Math.max(margin.top + 66, yScale(hoveredCluster.y) - 16)} textAnchor="middle" fontSize="10" fill="#fff">{`${nearbyCount} nearby model${nearbyCount === 1 ? '' : 's'} in view`}</text></> : null}</g> : null}
    </svg>
    {interactive ? <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><Button type="button" variant="outline" size="sm" onClick={() => zoomBy(1.25)} aria-label="Zoom in"><Plus className="mr-2 h-3.5 w-3.5" />Zoom in</Button><Button type="button" variant="outline" size="sm" onClick={() => zoomBy(0.8)} aria-label="Zoom out"><Minus className="mr-2 h-3.5 w-3.5" />Zoom out</Button><Button type="button" variant="outline" size="sm" onClick={resetView} aria-label="Reset zoom">Reset zoom</Button><span className="text-muted-foreground">Drag empty space to pan. Scroll zoom reveals clusters more clearly. Dot size represents how many models share the same chart position.</span></div> : <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: pointHue }} /> Model cluster</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: selectionHue }} /> Selected in this chart</span><span>Dot size follows number of models in the dot</span></div>}
  </div>;
}

function RiskChartCard({ config, rows, selectedModelId, onSelect }: { config: RiskChartConfig; rows: AnyRecord[]; selectedModelId: string; onSelect: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const selectedRow = useMemo(() => rows.find((row) => String(row.modelId ?? '') === selectedModelId) ?? rows[0] ?? null, [rows, selectedModelId]);
  const selectedClusterKey = selectedRow ? `${String(n(selectedRow[config.xKey]) ?? '')}::${String(n(selectedRow[config.yKey]) ?? '')}` : '';
  const [chartSelectedId, setChartSelectedId] = useState(selectedClusterKey);
  const [activePoint, setActivePoint] = useState<AnyRecord | null>(selectedRow);
  const clusterRows = useMemo(() => {
    const grouped = new Map<string, AnyRecord[]>();
    rows.forEach((row) => {
      const x = n(row[config.xKey]);
      const y = n(row[config.yKey]);
      if (x === null || y === null) return;
      const key = `${x}::${y}`;
      grouped.set(key, [...(grouped.get(key) ?? []), row]);
    });
    return grouped;
  }, [config.xKey, config.yKey, rows]);

  useEffect(() => {
    if (!activePoint && selectedRow) setActivePoint(selectedRow);
    if (!chartSelectedId && selectedClusterKey) setChartSelectedId(selectedClusterKey);
  }, [activePoint, chartSelectedId, selectedClusterKey, selectedRow]);

  const selectChartPoint = (id: string) => {
    setChartSelectedId(id);
    const row = clusterRows.get(id)?.[0] ?? null;
    if (row) setActivePoint(row);
  };

  const activeClusterRows = chartSelectedId ? (clusterRows.get(chartSelectedId) ?? (activePoint ? [activePoint] : [])) : (activePoint ? [activePoint] : []);

  return <div className="relative rounded-xl border bg-card p-3 shadow-sm"><div className="mb-2 flex items-start justify-between gap-2"><div><p className="text-sm font-medium">{config.title}</p><p className="text-xs text-muted-foreground">Click expand for a larger interactive view.</p></div><Button type="button" variant="ghost" size="sm" className="h-8 w-8 px-0" onClick={() => setExpanded(true)} aria-label={`Expand ${config.title}`}><Expand className="h-4 w-4" /></Button></div><RiskScatterPlot rows={rows} xKey={config.xKey} yKey={config.yKey} xLabel={config.xLabel} yLabel={config.yLabel} selectedId={chartSelectedId} onSelect={selectChartPoint} pointHue={config.pointHue} accentHue={config.accentHue} selectionHue={config.selectionHue} />{expanded ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={config.title} onWheelCapture={(event) => event.stopPropagation()}><div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl bg-background p-6 shadow-2xl"><div className="mb-4 flex items-start justify-between gap-4"><div><h3 className="text-lg font-semibold">{config.title}</h3><p className="mt-1 text-sm text-muted-foreground">Expanded analysis with cluster-sized dots, zoomable axes, and per-chart selection.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setExpanded(false)} aria-label={`Close ${config.title} modal`}><X className="mr-2 h-4 w-4" />Close</Button></div><div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]"><div><RiskScatterPlot rows={rows} xKey={config.xKey} yKey={config.yKey} xLabel={config.xLabel} yLabel={config.yLabel} selectedId={chartSelectedId} onSelect={selectChartPoint} pointHue={config.pointHue} accentHue={config.accentHue} selectionHue={config.selectionHue} interactive onActivePointChange={setActivePoint} /></div><div className="space-y-4 rounded-xl border bg-muted/20 p-4 text-sm"><div><p className="mb-2 font-semibold">What to look for</p><ul className="list-disc space-y-2 pl-5">{config.explanation.map((item) => <li key={item}>{item}</li>)}</ul></div><div><p className="mb-2 font-semibold">Selected dot snapshot</p>{activeClusterRows.length ? <div className="space-y-3 text-xs" data-testid="risk-selected-model-snapshot"><div className="rounded border bg-background p-2"><span className="text-muted-foreground">Models in dot</span><p className="font-semibold">{String(activeClusterRows.length)}</p></div><div className="rounded border bg-background p-2"><span className="text-muted-foreground">{config.xLabel}</span><p className="font-semibold">{fmt(activeClusterRows[0]?.[config.xKey], config.xKey.includes('pct') ? '%' : '')}</p></div><div className="rounded border bg-background p-2"><span className="text-muted-foreground">{config.yLabel}</span><p className="font-semibold">{fmt(activeClusterRows[0]?.[config.yKey], config.yKey.includes('pct') ? '%' : '')}</p></div><div className="rounded border bg-background p-2"><span className="text-muted-foreground">Models</span><div className="mt-1 flex flex-wrap gap-2">{activeClusterRows.map((row) => <span key={String(row.modelId ?? Math.random())} className="rounded border px-2 py-1 font-medium">#{String(row.modelId ?? '—')}</span>)}</div></div></div> : <p className="text-muted-foreground">Choose any dot to inspect all models that share that chart position.</p>}</div><div className="rounded-lg border bg-background p-3 text-xs text-muted-foreground">Dot size represents how many models share the same chart position. Click a dot to inspect the model count and the list of models inside it.</div></div></div></div></div> : null}</div>;
}

export function ExperimentDetailView() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<AnyRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roundModelId, setRoundModelId] = useState('');
  const [roundError, setRoundError] = useState<string | null>(null);
  const [roundDownloading, setRoundDownloading] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [modelDetailOpen, setModelDetailOpen] = useState(false);
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [sortBy, setSortBy] = useState('total_return_net_pct');
  const [positiveOnly, setPositiveOnly] = useState(false);
  const [positiveExpectancyOnly, setPositiveExpectancyOnly] = useState(false);
  const [minTrades, setMinTrades] = useState('');
  const [maxDrawdown, setMaxDrawdown] = useState('');
  const seenTerminalKeys = useRef(new Set<string>());
  const firstSeenAt = useRef<number | null>(null);

  const load = useCallback(async () => {
    const res = await getExperimentDetail(params.id);
    setData((res.data?.experiment as AnyRecord | undefined) ?? null);
  }, [params.id]);

  useEffect(() => { void load(); }, [load]);

  const status = String(data?.status ?? '').toLowerCase();
  const canExport = status === 'completed';
  const job = (data?.job as AnyRecord | undefined) ?? {};
  const jobId = String(job.id ?? '');
  const isActive = status === 'queued' || status === 'running';
  const canCancel = isActive || Boolean(data?.canCancelQueued) || Boolean(data?.canCancelRunning);
  const canRetry = Boolean(data?.canRetry) || status === 'failed' || status === 'cancelled';
  const runPlan = (data?.runPlan as AnyRecord | undefined) ?? {};
  const stats = (data?.logStatistics as AnyRecord | undefined) ?? {};
  const completedPermutationCount = runPlan.executedPermutationCount ?? stats.executedModelCount ?? 0;
  const readableBlueprint = (data?.readableBlueprint as AnyRecord | undefined) ?? {};
  const readableArchitecture = (data?.readableArchitecture as AnyRecord | undefined) ?? {};
  const readableIndicators = (data?.readableIndicators as AnyRecord | undefined) ?? {};
  const readableTarget = (data?.readableTarget as AnyRecord | undefined) ?? {};
  const split = (data?.split as AnyRecord | undefined) ?? {};
  const splitRatios = (split.ratios as AnyRecord | undefined) ?? {};
  const artifacts = (data?.modelArtifacts as AnyRecord[] | undefined) ?? [];
  const backtestLogs = (data?.backtestLogs as AnyRecord[] | undefined) ?? [];
  const confusionMetrics = (data?.confusionMetrics as AnyRecord[] | undefined) ?? [];
  const parameterCorrelations = (data?.parameterCorrelations as AnyRecord[] | undefined) ?? [];
  const latestModel = artifacts.at(-1);
  const serverDashboard = (data?.dashboard as AnyRecord | undefined) ?? {};
  const serverSummary = (serverDashboard.summary as AnyRecord | undefined) ?? {};
  const serverBestModels = (serverDashboard.bestModels as AnyRecord | undefined) ?? {};
  const serverDistribution = (serverDashboard.returnDistribution as AnyRecord | undefined) ?? {};
  const dl = (artifact: string) => buildApiUrl(API_ENDPOINTS.logs.download(params.id, artifact));
  const roundCsvUrl = roundModelId.trim() ? buildApiUrl(`/logs/experiments/${params.id}/models/${roundModelId.trim()}/round.csv`) : '';

  const downloadRoundLog = async () => {
    const modelId = roundModelId.trim();
    if (!modelId || !roundCsvUrl) {
      setRoundError('Enter a model id.');
      return;
    }
    setRoundError(null);
    setRoundDownloading(true);
    try {
      const response = await fetch(roundCsvUrl, { credentials: 'include' });
      if (!response.ok) throw new Error(`Round log request failed with status ${response.status}.`);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `experiment-${params.id}-model-${modelId}-round-log.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setRoundError(error instanceof Error ? error.message : 'Round log download failed.');
    } finally {
      setRoundDownloading(false);
    }
  };

  const phaseClass = useMemo(() => {
    const stage = String(data?.currentStage ?? data?.status ?? '').toLowerCase();
    if (stage.includes('fail')) return 'text-red-300';
    if (stage.includes('complete')) return 'text-emerald-300';
    if (stage.includes('train')) return 'text-sky-300';
    if (stage.includes('predict')) return 'text-cyan-300';
    if (stage.includes('backtest') || stage.includes('evaluate')) return 'text-amber-300';
    return 'text-slate-200';
  }, [data]);

  const dashboard = useMemo(() => {
    const bestReturn = pickBest(backtestLogs, 'total_return_net_pct');
    const bestSharpe = pickBest(backtestLogs, 'sharpe_per_bar');
    const bestExpectancy = pickBest(backtestLogs, 'trade_expectancy_pct');
    const lowestDrawdown = pickBest(backtestLogs, 'max_drawdown_pct', 'min');
    const returns = backtestLogs.map((row) => n(row.total_return_net_pct)).filter((value): value is number => value !== null).sort((a, b) => a - b);
    const profitable = returns.filter((value) => value > 0).length;
    const p95 = returns.length ? returns[Math.floor((returns.length - 1) * 0.95)] : null;
    const warnings: string[] = [];
    if (status === 'failed') warnings.push('Experiment failed; results and exported artifacts may be partial.');
    if (bestReturn && p95 !== null && n(bestReturn.total_return_net_pct)! > Math.max(1, p95 * 3)) warnings.push('Best return is an extreme outlier; inspect drawdown, trade count, and consistency.');
    if (bestReturn && (n(bestReturn.trades_count) ?? 0) < 100) warnings.push('Best-return model has fewer than 100 trades; statistical evidence may be weak.');
    if (bestReturn && (n(bestReturn.max_drawdown_pct) ?? 0) > 50) warnings.push('Best-return model has high drawdown risk.');
    const leaderboard = ((serverDashboard.leaderboard as AnyRecord[] | undefined) ?? []).length ? (serverDashboard.leaderboard as AnyRecord[]) : [...backtestLogs].sort((a, b) => (n(b.total_return_net_pct) ?? -Infinity) - (n(a.total_return_net_pct) ?? -Infinity)).slice(0, 20);
    return {
      bestReturn: (serverBestModels.netReturn as AnyRecord | undefined) ?? bestReturn,
      bestSharpe: (serverBestModels.sharpe as AnyRecord | undefined) ?? bestSharpe,
      bestExpectancy: (serverBestModels.expectancy as AnyRecord | undefined) ?? bestExpectancy,
      lowestDrawdown: (serverBestModels.lowestDrawdown as AnyRecord | undefined) ?? lowestDrawdown,
      returns: ((serverDistribution.values as number[] | undefined) ?? returns),
      profitable: n(serverSummary.profitableModelCount) ?? profitable,
      p95,
      warnings: ((serverDashboard.warnings as string[] | undefined) ?? warnings),
      filteredLeaderboard: leaderboard
        .filter((row) => !positiveOnly || (n(row.total_return_net_pct) ?? 0) > 0)
        .filter((row) => !positiveExpectancyOnly || (n(row.trade_expectancy_pct) ?? 0) > 0)
        .filter((row) => minTrades.trim() === '' || (n(row.trades_count) ?? 0) >= Number(minTrades))
        .filter((row) => maxDrawdown.trim() === '' || (n(row.max_drawdown_pct) ?? Infinity) <= Number(maxDrawdown))
        .sort((a, b) => {
          const direction = sortBy === 'max_drawdown_pct' ? 1 : -1;
          return ((n(a[sortBy]) ?? 0) - (n(b[sortBy]) ?? 0)) * direction;
        }),
      leaderboard,
      parameterInsights: ((serverDashboard.parameterInsights as AnyRecord[] | undefined) ?? parameterCorrelations),
    };
  }, [backtestLogs, maxDrawdown, minTrades, parameterCorrelations, positiveExpectancyOnly, positiveOnly, serverBestModels, serverDashboard, serverDistribution, serverSummary, sortBy, split.strategy, status]);

  const selectedModel = useMemo(() => {
    const wanted = selectedModelId || String(dashboard.filteredLeaderboard[0]?.modelId ?? '');
    return dashboard.leaderboard.find((row) => String(row.modelId ?? '') === wanted) ?? dashboard.filteredLeaderboard[0] ?? null;
  }, [dashboard.filteredLeaderboard, dashboard.leaderboard, selectedModelId]);

  const selectedConfusion = useMemo(() => confusionMetrics.find((item) => String(item.modelId ?? '') === String(selectedModel?.modelId ?? '')), [confusionMetrics, selectedModel]);

  const selectedConfusionStats = useMemo(() => {
    const tp = confusionValue(selectedConfusion, ['tp_count', 'true_positive_count', 'true_positives']);
    const fp = confusionValue(selectedConfusion, ['fp_count', 'false_positive_count', 'false_positives']);
    const tn = confusionValue(selectedConfusion, ['tn_count', 'true_negative_count', 'true_negatives']);
    const fn = confusionValue(selectedConfusion, ['fn_count', 'false_negative_count', 'false_negatives']);
    const precisionPct = confusionValue(selectedConfusion, ['precision_pct']);
    const recallPct = confusionValue(selectedConfusion, ['recall_pct']);
    const precision = precisionPct !== null ? precisionPct / 100 : null;
    const recall = recallPct !== null ? recallPct / 100 : null;
    const f1 = confusionValue(selectedConfusion, ['f1_score_pct', 'f1_pct']);
    const accuracy = confusionValue(selectedConfusion, ['accuracy_pct', 'acc_pct']);
    const total = [tp, fp, tn, fn].every((value) => value !== null) ? Number(tp) + Number(fp) + Number(tn) + Number(fn) : null;
    return {
      tp,
      fp,
      tn,
      fn,
      f1Pct: f1 ?? (precision !== null && recall !== null && precision + recall > 0 ? (2 * precision * recall / (precision + recall)) * 100 : null),
      accuracyPct: accuracy ?? (total && tn !== null && tp !== null ? ((tn + tp) / total) * 100 : null),
    };
  }, [selectedConfusion]);

  const selectedArtifact = useMemo(() => artifacts.find((item) => String(item.modelId ?? '') === String(selectedModel?.modelId ?? '')), [artifacts, selectedModel]);
  const leaderboardPageSize = 20;
  const leaderboardPageCount = Math.max(1, Math.ceil(dashboard.filteredLeaderboard.length / leaderboardPageSize));
  const pagedLeaderboard = dashboard.filteredLeaderboard.slice((leaderboardPage - 1) * leaderboardPageSize, leaderboardPage * leaderboardPageSize);

  useEffect(() => {
    setLeaderboardPage((page) => Math.min(page, leaderboardPageCount));
  }, [leaderboardPageCount]);

  useEffect(() => {
    if (!isActive) return;
    const intervalId = window.setInterval(load, 3000);
    return () => window.clearInterval(intervalId);
  }, [isActive, load]);

  useEffect(() => {
    if (!data) return;
    if (firstSeenAt.current === null) firstSeenAt.current = Date.now();
    const latestPercent = Number(data.progress ?? 0);
    const executed = Number(completedPermutationCount);
    const elapsedSeconds = Math.max(1, (Date.now() - firstSeenAt.current) / 1000);
    const throughput = executed > 0 ? (executed / elapsedSeconds).toFixed(3) + ' perm/s · ' + (elapsedSeconds / executed).toFixed(1) + ' sec/perm' : 'waiting for first permutation';
    const snapshot: TerminalLine[] = [
      { key: 'status:' + String(data.status) + ':' + latestPercent + ':' + String(data.currentStage), text: '[' + new Date().toISOString() + '] status=' + String(data.status) + ' progress=' + latestPercent.toFixed(1) + '% stage=' + String(data.currentStage ?? '-'), tone: 'text-slate-300' },
      { key: 'job:' + jobId + ':' + String(job.state), text: '[job] id=' + (jobId || 'untracked') + ' state=' + String(job.state ?? 'unknown') + ' queue=' + String(job.queueName ?? '-'), tone: 'text-slate-300' },
      { key: 'throughput:' + executed + ':' + String(runPlan.requestedPermutationCount), text: '[throughput] ' + throughput + ' (' + executed + '/' + String(runPlan.requestedPermutationCount ?? runPlan.maxPermutationCount ?? '?') + ')', tone: 'text-emerald-200' },
      { key: 'model:' + String(latestModel?.modelId) + ':' + String(latestModel?.parameterHash), text: '[model] id=' + String(latestModel?.modelId ?? '—') + ' hash=' + String(latestModel?.parameterHash ?? '—'), tone: 'text-amber-200' },
      { key: 'params:' + JSON.stringify(latestModel?.parameters ?? {}), text: '[parameters] ' + JSON.stringify(latestModel?.parameters ?? {}), tone: 'text-cyan-200' },
      { key: 'architecture:' + JSON.stringify(readableArchitecture), text: '[architecture] ' + String(readableArchitecture.name ?? '—') + ' params=' + JSON.stringify(readableArchitecture.parameters ?? {}), tone: 'text-fuchsia-200' },
      { key: 'indicators:' + JSON.stringify(readableIndicators), text: '[indicators] ' + (Array.isArray(readableIndicators.selected) ? readableIndicators.selected.map(String).join(', ') || 'none' : 'none') + ' params=' + JSON.stringify(readableIndicators.parameters ?? {}), tone: 'text-sky-200' },
      { key: 'target:' + JSON.stringify(readableTarget), text: '[target] ' + String(readableTarget.strategy ?? '—') + ' params=' + JSON.stringify(readableTarget.parameters ?? {}), tone: 'text-purple-200' },
    ];
    if (data.runtimeWarning) snapshot.push({ key: 'warn:' + String(data.runtimeWarning), text: '[warn] ' + String(data.runtimeWarning), tone: 'text-amber-300' });
    const fresh = snapshot.filter((line) => !seenTerminalKeys.current.has(line.key));
    if (!fresh.length) return;
    fresh.forEach((line) => seenTerminalKeys.current.add(line.key));
    setTerminalHistory((prev) => [...prev, ...fresh].slice(-300));
  }, [completedPermutationCount, data, job, jobId, latestModel, readableArchitecture, readableIndicators, readableTarget, runPlan]);

  const actions = <div className="flex gap-2">{canCancel ? <Button variant="outline" onClick={async () => { setErrorMessage(null); const response = await cancelExperiment(params.id); if (!response.data?.experiment?.cancelled) setErrorMessage('This job is no longer active and cannot be cancelled.'); await load(); }}>Cancel Experiment</Button> : null}{canRetry ? <Button variant="outline" onClick={async () => { setErrorMessage(null); await retryExperiment(params.id); await load(); }}>Retry Experiment</Button> : null}{data ? <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50" onClick={async () => { setErrorMessage(null); await deleteExperiment(params.id); window.location.assign('/experiments'); }}>Delete Experiment</Button> : null}</div>;

  return <BaseView title="Experiment Detail" description="Model-search dashboard for ranking, diagnosing, and exporting experiment results." actions={actions}>
    <div className="space-y-4"><span className="sr-only">Configuration</span>
      {errorMessage ? <Card><CardContent className="pt-4 text-sm text-destructive">{errorMessage}</CardContent></Card> : null}
      <div className="grid gap-3 md:grid-cols-4"><DashboardCard title="Status" value={data?.status} detail={String(data?.currentStage ?? '')} /><DashboardCard title="Completed" value={`${String(completedPermutationCount)} / ${String(runPlan.requestedPermutationCount ?? '—')}`} detail="completed / requested" /><DashboardCard title="Search Coverage" value={`${fmt(((n(completedPermutationCount) ?? 0) / Math.max(1, n(runPlan.maxPermutationCount) ?? 1)) * 100, '%')}`} detail={`${String(runPlan.maxPermutationCount ?? '—')} possible`} /><DashboardCard title="Profitable Models" value={`${dashboard.profitable} / ${dashboard.returns.length}`} detail={fmt((dashboard.profitable / Math.max(1, dashboard.returns.length)) * 100, '%')} /></div>
      {dashboard.warnings.length || status === 'failed' ? <Card className="border-amber-300 bg-amber-50"><CardHeader><CardTitle>Failure Diagnosis & Warnings</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-amber-950">{status === 'failed' ? <p>The experiment failed, but completed model rows may still be useful. If executed permutations equal requested permutations, failure likely occurred during finalization, exports, or timeout cleanup.</p> : null}{dashboard.warnings.map((warning) => <p key={warning}>Warning: {warning}</p>)}</CardContent></Card> : null}
      <div className="grid gap-3 md:grid-cols-4"><DashboardCard title="Best Net Return Model" value={`#${String(dashboard.bestReturn?.modelId ?? '—')}`} detail={`${fmt(dashboard.bestReturn?.total_return_net_pct, '%')} net · ${fmt(dashboard.bestReturn?.max_drawdown_pct, '%')} DD`} /><DashboardCard title="Best Sharpe Model" value={`#${String(dashboard.bestSharpe?.modelId ?? '—')}`} detail={`${fmt(dashboard.bestSharpe?.sharpe_per_bar)} sharpe/bar · ${fmt(dashboard.bestSharpe?.sharpe_annualized)} annualized`} /><DashboardCard title="Best Expectancy Model" value={`#${String(dashboard.bestExpectancy?.modelId ?? '—')}`} detail={`${fmt(dashboard.bestExpectancy?.trade_expectancy_pct, '%')} expectancy`} /><DashboardCard title="Lowest Drawdown Model" value={`#${String(dashboard.lowestDrawdown?.modelId ?? '—')}`} detail={`${fmt(dashboard.lowestDrawdown?.max_drawdown_pct, '%')} max drawdown`} /></div>
      <Card><CardHeader><CardTitle>Model Search Overview</CardTitle></CardHeader><CardContent className="grid gap-4 lg:grid-cols-2"><div><p className="mb-2 text-sm font-medium">Net Return Distribution</p><MiniDistribution values={dashboard.returns} /></div><KeyValueGrid items={[["Mean return", fmt(dashboard.returns.reduce((a, b) => a + b, 0) / Math.max(1, dashboard.returns.length), '%')], ["Median return", fmt(dashboard.returns[Math.floor(dashboard.returns.length / 2)], '%')], ["Best return", fmt(dashboard.returns.at(-1), '%')], ["Worst return", fmt(dashboard.returns[0], '%')], ["Backtest rows", stats.backtestRows], ["Confusion rows", stats.confusionRows]]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Risk Visualizations</CardTitle></CardHeader><CardContent className="grid gap-4 lg:grid-cols-3">{riskChartConfigs.map((config) => <RiskChartCard key={config.title} config={config} rows={dashboard.leaderboard} selectedModelId={String(selectedModel?.modelId ?? '')} onSelect={setSelectedModelId} />)}</CardContent></Card>
      <Card>
        <CardHeader><CardTitle>Models Leaderboard</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-5">
            <select className="rounded border bg-background px-3 py-2 text-sm" value={sortBy} onChange={(event) => { setLeaderboardPage(1); setSortBy(event.target.value); }} aria-label="Sort leaderboard">
              <option value="total_return_net_pct">Sort by net return</option>
              <option value="max_drawdown_pct">Sort by drawdown</option>
              <option value="sharpe_per_bar">Sort by Sharpe</option>
              <option value="trade_expectancy_pct">Sort by expectancy</option>
              <option value="trade_win_rate_pct">Sort by win rate</option>
            </select>
            <Input placeholder="Min trades" value={minTrades} onChange={(event) => { setLeaderboardPage(1); setMinTrades(event.target.value); }} />
            <Input placeholder="Max drawdown %" value={maxDrawdown} onChange={(event) => { setLeaderboardPage(1); setMaxDrawdown(event.target.value); }} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={positiveOnly} onChange={(event) => { setLeaderboardPage(1); setPositiveOnly(event.target.checked); }} /> Positive return</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={positiveExpectancyOnly} onChange={(event) => { setLeaderboardPage(1); setPositiveExpectancyOnly(event.target.checked); }} /> Positive expectancy</label>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Showing {Math.min(dashboard.filteredLeaderboard.length, (leaderboardPage - 1) * leaderboardPageSize + 1)}-{Math.min(dashboard.filteredLeaderboard.length, leaderboardPage * leaderboardPageSize)} of {dashboard.filteredLeaderboard.length} models</p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setLeaderboardPage((page) => Math.max(1, page - 1))} disabled={leaderboardPage <= 1}>Previous</Button>
              <span className="text-xs text-muted-foreground">Page {leaderboardPage} of {leaderboardPageCount}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => setLeaderboardPage((page) => Math.min(leaderboardPageCount, page + 1))} disabled={leaderboardPage >= leaderboardPageCount}>Next</Button>
            </div>
          </div>
          <div className="overflow-auto"><table className="w-full min-w-[1120px] text-sm"><thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2">Rank</th><th>Model</th><th>Net Return</th><th>Gross Return</th><th>Drawdown</th><th>Sharpe / Bar</th><th>Sharpe Annualized</th><th>Expectancy</th><th>Win Rate</th><th>Trades</th><th>Precision</th><th>Recall</th><th>Hash</th><th>View</th></tr></thead><tbody>{pagedLeaderboard.map((row, index) => { const modelId = String(row.modelId ?? '—'); const confusion = confusionMetrics.find((item) => String(item.modelId ?? '') === modelId); const artifact = artifacts.find((item) => String(item.modelId ?? '') === modelId); return <tr className="border-b" key={`${modelId}-${index}`}><td className="py-2">{(leaderboardPage - 1) * leaderboardPageSize + index + 1}</td><td>#{modelId}</td><td>{fmt(row.total_return_net_pct, '%')}</td><td>{fmt(row.total_return_gross_pct, '%')}</td><td>{fmt(row.max_drawdown_pct, '%')}</td><td>{fmt(row.sharpe_per_bar)}</td><td>{fmt(row.sharpe_annualized)}</td><td>{fmt(row.trade_expectancy_pct, '%')}</td><td>{fmt(row.trade_win_rate_pct, '%')}</td><td>{String(row.trades_count ?? '—')}</td><td>{fmt(confusion?.precision_pct, '%')}</td><td>{fmt(confusion?.recall_pct, '%')}</td><td className="font-mono text-xs">{String(row.parameter_hash ?? '').slice(0, 10) || '—'}</td><td>{artifact?.detailPath ? <Button size="sm" variant="outline" asChild><Link href={String(artifact.detailPath)}>View</Link></Button> : <Button size="sm" variant="outline" onClick={() => { setSelectedModelId(modelId); setModelDetailOpen(true); }}>View</Button>}</td></tr>; })}</tbody></table></div>
        </CardContent>
      </Card>
      {modelDetailOpen && selectedModel ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={`Model #${String(selectedModel.modelId ?? '—')}`}><div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-background p-6 shadow-2xl"><div className="mb-4 flex items-start justify-between gap-4"><div><h3 className="text-lg font-semibold">Model #{String(selectedModel.modelId ?? '—')}</h3><p className="mt-1 text-sm text-muted-foreground">Ranked detail with return, risk, trade, and parameter data.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setModelDetailOpen(false)} aria-label="Close model detail modal"><X className="mr-2 h-4 w-4" />Close</Button></div><div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]"><div className="space-y-4"><Card><CardHeader><CardTitle>Performance</CardTitle></CardHeader><CardContent><KeyValueGrid items={[["Model", `#${String(selectedModel.modelId ?? '—')}`], ["Net return", fmt(selectedModel.total_return_net_pct, '%')], ["Gross return", fmt(selectedModel.total_return_gross_pct, '%')], ["Max drawdown", fmt(selectedModel.max_drawdown_pct, '%')], ["Sharpe / bar", fmt(selectedModel.sharpe_per_bar)], ["Sharpe annualized", fmt(selectedModel.sharpe_annualized)], ["Expectancy", fmt(selectedModel.trade_expectancy_pct, '%')], ["Win rate", fmt(selectedModel.trade_win_rate_pct, '%')], ["Trades", selectedModel.trades_count], ["Parameter hash", selectedModel.parameter_hash ?? selectedArtifact?.parameterHash]]} /></CardContent></Card><Card><CardHeader><CardTitle>Parameters</CardTitle></CardHeader><CardContent><ParameterList params={(selectedArtifact?.parameters as AnyRecord | undefined) ?? {}} /></CardContent></Card></div><div className="space-y-4"><Card><CardHeader><CardTitle>Classification</CardTitle></CardHeader><CardContent>{selectedConfusion ? <KeyValueGrid items={[["Accuracy", fmt(selectedConfusionStats.accuracyPct, '%')], ["F1 score", fmt(selectedConfusionStats.f1Pct, '%')], ["Precision", fmt(selectedConfusion.precision_pct, '%')], ["Recall", fmt(selectedConfusion.recall_pct, '%')], ["Predicted positive rate", fmt(selectedConfusion.pred_pos_rate_pct, '%')], ["Actual positive rate", fmt(selectedConfusion.actual_pos_rate_pct, '%')]]} /> : <p className="text-sm text-muted-foreground">No classification metrics for this model.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Context</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p>Current leaderboard page: {leaderboardPage} of {leaderboardPageCount}.</p><p>The row is selected from the leaderboard, so charts and detail stay aligned.</p></CardContent></Card></div></div></div></div> : null}
      <Card><CardHeader><CardTitle>Parameter Insights</CardTitle></CardHeader><CardContent>{parameterCorrelations.length ? <div className="overflow-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2">Feature</th><th>Correlation</th><th>Median</th><th>CI Low</th><th>CI High</th><th>Stability</th></tr></thead><tbody>{dashboard.parameterInsights.slice(0, 12).map((row, index) => <tr className="border-b" key={index}><td className="py-2">{String(row.feature ?? '—')}</td><td>{fmt(row.corr)}</td><td>{fmt(row.corr_med)}</td><td>{fmt(row.ci_lo)}</td><td>{fmt(row.ci_hi)}</td><td>{fmt(row.sign_stability)}</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">Parameter correlations are not available yet.</p>}</CardContent></Card>
      <div className="grid gap-4 lg:grid-cols-2"><D3BarChart title="Parameter Correlation Strength" rows={dashboard.parameterInsights} labelKey="feature" valueKey="corr" positiveLabel="Positive return relationship" negativeLabel="Negative return relationship" /><D3ModelRankCurve rows={dashboard.leaderboard} selectedId={String(selectedModel?.modelId ?? '')} /></div>
      {selectedConfusion ? <D3BarChart title="Confusion Return Impact" rows={[{ group: 'TP', value: selectedConfusion.tp_mean_return_pct }, { group: 'FP', value: selectedConfusion.fp_mean_return_pct }, { group: 'TN', value: selectedConfusion.tn_mean_return_pct }, { group: 'FN', value: selectedConfusion.fn_mean_return_pct }]} labelKey="group" valueKey="value" positiveLabel="Positive mean return" negativeLabel="Negative mean return" /> : null}
      <Card><CardHeader><CardTitle>Experiment Configuration</CardTitle></CardHeader><CardContent><KeyValueGrid items={[["Name", data?.name], ["Interval", data?.interval], ["Date range", String(data?.startDate ?? '—') + ' to ' + String(data?.endDate ?? '—')], ["Job ID", jobId || '—'], ["Stage", data?.currentStage], ["Seed", runPlan.seed]]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Blueprint</CardTitle></CardHeader><CardContent><KeyValueGrid items={[["Name", readableBlueprint.name], ["Version", readableBlueprint.version], ["Approval", readableBlueprint.approvalState]]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Architecture</CardTitle></CardHeader><CardContent><KeyValueGrid items={[["Architecture", readableArchitecture.name], ...Object.entries((readableArchitecture.parameters as AnyRecord | undefined) ?? {})]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Indicators</CardTitle></CardHeader><CardContent>{Array.isArray(readableIndicators.selected) && readableIndicators.selected.length ? <div className="space-y-3">{readableIndicators.selected.map((name) => <div className="rounded border p-3" key={String(name)}><p className="font-medium">{String(name)}</p><ParameterList params={((readableIndicators.parameters as AnyRecord | undefined)?.[String(name)] as AnyRecord | undefined) ?? {}} /><KeyValueList items={((readableIndicators.outputScalers as AnyRecord | undefined)?.[String(name)] as AnyRecord | undefined) ?? {}} emptyLabel="No output scalers." /></div>)}</div> : <p className="text-sm text-muted-foreground">No indicators selected.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Target Strategy</CardTitle></CardHeader><CardContent><KeyValueGrid items={[["Strategy", readableTarget.strategy]]} /><ParameterList params={(readableTarget.parameters as AnyRecord | undefined) ?? {}} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Data / Split Summary</CardTitle></CardHeader><CardContent className="space-y-3"><KeyValueGrid items={[["Split strategy", split.strategy], ["Train ratio", splitRatios.train], ["Validation ratio", splitRatios.val], ["Test ratio", splitRatios.test], ["Completed search progress", `${String(completedPermutationCount)} / ${String(runPlan.requestedPermutationCount ?? '—')}`], ["Full search coverage", `${fmt(((n(completedPermutationCount) ?? 0) / Math.max(1, n(runPlan.maxPermutationCount) ?? 1)) * 100, '%')} of ${String(runPlan.maxPermutationCount ?? '—')}`], ["Interval", data?.interval], ["Date range", String(data?.startDate ?? '—') + ' to ' + String(data?.endDate ?? '—')]]} /><ParameterList params={(split.boundaries as AnyRecord | undefined) ?? {}} /></CardContent></Card>
      <details className="rounded-lg border"><summary className="cursor-pointer p-4 font-semibold">Execution Terminal</summary><div className="border-t p-4"><Card className="border-slate-800 bg-slate-950 text-slate-100"><CardContent className="pt-4"><div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-emerald-400 transition-all" style={{ width: Math.max(0, Math.min(100, Number(data?.progress ?? 0))) + '%' }} /></div><div className="max-h-72 overflow-auto rounded bg-black p-4 font-mono text-xs leading-6 text-slate-100">{terminalHistory.map((line, index) => <div key={line.key + '-' + index} className={line.tone ?? phaseClass}>{line.text}</div>)}</div>{data?.runtimeWarning ? <p className="mt-3 text-sm text-amber-300">{String(data.runtimeWarning)}</p> : null}</CardContent></Card></div></details>
      {canExport ? <Card><CardHeader><CardTitle>Downloads</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-2"><Button asChild variant="outline"><a href={dl('backtest')}>Download backtest CSV</a></Button><Button asChild variant="outline"><a href={dl('confusion')}>Download confusion metrics CSV</a></Button><Button asChild variant="outline"><a href={dl('parameter-correlation')}>Download parameter correlation CSV</a></Button><Button asChild variant="outline"><a href={dl('model-metrics')}>Download model metrics CSV</a></Button><Button asChild variant="outline"><a href={dl('console')}>Download console log</a></Button><Button asChild variant="outline"><a href={dl('split-metadata')}>Download split metadata CSV</a></Button><Button asChild variant="outline"><a href={dl('experiment-config')}>Download experiment config JSON</a></Button></div><div className="flex flex-col gap-2 sm:flex-row"><Input aria-label="Model ID for round log download" placeholder="Model id for round log CSV" value={roundModelId} onChange={(event) => { setRoundError(null); setRoundModelId(event.target.value); }} /><Button variant="outline" onClick={downloadRoundLog} disabled={roundDownloading}>{roundDownloading ? 'Preparing round log...' : 'Download round log CSV'}</Button></div>{roundDownloading ? <p className="text-sm text-muted-foreground" role="status" aria-live="polite">Retraining model to regenerate the round log. The download will start when the log is ready.</p> : null}{roundError ? <p className="text-sm text-destructive">{roundError}</p> : null}</CardContent></Card> : null}
    </div>
  </BaseView>;
}
