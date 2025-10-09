"use client";

import Layout from "@/components/layout/Layout";
import Card from "@/components/ui/Card";
import { Cpu, Users, Activity, Zap } from "lucide-react";

export default function Dashboard() {
  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to SmartHome Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card
          title="Total Devices"
          value="12"
          subtitle="3 online"
          icon={<Cpu className="w-6 h-6" />}
          color="blue"
        />
        <Card
          title="Active Users"
          value="8"
          subtitle="2 new today"
          icon={<Users className="w-6 h-6" />}
          color="green"
        />
        <Card
          title="Energy Usage"
          value="2.4 kW"
          subtitle="-5% from yesterday"
          icon={<Zap className="w-6 h-6" />}
          color="orange"
        />
        <Card
          title="System Status"
          value="Normal"
          subtitle="All systems operational"
          icon={<Activity className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">Living Room Light</p>
              <p className="text-sm text-gray-500">Turned on • 5 minutes ago</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
              ON
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">Front Door Sensor</p>
              <p className="text-sm text-gray-500">
                Door opened • 15 minutes ago
              </p>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              TRIGGERED
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
