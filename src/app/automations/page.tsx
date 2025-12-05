"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ServiceGuard } from "@/components/auth/ServiceGuard";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { useServiceAccess } from "@/hooks/useServiceAccess";
import { Automation, Home } from "@/types";
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  Building2,
  Power,
  PowerOff,
} from "lucide-react";
import HomeSelector from "@/components/ui/HomeSelector";

// Helper function to normalize JSON: convert device_id to deviceId (camelCase)
function normalizeAutomationJson(jsonString: string): string {
  if (!jsonString || !jsonString.trim()) {
    return jsonString;
  }

  try {
    const parsed = JSON.parse(jsonString);

    // Recursive function to normalize object keys
    const normalizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map((item) => normalizeObject(item));
      } else if (obj !== null && typeof obj === "object") {
        const normalized: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            // Convert device_id to deviceId
            const newKey = key === "device_id" ? "deviceId" : key;
            normalized[newKey] = normalizeObject(obj[key]);
          }
        }
        return normalized;
      }
      return obj;
    };

    const normalized = normalizeObject(parsed);
    return JSON.stringify(normalized);
  } catch (e) {
    // If parsing fails, return original string
    console.warn("[normalizeAutomationJson] Failed to parse JSON:", e);
    return jsonString;
  }
}

export default function AutomationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const {
    isActive: canUseService,
    isLoading: isServiceLoading,
  } = useServiceAccess();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(
    null
  );

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
      console.log("[AutomationsPage] Fetching data for user:", user?.id, "role:", user?.role);

      // Admin không thể xem automation của customer (Privacy Wall)
      // Admin chỉ có thể xem automation trong nhà của chính mình (nếu có)
      // Customer chỉ có thể xem automation trong nhà của chính mình
      
      // Fetch homes first
      // Admin không thể xem homes của customer (Privacy Wall)
      // Admin chỉ có thể xem automation trong nhà của chính mình (nếu có)
      let userHomes: Home[] = [];
      if (isAdmin) {
        // Admin không gọi getMyHomes() vì API này chỉ dành cho Customer
        // Admin có thể có home riêng nhưng cần API khác để lấy
        // Tạm thời để trống, Admin sẽ thấy thông báo phù hợp
        console.log("[AutomationsPage] Admin detected - skipping getMyHomes() due to Privacy Wall");
        userHomes = [];
      } else if (user?.id) {
        // Chỉ Customer mới gọi getMyHomes()
        try {
          userHomes = await apiService.getMyHomes();
        } catch (err: any) {
          // Nếu bị lỗi, vẫn tiếp tục với mảng rỗng
          console.warn("[AutomationsPage] Could not fetch homes:", err?.message || err);
          userHomes = [];
        }
      } else {
        console.warn(
          "[AutomationsPage] No user ID available. Cannot fetch homes."
        );
        userHomes = [];
      }
      console.log("[AutomationsPage] Found homes:", userHomes.length);
      setHomes(userHomes);

      // Nếu không có home, không fetch automations
      if (userHomes.length === 0) {
        setAutomations([]);
        if (isAdmin) {
          setError("Admin không thể xem automation của khách hàng (Privacy Wall). Admin chỉ có thể xem automation trong nhà của chính mình.");
        } else {
          setError("Bạn chưa có nhà nào. Vui lòng liên hệ admin để được cài đặt hệ thống.");
        }
        return;
      }

      // Fetch automations for each home
      const allAutomations: Automation[] = [];
      for (const home of userHomes) {
        try {
          const homeAutomations = await apiService.getAutomationsByHome(
            home.id
          );
          allAutomations.push(...homeAutomations);
          console.log(
            `[AutomationsPage] Found ${homeAutomations.length} automations for home ${home.id}`
          );
        } catch (err: any) {
          // Nếu bị 403 Forbidden (Privacy Wall), log warning nhưng không throw error
          if (err?.message?.includes("403") || err?.message?.includes("Forbidden")) {
            console.warn(
              `[AutomationsPage] Privacy Wall: Cannot fetch automations for home ${home.id} (Forbidden)`
            );
            if (isAdmin) {
              setError("Admin không thể xem automation của khách hàng (Privacy Wall).");
            }
          } else {
            console.error(
              `[AutomationsPage] Could not fetch automations for home ${home.id}:`,
              err?.message || err
            );
          }
        }
      }
      setAutomations(allAutomations);
      console.log(
        "[AutomationsPage] Total automations:",
        allAutomations.length
      );
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        err?.detail ||
        err?.error ||
        "Failed to load automations";
      console.error("[AutomationsPage] Error fetching data:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAutomation = async (automationData: any) => {
    try {
      setError(null);
      console.log(
        "[AutomationsPage] Creating automation with data:",
        automationData
      );
      console.log(
        "[AutomationsPage] Available homes:",
        homes.map((h) => ({ id: h.id, name: h.name }))
      );

      // Validate bắt buộc
      if (!automationData.homeId) {
        throw new Error("Home must be selected");
      }
      if (!automationData.name) {
        throw new Error("Name is required");
      }
      if (!automationData.triggers) {
        throw new Error("Triggers (JSON) is required");
      }
      if (!automationData.actions) {
        throw new Error("Actions (JSON) is required");
      }

      // Validate homeId exists in homes list
      const selectedHome = homes.find((h) => h.id === automationData.homeId);
      if (!selectedHome) {
        console.error(
          "[AutomationsPage] Selected homeId not found in homes list:",
          automationData.homeId
        );
        throw new Error(
          `Invalid home selected. Home ID ${automationData.homeId} not found.`
        );
      }
      console.log("[AutomationsPage] Selected home:", selectedHome);

      // Validate homeId là số hợp lệ
      const homeIdNum = parseInt(automationData.homeId);
      if (isNaN(homeIdNum) || homeIdNum <= 0) {
        throw new Error(
          `Invalid homeId: ${automationData.homeId}. Must be a valid number > 0.`
        );
      }

      // Đảm bảo triggers/actions là JSON string (backend yêu cầu)
      try {
        JSON.parse(automationData.triggers);
        JSON.parse(automationData.actions);
      } catch {
        throw new Error("Triggers/Actions phải là chuỗi JSON hợp lệ");
      }

      // Normalize JSON: convert device_id to deviceId (camelCase)
      console.log(
        "[AutomationsPage] Original triggers:",
        automationData.triggers
      );
      console.log(
        "[AutomationsPage] Original actions:",
        automationData.actions
      );
      const normalizedTriggers = normalizeAutomationJson(
        automationData.triggers
      );
      const normalizedActions = normalizeAutomationJson(automationData.actions);
      console.log("[AutomationsPage] Normalized triggers:", normalizedTriggers);
      console.log("[AutomationsPage] Normalized actions:", normalizedActions);

      const payload = {
        homeId: homeIdNum.toString(), // Keep as string for API
        name: automationData.name,
        triggers: normalizedTriggers,
        actions: normalizedActions,
        source: automationData.source,
        isActive: Boolean(automationData.isActive),
        suggestionStatus: automationData.suggestionStatus,
      };
      console.log("[AutomationsPage] Automation payload:", payload);
      console.log(
        "[AutomationsPage] Payload triggers JSON:",
        JSON.stringify(payload.triggers)
      );
      console.log(
        "[AutomationsPage] Payload actions JSON:",
        JSON.stringify(payload.actions)
      );
      console.log(
        "[AutomationsPage] HomeId type:",
        typeof payload.homeId,
        "value:",
        payload.homeId
      );

      await apiService.createAutomation(payload);
      console.log("[AutomationsPage] Automation created successfully");
      fetchData();
      setShowCreateForm(false);
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        err?.detail ||
        err?.error ||
        "Failed to create automation";
      console.error(
        "[AutomationsPage] Error creating automation:",
        errorMsg,
        err
      );
      setError(errorMsg);
    }
  };

  const handleUpdateAutomation = async (id: string, automationData: any) => {
    try {
      setError(null);
      console.log("[AutomationsPage] Updating automation:", id, automationData);
      console.log(
        "[AutomationsPage] Automation ID type:",
        typeof id,
        "value:",
        id
      );
      console.log(
        "[AutomationsPage] Available homes:",
        homes.map((h) => ({ id: h.id, name: h.name }))
      );

      if (
        !id ||
        id === "Unknown" ||
        (typeof id === "string" && id.trim() === "")
      ) {
        const errorMsg = "Invalid Automation ID. Cannot update.";
        console.error("[AutomationsPage] Invalid ID:", id);
        setError(errorMsg);
        return;
      }
      if (
        !automationData.name ||
        !automationData.triggers ||
        !automationData.actions
      ) {
        const errorMsg = "Missing required fields: Name, Triggers, Actions";
        setError(errorMsg);
        return;
      }

      // Validate homeId if provided (for update, though usually not changed)
      if (automationData.homeId) {
        const selectedHome = homes.find((h) => h.id === automationData.homeId);
        if (!selectedHome) {
          console.error(
            "[AutomationsPage] Selected homeId not found in homes list:",
            automationData.homeId
          );
          throw new Error(
            `Invalid home selected. Home ID ${automationData.homeId} not found.`
          );
        }
        console.log("[AutomationsPage] Selected home:", selectedHome);
      }

      try {
        JSON.parse(automationData.triggers);
        JSON.parse(automationData.actions);
      } catch {
        const errorMsg = "Triggers/Actions phải là JSON hợp lệ";
        setError(errorMsg);
        return;
      }

      // Normalize JSON: convert device_id to deviceId (camelCase)
      const normalizedTriggers = normalizeAutomationJson(
        automationData.triggers
      );
      const normalizedActions = normalizeAutomationJson(automationData.actions);

      const payload = {
        name: automationData.name,
        triggers: normalizedTriggers,
        actions: normalizedActions,
        source: automationData.source,
        isActive: Boolean(automationData.isActive),
        suggestionStatus: automationData.suggestionStatus,
      };
      console.log("[AutomationsPage] Update payload:", payload);
      console.log("[AutomationsPage] Payload JSON:", JSON.stringify(payload));

      await apiService.updateAutomation(id, payload);
      console.log("[AutomationsPage] Automation updated successfully");
      fetchData();
      setEditingAutomation(null);
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        err?.detail ||
        err?.error ||
        "Failed to update automation";
      console.error(
        "[AutomationsPage] Error updating automation:",
        errorMsg,
        err
      );
      setError(errorMsg);
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this automation?")) return;

    try {
      setError(null);
      console.log("[AutomationsPage] Deleting automation:", id);
      console.log(
        "[AutomationsPage] Automation ID type:",
        typeof id,
        "value:",
        id
      );

      if (
        !id ||
        id === "Unknown" ||
        (typeof id === "string" && id.trim() === "")
      ) {
        const errorMsg = "Invalid Automation ID. Cannot delete.";
        console.error("[AutomationsPage] Invalid ID:", id);
        setError(errorMsg);
        return;
      }

      await apiService.deleteAutomation(id);
      console.log("[AutomationsPage] Automation deleted successfully");
      fetchData(); // refresh data like Devices does
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        err?.detail ||
        err?.error ||
        "Failed to delete automation";
      console.error(
        "[AutomationsPage] Error deleting automation:",
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

  // Không chặn Admin hoàn toàn - Admin có thể xem automation trong nhà của chính mình (nếu có)
  // Nhưng Admin không thể xem/sửa automation của customer (Privacy Wall được xử lý ở backend)

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
              <h1 className="text-3xl font-bold text-gray-900">Automations</h1>
              <p className="text-gray-600 mt-2">
                Manage your smart home automations
              </p>
            </div>
            {/* Customer có thể tạo automation, Admin chỉ tạo được trong nhà của chính mình */}
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={homes.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Automation
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {isAdmin && homes.length === 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
            <strong>Privacy Wall:</strong> Admin không thể xem hoặc quản lý automation của khách hàng. 
            Admin chỉ có thể xem và quản lý automation trong nhà của chính mình (nếu có). 
            Hiện tại bạn chưa có nhà nào.
          </div>
        )}
        {isAdmin && homes.length > 0 && automations.length === 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm">
            Bạn có {homes.length} nhà nhưng chưa có automation nào. Bạn có thể tạo automation cho nhà của chính mình.
          </div>
        )}

        {automations.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No automations found
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first automation.
            </p>
            {homes.length > 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Automation
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {automations.map((automation) => {
              const triggers = automation.triggers || automation.trigger || "";
              const actions = automation.actions || automation.action || "";

              // Try to parse and format JSON for display
              let triggersDisplay = triggers;
              let actionsDisplay = actions;
              try {
                const triggersObj = JSON.parse(triggers);
                triggersDisplay = JSON.stringify(triggersObj, null, 2);
              } catch {}
              try {
                const actionsObj = JSON.parse(actions);
                actionsDisplay = JSON.stringify(actionsObj, null, 2);
              } catch {}

              return (
                <div
                  key={automation.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {automation.name}
                        </h3>
                        {automation.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <Power className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            <PowerOff className="w-3 h-3 mr-1" />
                            Inactive
                          </span>
                        )}
                        {(automation.source === "AI_SUGGESTED" ||
                          automation.source === "SUGGESTED") && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Suggested
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Building2 className="w-4 h-4 mr-1" />
                        {getHomeName(automation.homeId)}
                      </div>

                      {automation.suggestionStatus && (
                        <div className="mb-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              automation.suggestionStatus === "ACCEPTED"
                                ? "bg-green-100 text-green-800"
                                : automation.suggestionStatus === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {automation.suggestionStatus}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-2">
                      <button
                        onClick={() => {
                          console.log(
                            "[AutomationsPage] Edit clicked for automation:",
                            automation
                          );
                          console.log(
                            "[AutomationsPage] Automation ID:",
                            automation.id,
                            "type:",
                            typeof automation.id
                          );
                          if (
                            !automation.id ||
                            automation.id === "Unknown" ||
                            (typeof automation.id === "string" &&
                              automation.id.trim() === "")
                          ) {
                            console.error(
                              "[AutomationsPage] Cannot edit: Invalid automation ID:",
                              automation.id
                            );
                            setError("Invalid Automation ID. Cannot edit.");
                            return;
                          }
                          setEditingAutomation(automation);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                        title="Edit automation"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAutomation(automation.id)}
                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                        title="Delete automation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-gray-100 pt-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Triggers
                      </span>
                      <div className="mt-1 text-xs font-mono bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto max-h-24 overflow-y-auto">
                        {triggersDisplay || (
                          <span className="text-gray-400">No triggers</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Actions
                      </span>
                      <div className="mt-1 text-xs font-mono bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto max-h-24 overflow-y-auto">
                        {actionsDisplay || (
                          <span className="text-gray-400">No actions</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showCreateForm && (
          <CreateAutomationForm
            homes={homes}
            onSubmit={handleCreateAutomation}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {editingAutomation && (
          <EditAutomationForm
            automation={editingAutomation}
            homes={homes}
            onSubmit={(data) => {
              console.log(
                "[AutomationsPage] EditAutomationForm onSubmit - editingAutomation:",
                editingAutomation
              );
              console.log(
                "[AutomationsPage] EditAutomationForm onSubmit - automation.id:",
                editingAutomation.id
              );
              if (
                !editingAutomation.id ||
                editingAutomation.id === "Unknown" ||
                (typeof editingAutomation.id === "string" &&
                  editingAutomation.id.trim() === "")
              ) {
                console.error(
                  "[AutomationsPage] EditAutomationForm onSubmit - Invalid automation ID:",
                  editingAutomation.id
                );
                setError("Invalid Automation ID. Cannot update.");
                return;
              }
              handleUpdateAutomation(editingAutomation.id, data);
            }}
            onCancel={() => setEditingAutomation(null)}
          />
        )}
        </Layout>
      </ServiceGuard>
    </ProtectedRoute>
  );
}

function CreateAutomationForm({
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
    triggers: "",
    actions: "",
    isActive: true,
    homeId: "",
    source: "USER_CREATED",
    suggestionStatus: "PENDING",
  });

  const [jsonErrors, setJsonErrors] = useState<{
    triggers?: string;
    actions?: string;
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jsonErrors.triggers || jsonErrors.actions) {
      return;
    }
    onSubmit(formData);
  };

  const validateJson = (field: "triggers" | "actions", value: string) => {
    if (!value.trim()) {
      setJsonErrors((prev) => ({ ...prev, [field]: undefined }));
      return;
    }
    try {
      JSON.parse(value);
      setJsonErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (e: any) {
      setJsonErrors((prev) => ({
        ...prev,
        [field]: `Invalid JSON: ${e.message}`,
      }));
    }
  };

  const loadExample = (type: "time" | "motion" | "temperature" | "complex") => {
    const examples = {
      time: {
        triggers: JSON.stringify(
          [{ device_id: 1, condition: "==", value: 1 }],
          null,
          2
        ),
        actions: JSON.stringify(
          [{ device_id: 2, action: "setState", value: { status: "on" } }],
          null,
          2
        ),
      },
      motion: {
        triggers: JSON.stringify(
          [{ device_id: 3, condition: "==", value: "detected" }],
          null,
          2
        ),
        actions: JSON.stringify(
          [
            {
              device_id: 1,
              action: "setState",
              value: { status: "on", brightness: 100 },
            },
          ],
          null,
          2
        ),
      },
      temperature: {
        triggers: JSON.stringify(
          [{ device_id: 2, condition: ">", value: 25 }],
          null,
          2
        ),
        actions: JSON.stringify(
          [{ device_id: 2, action: "setState", value: { temperature: 22 } }],
          null,
          2
        ),
      },
      complex: {
        triggers: JSON.stringify(
          [
            { device_id: 3, condition: "==", value: "detected" },
            { device_id: 1, condition: "==", value: "off" },
          ],
          null,
          2
        ),
        actions: JSON.stringify(
          [
            {
              device_id: 1,
              action: "setState",
              value: { status: "on", brightness: 30 },
            },
            { device_id: 4, action: "setState", value: { recording: true } },
          ],
          null,
          2
        ),
      },
    };
    const example = examples[type];
    setFormData({
      ...formData,
      triggers: example.triggers,
      actions: example.actions,
    });
    validateJson("triggers", example.triggers);
    validateJson("actions", example.actions);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
        <h2 className="text-xl font-semibold mb-4">Create New Automation</h2>
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
                placeholder="Morning Routine"
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Triggers (JSON) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadExample("time")}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Time
                </button>
                <button
                  type="button"
                  onClick={() => loadExample("motion")}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Motion
                </button>
                <button
                  type="button"
                  onClick={() => loadExample("temperature")}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Temp
                </button>
                <button
                  type="button"
                  onClick={() => loadExample("complex")}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Complex
                </button>
              </div>
            </div>
            <textarea
              value={formData.triggers}
              onChange={(e) => {
                setFormData({ ...formData, triggers: e.target.value });
                validateJson("triggers", e.target.value);
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 font-mono text-sm ${
                jsonErrors.triggers
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              rows={6}
              placeholder='[{"device_id": 1, "condition": "==", "value": 1}]'
              required
            />
            {jsonErrors.triggers && (
              <p className="text-xs text-red-600 mt-1">{jsonErrors.triggers}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Actions (JSON) <span className="text-red-500">*</span>
              </label>
            </div>
            <textarea
              value={formData.actions}
              onChange={(e) => {
                setFormData({ ...formData, actions: e.target.value });
                validateJson("actions", e.target.value);
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 font-mono text-sm ${
                jsonErrors.actions
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              rows={6}
              placeholder='[{"device_id": 2, "action": "setState", "value": {"status": "on"}}]'
              required
            />
            {jsonErrors.actions && (
              <p className="text-xs text-red-600 mt-1">{jsonErrors.actions}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="mr-2"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700"
              >
                Active
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <select
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="USER_CREATED">USER_CREATED</option>
                <option value="AI_SUGGESTED">AI_SUGGESTED</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.suggestionStatus}
                onChange={(e) =>
                  setFormData({ ...formData, suggestionStatus: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="PENDING">PENDING</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="submit"
              disabled={!!jsonErrors.triggers || !!jsonErrors.actions}
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

function EditAutomationForm({
  automation,
  homes,
  onSubmit,
  onCancel,
}: {
  automation: Automation;
  homes: Home[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const triggers = automation.triggers || automation.trigger || "";
  const actions = automation.actions || automation.action || "";

  // Helper function to convert deviceId to device_id for display
  const convertToDisplayFormat = (jsonString: string): string => {
    if (!jsonString || !jsonString.trim()) {
      return jsonString;
    }
    try {
      const parsed = JSON.parse(jsonString);
      const convertObject = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map((item) => convertObject(item));
        } else if (obj !== null && typeof obj === "object") {
          const converted: any = {};
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              // Convert deviceId to device_id for display
              const newKey = key === "deviceId" ? "device_id" : key;
              converted[newKey] = convertObject(obj[key]);
            }
          }
          return converted;
        }
        return obj;
      };
      const converted = convertObject(parsed);
      return JSON.stringify(converted, null, 2);
    } catch {
      return jsonString;
    }
  };

  // Try to format JSON for display in form
  let formattedTriggers = triggers;
  let formattedActions = actions;
  try {
    formattedTriggers = convertToDisplayFormat(triggers);
  } catch {}
  try {
    formattedActions = convertToDisplayFormat(actions);
  } catch {}

  const [formData, setFormData] = useState({
    name: automation.name,
    triggers: formattedTriggers,
    actions: formattedActions,
    isActive: automation.isActive,
    homeId: automation.homeId,
    source: automation.source || "USER_CREATED",
    suggestionStatus: automation.suggestionStatus || "PENDING",
  });

  const [jsonErrors, setJsonErrors] = useState<{
    triggers?: string;
    actions?: string;
  }>({});

  const validateJson = (field: "triggers" | "actions", value: string) => {
    if (!value.trim()) {
      setJsonErrors((prev) => ({ ...prev, [field]: undefined }));
      return;
    }
    try {
      JSON.parse(value);
      setJsonErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (e: any) {
      setJsonErrors((prev) => ({
        ...prev,
        [field]: `Invalid JSON: ${e.message}`,
      }));
    }
  };

  const loadExample = (type: "time" | "motion" | "temperature" | "complex") => {
    const examples = {
      time: {
        triggers: JSON.stringify(
          [{ device_id: 1, condition: "==", value: 1 }],
          null,
          2
        ),
        actions: JSON.stringify(
          [{ device_id: 2, action: "setState", value: { status: "on" } }],
          null,
          2
        ),
      },
      motion: {
        triggers: JSON.stringify(
          [{ device_id: 3, condition: "==", value: "detected" }],
          null,
          2
        ),
        actions: JSON.stringify(
          [
            {
              device_id: 1,
              action: "setState",
              value: { status: "on", brightness: 100 },
            },
          ],
          null,
          2
        ),
      },
      temperature: {
        triggers: JSON.stringify(
          [{ device_id: 2, condition: ">", value: 25 }],
          null,
          2
        ),
        actions: JSON.stringify(
          [{ device_id: 2, action: "setState", value: { temperature: 22 } }],
          null,
          2
        ),
      },
      complex: {
        triggers: JSON.stringify(
          [
            { device_id: 3, condition: "==", value: "detected" },
            { device_id: 1, condition: "==", value: "off" },
          ],
          null,
          2
        ),
        actions: JSON.stringify(
          [
            {
              device_id: 1,
              action: "setState",
              value: { status: "on", brightness: 30 },
            },
            { device_id: 4, action: "setState", value: { recording: true } },
          ],
          null,
          2
        ),
      },
    };
    const example = examples[type];
    setFormData({
      ...formData,
      triggers: example.triggers,
      actions: example.actions,
    });
    validateJson("triggers", example.triggers);
    validateJson("actions", example.actions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jsonErrors.triggers || jsonErrors.actions) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
        <h2 className="text-xl font-semibold mb-4">Edit Automation</h2>
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Triggers (JSON) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadExample("time")}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Time
                </button>
                <button
                  type="button"
                  onClick={() => loadExample("motion")}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Motion
                </button>
                <button
                  type="button"
                  onClick={() => loadExample("temperature")}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Temp
                </button>
                <button
                  type="button"
                  onClick={() => loadExample("complex")}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Complex
                </button>
              </div>
            </div>
            <textarea
              value={formData.triggers}
              onChange={(e) => {
                setFormData({ ...formData, triggers: e.target.value });
                validateJson("triggers", e.target.value);
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 font-mono text-sm ${
                jsonErrors.triggers
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              rows={6}
              required
            />
            {jsonErrors.triggers && (
              <p className="text-xs text-red-600 mt-1">{jsonErrors.triggers}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Actions (JSON) <span className="text-red-500">*</span>
              </label>
            </div>
            <textarea
              value={formData.actions}
              onChange={(e) => {
                setFormData({ ...formData, actions: e.target.value });
                validateJson("actions", e.target.value);
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 font-mono text-sm ${
                jsonErrors.actions
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              rows={6}
              required
            />
            {jsonErrors.actions && (
              <p className="text-xs text-red-600 mt-1">{jsonErrors.actions}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActiveEdit"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="mr-2"
              />
              <label
                htmlFor="isActiveEdit"
                className="text-sm font-medium text-gray-700"
              >
                Active
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <select
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="USER_CREATED">USER_CREATED</option>
                <option value="AI_SUGGESTED">AI_SUGGESTED</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.suggestionStatus}
                onChange={(e) =>
                  setFormData({ ...formData, suggestionStatus: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="PENDING">PENDING</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="submit"
              disabled={!!jsonErrors.triggers || !!jsonErrors.actions}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Update
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
