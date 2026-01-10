"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface PollingOptions {
  interval?: number; // milliseconds
  enabled?: boolean;
  onError?: (error: Error) => void;
}

interface PollingResult<T> {
  data: T | null;
  isPolling: boolean;
  lastUpdated: Date | null;
  error: Error | null;
  startPolling: () => void;
  stopPolling: () => void;
  forceRefresh: () => Promise<void>;
}

export function useRealTimePolling<T>(
  fetchFunction: () => Promise<T>,
  options: PollingOptions = {}
): PollingResult<T> {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchFunction();
      if (isMountedRef.current) {
        setData(result);
        setLastUpdated(new Date());
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (isMountedRef.current) {
        setError(error);
        onError?.(error);
      }
    }
  }, [fetchFunction, onError]);

  const startPolling = useCallback(() => {
    if (!enabled || intervalRef.current) return;

    setIsPolling(true);
    fetchData(); // Initial fetch

    intervalRef.current = setInterval(fetchData, interval);
  }, [enabled, interval, fetchData]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const forceRefresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    isPolling,
    lastUpdated,
    error,
    startPolling,
    stopPolling,
    forceRefresh,
  };
}
