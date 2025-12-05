"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { ShoppingCart, AlertCircle, CheckCircle } from "lucide-react";
import { WelcomeScreen } from "@/components/WelcomeScreen";

interface ServiceGuardProps {
  children: React.ReactNode;
}

export const ServiceGuard: React.FC<ServiceGuardProps> = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.role === "customer") {
        try {
          const userData = await apiService.getCurrentUser();
          setCurrentUser(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Admin không cần kiểm tra service
  if (user?.role === "admin") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Kiểm tra serviceStatus
  const hasNoService =
    !currentUser?.serviceStatus ||
    currentUser.serviceStatus === "Chưa có dịch vụ" ||
    currentUser.serviceStatus.includes("Chưa") ||
    currentUser.serviceStatus === null ||
    currentUser.serviceStatus === undefined;

  const isInstalling =
    currentUser?.serviceStatus === "Đang cài đặt" ||
    currentUser?.serviceStatus.includes("Đang cài đặt");

  // Nếu chưa có dịch vụ hoặc đang cài đặt, hiển thị thông báo
  if (hasNoService) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-12 w-12 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bạn chưa đăng ký dịch vụ Nhà thông minh
              </h2>
              <p className="text-gray-700 mb-6">
                Để sử dụng các tính năng quản lý nhà thông minh, vui lòng đăng ký dịch vụ của chúng tôi.
                Sau khi thanh toán, đội ngũ kỹ thuật sẽ liên hệ để cài đặt hệ thống cho bạn.
              </p>
              <button
                onClick={() => router.push("/subscribe")}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Đăng ký Dịch vụ Nhà thông minh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isInstalling) {
    return (
      <WelcomeScreen
        userName={user?.name || user?.fullName || user?.email}
        homeName="Ngôi nhà của tôi"
      />
    );
  }

  // Có dịch vụ, cho phép truy cập
  return <>{children}</>;
};

