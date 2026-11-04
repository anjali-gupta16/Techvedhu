"use client";

import React from "react";
import { Lightbulb, ArrowUpRight, IndianRupee, Zap } from "lucide-react";

interface RecommendationCardProps {
  title: string;
  description: string;
  potentialKwh?: number;
  potentialCost?: number;
  priority: string;
  category?: string;
}

export default function RecommendationCard({
  title,
  description,
  potentialKwh,
  potentialCost,
  priority,
  category,
}: RecommendationCardProps) {
  const priorityStyles: Record<string, { bg: string; text: string; border: string }> = {
    high: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
    medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    low: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  };

  const style = priorityStyles[priority.toLowerCase()] || priorityStyles.medium;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Lightbulb className="w-4 h-4" />
          </div>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
            {priority} Priority
          </span>
          {category && (
            <span className="text-[10px] uppercase font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {category}
            </span>
          )}
        </div>
      </div>

      <h4 className="text-sm font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-xs text-gray-600 leading-relaxed mb-4">{description}</p>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          {potentialKwh !== undefined && (
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <Zap className="w-3.5 h-3.5" /> ~{potentialKwh.toFixed(1)} kWh/mo
            </span>
          )}
          {potentialCost !== undefined && (
            <span className="flex items-center gap-1 font-semibold text-blue-600">
              <IndianRupee className="w-3.5 h-3.5" /> ~₹{potentialCost.toFixed(0)}/mo
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-400 italic">Est. Savings</span>
      </div>
    </div>
  );
}

