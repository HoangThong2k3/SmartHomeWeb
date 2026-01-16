 "use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { apiService } from "@/services/api";
import { ServiceStatusHistory } from "@/types";

export default function ServiceStatusHistoryPage() {
  const [items, setItems] = useState<ServiceStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiService.getServiceStatusHistory();
        setItems(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="max-w-[var(--max-content-width)] mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Service Status History</h1>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">UserId</th>
                    <th className="px-4 py-2">Old</th>
                    <th className="px-4 py-2">New</th>
                    <th className="px-4 py-2">ChangedBy</th>
                    <th className="px-4 py-2">ChangedAt</th>
                    <th className="px-4 py-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.Id} className="border-t">
                      <td className="px-4 py-2">{it.Id}</td>
                      <td className="px-4 py-2">{it.UserId}</td>
                      <td className="px-4 py-2">{it.OldStatus}</td>
                      <td className="px-4 py-2">{it.NewStatus}</td>
                      <td className="px-4 py-2">{it.ChangedBy}</td>
                      <td className="px-4 py-2">{new Date(it.ChangedAt).toLocaleString()}</td>
                      <td className="px-4 py-2">{it.Note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}


