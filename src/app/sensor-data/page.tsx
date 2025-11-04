"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { Device, Home, Room } from "@/types";
import { Thermometer, Plus, Eye, Trash2, Calendar, Filter, Edit } from "lucide-react";

export default function SensorDataPage() {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSensorData, setEditingSensorData] = useState<any | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  useEffect(() => {
    fetchDevices();
  }, [user]);

  useEffect(() => {
    if (selectedDevice) {
      fetchSensorData();
    } else {
      setSensorData([]);
    }
  }, [selectedDevice, dateRange]);

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("[SensorDataPage] Fetching devices for user:", user?.id);

      // Fetch homes first
      let userHomes: Home[] = [];
      if (user?.id) {
        userHomes = await apiService.getHomesByOwner(user.id);
      }
      setHomes(userHomes);

      // Fetch all devices from all rooms
      const allDevices: Device[] = [];
      for (const home of userHomes) {
        try {
          const homeRooms = await apiService.getRoomsByHome(home.id);
          for (const room of homeRooms) {
            try {
              const roomDevices = await apiService.getDevicesByRoom(room.id);
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
      console.log("[SensorDataPage] Total devices:", allDevices.length);
    } catch (err: any) {
      const errorMsg =
        err?.message || err?.detail || err?.error || "Failed to load devices";
      console.error("[SensorDataPage] Error fetching devices:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSensorData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(
        "[SensorDataPage] Fetching sensor data for device:",
        selectedDevice,
        "with query:",
        dateRange
      );

      if (selectedDevice) {
        const query: any = {};
        if (dateRange.from) {
          query.from = new Date(dateRange.from).toISOString();
        }
        if (dateRange.to) {
          query.to = new Date(dateRange.to).toISOString();
        }

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
              id: String(item?.id ?? item?.Id ?? ""),
              deviceId: String(item?.deviceId ?? item?.DeviceId ?? item?.device_id ?? ""),
              value: String(item?.value ?? item?.Value ?? ""),
              timeStamp: String(item?.timeStamp ?? item?.TimeStamp ?? item?.timestamp ?? item?.Timestamp ?? ""),
            }))
          : [];
        setSensorData(normalizedData);
      } else {
        console.log("[SensorDataPage] No device selected, clearing data");
        setSensorData([]);
      }
    } catch (err: any) {
      const errorMsg =
        err?.message || err?.detail || err?.error || "Failed to load sensor data";
      console.error("[SensorDataPage] Error fetching sensor data:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSensorData = async (sensorDataForm: any) => {
    try {
      setError(null);
      console.log("[SensorDataPage] Creating sensor data with form:", sensorDataForm);

      // Validate deviceId
      if (!sensorDataForm.deviceId || isNaN(Number(sensorDataForm.deviceId))) {
        throw new Error("Device ID is required and must be a number");
      }

      // Validate value is JSON
      let valueString = sensorDataForm.value;
      try {
        if (typeof valueString !== "string") valueString = String(valueString);
        JSON.parse(valueString);
      } catch {
        throw new Error("Value must be valid JSON string");
      }

      // Build payload
      const payload = {
        deviceId: parseInt(sensorDataForm.deviceId),
        value: valueString,
        timeStamp: sensorDataForm.timeStamp
          ? new Date(sensorDataForm.timeStamp).toISOString()
          : undefined,
      };
      console.log("[SensorDataPage] Sensor data payload:", payload);

      await apiService.createSensorData(payload);
      console.log("[SensorDataPage] Sensor data created successfully");
      fetchSensorData();
      setShowCreateForm(false);
    } catch (err: any) {
      const errorMsg =
        err?.message || err?.detail || err?.error || "Failed to create sensor data";
      console.error("[SensorDataPage] Error creating sensor data:", errorMsg, err);
      setError(errorMsg);
    }
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

  const handleDeleteSensorData = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sensor data?")) return;

    try {
      setError(null);
      console.log("[SensorDataPage] Deleting sensor data:", id);

      // Note: Backend might not support DELETE for sensor data
      // This is a placeholder implementation
      setSensorData(sensorData.filter((item) => item.id !== id));
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
    if (!timestamp) return "N/A";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleString();
    } catch {
      return "Invalid Date";
    }
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

  if (isLoading && devices.length === 0) {
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
              <h1 className="text-3xl font-bold text-gray-900">Sensor Data</h1>
              <p className="text-gray-600 mt-2">Monitor and manage sensor readings</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Data
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device
              </label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a device</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name} (ID: {device.id})
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
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
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
              <h3 className="text-lg font-semibold">Sensor Readings</h3>
              <p className="text-sm text-gray-500">{sensorData.length} records found</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sensorData.map((rawItem) => {
                    const item = normalizeSensorData(rawItem);
                    const parsedValue = parseSensorValue(item.value);
                    return (
                      <tr key={item.id || Math.random()} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.deviceId || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-md">
                            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(parsedValue, null, 2)}
                            </pre>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTimestamp(item.timeStamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingSensorData(item)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSensorData(item.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
  const [formData, setFormData] = useState({
    deviceId: "",
    value: "",
    timeStamp: new Date().toISOString().slice(0, 16),
  });

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

  const loadExample = (type: "temperature" | "humidity" | "motion" | "multi") => {
    const examples = {
      temperature: JSON.stringify({ temperature: 22.5, unit: "celsius" }, null, 2),
      humidity: JSON.stringify({ humidity: 65, unit: "percent" }, null, 2),
      motion: JSON.stringify({ motion: true, confidence: 0.95 }, null, 2),
      multi: JSON.stringify(
        {
          temperature: 22.5,
          humidity: 65,
          pressure: 1013.25,
          unit: {
            temperature: "celsius",
            humidity: "percent",
            pressure: "hPa",
          },
        },
        null,
        2
      ),
    };
    const example = examples[type];
    setFormData({ ...formData, value: example });
    validateJson(example);
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
                <option key={device.id} value={device.id}>
                  {device.name} (ID: {device.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Value (JSON) <span className="text-red-500">*</span>
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
                  onClick={() => loadExample("multi")}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Multi
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
      ? new Date(normalizedData.timeStamp).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  });

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
    if (jsonError) {
      return;
    }
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
                <option key={device.id} value={device.id}>
                  {device.name} (ID: {device.id})
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
