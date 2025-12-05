import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center gap-8 md:gap-20">
        <div className="flex-1 text-left">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-semibold">SmartHome Solutions</span>
            <span className="text-blue-400 text-xl">🔒</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-gray-900 leading-tight">
            Bảo vệ ngôi nhà thông minh <span className="text-blue-600">của bạn</span> với giải pháp tiên tiến nhất
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg">
            Hệ thống IoT thông minh: điều khiển thiết bị từ xa, tự động hóa ngôi nhà, giám sát cảm biến real-time với giao diện quản lý hiện đại.
          </p>
          <Link href="/quote" className="inline-block px-6 py-3 rounded-lg bg-blue-600 text-white shadow-md font-semibold text-lg hover:bg-blue-700 transition">Nhận báo giá miễn phí</Link>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-blue-100 group hover:shadow-blue-200/50 transition-all">
            <Image 
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop" 
              alt="Smart Home System" 
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* IoT SMART HOME SYSTEM SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row-reverse gap-12 items-center">
        <div className="flex-1">
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-xl border-2 border-gray-200 group hover:shadow-2xl transition-shadow">
            <Image 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&auto=format&fit=crop" 
              alt="IoT Smart Home Control Panel" 
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex gap-3 items-center mb-3">
            <span className="bg-blue-100 text-blue-700 rounded-full p-2 text-xl"><span role="img" aria-label="iot">🔌</span></span>
            <span className="font-bold text-lg text-gray-800">Hệ Thống IoT SmartHome</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Điều khiển toàn bộ ngôi nhà thông minh từ xa, tự động hóa hoàn hảo</h2>
          <ul className="space-y-2 text-gray-700 mb-6">
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span>Điều khiển đèn, điều hòa, rèm cửa qua ứng dụng</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span>Cảm biến thông minh: nhiệt độ, độ ẩm, chuyển động</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span>Tự động hóa theo kịch bản và lịch trình</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span>Quản lý thiết bị theo phòng và nhà</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span>Giám sát dữ liệu cảm biến real-time</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span>Kết nối đa thiết bị, tích hợp mở rộng dễ dàng</li>
          </ul>
          <Link
            href="/login"
            className="inline-block mt-2 px-5 py-2 rounded bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition"
          >
            Khám phá hệ thống ngay
          </Link>
        </div>
      </section>

      {/* VIDEO DOORBELL SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-12 items-center">
        <div className="flex-1">
          <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden shadow-xl border-2 border-gray-200 group hover:shadow-2xl transition-shadow">
            <Image 
              src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&auto=format&fit=crop" 
              alt="Smart Video Doorbell" 
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/30 to-transparent"></div>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex gap-3 items-center mb-3">
            <span className="bg-blue-100 text-blue-700 rounded-full p-2 text-xl"><span role="img" aria-label="bell">🔔</span></span>
            <span className="font-bold text-lg text-gray-800">Smart Video Doorbells</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Theo dõi, nói chuyện với khách từ xa qua smartphone</h2>
          <ul className="space-y-2 text-gray-700 mb-6">
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span>Video HD ống kính góc rộng</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span>Giao tiếp 2 chiều</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span>Kích hoạt khi có chuyển động</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span>Nhận thông báo ngay lập tức</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span>Hoạt động ổn định cả khi mất mạng</li>
          </ul>
          <Link href="/quote" className="inline-block mt-2 px-5 py-2 rounded bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition">Nhận báo giá tùy chỉnh</Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
