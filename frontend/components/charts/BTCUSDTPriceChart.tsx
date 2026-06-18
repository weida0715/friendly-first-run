'use client';

import { useEffect, useRef } from 'react';
import {
  CandlestickSeries,
  ColorType,
  createChart,
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
  loading?: boolean;
  error?: string | null;
  height?: number;
  onRequestOlder?: () => void;
}

const LOAD_OLDER_THRESHOLD = 200;

export function BTCUSDTPriceChart({
  data,
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
    }

    const chart = chartRef.current;
    const candleSeries = seriesRef.current;
    if (!chart || !candleSeries) return;

    chart.applyOptions({ width: container.clientWidth || 640, height });

    const safeData = normalizeAscUnique(data);

    candleSeries.setData(
      safeData.map((point) => ({
        time: point.time as UTCTimestamp,
        open: Number(point.open),
        high: Number(point.high),
        low: Number(point.low),
        close: Number(point.close),
      })),
    );

    const setLegend = (point?: {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
    }) => {
      if (!legendRef.current) return;
      if (!point) {
        legendRef.current.textContent = 'Hover candle to inspect datetime and OHLC';
        return;
      }
      const dt = new Date(point.time * 1000).toISOString().replace('T', ' ').replace('Z', ' UTC');
      legendRef.current.textContent = `${dt} | O: ${point.open.toFixed(2)} H: ${point.high.toFixed(2)} L: ${point.low.toFixed(2)} C: ${point.close.toFixed(2)}`;
    };

    const normalized = safeData.map((point) => ({
      time: point.time,
      open: Number(point.open),
      high: Number(point.high),
      low: Number(point.low),
      close: Number(point.close),
    }));
    setLegend(normalized[normalized.length - 1]);

    if (!initializedRef.current) {
      chart.timeScale().fitContent();
      initializedRef.current = true;
    }

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? container.clientWidth;
        chart.applyOptions({ width });
      });
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver?.disconnect();
      // keep chart instance alive across data updates; teardown on component unmount only
    };
  }, [data, error, height, loading]);

  useEffect(() => {
    return () => {
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
      initializedRef.current = false;
    };
  }, []);

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
    <div className="space-y-2">
      <div ref={containerRef} data-testid="btcusdt-price-chart" style={{ height, width: '100%' }} />
      <div ref={legendRef} data-testid="btcusdt-price-chart-legend" className="text-xs text-muted-foreground" />
    </div>
  );
}
