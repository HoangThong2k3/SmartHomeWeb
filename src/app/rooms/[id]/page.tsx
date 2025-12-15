"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import UserLayout from "@/components/layout/UserLayout";
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

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const roomId = params.id as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [home, setHome] = useState<Home | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

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

      // Fetch devices
      const roomDevices = await apiService.getDevicesByRoom(roomId);
      setDevices(roomDevices);
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
      // Refresh devices
      const updatedDevices = await apiService.getDevicesByRoom(roomId);
      setDevices(updatedDevices);
    } catch (err: any) {
      alert("Không thể điều khiển thiết bị. Vui lòng thử lại.");
      console.error("Error controlling device:", err);
    }
  };

  // Lấy dữ liệu cảm biến (mock - cần tích hợp API thực tế)
  const getSensorData = () => {
    const dhtDevice = devices.find((d) => d.type === "dht");
    const pirDevice = devices.find((d) => d.type === "pir");
    const mq2Device = devices.find((d) => d.type === "mq2");

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
    return devices.filter((d) =>
      ["servo", "led"].includes(d.type.toLowerCase())
    );
  };

  const sensorData = getSensorData();
  const controlDevices = getControlDevices();
  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === "online").length;

  if (isLoading) {
    return (
      <ProtectedRoute>
        <ServiceGuard>
          <UserLayout>
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Đang tải thông tin phòng...</p>
              </div>
            </div>
          </UserLayout>
        </ServiceGuard>
      </ProtectedRoute>
    );
  }

  if (error || !room) {
    return (
      <ProtectedRoute>
        <ServiceGuard>
          <UserLayout>
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
          </UserLayout>
        </ServiceGuard>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ServiceGuard>
        <UserLayout>
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
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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

            {/* Danh sách thiết bị điều khiển */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Điều khiển thiết bị
              </h2>
              {controlDevices.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Chưa có thiết bị điều khiển trong phòng này.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {controlDevices.map((device) => {
                    const isOn = device.status === "online";
                    const isServo = device.type.toLowerCase() === "servo";
                    const isLed = device.type.toLowerCase() === "led";

                    return (
                      <div
                        key={device.id}
                        className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {device.name}
                            </h3>
                            <p className="text-sm text-gray-500 capitalize">
                              {device.type.replace("_", " ")}
                            </p>
                            <div className="mt-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  isOn
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {isOn ? "Đang hoạt động" : "Đã tắt"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isServo && (
                              <>
                                <button
                                  onClick={() => handleDeviceControl(device.id, "open")}
                                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    isOn
                                      ? "bg-green-600 text-white hover:bg-green-700"
                                      : "bg-gray-300 text-gray-700"
                                  }`}
                                >
                                  <DoorOpen className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeviceControl(device.id, "close")}
                                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    !isOn
                                      ? "bg-red-600 text-white hover:bg-red-700"
                                      : "bg-gray-300 text-gray-700"
                                  }`}
                                >
                                  <DoorClosed className="h-5 w-5" />
                                </button>
                              </>
                            )}
                            {isLed && (
                              <button
                                onClick={() =>
                                  handleDeviceControl(device.id, isOn ? "off" : "on")
                                }
                                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                                  isOn
                                    ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                    : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                                }`}
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
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center"
              >
                <Eye className="h-5 w-5 mr-2" />
                Xem Lịch sử Dữ liệu Cảm biến
              </button>
            </div>
          </div>
        </UserLayout>
      </ServiceGuard>
    </ProtectedRoute>
  );
}

