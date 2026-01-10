"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ServiceGuard } from "@/components/auth/ServiceGuard";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { useServiceAccess } from "@/hooks/useServiceAccess";
import { Scene, Home, SceneAction, ActionType, Device } from "@/types";
import {
  Palette,
  Plus,
  Play,
  Trash2,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import HomeSelector from "@/components/ui/HomeSelector";
import DeviceSelector from "@/components/ui/DeviceSelector";
import ActionTypeSelector from "@/components/ui/ActionTypeSelector";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ToastContainer from "@/components/ui/ToastContainer";

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
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isExecuting, setIsExecuting] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

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
      setIsCreating(true);
      setError(null);
      setSuccess(null);
      console.log("[ScenesPage] Creating scene with data:", sceneData);

      // Validate bắt buộc
      if (!sceneData.homeId) {
        throw new Error("Home must be selected");
      }
      if (!sceneData.name.trim()) {
        throw new Error("Scene name is required");
      }
      if (!sceneData.actions || sceneData.actions.length === 0) {
        throw new Error("At least one action is required");
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
        Name: sceneData.name.trim(),
        Description: sceneData.description?.trim() || "",
        Actions: sceneData.actions,
      };
      console.log("[ScenesPage] Scene payload:", payload);

      await apiService.createScene(payload);
      console.log("[ScenesPage] Scene created successfully");
      setSuccess("Scene created successfully!");
      fetchData();
      setShowCreateForm(false);
      setTimeout(() => setSuccess(null), 3000);
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
    } finally {
      setIsCreating(false);
    }
  };

  const handleExecuteScene = async (sceneId: number) => {
    try {
      setIsExecuting(sceneId);
      setError(null);
      setSuccess(null);
      console.log("[ScenesPage] Executing scene:", sceneId);
      await apiService.executeScene(sceneId);
      console.log("[ScenesPage] Scene executed successfully");
      setSuccess("Scene executed successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        err?.detail ||
        err?.error ||
        "Failed to execute scene";
      console.error("[ScenesPage] Error executing scene:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setIsExecuting(null);
    }
  };

  const handleDeleteScene = async (sceneId: number) => {
    // Open confirm modal instead of native confirm
    setConfirmState({
      open: true,
      targetId: sceneId,
      title: "Delete Scene",
      message: "Are you sure you want to delete this scene? This action cannot be undone.",
    });
  };

  const getHomeName = (homeId: string) => {
    const home = homes.find((h) => h.id === homeId);
    return home?.name || "Unknown Home";
  };

  // Confirm modal state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    targetId?: number | null;
    title?: string;
    message?: string;
  }>({ open: false });

  const performDeleteConfirmed = async () => {
    const sceneId = confirmState.targetId;
    if (!sceneId) {
      setConfirmState({ open: false });
      return;
    }

    try {
      setIsDeleting(sceneId);
      setError(null);
      setSuccess(null);
      console.log("[ScenesPage] Deleting scene:", sceneId);
      await apiService.deleteScene(sceneId);
      console.log("[ScenesPage] Scene deleted successfully");
      // Optimistic UI: remove from list
      setScenes((prev) => prev.filter((s) => s.Id !== sceneId));
      // Show toast with option to refetch
      (window as any).__sm_toast?.({
        id: `deleted-${sceneId}`,
        title: "Deleted",
        message: "Scene deleted. You can undo by reloading or recreating.",
        duration: 5000,
        actionLabel: "Reload",
        onAction: () => fetchData(),
      });
      setSuccess("Scene deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
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
    } finally {
      setIsDeleting(null);
      setConfirmState({ open: false });
    }
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
                disabled={homes.length === 0 || isCreating}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {isCreating ? "Creating..." : "Add Scene"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
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
                        disabled={isExecuting === scene.Id}
                        className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Execute scene"
                      >
                        {isExecuting === scene.Id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteScene(scene.Id)}
                        disabled={isDeleting === scene.Id}
                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete scene"
                      >
                        {isDeleting === scene.Id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
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
          <ConfirmModal
            open={confirmState.open}
            title={confirmState.title}
            message={confirmState.message}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={performDeleteConfirmed}
            onCancel={() => setConfirmState({ open: false })}
          />
          <ToastContainer />
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
    actionType: "" as ActionType | "",
    actionValue: "",
  });
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [preset, setPreset] = useState("");

  // Fetch devices for selected home to enable presets and bulk actions
  useEffect(() => {
    let mounted = true;
    const fetchDevicesForHome = async () => {
      if (!formData.homeId) {
        setAvailableDevices([]);
        return;
      }
      try {
        const rooms = await apiService.getRoomsByHome(String(formData.homeId));
        let allDevices: Device[] = [];
        for (const r of rooms) {
          try {
            const devs = await apiService.getDevicesByRoom(Number(r.id));
            allDevices = allDevices.concat(devs);
          } catch (e) {
            // ignore per-room errors
          }
        }
        if (mounted) setAvailableDevices(allDevices);
      } catch (e) {
        console.error("Failed to load devices for home in CreateSceneForm:", e);
        if (mounted) setAvailableDevices([]);
      }
    };
    fetchDevicesForHome();
    return () => {
      mounted = false;
    };
  }, [formData.homeId]);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Scene name is required";
    }

    if (!formData.homeId) {
      errors.homeId = "Home must be selected";
    }

    if (formData.actions.length === 0) {
      errors.actions = "At least one action is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateNewAction = () => {
    const errors: Record<string, string> = {};

    if (!newAction.deviceId) {
      errors.deviceId = "Device must be selected";
    }

    if (!newAction.actionType) {
      errors.actionType = "Action type must be selected";
    }

    if (!newAction.actionValue.trim()) {
      errors.actionValue = "Action value is required";
    }

    // Additional validation based on action type
    if (newAction.actionType === "SET_BRIGHTNESS") {
      const brightness = parseInt(newAction.actionValue);
      if (isNaN(brightness) || brightness < 0 || brightness > 100) {
        errors.actionValue = "Brightness must be between 0 and 100";
      }
    }

    if (newAction.actionType === "SET_TEMPERATURE") {
      const temp = parseFloat(newAction.actionValue);
      if (isNaN(temp) || temp < 0 || temp > 50) {
        errors.actionValue = "Temperature must be between 0°C and 50°C";
      }
    }

    if (newAction.actionType === "SET_HUMIDITY") {
      const humidity = parseFloat(newAction.actionValue);
      if (isNaN(humidity) || humidity < 0 || humidity > 100) {
        errors.actionValue = "Humidity must be between 0% and 100%";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const addAction = () => {
    if (validateNewAction()) {
      setFormData({
        ...formData,
        actions: [
          ...formData.actions,
          {
            DeviceId: Number(newAction.deviceId),
            ActionType: newAction.actionType as ActionType,
            ActionValue: newAction.actionValue.trim(),
          },
        ],
      });
      setNewAction({ deviceId: "", actionType: "", actionValue: "" });
      setFormErrors({});
    }
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    });
    if (formData.actions.length <= 1) {
      setFormErrors(prev => ({ ...prev, actions: "At least one action is required" }));
    } else {
      setFormErrors(prev => ({ ...prev, actions: "" }));
    }
  };

  const getActionValuePlaceholder = (actionType: ActionType) => {
    switch (actionType) {
      case "TURN_ON":
      case "TURN_OFF":
        return "true/false or 1/0";
      case "SET_BRIGHTNESS":
        return "0-100";
      case "SET_TEMPERATURE":
        return "Temperature in °C";
      case "SET_HUMIDITY":
        return "Humidity in %";
      case "LOCK":
      case "UNLOCK":
        return "true/false or 1/0";
      case "ACTIVATE":
      case "DEACTIVATE":
        return "true/false or 1/0";
      default:
        return "Action value";
    }
  };


  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[color:var(--surface)] rounded-lg p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Create New Scene</h2>
          <button
            onClick={onCancel}
            className="text-[color:var(--muted)] hover:text-[color:var(--foreground)] text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scene Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: "" }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Good Night"
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
                )}
              </div>
              <HomeSelector
                homes={homes}
                value={formData.homeId}
                onChange={(homeId) => {
                  setFormData({ ...formData, homeId, actions: [] }); // Reset actions when home changes
                  setNewAction({ deviceId: "", actionType: "", actionValue: "" });
                  if (formErrors.homeId) setFormErrors(prev => ({ ...prev, homeId: "" }));
                }}
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
          </div>

          {/* Actions Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Actions</h3>
              <span className="text-sm text-gray-500">
                {formData.actions.length} action{formData.actions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Presets */}
            <div className="mb-4 flex items-center gap-3">
              <label className="text-sm text-gray-600">Presets:</label>
              <select
                value={preset}
                onChange={(e) => {
                  setPreset(e.target.value);
                  if (!e.target.value) return;
                  // apply simple presets
                  if (e.target.value === "all_lights_off") {
                    const actions = (availableDevices || [])
                      .filter((d) =>
                        String(d.DeviceType || d.DeviceType || "")
                          .toLowerCase()
                          .includes("led")
                      )
                      .map((d) => ({
                        DeviceId: d.DeviceId,
                        ActionType: "TURN_OFF" as ActionType,
                        ActionValue: "0",
                      }));
                    setFormData({ ...formData, actions });
                  } else if (e.target.value === "good_night") {
                    const lightActions = (availableDevices || [])
                      .filter((d) =>
                        String(d.DeviceType || d.DeviceType || "")
                          .toLowerCase()
                          .includes("led")
                      )
                      .map((d) => ({
                        DeviceId: d.DeviceId,
                        ActionType: "TURN_OFF" as ActionType,
                        ActionValue: "0",
                      }));
                    const lockActions = (availableDevices || [])
                      .filter((d) =>
                        String(d.DeviceType || d.DeviceType || "")
                          .toLowerCase()
                          .includes("servo")
                      )
                      .map((d) => ({
                        DeviceId: d.DeviceId,
                        ActionType: "ACTIVATE" as ActionType,
                        ActionValue: "1",
                      }));
                    setFormData({ ...formData, actions: [...lightActions, ...lockActions] });
                  }
                }}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">Select a preset (optional)</option>
                <option value="all_lights_off">All Lights Off</option>
                <option value="good_night">Good Night (lights off + locks)</option>
              </select>
            </div>

            {formErrors.actions && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-sm text-red-600">{formErrors.actions}</span>
                </div>
              </div>
            )}

            {/* Add Action Form */}
            {formData.homeId && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Action</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <DeviceSelector
                    homeId={formData.homeId}
                    value={newAction.deviceId}
                    onChange={(deviceId) => {
                      setNewAction({ ...newAction, deviceId, actionType: "", actionValue: "" });
                      if (formErrors.deviceId) setFormErrors(prev => ({ ...prev, deviceId: "" }));
                    }}
                  />

                  <ActionTypeSelector
                    value={newAction.actionType}
                    onChange={(actionType) => {
                      setNewAction({ ...newAction, actionType, actionValue: "" });
                      if (formErrors.actionType) setFormErrors(prev => ({ ...prev, actionType: "" }));
                    }}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value <span className="text-red-500">*</span>
                    </label>
                    {["SET_BRIGHTNESS", "SET_TEMPERATURE", "SET_HUMIDITY"].includes(String(newAction.actionType)) ? (
                      <input
                        type="number"
                        min={newAction.actionType === "SET_BRIGHTNESS" ? 0 : 0}
                        max={newAction.actionType === "SET_BRIGHTNESS" ? 100 : newAction.actionType === "SET_HUMIDITY" ? 100 : 50}
                        placeholder={newAction.actionType ? getActionValuePlaceholder(newAction.actionType as ActionType) : "Action value"}
                        value={newAction.actionValue}
                        onChange={(e) => {
                          setNewAction({ ...newAction, actionValue: e.target.value });
                          if (formErrors.actionValue) setFormErrors(prev => ({ ...prev, actionValue: "" }));
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.actionValue ? "border-red-300" : "border-gray-300"}`}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={newAction.actionType ? getActionValuePlaceholder(newAction.actionType as ActionType) : "Action value"}
                        value={newAction.actionValue}
                        onChange={(e) => {
                          setNewAction({ ...newAction, actionValue: e.target.value });
                          if (formErrors.actionValue) setFormErrors(prev => ({ ...prev, actionValue: "" }));
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.actionValue ? "border-red-300" : "border-gray-300"}`}
                      />
                    )}
                    {formErrors.actionValue && (
                      <p className="text-sm text-red-600 mt-1">{formErrors.actionValue}</p>
                    )}
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addAction}
                      disabled={!newAction.deviceId || !newAction.actionType || !newAction.actionValue.trim()}
                      className={`btn ${!newAction.deviceId || !newAction.actionType || !newAction.actionValue.trim() ? "disabled:bg-gray-400 disabled:cursor-not-allowed" : "btn-primary" } w-full`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions List */}
            {formData.actions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Current Actions:</h4>
                {formData.actions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-900">
                          Device #{action.DeviceId}
                        </span>
                        <span className="text-blue-700">→</span>
                        <span className="font-medium text-blue-900">
                          {action.ActionType}
                        </span>
                        <span className="text-blue-700">→</span>
                        <span className="font-mono text-blue-800 bg-blue-100 px-2 py-1 rounded text-sm">
                          {action.ActionValue}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAction(index)}
                      className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded ml-2"
                      title="Remove action"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!formData.homeId && (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Please select a home first to add actions</p>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-6 border-t">
            <button
              type="submit"
              className="btn btn-primary px-6 py-2 flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Create Scene
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost px-6 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
