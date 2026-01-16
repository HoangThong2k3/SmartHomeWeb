 "use client";

import React, { useState, useRef } from "react";
import { apiService } from "@/services/api";
import { FaceRegisterResponse, FaceVerifyResponse } from "@/types";
import { Camera, Upload, User, Home, CheckCircle, XCircle } from "lucide-react";

interface FaceAuthFormProps {
  mode: "register" | "verify";
}

export default function FaceAuthForm({ mode }: FaceAuthFormProps) {
  // Common states
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FaceRegisterResponse | FaceVerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Register form states - simplified
  const [registerForm, setRegisterForm] = useState({
    homeId: "",
    memberName: "",
    relation: "",
  });

  // Verify form states - simplified
  const [verifyForm, setVerifyForm] = useState({
    homeId: "",
    eventType: "RECOGNIZED" as "RECOGNIZED" | "INTRUDER" | "UNKNOWN",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Create video element for capture
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Create canvas for snapshot
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Wait for video to load
      await new Promise(resolve => video.onloadedmetadata = resolve);

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          setImageFile(file);
          setImagePreview(canvas.toDataURL());
        }
      }, 'image/jpeg', 0.8);

      // Stop camera stream
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      setError("Không thể truy cập camera: " + (err as Error).message);
    }
  };

  const handleRegister = async () => {
    if (!imageFile) return setError("Vui lòng chọn ảnh khuôn mặt");
    if (!registerForm.memberName) {
      return setError("Vui lòng nhập tên thành viên");
    }

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      // For demo purposes, use default homeId if not specified
      const data = {
        homeId: parseInt(registerForm.homeId) || 1,
        memberName: registerForm.memberName,
        relation: registerForm.relation || undefined,
        image: imageFile,
        userId: undefined, // Let backend handle user association
      };

      const res = await apiService.registerFace(data);
      setResult(res);

      // Reset form on success
      setRegisterForm({ homeId: "", memberName: "", relation: "" });
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err?.message || "Không thể đăng ký khuôn mặt. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!imageFile) return setError("Vui lòng chọn ảnh khuôn mặt");

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      // For demo purposes, use default values
      const data = {
        homeId: parseInt(verifyForm.homeId) || 1,
        deviceId: undefined, // Let backend handle device association
        eventType: verifyForm.eventType,
        image: imageFile,
      };

      const res = await apiService.verifyFace(data);
      setResult(res);

      // Reset form on success
      setVerifyForm({ homeId: "", eventType: "RECOGNIZED" });
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err?.message || "Không thể xác thực khuôn mặt. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setError(null);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (mode === "register") {
      setRegisterForm({ homeId: "", memberName: "", relation: "" });
    } else {
      setVerifyForm({ homeId: "", eventType: "RECOGNIZED" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Image Upload */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
            <span className="text-blue-600 font-semibold text-sm">1</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === "register" ? "Chụp ảnh khuôn mặt" : "Chọn ảnh để xác thực"}
          </h3>
        </div>

        {!imageFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-600 mb-4">
                  {mode === "register"
                    ? "Chụp ảnh khuôn mặt rõ nét của thành viên gia đình"
                    : "Chọn ảnh khuôn mặt cần xác thực"
                  }
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleCameraCapture}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    Chụp từ Camera
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Tải từ Máy
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img
              src={imagePreview!}
              alt="Selected"
              className="w-full max-w-sm mx-auto rounded-xl border-2 border-green-200"
            />
            <button
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Basic Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
            <span className="text-blue-600 font-semibold text-sm">2</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === "register" ? "Thông tin thành viên" : "Cài đặt xác thực"}
          </h3>
        </div>

        {mode === "register" ? (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên thành viên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={registerForm.memberName}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, memberName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ví dụ: Bố, Mẹ, Con trai"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mối quan hệ
              </label>
              <select
                value={registerForm.relation}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, relation: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn mối quan hệ (tùy chọn)</option>
                <option value="Father">Bố</option>
                <option value="Mother">Mẹ</option>
                <option value="Son">Con trai</option>
                <option value="Daughter">Con gái</option>
                <option value="Grandfather">Ông</option>
                <option value="Grandmother">Bà</option>
                <option value="Other">Khác</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại sự kiện
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "RECOGNIZED", label: "Người quen", desc: "Thành viên gia đình", color: "green" },
                  { value: "INTRUDER", label: "Xâm nhập", desc: "Người quen nhưng sai nhà", color: "orange" },
                  { value: "UNKNOWN", label: "Người lạ", desc: "Không có trong hệ thống", color: "red" }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setVerifyForm(prev => ({ ...prev, eventType: option.value as any }))}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      verifyForm.eventType === option.value
                        ? option.color === "green" ? "border-green-500 bg-green-50"
                          : option.color === "orange" ? "border-orange-500 bg-orange-50"
                          : "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full mb-2 ${
                      option.color === "green" ? "bg-green-500"
                      : option.color === "orange" ? "bg-orange-500"
                      : "bg-red-500"
                    }`}></div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Action */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
            <span className="text-blue-600 font-semibold text-sm">3</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === "register" ? "Hoàn thành đăng ký" : "Bắt đầu xác thực"}
          </h3>
        </div>

        <button
          onClick={mode === "register" ? handleRegister : handleVerify}
          disabled={loading || !imageFile || (mode === "register" && !registerForm.memberName)}
          className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Đang xử lý...
            </>
          ) : (
            <>
              {mode === "register" ? (
                <>
                  <User className="h-5 w-5" />
                  Đăng ký khuôn mặt
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Xác thực khuôn mặt
                </>
              )}
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <div className="font-medium text-red-800">Có lỗi xảy ra</div>
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <div className="font-semibold text-green-800">
                {mode === "register" ? "Đăng ký thành công!" : "Xác thực hoàn tất!"}
              </div>
              <div className="text-green-600 text-sm">
                {mode === "register"
                  ? "Khuôn mặt đã được lưu trữ trong hệ thống"
                  : "Hệ thống đã xử lý yêu cầu xác thực"
                }
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-200">
            {mode === "register" && (result as FaceRegisterResponse) ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tên thành viên:</span>
                  <span className="font-medium text-gray-900">{(result as FaceRegisterResponse).data.memberName}</span>
                </div>
                {(result as FaceRegisterResponse).data.relation && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mối quan hệ:</span>
                    <span className="font-medium text-gray-900">{(result as FaceRegisterResponse).data.relation}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">ID khuôn mặt:</span>
                  <span className="font-medium text-gray-900">{(result as FaceRegisterResponse).data.faceId}</span>
                </div>
              </div>
            ) : (result as FaceVerifyResponse) ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kết quả:</span>
                  <span className={`font-medium ${(result as FaceVerifyResponse).data.isAuthorized ? 'text-green-600' : 'text-red-600'}`}>
                    {(result as FaceVerifyResponse).data.isAuthorized ? '✅ Được phép truy cập' : '❌ Từ chối truy cập'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hành động:</span>
                  <span className="font-medium text-gray-900">{(result as FaceVerifyResponse).data.action}</span>
                </div>
                {(result as FaceVerifyResponse).data.memberName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Người nhận diện:</span>
                    <span className="font-medium text-gray-900">{(result as FaceVerifyResponse).data.memberName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Độ tin cậy:</span>
                  <span className="font-medium text-gray-900">{(result as FaceVerifyResponse).data.confidence}%</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

