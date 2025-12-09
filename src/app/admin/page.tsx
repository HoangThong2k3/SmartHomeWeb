"use client";

import React, { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { apiService } from "@/services/api";
import {
  StatsSummary,
  RevenuePoint,
  RecentTransaction,
} from "@/types";
import {
  Users,
  Home as HomeIcon,
  Cpu,
  DollarSign,
  Activity,
  Loader2,
  BarChart,
  Wallet,
  ArrowRight,
  Calendar,
} from "lucide-react";

const Card = ({
  title,
  value,
  icon: Icon,
  accent,
  subtitle,
}: {
  title: string;
  value: React.ReactNode;
  icon: any;
  accent: string;
  subtitle?: string;
}) => (
  <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br opacity-5" style={{ backgroundImage: `linear-gradient(135deg, ${accent}, #ffffff)` }} />
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}15`, color: accent }}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
);

const RevenueBarChart = ({ data }: { data: RevenuePoint[] }) => {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 items-end h-56">
      {data.map((d) => {
        const height = `${(d.revenue / max) * 100}%`;
        return (
          <div key={d.month} className="flex flex-col items-center space-y-2">
            <div className="w-full rounded-md bg-gradient-to-t from-blue-600 to-indigo-500 transition hover:opacity-90" style={{ height }} />
            <p className="text-[11px] text-gray-500 truncate">{d.monthName || `T${d.month}`}</p>
          </div>
        );
      })}
    </div>
  );
};

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const revenueTotal = useMemo(
    () => revenue.reduce((sum, r) => sum + (r.revenue || 0), 0),
    [revenue]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [summaryRes, revenueRes, txRes] = await Promise.all([
          apiService.getStatsSummary(),
          apiService.getRevenueChart(year),
          apiService.getRecentTransactions(6),
        ]);
        setSummary(summaryRes);
        setRevenue(revenueRes);
        setTransactions(txRes);
      } catch (err: any) {
        setError(err?.message || "Không thể tải dữ liệu thống kê.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [year]);

  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold uppercase">Admin Dashboard</p>
              <h1 className="text-3xl font-bold text-gray-900">Thống kê tổng quan</h1>
              <p className="text-gray-500 mt-2">
                Theo dõi hiệu suất hệ thống, doanh thu và giao dịch gần đây
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center space-x-2 shadow-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="text-sm text-gray-700 bg-transparent focus:outline-none"
                >
                  {Array.from({ length: 4 }).map((_, idx) => {
                    const y = new Date().getFullYear() - idx;
                    return (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                  title="Tổng doanh thu"
                  value={
                    summary
                      ? summary.totalRevenue.toLocaleString("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        })
                      : "—"
                  }
                  icon={DollarSign}
                  accent="#2563eb"
                />
                <Card
                  title="Người dùng"
                  value={summary?.totalUsers ?? "—"}
                  icon={Users}
                  accent="#8b5cf6"
                  subtitle={`Đang hoạt động: ${summary?.activeSubscribers ?? 0}`}
                />
                <Card
                  title="Nhà & phòng"
                  value={`${summary?.totalHomes ?? 0} homes`}
                  icon={HomeIcon}
                  accent="#10b981"
                  subtitle={`${summary?.totalRooms ?? 0} phòng`}
                />
                <Card
                  title="Thiết bị & Hỗ trợ"
                  value={`${summary?.totalDevices ?? 0} thiết bị`}
                  icon={Cpu}
                  accent="#f59e0b"
                  subtitle={`Ticket chờ: ${summary?.pendingSupportRequests ?? 0}`}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Doanh thu theo tháng</p>
                      <p className="text-lg font-semibold text-gray-900">
                        Tổng {revenueTotal.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                      </p>
                    </div>
                    <BarChart className="h-6 w-6 text-blue-600" />
                  </div>
                  {revenue.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">Chưa có dữ liệu doanh thu</div>
                  ) : (
                    <RevenueBarChart data={revenue} />
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Giao dịch gần đây</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {transactions.length} giao dịch
                      </p>
                    </div>
                    <Wallet className="h-6 w-6 text-indigo-600" />
                  </div>
                  {transactions.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">Chưa có giao dịch</div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((tx) => (
                        <div
                          key={tx.paymentId}
                          className="flex items-start justify-between rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50 transition"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {tx.userName || tx.userEmail || "Khách hàng"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(tx.createdAt).toLocaleString("vi-VN")}
                            </p>
                            <p className="text-xs text-gray-500">
                              {tx.description || "Thanh toán dịch vụ"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              {tx.amount.toLocaleString("vi-VN", {
                                style: "currency",
                                currency: tx.currency || "VND",
                              })}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center justify-end">
                              <Activity className="h-3 w-3 mr-1 text-gray-400" />
                              {tx.method || "N/A"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 text-right">
                    <a
                      href="/admin/payments"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      Xem tất cả <ArrowRight className="h-4 w-4 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

