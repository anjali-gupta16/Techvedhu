"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ChartContainer from "@/components/ChartContainer";
import {
  BarChart3,
  Calendar,
  Zap,
  TrendingUp,
  Clock,
  PieChart as PieIcon,
  IndianRupee,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "@/services/api";

const COLORS = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6"];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"24h" | "7d" | "30d" | "180d">("7d");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const endpoint =
          period === "24h"
            ? "/api/reports/daily"
            : period === "7d"
            ? "/api/reports/weekly"
            : "/api/reports/monthly";
        const res = await api.get(endpoint);
        setReport(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [period]);

  const appliances = report?.appliances || [];

  return (
    <DashboardLayout title="Energy Analytics & Trends">
      <div className="space-y-6">
        {/* Top Header & Range Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Historical Electricity Analytics
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Multi-horizon load disaggregation & peak tariff analysis.
            </p>
          </div>

          <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold">
            {(["24h", "7d", "30d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                  period === p
                    ? "bg-white text-blue-600 shadow-sm font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {p === "24h" ? "Past 24 Hours" : p === "7d" ? "Past 7 Days" : "Past 30 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* Aggregate KPI Cards */}
        {report && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Period Total Consumption</span>
              <p className="text-3xl font-black text-gray-900 mt-2">
                {report.total_kwh} <span className="text-sm font-normal text-gray-500">kWh</span>
              </p>
              <p className="text-xs text-blue-600 mt-1 font-semibold">
                Across {appliances.length} active monitored devices
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Electricity Cost (Tariff ₹{report.tariff_per_kwh}/kWh)</span>
              <p className="text-3xl font-black text-emerald-600 mt-2">
                ₹{report.total_cost}
              </p>
              <p className="text-xs text-emerald-700 mt-1 font-semibold">
                Billed at local residential tariff
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Estimated Carbon Burden</span>
              <p className="text-3xl font-black text-teal-600 mt-2">
                {report.total_co2_kg} <span className="text-sm font-normal text-gray-500">kg CO₂e</span>
              </p>
              <p className="text-xs text-teal-700 mt-1 font-semibold">
                Grid factor: {report.emission_factor} kg/kWh
              </p>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appliance Comparison Bar Chart */}
          <ChartContainer
            title="Appliance-Wise Energy Consumption"
            subtitle={`Kilowatt-hours (kWh) consumed over selected period`}
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={appliances}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="appliance_name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "8px",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`${val} kWh`, "Consumption"]}
                  />
                  <Bar dataKey="energy_kwh" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>

          {/* Appliance Share Donut */}
          <ChartContainer
            title="Load Proportion Breakdown"
            subtitle="Percentage share of total household energy"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appliances}
                    dataKey="energy_kwh"
                    nameKey="appliance_name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {appliances.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "8px",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`${Number(val).toFixed(2)} kWh`, "Load"]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-base font-bold text-gray-900">Appliance Consumption Audit</h4>
            <span className="text-xs text-gray-500">Sorted by consumption</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-6">Appliance Name</th>
                  <th className="py-3.5 px-6">Rated Power</th>
                  <th className="py-3.5 px-6">Energy Consumed</th>
                  <th className="py-3.5 px-6">Estimated Cost</th>
                  <th className="py-3.5 px-6">Carbon Footprint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appliances.map((app: any) => (
                  <tr key={app.appliance_name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">{app.appliance_name}</td>
                    <td className="py-4 px-6 text-gray-600">{app.rated_power} W</td>
                    <td className="py-4 px-6 font-semibold text-blue-600">{app.energy_kwh} kWh</td>
                    <td className="py-4 px-6 font-semibold text-emerald-600">₹{app.cost}</td>
                    <td className="py-4 px-6 text-gray-500">{app.co2_kg} kg CO₂</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
