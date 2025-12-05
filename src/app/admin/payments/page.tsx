"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { ServicePayment, ServicePackage, User, PaymentStatus } from "@/types";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Eye,
  DollarSign,
  Calendar,
  User as UserIcon,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function AdminPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<ServicePayment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<ServicePayment | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [paymentsData, usersData, packagesData] = await Promise.all([
        apiService.getAllPayments(),
        apiService.getUsers(),
        apiService.getAllPackages(),
      ]);
      
      setPayments(paymentsData);
      setUsers(usersData);
      setPackages(packagesData);
    } catch (err: any) {
      setError(err.message || "Không thể tải dữ liệu. Vui lòng thử lại.");
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "VND"): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    // Convert status to string for comparison
    let statusStr = "";
    if (typeof status === "number") {
      // Map number enum to string
      const statusMap: Record<number, string> = {
        0: "PENDING",
        1: "PAID",
        2: "FAILED",
        3: "CANCELLED",
      };
      statusStr = statusMap[status] || status.toString();
    } else {
      statusStr = status.toUpperCase();
    }

    const statusMap: Record<string, { color: string; icon: any; text: string }> = {
      PAID: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        text: "Đã thanh toán",
      },
      PENDING: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        text: "Đang chờ",
      },
      FAILED: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        text: "Thất bại",
      },
      CANCELLED: {
        color: "bg-gray-100 text-gray-800",
        icon: XCircle,
        text: "Đã hủy",
      },
    };

    const statusInfo = statusMap[statusStr] || {
      color: "bg-gray-100 text-gray-800",
      icon: AlertCircle,
      text: statusStr || status?.toString() || "Unknown",
    };

    const Icon = statusInfo.icon;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {statusInfo.text}
      </span>
    );
  };

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      !searchTerm ||
      payment.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paymentId.toString().includes(searchTerm);

    // Convert status to string for comparison
    let paymentStatusStr = "";
    if (typeof payment.status === "number") {
      const statusMap: Record<number, string> = {
        0: "PENDING",
        1: "PAID",
        2: "FAILED",
        3: "CANCELLED",
      };
      paymentStatusStr = statusMap[payment.status] || payment.status.toString();
    } else {
      paymentStatusStr = payment.status.toUpperCase();
    }

    const matchesStatus = statusFilter === "all" || paymentStatusStr === statusFilter;
    const matchesUser = !selectedUserId || payment.userId === selectedUserId;

    return matchesSearch && matchesStatus && matchesUser;
  });

  const handleViewDetails = async (paymentId: number) => {
    try {
      const details = await apiService.getPaymentDetails(paymentId);
      setSelectedPayment(details);
      setShowDetailModal(true);
    } catch (err: any) {
      setError(err.message || "Không thể tải chi tiết payment.");
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setSuccess("Tạo custom payment bill thành công!");
    setTimeout(() => setSuccess(null), 3000);
    fetchData();
  };

  // Helper to check if payment status matches
  const isStatusMatch = (payment: ServicePayment, status: string): boolean => {
    if (typeof payment.status === "number") {
      const statusMap: Record<number, string> = {
        0: "PENDING",
        1: "PAID",
        2: "FAILED",
        3: "CANCELLED",
      };
      return statusMap[payment.status] === status;
    }
    return payment.status.toUpperCase() === status;
  };

  // Stats
  const stats = {
    total: payments.length,
    paid: payments.filter((p) => isStatusMatch(p, "PAID")).length,
    pending: payments.filter((p) => isStatusMatch(p, "PENDING")).length,
    totalAmount: payments
      .filter((p) => isStatusMatch(p, "PAID"))
      .reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý Payments</h1>
              <p className="text-gray-600 mt-2">
                Quản lý tất cả payments và tạo custom payment bills
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchData}
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
                Tạo Custom Bill
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
                <p className="text-sm text-gray-600">Tổng Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã thanh toán</p>
                <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang chờ</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo ID, gói, mô tả..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="PAID">Đã thanh toán</option>
                <option value="PENDING">Đang chờ</option>
                <option value="FAILED">Thất bại</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User
              </label>
              <select
                value={selectedUserId || ""}
                onChange={(e) =>
                  setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tất cả users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.userId || u.id}>
                    {u.fullName || u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Không tìm thấy payment nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gói dịch vụ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời hạn
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
                  {filteredPayments.map((payment) => {
                    const paymentUser = users.find(
                      (u) => (u.userId || parseInt(u.id)) === payment.userId
                    );
                    return (
                      <tr key={payment.paymentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{payment.paymentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {paymentUser?.fullName || paymentUser?.name || `User #${payment.userId}`}
                          </div>
                          <div className="text-xs text-gray-500">{paymentUser?.email || ""}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {payment.packageName || "Custom"}
                          </div>
                          {payment.description && (
                            <div className="text-xs text-gray-500">{payment.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(payment.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.durationInMonths} tháng
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewDetails(payment.paymentId)}
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Custom Payment Modal */}
        {showCreateModal && (
          <CreateCustomPaymentModal
            users={users}
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateModal(false)}
          />
        )}

        {/* Payment Detail Modal */}
        {showDetailModal && selectedPayment && (
          <PaymentDetailModal
            payment={selectedPayment}
            user={users.find((u) => (u.userId || parseInt(u.id)) === selectedPayment.userId)}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedPayment(null);
            }}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
}

// Create Custom Payment Modal Component
function CreateCustomPaymentModal({
  users,
  onSuccess,
  onCancel,
}: {
  users: User[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    userId: "",
    amount: "",
    description: "",
    durationInMonths: "12",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.userId || !formData.amount || !formData.description) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiService.createCustomPaymentBill({
        userId: parseInt(formData.userId),
        amount: parseInt(formData.amount),
        description: formData.description,
        durationInMonths: parseInt(formData.durationInMonths),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Không thể tạo custom payment bill. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Tạo Custom Payment Bill</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Chọn user</option>
              {users.map((u) => (
                <option key={u.id} value={u.userId || u.id}>
                  {u.fullName || u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số tiền (VND) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="100000"
              min="0"
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
              placeholder="Mô tả dịch vụ..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thời hạn (tháng)
            </label>
            <input
              type="number"
              value={formData.durationInMonths}
              onChange={(e) => setFormData({ ...formData, durationInMonths: e.target.value })}
              placeholder="12"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Tạo Bill
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
      </div>
    </div>
  );
}

// Payment Detail Modal Component
function PaymentDetailModal({
  payment,
  user,
  onClose,
}: {
  payment: ServicePayment;
  user?: User;
  onClose: () => void;
}) {
  const formatCurrency = (amount: number, currency: string = "VND"): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Chi tiết Payment #{payment.paymentId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin User</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Tên</p>
                <p className="font-medium text-gray-900">
                  {user?.fullName || user?.name || `User #${payment.userId}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{user?.email || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin Payment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Payment ID</p>
                <p className="font-medium text-gray-900">#{payment.paymentId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trạng thái</p>
                {(() => {
                  let statusStr = "";
                  if (typeof payment.status === "number") {
                    const statusMap: Record<number, string> = {
                      0: "PENDING",
                      1: "PAID",
                      2: "FAILED",
                      3: "CANCELLED",
                    };
                    statusStr = statusMap[payment.status] || payment.status.toString();
                  } else {
                    statusStr = payment.status.toUpperCase();
                  }

                  return (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusStr === "PAID"
                          ? "bg-green-100 text-green-800"
                          : statusStr === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : statusStr === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusStr}
                    </span>
                  );
                })()}
              </div>
              <div>
                <p className="text-sm text-gray-600">Gói dịch vụ</p>
                <p className="font-medium text-gray-900">
                  {payment.packageName || "Custom"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mô tả</p>
                <p className="font-medium text-gray-900">{payment.description || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Số tiền</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency(payment.amount, payment.currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phương thức</p>
                <p className="font-medium text-gray-900">{payment.method}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Thời hạn</p>
                <p className="font-medium text-gray-900">{payment.durationInMonths} tháng</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transaction Ref</p>
                <p className="font-medium text-gray-900 font-mono">
                  {payment.transactionRef || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Service Period */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thời hạn dịch vụ</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Ngày bắt đầu</p>
                <p className="font-medium text-gray-900">{formatDate(payment.serviceStart)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày kết thúc</p>
                <p className="font-medium text-gray-900">{formatDate(payment.serviceEnd)}</p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khác</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Ngày tạo</p>
                <p className="font-medium text-gray-900">{formatDate(payment.createdAt)}</p>
              </div>
              {payment.checkoutUrl && (
                <div>
                  <p className="text-sm text-gray-600">Checkout URL</p>
                  <a
                    href={payment.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-800 break-all"
                  >
                    {payment.checkoutUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

