// Custom hook để sử dụng Firebase Realtime Database trong React components
import { useEffect, useState, useRef } from "react";
import {
  subscribeToTelemetry,
  unsubscribeFromTelemetry,
  FirebaseTelemetryData,
  isFirebaseConfigured,
} from "@/services/firebase";

interface UseFirebaseRealtimeOptions {
  enabled?: boolean; // Có bật subscription không
  onError?: (error: Error) => void; // Callback khi có lỗi
}

interface UseFirebaseRealtimeReturn {
  data: FirebaseTelemetryData | null;
  isConnected: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

/**
 * Hook để lắng nghe dữ liệu telemetry từ Firebase Realtime Database
 * @param nodeId - NodeId (HardwareId) của thiết bị, ví dụ: "NODE_01"
 * @param options - Options cho hook
 * @returns { data, isConnected, error, lastUpdated }
 */
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
  
  // Use ref for onError callback to avoid re-subscription on every render
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    // Reset state khi nodeId thay đổi hoặc disabled
    if (!nodeId || !enabled) {
      setData(null);
      setIsConnected(false);
      setError(null);
      setLastUpdated(null);

      // Unsubscribe nếu có subscription cũ
      if (unsubscribeRef.current) {
        unsubscribeFromTelemetry(unsubscribeRef.current);
        unsubscribeRef.current = null;
      }
      return;
    }

    // Kiểm tra Firebase config
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

    // Cleanup subscription cũ nếu có
    if (unsubscribeRef.current) {
      unsubscribeFromTelemetry(unsubscribeRef.current);
      unsubscribeRef.current = null;
    }

    try {
      console.log(`[useFirebaseRealtime] Subscribing to nodeId: ${nodeId}`);
      setIsConnected(true);
      setError(null);

      // Subscribe vào Firebase
      const unsubscribe = subscribeToTelemetry(nodeId, (telemetryData) => {
        if (telemetryData) {
          setData(telemetryData);
          setLastUpdated(new Date());
          setIsConnected(true);
          setError(null);
        } else {
          // Không có dữ liệu, nhưng vẫn connected
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

    // Cleanup khi component unmount hoặc dependencies thay đổi
    return () => {
      if (unsubscribeRef.current) {
        console.log(`[useFirebaseRealtime] Unsubscribing from nodeId: ${nodeId}`);
        unsubscribeFromTelemetry(unsubscribeRef.current);
        unsubscribeRef.current = null;
      }
      // Don't call setState in cleanup to avoid triggering re-renders
      // State will be reset on next mount or when nodeId changes
    };
  }, [nodeId, enabled]); // Removed onError from dependencies to prevent infinite loop

  return {
    data,
    isConnected,
    error,
    lastUpdated,
  };
}

