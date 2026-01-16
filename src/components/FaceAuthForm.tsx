 "use client";

import React, { useState } from "react";
import { apiService } from "@/services/api";

export default function FaceAuthForm({ userId }: { userId?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!file) return setError("Chọn ảnh trước khi xác thực");
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await apiService.verifyFace(form);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || "Lỗi xác thực");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!file || !userId) return setError("Cần userId và ảnh để đăng ký");
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("Image", file);
      const res = await apiService.registerFace(userId, form);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || "Lỗi đăng ký khuôn mặt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pkg-card">
      <h3 className="text-lg font-bold mb-3">Xác thực khuôn mặt</h3>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <div className="flex gap-3 mt-3">
        <button onClick={handleVerify} disabled={loading || !file} className="btn-hero">Verify</button>
        <button onClick={handleRegister} disabled={loading || !file || !userId} className="btn">Register</button>
      </div>
      {error && <div className="mt-3 text-red-600">{error}</div>}
      {result && <pre className="mt-3 text-sm">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );


