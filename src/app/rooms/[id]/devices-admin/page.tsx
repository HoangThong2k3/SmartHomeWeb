 "use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ServiceGuard } from "@/components/auth/ServiceGuard";
import { apiService } from "@/services/api";
import ToastContainer from "@/components/ui/ToastContainer";
import { Edit, Save, X } from "lucide-react";

export default function RoomDevicesAdminPage() {
  const params = useParams() as { id?: string };
  const roomId = params?.id || "";
  const router = useRouter();

  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map deviceId -> boolean
  const [accessMap, setAccessMap] = useState<Record<number, boolean>>({});

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  const storageKey = `room:${roomId}:deviceAccess`;

  useEffect(() => {
    fetchData();
  }, [roomId]);

  const fetchData = async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      const list = await apiService.getDevicesByRoom(Number(roomId));
      setDevices(list);

      // Initialize access map from localStorage or defaults (all true)
      const raw = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      let saved: Record<number, boolean> | null = null;
      if (raw) {
        try {
          saved = JSON.parse(raw);
        } catch {}
      }

      const initial: Record<number, boolean> = {};
      for (const d of list) {
        const id = Number(d?.DeviceId ?? 0);
        if (saved && typeof saved[id] === "boolean") {
          initial[id] = saved[id];
        } else {
          // default: checked (true)
          initial[id] = true;
        }
      }
      setAccessMap(initial);
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(initial));
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const isRelayDevice = (d: any) => {
    const name = (d?.Name || d?.name || "").toString().toUpperCase();
    const type = (d?.DeviceType || d?.deviceType || "").toString().toUpperCase();
    return type === "RELAY" || name.includes("RELAY");
  };

  const toggleAccess = (deviceId: number) => {
    const current = !!accessMap[deviceId];
    const next = { ...accessMap, [deviceId]: !current };
    setAccessMap(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(next));
      // show toast
      (window as any).__sm_toast &&
        (window as any).__sm_toast({
          message: `Access for device ${deviceId} set to ${next[deviceId] ? "ENABLED" : "DISABLED"}`,
        });
    }
  };

  const startEdit = (d: any) => {
    const id = Number(d?.DeviceId ?? 0);
    setEditingId(id);
    setEditingValue(d?.Name ?? d?.name ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const saveName = async (deviceId: number) => {
    try {
      await apiService.updateDevice(deviceId, { Name: editingValue } as any);
      (window as any).__sm_toast &&
        (window as any).__sm_toast({ message: `Device ${deviceId} name updated.` });
      setEditingId(null);
      setEditingValue("");
      // update local state
      setDevices((prev) => prev.map((p) => (Number(p.DeviceId ?? 0) === deviceId ? { ...p, Name: editingValue } : p)));
    } catch (err: any) {
      (window as any).__sm_toast &&
        (window as any).__sm_toast({ message: `Failed to update device: ${err?.message || err}` });
    }
  };

  return (
    <ProtectedRoute>
      <ServiceGuard>
        <Layout>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Room Devices — Admin</h1>
              <p className="text-sm text-gray-600 mt-1">Quản lý quyền truy cập thiết bị cho Room #{roomId}</p>
            </div>
            <div>
              <button
                onClick={() => router.back()}
                className="px-3 py-2 bg-gray-100 rounded-md text-sm"
              >
                Back
              </button>
            </div>
          </div>

          {error && <div className="mb-4 text-red-600">{error}</div>}

          <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">DeviceId</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">DeviceType</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">HardwareIdentifier</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">IsActive</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td>
                  </tr>
                ) : devices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No devices found for this room.</td>
                  </tr>
                ) : (
                  devices.map((d) => {
                    const id = Number(d?.DeviceId ?? 0);
                    const name = d?.Name ?? d?.name ?? "";
                    const type = d?.DeviceType ?? d?.deviceType ?? "";
                    const hw = d?.HardwareIdentifier ?? d?.hardwareIdentifier ?? d?.NodeIdentifier ?? "-";
                    const isRelay = isRelayDevice(d);
                    const checked = !!accessMap[id];
                    return (
                      <tr key={id}>
                        <td className="px-4 py-3 text-sm text-gray-700">{id}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {editingId === id ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="border px-2 py-1 rounded-md"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveName(id);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                              />
                              <button onClick={() => saveName(id)} className="text-green-600"><Save className="w-4 h-4" /></button>
                              <button onClick={cancelEdit} className="text-gray-500"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>{name || <span className="text-gray-400">Unnamed</span>}</div>
                              <button onClick={() => startEdit(d)} className="text-blue-600"><Edit className="w-4 h-4" /></button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{type}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{hw || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <label className="inline-flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!isRelay}
                              onChange={() => toggleAccess(id)}
                              className={`h-4 w-4 ${isRelay ? "cursor-pointer" : "cursor-not-allowed"}`}
                            />
                            <span className="text-sm text-gray-600">{isRelay ? "Can toggle" : "Fixed"}</span>
                          </label>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <ToastContainer />
        </Layout>
      </ServiceGuard>
    </ProtectedRoute>
  );
}


