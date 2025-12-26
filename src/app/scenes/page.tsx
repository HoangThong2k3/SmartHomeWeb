"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ServiceGuard } from "@/components/auth/ServiceGuard";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { useServiceAccess } from "@/hooks/useServiceAccess";
import { Scene, Home, SceneAction } from "@/types";
import {
  Palette,
  Plus,
  Play,
  Trash2,
  Building2,
} from "lucide-react";
import HomeSelector from "@/components/ui/HomeSelector";

export default function ScenesPage() {
  const { user } = useAuth();
  const {
    isActive: canUseService,
    isLoading: isServiceLoading,
  } = useServiceAccess();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (isServiceLoading) return;
    if (!canUseService) {
      setIsLoading(false);
      return;
    }
    fetchData();
  }, [user, canUseService, isServiceLoading]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("[ScenesPage] Fetching data for user:", user?.id, "role:", user?.role);

      // Fetch homes first
      let userHomes: Home[] = [];
      if (user?.id) {
        try {
          userHomes = await apiService.getMyHomes();
        } catch (err: any) {
          console.warn("[ScenesPage] Could not fetch homes:", err?.message || err);
          userHomes = [];
        }
      } else {
        console.warn("[ScenesPage] No user ID available. Cannot fetch homes.");
        userHomes = [];
      }
      console.log("[ScenesPage] Found homes:", userHomes.length);
      setHomes(userHomes);

      // Fetch scenes for each home
      const allScenes: Scene[] = [];
      for (const home of userHomes) {
        try {
          const homeScenes = await apiService.getScenesByHome(Number(home.id));
          allScenes.push(...homeScenes);
          console.log(
            `[ScenesPage] Found ${homeScenes.length} scenes for home ${home.id}`
          );
        } catch (err: any) {
          console.error(
            `[ScenesPage] Could not fetch scenes for home ${home.id}:`,
            err?.message || err
          );
        }
      }
      setScenes(allScenes);
      console.log("[ScenesPage] Total scenes:", allScenes.length);
    } catch (err: any) {
      const errorMsg =
        err?.message || err?.detail || err?.error || "Failed to load scenes";
      console.error("[ScenesPage] Error fetching data:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateScene = async (sceneData: any) => {
    try {
      setError(null);
      console.log("[ScenesPage] Creating scene with data:", sceneData);

      // Validate bắt buộc
      if (!sceneData.homeId) {
        throw new Error("Home must be selected");
      }
      if (!sceneData.name) {
        throw new Error("Name is required");
      }

      // Validate homeId exists in homes list
      const selectedHome = homes.find((h) => h.id === sceneData.homeId);
      if (!selectedHome) {
        console.error(
          "[ScenesPage] Selected homeId not found in homes list:",
          sceneData.homeId
        );
        throw new Error(
          `Invalid home selected. Home ID ${sceneData.homeId} not found.`
        );
      }
      console.log("[ScenesPage] Selected home:", selectedHome);

      const payload: any = {
        HomeId: Number(sceneData.homeId),
        Name: sceneData.name,
        Description: sceneData.description || "",
        Actions: sceneData.actions || [],
      };
      console.log("[ScenesPage] Scene payload:", payload);

      await apiService.createScene(payload);
      console.log("[ScenesPage] Scene created successfully");
      fetchData();
      setShowCreateForm(false);
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        err?.detail ||
        err?.error ||
        "Failed to create scene";
      console.error(
        "[ScenesPage] Error creating scene:",
        errorMsg,
        err
      );
      setError(errorMsg);
    }
  };

  const handleExecuteScene = async (sceneId: number) => {
    try {
      setError(null);
      console.log("[ScenesPage] Executing scene:", sceneId);
      await apiService.executeScene(sceneId);
      console.log("[ScenesPage] Scene executed successfully");
      // You might want to show a success message here
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        err?.detail ||
        err?.error ||
        "Failed to execute scene";
      console.error("[ScenesPage] Error executing scene:", errorMsg, err);
      setError(errorMsg);
    }
  };

  const handleDeleteScene = async (sceneId: number) => {
    if (!confirm("Are you sure you want to delete this scene?")) return;

    try {
      setError(null);
      console.log("[ScenesPage] Deleting scene:", sceneId);
      await apiService.deleteScene(sceneId);
      console.log("[ScenesPage] Scene deleted successfully");
      fetchData();
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        err?.detail ||
        err?.error ||
        "Failed to delete scene";
      console.error(
        "[ScenesPage] Error deleting scene:",
        errorMsg,
        err
      );
      setError(errorMsg);
    }
  };

  const getHomeName = (homeId: string) => {
    const home = homes.find((h) => h.id === homeId);
    return home?.name || "Unknown Home";
  };

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
                <h1 className="text-3xl font-bold text-gray-900">Scenes</h1>
                <p className="text-gray-600 mt-2">
                  Manage your smart home scenes
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                disabled={homes.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Scene
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {scenes.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No scenes found
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first scene.
              </p>
              {homes.length > 0 && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Scene
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenes.map((scene) => (
                <div
                  key={scene.Id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {scene.Name}
                        </h3>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Building2 className="w-4 h-4 mr-1" />
                        {getHomeName(scene.Id.toString())} {/* Note: This might need adjustment based on how HomeId is stored */}
                      </div>
                      {scene.Description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {scene.Description}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-2">
                      <button
                        onClick={() => handleExecuteScene(scene.Id)}
                        className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded"
                        title="Execute scene"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteScene(scene.Id)}
                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                        title="Delete scene"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-gray-100 pt-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Actions ({scene.ActionCount})
                      </span>
                      <div className="mt-1 space-y-1">
                        {scene.Actions.slice(0, 3).map((action, index) => (
                          <div key={index} className="text-xs bg-gray-50 p-2 rounded border border-gray-200">
                            Device #{action.DeviceId}: {action.ActionType} → {action.ActionValue}
                          </div>
                        ))}
                        {scene.Actions.length > 3 && (
                          <div className="text-xs text-gray-400 text-center">
                            +{scene.Actions.length - 3} more actions
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showCreateForm && (
            <CreateSceneForm
              homes={homes}
              onSubmit={handleCreateScene}
              onCancel={() => setShowCreateForm(false)}
            />
          )}
        </Layout>
      </ServiceGuard>
    </ProtectedRoute>
  );
}

function CreateSceneForm({
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
    description: "",
    homeId: "",
    actions: [] as SceneAction[],
  });

  const [newAction, setNewAction] = useState({
    deviceId: "",
    actionType: "",
    actionValue: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addAction = () => {
    if (newAction.deviceId && newAction.actionType && newAction.actionValue) {
      setFormData({
        ...formData,
        actions: [
          ...formData.actions,
          {
            DeviceId: Number(newAction.deviceId),
            ActionType: newAction.actionType,
            ActionValue: newAction.actionValue,
          },
        ],
      });
      setNewAction({ deviceId: "", actionType: "", actionValue: "" });
    }
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
        <h2 className="text-xl font-semibold mb-4">Create New Scene</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Good Night"
              />
            </div>
            <HomeSelector
              homes={homes}
              value={formData.homeId}
              onChange={(homeId) => setFormData({ ...formData, homeId })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Turn off all lights and lock doors"
            />
          </div>

          {/* Actions Section */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Actions</h3>

            {/* Add Action Form */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <input
                type="number"
                placeholder="Device ID"
                value={newAction.deviceId}
                onChange={(e) =>
                  setNewAction({ ...newAction, deviceId: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="text"
                placeholder="Action Type"
                value={newAction.actionType}
                onChange={(e) =>
                  setNewAction({ ...newAction, actionType: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="text"
                placeholder="Action Value"
                value={newAction.actionValue}
                onChange={(e) =>
                  setNewAction({ ...newAction, actionValue: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={addAction}
                className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm"
              >
                Add
              </button>
            </div>

            {/* Actions List */}
            {formData.actions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Current Actions:</h4>
                {formData.actions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">
                      Device #{action.DeviceId}: {action.ActionType} → {action.ActionValue}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAction(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
