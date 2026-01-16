"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Shield, Home, Users, Camera } from "lucide-react";
import FaceAuthForm from "@/components/FaceAuthForm";

export default function FaceAuthPage() {
  const [activeMode, setActiveMode] = useState<"register" | "verify">("register");
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 mb-6 inline-flex items-center gap-2 font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            Quay lại
          </button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Camera className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Nhận Diện Khuôn Mặt
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Bảo vệ ngôi nhà của bạn với công nghệ nhận diện khuôn mặt thông minh.
              Đăng ký khuôn mặt thành viên và giám sát truy cập một cách an toàn.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Register Card */}
          <div
            className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 cursor-pointer ${
              activeMode === "register"
                ? "border-blue-500 shadow-blue-100"
                : "border-gray-200 hover:border-blue-300 hover:shadow-md"
            }`}
            onClick={() => setActiveMode("register")}
          >
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-xl ${
                  activeMode === "register" ? "bg-blue-100" : "bg-gray-100"
                }`}>
                  <UserPlus className={`h-8 w-8 ${
                    activeMode === "register" ? "text-blue-600" : "text-gray-600"
                  }`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Đăng Ký Khuôn Mặt</h3>
                  <p className="text-gray-600">Thêm thành viên gia đình vào hệ thống</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Chụp ảnh khuôn mặt rõ nét
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Nhập thông tin thành viên
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Lưu trữ an toàn trong hệ thống
                </div>
              </div>

              {activeMode === "register" && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <FaceAuthForm mode="register" />
                </div>
              )}
            </div>
          </div>

          {/* Verify Card */}
          <div
            className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 cursor-pointer ${
              activeMode === "verify"
                ? "border-blue-500 shadow-blue-100"
                : "border-gray-200 hover:border-blue-300 hover:shadow-md"
            }`}
            onClick={() => setActiveMode("verify")}
          >
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-xl ${
                  activeMode === "verify" ? "bg-blue-100" : "bg-gray-100"
                }`}>
                  <Shield className={`h-8 w-8 ${
                    activeMode === "verify" ? "text-blue-600" : "text-gray-600"
                  }`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Xác Thực Khuôn Mặt</h3>
                  <p className="text-gray-600">Kiểm tra và giám sát truy cập</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Camera tự động chụp ảnh
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  AI phân tích và nhận diện
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Tự động cấp quyền truy cập
                </div>
              </div>

              {activeMode === "verify" && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <FaceAuthForm mode="verify" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Tại Sao Chọn Nhận Diện Khuôn Mặt?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Bảo Mật Cao</h3>
              <p className="text-gray-600 text-sm">
                Công nghệ AI tiên tiến đảm bảo chỉ người được ủy quyền mới có thể truy cập
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Dễ Sử Dụng</h3>
              <p className="text-gray-600 text-sm">
                Thiết lập đơn giản, hệ thống tự động học và cải thiện theo thời gian
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Gia Đình An Toàn</h3>
              <p className="text-gray-600 text-sm">
                Bảo vệ tất cả thành viên gia đình với công nghệ giám sát 24/7
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
