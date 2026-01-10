"use client";

import React from "react";
import { ActionType } from "@/types";
import { Lightbulb, Thermometer, Lock, Zap, Eye, EyeOff } from "lucide-react";

interface ActionTypeSelectorProps {
  value: string;
  onChange: (actionType: ActionType) => void;
  deviceType?: string;
  required?: boolean;
}

const actionTypeOptions: { value: ActionType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "TURN_ON",
    label: "Turn On",
    icon: <Zap className="w-4 h-4 text-green-600" />,
    description: "Turn device on"
  },
  {
    value: "TURN_OFF",
    label: "Turn Off",
    icon: <EyeOff className="w-4 h-4 text-gray-600" />,
    description: "Turn device off"
  },
  {
    value: "SET_BRIGHTNESS",
    label: "Set Brightness",
    icon: <Lightbulb className="w-4 h-4 text-yellow-600" />,
    description: "Set brightness level (0-100)"
  },
  {
    value: "SET_TEMPERATURE",
    label: "Set Temperature",
    icon: <Thermometer className="w-4 h-4 text-red-600" />,
    description: "Set target temperature"
  },
  {
    value: "SET_HUMIDITY",
    label: "Set Humidity",
    icon: <Eye className="w-4 h-4 text-blue-600" />,
    description: "Set target humidity"
  },
  {
    value: "LOCK",
    label: "Lock",
    icon: <Lock className="w-4 h-4 text-red-600" />,
    description: "Lock device/door"
  },
  {
    value: "UNLOCK",
    label: "Unlock",
    icon: <Lock className="w-4 h-4 text-green-600" />,
    description: "Unlock device/door"
  },
  {
    value: "ACTIVATE",
    label: "Activate",
    icon: <Zap className="w-4 h-4 text-purple-600" />,
    description: "Activate device"
  },
  {
    value: "DEACTIVATE",
    label: "Deactivate",
    icon: <EyeOff className="w-4 h-4 text-gray-600" />,
    description: "Deactivate device"
  }
];

export default function ActionTypeSelector({
  value,
  onChange,
  deviceType,
  required = false
}: ActionTypeSelectorProps) {
  // Filter action types based on device type if needed
  const getFilteredOptions = () => {
    if (!deviceType) return actionTypeOptions;

    const deviceTypeUpper = deviceType.toUpperCase();

    // Filter actions based on device type
    switch (deviceTypeUpper) {
      case "LED":
      case "SERVO":
        return actionTypeOptions.filter(option =>
          ["TURN_ON", "TURN_OFF", "SET_BRIGHTNESS", "ACTIVATE", "DEACTIVATE"].includes(option.value)
        );
      case "DHT":
        return actionTypeOptions.filter(option =>
          ["TURN_ON", "TURN_OFF", "SET_TEMPERATURE", "SET_HUMIDITY", "ACTIVATE", "DEACTIVATE"].includes(option.value)
        );
      case "PIR":
      case "MQ2":
      case "MQ135":
        return actionTypeOptions.filter(option =>
          ["TURN_ON", "TURN_OFF", "ACTIVATE", "DEACTIVATE"].includes(option.value)
        );
      case "BUZZER":
        return actionTypeOptions.filter(option =>
          ["TURN_ON", "TURN_OFF", "ACTIVATE", "DEACTIVATE"].includes(option.value)
        );
      default:
        return actionTypeOptions;
    }
  };

  const options = getFilteredOptions();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Action Type <span className="text-red-500">*</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ActionType)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
      >
        <option value="">Select action type</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {value && (
        <div className="mt-1 flex items-center text-sm text-gray-600">
          {options.find(opt => opt.value === value)?.icon}
          <span className="ml-2">
            {options.find(opt => opt.value === value)?.description}
          </span>
        </div>
      )}
    </div>
  );
}

export { actionTypeOptions };
