"use client";

import React, { useEffect, useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export function AuthPage() {
  const pathname = usePathname();
  const [isLogin, setIsLogin] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      const role = (user.role || "").toLowerCase();
      const dest = role === "admin" ? "/admin" : "/user-dashboard";
      window.location.href = dest;
    }
  }, [isAuthenticated, user, router]);

  // useEffect này sẽ bị loại bỏ vì dùng useAuth ở phía trên đủ rồi. Chỉ khi isAuthenticated + user mới chuyển hướng!
  // useEffect(() => {
  //   const token = localStorage.getItem("authToken");
  //   const userData = localStorage.getItem("user");
  //
  //   if (token && userData) {
  //     try {
  //       const parsed = JSON.parse(userData);
  //       const role = (parsed?.role || '').toLowerCase();
  //       // Nếu đang ở /login hoặc /register thì mới chuyển trang, nếu đang trang khác thì không tự chuyển!
  //       if (window.location.pathname === "/login" || window.location.pathname === "/register") {
  //         const dest = role === "admin" ? "/" : "/user-dashboard";
  //         window.location.href = dest;
  //       }
  //     } catch (error) {
  //       // Invalid user data, stay on login
  //       localStorage.removeItem("authToken");
  //       localStorage.removeItem("user");
  //     }
  //   }
  //   // Nếu chưa đăng nhập, không tự động điều hướng nữa (để mở được trang login/register).
  // }, []);

  const handleAuthSuccess = () => {
    try {
      const role = (user?.role || "").toLowerCase();
      const dest = role === "admin" ? "/admin" : "/user-dashboard";
      window.location.href = dest;
    } catch (error) {
      window.location.href = "/user-dashboard";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg shadow-lg bg-white p-8">
        {pathname === "/register" ? (
          <RegisterForm />
        ) : pathname === "/forgot-password" ? (
          <ForgotPasswordForm />
        ) : pathname === "/reset-password" ? (
          <ResetPasswordForm />
        ) : (
          <LoginForm />
        )}
        <div className="mt-4 text-center">
          {pathname === "/register" ? (
            <>
              <span>Bạn đã có tài khoản?</span>{" "}
              <a href="/login" className="text-blue-600 hover:underline">Đăng nhập</a>
            </>
          ) : pathname === "/forgot-password" ? (
            <>
              <span>Quay lại đăng nhập?</span> <a href="/login" className="text-blue-600 hover:underline">Đăng nhập</a>
            </>
          ) : pathname === "/reset-password" ? (
            <>
              <span>Quay lại đăng nhập?</span> <a href="/login" className="text-blue-600 hover:underline">Đăng nhập</a>
            </>
          ) : (
            <>
              <span>Chưa có tài khoản?</span>{" "}
              <a href="/register" className="text-blue-600 hover:underline">Đăng ký</a>
              <br />
              <span>Bạn quên mật khẩu?</span>{" "}
              <a href="/forgot-password" className="text-blue-600 hover:underline">Quên mật khẩu</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
