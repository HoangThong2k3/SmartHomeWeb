"use client";

import React from "react";
import UserNavigation from "@/components/layout/UserNavigation";
import Header from "@/components/layout/Header";

interface UserLayoutProps {
  children: React.ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <UserNavigation />
        </div>

        {/* Main Content with top header */}
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
