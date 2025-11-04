"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { Home } from "@/types";
import { Building2, Plus, Edit, Trash2, Users } from "lucide-react";

export default function HomesPage() {
  const { user } = useAuth();
  const [homes, setHomes] = useState<Home[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHome, setEditingHome] = useState<Home | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchHomes();
  }, [user]);

  const fetchHomes = async () => {
    try {
      setIsLoading(true);

      if (user?.id) {
        const userHomes = await apiService.getHomesByOwner(user.id);
        setHomes(userHomes);
      } else {
        console.warn('[HomesPage] No user ID available. Cannot fetch homes.');
        setHomes([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load homes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateHome = async (homeData: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      const newHome = await apiService.createHome({
        name: homeData.name,
        ownerId: user?.id || "",
        securityStatus: homeData.securityStatus || "DISARMED",
      });
      
      await fetchHomes(); // Refresh to get latest data
      setShowCreateForm(false);
      setSuccess(`Home "${newHome.name}" created successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to create home");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateHome = async (id: string, homeData: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      if (!id || id === "Unknown") {
        setError("Invalid Home ID. Cannot update.");
        setTimeout(() => setError(null), 5000);
        setIsSubmitting(false);
        return;
      }
      
      await apiService.updateHome(id, {
        name: homeData.name,
        securityStatus: homeData.securityStatus || "DISARMED",
      });
      
      await fetchHomes(); // Refresh to get latest data
      setEditingHome(null);
      setSuccess(`Home "${homeData.name}" updated successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update home");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHome = async (id: string) => {
    const home = homes.find((h) => h.id === id);
    const homeName = home?.name || "this home";
    
    if (!confirm(`Are you sure you want to delete "${homeName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      if (!id || id === "Unknown") {
        setError("Invalid Home ID. Cannot delete.");
        setTimeout(() => setError(null), 5000);
        setIsSubmitting(false);
        return;
      }
      
      await apiService.deleteHome(id);
      await fetchHomes(); // Refresh to get latest data
      setSuccess(`Home "${homeName}" deleted successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete home");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
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
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.role === "admin"
                  ? "Smart Homes Management"
                  : "My Smart Homes"}
              </h1>
              <p className="text-gray-600 mt-2">
                {user?.role === "admin"
                  ? "Manage all smart home properties in the system"
                  : "Manage your smart home properties"}
              </p>
              <div className="mt-2 flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Welcome,{" "}
                  <span className="font-medium text-blue-600">
                    {user?.name || "Unknown"}
                  </span>
                </div>
                <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                  {user?.role?.toUpperCase() || "USER"}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Home
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

        {homes.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No homes found
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first smart home.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Home
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {homes.map((home) => (
              <div
                key={home.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {home.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Users className="w-4 h-4 mr-1" />
                      <span>Owner ID: {home.ownerId || "Unknown"}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          home.securityStatus === "ARMED"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {home.securityStatus || "DISARMED"}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingHome(home)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHome(home.id)}
                      disabled={isSubmitting}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete home"
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
          <CreateHomeForm
            onSubmit={handleCreateHome}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {editingHome && (
          <EditHomeForm
            home={editingHome}
            onSubmit={(data) => handleUpdateHome(editingHome.id, data)}
            onCancel={() => setEditingHome(null)}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
}

function CreateHomeForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    securityStatus: "DISARMED",
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
        <h2 className="text-xl font-semibold mb-4">Create New Home</h2>
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
              Security Status
            </label>
            <select
              value={formData.securityStatus}
              onChange={(e) =>
                setFormData({ ...formData, securityStatus: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DISARMED">Disarmed</option>
              <option value="ARMED">Armed</option>
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

function EditHomeForm({
  home,
  onSubmit,
  onCancel,
}: {
  home: Home;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: home.name,
    securityStatus: (home as any).securityStatus || "DISARMED",
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
        <h2 className="text-xl font-semibold mb-4">Edit Home</h2>
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
              Security Status
            </label>
            <select
              value={formData.securityStatus}
              onChange={(e) =>
                setFormData({ ...formData, securityStatus: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DISARMED">Disarmed</option>
              <option value="ARMED">Armed</option>
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
