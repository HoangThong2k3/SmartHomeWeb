 "use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ServiceGuard } from "@/components/auth/ServiceGuard";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { Device, Room } from "@/types";
import { DoorOpen } from "lucide-react";

function getDeviceIcon(type: string) {
  const t = (type || "").toString().toUpperCase().replace("_", "");
  switch (t) {
    case "SERVO":
      return "⚙️";
    case "LED":
      return "💡";
    case "BUZZER":
      return "🔊";
    case "PIR":
      return "📡";
    case "DHT":
      return "🌡️";
    case "MQ2":
      return "💨";
    case "MQ135":
      return "🌬️";
    default:
      return "🔧";
  }
}

function formatDeviceTypeForDisplay(type: string): string {
  if (!type) return "Unknown";
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function summarizeState(raw: any) {
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
    return s.length > 120 ? s.slice(0, 116) + "..." : s;
  }
  return String(s);
}

export default function DeviceDetailsPage() {
  const params = useParams() as { id?: string };
  const deviceIdParam = params?.id;
  const { user } = useAuth();
  const deviceOwnerRole = (user?.role || "").toLowerCase();

  const [device, setDevice] = useState<Device | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Control UI state
  const [controlPayload, setControlPayload] = useState<string>('{"Value":"ON"}');
  const [controlLoading, setControlLoading] = useState(false);
  const [controlResult, setControlResult] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!deviceIdParam) {
        if (mounted) {
          setError("Device ID not provided");
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const idNum = Number(deviceIdParam);
        if (!Number.isFinite(idNum) || idNum <= 0) {
          throw new Error("Invalid device id");
        }
        const fetched = await apiService.getDeviceById(idNum);
        if (mounted) {
          setDevice(fetched);
          // Try to resolve room name if available in device payload
          const rName =
            (fetched as any).RoomName ||
            (fetched as any).roomName ||
            (fetched as any).Room ||
            null;
          setRoomName(rName);
        }
      } catch (err: any) {
        console.error("[DeviceDetails] Error loading device:", err);
        if (mounted) {
          const msg = err?.message || "Could not load device";
          setError(msg);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [deviceIdParam]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="max-w-3xl mx-auto py-12">
            <Link href="/devices" className="text-blue-600 underline">
              ← Back to devices
            </Link>
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!device) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="max-w-3xl mx-auto py-12 text-center">
            <Link href="/devices" className="text-blue-600 underline">
              ← Back to devices
            </Link>
            <h2 className="text-2xl font-semibold mt-6">Device not found</h2>
            <p className="text-gray-500 mt-2">The requested device does not exist.</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ServiceGuard>
        <Layout>
          <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Link href="/devices" className="text-blue-600 hover:underline text-sm">
                  ← Back to devices
                </Link>
                <div className="flex items-center mt-4 gap-4">
                  <div className="text-4xl mr-2">{getDeviceIcon(device.DeviceType)}</div>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">{device.Name || "Unnamed Device"}</h1>
                    <div className="flex items-center text-sm text-gray-500 mt-2 gap-2">
                      <span className="inline-flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-md">
                        <DoorOpen className="w-4 h-4" />
                        <span>{roomName ? roomName : `Room #${device.RoomId ?? "?"}`}</span>
                      </span>
                      <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {formatDeviceTypeForDisplay(device.DeviceType)}
                      </span>
                      <span className="inline-block bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-full">
                        ID: {device.DeviceId ?? device.DeviceId}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Role: <span className="font-medium text-gray-700">{user?.role || "guest"}</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-3">Current state</h3>
                <div className="text-base text-gray-700 mb-4 min-h-[56px]">
                  {device.CurrentState ? (
                    <div className="whitespace-pre-wrap">{summarizeState(device.CurrentState)}</div>
                  ) : (
                    <div className="text-gray-500">No state data available</div>
                  )}
                </div>

                <h3 className="text-lg font-semibold mt-6 mb-2">Raw payload</h3>
                <div className="rounded-md border border-gray-100 bg-gray-50 p-2">
                  <pre className="text-xs text-gray-800 overflow-auto max-h-80 whitespace-pre-wrap">
{JSON.stringify(device, null, 2)}
                  </pre>
                </div>
              </div>

              <aside className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-3">Quick actions</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Simple controls</div>
                    <div className="flex gap-3">
                      <button
                        onClick={async () => {
                          try {
                            setControlLoading(true);
                            setControlResult(null);
                            await apiService.controlDevice(Number(device.DeviceId), { Value: "ON" } as any);
                            setControlResult("Sent ON command");
                          } catch (err: any) {
                            setControlResult(`Error: ${err?.message || err}`);
                          } finally {
                            setControlLoading(false);
                          }
                        }}
                        disabled={controlLoading || deviceOwnerRole === "admin"}
                        className={`px-4 py-2 rounded-md text-white font-medium ${controlLoading ? "bg-gray-300" : "bg-green-600 hover:bg-green-700"}`}
                      >
                        ON
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            setControlLoading(true);
                            setControlResult(null);
                            await apiService.controlDevice(Number(device.DeviceId), { Value: "OFF" } as any);
                            setControlResult("Sent OFF command");
                          } catch (err: any) {
                            setControlResult(`Error: ${err?.message || err}`);
                          } finally {
                            setControlLoading(false);
                          }
                        }}
                        disabled={controlLoading || deviceOwnerRole === "admin"}
                        className={`px-4 py-2 rounded-md text-white font-medium ${controlLoading ? "bg-gray-300" : "bg-red-600 hover:bg-red-700"}`}
                      >
                        OFF
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Controls are disabled for admin users (customer-only).
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-2">Send raw control payload</div>
                    <textarea
                      value={controlPayload}
                      onChange={(e) => setControlPayload(e.target.value)}
                      className="w-full border border-gray-200 rounded-md p-2 text-xs font-mono h-28"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-500">Send arbitrary JSON to device control endpoint.</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            try {
                              setControlLoading(true);
                              setControlResult(null);
                              const parsed = JSON.parse(controlPayload);
                              await apiService.controlDevice(Number(device.DeviceId), parsed as any);
                              setControlResult("Payload sent successfully");
                            } catch (err: any) {
                              setControlResult(`Error: ${err?.message || err}`);
                            } finally {
                              setControlLoading(false);
                            }
                          }}
                          disabled={controlLoading || deviceOwnerRole === "admin"}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                    {controlResult && <div className="mt-2 text-sm text-gray-700">{controlResult}</div>}
                  </div>

                  <Link href={`/devices/${device.DeviceId}/edit`} className="block text-sm text-blue-600 hover:underline">
                    Configure device
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </Layout>
      </ServiceGuard>
    </ProtectedRoute>
  );
}


