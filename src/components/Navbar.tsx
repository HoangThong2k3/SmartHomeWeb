"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import logoSmartHome from "@/app/logo/logoSmartHome.png";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Trang chủ" },
    { href: "/about", label: "Về chúng tôi" },
    { href: "/quote", label: "Yêu cầu báo giá" },
  ];

  return (
    <nav className="sticky z-50 top-0 w-full bg-white shadow-sm py-3 px-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6">
        <div className="flex gap-2 items-center">
          <Link href="/" className="flex gap-2 items-center">
            <Image
              src={logoSmartHome}
              alt="Smart Home"
              width={36}
              height={36}
              className="rounded-md object-contain"
              priority
            />
            <span className="text-xl font-bold tracking-tight text-blue-700 select-none">SmartHome</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg font-medium transition ${
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Phone Number */}
          <div className="hidden lg:flex items-center gap-2 text-blue-600">
            <span className="text-xl">📞</span>
            <a href="tel:0768524415" className="font-semibold hover:underline">
              0768524415
            </a>
          </div>

          {/* Login Button */}
          <div>
            <Link
              href="/login"
              className="px-6 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow transition"
              title="Đăng nhập bằng tài khoản của bạn"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-600">
              <span>📞</span>
              <a href="tel:0768524415" className="font-semibold text-sm">
                0768524415
              </a>
            </div>
            <div className="flex gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      isActive
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

