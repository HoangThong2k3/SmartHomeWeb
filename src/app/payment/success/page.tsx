"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Home } from "lucide-react";
import Link from "next/link";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const cancel = searchParams.get("cancel");
    if (cancel === "true") {
      router.push("/payment/cancel");
      return;
    }

    const queryObject = Object.fromEntries(searchParams.entries());
    const orderCode = queryObject.orderCode;
    const code = queryObject.code;

    if (!orderCode || !code) {
      setStatus("error");
      setMessage("Không tìm thấy thông tin thanh toán. Vui lòng kiểm tra lịch sử giao dịch.");
      return;
    }

    const verifyPayment = async () => {
      try {
        const result = await apiService.confirmPaymentFromCallback(queryObject);
        if (result.isSuccess) {
          // Refresh user data để cập nhật serviceStatus sau khi thanh toán thành công
          try {
            await refreshUser();
          } catch (refreshError) {
            console.warn("Failed to refresh user data after payment:", refreshError);
            // Không block success message nếu refresh fail
          }
          
          setStatus("success");
          setMessage(
            result.message ||
              "Thanh toán thành công! Dịch vụ của bạn sẽ được kích hoạt trong giây lát."
          );
        } else {
          setStatus("error");
          setMessage(
            result.message ||
              "Thanh toán không thành công hoặc chưa được xác minh. Vui lòng thử lại hoặc liên hệ hỗ trợ."
          );
        }
      } catch (error: any) {
        console.error("Failed to verify payment:", error);
        setStatus("error");
        setMessage(
          error?.message ||
            "Không thể xác minh giao dịch. Vui lòng thử lại hoặc liên hệ bộ phận hỗ trợ."
        );
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Đang xử lý thanh toán...
            </h1>
            <p className="text-gray-600">
              Vui lòng đợi trong giây lát
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thành công!
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Đội ngũ kỹ thuật sẽ liên hệ với bạn để cài đặt hệ thống. 
              Bạn sẽ nhận được thông báo khi dịch vụ sẵn sàng sử dụng.
            </p>
            <Link
              href="/user-dashboard"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home className="h-5 w-5 mr-2" />
              Về Dashboard
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán không thành công
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="flex space-x-3">
              <Link
                href="/subscribe"
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </Link>
              <Link
                href="/user-dashboard"
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 transition-colors"
              >
                Về Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Đang xử lý thanh toán...</h1>
      <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
    </div>
  </div>
);

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

