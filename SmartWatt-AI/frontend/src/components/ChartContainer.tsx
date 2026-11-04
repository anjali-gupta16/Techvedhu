"use client";

import React, { useState, useEffect } from "react";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export default function ChartContainer({
  title,
  subtitle,
  action,
  children,
}: ChartContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>
        {mounted ? (
          children
        ) : (
          <div className="h-72 w-full flex items-center justify-center bg-slate-50/60 rounded-xl border border-dashed border-gray-200 animate-pulse text-xs text-slate-400 font-medium">
            Rendering telemetry chart...
          </div>
        )}
      </div>
    </div>
  );
}
