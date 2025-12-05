"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { RegisterRequest } from "@/types";
import { Eye, EyeOff, UserPlus } from "lucide-react";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const { register, registerWithGoogle } = useAuth();
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
  }>({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  // Load Google Identity Services script once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("google-identity-script")) {
      setIsGoogleReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.id = "google-identity-script";
    script.onload = () => setIsGoogleReady(true);
    script.onerror = () => setIsGoogleReady(false);
    document.head.appendChild(script);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    if (formData.password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }
    // Match backend policy: at least one lowercase and one uppercase letter
    if (!/[a-z]/.test(formData.password) || !/[A-Z]/.test(formData.password)) {
      setError(
        "Password must contain at least one lowercase (a-z) and one uppercase (A-Z) letter"
      );
      setIsLoading(false);
      return;
    }
    if (formData.phoneNumber && !formData.phoneNumber.startsWith("+")) {
      setError("Phone number must start with + (e.g., +84123456789)");
      setIsLoading(false);
      return;
    }
    try {
      await register(formData as any); // api layer đã map đúng field
      alert("Đăng ký thành công! Bạn sẽ được chuyển đến trang đăng nhập.");
      onSuccess?.();
    } catch (error: any) {
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleRegister = async () => {
    try {
      if (typeof window === "undefined") return;
      setIsLoading(true);
      setError(null);

      const google = (window as any).google;
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      // Nếu thiếu cấu hình hoặc SDK chưa sẵn sàng -> chỉ báo lỗi, không yêu cầu user nhập IdToken
      if (!clientId || !isGoogleReady || !google?.accounts?.id) {
        setError(
          "Google Register chưa được cấu hình đầy đủ trên hệ thống. Vui lòng liên hệ admin để cấu hình Google Client ID."
        );
        setIsLoading(false);
        return;
      }

      let handled = false;

      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          if (handled) return;
          handled = true;
          try {
            const idToken = response.credential;
            if (!idToken) {
              setError("Không nhận được Google ID Token.");
              setIsLoading(false);
              return;
            }
            await registerWithGoogle(
              idToken,
              formData.name || undefined,
              formData.phoneNumber || undefined
            );
            alert("Đăng ký bằng Google thành công! Bạn sẽ được chuyển đến trang đăng nhập.");
            onSuccess?.();
          } catch (err: any) {
            setError(err?.message || "Google registration failed. Please try again.");
            setIsLoading(false);
          }
        },
        auto_select: false,
        error_callback: (error: any) => {
          console.error("Google Identity Services error:", error);
          if (handled) return;
          handled = true;
          setIsLoading(false);
          if (error.type === "popup_failed" || error.type === "popup_closed") {
            setError("Popup Google đã bị đóng. Vui lòng thử lại.");
          } else if (error.type === "idp_error") {
            setError("Lỗi cấu hình Google OAuth. Vui lòng kiểm tra Google Client ID và Authorized JavaScript origins trong Google Cloud Console.");
          } else {
            setError("Lỗi đăng ký Google: " + (error.message || "Unknown error"));
          }
        },
      });

      // Mở hộp thoại chọn tài khoản Google
      try {
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Nếu prompt không hiển thị, thử dùng One Tap
            console.log("Prompt not displayed, trying One Tap...");
            google.accounts.id.renderButton(
              document.getElementById("google-register-button") || document.body,
              {
                theme: "outline",
                size: "large",
                text: "signup_with",
                width: 300,
              }
            );
          }
        });
      } catch (promptError: any) {
        console.error("Error showing Google prompt:", promptError);
        setError("Không thể mở popup Google. Vui lòng kiểm tra cấu hình Google Client ID.");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Google register error:", err);
      setError(err?.message || "Google registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
            <UserPlus className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your SmartHome account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Start managing your smart home devices
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-4"> 
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                value={formData.phoneNumber || ""}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                "Create account"
              )}
            </button>
          </div>

          {/* Google Register */}
          <div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleRegister}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                  Đang xử lý...
                </div>
              ) : (
                "Đăng ký bằng Google"
              )}
            </button>
            {/* Placeholder cho Google button nếu prompt fail */}
            <div id="google-register-button" className="hidden"></div>
          </div>
          {onSwitchToLogin && (
            <div className="text-center">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                Already have an account? Sign in
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
