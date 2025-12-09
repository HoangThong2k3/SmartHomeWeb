"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw, Server, Database, Clock } from "lucide-react";

export default function HealthPage() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchHealthData = async () => {
    setIsLoading(true);
    setError(null);
    console.log('[HealthPage] Fetching health data for user:', user?.id, 'role:', user?.role);
    
    const newHealthData: any = { live: null, ready: null, info: null };
    const errors: string[] = [];
    const extractStatus = (obj: any) => obj?.Status ?? obj?.status ?? "Unknown";

    // Fetch Live status (public, no auth required)
    try {
      const live = await apiService.getHealthLive();
      console.log('[HealthPage] Live status received:', extractStatus(live));
      newHealthData.live = live;
    } catch (err: any) {
      console.error('[HealthPage] Error fetching live status:', err);
      errors.push(`Live check failed: ${err?.message || 'Unknown error'}`);
    }

    // Fetch Ready status (admin only)
    if (user?.role === "admin") {
      try {
        const ready = await apiService.getHealthReady();
        console.log('[HealthPage] Ready status received:', extractStatus(ready));
        newHealthData.ready = ready;
      } catch (err: any) {
        console.error('[HealthPage] Error fetching ready status:', err);
        if (err?.response?.status === 401) {
          errors.push('Readiness check requires admin authentication');
        } else {
          errors.push(`Ready check failed: ${err?.message || 'Unknown error'}`);
        }
      }
    }

    // Fetch System Info
    try {
      const info = await apiService.getHealthInfo();
      const normalizedMeta = {
        environment: info?.Meta?.Environment ?? (info as any)?.meta?.environment,
      };
      console.log('[HealthPage] System info received:', normalizedMeta.environment);
      newHealthData.info = info;
    } catch (err: any) {
      console.error('[HealthPage] Error fetching system info:', err);
      if (err?.response?.status === 401) {
        errors.push('System info requires authentication');
      } else {
        errors.push(`System info failed: ${err?.message || 'Unknown error'}`);
      }
    }

    // Set data even if some requests failed
    setHealthData(newHealthData);
    setLastRefresh(new Date());

    // Show errors if any critical data is missing
    if (errors.length > 0 && !newHealthData.live && !newHealthData.info) {
      setError(errors.join('; '));
    } else if (errors.length > 0) {
      // Show warning but don't block UI if we have some data
      console.warn('[HealthPage] Partial data loaded with errors:', errors);
    } else {
      console.log('[HealthPage] Health data updated successfully');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchHealthData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const getStatusValue = (statusObj: any) =>
    statusObj?.Status ?? statusObj?.status ?? "Unknown";

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "healthy":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "unhealthy":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "unhealthy":
        return "text-red-600 bg-red-100";
      case "degraded":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Normalize meta casing between backend PascalCase and possible camelCase
  const normalizeMeta = (meta: any) => {
    if (!meta) return null;
    const source = meta.Meta ?? meta.meta ?? meta;
    if (!source) return null;

    return {
      environment: source.Environment ?? source.environment ?? "",
      machine: source.Machine ?? source.machine ?? "",
      startedAtUtc: source.StartedAtUtc ?? source.startedAtUtc ?? "",
      uptimeSeconds: source.UptimeSeconds ?? source.uptimeSeconds,
      build:
        source.Build || source.build
          ? {
              version: source.Build?.Version ?? source.build?.version ?? "",
              commit: source.Build?.Commit ?? source.build?.commit ?? "",
              buildTimeUtc:
                source.Build?.BuildTimeUtc ??
                source.build?.buildTimeUtc ??
                undefined,
            }
          : undefined,
      ef:
        source.Ef || source.ef
          ? {
              provider: source.Ef?.Provider ?? source.ef?.provider ?? "",
              database: source.Ef?.Database ?? source.ef?.database ?? "",
              server: source.Ef?.Server ?? source.ef?.server ?? "",
              appliedCount:
                source.Ef?.AppliedCount ?? source.ef?.appliedCount ?? 0,
              pendingCount:
                source.Ef?.PendingCount ?? source.ef?.pendingCount ?? 0,
              latestApplied:
                source.Ef?.LatestApplied ?? source.ef?.latestApplied ?? "",
              pending: source.Ef?.Pending ?? source.ef?.pending ?? [],
            }
          : undefined,
    };
  };

  // Get best available meta data (priority: info > ready > live)
  const getMetaData = () => {
    const rawMeta =
      healthData?.info?.Meta ??
      healthData?.info?.meta ??
      healthData?.ready?.Meta ??
      healthData?.ready?.meta ??
      healthData?.live?.Meta ??
      healthData?.live?.meta ??
      null;
    return normalizeMeta(rawMeta);
  };

  const meta = getMetaData();

  if (isLoading && !healthData) {
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
              <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
              <p className="text-gray-600 mt-2">
                Monitor system status and performance
              </p>
            </div>
            <button
              onClick={fetchHealthData}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Live</p>
                <p className="text-lg font-semibold text-gray-900">
                  {getStatusValue(healthData?.live)}
                </p>
              </div>
              {getStatusIcon(getStatusValue(healthData?.live))}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ready</p>
                <p className="text-lg font-semibold text-gray-900">
                  {healthData?.ready ? getStatusValue(healthData?.ready) : "N/A"}
                </p>
              </div>
              {getStatusIcon(getStatusValue(healthData?.ready))}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Environment</p>
                <p className="text-lg font-semibold text-gray-900">
                  {meta?.environment || "Unknown"}
                </p>
                <p className="text-xs text-gray-500">
                  Uptime: {meta?.uptimeSeconds !== undefined ? formatUptime(meta.uptimeSeconds) : "N/A"}
                </p>
              </div>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {!healthData && !isLoading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Unable to load health data. Please try refreshing.</p>
            </div>
          </div>
        )}

        {healthData && (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">System Status</h2>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Server className="w-10 h-10 text-blue-500 mr-4 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">Live Status</div>
                    <div className="flex items-center">
                      {getStatusIcon(getStatusValue(healthData.live))}
                      <span className={`ml-2 text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(getStatusValue(healthData.live))}`}>
                        {getStatusValue(healthData.live)}
                      </span>
                    </div>
                    {healthData.live?.checkedAtUtc && (
                      <div className="text-xs text-gray-500 mt-1">
                        Checked: {new Date(healthData.live.checkedAtUtc).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Activity className="w-10 h-10 text-purple-500 mr-4 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">System Info</div>
                    <div className="text-sm text-gray-700">
                      {meta?.environment || "Unknown"}
                    </div>
                    {meta?.uptimeSeconds !== undefined && (
                      <div className="text-xs text-gray-500 mt-1">
                        Uptime: {formatUptime(meta.uptimeSeconds)}
                      </div>
                    )}
                  </div>
                </div>

                {healthData.ready && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
                    <Database className="w-10 h-10 text-green-500 mr-4 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">Ready Status</div>
                      <div className="flex items-center">
                        {getStatusIcon(getStatusValue(healthData.ready))}
                        <span className={`ml-2 text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(getStatusValue(healthData.ready))}`}>
                          {getStatusValue(healthData.ready)}
                        </span>
                      </div>
                      {healthData.ready?.checkedAtUtc && (
                        <div className="text-xs text-gray-500 mt-1">
                          Checked: {new Date(healthData.ready.checkedAtUtc).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Health Checks */}
            {healthData.live?.entries && healthData.live.entries.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Health Checks</h3>
                <div className="space-y-3">
                  {healthData.live.entries.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center flex-1">
                        {getStatusIcon(entry.Status || entry.status || "Unknown")}
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-900">{entry.name || entry.Name || `Check ${index + 1}`}</div>
                          <div className="text-sm text-gray-600">{entry.description || entry.Description || "No description"}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 ml-4">
                        {entry.durationMs !== undefined ? `${entry.durationMs}ms` : entry.DurationMs !== undefined ? `${entry.DurationMs}ms` : "N/A"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Readiness Checks */}
            {healthData.ready?.entries && healthData.ready.entries.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Readiness Checks</h3>
                <div className="space-y-3">
                  {healthData.ready.entries.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center flex-1">
                        {getStatusIcon(entry.Status || entry.status || "Unknown")}
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-900">{entry.name || entry.Name || `Check ${index + 1}`}</div>
                          <div className="text-sm text-gray-600">{entry.description || entry.Description || "No description"}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 ml-4">
                        {entry.durationMs !== undefined ? `${entry.durationMs}ms` : entry.DurationMs !== undefined ? `${entry.DurationMs}ms` : "N/A"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Information */}
            {meta && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Environment</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-600">Environment:</span>
                        <span className="font-medium text-gray-900">{meta.environment || "N/A"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-600">Machine:</span>
                        <span className="font-medium text-gray-900">{meta.machine || "N/A"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-600">Uptime:</span>
                        <span className="font-medium text-gray-900">
                          {meta.uptimeSeconds !== undefined 
                            ? formatUptime(meta.uptimeSeconds) 
                            : "N/A"}
                        </span>
                      </div>
                      {meta.startedAtUtc && (
                        <div className="flex justify-between py-1">
                          <span className="text-gray-600">Started At:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(meta.startedAtUtc).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {meta.build && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Build Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-600">Version:</span>
                          <span className="font-medium text-gray-900">{meta.build?.version || "N/A"}</span>
                        </div>
                        {meta.build?.commit && (
                          <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-600">Commit:</span>
                            <span className="font-medium font-mono text-xs text-gray-900">{meta.build.commit}</span>
                          </div>
                        )}
                        {meta.build?.buildTimeUtc && (
                          <div className="flex justify-between py-1">
                            <span className="text-gray-600">Build Time:</span>
                            <span className="font-medium text-gray-900">
                              {new Date(meta.build.buildTimeUtc).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Database Information */}
            {meta?.ef && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Database Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Connection</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-600">Provider:</span>
                        <span className="font-medium text-gray-900">{meta.ef?.provider || "N/A"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-600">Database:</span>
                        <span className="font-medium text-gray-900">{meta.ef?.database || "N/A"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-600">Server:</span>
                        <span className="font-medium text-gray-900">{meta.ef?.server || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Migrations</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-600">Applied:</span>
                        <span className="font-medium text-gray-900">{meta.ef?.appliedCount ?? "N/A"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-600">Pending:</span>
                        <span className={`font-medium ${(meta.ef?.pendingCount ?? 0) > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                          {meta.ef?.pendingCount ?? "N/A"}
                        </span>
                      </div>
                      {meta.ef?.latestApplied && (
                        <div className="flex justify-between py-1">
                          <span className="text-gray-600">Latest:</span>
                          <span className="font-medium font-mono text-xs text-gray-900">{meta.ef.latestApplied}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}