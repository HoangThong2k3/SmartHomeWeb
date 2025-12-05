"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import UserLayout from "@/components/layout/UserLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Home,
  Zap,
  Settings,
  Bell,
  Loader2,
} from "lucide-react";
import { apiService } from "@/services/api";
import { ServicePackage } from "@/types";

export default function SubscribePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Fetch user data to check serviceStatus
    const fetchUserData = async () => {
      if (user?.role === "customer") {
        try {
          const userData = await apiService.getCurrentUser();
          setCurrentUser(userData);
          
          // Kiểm tra serviceStatus
          const serviceStatus = userData?.serviceStatus;
          
          // Nếu đã có dịch vụ active hoặc đang cài đặt, redirect về dashboard
          if (serviceStatus === "Hoàn tất" || serviceStatus === "ACTIVE" || 
              (serviceStatus && serviceStatus !== "Chưa có dịch vụ" && 
               !serviceStatus.includes("Chưa"))) {
            router.push("/user-dashboard");
            return;
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoadingUser(false);
        }
      } else {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
    fetchPackages();
  }, [user, router]);

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getServicePackages();
      setPackages(data.filter(pkg => pkg.isActive));
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

  const handleSelectPlan = async (packageId: number) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      // Kiểm tra user đã đăng nhập chưa
      if (!user) {
        setError("Vui lòng đăng nhập để tiếp tục.");
        setIsProcessing(false);
        router.push("/login");
        return;
      }

      // Kiểm tra token có tồn tại không
      const token = typeof window !== "undefined" 
        ? localStorage.getItem("authToken") 
        : null;
      
      if (!token) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setIsProcessing(false);
        router.push("/login");
        return;
      }

      // Tạo payment link
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const paymentLink = await apiService.createPaymentLink({
        packageId,
        successUrl: `${origin}/payment/success`,
        cancelUrl: `${origin}/payment/cancel`,
        paymentType: "STANDARD",
      });
      
      // Redirect đến PayOS checkout
      if (paymentLink.checkoutUrl) {
        window.location.href = paymentLink.checkoutUrl;
      } else {
        throw new Error("Không thể tạo link thanh toán. Vui lòng thử lại.");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Không thể tạo link thanh toán. Vui lòng thử lại.";
      setError(errorMessage);
      console.error("Error creating payment link:", err);
      
      // Nếu là lỗi Unauthorized, redirect về login
      if (errorMessage.includes("hết hạn") || errorMessage.includes("Unauthorized") || errorMessage.includes("đăng nhập")) {
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
      
      setIsProcessing(false);
    }
  };

  // Nếu đang loading user data, hiển thị loading
  if (isLoadingUser) {
    return (
      <ProtectedRoute>
        <UserLayout>
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Đang kiểm tra trạng thái dịch vụ...</span>
            </div>
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  // Kiểm tra nếu user đã có dịch vụ active hoặc đang cài đặt
  const serviceStatus = currentUser?.serviceStatus;
  const hasActiveService = serviceStatus === "Hoàn tất" || serviceStatus === "ACTIVE" || 
    (serviceStatus && serviceStatus !== "Chưa có dịch vụ" && !serviceStatus.includes("Chưa"));
  const isInstalling = serviceStatus === "Đang cài đặt" || serviceStatus?.includes("Đang cài đặt");

  // Nếu đã có dịch vụ active hoặc đang cài đặt, hiển thị thông báo và redirect
  if (hasActiveService || isInstalling) {
    return (
      <ProtectedRoute>
        <UserLayout>
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {hasActiveService ? "Bạn đã có dịch vụ đang hoạt động" : "Dịch vụ đang được cài đặt"}
              </h1>
              <p className="text-gray-600 mb-6">
                {hasActiveService 
                  ? "Bạn đã đăng ký dịch vụ thành công. Vui lòng quay lại Dashboard để sử dụng các tính năng."
                  : "Yêu cầu của bạn đã được ghi nhận. Đội ngũ kỹ thuật đang tiến hành cài đặt hệ thống. Bạn sẽ được thông báo khi hệ thống sẵn sàng."}
              </p>
              <button
                onClick={() => router.push("/user-dashboard")}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Home className="h-5 w-5 mr-2" />
                Về Dashboard
              </button>
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
            <div className="flex items-center mb-4">
              <ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">
                Đăng ký Dịch vụ Nhà thông minh
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Chọn gói dịch vụ phù hợp với nhu cầu của bạn và bắt đầu trải nghiệm
              ngôi nhà thông minh
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Luồng chuẩn (Standard package)
                </h2>
              </div>
              <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                <li>Xem danh sách gói dịch vụ từ SmartHome</li>
                <li>Chọn gói và tạo link PayOS thật (QR/Banking)</li>
                <li>Thanh toán xong PayOS redirect về <code>/payment/success</code></li>
                <li>Frontend tự gọi API verify ⇒ dịch vụ được kích hoạt ngay</li>
              </ul>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-center mb-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Luồng tùy chỉnh (Custom bill)
                </h2>
              </div>
              <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                <li>Liên hệ admin khi gói chuẩn không phù hợp</li>
                <li>Admin tạo hóa đơn tùy chỉnh ⇒ bạn thấy thông báo ở trang Quản lý dịch vụ</li>
                <li>Nhấn Thanh toán để tạo link PayOS thật</li>
                <li>Thanh toán thành công ⇒ hệ thống verify qua success callback và kích hoạt dịch vụ</li>
              </ul>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </div>
          )}

          {/* Service Information */}
          <div className="mb-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
            <div className="flex items-start">
              <Sparkles className="h-6 w-6 text-blue-600 mr-3 mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Dịch vụ Nhà thông minh của chúng tôi
                </h2>
                <p className="text-gray-700 mb-4">
                  Hệ thống quản lý nhà thông minh toàn diện với các tính năng:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Home className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-gray-700">Quản lý nhiều ngôi nhà</span>
                  </div>
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-gray-700">Điều khiển thiết bị IoT</span>
                  </div>
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-gray-700">Tự động hóa thông minh</span>
                  </div>
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-gray-700">Thông báo và cảnh báo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Plans */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Chọn Gói Dịch Vụ
            </h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Đang tải danh sách gói dịch vụ...</span>
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Hiện tại không có gói dịch vụ nào khả dụng.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <div
                    key={pkg.packageId}
                    className="bg-white rounded-lg shadow-lg border-2 p-6 relative transition-transform hover:scale-105 border-gray-200 hover:border-blue-300"
                  >
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {pkg.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {pkg.description}
                      </p>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-blue-600">
                          {formatCurrency(pkg.price)}
                        </span>
                        <span className="text-gray-600 ml-2">
                          /{pkg.durationInMonths} tháng
                        </span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span>Thời hạn: {pkg.durationInMonths} tháng</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectPlan(pkg.packageId)}
                      disabled={isProcessing}
                      className="w-full py-3 px-4 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-5 w-5 mr-2" />
                          Chọn Gói
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}

