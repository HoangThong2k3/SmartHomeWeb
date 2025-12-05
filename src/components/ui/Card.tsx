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
    <div className={`bg-white rounded-lg p-6 transition-shadow duration-300 card-shadow border border-gray-200 shadow-md hover:shadow-xl group`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-700 tracking-wide mb-1 uppercase group-hover:text-blue-600">{title}</p>
          <p className="text-3xl font-black text-gray-900 mt-1 group-hover:text-blue-500 duration-150">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`p-3 rounded-full ${colorClasses[color]} bg-opacity-20 shadow-md group-hover:bg-opacity-40 transition-all`}>
            <div className={`text-${color}-600 text-2xl`}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}
