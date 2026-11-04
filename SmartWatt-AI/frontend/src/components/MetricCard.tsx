import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  icon: LucideIcon;
  color?: "blue" | "cyan" | "green" | "orange" | "red" | "purple";
  loading?: boolean;
}

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-500",
    text: "text-blue-600",
  },
  cyan: {
    bg: "bg-cyan-50",
    icon: "bg-cyan-500",
    text: "text-cyan-600",
  },
  green: {
    bg: "bg-emerald-50",
    icon: "bg-emerald-500",
    text: "text-emerald-600",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "bg-orange-500",
    text: "text-orange-600",
  },
  red: {
    bg: "bg-red-50",
    icon: "bg-red-500",
    text: "text-red-600",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "bg-purple-500",
    text: "text-purple-600",
  },
};

export default function MetricCard({
  title,
  value,
  unit,
  change,
  icon: Icon,
  color = "blue",
  loading = false,
}: MetricCardProps) {
  const colors = colorMap[color];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-20 mb-1" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <div className={`w-10 h-10 ${colors.icon} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </p>
      {change !== undefined && (
        <p className={`text-xs mt-1 ${change >= 0 ? "text-red-500" : "text-green-500"}`}>
          {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)}% from yesterday
        </p>
      )}
    </div>
  );
}
