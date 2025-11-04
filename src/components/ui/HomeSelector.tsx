"use client";

import React from "react";
import { Home } from "@/types";

interface HomeSelectorProps {
  homes: Home[];
  value: string;
  onChange: (homeId: string) => void;
  required?: boolean;
  placeholder?: string;
}

export default function HomeSelector({
  homes,
  value,
  onChange,
  required = false,
  placeholder = "Select a home"
}: HomeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Home
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
      >
        <option value="">{placeholder}</option>
        {homes.map((home) => (
          <option key={home.id} value={home.id}>
            {home.name} - Owner: {home.ownerId}
          </option>
        ))}
      </select>
    </div>
  );
}
