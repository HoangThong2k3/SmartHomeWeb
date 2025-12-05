"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Clock, Home } from "lucide-react";

interface WelcomeScreenProps {
  userName?: string;
  homeName?: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  userName,
  homeName = "Ngôi nhà của tôi",
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        {/* Header với icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6">
            <Home className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Chào mừng {userName || "bạn"}!
          </h1>
        </div>

        {/* Nội dung chính */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg text-gray-800 leading-relaxed">
                Yêu cầu của bạn đã được ghi nhận. Đội ngũ kỹ thuật sẽ tiến hành
                lắp đặt hệ thống <span className="font-semibold text-blue-700">"{homeName}"</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Trạng thái */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-yellow-600 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-yellow-800 uppercase tracking-wide">
                Trạng thái hiện tại
              </p>
              <p className="text-xl font-bold text-yellow-900 mt-1">
                Đang cài đặt
              </p>
            </div>
          </div>
        </div>

        {/* Thông tin bổ sung */}
        <div className="space-y-4 text-gray-600">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <p className="text-sm">
              Đội ngũ kỹ thuật của chúng tôi sẽ liên hệ với bạn trong thời gian
              sớm nhất để sắp xếp lịch lắp đặt.
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <p className="text-sm">
              Sau khi hoàn tất lắp đặt, bạn sẽ nhận được thông báo và có thể bắt
              đầu sử dụng hệ thống ngay lập tức.
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <p className="text-sm">
              Trong thời gian này, bạn chưa thể tương tác với các tính năng quản
              lý nhà thông minh.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Cảm ơn bạn đã tin tưởng và lựa chọn dịch vụ của chúng tôi!
          </p>
        </div>
      </div>
    </div>
  );
};

