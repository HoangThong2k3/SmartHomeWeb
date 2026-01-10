"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ServiceGuard } from "@/components/auth/ServiceGuard";
import { apiService } from "@/services/api";
import { Room, Device, Home } from "@/types";
import {
  ArrowLeft,
  Thermometer,
  Droplets,
  Activity,
  Edit,
  DoorOpen,
  DoorClosed,
  Lightbulb,
  LightbulbOff,
  Eye,
} from "lucide-react";
import { Cpu } from "lucide-react";

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const roomId = params.id as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [home, setHome] = useState<Home | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  // UI state for expanded device details and latest sensor data cache
  const [expandedDeviceIds, setExpandedDeviceIds] = useState<string[]>([]);
  const [latestDataByDevice, setLatestDataByDevice] = useState<Record<string, any>>({});
  const [latestLoadingIds, setLatestLoadingIds] = useState<string[]>([]);

  const toggleDeviceDetails = useCallback(
    async (device: any) => {
      const id = String(device.DeviceId ?? device.id ?? device.Id ?? "");
      if (!id) return;
      const isExpanded = expandedDeviceIds.includes(id);
      if (isExpanded) {
        setExpandedDeviceIds((prev) => prev.filter((p) => p !== id));
        return;
      }

      // expand and fetch latest sensor data
      setExpandedDeviceIds((prev) => [...prev, id]);
      if (latestDataByDevice[id]) return; // already cached
      setLatestLoadingIds((prev) => [...prev, id]);
      try {
        const numericId = Number(device.DeviceId ?? device.id ?? device.Id);
        if (!isNaN(numericId) && numericId > 0) {
          const latest = await apiService.getLatestSensorData(numericId);
          setLatestDataByDevice((prev) => ({ ...prev, [id]: latest }));
        } else {
          setLatestDataByDevice((prev) => ({ ...prev, [id]: null }));
        }
      } catch (e) {
        console.error("Failed to load latest sensor data for device", id, e);
        setLatestDataByDevice((prev) => ({ ...prev, [id]: null }));
      } finally {
        setLatestLoadingIds((prev) => prev.filter((p) => p !== id));
      }
    },
    [expandedDeviceIds, latestDataByDevice]
  );

  useEffect(() => {
    fetchRoomData();
  }, [roomId, user]);

  const fetchRoomData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const roomData = await apiService.getRoomById(roomId);
      setRoom(roomData);
      setNewRoomName(roomData.name);

      // Fetch home
      if (roomData.homeId) {
        try {
          const homeData = await apiService.getHomeById(roomData.homeId);
          setHome(homeData);
        } catch (err) {
          console.error("Error fetching home:", err);
        }
      }

      // Fetch devices: prefer Devices embedded in Room response when available,
      // otherwise fall back to getDevicesByRoom.
      let rawRoomDevices = (roomData as any).Devices ?? (roomData as any).devices ?? null;
      if (!rawRoomDevices) {
        rawRoomDevices = await apiService.getDevicesByRoom(Number(roomId));
      }
      const normalizedDevices = (rawRoomDevices || []).map((d: any) => ({
        id: d?.id ?? d?.Id ?? d?.DeviceId ?? d?.deviceId ?? "",
        name: d?.name ?? d?.Name ?? "",
        type: (d?.type ?? d?.Type ?? d?.DeviceType ?? d?.deviceType ?? "").toString(),
        status:
          d?.status ??
          d?.Status ??
          (d?.currentState ?? d?.CurrentState ? "online" : "offline"),
        currentState: d?.currentState ?? d?.CurrentState ?? "",
        roomId: d?.roomId ?? d?.RoomId ?? "",
      }));
      setDevices(normalizedDevices);
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin phòng");
      console.error("Error fetching room data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameRoom = async () => {
    if (!newRoomName.trim() || !room) return;

    try {
      await apiService.updateRoom(room.id, { name: newRoomName.trim() });
      setRoom({ ...room, name: newRoomName.trim() });
      setEditingRoomName(false);
    } catch (err: any) {
      alert("Không thể đổi tên phòng. Vui lòng thử lại.");
      console.error("Error renaming room:", err);
    }
  };

  const handleDeviceControl = async (deviceId: string, action: string) => {
    try {
      // TODO: Gọi API để điều khiển thiết bị
      // await apiService.controlDevice(deviceId, action);
      alert(`Đã ${action === "on" ? "bật" : "tắt"} thiết bị`);
      // Refresh room data (will use embedded Devices if available)
      await fetchRoomData();
    } catch (err: any) {
      alert("Không thể điều khiển thiết bị. Vui lòng thử lại.");
      console.error("Error controlling device:", err);
    }
  };

  // Lấy dữ liệu cảm biến (mock - cần tích hợp API thực tế)
  const getSensorData = () => {
    const dhtDevice = devices.find((d: any) => (d.type || "").toLowerCase() === "dht");
    const pirDevice = devices.find((d: any) => (d.type || "").toLowerCase() === "pir");
    const mq2Device = devices.find((d: any) => (d.type || "").toLowerCase() === "mq2");

    return {
      temperature: dhtDevice ? "28°C" : "N/A",
      humidity: dhtDevice ? "65%" : "N/A",
      hasMotion: pirDevice
        ? pirDevice.status === "online"
          ? "Có chuyển động"
          : "Không có chuyển động"
        : "N/A",
      airQuality: mq2Device ? "Tốt" : "N/A",
    };
  };

  // Lấy thiết bị điều khiển
  const getControlDevices = () => {
    return devices.filter((d: any) =>
      ["servo", "led"].includes((d.type || "").toLowerCase())
    );
  };

  const summarizeState = (raw: any) => {
    const s = raw ?? "";
    if (typeof s === "string") {
      try {
        const parsed = JSON.parse(s);
        if (parsed && typeof parsed === "object") {
          const temp = parsed.temperature ?? parsed.temp ?? parsed.value;
          const hum = parsed.humidity ?? parsed.hum;
          const status = parsed.status ?? parsed.state ?? null;
          const parts: string[] = [];
          if (status) parts.push(status.toString());
          if (typeof temp === "number" || typeof temp === "string") parts.push(`T:${temp}`);
          if (typeof hum === "number" || typeof hum === "string") parts.push(`H:${hum}`);
          if (parts.length > 0) return parts.join(" • ");
          return JSON.stringify(parsed);
        }
      } catch {
        // not JSON
      }
      return s.length > 40 ? s.slice(0, 36) + "..." : s;
    }
    return String(s);
  };

  const sensorData = getSensorData();
  const controlDevices = getControlDevices();
  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === "online").length;

  if (isLoading) {
    return (
      <ProtectedRoute>
        <ServiceGuard>
          <Layout>
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Đang tải thông tin phòng...</p>
              </div>
            </div>
          </Layout>
        </ServiceGuard>
      </ProtectedRoute>
    );
  }

  if (error || !room) {
    return (
      <ProtectedRoute>
        <ServiceGuard>
          <Layout>
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center py-12">
                <p className="text-red-600">{error || "Không tìm thấy phòng"}</p>
                <button
                  onClick={() => router.push("/user-dashboard")}
                  className="mt-4 text-blue-600 hover:text-blue-700"
                >
                  Quay lại Dashboard
                </button>
              </div>
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
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => router.push("/user-dashboard")}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Quay lại Dashboard
              </button>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {editingRoomName ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        className="text-2xl font-bold text-gray-900 border-2 border-blue-500 rounded px-2 py-1"
                        autoFocus
                        onBlur={handleRenameRoom}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRenameRoom();
                          } else if (e.key === "Escape") {
                            setNewRoomName(room.name);
                            setEditingRoomName(false);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {room.name}
                      </h1>
                      <button
                        onClick={() => setEditingRoomName(true)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Chỉnh sửa tên phòng"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
                {home && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{home.name}</p>
                    <p className="text-xs text-gray-400">
                      Home ID: {home.id}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  {totalDevices} thiết bị
                </span>
                <span className="px-2 py-1 rounded-full bg-green-50 text-green-700">
                  {onlineDevices} online
                </span>
                {room.type && (
                  <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 capitalize">
                    {room.type.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>

            {/* Biểu đồ nhiệt độ/độ ẩm (Mock) */}
            <div className="bg-[color:var(--surface)] rounded-lg p-6 mb-6 card-shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Dữ liệu cảm biến
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border-2 border-orange-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <Thermometer className="h-6 w-6 text-orange-600" />
                    <h3 className="font-semibold text-gray-900">Nhiệt độ</h3>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">
                    {sensorData.temperature}
                  </p>
                  <div className="mt-4 h-32 bg-white rounded flex items-end justify-center p-2">
                    {/* Mock chart bars */}
                    <div className="flex items-end space-x-1 h-full">
                      {[65, 70, 68, 72, 75, 73, 71].map((height, i) => (
                        <div
                          key={i}
                          className="bg-orange-400 rounded-t w-8"
                          style={{ height: `${height}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border-2 border-blue-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <Droplets className="h-6 w-6 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Độ ẩm</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {sensorData.humidity}
                  </p>
                  <div className="mt-4 h-32 bg-white rounded flex items-end justify-center p-2">
                    {/* Mock chart bars */}
                    <div className="flex items-end space-x-1 h-full">
                      {[60, 65, 63, 67, 70, 68, 66].map((height, i) => (
                        <div
                          key={i}
                          className="bg-blue-400 rounded-t w-8"
                          style={{ height: `${height}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-700">
                    Chuyển động: <span className="font-semibold">{sensorData.hasMotion}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Eye className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">
                    Không khí: <span className="font-semibold text-green-600">{sensorData.airQuality}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Thiết bị trong phòng (danh sách đầy đủ, chi tiết bật/tắt) */}
            <div className="bg-[color:var(--surface)] rounded-lg p-6 mb-6 card-shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thiết bị trong phòng</h2>
              {devices.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có thiết bị trong phòng này.</p>
              ) : (
                <div className="space-y-3">
                  {devices.map((device) => {
                    const id = String(device.id ?? device.DeviceId ?? device.Id ?? "");
                    const isExpanded = expandedDeviceIds.includes(id);
                    const latest = latestDataByDevice[id];
                    const loadingLatest = latestLoadingIds.includes(id);
                    const devType = String(device.type || device.DeviceType || "").replace("_", " ");
                    const isOnline = String(device.status || device.currentState || "").toLowerCase() === "online";
                    return (
                      <div key={id || device.name} className="border rounded-lg p-4 bg-[color:var(--surface)] card-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`h-10 w-10 rounded-md flex items-center justify-center ${isOnline ? "bg-emerald-50" : "bg-gray-50"}`}>
                              <Cpu className={`w-5 h-5 ${isOnline ? "text-emerald-600" : "text-gray-500"}`} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900">{device.name || device.Name || `Device ${id}`}</h3>
                                <span className="text-xs text-gray-500">#{id}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{devType || "Device"}</p>
                              {device.currentState && <p className="text-[11px] text-gray-500 mt-1">{summarizeState(device.currentState)}</p>}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleDeviceDetails(device)}
                              className="btn btn-ghost px-3 py-1 text-sm"
                            >
                              {isExpanded ? "Ẩn chi tiết" : "Xem chi tiết"}
                            </button>
                            <button
                              onClick={() => router.push(`/devices/${id}`)}
                              className="btn btn-ghost px-3 py-1 text-sm"
                            >
                              Mở
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 border-t pt-3">
                            {loadingLatest ? (
                              <p className="text-sm text-gray-500">Đang tải dữ liệu cảm biến mới nhất...</p>
                            ) : latest ? (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3 bg-gray-50 rounded">
                                  <p className="text-xs text-gray-500">Sensor Id</p>
                                  <p className="font-semibold">{latest.Id ?? latest.id}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded">
                                  <p className="text-xs text-gray-500">Value</p>
                                  <p className="font-semibold">{String(latest.Value ?? latest.value ?? "—")}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded">
                                  <p className="text-xs text-gray-500">Timestamp</p>
                                  <p className="font-semibold">{latest.TimeStamp ?? latest.timeStamp ?? "—"}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">Không có dữ liệu cảm biến mới nhất.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Danh sách thiết bị điều khiển */}
            <div className="bg-[color:var(--surface)] rounded-lg p-6 card-shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Điều khiển thiết bị
              </h2>
              {controlDevices.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Chưa có thiết bị điều khiển trong phòng này.</p>
                </div>
              ) : (
                <div className="space-y-4">
                    {controlDevices.map((device: any) => {
                    const isOn = (device.status || "").toLowerCase() === "online";
                    const isServo = (device.type || "").toLowerCase() === "servo";
                    const isLed = (device.type || "").toLowerCase() === "led";
                    const id = device.id || device.DeviceId || device.Id;

                    return (
                      <div
                        key={id || device.name}
                        className="border-2 border-gray-100 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${isOn ? "bg-green-50" : "bg-gray-50"}`}>
                              <Cpu className={`w-6 h-6 ${isOn ? "text-emerald-600" : "text-gray-500"}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {device.name || device.Name}
                              </h3>
                              <p className="text-sm text-gray-500 capitalize">
                                {(device.type || device.DeviceType || "").replace("_", " ")}
                              </p>
                              <div className="mt-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    isOn ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {summarizeState(device.status || device.currentState || device.CurrentState || "N/A")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isServo && (
                              <>
                                <button
                                  onClick={() => handleDeviceControl(id, "open")}
                                  className={`btn ${isOn ? "btn-primary" : "btn-ghost"} p-2`}
                                  title="Open"
                                >
                                  <DoorOpen className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeviceControl(id, "close")}
                                  className={`btn ${!isOn ? "btn-primary" : "btn-ghost"} p-2`}
                                  title="Close"
                                >
                                  <DoorClosed className="h-5 w-5" />
                                </button>
                              </>
                            )}
                            {isLed && (
                              <button
                                onClick={() =>
                                  handleDeviceControl(id, isOn ? "off" : "on")
                                }
                                className={`btn ${isOn ? "btn-primary" : "btn-ghost"} px-4 py-2 font-medium flex items-center space-x-2`}
                              >
                                {isOn ? (
                                  <>
                                    <Lightbulb className="h-5 w-5" />
                                    <span>Tắt</span>
                                  </>
                                ) : (
                                  <>
                                    <LightbulbOff className="h-5 w-5" />
                                    <span>Bật</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Nút xem lịch sử */}
            <div className="mt-6">
              <button
                onClick={() => router.push(`/sensor-data?roomId=${roomId}`)}
                className="btn btn-primary w-full px-6 py-3 flex items-center justify-center"
              >
                <Eye className="h-5 w-5 mr-2" />
                Xem Lịch sử Dữ liệu Cảm biến
              </button>
            </div>
          </div>
        </Layout>
      </ServiceGuard>
    </ProtectedRoute>
  );
}

