"use client";

import React, { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { apiService } from "@/services/api";
import { DeviceMapping } from "@/types";
import {
  Link as LinkIcon,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  Cpu,
  KeyRound,
  Network,
} from "lucide-react";

export default function DeviceMappingsPage() {
  const [mappings, setMappings] = useState<DeviceMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    DeviceId: "",
    HomeKey: "",
    NodeId: "",
    Description: "",
  });

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return mappings.filter((m) =>
      [
        m.deviceName,
        m.deviceId?.toString(),
        m.homeKey,
        m.nodeIdentifier,
        m.hardwareIdentifier,
        m.description,
      ]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term))
    );
  }, [mappings, search]);

  const stats = useMemo(() => {
    const nodes = new Set(filtered.map((m) => m.nodeIdentifier || "").filter(Boolean));
    const homes = new Set(filtered.map((m) => m.homeKey || "").filter(Boolean));
    return {
      total: filtered.length,
      nodes: nodes.size,
      homes: homes.size,
    };
  }, [filtered]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await apiService.getDeviceMappings();
      setMappings(list);
    } catch (err: any) {
      setError(parseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.DeviceId || !formData.HomeKey || !formData.NodeId) {
      setError("Vui lòng nhập đầy đủ DeviceId, HomeKey, NodeId.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      await apiService.createDeviceMapping({
        DeviceId: Number(formData.DeviceId),
        HomeKey: formData.HomeKey.trim(),
        NodeId: formData.NodeId.trim(),
        Description: formData.Description.trim() || undefined,
      });

      setSuccess("Ghép đôi thiết bị thành công!");
      setShowForm(false);
      setFormData({ DeviceId: "", HomeKey: "", NodeId: "", Description: "" });
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(parseError(err, "Không thể ghép đôi thiết bị. Vui lòng thử lại."));
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn chắc chắn muốn hủy ghép đôi thiết bị này?")) return;
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      await apiService.deleteDeviceMapping(id);
      setSuccess("Đã hủy ghép đôi thành công.");
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(parseError(err, "Không thể hủy ghép đôi thiết bị."));
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
                Device Provisioning
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Ghép đôi phần cứng với Database
              </h1>
              <p className="text-slate-500">
                Quản lý mappings giữa thiết bị vật lý (hardware) và thiết bị trong hệ thống.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="inline-flex items-center px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm"
                disabled={isSubmitting}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Làm mới
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ghép đôi mới
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Tổng mappings" value={stats.total} icon={<LinkIcon className="w-5 h-5" />} />
            <StatCard label="Node unique" value={stats.nodes} icon={<Network className="w-5 h-5" />} />
            <StatCard label="HomeKey unique" value={stats.homes} icon={<KeyRound className="w-5 h-5" />} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <LinkIcon className="w-4 h-4 text-blue-600" />
                <span>Danh sách mappings</span>
                {isLoading && <span className="text-xs text-gray-400">Đang tải...</span>}
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo device, node, homeKey..."
                  className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 text-red-700 text-sm border-b border-red-100">
                {error}
              </div>
            )}
            {success && (
              <div className="px-4 py-3 bg-emerald-50 text-emerald-700 text-sm border-b border-emerald-100">
                {success}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Device</th>
                    <th className="px-4 py-3 text-left">NodeId</th>
                    <th className="px-4 py-3 text-left">HomeKey</th>
                    <th className="px-4 py-3 text-left">Hardware Id</th>
                    <th className="px-4 py-3 text-left">Mô tả</th>
                    <th className="px-4 py-3 text-left">Ngày tạo</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!isLoading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-gray-500">
                        Không có mapping nào.
                      </td>
                    </tr>
                  )}
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-blue-600" />
                          {m.deviceName || `Device #${m.deviceId}`}
                        </div>
                        <p className="text-xs text-gray-500">ID: {m.deviceId}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-800">{m.nodeIdentifier || m.nodeIdentifier === "" ? m.nodeIdentifier : m.nodeIdentifier}</td>
                      <td className="px-4 py-3 text-gray-800">{m.homeKey || "—"}</td>
                      <td className="px-4 py-3 text-gray-800">{m.hardwareIdentifier || "—"}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{m.description || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(m.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={isSubmitting}
                          className="text-red-600 hover:text-red-800 inline-flex items-center gap-1 text-sm disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Provision</p>
                  <h3 className="text-xl font-bold text-gray-900">Ghép đôi thiết bị</h3>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-3" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-medium text-gray-700">DeviceId *</label>
                  <input
                    type="number"
                    value={formData.DeviceId}
                    onChange={(e) => setFormData({ ...formData, DeviceId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">HomeKey *</label>
                  <input
                    value={formData.HomeKey}
                    onChange={(e) => setFormData({ ...formData, HomeKey: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">NodeId *</label>
                  <input
                    value={formData.NodeId}
                    onChange={(e) => setFormData({ ...formData, NodeId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Mô tả</label>
                  <textarea
                    value={formData.Description}
                    onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Ghi chú ngắn gọn (tùy chọn)"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Đang lưu..." : "Ghép đôi"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
      <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

function parseError(err: any, fallback = "Có lỗi xảy ra. Vui lòng thử lại.") {
  const msg =
    err?.message ||
    (typeof err === "string" ? err : "") ||
    fallback;
  if (msg.toLowerCase().includes("<html")) {
    return "Backend trả về HTML (403 / app stopped). Vui lòng kiểm tra backend hoặc quyền truy cập.";
  }
  return msg;
}

