"use client";

import { useEffect, useRef } from 'react';
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';

import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';

import { normalizeAscUnique } from './utils';

export interface BTCUSDTChartPoint {
  time: number;
  timestamp?: string;
  open: number | string;
  high: number | string;
  low: number | string;
  close: number | string;
  volume?: number | string;
}

export interface BTCUSDTPriceChartProps {
  data?: BTCUSDTChartPoint[];
  markers?: Array<{
    time: number;
    position: 'aboveBar' | 'belowBar' | 'inBar';
    color: string;
    shape?: 'circle' | 'square' | 'arrowUp' | 'arrowDown';
    text?: string;
  }>;
  loading?: boolean;
  error?: string | null;
  height?: number;
  onRequestOlder?: () => void;
}

const LOAD_OLDER_THRESHOLD = 200;

function toSeriesPoint(point: BTCUSDTChartPoint): CandlestickData {
  return {
    time: point.time as UTCTimestamp,
    open: Number(point.open),
    high: Number(point.high),
    low: Number(point.low),
    close: Number(point.close),
  };
}

function isPrefixMatch(previous: BTCUSDTChartPoint[], next: BTCUSDTChartPoint[]): boolean {
  if (previous.length > next.length) return false;
  for (let index = 0; index < previous.length; index += 1) {
    if (Number(previous[index].time) !== Number(next[index].time)) {
      return false;
    }
  }
  return true;
}

function pointsEqual(a: BTCUSDTChartPoint, b: BTCUSDTChartPoint): boolean {
  return (
    Number(a.time) === Number(b.time)
    && Number(a.open) === Number(b.open)
    && Number(a.high) === Number(b.high)
    && Number(a.low) === Number(b.low)
    && Number(a.close) === Number(b.close)
  );
}

export function BTCUSDTPriceChart({
  data,
  markers,
  loading = false,
  error = null,
  height = 320,
  onRequestOlder,
}: BTCUSDTPriceChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const initializedRef = useRef(false);
  const onRequestOlderRef = useRef<(() => void) | undefined>(onRequestOlder);
  const previousDataRef = useRef<BTCUSDTChartPoint[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    onRequestOlderRef.current = onRequestOlder;
  }, [onRequestOlder]);

  useEffect(() => {
    if (loading || error || !data?.length || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    if (!chartRef.current) {
      const chart = createChart(container, {
        width: container.clientWidth || 640,
        height,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#94a3b8',
        },
        grid: {
          vertLines: { color: '#1f2937' },
          horzLines: { color: '#1f2937' },
        },
        rightPriceScale: {
          borderColor: '#334155',
        },
        timeScale: {
          borderColor: '#334155',
          timeVisible: true,
          secondsVisible: false,
        },
        localization: {
          timeFormatter: (timestamp: number) => {
            const dt = new Date(timestamp * 1000);
            return dt.toISOString().replace('T', ' ').replace('Z', ' UTC');
          },
        },
      });
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        borderVisible: false,
      });
      chartRef.current = chart;
      seriesRef.current = candleSeries;
      chart.subscribeCrosshairMove((param) => {
        const candle = param.seriesData.get(candleSeries) as
          | { open: number; high: number; low: number; close: number }
          | undefined;
        if (!param.time || !candle) {
          return;
        }
        const dt = new Date(Number(param.time) * 1000).toISOString().replace('T', ' ').replace('Z', ' UTC');
        if (legendRef.current) {
          legendRef.current.textContent = `${dt} | O: ${candle.open.toFixed(2)} H: ${candle.high.toFixed(2)} L: ${candle.low.toFixed(2)} C: ${candle.close.toFixed(2)}`;
        }
      });
      const timeScale = chart.timeScale();
      if (typeof timeScale.subscribeVisibleLogicalRangeChange === 'function') {
        timeScale.subscribeVisibleLogicalRangeChange((range) => {
          if (!range || !onRequestOlderRef.current) return;
          if (range.from < LOAD_OLDER_THRESHOLD) {
            onRequestOlderRef.current();
          }
        });
      }

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserverRef.current = new ResizeObserver((entries) => {
          const width = entries[0]?.contentRect.width ?? container.clientWidth;
          chart.applyOptions({ width });
        });
        resizeObserverRef.current.observe(container);
      }
    }

    const chart = chartRef.current;
    const candleSeries = seriesRef.current;
    if (!chart || !candleSeries) return;

    chart.applyOptions({ width: container.clientWidth || 640, height });

    const nextData = normalizeAscUnique(data);
    const previousData = previousDataRef.current;
    const shouldReplaceWholeSeries =
      previousData.length === 0
      || nextData.length === 0
      || !isPrefixMatch(previousData, nextData)
      || nextData.length < previousData.length;

    if (shouldReplaceWholeSeries) {
      candleSeries.setData(nextData.map(toSeriesPoint));
      if (nextData.length > 0) {
        chart.timeScale().scrollToRealTime?.();
      }
    } else if (nextData.length > previousData.length) {
      for (const point of nextData.slice(previousData.length)) {
        candleSeries.update(toSeriesPoint(point));
      }
      chart.timeScale().scrollToRealTime?.();
    } else if (nextData.length > 0) {
      const previousLast = previousData[previousData.length - 1];
      const nextLast = nextData[nextData.length - 1];
      if (!pointsEqual(previousLast, nextLast)) {
        candleSeries.update(toSeriesPoint(nextLast));
      }
    }

    previousDataRef.current = nextData;

    const latest = nextData[nextData.length - 1];
    if (legendRef.current) {
      if (!latest) {
        legendRef.current.textContent = 'Hover candle to inspect datetime and OHLC';
      } else {
        const dt = new Date(latest.time * 1000).toISOString().replace('T', ' ').replace('Z', ' UTC');
        legendRef.current.textContent = `${dt} | O: ${Number(latest.open).toFixed(2)} H: ${Number(latest.high).toFixed(2)} L: ${Number(latest.low).toFixed(2)} C: ${Number(latest.close).toFixed(2)}`;
      }
    }

    if (typeof (candleSeries as any).setMarkers === 'function') {
      (candleSeries as any).setMarkers((markers ?? []).map((marker) => ({
        time: marker.time as UTCTimestamp,
        position: marker.position,
        color: marker.color,
        shape: marker.shape ?? 'circle',
        text: marker.text ?? '',
      })));
    }

    if (!initializedRef.current && nextData.length > 0) {
      chart.timeScale().fitContent();
      initializedRef.current = true;
    }
  }, [data, error, height, loading, markers]);

  useEffect(() => {
    return () => {
      resizeObserverRef.current?.disconnect();
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
      previousDataRef.current = [];
      initializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (data?.length === 0 && chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
      previousDataRef.current = [];
      initializedRef.current = false;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      if (legendRef.current) {
        legendRef.current.textContent = 'Hover candle to inspect datetime and OHLC';
      }
    }
  }, [data]);

  if (loading) {
    return <LoadingState message="Loading BTCUSDT price data..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!data?.length) {
    return (
      <EmptyState
        title="No BTCUSDT candles"
        description="No cached BTCUSDT 1m data is available for this range."
      />
    );
  }

  return (
    <div className="glass space-y-2 rounded-xl p-3">
      <div ref={containerRef} data-testid="btcusdt-price-chart" style={{ height, width: '100%' }} />
      <div
        ref={legendRef}
        data-testid="btcusdt-price-chart-legend"
        className="rounded-md border border-border/50 bg-background/40 px-2 py-1 font-mono text-[11px] text-muted-foreground backdrop-blur-sm"
      />
    </div>
  );
}
