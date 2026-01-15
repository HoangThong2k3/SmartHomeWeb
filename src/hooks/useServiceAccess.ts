import { useEffect, useState, useCallback, useRef } from "react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

type ServiceStatusState = "loading" | "no-service" | "installing" | "active" | "inactive" | "unknown";

export function useServiceAccess() {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<ServiceStatusState>("loading");
  const [serviceUser, setServiceUser] = useState<any>(null);
  const hasLoadedRef = useRef<string | number | null>(null);
  const isLoadingRef = useRef(false);

  const loadStatus = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      return;
    }

    if (user?.role !== "customer") {
      setStatus("active");
      return;
    }

    const userId = user?.id || user?.userId;
    // Chỉ load một lần cho mỗi user
    if (hasLoadedRef.current === userId) {
      return;
    }

    try {
      isLoadingRef.current = true;
      
      // Chỉ refresh user data nếu chưa load lần nào
      if (!hasLoadedRef.current && refreshUser) {
        await refreshUser();
      }
      
      const data = await apiService.getCurrentUser();
      setServiceUser(data);
      const serviceStatus = (data?.serviceStatus || "")?.toString() || "";

      // Mark as loaded
      hasLoadedRef.current = (userId ?? null) as string | number | null;

      // Normalize common status values to internal state
      const upper = serviceStatus.toUpperCase();
      if (!serviceStatus || upper === "CHƯA CÓ DỊCH VỤ" || upper.includes("CHƯA") || upper === "INACTIVE" || upper === "SUSPENDED") {
        setStatus("no-service");
        return;
      }
      if (upper === "INSTALLING" || upper.includes("ĐANG CÀI ĐẶT") || upper.includes("ĐANG")) {
        setStatus("installing");
        return;
      }
      if (upper === "ACTIVE" || upper.includes("HOÀN TẤT") || upper.includes("HOẠT ĐỘNG")) {
        setStatus("active");
        return;
      }
      // fallback
      setStatus("unknown");
    } catch (error) {
      console.warn("[useServiceAccess] Failed to load service status:", error);
      setStatus("no-service");
    } finally {
      isLoadingRef.current = false;
    }
  }, [user?.id, user?.role, refreshUser]);

  useEffect(() => {
    let mounted = true;

    // Reset khi user thay đổi
    const userId = user?.id || user?.userId;
    if (userId && hasLoadedRef.current !== userId) {
      hasLoadedRef.current = null;
    }

    const fetchStatus = async () => {
      await loadStatus();
      if (!mounted) return;
    };

    fetchStatus();

    return () => {
      mounted = false;
    };
  }, [loadStatus]);

  return {
    status,
    serviceUser,
    isLoading: status === "loading",
    isActive: status === "active" || user?.role === "admin",
    isCustomer: user?.role === "customer",
    needsSubscription: status === "no-service",
    isInstalling: status === "installing",
    refetch: loadStatus, // Expose refetch function
  };
}

