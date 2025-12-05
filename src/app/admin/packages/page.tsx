"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { ServicePackage } from "@/types";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function AdminPackagesPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getAllPackages();
      setPackages(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách gói dịch vụ. Vui lòng thử lại.");
      console.error("Error fetching packages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setSuccess("Tạo gói dịch vụ thành công!");
    setTimeout(() => setSuccess(null), 3000);
    fetchPackages();
  };

  const handleEditSuccess = () => {
    setEditingPackage(null);
    setSuccess("Cập nhật gói dịch vụ thành công!");
    setTimeout(() => setSuccess(null), 3000);
    fetchPackages();
  };

  const handleDelete = async (pkg: ServicePackage) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa gói "${pkg.name}"?`)) return;

    try {
      // Note: Backend có thể không có DELETE endpoint, chỉ có thể deactivate
      // Nếu có DELETE API, gọi ở đây
      setError("Tính năng xóa gói dịch vụ chưa được hỗ trợ. Vui lòng liên hệ backend để thêm API.");
    } catch (err: any) {
      setError(err.message || "Không thể xóa gói dịch vụ. Vui lòng thử lại.");
    }
  };

  // Stats
  const stats = {
    total: packages.length,
    active: packages.filter((p) => p.isActive).length,
    inactive: packages.filter((p) => !p.isActive).length,
    totalRevenue: packages.reduce((sum, p) => sum + p.price, 0),
  };

  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý Gói Dịch vụ</h1>
              <p className="text-gray-600 mt-2">
                Setup và quản lý các gói dịch vụ SmartHome với giá và thời hạn
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchPackages}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo Gói Mới
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
              ×
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng số gói</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã tắt</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng giá trị</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Packages Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Chưa có gói dịch vụ nào</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo gói đầu tiên
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên gói
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mô tả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời hạn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {packages.map((pkg) => (
                    <tr key={pkg.packageId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">
                          {pkg.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(pkg.price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {pkg.durationInMonths} tháng
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            pkg.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {pkg.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Đang hoạt động
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Đã tắt
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(pkg.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingPackage(pkg)}
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(pkg)}
                            className="text-red-600 hover:text-red-800 flex items-center"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Package Modal */}
        {(showCreateModal || editingPackage) && (
          <PackageModal
            package={editingPackage || undefined}
            onSuccess={editingPackage ? handleEditSuccess : handleCreateSuccess}
            onCancel={() => {
              setShowCreateModal(false);
              setEditingPackage(null);
            }}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
}

// Package Modal Component
function PackageModal({
  package: pkg,
  onSuccess,
  onCancel,
}: {
  package?: ServicePackage;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: pkg?.name || "",
    description: pkg?.description || "",
    price: pkg?.price?.toString() || "",
    durationInMonths: pkg?.durationInMonths?.toString() || "12",
    isActive: pkg?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.description || !formData.price || !formData.durationInMonths) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const price = parseFloat(formData.price);
    const duration = parseInt(formData.durationInMonths);

    if (isNaN(price) || price <= 0) {
      setError("Giá phải là số dương");
      return;
    }

    if (isNaN(duration) || duration <= 0) {
      setError("Thời hạn phải là số tháng dương");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Note: Backend có thể chưa có API để create/update packages
      // Nếu có, gọi API ở đây:
      // if (pkg) {
      //   await apiService.updatePackage(pkg.packageId, { ...formData, price, durationInMonths: duration });
      // } else {
      //   await apiService.createPackage({ ...formData, price, durationInMonths: duration });
      // }
      
      // Tạm thời hiển thị thông báo
      setError("Tính năng tạo/sửa gói dịch vụ chưa được hỗ trợ. Vui lòng liên hệ backend để thêm API.");
      
      // Nếu API đã có, uncomment code trên và comment dòng error này
      // onSuccess();
    } catch (err: any) {
      setError(err.message || "Không thể lưu gói dịch vụ. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          {pkg ? "Sửa Gói Dịch vụ" : "Tạo Gói Dịch vụ Mới"}
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên gói <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ví dụ: Gói Cơ bản, Gói Premium..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chi tiết về gói dịch vụ..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá (VND) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="100000"
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời hạn (tháng) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.durationInMonths}
                onChange={(e) => setFormData({ ...formData, durationInMonths: e.target.value })}
                placeholder="12"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Gói đang hoạt động</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Chỉ các gói đang hoạt động mới hiển thị cho khách hàng
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Package className="h-5 w-5 mr-2" />
                  {pkg ? "Cập nhật" : "Tạo Gói"}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
          </div>
        </form>

        {/* Note về API */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Lưu ý:</p>
              <p>
                Tính năng tạo/sửa gói dịch vụ cần API từ backend. 
                Vui lòng liên hệ backend để thêm các endpoints:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>POST /api/admin/payments/packages - Tạo gói mới</li>
                <li>PUT /api/admin/payments/packages/{`{id}`} - Cập nhật gói</li>
                <li>DELETE /api/admin/payments/packages/{`{id}`} - Xóa gói</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

