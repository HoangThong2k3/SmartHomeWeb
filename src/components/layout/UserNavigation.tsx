"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Settings,
  Bell,
  Search,
  Zap,
  Thermometer,
  Droplets,
  RefreshCw,
} from "lucide-react";

const UserNavigation = () => {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/user-dashboard", icon: Home },
    { name: "My Homes", href: "/homes", icon: Home },
    { name: "Rooms", href: "/rooms", icon: Users },
    { name: "Devices", href: "/devices", icon: Zap },
    { name: "Automations", href: "/automations", icon: Settings },
    { name: "Sensor Data", href: "/sensor-data", icon: Thermometer },
    { name: "Quản lý Dịch vụ", href: "/service-management", icon: RefreshCw },
    { name: "System Health", href: "/health", icon: Droplets },
  ];

  return (
    <nav className="bg-white shadow-sm border-r">
      <div className="px-4 py-6">
        <Link href="/user-dashboard" className="block" prefetch={false}>
          <h1 className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">SmartHome</h1>
        </Link>
      </div>

      <div className="px-4 pb-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default UserNavigation;
