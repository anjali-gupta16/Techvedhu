"use client";

import React from "react";
import { Zap, Power } from "lucide-react";

interface ApplianceCardProps {
  name: string;
  powerWatts: number;
  ratedWatts: number;
  isActive: boolean;
  energyKwh?: number;
  onToggle?: (name: string, nextStatus: boolean) => void;
  disabled?: boolean;
}

export default function ApplianceCard({
  name,
  powerWatts,
  ratedWatts,
  isActive,
  energyKwh,
  onToggle,
  disabled = false,
}: ApplianceCardProps) {
  const percentage = Math.min(100, Math.round((powerWatts / ratedWatts) * 100));

  return (
    <div className={`p-5 rounded-xl border transition-all duration-200 ${
      isActive
        ? "bg-white border-blue-200 shadow-sm"
        : "bg-slate-50/60 border-gray-200 opacity-85"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
          }`}>
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">{name}</h4>
            <p className="text-[11px] text-gray-500">Rated: {ratedWatts} W</p>
          </div>
        </div>

        <button
          onClick={() => onToggle && onToggle(name, !isActive)}
          disabled={disabled}
          title={isActive ? "Force appliance off" : "Force appliance on"}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            isActive
              ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
          }`}
        >
          <Power className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-black text-gray-900">
            {powerWatts.toFixed(1)} <span className="text-xs font-semibold text-gray-500">W</span>
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isActive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-gray-100 text-gray-600"
          }`}>
            {isActive ? "ACTIVE" : "STANDBY"}
          </span>
        </div>

        {/* Load bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentage > 85 ? "bg-rose-500" : percentage > 50 ? "bg-blue-600" : "bg-cyan-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {energyKwh !== undefined && (
          <div className="flex justify-between text-[11px] text-gray-400 pt-1">
            <span>Interval Energy</span>
            <span className="font-semibold text-gray-700">{energyKwh.toFixed(4)} kWh</span>
          </div>
        )}
      </div>
    </div>
  );
}

