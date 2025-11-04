"use client";

import { useState } from "react";

export default function QuoteForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    zipCode: "",
    serviceInterest: "",
    propertyType: "",
    additionalInfo: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus("success");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        zipCode: "",
        serviceInterest: "",
        propertyType: "",
        additionalInfo: "",
      });
      setTimeout(() => setSubmitStatus("idle"), 5000);
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Họ và tên <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          required
          value={formData.fullName}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Nhập họ và tên của bạn"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Địa chỉ email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Số điện thoại <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          required
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="0123 456 789"
        />
      </div>

      <div>
        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
          Mã bưu điện <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="zipCode"
          name="zipCode"
          required
          value={formData.zipCode}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="10000"
        />
      </div>

      <div>
        <label htmlFor="serviceInterest" className="block text-sm font-medium text-gray-700 mb-1">
          Gói dịch vụ quan tâm <span className="text-red-500">*</span>
        </label>
        <select
          id="serviceInterest"
          name="serviceInterest"
          required
          value={formData.serviceInterest}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Chọn gói dịch vụ</option>
          <option value="basic">Gói Cơ bản - Giám sát và cảnh báo</option>
          <option value="standard">Gói Tiêu chuẩn - Giám sát + Điều khiển</option>
          <option value="premium">Gói Cao cấp - Giám sát + Điều khiển + Tự động hóa</option>
          <option value="enterprise">Gói Doanh nghiệp - Giải pháp toàn diện</option>
        </select>
      </div>

      <div>
        <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
          Loại bất động sản <span className="text-red-500">*</span>
        </label>
        <select
          id="propertyType"
          name="propertyType"
          required
          value={formData.propertyType}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Chọn loại bất động sản</option>
          <option value="house">Nhà riêng</option>
          <option value="apartment">Căn hộ</option>
          <option value="villa">Biệt thự</option>
          <option value="office">Văn phòng</option>
          <option value="shop">Cửa hàng</option>
          <option value="warehouse">Kho bãi</option>
        </select>
      </div>

      <div>
        <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
          Thông tin bổ sung (Tùy chọn)
        </label>
        <textarea
          id="additionalInfo"
          name="additionalInfo"
          rows={4}
          value={formData.additionalInfo}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Cho chúng tôi biết về các mối quan tâm an ninh cụ thể hoặc yêu cầu của bạn..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin">⏳</span>
            Đang gửi...
          </>
        ) : (
          <>
            <span>📧</span>
            Gửi yêu cầu báo giá
          </>
        )}
      </button>

      {submitStatus === "success" && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          ✓ Yêu cầu của bạn đã được gửi thành công! Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ.
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        Bằng cách gửi biểu mẫu này, bạn đồng ý nhận thông tin liên lạc từ SmartHome liên quan đến yêu cầu báo giá của bạn. Chúng tôi tôn trọng quyền riêng tư của bạn và sẽ không bao giờ chia sẻ thông tin của bạn.
      </p>
    </form>
  );
}

