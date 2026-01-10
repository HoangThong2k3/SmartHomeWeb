"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Download, BarChart3 } from "lucide-react";

interface DataPoint {
  timestamp: string;
  value: number;
  rawData: any;
}

interface MetricConfig {
  key: string;
  label: string;
  color: string;
  unit?: string;
  enabled: boolean;
}

interface AdvancedSensorChartProps {
  data: any[];
  parseValue: (value: string) => any;
  extractNumeric: (parsed: any) => number | null;
  deviceId?: number;
  deviceName?: string;
}

const DEFAULT_METRICS: MetricConfig[] = [
  { key: "temperature", label: "Temperature", color: "#ef4444", unit: "°C", enabled: true },
  { key: "humidity", label: "Humidity", color: "#3b82f6", unit: "%", enabled: true },
  { key: "value", label: "Raw Value", color: "#10b981", enabled: false },
];

export function AdvancedSensorChart({
  data,
  parseValue,
  extractNumeric,
  deviceId,
  deviceName,
}: AdvancedSensorChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Chart state
  const [metrics, setMetrics] = useState<MetricConfig[]>(DEFAULT_METRICS);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, data: DataPoint} | null>(null);

  // Data processing
  const processedData = React.useMemo(() => {
    const points: DataPoint[] = [];
    const metricsMap = new Map<string, DataPoint[]>();

    // Initialize metrics map
    metrics.forEach(metric => {
      if (metric.enabled) {
        metricsMap.set(metric.key, []);
      }
    });

    // Process data
    data.forEach((raw) => {
      const timestamp = (raw as any).timeStamp || (raw as any).TimeStamp || (raw as any).timestamp || (raw as any).Timestamp;
      if (!timestamp) return;

      const parsed = parseValue((raw as any).value ?? (raw as any).Value ?? "");
      if (!parsed || typeof parsed !== "object") return;

      // Extract values for each enabled metric
      metrics.forEach(metric => {
        if (!metric.enabled) return;

        let value: number | null = null;

        if (metric.key === "value") {
          value = extractNumeric(parsed);
        } else {
          value = typeof (parsed as any)[metric.key] === "number" ? (parsed as any)[metric.key] : null;
        }

        if (value !== null) {
          const point: DataPoint = {
            timestamp,
            value,
            rawData: raw,
          };

          const existingPoints = metricsMap.get(metric.key) || [];
          existingPoints.push(point);
          metricsMap.set(metric.key, existingPoints);
        }
      });
    });

    // Sort by timestamp and limit to recent data
    metricsMap.forEach((points, key) => {
      points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      // Keep only recent 200 points for performance
      if (points.length > 200) {
        metricsMap.set(key, points.slice(-200));
      }
    });

    return metricsMap;
  }, [data, parseValue, extractNumeric, metrics]);

  // Chart dimensions and scaling
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(400, rect.width - 40),
          height: 400,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Drawing functions
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = dimensions;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    let hasData = false;
    const allValues: number[] = [];
    const allTimestamps: string[] = [];

    // Collect all data points
    processedData.forEach((points, metricKey) => {
      if (points.length > 0) {
        hasData = true;
        points.forEach(point => {
          allValues.push(point.value);
          if (!allTimestamps.includes(point.timestamp)) {
            allTimestamps.push(point.timestamp);
          }
        });
      }
    });

    if (!hasData || allValues.length === 0) {
      // Draw empty state
      ctx.fillStyle = "#6b7280";
      ctx.font = "16px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No numeric data available for chart", width / 2, height / 2);
      return;
    }

    // Calculate scales
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const valueRange = maxValue - minValue || 1;
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Apply zoom and pan
    const visibleStart = Math.max(0, Math.floor(-panOffset / zoomLevel));
    const visibleEnd = Math.min(allTimestamps.length, Math.floor((chartWidth / zoomLevel) - panOffset));

    // Draw grid
    ctx.strokeStyle = "#f3f4f6";
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Value labels
      ctx.fillStyle = "#6b7280";
      ctx.font = "12px Inter, sans-serif";
      ctx.textAlign = "right";
      const value = maxValue - (valueRange * i) / 5;
      ctx.fillText(value.toFixed(1), padding - 10, y + 4);
    }

    // Draw data lines
    processedData.forEach((points, metricKey) => {
      if (points.length < 2) return;

      const metric = metrics.find(m => m.key === metricKey);
      if (!metric) return;

      ctx.strokeStyle = metric.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      points.forEach((point, index) => {
        const timestampIndex = allTimestamps.indexOf(point.timestamp);
        if (timestampIndex < visibleStart || timestampIndex > visibleEnd) return;

        const x = padding + ((timestampIndex - visibleStart) * chartWidth) / Math.max(1, visibleEnd - visibleStart);
        const y = padding + chartHeight - ((point.value - minValue) * chartHeight) / valueRange;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw points
      ctx.fillStyle = metric.color;
      points.forEach((point) => {
        const timestampIndex = allTimestamps.indexOf(point.timestamp);
        if (timestampIndex < visibleStart || timestampIndex > visibleEnd) return;

        const x = padding + ((timestampIndex - visibleStart) * chartWidth) / Math.max(1, visibleEnd - visibleStart);
        const y = padding + chartHeight - ((point.value - minValue) * chartHeight) / valueRange;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Draw axes labels
    ctx.fillStyle = "#374151";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Time", width / 2, height - 10);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Value", 0, 0);
    ctx.restore();

  }, [dimensions, processedData, metrics, zoomLevel, panOffset]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // Event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const delta = e.clientX - dragStart;
      setPanOffset(prev => prev + delta);
      setDragStart(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 10));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.1));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset(0);
  };

  const toggleMetric = (metricKey: string) => {
    setMetrics(prev => prev.map(m =>
      m.key === metricKey ? { ...m, enabled: !m.enabled } : m
    ));
  };

  const exportChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `sensor-chart-${deviceName || deviceId || "unknown"}-${new Date().toISOString().split("T")[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Chart Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Sensor Data Chart
              </h3>
              <p className="text-sm text-gray-500">
                {deviceName ? `${deviceName} (ID: ${deviceId})` : `Device ID: ${deviceId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Metric toggles */}
            {metrics.map(metric => (
              <button
                key={metric.key}
                onClick={() => toggleMetric(metric.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  metric.enabled
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600"
                }`}
                style={{ borderLeft: `3px solid ${metric.color}` }}
              >
                {metric.label}
              </button>
            ))}

            {/* Chart controls */}
            <div className="flex items-center gap-1 ml-4 border-l border-gray-200 pl-4">
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={exportChart}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="Export Chart"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ height: "400px" }}
      >
        <canvas
          ref={canvasRef}
          className={`cursor-${isDragging ? "grabbing" : "grab"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ display: "block" }}
        />

        {/* Loading overlay */}
        {!processedData.size && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-gray-500">Processing data...</div>
          </div>
        )}

        {/* Tooltip */}
        {hoveredPoint && (
          <div className="absolute bg-black text-white px-2 py-1 rounded text-xs pointer-events-none z-10"
               style={{ left: hoveredPoint.x + 10, top: hoveredPoint.y - 10 }}>
            {new Date(hoveredPoint.data.timestamp).toLocaleString()}
            <br />
            Value: {hoveredPoint.data.value}
          </div>
        )}
      </div>

      {/* Chart Info */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Zoom: {zoomLevel.toFixed(1)}x</span>
          <span>Pan: {panOffset.toFixed(0)}px</span>
          <span>Drag to pan • Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
