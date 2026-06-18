"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ApiClientError, getBTCUSDTKlines } from "@/lib/api/client";

import type { BTCUSDTChartPoint } from "./BTCUSDTPriceChart";
import { normalizeAscUnique } from "./utils";

const KLINE_FETCH_LIMIT = 2000;

export interface BTCUSDTChartRange {
  start: string;
  end: string;
}

export function getDefaultBTCUSDTRange(now = new Date()): BTCUSDTChartRange {
  const end = now;
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useBTCUSDTChartData(range?: BTCUSDTChartRange) {
  const resolvedRange = useMemo(() => range, [range]);
  const [data, setData] = useState<BTCUSDTChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef<BTCUSDTChartPoint[]>([]);
  const loadingRef = useRef<boolean>(true);
  const loadingOlderRef = useRef<boolean>(false);
  const hasMoreOlderRef = useRef<boolean>(false);

  useEffect(() => {
    dataRef.current = data;
    loadingRef.current = loading;
    loadingOlderRef.current = loadingOlder;
    hasMoreOlderRef.current = hasMoreOlder;
  }, [data, loading, loadingOlder, hasMoreOlder]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await getBTCUSDTKlines({
          start: resolvedRange?.start,
          end: resolvedRange?.end,
          limit: KLINE_FETCH_LIMIT,
          interval: "1m",
        });
        if (!active) return;
        setData(normalizeAscUnique(response.data?.items ?? []));
        setHasMoreOlder(Boolean(response.data?.has_more && response.data?.next_before));
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiClientError) {
          if (err.status >= 500) {
            setError("BTCUSDT chart data is temporarily unavailable. Please try again shortly.");
          } else {
            setError("Unable to load BTCUSDT chart data for the selected range.");
          }
        } else {
          setError("Failed to load BTCUSDT chart data");
        }
        setData([]);
      } finally {
        if (active) {
          setLoading(false);
          setLoadingOlder(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [resolvedRange?.end, resolvedRange?.start]);

  const loadOlder = useCallback(async (): Promise<void> => {
    if (loadingRef.current || loadingOlderRef.current || !hasMoreOlderRef.current || dataRef.current.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldest = dataRef.current[0]?.timestamp;
      if (!oldest) return;
      const response = await getBTCUSDTKlines({
        before: oldest,
        limit: KLINE_FETCH_LIMIT,
        interval: "1m",
      });
      const older = response.data?.items ?? [];
      if (older.length > 0) {
        setData((prev) => normalizeAscUnique([...older, ...prev]));
      }
      setHasMoreOlder(Boolean(response.data?.has_more && response.data?.next_before));
    } catch (err) {
      // keep chart usable even if older-page fetch fails
      console.error("Failed to load older chart data:", err);
    } finally {
      setLoadingOlder(false);
    }
  }, []);

  return { data, loading, loadingOlder, hasMoreOlder, loadOlder, error, range: resolvedRange };
}
