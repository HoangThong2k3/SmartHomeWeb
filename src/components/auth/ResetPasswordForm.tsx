"use client";
import React, { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { ResetPasswordRequest } from "@/types";
import { Lock, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export const ResetPasswordForm: React.FC = () => {
  const router = useRouter();
  const [form, setForm] = useState<ResetPasswordRequest & { confirm: string }>({
    Email: "",
    Code: "",
    NewPassword: "",
    confirm: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Tự động điền email và code từ URL params khi vào trang
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get("email");
      const codeParam = params.get("code");
      
      if (emailParam) {
        setForm((prev) => ({ ...prev, Email: emailParam }));
      }
      if (codeParam) {
        setForm((prev) => ({ ...prev, Code: codeParam }));
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (form.NewPassword !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.NewPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    setIsLoading(true);
    try {
      await apiService.resetPassword(form);
      setSuccess("Password reset successful! Redirecting to login...");
      
      // Sau khi reset thành công, chuyển về trang login sau 2 giây
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-yellow-100">
            <Lock className="h-6 w-6 text-yellow-700" />
          </div>
          <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the code sent to your email and set a new password
          </p>
          {form.Email && (
            <p className="mt-1 text-center text-xs text-gray-500">
              Resetting password for: <span className="font-medium">{form.Email}</span>
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">{error}</div>}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
              <CheckCheck className="h-4 w-4 mr-1" /> {success}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="Email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                id="Email"
                name="Email"
                type="email"
                autoComplete="email"
                required
                value={form.Email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="Code" className="block text-sm font-medium text-gray-700">Reset Code</label>
              <input
                id="Code"
                name="Code"
                type="text"
                required
                value={form.Code}
                autoComplete="one-time-code"
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter the reset code"
              />
            </div>
            <div>
              <label htmlFor="NewPassword" className="block text-sm font-medium text-gray-700">New Password</label>
              <div className="mt-1 relative">
                <input
                  id="NewPassword"
                  name="NewPassword"
                  type={showPwd ? "text" : "password"}
                  required
                  value={form.NewPassword}
                  autoComplete="new-password"
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPwd(!showPwd)}
                >
                  {showPwd ? (
                    <Lock className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-300" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="mt-1 relative">
                <input
                  id="confirm"
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  required
                  value={form.confirm}
                  autoComplete="new-password"
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? (
                    <Lock className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-300" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Resetting...
                </div>
              ) : (
                <>Reset Password</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
