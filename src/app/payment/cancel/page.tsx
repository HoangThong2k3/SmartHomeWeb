"use client";

import React from "react";
import Link from "next/link";
import { XCircle, Home, ArrowLeft } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
            <XCircle className="h-12 w-12 text-yellow-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Thanh toán đã bị hủy
        </h1>
        <p className="text-gray-600 mb-6">
          Bạn đã hủy quá trình thanh toán. Nếu bạn muốn tiếp tục đăng ký dịch vụ, 
          vui lòng thử lại.
        </p>
        <div className="flex space-x-3">
          <Link
            href="/subscribe"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Quay lại đăng ký
          </Link>
          <Link
            href="/user-dashboard"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            Về Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

