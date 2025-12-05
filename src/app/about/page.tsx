import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* ABOUT US SECTION */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">Về SmartHome</h2>
          <p className="text-xl text-gray-300 text-center mb-16">
            Bảo vệ các gia đình Việt Nam bằng giải pháp an ninh nhà thông minh tiên tiến từ năm 2025
          </p>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div className="bg-gray-800 rounded-lg p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-600 rounded-full p-3">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold">Sứ mệnh của chúng tôi</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Sứ mệnh của SmartHome là cung cấp sự an tâm cho chủ nhà ở Việt Nam thông qua các giải pháp an ninh nhà thông minh hiện đại, đáng tin cậy, dễ sử dụng và giá cả phải chăng. Chúng tôi cam kết cung cấp dịch vụ lắp đặt chuyên nghiệp, dịch vụ khách hàng xuất sắc và giá cả hợp lý để mọi gia đình đều có thể tiếp cận công nghệ bảo vệ tiên tiến.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-600 rounded-full p-3">
                  <span className="text-2xl">👁️</span>
                </div>
                <h3 className="text-2xl font-bold">Tầm nhìn của chúng tôi</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Tầm nhìn của SmartHome là trở thành tên tuổi đáng tin cậy nhất trong lĩnh vực an ninh nhà thông minh ở Việt Nam, hướng tới một tương lai nơi mọi ngôi nhà đều được trang bị hệ thống an ninh thông minh bảo vệ khỏi các mối đe dọa và nâng cao cuộc sống hàng ngày thông qua tự động hóa liền mạch và sự an tâm.
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-blue-600 rounded-lg p-12 mb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold mb-2">5,000+</div>
                <div className="text-blue-100">Ngôi nhà được bảo vệ</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">15+</div>
                <div className="text-blue-100">Năm kinh nghiệm</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">4.9/5</div>
                <div className="text-blue-100">Đánh giá khách hàng</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">24/7</div>
                <div className="text-blue-100">Hỗ trợ khách hàng</div>
              </div>
            </div>
          </div>

          {/* Core Values */}
          <div className="mb-20">
            <h3 className="text-3xl font-bold text-center mb-2">Giá trị cốt lõi của chúng tôi</h3>
            <p className="text-center text-gray-300 mb-12">Những nguyên tắc định hướng mọi hoạt động của chúng tôi</p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="bg-blue-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl">🛡️</span>
                </div>
                <h4 className="text-xl font-bold mb-3">An toàn là trên hết</h4>
                <p className="text-gray-300">An ninh gia đình bạn là ưu tiên hàng đầu của chúng tôi. Chúng tôi cung cấp công nghệ tiên tiến, đáng tin cậy.</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="bg-blue-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl">⭐</span>
                </div>
                <h4 className="text-xl font-bold mb-3">Xuất sắc</h4>
                <p className="text-gray-300">Chúng tôi duy trì các tiêu chuẩn cao nhất về sản phẩm, dịch vụ và hỗ trợ khách hàng.</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="bg-blue-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl">👥</span>
                </div>
                <h4 className="text-xl font-bold mb-3">Lấy khách hàng làm trung tâm</h4>
                <p className="text-gray-300">Mọi giải pháp đều được tùy chỉnh để đáp ứng nhu cầu và ngân sách cụ thể của bạn.</p>
              </div>
            </div>
          </div>

          {/* Trusted & Certified */}
          <div className="mb-20">
            <h3 className="text-3xl font-bold text-center mb-2">Đáng tin cậy & Được chứng nhận</h3>
            <p className="text-center text-gray-300 mb-12">Chúng tôi duy trì các tiêu chuẩn và chứng nhận ngành cao nhất</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="bg-green-500 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <p className="font-semibold">Được cấp phép & Bảo hiểm</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="bg-green-500 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <p className="font-semibold">Xếp hạng A+</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="bg-green-500 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <p className="font-semibold">Kỹ thuật viên được chứng nhận</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="bg-green-500 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <p className="font-semibold">Thiết bị đạt chuẩn</p>
              </div>
            </div>
          </div>

          {/* Why Choose */}
          <div>
            <h3 className="text-3xl font-bold text-center mb-12">Tại sao chọn SmartHome?</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <h4 className="text-xl font-bold mb-3">Chuyên môn địa phương</h4>
                <p className="text-gray-300">Công ty có trụ sở tại Việt Nam, hiểu rõ cộng đồng và cam kết giữ an toàn cho các gia đình Việt Nam.</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <h4 className="text-xl font-bold mb-3">Công nghệ tiên tiến</h4>
                <p className="text-gray-300">Hợp tác với các nhà lãnh đạo ngành để mang đến công nghệ an ninh nhà thông minh mới nhất, từ camera AI đến tích hợp tự động hóa nhà liền mạch.</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <h4 className="text-xl font-bold mb-3">Lắp đặt chuyên nghiệp</h4>
                <p className="text-gray-300">Đội ngũ kỹ thuật viên được chứng nhận đảm bảo hệ thống được lắp đặt chính xác và tối ưu, đồng thời hướng dẫn bạn về hệ thống mới.</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <h4 className="text-xl font-bold mb-3">Hỗ trợ liên tục</h4>
                <p className="text-gray-300">Chúng tôi cung cấp dịch vụ hỗ trợ 24/7 để đảm bảo hệ thống của bạn luôn hoạt động tối ưu và bạn luôn được hỗ trợ khi cần.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

