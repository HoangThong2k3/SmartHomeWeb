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

// Helper to format trigger/action thành chuỗi mô tả thân thiện
function buildTriggerDescription(a: Automation): string {
  if (a.triggerType === "Time") {
    const start = a.triggerTimeStart ?? "";
    const end = a.triggerTimeEnd ?? "";
    if (start || end) return `Thời gian: ${start || "?"} → ${end || "?"}`;
    return "Kích hoạt theo thời gian";
  }

  if (a.triggerDeviceId != null) {
    const cond = a.triggerCondition || "";
    const val =
      a.triggerValue != null
        ? a.triggerValue
        : "";
    return `Thiết bị #${a.triggerDeviceId} ${cond} ${val}`.trim();
  }

  return a.triggerType || "Không có trigger";
}

function buildActionDescription(a: Automation): string {
  return `Thiết bị #${a.actionDeviceId} ← ${a.actionValue}`;
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

    // Admin không được xem automations của khách (Privacy Wall)
    if (isAdmin) {
      setIsLoading(false);
      setError("Admin không thể xem automations của khách hàng (Privacy Wall). Vui lòng đăng nhập bằng tài khoản customer để xem hoặc quản lý automations.");
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
      console.log("[AutomationsPage] Total automations:", allAutomations.length);
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
      console.log("[AutomationsPage] Creating automation with data:", automationData);
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

      const payload = {
        homeId: homeIdNum.toString(),
        name: automationData.name,
        isEnabled: Boolean(automationData.isEnabled),
        triggerType: automationData.triggerType,
        triggerDeviceId:
          automationData.triggerType === "DeviceState"
            ? Number(automationData.triggerDeviceId) || undefined
            : undefined,
        triggerCondition:
          automationData.triggerType === "DeviceState"
            ? automationData.triggerCondition || undefined
            : undefined,
        triggerValue:
          automationData.triggerType === "DeviceState" &&
          automationData.triggerValue !== ""
            ? Number(automationData.triggerValue)
            : undefined,
        triggerTimeStart:
          automationData.triggerType === "Time"
            ? automationData.triggerTimeStart || undefined
            : undefined,
        triggerTimeEnd:
          automationData.triggerType === "Time"
            ? automationData.triggerTimeEnd || undefined
            : undefined,
        actionDeviceId: Number(automationData.actionDeviceId),
        actionValue: Number(automationData.actionValue),
      };
      console.log("[AutomationsPage] Automation payload:", payload);

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
        !automationData.triggerType ||
        !automationData.actionDeviceId
      ) {
        const errorMsg = "Missing required fields: Name, TriggerType, ActionDeviceId";
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

      const payload = {
        name: automationData.name,
        isEnabled: Boolean(automationData.isEnabled),
        triggerType: automationData.triggerType,
        triggerDeviceId: automationData.triggerType === "DeviceState"
          ? Number(automationData.triggerDeviceId) || undefined
          : undefined,
        triggerCondition: automationData.triggerType === "DeviceState"
          ? automationData.triggerCondition || undefined
          : undefined,
        triggerValue: automationData.triggerType === "DeviceState" &&
          automationData.triggerValue !== ""
          ? Number(automationData.triggerValue)
          : undefined,
        triggerTimeStart: automationData.triggerType === "Time"
          ? automationData.triggerTimeStart || undefined
          : undefined,
        triggerTimeEnd: automationData.triggerType === "Time"
          ? automationData.triggerTimeEnd || undefined
          : undefined,
        actionDeviceId: automationData.actionDeviceId != null
          ? Number(automationData.actionDeviceId)
          : undefined,
        actionValue: automationData.actionValue != null
          ? Number(automationData.actionValue)
          : undefined,
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
              const triggerText = buildTriggerDescription(automation);
              const actionText = buildActionDescription(automation);

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
                        {automation.isEnabled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <Power className="w-3 h-3 mr-1" />
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            <PowerOff className="w-3 h-3 mr-1" />
                            Disabled
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Building2 className="w-4 h-4 mr-1" />
                        {getHomeName(automation.homeId)}
                      </div>

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
                      <div className="mt-1 text-xs bg-gray-50 p-2 rounded border border-gray-200">
                        {triggerText || (
                          <span className="text-gray-400">No triggers</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Actions
                      </span>
                      <div className="mt-1 text-xs bg-gray-50 p-2 rounded border border-gray-200">
                        {actionText || (
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
    isEnabled: true,
    homeId: "",
    triggerType: "DeviceState",
    triggerDeviceId: "",
    triggerCondition: ">",
    triggerValue: "",
    triggerTimeStart: "",
    triggerTimeEnd: "",
    actionDeviceId: "",
    actionValue: "1",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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

          {/* Trigger configuration */}
          <div className="grid grid-cols-3 gap-4 border-t pt-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Type
              </label>
              <select
                value={formData.triggerType}
                onChange={(e) =>
                  setFormData({ ...formData, triggerType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="DeviceState">DeviceState</option>
                <option value="Time">Time</option>
              </select>
            </div>

            {formData.triggerType === "DeviceState" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger Device Id
                  </label>
                  <input
                    type="number"
                    value={formData.triggerDeviceId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        triggerDeviceId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition / Value
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.triggerCondition}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          triggerCondition: e.target.value,
                        })
                      }
                      className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value=">">{">"}</option>
                      <option value="<">{"<"}</option>
                      <option value="=">{"="}</option>
                      <option value=">=">{">="}</option>
                    </select>
                    <input
                      type="number"
                      value={formData.triggerValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          triggerValue: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {formData.triggerType === "Time" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Start
                  </label>
                  <input
                    type="time"
                    value={formData.triggerTimeStart}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        triggerTimeStart: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time End
                  </label>
                  <input
                    type="time"
                    value={formData.triggerTimeEnd}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        triggerTimeEnd: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </>
            )}
          </div>

          {/* Action & status */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, isEnabled: e.target.checked })
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
                Action Device Id
              </label>
              <input
                type="number"
                value={formData.actionDeviceId}
                onChange={(e) =>
                  setFormData({ ...formData, actionDeviceId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="VD: 18"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Value
              </label>
              <input
                type="number"
                value={formData.actionValue}
                onChange={(e) =>
                  setFormData({ ...formData, actionValue: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="VD: 1 = ON, 0 = OFF"
              />
            </div>
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
  const [formData, setFormData] = useState({
    name: automation.name,
    isEnabled: automation.isEnabled,
    homeId: automation.homeId,
    triggerType: automation.triggerType || "DeviceState",
    triggerDeviceId:
      automation.triggerDeviceId != null
        ? String(automation.triggerDeviceId)
        : "",
    triggerCondition: automation.triggerCondition || ">",
    triggerValue:
      automation.triggerValue != null ? String(automation.triggerValue) : "",
    triggerTimeStart: automation.triggerTimeStart || "",
    triggerTimeEnd: automation.triggerTimeEnd || "",
    actionDeviceId: String(automation.actionDeviceId || ""),
    actionValue: String(automation.actionValue ?? "1"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

          {/* Trigger configuration */}
          <div className="grid grid-cols-3 gap-4 border-t pt-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Type
              </label>
              <select
                value={formData.triggerType}
                onChange={(e) =>
                  setFormData({ ...formData, triggerType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="DeviceState">DeviceState</option>
                <option value="Time">Time</option>
              </select>
            </div>

            {formData.triggerType === "DeviceState" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger Device Id
                  </label>
                  <input
                    type="number"
                    value={formData.triggerDeviceId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        triggerDeviceId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition / Value
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.triggerCondition}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          triggerCondition: e.target.value,
                        })
                      }
                      className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value=">">{">"}</option>
                      <option value="<">{"<"}</option>
                      <option value="=">{"="}</option>
                      <option value=">=">{">="}</option>
                    </select>
                    <input
                      type="number"
                      value={formData.triggerValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          triggerValue: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {formData.triggerType === "Time" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Start
                  </label>
                  <input
                    type="time"
                    value={formData.triggerTimeStart}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        triggerTimeStart: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time End
                  </label>
                  <input
                    type="time"
                    value={formData.triggerTimeEnd}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        triggerTimeEnd: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </>
            )}
          </div>

          {/* Action & status */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActiveEdit"
                checked={formData.isEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, isEnabled: e.target.checked })
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
                Action Device Id
              </label>
              <input
                type="number"
                value={formData.actionDeviceId}
                onChange={(e) =>
                  setFormData({ ...formData, actionDeviceId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Value
              </label>
              <input
                type="number"
                value={formData.actionValue}
                onChange={(e) =>
                  setFormData({ ...formData, actionValue: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="submit"
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
