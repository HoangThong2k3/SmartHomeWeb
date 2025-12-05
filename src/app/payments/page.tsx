"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { PaymentPlan, PaymentHistory, ServicePackage, CreateSupportRequestRequest } from "@/types";
import { AlertCircle, CheckCircle, DollarSign, Loader2, FileText, X, MessageSquare } from "lucide-react";

export default function PaymentsPage() {
  const { user } = useAuth();
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestFormData, setRequestFormData] = useState<CreateSupportRequestRequest>({
    title: "",
    content: "",
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  useEffect(() => {
    fetchServicePackages();
    fetchPaymentHistory();
  }, [user]);

  const fetchServicePackages = async () => {
    try {
      setIsLoadingPlans(true);
      setError(null);
      const packages: ServicePackage[] = await apiService.getServicePackages();
      const mapped: PaymentPlan[] = (packages || []).map((pkg, index) => ({
        id: pkg.packageId.toString(),
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        duration: pkg.durationInMonths,
        features: [
          `Thời hạn ${pkg.durationInMonths} tháng`,
          "Quản lý nhà, phòng và thiết bị thông minh",
          "Tự động hóa kịch bản, cảnh báo theo cấu hình hệ thống",
        ],
        isPopular: index === 1,
      }));
      setPaymentPlans(mapped);
    } catch (err: any) {
      console.error("[PaymentsPage] Error fetching service packages:", err);
      setError(
        err?.message ||
          "Không thể tải danh sách gói dịch vụ. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      // Lịch sử thực tế hiển thị tại trang Quản lý Dịch vụ
      setPaymentHistory([]);
    } catch (err: any) {
      console.error("[PaymentsPage] Error fetching payment history:", err);
    }
  };

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const handleSelectPlan = async (plan: PaymentPlan) => {
    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);

      if (!user) {
        setError("Vui lòng đăng nhập để tiếp tục.");
        return;
      }

      // Chỉ cho phép Customer tạo payment link
      if (user.role === "admin") {
        setError("Trang này chỉ dành cho khách hàng. Admin vui lòng sử dụng trang Admin Payments để quản lý thanh toán.");
        return;
      }

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      const paymentLink = await apiService.createPaymentLink({
        packageId: parseInt(plan.id, 10),
        successUrl: `${origin}/payment/success`,
        cancelUrl: `${origin}/payment/cancel`,
        paymentType: "STANDARD",
      });

      if (paymentLink.checkoutUrl) {
        window.location.href = paymentLink.checkoutUrl;
      } else {
        throw new Error("Không thể tạo link thanh toán. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("[PaymentsPage] Error creating payment link:", err);
      const errorMsg = err?.message || "Không thể tạo link thanh toán. Vui lòng thử lại.";
      // Nếu là lỗi Forbidden, hiển thị thông báo rõ ràng hơn
      if (errorMsg.includes("Forbidden") || errorMsg.includes("403")) {
        setError("Bạn không có quyền thực hiện thao tác này. Trang này chỉ dành cho khách hàng.");
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestFormData.title.trim() || !requestFormData.content.trim()) {
      setError("Vui lòng điền đầy đủ tiêu đề và nội dung yêu cầu.");
      return;
    }

    try {
      setIsSubmittingRequest(true);
      setError(null);
      await apiService.createSupportRequest(requestFormData);
      setSuccess("Yêu cầu của bạn đã được gửi thành công! Admin sẽ liên hệ với bạn sớm nhất.");
      setRequestFormData({ title: "", content: "" });
      setShowRequestForm(false);
    } catch (err: any) {
      console.error("[PaymentsPage] Error creating support request:", err);
      setError(err?.message || "Không thể gửi yêu cầu. Vui lòng thử lại.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Thanh Toán</h1>
              <p className="text-gray-600 mt-2">
                Chọn gói dịch vụ chuẩn, hệ thống sẽ tạo link PayOS thật để bạn
                thanh toán (QR, Mobile Banking, ATM).
              </p>
            </div>
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

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Chọn Gói Dịch Vụ
          </h2>
          {isLoadingPlans ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">
                Đang tải danh sách gói dịch vụ...
              </span>
            </div>
          ) : paymentPlans.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                Hiện tại chưa có gói dịch vụ nào. Vui lòng liên hệ admin để được
                hỗ trợ.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {paymentPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-lg shadow-sm border-2 p-6 relative ${
                    plan.isPopular
                      ? "border-blue-500 transform scale-105"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Phổ Biến
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {plan.description}
                    </p>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-blue-600">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-gray-600 ml-2">
                        /
                        {plan.duration === 1
                          ? "tháng"
                          : `${plan.duration} tháng`}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isProcessing || user?.role === "admin"}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      plan.isPopular
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } ${isProcessing || user?.role === "admin" ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    {user?.role === "admin" 
                      ? "Chỉ dành cho khách hàng" 
                      : isProcessing 
                        ? "Đang tạo link..." 
                        : "Thanh toán với PayOS"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Yêu cầu gói dịch vụ tùy chỉnh - Chỉ hiển thị cho Customer */}
        {user?.role === "customer" && (
          <div className="mb-12 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-200 p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <MessageSquare className="h-6 w-6 text-purple-600 mr-2" />
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Không tìm thấy gói phù hợp?
                  </h2>
                </div>
                <p className="text-gray-700 mb-4">
                  Nếu các gói dịch vụ có sẵn không đáp ứng nhu cầu của bạn, bạn có thể gửi yêu cầu tùy chỉnh. 
                  Admin sẽ xem xét và liên hệ với bạn để tạo gói dịch vụ phù hợp.
                </p>
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Gửi yêu cầu gói dịch vụ tùy chỉnh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Thông báo cho Admin */}
        {user?.role === "admin" && (
          <div className="mb-12 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Trang này chỉ dành cho khách hàng
                </h3>
                <p className="text-gray-700 mb-3">
                  Admin vui lòng sử dụng trang <strong>Admin Payments</strong> để quản lý thanh toán và tạo custom payment bills.
                </p>
                <a
                  href="/admin/payments"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Đi đến Admin Payments
                </a>
              </div>
            </div>
          </div>
        )}

        {paymentHistory.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Lịch Sử Thanh Toán (demo)
            </h2>
            <p className="text-sm text-gray-500">
              Lịch sử thanh toán thật được hiển thị trong trang Quản lý Dịch vụ.
            </p>
          </div>
        )}

        {/* Modal: Form tạo yêu cầu hỗ trợ */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Yêu cầu gói dịch vụ tùy chỉnh
                </h2>
                <button
                  onClick={() => {
                    setShowRequestForm(false);
                    setRequestFormData({ title: "", content: "" });
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitRequest} className="p-6">
                <div className="mb-6">
                  <label
                    htmlFor="request-title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="request-title"
                    type="text"
                    required
                    value={requestFormData.title}
                    onChange={(e) =>
                      setRequestFormData({ ...requestFormData, title: e.target.value })
                    }
                    placeholder="Ví dụ: Yêu cầu gói dịch vụ 24 tháng với giá ưu đãi"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="request-content"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nội dung chi tiết <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="request-content"
                    required
                    rows={8}
                    value={requestFormData.content}
                    onChange={(e) =>
                      setRequestFormData({ ...requestFormData, content: e.target.value })
                    }
                    placeholder="Mô tả chi tiết yêu cầu của bạn: thời hạn, giá mong muốn, tính năng đặc biệt, v.v..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isSubmittingRequest}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingRequest ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Đang gửi...
                      </span>
                    ) : (
                      "Gửi yêu cầu"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRequestForm(false);
                      setRequestFormData({ title: "", content: "" });
                      setError(null);
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
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

