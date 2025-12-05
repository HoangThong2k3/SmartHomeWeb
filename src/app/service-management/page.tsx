"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import UserLayout from "@/components/layout/UserLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { apiService } from "@/services/api";
import { ServicePayment, PaymentStatus } from "@/types";
import {
  CheckCircle,
  Calendar,
  RefreshCw,
  AlertCircle,
  Clock,
  DollarSign,
  Loader2,
  CreditCard,
} from "lucide-react";

export default function ServiceManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [payments, setPayments] = useState<ServicePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [payingPaymentId, setPayingPaymentId] = useState<number | null>(null);
  const [customPayError, setCustomPayError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.role === "customer") {
        try {
          setIsLoading(true);
          setIsLoadingPayments(true);
          
          // Fetch user data
          const userData = await apiService.getCurrentUser();
          setCurrentUser(userData);
          
          // Fetch payment history
          const paymentData = await apiService.getMyPayments();
          setPayments(paymentData);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
          setIsLoadingPayments(false);
        }
      } else {
        setIsLoading(false);
        setIsLoadingPayments(false);
      }
    };

    fetchData();
  }, [user]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
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

  const getStatusDisplay = (status?: string) => {
    if (!status) return { text: "Chưa có dịch vụ", color: "gray" };
    
    if (status === "ACTIVE" || status === "Hoàn tất" || status.includes("Hoàn tất")) {
      return { text: "Đang hoạt động", color: "green" };
    }
    if (status === "Đang cài đặt" || status.includes("Đang cài đặt")) {
      return { text: "Đang cài đặt", color: "yellow" };
    }
    if (status === "SUSPENDED" || status === "Tạm dừng") {
      return { text: "Tạm dừng", color: "orange" };
    }
    if (status === "EXPIRED" || status === "Hết hạn") {
      return { text: "Hết hạn", color: "red" };
    }
    
    return { text: status, color: "gray" };
  };

  const formatCurrency = (amount: number, currency: string = "VND"): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const isPaymentPending = (payment: ServicePayment) => {
    if (typeof payment.status === "number") {
      return payment.status === 0;
    }
    return payment.status?.toString().toUpperCase() === "PENDING";
  };

  const customPayments = payments.filter((payment) => !payment.packageId);
  const pendingCustomBills = customPayments.filter(isPaymentPending);

  const handlePayCustomBill = async (paymentId: number) => {
    try {
      setCustomPayError(null);
      setPayingPaymentId(paymentId);
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const paymentLink = await apiService.createPaymentLink({
        existingPaymentId: paymentId,
        successUrl: `${origin}/payment/success`,
        cancelUrl: `${origin}/payment/cancel`,
        paymentType: "CUSTOM",
      });
      if (paymentLink.checkoutUrl) {
        window.location.href = paymentLink.checkoutUrl;
        return;
      }
      throw new Error("Không thể tạo link thanh toán. Vui lòng thử lại.");
    } catch (error: any) {
      console.error("Error paying custom bill:", error);
      setCustomPayError(
        error?.message || "Không thể tạo link thanh toán. Vui lòng thử lại."
      );
    } finally {
      setPayingPaymentId(null);
    }
  };

  const statusDisplay = getStatusDisplay(currentUser?.serviceStatus);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <UserLayout>
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Đang tải thông tin...</p>
            </div>
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <UserLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Quản lý Dịch vụ
            </h1>
            <p className="text-gray-600">
              Xem trạng thái và quản lý dịch vụ Nhà thông minh của bạn
            </p>
          </div>

          {/* Thông tin dịch vụ */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Thông tin Dịch vụ
            </h2>

            <div className="space-y-6">
              {/* Trạng thái */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {statusDisplay.color === "green" ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : statusDisplay.color === "yellow" ? (
                    <Clock className="h-6 w-6 text-yellow-600" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-gray-600" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Trạng thái</p>
                    <p
                      className={`text-lg font-semibold ${
                        statusDisplay.color === "green"
                          ? "text-green-700"
                          : statusDisplay.color === "yellow"
                          ? "text-yellow-700"
                          : statusDisplay.color === "red"
                          ? "text-red-700"
                          : "text-gray-700"
                      }`}
                    >
                      {statusDisplay.text}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusDisplay.color === "green"
                      ? "bg-green-100 text-green-800"
                      : statusDisplay.color === "yellow"
                      ? "bg-yellow-100 text-yellow-800"
                      : statusDisplay.color === "red"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {currentUser?.serviceStatus || "N/A"}
                </span>
              </div>

              {/* Ngày hết hạn */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Ngày hết hạn</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {currentUser?.serviceExpiryDate
                        ? formatDate(currentUser.serviceExpiryDate)
                        : "Chưa có thông tin"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nút Gia hạn Dịch vụ */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Gia hạn Dịch vụ
                </h3>
                <p className="text-gray-700">
                  Gia hạn dịch vụ để tiếp tục sử dụng các tính năng Nhà thông minh
                </p>
              </div>
              <button
                onClick={() => router.push("/subscribe")}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Gia hạn Dịch vụ
              </button>
            </div>
        </div>

        {/* Hóa đơn tùy chỉnh */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Hóa đơn tùy chỉnh (Custom Bill)
              </h2>
              <p className="text-sm text-gray-600">
                Khi bạn cần gói riêng, admin sẽ tạo bill thủ công để bạn thanh toán qua PayOS.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              {pendingCustomBills.length > 0
                ? `${pendingCustomBills.length} hóa đơn đang chờ`
                : "Chưa có hóa đơn nào"}
            </span>
          </div>

          {customPayError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {customPayError}
            </div>
          )}

          {customPayments.length === 0 ? (
            <div className="text-sm text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4">
              Hiện bạn chưa có hóa đơn tùy chỉnh. Liên hệ admin nếu muốn tạo gói riêng.
            </div>
          ) : (
            <div className="space-y-4">
              {customPayments.map((payment) => {
                const pending = isPaymentPending(payment);
                const statusLabel =
                  typeof payment.status === "number"
                    ? ["PENDING", "PAID", "FAILED", "CANCELLED"][payment.status] || payment.status.toString()
                    : payment.status?.toString()?.toUpperCase();

                return (
                  <div
                    key={payment.paymentId}
                    className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm text-gray-500">Hóa đơn #{payment.paymentId}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {payment.description || "Hóa đơn tùy chỉnh"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Tạo ngày: {formatDate(payment.createdAt)} • Thời hạn: {payment.durationInMonths} tháng
                      </p>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          statusLabel === "PAID"
                            ? "bg-green-100 text-green-800"
                            : statusLabel === "FAILED"
                            ? "bg-red-100 text-red-800"
                            : statusLabel === "CANCELLED"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {statusLabel === "PAID"
                          ? "Đã thanh toán"
                          : statusLabel === "FAILED"
                          ? "Thất bại"
                          : statusLabel === "CANCELLED"
                          ? "Đã hủy"
                          : "Đang chờ"}
                      </span>
                      {pending && (
                        <button
                          onClick={() => handlePayCustomBill(payment.paymentId)}
                          disabled={payingPaymentId === payment.paymentId}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {payingPaymentId === payment.paymentId ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang tạo link...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Thanh toán
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lịch sử thanh toán */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Lịch sử Thanh toán
            </h2>

            {isLoadingPayments ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-500">Đang tải lịch sử thanh toán...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Chưa có giao dịch nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gói dịch vụ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số tiền
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thời hạn
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày thanh toán
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => {
                      // Check if payment is PENDING
                      let isPending = false;
                      if (typeof payment.status === "number") {
                        isPending = payment.status === 0;
                      } else {
                        isPending = payment.status.toUpperCase() === "PENDING";
                      }

                      return (
                        <tr key={payment.paymentId} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.packageName || payment.description || "Tùy chỉnh"}
                            </div>
                            {payment.description && payment.packageName && (
                              <div className="text-xs text-gray-500">
                                {payment.description}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: payment.currency || "VND",
                              }).format(payment.amount)}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {(() => {
                              let statusStr = "";
                              let statusText = "";
                              if (typeof payment.status === "number") {
                                const statusMap: Record<number, { str: string; text: string }> = {
                                  0: { str: "PENDING", text: "Đang chờ" },
                                  1: { str: "PAID", text: "Đã thanh toán" },
                                  2: { str: "FAILED", text: "Thất bại" },
                                  3: { str: "CANCELLED", text: "Đã hủy" },
                                };
                                const statusInfo = statusMap[payment.status] || {
                                  str: payment.status.toString(),
                                  text: payment.status.toString(),
                                };
                                statusStr = statusInfo.str;
                                statusText = statusInfo.text;
                              } else {
                                statusStr = payment.status.toUpperCase();
                                statusText =
                                  payment.status === "PAID"
                                    ? "Đã thanh toán"
                                    : payment.status === "PENDING"
                                    ? "Đang chờ"
                                    : payment.status === "FAILED"
                                    ? "Thất bại"
                                    : payment.status === "CANCELLED"
                                    ? "Đã hủy"
                                    : payment.status;
                              }

                              return (
                                <span
                                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    statusStr === "PAID"
                                      ? "bg-green-100 text-green-800"
                                      : statusStr === "PENDING"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : statusStr === "FAILED"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {statusText}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.durationInMonths} tháng
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.createdAt)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {isPending && !payment.packageId && (
                              <button
                                onClick={() => handlePayCustomBill(payment.paymentId)}
                                disabled={payingPaymentId === payment.paymentId}
                                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {payingPaymentId === payment.paymentId ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Đang xử lý...
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Thanh toán
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Thông tin bổ sung */}
          {currentUser?.serviceExpiryDate && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    Lưu ý về gia hạn
                  </p>
                  <p className="text-sm text-yellow-700">
                    Dịch vụ của bạn sẽ hết hạn vào{" "}
                    <span className="font-semibold">
                      {formatDate(currentUser.serviceExpiryDate)}
                    </span>
                    . Vui lòng gia hạn trước ngày hết hạn để tránh gián đoạn dịch vụ.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}

