"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { Device, Room, Home } from "@/types";
import HomeSelector from "@/components/ui/HomeSelector";
import {
  Cpu,
  Plus,
  Edit,
  Trash2,
  DoorOpen,
  Power,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function DevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("[DevicesPage] Fetching data for user:", user?.id);

      // Fetch homes first
      let userHomes: Home[] = [];
      if (user?.id) {
        userHomes = await apiService.getHomesByOwner(user.id);
      } else {
        console.warn("[DevicesPage] No user ID available. Cannot fetch homes.");
        userHomes = [];
      }
      console.log("[DevicesPage] Found homes:", userHomes.length);
      setHomes(userHomes);

      // Fetch all rooms from homes
      const allRooms: Room[] = [];
      for (const home of userHomes) {
        try {
          const homeRooms = await apiService.getRoomsByHome(home.id);
          allRooms.push(...homeRooms);
          console.log(
            `[DevicesPage] Found ${homeRooms.length} rooms for home ${home.id}`
          );
        } catch (err: any) {
          console.error(
            `[DevicesPage] Could not fetch rooms for home ${home.id}:`,
            err?.message || err
          );
        }
      }
      setRooms(allRooms);
      console.log("[DevicesPage] Total rooms:", allRooms.length);

      // Fetch devices for each room
      const allDevices: Device[] = [];
      for (const room of allRooms) {
        try {
          const roomDevices = await apiService.getDevicesByRoom(room.id);
          allDevices.push(...roomDevices);
          console.log(
            `[DevicesPage] Found ${roomDevices.length} devices for room ${room.id}`
          );
        } catch (err: any) {
          console.error(
            `[DevicesPage] Could not fetch devices for room ${room.id}:`,
            err?.message || err
          );
        }
      }
      setDevices(allDevices);
      console.log("[DevicesPage] Total devices:", allDevices.length);
    } catch (err: any) {
      const errorMsg =
        err?.message || err?.detail || err?.error || "Failed to load devices";
      console.error("[DevicesPage] Error fetching data:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDevice = async (deviceData: any) => {
    try {
      setError(null);
      console.log("[DevicesPage] Creating device with data:", deviceData);
      console.log(
        "[DevicesPage] Available rooms:",
        rooms.map((r) => ({ id: r.id, name: r.name, homeId: r.homeId }))
      );

      // Validate bắt buộc
      if (!deviceData.roomId) throw new Error("Room is required (roomId)");
      if (!deviceData.name) throw new Error("Name is required");
      if (!deviceData.deviceType) throw new Error("Device type is required");

      // Validate roomId exists in rooms list
      const selectedRoom = rooms.find((r) => r.id === deviceData.roomId);
      if (!selectedRoom) {
        console.error(
          "[DevicesPage] Selected roomId not found in rooms list:",
          deviceData.roomId
        );
        throw new Error(
          `Invalid room selected. Room ID ${deviceData.roomId} not found.`
        );
      }
      console.log("[DevicesPage] Selected room:", selectedRoom);

      // Gán đúng schema BE
      const payload = {
        roomId: deviceData.roomId, // Keep as string, apiService will convert to number
        name: deviceData.name,
        deviceType: (deviceData.deviceType || "").toUpperCase(),
        currentState: deviceData.currentState
          ? deviceData.currentState
          : undefined,
      };
      console.log("[DevicesPage] Device payload:", payload);
      console.log(
        "[DevicesPage] RoomId type:",
        typeof payload.roomId,
        "value:",
        payload.roomId
      );

      const newDevice = await apiService.createDevice(payload);
      console.log("[DevicesPage] Device created successfully:", newDevice);
      setDevices([...devices, newDevice]);
      setShowCreateForm(false);
      fetchData(); // refresh
    } catch (err: any) {
      const errorMsg =
        err?.message || err?.detail || err?.error || "Failed to create device";
      console.error("[DevicesPage] Error creating device:", errorMsg, err);
      setError(errorMsg);
    }
  };

  const handleUpdateDevice = async (id: string, deviceData: any) => {
    try {
      setError(null);
      console.log("[DevicesPage] Updating device:", id, deviceData);
      console.log(
        "[DevicesPage] Available rooms:",
        rooms.map((r) => ({ id: r.id, name: r.name, homeId: r.homeId }))
      );

      if (!id || id === "Unknown") {
        const errorMsg = "Invalid Device ID. Cannot update.";
        setError(errorMsg);
        return;
      }
      if (!deviceData.name || !deviceData.deviceType || !deviceData.roomId) {
        const errorMsg = "Name, DeviceType, RoomId bắt buộc";
        setError(errorMsg);
        return;
      }

      // Validate roomId exists in rooms list
      const selectedRoom = rooms.find((r) => r.id === deviceData.roomId);
      if (!selectedRoom) {
        console.error(
          "[DevicesPage] Selected roomId not found in rooms list:",
          deviceData.roomId
        );
        throw new Error(
          `Invalid room selected. Room ID ${deviceData.roomId} not found.`
        );
      }
      console.log("[DevicesPage] Selected room:", selectedRoom);

      const payload = {
        name: deviceData.name,
        deviceType: (deviceData.deviceType || "").toUpperCase(),
        roomId: deviceData.roomId, // Keep as string, apiService will convert to number
        currentState: deviceData.currentState ?? undefined,
      };
      console.log("[DevicesPage] Update payload:", payload);
      console.log(
        "[DevicesPage] RoomId type:",
        typeof payload.roomId,
        "value:",
        payload.roomId
      );

      await apiService.updateDevice(id, payload);
      console.log("[DevicesPage] Device updated successfully");
      fetchData(); // Chỉnh về fetch lại data chuẩn
      setEditingDevice(null);
    } catch (err: any) {
      const errorMsg =
        err?.message || err?.detail || err?.error || "Failed to update device";
      console.error("[DevicesPage] Error updating device:", errorMsg, err);
      setError(errorMsg);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this device?")) return;
    try {
      setError(null);
      console.log("[DevicesPage] Deleting device:", id);

      if (!id || id === "Unknown") {
        const errorMsg = "Invalid Device ID. Cannot delete.";
        setError(errorMsg);
        return;
      }
      await apiService.deleteDevice(id);
      console.log("[DevicesPage] Device deleted successfully");
      fetchData();
    } catch (err: any) {
      const errorMsg =
        err?.message || err?.detail || err?.error || "Failed to delete device";
      console.error("[DevicesPage] Error deleting device:", errorMsg, err);
      setError(errorMsg);
    }
  };

  const getRoomName = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    return room?.name || "Unknown Room";
  };

  const getDeviceIcon = (type: string) => {
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
  };

  const formatDeviceTypeForDisplay = (type: string): string => {
    if (!type) return "Unknown";
    // Convert to readable format: "door_lock" -> "Door Lock", "LIGHT" -> "Light"
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

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

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Devices</h1>
              <p className="text-gray-600 mt-2">
                Manage your smart home devices
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {devices.length === 0 ? (
          <div className="text-center py-12">
            <Cpu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No devices found
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by adding your first smart device.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Device
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <div
                key={device.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">
                        {getDeviceIcon(
                          device.type || (device as any).deviceType || ""
                        )}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {device.name}
                      </h3>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <DoorOpen className="w-4 h-4 mr-1" />
                      {getRoomName(device.roomId)}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {formatDeviceTypeForDisplay(
                          device.type || (device as any).deviceType || ""
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingDevice(device)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreateForm && (
          <CreateDeviceForm
            rooms={rooms}
            homes={homes}
            onSubmit={handleCreateDevice}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {editingDevice && (
          <EditDeviceForm
            device={editingDevice}
            rooms={rooms}
            homes={homes}
            onSubmit={(data) => handleUpdateDevice(editingDevice.id, data)}
            onCancel={() => setEditingDevice(null)}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
}

function CreateDeviceForm({
  rooms,
  homes,
  onSubmit,
  onCancel,
}: {
  rooms: Room[];
  homes: Home[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    deviceType: "LED",
    roomId: "",
    homeId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // always send as UPPERCASE
    onSubmit({
      ...formData,
      deviceType: (formData.deviceType || "").toUpperCase(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Device</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <HomeSelector
            homes={homes}
            value={formData.homeId}
            onChange={(homeId) =>
              setFormData({ ...formData, homeId, roomId: "" })
            }
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room
            </label>
            <select
              value={formData.roomId}
              onChange={(e) =>
                setFormData({ ...formData, roomId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!formData.homeId}
            >
              <option value="">Select a room</option>
              {rooms
                .filter((room) => room.homeId === formData.homeId)
                .map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.type})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Type
            </label>
            <select
              value={formData.deviceType}
              onChange={(e) =>
                setFormData({ ...formData, deviceType: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SERVO">Servo</option>
              <option value="LED">LED</option>
              <option value="BUZZER">Buzzer</option>
              <option value="PIR">PIR</option>
              <option value="DHT">DHT</option>
              <option value="MQ2">MQ2</option>
              <option value="MQ135">MQ135</option>
            </select>
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditDeviceForm({
  device,
  rooms,
  homes,
  onSubmit,
  onCancel,
}: {
  device: Device;
  rooms: Room[];
  homes: Home[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  // Convert device.type (lowercase) to deviceType (uppercase) for dropdown
  const convertTypeToDeviceType = (type: string): string => {
    if (!type) return "LED";
    // If already uppercase, return as is
    if (type === type.toUpperCase()) return type;
    // Convert lowercase to uppercase (e.g., "led" -> "LED")
    return type.toUpperCase();
  };

  // Find homeId from device's roomId
  const findHomeIdFromRoom = (roomId: string): string => {
    const room = rooms.find((r) => r.id === roomId);
    return room?.homeId || (device as any).homeId || "";
  };

  const [formData, setFormData] = useState({
    name: device.name,
    deviceType:
      (device as any).deviceType || convertTypeToDeviceType(device.type),
    roomId: device.roomId,
    homeId: findHomeIdFromRoom(device.roomId),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Device</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <HomeSelector
            homes={homes}
            value={formData.homeId}
            onChange={(homeId) =>
              setFormData({ ...formData, homeId, roomId: "" })
            }
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room
            </label>
            <select
              value={formData.roomId}
              onChange={(e) =>
                setFormData({ ...formData, roomId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!formData.homeId}
            >
              {rooms
                .filter((room) => room.homeId === formData.homeId)
                .map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.type})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Type
            </label>
            <select
              value={formData.deviceType}
              onChange={(e) =>
                setFormData({ ...formData, deviceType: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SERVO">Servo</option>
              <option value="LED">LED</option>
              <option value="BUZZER">Buzzer</option>
              <option value="PIR">PIR</option>
              <option value="DHT">DHT</option>
              <option value="MQ2">MQ2</option>
              <option value="MQ135">MQ135</option>
            </select>
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Update
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
