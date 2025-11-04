"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  Users,
  Settings,
  Bell,
  Search,
  Plus,
  Thermometer,
  Droplets,
  Sun,
  Zap,
} from "lucide-react";
import { Home as HomeType } from "@/types";
import UserLayout from "@/components/layout/UserLayout";
import Layout from "@/components/layout/Layout";
import Card from "@/components/ui/Card";

export default function UserDashboard() {
  const { user } = useAuth();
  const [homes, setHomes] = useState<HomeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading user's homes
    setTimeout(() => {
      setHomes([
        {
          id: "1",
          name: "My Smart Home",
          address: "123 Main Street",
          ownerId: user?.id || "1",
          securityStatus: "ARMED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, [user]);

  // Use Layout with Sidebar for admin, UserLayout for regular users
  const DashboardContent = ({ showHeader = false }: { showHeader?: boolean }) => (
    <>
      {/* Header - only show for UserLayout */}
      {showHeader && (
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              </div>

              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <Search className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                </button>

                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{user?.email}</p>
                    <p className="text-gray-500 capitalize">{user?.role || "Customer"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className={showHeader ? "px-4 sm:px-6 lg:px-8 py-8" : ""}>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || "User"}!
          </h1>
          <p className="text-gray-600">
            Here's your smart home overview and quick controls.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card title="Homes" value={homes.length} icon={<Home className="h-6 w-6" />} color="blue" />
          <Card title="Active Devices" value="12" icon={<Zap className="h-6 w-6" />} color="green" />
          <Card title="Temperature" value="72°F" icon={<Thermometer className="h-6 w-6" />} color="orange" />
          <Card title="Humidity" value="45%" icon={<Droplets className="h-6 w-6" />} color="purple" />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Homes */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    My Smart Homes
                  </h2>
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Home
                  </button>
                </div>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading your homes...</p>
                  </div>
                ) : homes.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No homes yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Get started by creating your first smart home.
                    </p>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Home
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {homes.map((home) => (
                      <div
                        key={home.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {home.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {home.address}
                            </p>
                            <div className="flex items-center mt-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  home.securityStatus === "ARMED"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {home.securityStatus}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              Last updated
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(home.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Weather */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Quick Actions
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <Zap className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">
                        Control Devices
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">12 active</span>
                  </button>

                  <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <Settings className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">
                        Automations
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">5 rules</span>
                  </button>

                  <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 text-yellow-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">
                        Notifications
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">3 new</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Weather Widget */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 rounded-lg shadow-lg text-white animate-pulse-weather">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium tracking-wide">Weather</h3>
                  <Sun className="h-8 w-8 animate-spin-slow text-yellow-300 shadow-lg" />
                </div>
                <div className="text-center">
                  <div className="text-5xl font-extrabold mb-2 drop-shadow-xl">81°F</div>
                  <div className="text-blue-100 mb-4 text-lg italic animate-fade">Mostly sunny</div>
                  <div className="text-md text-blue-200">
                    <p>Humidity: 45%</p>
                    <p>Wind: 8 mph</p>
                  </div>
                </div>
              </div>
              {/* Hiệu ứng kiểu mây chuyển động nền */}
              <div className="absolute -top-8 -right-16 w-32 h-20 bg-white bg-opacity-10 rounded-full blur-2xl animate-cloud1"></div>
              <div className="absolute -bottom-8 left-10 w-40 h-16 bg-white bg-opacity-10 rounded-full blur-2xl animate-cloud2"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Use Layout with Sidebar for admin, UserLayout for regular users
  if (user?.role === "admin") {
    return (
      <Layout>
        <DashboardContent showHeader={false} />
      </Layout>
    );
  }

  return (
    <UserLayout>
      <DashboardContent showHeader={true} />
    </UserLayout>
  );
}
