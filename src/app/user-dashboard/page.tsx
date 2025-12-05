"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Home,
  Users,
  Settings,
  Bell,
  Search,
  Plus,
  Thermometer,
  Droplets,
  Sun,
  Zap,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Shield,
  ShieldCheck,
  ShieldOff,
  Edit,
  Activity,
  Eye,
} from "lucide-react";
import { Home as HomeType, Room, Device } from "@/types";
import UserLayout from "@/components/layout/UserLayout";
import Layout from "@/components/layout/Layout";
import Card from "@/components/ui/Card";
import { apiService } from "@/services/api";
import { useServiceAccess } from "@/hooks/useServiceAccess";

export default function UserDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    isActive: canUseService,
    isLoading: isServiceLoading,
    needsSubscription,
    isInstalling,
    serviceUser,
  } = useServiceAccess();
  const [homes, setHomes] = useState<HomeType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser =
    serviceUser ||
    (user?.role === "admin"
      ? {
          serviceStatus: "ADMIN",
          fullName: user.name,
          name: user.name,
        }
      : null);
  const [securityStatus, setSecurityStatus] = useState<"ARMED" | "DISARMED">("DISARMED");
  const [showSecurityConfirm, setShowSecurityConfirm] = useState(false);
  const [pendingSecurityStatus, setPendingSecurityStatus] = useState<"ARMED" | "DISARMED" | null>(null);
  
  // Refs để prevent infinite loop
  const hasFetchedRef = useRef<string | number | null>(null);
  const has403ErrorRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Nếu là customer và chưa mua gói, tự động điều hướng sang trang đăng ký dịch vụ
  useEffect(() => {
    if (!isServiceLoading && user?.role === "customer" && needsSubscription) {
      router.push("/subscribe");
    }
  }, [isServiceLoading, user, needsSubscription, router]);

  useEffect(() => {
    // Reset flags khi user thay đổi
    const currentUserId = user?.id || user?.userId;
    if (currentUserId && hasFetchedRef.current !== currentUserId) {
      hasFetchedRef.current = null;
      has403ErrorRef.current = false;
    }

    const fetchDashboardData = async () => {
      // Prevent multiple simultaneous calls
      if (isFetchingRef.current) {
        console.log("[UserDashboard] Already fetching, skipping...");
        return;
      }

      // Admin: Fetch tất cả homes trong hệ thống để quản lý platform (giống như homes/page.tsx và rooms/page.tsx)
      if (user?.role === "admin") {
        try {
          isFetchingRef.current = true;
          setIsLoading(true);
          
          console.log("[UserDashboard] Fetching all homes for admin dashboard");
          // Admin dùng getAllHomes() để xem tất cả homes trong hệ thống (quản lý platform)
          const allHomes = await apiService.getAllHomes();
          console.log("[UserDashboard] Admin fetched all homes:", allHomes?.length || 0);
          
          setHomes(allHomes || []);
          
          // Fetch rooms và devices cho tất cả homes (giống như rooms/page.tsx)
          const allRooms: Room[] = [];
          const allDevices: Device[] = [];
          
          for (const home of allHomes || []) {
            try {
              const homeRooms = await apiService.getRoomsByHome(home.id);
              allRooms.push(...(homeRooms || []));
              
              // Fetch devices cho tất cả phòng
              for (const room of homeRooms || []) {
                try {
                  const roomDevices = await apiService.getDevicesByRoom(room.id);
                  allDevices.push(...(roomDevices || []));
                } catch (err) {
                  console.error(`Error fetching devices for room ${room.id}:`, err);
                }
              }
            } catch (err) {
              console.error(`Error fetching rooms for home ${home.id}:`, err);
            }
          }
          
          setRooms(allRooms);
          setDevices(allDevices);
        } catch (error: any) {
          console.error("Error fetching admin dashboard data:", error);
          setHomes([]);
          setRooms([]);
          setDevices([]);
        } finally {
          setIsLoading(false);
          isFetchingRef.current = false;
        }
        return;
      }

      // Xác định trạng thái service trước khi dùng ở các nhánh bên dưới
      const hasValidService = serviceUser?.serviceStatus && 
        serviceUser.serviceStatus !== "Chưa có dịch vụ" && 
        !serviceUser.serviceStatus.includes("Chưa");

      // Reset 403 flag nếu user có service ACTIVE (có thể home chưa được tạo nhưng service đã active)
      // Chỉ skip nếu không có service hoặc đang loading
      if (has403ErrorRef.current && hasValidService && canUseService) {
        console.log("[UserDashboard] Resetting 403 flag - user has active service, retrying...");
        has403ErrorRef.current = false;
      } else if (has403ErrorRef.current && !hasValidService) {
        console.log("[UserDashboard] Previous 403 error detected and no valid service, skipping API call");
        setIsLoading(false);
        return;
      }

      // Chỉ fetch khi là customer, đã load xong service status, và có quyền sử dụng dịch vụ
      // Đảm bảo serviceStatus là "active" hoặc "Đang cài đặt" trước khi gọi API
      
      // Chỉ fetch một lần cho mỗi user
      const userId = user?.id || user?.userId;
      if (hasFetchedRef.current === userId) {
        console.log("[UserDashboard] Already fetched for this user, skipping...");
        return;
      }

      if (
        user?.role === "customer" && 
        !isServiceLoading && 
        canUseService && 
        userId &&
        hasValidService
      ) {
        try {
          isFetchingRef.current = true;
          setIsLoading(true);
          console.log("[UserDashboard] Fetching homes for customer with service:", serviceUser?.serviceStatus);
          
          // Fetch homes - use getMyHomes() to get homes from JWT token
          // Note: Backend sẽ tự động tạo home và rooms mặc định khi admin activate service
          // Frontend chỉ fetch và hiển thị, không tự động tạo
          // Chỉ Customer mới gọi API này
          const userHomes = await apiService.getMyHomes();
          console.log("[UserDashboard] Fetched homes:", userHomes?.length || 0);
          
          // Mark as fetched
          hasFetchedRef.current = userId || null;
          
          setHomes(userHomes || []);
          
          // Nếu có service ACTIVE nhưng không có home, reset 403 flag để có thể retry
          if (userHomes.length === 0 && hasValidService && serviceUser?.serviceStatus === "ACTIVE") {
            console.log("[UserDashboard] User has ACTIVE service but no homes. Admin may need to create home.");
            has403ErrorRef.current = false; // Reset để có thể retry sau
          }
          
          // Set security status từ home đầu tiên
          if (userHomes && userHomes.length > 0 && userHomes[0].securityStatus) {
            setSecurityStatus(userHomes[0].securityStatus as "ARMED" | "DISARMED");
          }
          
          // Fetch rooms và devices cho home đầu tiên (mỗi user chỉ có 1 nhà)
          if (userHomes && userHomes.length > 0) {
            const homeRooms = await apiService.getRoomsByHome(userHomes[0].id);
            setRooms(homeRooms || []);
            
            // Fetch devices cho tất cả phòng
            const allDevices: Device[] = [];
            for (const room of homeRooms || []) {
              try {
                const roomDevices = await apiService.getDevicesByRoom(room.id);
                allDevices.push(...(roomDevices || []));
              } catch (err) {
                console.error(`Error fetching devices for room ${room.id}:`, err);
              }
            }
            setDevices(allDevices);
          } else {
            setRooms([]);
            setDevices([]);
          }
        } catch (error: any) {
          console.error("Error fetching dashboard data:", error);
          
          // Nếu bị 403, mark để không gọi lại
          const errorMsg = (error?.message || "").toLowerCase();
          if (errorMsg.includes("403") || errorMsg.includes("forbidden")) {
            has403ErrorRef.current = true;
            console.log("[UserDashboard] 403 Forbidden detected, will not retry");
          }
          
          setHomes([]);
          setRooms([]);
          setDevices([]);
        } finally {
          setIsLoading(false);
          isFetchingRef.current = false;
        }
      } else {
        // Nếu chưa có service hoặc đang loading, không fetch homes
      setIsLoading(false);
        if (!hasFetchedRef.current) {
          setHomes([]);
          setRooms([]);
          setDevices([]);
        }
      }
    };

    // Chỉ fetch khi đã load xong service status và chưa fetch
    if (!isServiceLoading && !hasFetchedRef.current) {
      fetchDashboardData();
    } else if (isServiceLoading) {
      setIsLoading(true);
    }
  }, [user?.id, user?.role, canUseService, isServiceLoading, serviceUser?.serviceStatus]);

  // Hàm xử lý bật/tắt An ninh
  const handleToggleSecurity = (newStatus: "ARMED" | "DISARMED") => {
    setPendingSecurityStatus(newStatus);
    setShowSecurityConfirm(true);
  };

  const confirmSecurityChange = async () => {
    if (!pendingSecurityStatus || homes.length === 0) return;
    
    try {
      await apiService.updateHome(homes[0].id, {
        securityStatus: pendingSecurityStatus,
      });
      setSecurityStatus(pendingSecurityStatus);
      setHomes(prev => prev.map(h => 
        h.id === homes[0].id ? { ...h, securityStatus: pendingSecurityStatus } : h
      ));
      setShowSecurityConfirm(false);
      setPendingSecurityStatus(null);
    } catch (error) {
      console.error("Error updating security status:", error);
      alert("Không thể cập nhật trạng thái an ninh. Vui lòng thử lại.");
    }
  };

  // Hàm đổi tên nhà
  const handleRenameHome = async (newName: string) => {
    if (!homes.length || !newName.trim()) return;
    
    try {
      await apiService.updateHome(homes[0].id, { name: newName.trim() });
      setHomes(prev => prev.map(h => 
        h.id === homes[0].id ? { ...h, name: newName.trim() } : h
      ));
    } catch (error) {
      console.error("Error renaming home:", error);
      alert("Không thể đổi tên nhà. Vui lòng thử lại.");
    }
  };

  // Hàm đổi tên phòng
  const handleRenameRoom = async (roomId: string, newName: string) => {
    if (!newName.trim()) return;
    
    try {
      await apiService.updateRoom(roomId, { name: newName.trim() });
      setRooms(prev => prev.map(r => 
        r.id === roomId ? { ...r, name: newName.trim() } : r
      ));
    } catch (error) {
      console.error("Error renaming room:", error);
      alert("Không thể đổi tên phòng. Vui lòng thử lại.");
    }
  };

  // Lấy thông tin cảm biến cho phòng (mock data - cần tích hợp API thực tế)
  const getRoomSensorData = (roomId: string) => {
    const roomDevices = devices.filter(d => d.roomId === roomId);
    const dhtDevice = roomDevices.find(d => d.type === "dht");
    const pirDevice = roomDevices.find(d => d.type === "pir");
    
    return {
      temperature: dhtDevice ? "28°C" : "N/A",
      hasMotion: pirDevice ? (pirDevice.status === "online" ? "Có chuyển động" : "Không có chuyển động") : "N/A",
      airQuality: "Tốt", // Mock - cần lấy từ MQ2/MQ135
    };
  };

  // Use Layout with Sidebar for admin, UserLayout for regular users
  const DashboardContent = ({ showHeader = false }: { showHeader?: boolean }) => (
    <>
      {/* Header - only show for UserLayout */}
      {showHeader && (
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              </div>

              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <Search className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                </button>

                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{user?.email}</p>
                    <p className="text-gray-500 capitalize">{user?.role || "Customer"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className={showHeader ? "px-4 sm:px-6 lg:px-8 py-8" : ""}>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || "User"}!
          </h1>
          <p className="text-gray-600">
            Here&apos;s your smart home overview and quick controls.
          </p>
        </div>

        {/* Service Status Banner - Chỉ hiển thị cho customer chưa có dịch vụ */}
        {user?.role === "customer" && !isServiceLoading && needsSubscription && (
            <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 shadow-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Bạn chưa đăng ký dịch vụ Nhà thông minh
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Để sử dụng các tính năng quản lý nhà thông minh, vui lòng đăng ký dịch vụ của chúng tôi. 
                    Sau khi thanh toán, đội ngũ kỹ thuật sẽ liên hệ để cài đặt hệ thống cho bạn.
                  </p>
                  <button
                    onClick={() => router.push("/subscribe")}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Đăng ký Dịch vụ Nhà thông minh
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Màn hình chào mừng khi Đang cài đặt - Hiển thị toàn màn hình */}
        {user?.role === "customer" && !isServiceLoading && isInstalling && (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-2xl w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-2xl p-12 border-2 border-blue-200">
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                    <CheckCircle className="h-12 w-12 text-blue-600" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Chào mừng {currentUser?.fullName || currentUser?.name || user?.name || "bạn"}!
                </h1>
                <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
                  <p className="text-lg text-gray-700 leading-relaxed mb-4">
                    Yêu cầu của bạn đã được ghi nhận. Đội ngũ kỹ thuật sẽ tiến hành lắp đặt hệ thống <span className="font-semibold text-blue-600">&quot;Ngôi nhà của tôi&quot;</span>.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">Trạng thái hiện tại: Đang cài đặt</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Bạn sẽ được thông báo khi hệ thống sẵn sàng sử dụng. Trong thời gian này, bạn chưa thể tương tác với các tính năng quản lý nhà thông minh.
                </p>
              </div>
            </div>
        </div>
        )}

        {/* Dashboard chính - Chỉ hiển thị khi có dịch vụ */}
        {canUseService && (!needsSubscription || user?.role === "admin") && !isInstalling && (
          <>
            {/* Nút Toggle Hệ thống An ninh - Chỉ hiển thị khi có homes */}
            {homes.length > 0 && user?.role === "customer" && (
              <div className="mb-8 bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {securityStatus === "ARMED" ? (
                      <ShieldCheck className="h-8 w-8 text-red-600" />
                    ) : (
                      <ShieldOff className="h-8 w-8 text-gray-400" />
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Hệ thống An ninh
                  </h2>
                      <p className="text-sm text-gray-600">
                        {securityStatus === "ARMED" 
                          ? "Đã kích hoạt - Hệ thống đang bảo vệ ngôi nhà của bạn"
                          : "Chưa kích hoạt - Nhấn để bật hệ thống an ninh"}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securityStatus === "ARMED"}
                      onChange={() => handleToggleSecurity(securityStatus === "ARMED" ? "DISARMED" : "ARMED")}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Tên nhà với nút chỉnh sửa - Chỉ hiển thị khi có homes */}
            {homes.length > 0 && user?.role === "customer" && (
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Home className="h-6 w-6 text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-900">
                    {homes[0].name}
                  </h1>
                  <button
                    onClick={() => {
                      const newName = prompt("Nhập tên mới cho ngôi nhà:", homes[0].name);
                      if (newName && newName.trim()) {
                        handleRenameHome(newName);
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Chỉnh sửa tên"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Thẻ tóm tắt từng phòng */}
                {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Đang tải thông tin...</p>
                  </div>
                ) : homes.length === 0 ? (
              // Không có homes (cho cả admin và customer)
              user?.role === "customer" ? (
              // Customer chưa có home
              // Chỉ hiển thị message này cho customer khi chưa có home
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có nhà nào
                    </h3>
                {serviceUser?.serviceStatus === "ACTIVE" ? (
                  <>
                    <p className="text-gray-500 mb-4">
                      Dịch vụ của bạn đã được kích hoạt, nhưng nhà của bạn chưa được tạo.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto mb-4">
                      <p className="text-sm text-yellow-800 mb-2">
                        <strong>⚠️ Cần hành động:</strong>
                      </p>
                      <p className="text-sm text-yellow-800">
                        Admin cần tạo home cho bạn. Vui lòng liên hệ admin hoặc yêu cầu admin vào trang <strong>Users</strong> và click button <strong>Home icon</strong> (màu tím) để tạo home cho bạn.
                      </p>
                  </div>
                  </>
                ) : (
                  <p className="text-gray-500 mb-4">
                    Nhà của bạn sẽ được tạo tự động sau khi admin kích hoạt dịch vụ. 
                    Vui lòng đợi trong giây lát hoặc liên hệ admin nếu cần hỗ trợ.
                  </p>
                )}
              </div>
              ) : (
                // Admin không có homes
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Chưa có nhà nào
                            </h3>
                  <p className="text-gray-500">
                    Bạn chưa có nhà nào trong hệ thống. Vui lòng tạo nhà mới hoặc liên hệ quản trị viên.
                  </p>
                            </div>
              )
            ) : rooms.length === 0 && homes.length > 0 ? (
              // Có home nhưng chưa có phòng
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có phòng nào
                </h3>
                <p className="text-gray-500">
                  Các phòng sẽ được tạo tự động khi hệ thống được cài đặt.
                            </p>
                          </div>
            ) : rooms.length > 0 ? (
              // Hiển thị rooms với sensor data
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => {
                  const sensorData = getRoomSensorData(room.id);
                  return (
                    <div
                      key={room.id}
                      onClick={() => router.push(`/rooms/${room.id}`)}
                      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer border-2 border-gray-200 hover:border-blue-400 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {room.name}
                          </h3>
                          <p className="text-sm text-gray-500 capitalize">
                            {room.type.replace("_", " ")}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newName = prompt("Nhập tên mới cho phòng:", room.name);
                            if (newName && newName.trim()) {
                              handleRenameRoom(room.id, newName);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Chỉnh sửa tên phòng"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {sensorData.temperature !== "N/A" && (
                          <div className="flex items-center space-x-2">
                            <Thermometer className="h-4 w-4 text-orange-500" />
                            <span className="text-sm text-gray-700">
                              Nhiệt độ: <span className="font-semibold">{sensorData.temperature}</span>
                            </span>
                  </div>
                )}
                        {sensorData.hasMotion !== "N/A" && (
                          <div className="flex items-center space-x-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-700">
                              {sensorData.hasMotion}
                      </span>
                    </div>
                        )}
                        {sensorData.airQuality && (
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-700">
                              Không khí: <span className="font-semibold text-green-600">{sensorData.airQuality}</span>
                      </span>
                    </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/rooms/${room.id}`);
                          }}
                          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center"
                        >
                          Xem chi tiết
                          <Eye className="h-4 w-4 ml-2" />
                  </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

          </>
        )}

        {/* Dialog xác nhận thay đổi trạng thái An ninh */}
        {showSecurityConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex items-center space-x-4 mb-4">
                {pendingSecurityStatus === "ARMED" ? (
                  <ShieldCheck className="h-12 w-12 text-red-600" />
                ) : (
                  <ShieldOff className="h-12 w-12 text-gray-400" />
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Xác nhận thay đổi
                  </h3>
                  <p className="text-sm text-gray-600">
                    {pendingSecurityStatus === "ARMED"
                      ? "Bạn có chắc chắn muốn kích hoạt Hệ thống An ninh?"
                      : "Bạn có chắc chắn muốn tắt Hệ thống An ninh?"}
                  </p>
                </div>
                  </div>
              {pendingSecurityStatus === "ARMED" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    Khi kích hoạt, các kịch bản tự động liên quan đến an ninh sẽ bắt đầu hoạt động (ví dụ: cảnh báo khi có chuyển động lạ, khóa cửa tự động).
                  </p>
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={confirmSecurityChange}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    pendingSecurityStatus === "ARMED"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gray-600 text-white hover:bg-gray-700"
                  }`}
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => {
                    setShowSecurityConfirm(false);
                    setPendingSecurityStatus(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // Use Layout with Sidebar for admin, UserLayout for regular users
  if (user?.role === "admin") {
    return (
      <Layout>
        <DashboardContent showHeader={false} />
      </Layout>
    );
  }

  // Customer nhưng chưa có dịch vụ: trong lúc redirect sang /subscribe thì hiển thị loader
  if (user?.role === "customer" && needsSubscription && !isServiceLoading) {
    return (
      <UserLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
            <p className="text-gray-600">
              Đang chuyển đến trang đăng ký dịch vụ...
            </p>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <DashboardContent showHeader={true} />
    </UserLayout>
  );
}
