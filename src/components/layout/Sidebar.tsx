"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  Settings,
  Users,
  Cpu,
  Building2,
  DoorOpen,
  Zap,
  Thermometer,
  Activity,
  CreditCard,
  Package,
  MessageSquare,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { name: "Dashboard", href: "/user-dashboard", icon: Home },
      { name: "Homes", href: "/homes", icon: Building2 },
      { name: "Rooms", href: "/rooms", icon: DoorOpen },
      { name: "Devices", href: "/devices", icon: Cpu },
      { name: "Automations", href: "/automations", icon: Zap },
      { name: "Sensor Data", href: "/sensor-data", icon: Thermometer },
      { name: "Payments", href: "/payments", icon: CreditCard },
    ];

    // Admin only items
    if (user?.role === "admin") {
      baseItems.splice(1, 0, { name: "Users", href: "/users", icon: Users });
      baseItems.splice(2, 0, { name: "Admin Payments", href: "/admin/payments", icon: CreditCard });
      baseItems.splice(3, 0, { name: "Service Packages", href: "/admin/packages", icon: Package });
      baseItems.splice(4, 0, { name: "Support Requests", href: "/admin/support-requests", icon: MessageSquare });
    }

    // Add system pages
    baseItems.push(
      { name: "System Health", href: "/health", icon: Activity },
      { name: "Settings", href: "/settings", icon: Settings }
    );

    // Removed debug links

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-white shadow-lg h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/" className="block">
          <h1 className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors cursor-pointer">🏠 SmartHome</h1>
          <p className="text-sm text-gray-500">Management System</p>
        </Link>
      </div>

      {/* Menu Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-600 border-r-2 border-blue-600"
                      : "hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {user?.name}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {user?.role}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
