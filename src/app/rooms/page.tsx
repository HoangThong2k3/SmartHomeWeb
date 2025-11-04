"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { Room, Home } from "@/types";
import { DoorOpen, Plus, Edit, Trash2, Building2, Tag } from "lucide-react";
import HomeSelector from "@/components/ui/HomeSelector";

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch homes first
      let userHomes: Home[] = [];
      if (user?.id) {
        userHomes = await apiService.getHomesByOwner(user.id);
      } else {
        console.warn('[RoomsPage] No user ID available. Cannot fetch homes.');
        userHomes = [];
      }
      setHomes(userHomes);

      // Fetch rooms for each home
      const allRooms: Room[] = [];
      for (const home of userHomes) {
        try {
          const homeRooms = await apiService.getRoomsByHome(home.id);
          allRooms.push(...homeRooms);
        } catch (err) {
          console.log(`Could not fetch rooms for home ${home.id}`);
        }
      }
      setRooms(allRooms);
    } catch (err: any) {
      setError(err.message || "Failed to load rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (roomData: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      const newRoom = await apiService.createRoom({
        name: roomData.name,
        type: roomData.type,
        homeId: roomData.homeId,
      });
      
      await fetchData(); // Refresh to get latest data
      setShowCreateForm(false);
      setSuccess(`Room "${newRoom.name}" created successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to create room");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
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
      
      await apiService.updateRoom(id, {
        name: roomData.name,
        type: roomData.type,
      });
      
      await fetchData(); // Refresh to get latest data
      setEditingRoom(null);
      setSuccess(`Room "${roomData.name}" updated successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update room");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    const room = rooms.find((r) => r.id === id);
    const roomName = room?.name || "this room";
    
    if (!confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      if (!id || id === "Unknown") {
        setError("Invalid Room ID. Cannot delete.");
        setTimeout(() => setError(null), 5000);
        setIsSubmitting(false);
        return;
      }
      
      await apiService.deleteRoom(id);
      await fetchData(); // Refresh to get latest data
      setSuccess(`Room "${roomName}" deleted successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete room");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHomeName = (homeId: string) => {
    const home = homes.find((h) => h.id === homeId);
    return home?.name || "Unknown Home";
  };

  const formatRoomType = (t: Room["type"]) => {
    switch (t) {
      case "living_room":
        return "Living Room";
      case "bedroom":
        return "Bedroom";
      case "kitchen":
        return "Kitchen";
      case "bathroom":
        return "Bathroom";
      case "garage":
        return "Garage";
      default:
        return "Other";
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
              <p className="text-gray-600 mt-2">
                Manage rooms in your smart homes
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
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </button>
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

        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <DoorOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No rooms found
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first room.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Room
            </button>
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
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Tag className="w-4 h-4 mr-1" />
                      Type:{" "}
                      <span className="ml-1 font-medium text-gray-700">
                        {formatRoomType(room.type)}
                      </span>
                    </div>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {room.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingRoom(room)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      disabled={isSubmitting}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete room"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreateForm && (
          <CreateRoomForm
            homes={homes}
            onSubmit={handleCreateRoom}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {editingRoom && (
          <EditRoomForm
            room={editingRoom}
            homes={homes}
            onSubmit={(data) => handleUpdateRoom(editingRoom.id, data)}
            onCancel={() => setEditingRoom(null)}
          />
        )}
      </Layout>
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
    type: "other",
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="living_room">Living Room</option>
              <option value="bedroom">Bedroom</option>
              <option value="kitchen">Kitchen</option>
              <option value="bathroom">Bathroom</option>
              <option value="garage">Garage</option>
              <option value="other">Other</option>
            </select>
          </div>
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
  const [formData, setFormData] = useState({
    name: room.name,
    type: room.type,
    homeId: room.homeId,
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
        <h2 className="text-xl font-semibold mb-4">Edit Room</h2>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="living_room">Living Room</option>
              <option value="bedroom">Bedroom</option>
              <option value="kitchen">Kitchen</option>
              <option value="bathroom">Bathroom</option>
              <option value="garage">Garage</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Updating..." : "Update"}
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
