"use client";

import { useState, useEffect } from "react";

export function useTimezone() {
  const [userTimezone, setUserTimezone] = useState<string>("");
  const [userOffset, setUserOffset] = useState<number>(0);

  useEffect(() => {
    // Get user's timezone on client side
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();
    setUserTimezone(tz);
    setUserOffset(offset);
  }, []);

  // Convert local datetime-local value to UTC ISO string
  const toUTC = (localDateTime: string): string => {
    if (!localDateTime) return "";
    try {
      // datetime-local input gives us local time, create Date object
      const localDate = new Date(localDateTime);
      // Convert to UTC ISO string
      return localDate.toISOString();
    } catch {
      return "";
    }
  };

  // Convert UTC ISO string to local datetime-local value
  const fromUTC = (utcString: string): string => {
    if (!utcString) return "";
    try {
      const date = new Date(utcString);
      // Format for datetime-local input (YYYY-MM-DDTHH:mm)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return "";
    }
  };

  // Format UTC timestamp for display in user's timezone
  const formatForDisplay = (utcString: string): string => {
    if (!utcString) return "N/A";
    try {
      const date = new Date(utcString);
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Get current time in datetime-local format
  const getCurrentLocalTime = (): string => {
    const now = new Date();
    return fromUTC(now.toISOString());
  };

  return {
    userTimezone,
    userOffset,
    toUTC,
    fromUTC,
    formatForDisplay,
    getCurrentLocalTime,
  };
}
