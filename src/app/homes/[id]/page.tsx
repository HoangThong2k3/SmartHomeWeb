"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ServiceGuard } from "@/components/auth/ServiceGuard";
import { apiService } from "@/services/api";
import { HomeProfile, Room, Device } from "@/types";
import {
  ArrowLeft,
  Home as HomeIcon,
  MapPin,
  ShieldCheck,
  ShieldOff,
  Clock,
  DoorOpen,
  Cpu,
  Power,
} from "lucide-react";

export default function HomeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const homeId = (params?.id as string) || "";

  const [home, setHome] = useState<HomeProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devicesByRoom, setDevicesByRoom] = useState<Record<string, any[]>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!homeId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const homeRes = await apiService.getHomeProfile(homeId);
        const roomsRes = await apiService.getRoomsByHome(homeId);

        const devicesMap: Record<string, Device[]> = {};
        await Promise.all(
          (roomsRes || []).map(async (room) => {
            try {
              devicesMap[room.id] = await apiService.getDevicesByRoom(Number(room.id));
            } catch (err) {
              console.error("Failed to load devices for room", room.id, err);
              devicesMap[room.id] = [];
            }
          })
        );

        setHome(homeRes);
        setRooms(roomsRes || []);
        setDevicesByRoom(devicesMap);
      } catch (err: any) {
        setError(parseErrorMessage(err?.message || "Không thể tải thông tin nhà."));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [homeId]);

  const summarizeState = (raw: any) => {
    const s = raw ?? "";
    if (typeof s === "string") {
      try {
        const parsed = JSON.parse(s);
        if (parsed && typeof parsed === "object") {
          // prefer temperature/humidity if present
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
      // truncate long strings
      return s.length > 40 ? s.slice(0, 36) + "..." : s;
    }
    return String(s);
  };

  const totalDevices = useMemo(() => {
    const counted = Object.values(devicesByRoom).reduce(
      (sum, list) => sum + (list?.length || 0),
      0
    );
    return counted || home?.totalDevices || 0;
  }, [devicesByRoom, home?.totalDevices]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <ServiceGuard>
          <Layout>
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </Layout>
        </ServiceGuard>
      </ProtectedRoute>
    );
  }

  if (error || !home) {
    return (
      <ProtectedRoute>
        <ServiceGuard>
          <Layout>
            <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
              <p className="text-lg font-semibold text-red-600">
                {error || "Không tìm thấy thông tin ngôi nhà."}
              </p>
              <button
                onClick={() => router.push("/homes")}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại danh sách Home
              </button>
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
          {/* Device control handler */}
          {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
          {/* Simple control: ON/OFF for LEDs, OPEN/CLOSE for servos */}
          <div style={{ display: "none" }}>
            {/* hidden placeholder to keep handler scoped in component */}
          </div>
          {/* Control handler */}
          {/* @ts-ignore */}
          {null}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </button>
              <div>
                <p className="text-sm text-gray-500">Home profile</p>
                <h1 className="text-2xl font-bold text-gray-900">{home.name}</h1>
                <p className="text-sm text-gray-500">
                  Owner: {home.ownerName || home.ownerEmail || `#${home.ownerId}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {home.securityStatus === "ARMED" ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  Armed
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  <ShieldOff className="w-4 h-4 mr-1" />
                  Disarmed
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <HomeIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Thông tin chung
                    </h2>
                    <div className="mt-2 text-sm text-gray-700 space-y-1">
                      {home.description && (
                        <p className="text-gray-600">{home.description}</p>
                      )}
                      {home.address && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{home.address}</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>
                          Tạo lúc:{" "}
                          {new Date(home.createdAt || "").toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {home.homeType && (
                          <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                            Loại: {home.homeType}
                          </span>
                        )}
                        {home.securityMode && (
                          <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                            Chế độ: {home.securityMode}
                          </span>
                        )}
                        {home.alertsEnabled !== undefined && (
                          <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                            Cảnh báo: {home.alertsEnabled ? "Bật" : "Tắt"}
                          </span>
                        )}
                        {home.temperatureUnit && (
                          <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-medium">
                            Nhiệt độ: {home.temperatureUnit}
                          </span>
                        )}
                        {home.timezone && (
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                            TZ: {home.timezone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                    <p className="text-xs uppercase text-gray-500">Rooms</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {home.totalRooms ?? rooms.length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                    <p className="text-xs uppercase text-gray-500">Devices</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {totalDevices}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                    <p className="text-xs uppercase text-gray-500">Security</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {home.securityStatus || "DISARMED"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 bg-white">
                    <p className="text-xs uppercase text-gray-500">Diện tích</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {home.area ? `${home.area} m²` : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 bg-white">
                    <p className="text-xs uppercase text-gray-500">Số tầng</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {home.floors ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 bg-white">
                    <p className="text-xs uppercase text-gray-500">Cài đặt bởi</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {home.installedBy || "—"}
                    </p>
                    {home.installationDate && (
                      <p className="text-xs text-gray-500">
                        {new Date(home.installationDate).toLocaleString("vi-VN")}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 bg-white">
                    <p className="text-xs uppercase text-gray-500">Ghi chú</p>
                    <p className="text-sm text-gray-700">
                      {home.installationNotes || home.adminNotes || "—"}
                    </p>
                  </div>
                </div>

                {home.tags && home.tags.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs uppercase text-gray-500 mb-1">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {home.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Phòng & Thiết bị
                  </h2>
                </div>

                {rooms.length === 0 ? (
                  <div className="text-gray-500 text-sm">
                    Chưa có phòng nào trong ngôi nhà này.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rooms.map((room) => {
                      const devices = devicesByRoom[room.id] || [];
                      return (
                        <div
                          key={room.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <DoorOpen className="w-4 h-4 text-indigo-600" />
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {room.name}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">
                                  {(room.type || "").replace("_", " ")}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm text-gray-500">
                              {devices.length} thiết bị
                            </span>
                          </div>

                          {devices.length > 0 && (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {devices.map((device) => {
                                const devType = (device.type || device.DeviceType || "").toString().toLowerCase();
                                const isLed = devType.includes("led");
                                const isServo = devType.includes("servo");
                                const isOnline = ((device.status || device.CurrentState) || "").toString().toLowerCase() === "online";
                                return (
                                  <div
                                    key={device.id || device.DeviceId || device.Name}
                                    className="p-3 border rounded-md bg-gray-50 flex items-center justify-between"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <Cpu className="w-5 h-5 text-emerald-600" />
                                      <div>
                                        <button
                                          onClick={() =>
                                            router.push(`/devices/${device.id || device.DeviceId}`)
                                          }
                                          className="text-sm font-semibold text-gray-900 hover:underline"
                                        >
                                          {device.name || device.Name || "Unknown Device"}
                                        </button>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          {(device.type || device.DeviceType || "").toString().replace("_", " ")}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end space-y-2">
                                      <span className={`text-xs px-2 py-1 rounded-full ${isOnline ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                                        {summarizeState(device.status ?? device.CurrentState ?? device.CurrentState)}
                                      </span>
                                      <div className="flex items-center space-x-2">
                                        {isLed && (
                                          <button
                                            onClick={async () => {
                                              try {
                                                const id = Number(device.DeviceId || device.id);
                                                await apiService.controlDevice(id, { Action: "TOGGLE", Value: "1" });
                                                alert("Command sent");
                                              } catch (e) {
                                                console.error("Control error", e);
                                                alert("Failed to send command");
                                              }
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                          >
                                            <Power className="w-4 h-4" />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => router.push(`/devices/${device.id || device.DeviceId}`)}
                                          className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                          Details
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Tổng quan nhanh
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-100 p-3 bg-gray-50">
                    <p className="text-xs uppercase text-gray-500">Automations</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {home.activeAutomations ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3 bg-gray-50">
                    <p className="text-xs uppercase text-gray-500">Face Profiles</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {home.faceProfiles ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Điều hướng nhanh
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push(`/user-dashboard?homeId=${home.id}`)}
                    className="w-full inline-flex items-center justify-between px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-sm font-medium text-gray-800"
                  >
                    Mở Dashboard ngôi nhà
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                  <button
                    onClick={() => router.push("/homes")}
                    className="w-full inline-flex items-center justify-between px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-sm font-medium text-gray-800"
                  >
                    Danh sách tất cả Home
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </ServiceGuard>
    </ProtectedRoute>
  );
}

function parseErrorMessage(message: string) {
  if (message.toLowerCase().includes("<html")) {
    return "Không truy cập được Home profile (backend 403 hoặc app đang dừng). Vui lòng kiểm tra backend.";
  }
  return message;
}

