"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ServiceGuard } from "@/components/auth/ServiceGuard";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { useServiceAccess } from "@/hooks/useServiceAccess";
import { useTimezone } from "@/hooks/useTimezone";
import { useRealTimePolling } from "@/hooks/useRealTimePolling";
import { useFirebaseRealtime } from "@/hooks/useFirebaseRealtime";
import { Device, Home, Room, CreateSensorDataRequest, SensorData, SensorDataQuery } from "@/types";
import {
  Thermometer,
  Plus,
  Eye,
  Trash2,
  Calendar,
  Filter,
  Edit,
  RefreshCw,
  Activity,
  ChevronDown,
  Clock,
  Download,
  FileText,
  FileJson,
} from "lucide-react";
import {
  LoadingSkeleton,
  SensorDataTableSkeleton,
  SensorChartSkeleton,
  SensorLatestReadingSkeleton,
} from "@/components/ui/LoadingSkeleton";
import { AdvancedSensorChart } from "@/components/ui/AdvancedSensorChart";

export default function SensorDataPage() {
  const { user } = useAuth();
  const {
    isActive: canUseService,
    isLoading: isServiceLoading,
  } = useServiceAccess();
  const { toUTC, fromUTC, formatForDisplay, getCurrentLocalTime, userTimezone } = useTimezone();

  // Filter states - Declare BEFORE useRealTimePolling to avoid temporal dead zone
  const [selectedDevices, setSelectedDevices] = useState<number[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null); // Keep for backward compatibility with chart
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50); // Smaller initial page size for lazy loading

  // Advanced filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [timeRangePreset, setTimeRangePreset] = useState<string>("");
  const [selectedHomes, setSelectedHomes] = useState<string[]>([]);

  // Data states - MUST be declared BEFORE using them in useMemo
  const [devices, setDevices] = useState<Device[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [latestSensorData, setLatestSensorData] = useState<SensorData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLatest, setIsLoadingLatest] = useState(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Get NodeId from Room (via Device.RoomId) for Firebase Realtime Database
  const getNodeIdFromDevice = useCallback((deviceId: number | null): string | null => {
    if (!deviceId) return null;
    
    // Find device to get RoomId
    const device = devices.find((d) => d.DeviceId === deviceId);
    if (!device) {
      console.warn(`[SensorDataPage] Device ${deviceId} not found`);
      return null;
    }

    // Find room to get NodeIdentifier
    const room = rooms.find((r) => Number(r.id) === device.RoomId);
    if (!room) {
      console.warn(`[SensorDataPage] Room ${device.RoomId} not found for Device ${deviceId}`);
      return null;
    }

    const nodeId = room.nodeIdentifier;
    if (nodeId) {
      console.log(`[SensorDataPage] Found NodeId "${nodeId}" for Device ${deviceId} (Room: ${room.name})`);
      return nodeId;
    } else {
      console.warn(`[SensorDataPage] Room "${room.name}" (ID: ${room.id}) has no NodeIdentifier. Firebase realtime will not work.`);
      return null;
    }
  }, [devices, rooms]);

  // Calculate selectedNodeId using useMemo to avoid temporal dead zone
  const selectedNodeId = useMemo(() => {
    return getNodeIdFromDevice(selectedDevice);
  }, [selectedDevice, getNodeIdFromDevice]);

  // Firebase Realtime Database subscription for latest sensor data
  const {
    data: firebaseTelemetryData,
    isConnected: isFirebaseConnected,
    error: firebaseError,
    lastUpdated: firebaseLastUpdated,
  } = useFirebaseRealtime(selectedNodeId, {
    enabled: !!selectedNodeId, // Only enable if we have a NodeId
    onError: (error) => {
      console.warn("[SensorDataPage] Firebase realtime error:", error.message);
    },
  });

  // Removed: Real-time polling for latest sensor data (no longer using API, only Firebase)

  // Prepare latestData state early so displayLatestData can reference it
  const [latestData, setLatestData] = useState<SensorData | null>(null);
  
  // Convert Firebase telemetry data to SensorData format for display
  const convertFirebaseDataToSensorData = (telemetry: any, deviceId: number): SensorData | null => {
    if (!telemetry) return null;
    try {
      // Convert Firebase telemetry to JSON string (same format as backend API)
      const valueString = JSON.stringify(telemetry);
      const timestamp = telemetry.timestamp 
        ? new Date(telemetry.timestamp).toISOString() 
        : new Date().toISOString();
      
      return {
        Id: 0, // Firebase doesn't have ID, use 0 as placeholder
        DeviceId: deviceId,
        Value: valueString,
        TimeStamp: timestamp,
      };
    } catch (error) {
      console.error("[SensorDataPage] Error converting Firebase data:", error);
      return null;
    }
  };

  // Format sensor value based on DeviceType for better UI display
  const formatSensorValue = (value: string, deviceType?: string): React.ReactNode => {
    if (!value) return <span className="text-gray-400">No data</span>;

    try {
      const parsed = JSON.parse(value);
      
      // If not an object, display as-is
      if (typeof parsed !== "object" || parsed === null) {
        return (
          <pre className="text-xs bg-white rounded p-2 border overflow-x-auto whitespace-pre-wrap">
            {value}
          </pre>
        );
      }

      // Format based on DeviceType
      const deviceTypeUpper = (deviceType || "").toUpperCase();
      
      // DHT Sensor: Temperature & Humidity
      if (deviceTypeUpper.includes("DHT") || deviceTypeUpper.includes("TEMPERATURE")) {
        const items = [];
        if (typeof parsed.temp === "number") {
          items.push(
            <div key="temp" className="flex justify-between items-center py-1 border-b border-gray-200">
              <span className="text-xs text-gray-500">Temperature</span>
              <span className="text-sm font-semibold text-blue-600">{parsed.temp.toFixed(1)}°C</span>
            </div>
          );
        }
        if (typeof parsed.hum === "number") {
          items.push(
            <div key="hum" className="flex justify-between items-center py-1">
              <span className="text-xs text-gray-500">Humidity</span>
              <span className="text-sm font-semibold text-green-600">{parsed.hum.toFixed(1)}%</span>
            </div>
          );
        }
        if (items.length > 0) {
          return <div className="space-y-1">{items}</div>;
        }
      }

      // MQ2 Gas Sensor
      if (deviceTypeUpper.includes("MQ2") || deviceTypeUpper.includes("GAS_MQ2")) {
        if (typeof parsed.gas_mq2 === "number") {
          return (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Gas (MQ2)</span>
              <span className="text-sm font-semibold text-orange-600">{parsed.gas_mq2} ppm</span>
            </div>
          );
        }
      }

      // MQ135 Gas Sensor
      if (deviceTypeUpper.includes("MQ135") || deviceTypeUpper.includes("GAS_MQ135")) {
        if (typeof parsed.gas_mq135 === "number") {
          return (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Gas (MQ135)</span>
              <span className="text-sm font-semibold text-red-600">{parsed.gas_mq135} ppm</span>
            </div>
          );
        }
      }

      // Motion Sensor
      if (deviceTypeUpper.includes("MOTION") || deviceTypeUpper.includes("PIR")) {
        if (typeof parsed.motion === "number") {
          return (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Motion</span>
              <span className={`text-sm font-semibold ${parsed.motion === 1 ? "text-green-600" : "text-gray-400"}`}>
                {parsed.motion === 1 ? "Detected" : "No Motion"}
              </span>
            </div>
          );
        }
      }

      // Fallback: Display all sensor values nicely formatted
      const entries = Object.entries(parsed).filter(([key]) => key !== "timestamp");
      if (entries.length > 0) {
        return (
          <div className="space-y-2">
            {entries.map(([key, val]) => {
              // Format key name
              const label = key
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
              
              // Format value with unit
              let displayValue = String(val);
              let unit = "";
              
              if (typeof val === "number") {
                if (key.includes("temp")) {
                  displayValue = val.toFixed(1);
                  unit = "°C";
                } else if (key.includes("hum")) {
                  displayValue = val.toFixed(1);
                  unit = "%";
                } else if (key.includes("gas")) {
                  unit = " ppm";
                } else if (key.includes("motion")) {
                  displayValue = val === 1 ? "Detected" : "No Motion";
                } else {
                  displayValue = val.toFixed(2);
                }
              }
              
              return (
                <div key={key} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {displayValue}{unit}
                  </span>
                </div>
              );
            })}
          </div>
        );
      }

      // Last fallback: formatted JSON
      return (
        <pre className="text-xs bg-white rounded p-2 border overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      // Not JSON, display as-is
      return (
        <pre className="text-xs bg-white rounded p-2 border overflow-x-auto whitespace-pre-wrap">
          {value}
        </pre>
      );
    }
  };

  // Use Firebase real-time data only (no API fallback)
  const firebaseSensorData = selectedDevice && firebaseTelemetryData 
    ? convertFirebaseDataToSensorData(firebaseTelemetryData, selectedDevice) 
    : null;
  const displayLatestData = firebaseSensorData;

  // Additional loading states (isLoading and isLoadingLatest already declared above)
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  // UI states
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSensorData, setEditingSensorData] = useState<any | null>(null);

  // Function definitions (must be before useEffect)
  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("[SensorDataPage] Fetching devices for user:", user?.id);

      // Fetch homes first
      let userHomes: Home[] = [];
      if (user?.id) {
        userHomes = await apiService.getMyHomes();
      }
      setHomes(userHomes);

      // Fetch all devices and rooms from all homes
      const allDevices: Device[] = [];
      const allRooms: Room[] = [];
      for (const home of userHomes) {
        try {
          const homeRooms = await apiService.getRoomsByHome(home.id);
          allRooms.push(...homeRooms);
          for (const room of homeRooms) {
            try {
              const roomDevices = await apiService.getDevicesByRoom(Number(room.id));
              allDevices.push(...roomDevices);
            } catch (err: any) {
              console.error(
                `[SensorDataPage] Could not fetch devices for room ${room.id}:`,
                err?.message || err
              );
            }
          }
        } catch (err: any) {
          console.error(
            `[SensorDataPage] Could not fetch rooms for home ${home.id}:`,
            err?.message || err
          );
        }
      }
      setDevices(allDevices);
      setRooms(allRooms);
      console.log("[SensorDataPage] Total devices:", allDevices.length);
      console.log("[SensorDataPage] Total rooms:", allRooms.length);

      // Log rooms with NodeIdentifier for debugging
      const roomsWithNodeId = allRooms.filter(r => r.nodeIdentifier);
      console.log("[SensorDataPage] Rooms with NodeIdentifier:", roomsWithNodeId.length, roomsWithNodeId);
    } catch (err: any) {
      const errorMsg =
        err?.message || err?.detail || err?.error || "Failed to load devices";
      console.error("[SensorDataPage] Error fetching devices:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Removed: fetchLatestSensorData - No longer using API for latest data, only Firebase realtime

  const fetchSensorData = useCallback(async (loadMore = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setPage(1); // Reset to first page when not loading more
      }
      setError(null);

      console.log(
        "[SensorDataPage] Fetching sensor data for device:",
        selectedDevice,
        "with query:",
        { ...dateRange, page: loadMore ? page + 1 : 1, pageSize }
      );

      if (selectedDevice) {
        const query: Omit<SensorDataQuery, "deviceId"> = {};
        if (dateRange.from) {
          query.from = toUTC(dateRange.from); // Use timezone-aware conversion
        }
        if (dateRange.to) {
          query.to = toUTC(dateRange.to); // Use timezone-aware conversion
        }
        query.page = loadMore ? page + 1 : 1;
        query.pageSize = pageSize;

        console.log("[SensorDataPage] Query params:", query);
        const data = await apiService.getSensorData(selectedDevice, query);
        console.log(
          "[SensorDataPage] Received sensor data:",
          Array.isArray(data) ? data.length : 0,
          "records"
        );
        console.log("[SensorDataPage] Sample record:", data?.[0]);

        // Normalize data to handle both PascalCase and camelCase
        const normalizedData = Array.isArray(data)
          ? data.map((item: any) => ({
              Id: Number(item?.Id ?? item?.id ?? 0),
              DeviceId: Number(item?.DeviceId ?? item?.deviceId ?? item?.device_id ?? 0),
              Value: String(item?.Value ?? item?.value ?? ""),
              TimeStamp: String(item?.TimeStamp ?? item?.timeStamp ?? item?.timestamp ?? item?.Timestamp ?? ""),
            }))
          : [];

        if (loadMore) {
          setSensorData(prev => [...prev, ...normalizedData]);
          setPage(prev => prev + 1);
          // Check if we got less data than requested (end of data)
          setHasMoreData(normalizedData.length === pageSize);
        } else {
          setSensorData(normalizedData);
          setPage(1);
          setHasMoreData(normalizedData.length === pageSize);
        }
      } else {
        console.log("[SensorDataPage] No device selected, clearing data");
        setSensorData([]);
        setHasMoreData(true);
      }
    } catch (err: any) {
      const errorMsg =
        err?.message || err?.detail || err?.error || "Failed to load sensor data";
      console.error("[SensorDataPage] Error fetching sensor data:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedDevice, dateRange, page, pageSize, toUTC]);

  // useEffect hooks (must be after function definitions)
  useEffect(() => {
    if (isServiceLoading) return;
    if (!canUseService) {
      setIsLoading(false);
      return;
    }
    fetchDevices();
  }, [user, canUseService, isServiceLoading]);

  useEffect(() => {
    if ((selectedDevice || selectedDevices.length > 0) && canUseService) {
      fetchSensorData();
      // Removed: fetchLatestSensorData - Only using Firebase realtime now
    } else {
      setSensorData([]);
      setLatestData(null);
    }
  }, [selectedDevice, selectedDevices, dateRange, page, pageSize, canUseService]);

  const handleCreateSensorData = async (sensorDataForm: any) => {
    try {
      setError(null);
      console.log("[SensorDataPage] Creating sensor data with form:", sensorDataForm);

      // Validate DeviceId
      if (!sensorDataForm.deviceId || isNaN(Number(sensorDataForm.deviceId))) {
        throw new Error("Device ID is required and must be a number");
      }

      // Validate Value is string
      if (!sensorDataForm.value || typeof sensorDataForm.value !== "string") {
        throw new Error("Value is required and must be a string");
      }

      // Build payload with timezone-aware timestamp conversion
      const payload: CreateSensorDataRequest = {
        DeviceId: Number(sensorDataForm.deviceId),
        Value: sensorDataForm.value,
        TimeStamp: sensorDataForm.timeStamp
          ? toUTC(sensorDataForm.timeStamp) // Convert local time to UTC
          : undefined,
      };
      console.log("[SensorDataPage] Sensor data payload:", payload);

      await apiService.createSensorData(payload);
      console.log("[SensorDataPage] Sensor data created successfully");
      fetchSensorData(); // Refresh data
      setShowCreateForm(false);
    } catch (err: any) {
      const errorMsg =
        err?.message || err?.detail || err?.error || "Failed to create sensor data";
      console.error("[SensorDataPage] Error creating sensor data:", errorMsg, err);
      setError(errorMsg);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMoreData && selectedDevice) {
      fetchSensorData(true);
    }
  };

  // Export functions
  const exportToCSV = () => {
    if (!sensorData.length) return;

    const headers = ["ID", "Device ID", "Value", "Timestamp"];
    const csvContent = [
      headers.join(","),
      ...sensorData.map(row => [
        row.Id,
        row.DeviceId,
        `"${row.Value.replace(/"/g, '""')}"`, // Escape quotes in CSV
        row.TimeStamp,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sensor-data-device-${selectedDevice}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (!sensorData.length) return;

    const jsonContent = JSON.stringify(sensorData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sensor-data-devices-${selectedDevices.join("-") || selectedDevice || "all"}-${new Date().toISOString().split("T")[0]}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Advanced filtering functions
  const applyTimeRangePreset = (preset: string) => {
    const now = new Date();
    let from = "";
    let to = fromUTC(now.toISOString());

    switch (preset) {
      case "last_hour":
        from = fromUTC(new Date(now.getTime() - 60 * 60 * 1000).toISOString());
        break;
      case "last_6_hours":
        from = fromUTC(new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString());
        break;
      case "last_24_hours":
        from = fromUTC(new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
        break;
      case "last_7_days":
        from = fromUTC(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
        break;
      case "last_30_days":
        from = fromUTC(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());
        break;
      case "this_month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        from = fromUTC(startOfMonth.toISOString());
        break;
      case "custom":
        // Keep existing custom range
        return;
      default:
        return;
    }

    setDateRange({ from, to });
    setTimeRangePreset(preset);
  };

  const toggleDeviceSelection = (deviceId: number) => {
    setSelectedDevices(prev => {
      if (prev.includes(deviceId)) {
        return prev.filter(id => id !== deviceId);
      } else {
        return [...prev, deviceId];
      }
    });
  };

  const toggleHomeSelection = (homeId: string) => {
    setSelectedHomes(prev => {
      if (prev.includes(homeId)) {
        return prev.filter(id => id !== homeId);
      } else {
        return [...prev, homeId];
      }
    });
  };

  const clearAllFilters = () => {
    setSelectedDevices([]);
    setSelectedDevice(null);
    setSelectedHomes([]);
    setDateRange({ from: "", to: "" });
    setTimeRangePreset("");
    setPage(1);
  };

  // Get filtered devices based on selected homes
  const getFilteredDevices = () => {
    if (selectedHomes.length === 0) return devices;
    return devices.filter(device => {
      // Find which home this device belongs to
      for (const home of homes) {
        if (selectedHomes.includes(home.id)) {
          try {
            const homeRooms = apiService.getRoomsByHome(home.id);
            // This is async, for now just return all devices
            // In a real implementation, you'd need to cache this data
            return true;
          } catch {
            continue;
          }
        }
      }
      return false;
    });
  };

  const handleUpdateSensorData = async (sensorDataForm: any) => {
    try {
      setError(null);
      console.log("[SensorDataPage] Updating sensor data with form:", sensorDataForm);

      if (!editingSensorData) return;

      // Validate value is JSON
      let valueString = sensorDataForm.value;
      try {
        if (typeof valueString !== "string") valueString = String(valueString);
        JSON.parse(valueString);
      } catch {
        throw new Error("Value must be valid JSON string");
      }

      // Note: Backend might not support update for sensor data
      // This is a placeholder implementation
      console.log("[SensorDataPage] Update not fully supported by backend");
      setError("Update functionality may not be fully supported by the backend");
      setEditingSensorData(null);
    } catch (err: any) {
      const errorMsg =
        err?.message || err?.detail || err?.error || "Failed to update sensor data";
      console.error("[SensorDataPage] Error updating sensor data:", errorMsg, err);
      setError(errorMsg);
    }
  };

  const handleDeleteSensorData = async (id: number) => {
    if (!confirm("Are you sure you want to delete this sensor data?")) return;

    try {
      setError(null);
      console.log("[SensorDataPage] Deleting sensor data:", id);

      // Note: Backend might not support DELETE for sensor data
      // This is a placeholder implementation
      setSensorData(sensorData.filter((item) => item.Id !== id));
      console.log("[SensorDataPage] Sensor data deleted successfully");
    } catch (err: any) {
      const errorMsg =
        err?.message || err?.detail || err?.error || "Failed to delete sensor data";
      console.error("[SensorDataPage] Error deleting sensor data:", errorMsg, err);
      setError(errorMsg);
    }
  };

  // Helper to normalize API response (handle both PascalCase and camelCase)
  const normalizeSensorData = (item: any) => {
    return {
      id: item?.id ?? item?.Id ?? "",
      deviceId: item?.deviceId ?? item?.DeviceId ?? item?.device_id ?? "",
      value: item?.value ?? item?.Value ?? "",
      timeStamp: item?.timeStamp ?? item?.TimeStamp ?? item?.timestamp ?? item?.Timestamp ?? "",
    };
  };

  const formatTimestamp = (timestamp: string | null | undefined) => {
    if (!timestamp) return "";
    return formatForDisplay(timestamp);
  };

  const parseSensorValue = (value: string | null | undefined) => {
    if (!value || value.trim() === "") {
      return { error: "No value provided" };
    }
    try {
      const parsed = JSON.parse(value);
      // If parsed is empty object, show a message
      if (typeof parsed === "object" && parsed !== null && Object.keys(parsed).length === 0) {
        return { warning: "Empty JSON object" };
      }
      return parsed;
    } catch (e) {
      // If not valid JSON, return as raw value
      return { raw: value, error: "Invalid JSON format" };
    }
  };

  const extractNumericForChart = (parsed: any): number | null => {
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.temperature === "number") return parsed.temperature;
    if (typeof parsed.humidity === "number") return parsed.humidity;
    if (typeof parsed.value === "number") return parsed.value;
    return null;
  };

  if (isLoading && devices.length === 0) {
    return (
      <ProtectedRoute>
        <ServiceGuard>
          <Layout>
            <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </Layout>
        </ServiceGuard>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ServiceGuard>
        <Layout>
        <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sensor Data</h1>
                <p className="text-gray-600 mt-2">Monitor and manage sensor readings</p>
              </div>
              <div className="flex gap-2">
                {/* Export buttons */}
                {selectedDevice && sensorData.length > 0 && (
                  <div className="flex gap-1">
                    <button
                      onClick={exportToCSV}
                      className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center text-sm"
                      title="Export as CSV"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      CSV
                    </button>
                    <button
                      onClick={exportToJSON}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm"
                      title="Export as JSON"
                    >
                      <FileJson className="w-4 h-4 mr-1" />
                      JSON
                    </button>
                  </div>
                )}

                {/* Add Data button */}
                {user?.role === "admin" && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Data
                  </button>
                )}
              </div>
            </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Filters - Only for Customer */}
        {user?.role !== "admin" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </h3>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {showAdvancedFilters ? "Simple Filters" : "Advanced Filters"}
            </button>
          </div>

          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device
              </label>
              <select
                value={selectedDevice || ""}
                onChange={(e) => {
                  const deviceId = e.target.value ? Number(e.target.value) : null;
                  setSelectedDevice(deviceId);
                  setSelectedDevices(deviceId ? [deviceId] : []);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a device</option>
                {devices.map((device) => (
                  <option key={device.DeviceId} value={device.DeviceId}>
                    {device.Name} (ID: {device.DeviceId})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="datetime-local"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="datetime-local"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page
              </label>
              <input
                type="number"
                min={1}
                value={page}
                onChange={(e) => setPage(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page Size
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) || 50)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Time Range Presets */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Time Ranges
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "last_hour", label: "Last Hour" },
                { key: "last_6_hours", label: "Last 6 Hours" },
                { key: "last_24_hours", label: "Last 24 Hours" },
                { key: "last_7_days", label: "Last 7 Days" },
                { key: "last_30_days", label: "Last 30 Days" },
                { key: "this_month", label: "This Month" },
              ].map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => applyTimeRangePreset(preset.key)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    timeRangePreset === preset.key
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Homes
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {homes.map((home) => (
                      <label key={home.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedHomes.includes(home.id)}
                          onChange={() => toggleHomeSelection(home.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{home.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Device Selection (Multiple) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Devices
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {getFilteredDevices().map((device) => (
                      <label key={device.DeviceId} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedDevices.includes(device.DeviceId)}
                          onChange={() => toggleDeviceSelection(device.DeviceId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{device.Name} (ID: {device.DeviceId})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchSensorData()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Apply filters
              </button>
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear all
              </button>
            </div>

            {/* Filter Summary */}
            {(selectedDevices.length > 0 || selectedHomes.length > 0 || dateRange.from || dateRange.to) && (
              <div className="text-sm text-gray-600">
                Active filters: {selectedDevices.length} devices, {selectedHomes.length} homes
                {(dateRange.from || dateRange.to) && ", custom time range"}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Latest reading - Only for Customer */}
        {user?.role !== "admin" && selectedDevice && (
          displayLatestData ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-500">Latest reading</p>
                  <p className="text-lg font-semibold text-gray-900">
                    Device ID: {selectedDevice}
                  </p>
                  <div className="text-xs text-gray-400 mt-1 space-y-1">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Timezone: {userTimezone || "Loading..."}
                    </div>
                    {selectedNodeId && (
                      <div className="flex items-center gap-2">
                        {isFirebaseConnected ? (
                          <div className="flex items-center text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            Firebase Realtime Active
                            {firebaseLastUpdated && (
                              <span className="ml-1">
                                (last: {firebaseLastUpdated.toLocaleTimeString()})
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center text-yellow-600">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                            Connecting to Firebase...
                          </div>
                        )}
                        {selectedNodeId && (
                          <span className="text-gray-500">
                            (NodeId: {selectedNodeId})
                          </span>
                        )}
                      </div>
                    )}
                    {firebaseError && (
                      <div className="flex items-center text-red-600">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                        Firebase Error: {firebaseError.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {displayLatestData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-2">Value</p>
                    <div className="bg-white rounded p-2 border min-h-[60px]">
                      {formatSensorValue(
                        displayLatestData.Value,
                        devices.find(d => d.DeviceId === selectedDevice)?.DeviceType
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Timestamp</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatTimestamp(displayLatestData?.TimeStamp)}
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Record ID</p>
                    <p className="text-sm font-medium text-gray-900">
                      {displayLatestData.Id || "Firebase Realtime"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Chưa có bản ghi mới nhất cho thiết bị này.
                  {selectedNodeId && !isFirebaseConnected && !firebaseError && (
                    <span className="block mt-1 text-xs text-yellow-600">
                      Đang kết nối Firebase... (NodeId: {selectedNodeId})
                    </span>
                  )}
                  {!selectedNodeId && selectedDevice && (
                    <span className="block mt-1 text-xs text-gray-400">
                      (Room chưa có NodeIdentifier. Vui lòng cập nhật Room để sử dụng Firebase Realtime)
                    </span>
                  )}
                </p>
              )}
            </div>
          ) : selectedNodeId ? (
            <SensorLatestReadingSkeleton />
          ) : null
        )}

        {/* Simple trend chart - Only for Customer */}
        {user?.role !== "admin" && selectedDevice && sensorData.length > 0 && (
          isLoading ? (
            <SensorChartSkeleton />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Sensor trend</p>
                    <p className="text-xs text-gray-500">
                      Giá trị gần nhất của {Math.min(sensorData.length, 30)} bản ghi
                    </p>
                  </div>
                </div>
              </div>
              <AdvancedSensorChart
                data={sensorData}
                parseValue={parseSensorValue}
                extractNumeric={extractNumericForChart}
                deviceId={selectedDevice || undefined}
                deviceName={devices.find(d => d.DeviceId === selectedDevice)?.Name}
              />
            </div>
          )
        )}

        {/* Sensor Data Table - Only for Customer */}
        {user?.role !== "admin" && (
          isLoading ? (
            <SensorDataTableSkeleton />
          ) : sensorData.length === 0 ? (
            <div className="text-center py-12">
              <Thermometer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No sensor data found
              </h3>
              <p className="text-gray-500 mb-4">
                {selectedDevice
                  ? "No data found for the selected device and date range."
                  : "Select a device to view sensor data."}
              </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Sensor Data
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Sensor Readings</h3>
                  <p className="text-sm text-gray-500">
                    {sensorData.length} records found
                    {hasMoreData && selectedDevice && " (showing first page)"}
                  </p>
                </div>
                <div className="text-xs text-gray-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {userTimezone}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    {user?.role === "admin" && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sensorData.map((rawItem, index) => {
                    const item = normalizeSensorData(rawItem);
                    const parsedValue = parseSensorValue(item.value);
                    return (
                      <tr key={item.id || `${item.deviceId}-${item.timeStamp}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.id || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.deviceId || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                          <div className="truncate" title={item.value}>
                            <pre className="text-xs bg-gray-100 p-2 rounded overflow-hidden whitespace-nowrap text-ellipsis max-w-xs">
                              {item.value}
                            </pre>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTimestamp(item.timeStamp)}
                        </td>
                        {user?.role === "admin" && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingSensorData(item)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSensorData(item.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Load More Button */}
            {hasMoreData && selectedDevice && sensorData.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading more...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Load more records
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}

        {showCreateForm && (
          <CreateSensorDataForm
            devices={devices}
            onSubmit={handleCreateSensorData}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {editingSensorData && (
          <EditSensorDataForm
            sensorData={editingSensorData}
            devices={devices}
            onSubmit={handleUpdateSensorData}
            onCancel={() => setEditingSensorData(null)}
          />
        )}
        </Layout>
      </ServiceGuard>
    </ProtectedRoute>
  );
}

function CreateSensorDataForm({
  devices,
  onSubmit,
  onCancel,
}: {
  devices: Device[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const { getCurrentLocalTime, userTimezone } = useTimezone();

  const [formData, setFormData] = useState({
    deviceId: "",
    value: "",
    timeStamp: "",
  });

  // Set timestamp on client mount to avoid hydration mismatch
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      timeStamp: getCurrentLocalTime(), // Use timezone-aware current time
    }));
  }, [getCurrentLocalTime]);

  const loadExample = (type: "temperature" | "humidity" | "motion" | "text") => {
    const examples = {
      temperature: "22.5°C",
      humidity: "65%",
      motion: "Motion detected",
      text: "Sensor reading: normal",
    };
    const example = examples[type];
    setFormData({ ...formData, value: example });
  };

  const [jsonError, setJsonError] = useState<string | undefined>();
  const validateJson = (_value: string) => {
    // Accept any string for Value in new API; keep placeholder validator
    setJsonError(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jsonError) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
        <h2 className="text-xl font-semibold mb-4">Add Sensor Data</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.deviceId}
              onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a device</option>
              {devices.map((device) => (
                <option key={device.DeviceId} value={device.DeviceId}>
                  {device.Name} (ID: {device.DeviceId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Value <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadExample("temperature")}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Temp
                </button>
                <button
                  type="button"
                  onClick={() => loadExample("humidity")}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Humidity
                </button>
                <button
                  type="button"
                  onClick={() => loadExample("motion")}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Motion
                </button>
                <button
                  type="button"
                  onClick={() => loadExample("text")}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Text
                </button>
              </div>
            </div>
            <textarea
              value={formData.value}
              onChange={(e) => {
                setFormData({ ...formData, value: e.target.value });
                validateJson(e.target.value);
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 font-mono text-sm ${
                jsonError
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              rows={6}
              placeholder='{"temperature": 22.5, "humidity": 65}'
              required
            />
            {jsonError && <p className="text-xs text-red-600 mt-1">{jsonError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timestamp
            </label>
            <input
              type="datetime-local"
              value={formData.timeStamp}
              onChange={(e) => setFormData({ ...formData, timeStamp: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SensorMiniChart({
  data,
  parseValue,
  extractNumeric,
}: {
  data: any[];
  parseValue: (v: string) => any;
  extractNumeric: (parsed: any) => number | null;
}) {
  // Lấy tối đa 30 bản ghi gần nhất và chuyển thành points số
  const recent = data
    .slice(-30)
    .map((raw) => {
      const v = parseValue((raw as any).value ?? (raw as any).Value ?? "");
      return {
        t:
          (raw as any).timeStamp ||
          (raw as any).TimeStamp ||
          (raw as any).timestamp ||
          (raw as any).Timestamp,
        y: extractNumeric(v),
      };
    })
    .filter((p) => p.y !== null) as { t: string; y: number }[];

  if (recent.length === 0) {
    return <p className="text-sm text-gray-500">Không có giá trị số để vẽ biểu đồ.</p>;
  }

  const min = Math.min(...recent.map((p) => p.y));
  const max = Math.max(...recent.map((p) => p.y));
  const range = max - min || 1;

  return (
    <div className="h-40 flex items-end gap-1">
      {recent.map((p, idx) => {
        const normalized = (p.y - min) / range;
        const height = 20 + normalized * 80; // 20–100%
        return (
          <div
            key={`${p.t}-${idx}`}
            className="flex-1 bg-gradient-to-t from-blue-500 to-sky-400 rounded-t-md"
            style={{ height: `${height}%` }}
            title={`${new Date(p.t).toLocaleTimeString()} → ${p.y}`}
          />
        );
      })}
    </div>
  );
}

function EditSensorDataForm({
  sensorData,
  devices,
  onSubmit,
  onCancel,
}: {
  sensorData: any;
  devices: Device[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const { fromUTC, userTimezone } = useTimezone();

  // Normalize sensor data first
  const normalizedData = {
    id: sensorData?.id ?? sensorData?.Id ?? "",
    deviceId: sensorData?.deviceId ?? sensorData?.DeviceId ?? sensorData?.device_id ?? "",
    value: sensorData?.value ?? sensorData?.Value ?? "",
    timeStamp: sensorData?.timeStamp ?? sensorData?.TimeStamp ?? sensorData?.timestamp ?? sensorData?.Timestamp ?? "",
  };

  // Try to format JSON for display
  let formattedValue = normalizedData.value || "";
  try {
    if (formattedValue) {
      formattedValue = JSON.stringify(JSON.parse(formattedValue), null, 2);
    }
  } catch {
    // Keep original value if parsing fails
  }

  const [formData, setFormData] = useState({
    deviceId: String(normalizedData.deviceId || ""),
    value: formattedValue,
    timeStamp: normalizedData.timeStamp
      ? fromUTC(normalizedData.timeStamp) // Convert UTC to local datetime-local format
      : "",
  });

  // Set default timestamp on client mount if not provided
  useEffect(() => {
    if (!formData.timeStamp) {
      setFormData(prev => ({
        ...prev,
        timeStamp: new Date().toISOString().slice(0, 16), // Fallback to current time in UTC format for datetime-local
      }));
    }
  }, [formData.timeStamp]);

  const [jsonError, setJsonError] = useState<string | undefined>();

  const validateJson = (value: string) => {
    if (!value.trim()) {
      setJsonError(undefined);
      return;
    }
    try {
      JSON.parse(value);
      setJsonError(undefined);
    } catch (e: any) {
      setJsonError(`Invalid JSON: ${e.message}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
        <h2 className="text-xl font-semibold mb-4">Edit Sensor Data</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.deviceId}
              onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled
            >
              <option value="">Select a device</option>
              {devices.map((device) => (
                <option key={device.DeviceId} value={device.DeviceId}>
                  {device.Name} (ID: {device.DeviceId})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Device cannot be changed after creation
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value (JSON) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.value}
              onChange={(e) => {
                setFormData({ ...formData, value: e.target.value });
                validateJson(e.target.value);
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 font-mono text-sm ${
                jsonError
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              rows={6}
              placeholder='{"temperature": 22.5, "humidity": 65}'
              required
            />
            {jsonError && <p className="text-xs text-red-600 mt-1">{jsonError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timestamp <span className="text-xs text-gray-500">({userTimezone})</span>
            </label>
            <input
              type="datetime-local"
              value={formData.timeStamp}
              onChange={(e) => setFormData({ ...formData, timeStamp: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Time will be stored in UTC and displayed in your local timezone
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Update
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
