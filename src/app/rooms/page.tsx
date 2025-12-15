"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ServiceGuard } from "@/components/auth/ServiceGuard";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { useServiceAccess } from "@/hooks/useServiceAccess";
import { Room, Home, Device } from "@/types";
import { DoorOpen, Plus, Edit, Trash2, Building2, Eye } from "lucide-react";
import HomeSelector from "@/components/ui/HomeSelector";

export default function RoomsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";
  const {
    isActive: canUseService,
    isLoading: isServiceLoading,
  } = useServiceAccess();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [roomDeviceStats, setRoomDeviceStats] = useState<
    Record<string, { total: number; online: number }>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isServiceLoading && !isAdmin) return;
    if (!isAdmin && !canUseService) {
      setIsLoading(false);
      return;
    }
    fetchData();
  }, [user, canUseService, isServiceLoading, isAdmin]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      let targetHomes: Home[] = [];
      if (isAdmin) {
        // Admin: xem danh sách phòng của tất cả homes
        targetHomes = await apiService.getAllHomes();
      } else {
        // Customer: chỉ homes của chính mình
        targetHomes = await apiService.getMyHomes();
      }
      setHomes(targetHomes);

      const allRooms: Room[] = [];
      for (const home of targetHomes) {
        try {
          const homeRooms = await apiService.getRoomsByHome(home.id);
          allRooms.push(...homeRooms);
        } catch (err) {
          console.log(`Could not fetch rooms for home ${home.id}`);
        }
      }
      setRooms(allRooms);

      // Fetch device stats per room (total & online)
      const stats: Record<string, { total: number; online: number }> = {};
      await Promise.all(
        allRooms.map(async (r) => {
          try {
            const devices = await apiService.getDevicesByRoom(r.id);
            const total = devices.length;
            const online = devices.filter(
              (d) => (d as Device).status === "online"
            ).length;
            stats[r.id] = { total, online };
          } catch (err) {
            stats[r.id] = { total: 0, online: 0 };
          }
        })
      );
      setRoomDeviceStats(stats);
    } catch (err: any) {
      setError(err.message || "Failed to load rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRoom = async (id: string, roomData: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      if (!id || id === "Unknown") {
        setError("Invalid Room ID. Cannot update.");
        setTimeout(() => setError(null), 5000);
        setIsSubmitting(false);
        return;
      }
      
      // Customer chỉ có thể update name, không update homeId
      // Theo Swagger: PUT /api/Rooms/{id} chỉ nhận { name: "string" }
      await apiService.updateRoom(id, {
        name: roomData.name,
      });
      
      await fetchData(); // Refresh to get latest data
      setEditingRoom(null);
      setSuccess(`Đã cập nhật tên phòng thành "${roomData.name}"!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to update room";
      setError(errorMsg.includes("403") || errorMsg.includes("Forbidden") 
        ? "Bạn không có quyền cập nhật phòng này." 
        : errorMsg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHomeName = (homeId: string) => {
    const home = homes.find((h) => h.id === homeId);
    return home?.name || "Unknown Home";
  };

  // Room type is no longer displayed/edited in UI.

  if (isLoading) {
    return (
      <ProtectedRoute>
        <ServiceGuard>
          <Layout>
            <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </Layout>
        </ServiceGuard>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ServiceGuard>
        <Layout>
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
                <p className="text-gray-600 mt-2">
                  {isAdmin
                    ? "Admin: tạo / xóa phòng cho các homes của khách hàng"
                    : "Quản lý các phòng trong ngôi nhà của bạn"}
                </p>
                <div className="mt-2 text-sm text-gray-500">
                  User:{" "}
                  <span className="font-medium text-blue-600">
                    {user?.name || "Unknown"}
                  </span>{" "}
                  | Role:{" "}
                  <span className="font-medium">{user?.role || "Unknown"}</span>
                </div>
              </div>
              {isAdmin ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Room
                </button>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-md text-sm font-medium">
                  Phòng được đội ngũ kỹ thuật tạo sẵn. Bạn chỉ có thể đổi tên
                  phòng.
                </div>
              )}
            </div>
          </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 ml-4"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md flex items-center justify-between">
            <span>{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-600 hover:text-green-800 ml-4"
            >
              ×
            </button>
          </div>
        )}

        {homes.length === 0 ? (
          <div className="text-center py-12">
            <DoorOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có nhà nào
            </h3>
            <p className="text-gray-500 mb-4">
              {isAdmin 
                ? "Chưa có homes trong hệ thống. Vui lòng tạo home trước khi tạo phòng."
                : "Bạn chưa có nhà. Vui lòng liên hệ admin để được tạo nhà và phòng."}
            </p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <DoorOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có phòng nào
            </h3>
            <p className="text-gray-500 mb-4">
              {isAdmin 
                ? "Chưa có phòng trong nhà này. Vui lòng tạo phòng mới."
                : "Các phòng sẽ được đội ngũ kỹ thuật cấu hình sẵn khi bàn giao hệ thống."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {room.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Building2 className="w-4 h-4 mr-1" />
                      {getHomeName(room.homeId)}
                    </div>
                    <div className="flex items-center text-sm text-gray-700 gap-3 mb-2">
                      <span className="px-2 py-1 rounded-full bg-gray-100">
                        {roomDeviceStats[room.id]?.total ?? "—"} thiết bị
                      </span>
                      <span className="px-2 py-1 rounded-full bg-green-50 text-green-700">
                        {roomDeviceStats[room.id]?.online ?? "—"} online
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!isAdmin && (
                      <button
                        onClick={() => setEditingRoom(room)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Đổi tên phòng"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={async () => {
                          const roomName = room.name || "this room";
                          if (
                            !confirm(
                              `Are you sure you want to delete "${roomName}"? This action cannot be undone.`
                            )
                          ) {
                            return;
                          }
                          try {
                            setIsSubmitting(true);
                            setError(null);
                            setSuccess(null);
                            await apiService.deleteRoom(room.id);
                            await fetchData();
                            setSuccess(
                              `Room "${roomName}" deleted successfully!`
                            );
                            setTimeout(() => setSuccess(null), 3000);
                          } catch (err: any) {
                            setError(
                              err?.message || "Failed to delete room"
                            );
                            setTimeout(() => setError(null), 5000);
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/rooms/${room.id}`)}
                      className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                      title="Xem chi tiết phòng"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAdmin && showCreateForm && (
          <CreateRoomForm
            homes={homes}
            onSubmit={async (data) => {
              try {
                setIsSubmitting(true);
                setError(null);
                setSuccess(null);

                const newRoom = await apiService.createRoom({
                  name: data.name,
                  homeId: data.homeId,
                  // type không còn hiển thị ở UI, để BE quyết định / default
                } as any);

                await fetchData();
                setShowCreateForm(false);
                setSuccess(`Room "${newRoom.name}" created successfully!`);
                setTimeout(() => setSuccess(null), 3000);
              } catch (err: any) {
                setError(err?.message || "Failed to create room");
                setTimeout(() => setError(null), 5000);
              } finally {
                setIsSubmitting(false);
              }
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {editingRoom && !isAdmin && (
          <EditRoomForm
            room={editingRoom}
            homes={homes}
            onSubmit={(data) => handleUpdateRoom(editingRoom.id, data)}
            onCancel={() => setEditingRoom(null)}
          />
        )}
        </Layout>
      </ServiceGuard>
    </ProtectedRoute>
  );
}

function CreateRoomForm({
  homes,
  onSubmit,
  onCancel,
}: {
  homes: Home[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    homeId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Room</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <HomeSelector
            homes={homes}
            value={formData.homeId}
            onChange={(homeId) => setFormData({ ...formData, homeId })}
            required
          />
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditRoomForm({
  room,
  homes,
  onSubmit,
  onCancel,
}: {
  room: Room;
  homes: Home[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [formData, setFormData] = useState({
    name: room.name,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Customer chỉ có thể update name, không update homeId
      // Theo Swagger: PUT /api/Rooms/{id} chỉ nhận { name: "string" }
      await onSubmit({ name: formData.name });
    } finally {
      setIsSubmitting(false);
    }
  };

  const homeName = homes.find(h => h.id === room.homeId)?.name || "Unknown Home";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {isAdmin ? "Edit Room" : "Đổi tên phòng"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên phòng
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Nhập tên phòng"
            />
          </div>
          {!isAdmin && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <p className="text-sm text-gray-600">
                <strong>Nhà:</strong> {homeName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Bạn chỉ có thể đổi tên phòng, không thể thay đổi nhà.
              </p>
            </div>
          )}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
