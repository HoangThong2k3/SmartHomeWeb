"use client";

import React, { useEffect, useState } from "react";
import { Device } from "@/types";
import { apiService } from "@/services/api";
import { Cpu, Loader2 } from "lucide-react";

interface DeviceSelectorProps {
  homeId: string;
  value: string;
  onChange: (deviceId: string) => void;
  required?: boolean;
  placeholder?: string;
}

export default function DeviceSelector({
  homeId,
  value,
  onChange,
  required = false,
  placeholder = "Select a device"
}: DeviceSelectorProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!homeId) {
      setDevices([]);
      return;
    }

    const loadDevices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Get all rooms in the home
        const rooms = await apiService.getRoomsByHome(homeId);
        // Get devices for each room
        const allDevices: Device[] = [];
        for (const room of rooms) {
          try {
            const roomDevices = await apiService.getDevicesByRoom(Number(room.id));
            allDevices.push(...roomDevices);
          } catch (err) {
            console.warn(`Could not load devices for room ${room.id}:`, err);
          }
        }
        setDevices(allDevices);
      } catch (err: any) {
        setError(err?.message || "Failed to load devices");
        console.error("Error loading devices:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDevices();
  }, [homeId]);

  if (!homeId) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Device
        </label>
        <select
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
        >
          <option>Select a home first</option>
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Device <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={required}
          disabled={isLoading}
        >
          <option value="">{isLoading ? "Loading devices..." : placeholder}</option>
          {devices.map((device) => (
            <option key={device.DeviceId} value={device.DeviceId.toString()}>
              {device.Name} ({device.DeviceType})
            </option>
          ))}
        </select>
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      {devices.length === 0 && !isLoading && !error && (
        <p className="text-sm text-gray-500 mt-1">No devices found in this home</p>
      )}
    </div>
  );
}
