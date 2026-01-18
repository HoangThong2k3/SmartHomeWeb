import { useEffect, useState, useRef } from "react";
import {
  subscribeToTelemetry,
  unsubscribeFromTelemetry,
  FirebaseTelemetryData,
  isFirebaseConfigured,
} from "@/services/firebase";

interface UseFirebaseRealtimeOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
}

interface UseFirebaseRealtimeReturn {
  data: FirebaseTelemetryData | null;
  isConnected: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

export function useFirebaseRealtime(
  nodeId: string | null | undefined,
  options: UseFirebaseRealtimeOptions = {}
): UseFirebaseRealtimeReturn {
  const { enabled = true, onError } = options;

  const [data, setData] = useState<FirebaseTelemetryData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!nodeId || !enabled) {
      setData(null);
      setIsConnected(false);
      setError(null);
      setLastUpdated(null);
      if (unsubscribeRef.current) {
        unsubscribeFromTelemetry(unsubscribeRef.current);
        unsubscribeRef.current = null;
      }
      return;
    }
    if (!isFirebaseConfigured()) {
      const configError = new Error(
        "Firebase chưa được cấu hình. Vui lòng kiểm tra NEXT_PUBLIC_FIREBASE_DATABASE_URL trong environment variables."
      );
      setError(configError);
      setIsConnected(false);
      if (onErrorRef.current) {
        onErrorRef.current(configError);
      }
      return;
    }
    if (unsubscribeRef.current) {
      unsubscribeFromTelemetry(unsubscribeRef.current);
      unsubscribeRef.current = null;
    }

    try {
      console.log(`[useFirebaseRealtime] Subscribing to nodeId: ${nodeId}`);
      setIsConnected(true);
      setError(null);
      const unsubscribe = subscribeToTelemetry(nodeId, (telemetryData) => {
        if (telemetryData) {
          setData(telemetryData);
          setLastUpdated(new Date());
          setIsConnected(true);
          setError(null);
        } else {
          setData(null);
          setIsConnected(true);
        }
      });

      unsubscribeRef.current = unsubscribe;
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to subscribe to Firebase";
      const firebaseError = new Error(errorMessage);
      console.error(`[useFirebaseRealtime] Error:`, firebaseError);
      setError(firebaseError);
      setIsConnected(false);
      if (onErrorRef.current) {
        onErrorRef.current(firebaseError);
      }
    }
    return () => {
      if (unsubscribeRef.current) {
        console.log(`[useFirebaseRealtime] Unsubscribing from nodeId: ${nodeId}`);
        unsubscribeFromTelemetry(unsubscribeRef.current);
        unsubscribeRef.current = null;
      }
    };
  }, [nodeId, enabled]);

  return {
    data,
    isConnected,
    error,
    lastUpdated,
  };
}

