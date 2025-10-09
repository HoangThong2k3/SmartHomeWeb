"use client"; // Cần thiết cho components sử dụng React hooks

import Link from "next/link";
import { Home, Settings, Users, Cpu } from "lucide-react";

// Danh sách menu điều hướng
const menuItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Devices", href: "/devices", icon: Cpu },
  { name: "Users", href: "/users", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-white shadow-lg h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">🏠 SmartHome Admin</h1>
        <p className="text-sm text-gray-500">Management System</p>
      </div>

      {/* Menu Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
