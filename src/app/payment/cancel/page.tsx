"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, Home, ArrowLeft, AlertCircle } from "lucide-react";

function PaymentCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we're on backend URL, redirect to frontend
    if (typeof window !== "undefined") {
      const currentUrl = window.location.href;
      if (currentUrl.includes("smarthomes-fdbehwcuaaexaggv.eastasia-01.azurewebsites.net")) {
        // Extract query params and redirect to frontend
        const urlParams = new URLSearchParams(window.location.search);
        // Use frontend URL - replace backend domain with frontend domain
        const frontendOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL || 
          (currentUrl.includes("vercel.app") ? currentUrl.split("/payment")[0] : "https://smart-home-web-seven.vercel.app");
        const frontendUrl = `${frontendOrigin}/payment/cancel?${urlParams.toString()}`;
        window.location.href = frontendUrl;
        return;
      }
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
            <XCircle className="h-12 w-12 text-yellow-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Thanh toán đã bị hủy
        </h1>
        <p className="text-gray-600 mb-4">
          Bạn đã hủy quá trình thanh toán. Nếu bạn muốn tiếp tục đăng ký dịch vụ, 
          vui lòng thử lại.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 text-left">
              Bạn có thể thử lại sau hoặc quay về trang chủ để tiếp tục sử dụng dịch vụ.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/user-dashboard"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <Home className="h-5 w-5 mr-2" />
            Về Dashboard
          </Link>
          <Link
            href="/subscribe"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Quay lại đăng ký dịch vụ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PaymentCancelContent />
    </Suspense>
  );
}

