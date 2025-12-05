"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginRequest } from "@/types";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
}) => {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  // Load Google Identity Services script once on mount
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
    script.onload = () => {
      setIsGoogleReady(true);
    };
    script.onerror = () => {
      setIsGoogleReady(false);
    };
    document.head.appendChild(script);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(formData);

      // Force redirect immediately - no timeout needed
      const raw = localStorage.getItem("user");
      console.log("Raw user data from localStorage:", raw);
      if (raw) {
        const parsed = JSON.parse(raw);
        console.log("Parsed user data:", parsed);
        console.log("User role:", parsed?.role);
        // Both admin and user go to user-dashboard
        console.log("Redirecting to user dashboard");
        window.location.href = "/user-dashboard";
      } else {
        console.log("No user data, redirecting to dashboard");
        window.location.href = "/user-dashboard";
      }
    } catch (error: any) {
      setError(error.message || "Login failed. Please try again.");
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

  const handleGoogleLogin = async () => {
    try {
      if (typeof window === "undefined") return;
      setIsLoading(true);
      setError(null);

      const google = (window as any).google;
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      // Nếu thiếu cấu hình hoặc SDK chưa sẵn sàng -> chỉ báo lỗi, không yêu cầu user nhập IdToken
      if (!clientId || !isGoogleReady || !google?.accounts?.id) {
        setError(
          "Google Login chưa được cấu hình đầy đủ trên hệ thống. Vui lòng liên hệ admin để cấu hình Google Client ID."
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
            await loginWithGoogle(idToken);
            window.location.href = "/user-dashboard";
          } catch (err: any) {
            setError(err?.message || "Google login failed. Please try again.");
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
            setError("Lỗi đăng nhập Google: " + (error.message || "Unknown error"));
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
              document.getElementById("google-login-button") || document.body,
              {
                theme: "outline",
                size: "large",
                text: "signin_with",
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
      console.error("Google login error:", err);
      setError(err?.message || "Google login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <LogIn className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to SmartHome
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Manage your smart home devices
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
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
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
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </div>

          {/* Google Login */}
          <div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                  Đang xử lý...
                </div>
              ) : (
                "Đăng nhập với Google"
              )}
            </button>
            {/* Placeholder cho Google button nếu prompt fail */}
            <div id="google-login-button" className="hidden"></div>
          </div>

          {onSwitchToRegister && (
            <div className="text-center">
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                Don&apos;t have an account? Sign up
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
