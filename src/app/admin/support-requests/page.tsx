"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { SupportRequest, UpdateSupportRequestStatusRequest, CreateCustomPaymentBillRequest } from "@/types";
import {
  MessageSquare,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Phone,
  Mail,
  User as UserIcon,
  DollarSign,
  Plus,
  X,
} from "lucide-react";

export default function AdminSupportRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [showCreateBillModal, setShowCreateBillModal] = useState(false);
  const [billFormData, setBillFormData] = useState({
    amount: "",
    durationInMonths: "12",
    description: "",
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCreatingBill, setIsCreatingBill] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = statusFilter !== "all" ? statusFilter : undefined;
      const data = await apiService.getAllSupportRequests(status);
      setRequests(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách yêu cầu. Vui lòng thử lại.");
      console.error("Error fetching support requests:", err);
    } finally {
      setIsLoading(false);
    }
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

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();
    if (statusUpper === "PENDING") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Chờ xử lý
        </span>
      );
    }
    if (statusUpper === "CONTACTED") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <MessageSquare className="h-3 w-3 mr-1" />
          Đã liên hệ
        </span>
      );
    }
    if (statusUpper === "RESOLVED") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Đã giải quyết
        </span>
      );
    }
    if (statusUpper === "CLOSED") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="h-3 w-3 mr-1" />
          Đã đóng
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {status}
      </span>
    );
  };

  const handleViewDetail = async (requestId: number) => {
    try {
      const detail = await apiService.getSupportRequest(requestId);
      setSelectedRequest(detail);
      setShowDetailModal(true);
    } catch (err: any) {
      setError(err.message || "Không thể tải chi tiết yêu cầu.");
    }
  };

  const handleUpdateStatus = async (requestId: number, newStatus: "PENDING" | "CONTACTED" | "RESOLVED" | "CLOSED") => {
    try {
      setIsUpdatingStatus(true);
      setError(null);
      await apiService.updateSupportRequestStatus(requestId, { status: newStatus });
      setSuccess(`Đã cập nhật trạng thái thành "${newStatus}".`);
      await fetchRequests();
      if (selectedRequest?.requestId === requestId) {
        const updated = await apiService.getSupportRequest(requestId);
        setSelectedRequest(updated);
      }
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật trạng thái.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenCreateBill = (request: SupportRequest) => {
    setSelectedRequest(request);
    setBillFormData({
      amount: "",
      durationInMonths: "12",
      description: `Hóa đơn cho yêu cầu: ${request.title}`,
    });
    setShowCreateBillModal(true);
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (!billFormData.amount || !billFormData.durationInMonths || !billFormData.description) {
      setError("Vui lòng điền đầy đủ thông tin hóa đơn.");
      return;
    }

    try {
      setIsCreatingBill(true);
      setError(null);

      const billRequest: CreateCustomPaymentBillRequest = {
        userId: selectedRequest.userId,
        amount: parseInt(billFormData.amount),
        description: billFormData.description,
        durationInMonths: parseInt(billFormData.durationInMonths),
      };

      await apiService.createCustomPaymentBill(billRequest);
      
      // Tự động chuyển status sang RESOLVED sau khi tạo bill
      await apiService.updateSupportRequestStatus(selectedRequest.requestId, {
        status: "RESOLVED",
      });

      setSuccess("Đã tạo hóa đơn tùy chỉnh và cập nhật trạng thái yêu cầu!");
      setShowCreateBillModal(false);
      setBillFormData({ amount: "", durationInMonths: "12", description: "" });
      await fetchRequests();
      if (showDetailModal) {
        const updated = await apiService.getSupportRequest(selectedRequest.requestId);
        setSelectedRequest(updated);
      }
    } catch (err: any) {
      setError(err.message || "Không thể tạo hóa đơn. Vui lòng thử lại.");
    } finally {
      setIsCreatingBill(false);
    }
  };

  const getZaloLink = (phoneNumber?: string): string => {
    if (!phoneNumber) return "#";
    // Remove + and spaces, keep only digits
    const cleanPhone = phoneNumber.replace(/[+\s]/g, "");
    // Zalo web link format: https://zalo.me/84901234567
    return `https://zalo.me/${cleanPhone}`;
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý Yêu cầu Hỗ trợ</h1>
              <p className="text-gray-600 mt-2">
                Xem và xử lý các yêu cầu gói dịch vụ tùy chỉnh từ khách hàng
              </p>
            </div>
            <button
              onClick={fetchRequests}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Làm mới
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Tìm theo tiêu đề, nội dung, email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lọc theo trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="CONTACTED">Đã liên hệ</option>
                <option value="RESOLVED">Đã giải quyết</option>
                <option value="CLOSED">Đã đóng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Đang tải danh sách yêu cầu...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Không có yêu cầu nào.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiêu đề
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((req) => (
                    <tr key={req.requestId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{req.requestId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {req.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{req.userName || req.userEmail || `User #${req.userId}`}</div>
                          {req.userEmail && (
                            <div className="text-xs text-gray-400">{req.userEmail}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(req.supportStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(req.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetail(req.requestId)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Chi tiết yêu cầu #{selectedRequest.requestId}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRequest(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tiêu đề</h3>
                  <p className="text-gray-700">{selectedRequest.title}</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nội dung</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRequest.content}</p>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Trạng thái</h3>
                    <div>{getStatusBadge(selectedRequest.supportStatus)}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Ngày tạo</h3>
                    <p className="text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                  </div>
                  {selectedRequest.resolvedAt && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Ngày giải quyết</h3>
                      <p className="text-gray-900">{formatDate(selectedRequest.resolvedAt)}</p>
                    </div>
                  )}
                </div>

                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin khách hàng</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-700">
                        {selectedRequest.userName || `User #${selectedRequest.userId}`}
                      </span>
                    </div>
                    {selectedRequest.userEmail && (
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-2" />
                        <a
                          href={`mailto:${selectedRequest.userEmail}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {selectedRequest.userEmail}
                        </a>
                      </div>
                    )}
                    {selectedRequest.userPhone && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-700 mr-3">{selectedRequest.userPhone}</span>
                        <a
                          href={getZaloLink(selectedRequest.userPhone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Zalo
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {selectedRequest.supportStatus.toUpperCase() !== "CONTACTED" && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.requestId, "CONTACTED")}
                      disabled={isUpdatingStatus}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Đánh dấu đã liên hệ
                    </button>
                  )}
                  {selectedRequest.supportStatus.toUpperCase() !== "RESOLVED" && (
                    <button
                      onClick={() => handleOpenCreateBill(selectedRequest)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Tạo hóa đơn tùy chỉnh
                    </button>
                  )}
                  {selectedRequest.supportStatus.toUpperCase() !== "CLOSED" && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.requestId, "CLOSED")}
                      disabled={isUpdatingStatus}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Đóng yêu cầu
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Bill Modal */}
        {showCreateBillModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Tạo hóa đơn tùy chỉnh</h2>
                <button
                  onClick={() => {
                    setShowCreateBillModal(false);
                    setBillFormData({ amount: "", durationInMonths: "12", description: "" });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateBill} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số tiền (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={billFormData.amount}
                    onChange={(e) => setBillFormData({ ...billFormData, amount: e.target.value })}
                    placeholder="Ví dụ: 5000000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời hạn (tháng) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={billFormData.durationInMonths}
                    onChange={(e) => setBillFormData({ ...billFormData, durationInMonths: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={billFormData.description}
                    onChange={(e) => setBillFormData({ ...billFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isCreatingBill}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingBill ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Đang tạo...
                      </span>
                    ) : (
                      "Tạo hóa đơn"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateBillModal(false);
                      setBillFormData({ amount: "", durationInMonths: "12", description: "" });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Hủy
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

