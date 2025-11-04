"use client";
import React, { useState } from "react";
import { apiService } from "@/services/api";
import { ForgotPasswordResponse } from "@/types";
import { Mail, Send } from "lucide-react";
import { useRouter } from "next/navigation";

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ForgotPasswordResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await apiService.forgotPassword(email);
      setResult(response);
      
      // Nếu có code được trả về, tự động chuyển sang trang reset password
      if (response.Code) {
        // Lưu email và code vào URL params để trang reset password có thể sử dụng
        const params = new URLSearchParams({
          email: email,
          code: response.Code,
        });
        
        // Chờ một chút để user thấy thông báo thành công
        setTimeout(() => {
          router.push(`/reset-password?${params.toString()}`);
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to request password reset");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to receive a reset code
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">{error}</div>
          )}
          {result && (
            <div className={`${result.Code ? 'bg-green-50 border-green-200 text-green-600' : 'bg-yellow-50 border-yellow-200 text-yellow-700'} border px-4 py-3 rounded-md text-sm`}>
              <div><b>Message:</b> {result.Message}</div>
              {result.Code ? (
                <>
                  <div className="mt-2">
                    <b>Reset Code:</b>{" "}
                    <span className="text-blue-700 font-mono">{result.Code}</span>
                  </div>
                  <div className="mt-2 text-xs italic">
                    Redirecting to reset password page...
                  </div>
                </>
              ) : (
                <div className="mt-2 text-xs">
                  Email not found in the system. Please check your email address or contact support.
                </div>
              )}
            </div>
          )}
          <div className="space-y-4">
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
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
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
                  Sending code...
                </div>
              ) : (
                <><Send className="h-4 w-4 mr-2 inline" />Send code</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
