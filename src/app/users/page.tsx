"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { User } from "@/types";
import { Users, Plus, Edit, Trash2, Mail, Phone, Calendar, Shield, ShieldCheck, Ban, CheckCircle, RefreshCw, Home } from "lucide-react";

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const userList = await apiService.getUsers();
      setUsers(userList);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      const newUser = await apiService.createUser({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        phoneNumber: userData.phoneNumber || undefined,
        serviceExpiryDate: userData.serviceExpiryDate || undefined,
        address: userData.address || undefined,
        currentPackageId: userData.currentPackageId || undefined,
      });
      setUsers([...users, newUser]);
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    }
  };

  const handleUpdateUser = async (id: string, userData: any) => {
    try {
      await apiService.updateUser(id, {
        name: userData.name,
        role: userData.role,
        phoneNumber: userData.phoneNumber || undefined,
        serviceStatus: userData.serviceStatus || undefined,
        serviceExpiryDate: userData.serviceExpiryDate || undefined,
        address: userData.address || undefined,
        currentPackageId: userData.currentPackageId || undefined,
      });
      await fetchUsers(); // Refresh list to get updated user data
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    }
  };

  const handleToggleUserStatus = async (id: string, targetStatus: string) => {
    const normalized = targetStatus?.toString().toUpperCase();
    const action = normalized === "INACTIVE" ? "deactivate" : "update status";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      // Lấy thông tin user trước khi activate
      const targetUser = users.find((u) => u.id === id);
      const isActivating = normalized === "ACTIVE";
      const isCustomer = targetUser?.role === "customer";

      // Call new API to update status
      await apiService.updateUserStatus(id, targetStatus);

      // Nếu activate service cho customer, tự động tạo home nếu chưa có
      if (isActivating && isCustomer) {
        try {
          // Kiểm tra xem user đã có home chưa
          const userHomes = await apiService.getHomesByOwner(id);

          // Nếu chưa có home, tạo home mặc định
          if (!userHomes || userHomes.length === 0) {
            const homeName = targetUser?.name
              ? `Nhà của ${targetUser.name}`
              : "Ngôi nhà của tôi";

            await apiService.createHome({
              name: homeName,
              ownerId: id,
              securityStatus: "DISARMED",
            });

            console.log(
              `[UsersPage] Created default home for user ${id} (${targetUser?.name || targetUser?.email})`
            );
          } else {
            console.log(
              `[UsersPage] User ${id} already has ${userHomes.length} home(s)`
            );
          }
        } catch (homeErr: any) {
          // Nếu không tạo được home, chỉ log warning, không block activate service
          console.warn(
            `[UsersPage] Failed to create home for user ${id}:`,
            homeErr
          );
          // Hiển thị warning nhưng không block activate service
          alert(
            `Đã cập nhật trạng thái dịch vụ cho user, nhưng không thể tạo home tự động. Vui lòng tạo home thủ công cho user này.`
          );
        }
      }

      await fetchUsers(); // Refresh list
    } catch (err: any) {
      setError(err.message || `Failed to ${action} user`);
    }
  };

  const handleCreateHomeForUser = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    
    if (!confirm(`Tạo home cho user ${targetUser.name} (${targetUser.email})?`)) return;
    
    try {
      // Kiểm tra xem user đã có home chưa
      const userHomes = await apiService.getHomesByOwner(userId);
      
      if (userHomes && userHomes.length > 0) {
        alert(`User này đã có ${userHomes.length} home rồi.`);
        return;
      }
      
      const homeName = targetUser.name ? `Nhà của ${targetUser.name}` : "Ngôi nhà của tôi";
      
      await apiService.createHome({
        name: homeName,
        ownerId: userId,
        securityStatus: "DISARMED",
      });
      
      alert(`Đã tạo home "${homeName}" cho user ${targetUser.name} thành công!`);
      await fetchUsers(); // Refresh list
    } catch (err: any) {
      setError(err.message || "Failed to create home for user");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await apiService.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    }
  };

  const getRoleIcon = (role: string) => {
    return role === "admin" ? (
      <ShieldCheck className="w-4 h-4 text-red-500" />
    ) : (
      <Shield className="w-4 h-4 text-blue-500" />
    );
  };

  const getRoleColor = (role: string) => {
    return role === "admin" 
      ? "bg-red-100 text-red-800" 
      : "bg-blue-100 text-blue-800";
  };

  if (isLoading) {
    return (
      <ProtectedRoute requireAdmin>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Users</h1>
              <p className="text-gray-600 mt-2">
                Manage system users and permissions
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first user.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add User
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">User Management</h3>
              <p className="text-sm text-gray-500">{users.length} users total</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRoleIcon(user.role)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {user.role.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-700">
                          {user.serviceStatus || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.serviceStatus?.toUpperCase() === "INACTIVE" ? (
                            <button
                              onClick={() => handleToggleUserStatus(user.id, "ACTIVE")}
                              className="text-green-600 hover:text-green-800"
                              title="Activate user"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleUserStatus(user.id, "INACTIVE")}
                              className="text-orange-600 hover:text-orange-800"
                              title="Deactivate user"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          {/* Hiển thị button tạo home cho customer có service ACTIVE */}
                          {user.role === "customer" && 
                           user.serviceStatus?.toUpperCase() === "ACTIVE" && (
                            <button
                              onClick={() => handleCreateHomeForUser(user.id)}
                              className="text-purple-600 hover:text-purple-800"
                              title="Tạo home cho user"
                            >
                              <Home className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showCreateForm && (
          <CreateUserForm
            onSubmit={handleCreateUser}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {editingUser && (
          <EditUserForm
            user={editingUser}
            onSubmit={(data) => handleUpdateUser(editingUser.id, data)}
            onCancel={() => setEditingUser(null)}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
}

function CreateUserForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    role: "customer",
    phoneNumber: "",
    serviceExpiryDate: "",
    address: "",
    currentPackageId: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      serviceExpiryDate: formData.serviceExpiryDate
        ? new Date(formData.serviceExpiryDate).toISOString()
        : undefined,
      currentPackageId: formData.currentPackageId
        ? Number(formData.currentPackageId)
        : undefined,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "customer" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Expiry Date</label>
            <input
              type="date"
              value={formData.serviceExpiryDate}
              onChange={(e) => setFormData({ ...formData, serviceExpiryDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Package ID</label>
            <input
              type="number"
              value={formData.currentPackageId}
              onChange={(e) => setFormData({ ...formData, currentPackageId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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

function EditUserForm({ user, onSubmit, onCancel }: { user: User; onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({ 
    name: user.name, 
    role: user.role,
    phoneNumber: user.phoneNumber || "",
    serviceStatus: user.serviceStatus || "ACTIVE",
    serviceExpiryDate: user.serviceExpiryDate
      ? new Date(user.serviceExpiryDate).toISOString().split("T")[0]
      : "",
    address: user.address || "",
    currentPackageId: user.currentPackageId?.toString() || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      serviceExpiryDate: formData.serviceExpiryDate
        ? new Date(formData.serviceExpiryDate).toISOString()
        : undefined,
      currentPackageId: formData.currentPackageId
        ? Number(formData.currentPackageId)
        : undefined,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "customer" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Status</label>
            <select
              value={formData.serviceStatus}
              onChange={(e) => setFormData({ ...formData, serviceStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="INACTIVE">INACTIVE</option>
              <option value="INSTALLING">INSTALLING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Expiry Date</label>
            <input
              type="date"
              value={formData.serviceExpiryDate}
              onChange={(e) => setFormData({ ...formData, serviceExpiryDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Package ID</label>
            <input
              type="number"
              value={formData.currentPackageId}
              onChange={(e) => setFormData({ ...formData, currentPackageId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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