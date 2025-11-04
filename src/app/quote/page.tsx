import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuoteForm from "@/components/QuoteForm";

export default function QuotePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* REQUEST A FREE QUOTE SECTION */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Hero Header */}
          <div className="bg-gray-900 text-white rounded-lg p-12 mb-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-gray-900 opacity-90"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Yêu cầu báo giá miễn phí</h2>
              <p className="text-xl text-gray-200">Nhận báo giá hệ thống an ninh cá nhân hóa trong vòng 24 giờ hoặc ít hơn</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Column - Why Request a Quote */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Tại sao nên yêu cầu báo giá?</h3>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl flex-shrink-0">✓</span>
                  <span className="text-gray-700">Tư vấn tại nhà miễn phí</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl flex-shrink-0">✓</span>
                  <span className="text-gray-700">Kế hoạch an ninh tùy chỉnh</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl flex-shrink-0">✓</span>
                  <span className="text-gray-700">Giá cả minh bạch</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl flex-shrink-0">✓</span>
                  <span className="text-gray-700">Không ràng buộc</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl flex-shrink-0">✓</span>
                  <span className="text-gray-700">Khuyến nghị từ chuyên gia</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl flex-shrink-0">✓</span>
                  <span className="text-gray-700">Phản hồi trong ngày</span>
                </li>
              </ul>
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-700 mb-2">Hoặc gọi cho chúng tôi ngay:</p>
                <a href="tel:0123456789" className="text-blue-600 font-bold text-xl">0123 456 789</a>
              </div>
            </div>

            {/* Right Column - Quote Request Form */}
            <div className="bg-gray-50 rounded-lg p-8">
              <QuoteForm />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

