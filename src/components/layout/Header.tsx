"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, User, Search, LogOut, Settings, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    router.push("/login");
  };

  const handleSettings = () => {
    router.push("/settings");
    setShowUserMenu(false);
  };

  return (
    <header className="bg-[color:var(--surface)] shadow-sm border-b border-gray-100">
      <div className="flex items-center justify-between p-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search devices, users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] bg-transparent text-[color:var(--foreground)]"
            />
          </div>
        </div>

        {/* User Info & Notifications */}
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-[color:var(--muted)] hover:text-[color:var(--foreground)]">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[color:var(--danger)] rounded-full"></span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[color:var(--glass)] transition"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-[color:var(--foreground)]">{user?.email || user?.name}</div>
                <div className="text-xs text-[color:var(--muted)]">
                  {user?.role === "admin" ? "Admin" : "Customer"}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <button
                  onClick={handleSettings}
                  className="flex items-center w-full px-4 py-2 text-sm text-[color:var(--foreground)] hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-[color:var(--foreground)] hover:bg-gray-50"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
