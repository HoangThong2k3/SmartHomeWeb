"use client";

interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "purple" | "orange";
}

export default function Card({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
}: CardProps) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div
            className={`p-3 rounded-full ${colorClasses[color]} bg-opacity-10`}
          >
            <div className={`text-${color}-600`}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}
