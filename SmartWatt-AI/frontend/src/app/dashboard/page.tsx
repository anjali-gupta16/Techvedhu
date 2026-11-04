"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import ChartContainer from "@/components/ChartContainer";
import EnvironmentalCard from "@/components/EnvironmentalCard";
import RecommendationCard from "@/components/RecommendationCard";
import {
  Zap,
  Calendar,
  BrainCircuit,
  IndianRupee,
  Gauge,
  Cpu,
  Activity,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
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
import { DashboardSummary, RecommendationResponse, AnomalyResponse } from "@/types";

const COLORS = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6"];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [consumptionPeriod, setConsumptionPeriod] = useState<"daily" | "weekly">("daily");
  const [chartData, setChartData] = useState<any[]>([]);
  const [applianceData, setApplianceData] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyResponse[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [simRunning, setSimRunning] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [sumRes, consRes, anomRes, recRes] = await Promise.all([
        api.get("/api/dashboard/summary"),
        api.get(`/api/dashboard/consumption?period=${consumptionPeriod}`),
        api.get("/api/anomalies"),
        api.get("/api/recommendations"),
      ]);

      setSummary(sumRes.data);
      setSimRunning(sumRes.data.simulation_running);

      // Format consumption chart data
      const { labels, values, appliance_breakdown } = consRes.data;
      const formatted = labels.map((label: string, idx: number) => ({
        time: label,
        energy: values[idx] || 0,
      }));
      setChartData(formatted);
      setApplianceData(appliance_breakdown || []);
      setAnomalies(anomRes.data.slice(0, 3));
      setRecommendations(recRes.data.slice(0, 3));
      setApiError(null);
    } catch (err: any) {
      console.warn("Retrying backend connection:", err.message);
      setApiError("Connecting to backend server on port 8000...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, [consumptionPeriod]);

  const toggleSimulation = async () => {
    try {
      const endpoint = simRunning ? "/api/simulation/stop" : "/api/simulation/start";
      await api.post(endpoint);
      setSimRunning(!simRunning);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout title="Overview Dashboard">
      {/* Simulation Banner Notice */}
      <div className="mb-6 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/30 rounded-xl border border-blue-500/30 text-cyan-400">
            <Activity className={`w-6 h-6 ${simRunning ? "animate-pulse text-cyan-300" : "text-gray-400"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-white">Virtual Smart Meter Simulator</h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-400 text-slate-950">
                Simulated Data
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                simRunning ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              }`}>
                {simRunning ? "ENGINE RUNNING" : "ENGINE PAUSED"}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Generates realistic 8-appliance wattage readings without physical smart meter hardware.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end" suppressHydrationWarning>
          <button
            suppressHydrationWarning
            onClick={toggleSimulation}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all ${
              simRunning
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {simRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {simRunning ? "Pause Simulation" : "Start Simulation"}
          </button>
          <button
            suppressHydrationWarning
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <MetricCard
          title="Today's Consumption"
          value={summary ? summary.today_consumption_kwh.toFixed(2) : "--"}
          unit="kWh"
          icon={Zap}
          color="blue"
          loading={loading}
        />
        <MetricCard
          title="Monthly Consumption"
          value={summary ? summary.monthly_consumption_kwh.toFixed(1) : "--"}
          unit="kWh"
          icon={Calendar}
          color="cyan"
          loading={loading}
        />
        <MetricCard
          title="AI Predicted"
          value={summary ? summary.predicted_consumption_kwh.toFixed(2) : "--"}
          unit="kWh"
          icon={BrainCircuit}
          color="purple"
          loading={loading}
        />
        <MetricCard
          title="Estimated Bill"
          value={summary ? `₹${summary.estimated_bill.toFixed(0)}` : "--"}
          icon={IndianRupee}
          color="green"
          loading={loading}
        />
        <MetricCard
          title="Efficiency Score"
          value={summary ? `${summary.efficiency_score.toFixed(0)}` : "--"}
          unit="/ 100"
          icon={Gauge}
          color="orange"
          loading={loading}
        />
        <MetricCard
          title="Active Devices"
          value={summary ? `${summary.active_appliances} / ${summary.total_appliances}` : "--"}
          icon={Cpu}
          color="red"
          loading={loading}
        />
      </div>

      {/* Anomaly Alerts Banner (if any) */}
      {anomalies.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 shadow-sm flex items-start gap-3">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-600 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-rose-900">
                Isolation Forest Anomaly Detected
              </h4>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-800">
                {anomalies[0].severity}
              </span>
            </div>
            <p className="text-xs text-rose-700 mt-0.5">{anomalies[0].description}</p>
          </div>
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Power Trend Line/Area Chart */}
        <div className="lg:col-span-2">
          <ChartContainer
            title="Electricity Consumption Profile"
            subtitle="Hourly load curve in kilowatt-hours (kWh)"
            action={
              <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs font-semibold" suppressHydrationWarning>
                <button
                  suppressHydrationWarning
                  onClick={() => setConsumptionPeriod("daily")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    consumptionPeriod === "daily"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  24 Hours
                </button>
                <button
                  suppressHydrationWarning
                  onClick={() => setConsumptionPeriod("weekly")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    consumptionPeriod === "weekly"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  7 Days
                </button>
              </div>
            }
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748b" }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} stroke="#cbd5e1" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "8px",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`${val} kWh`, "Energy"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="energy"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#energyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
        </div>

        {/* Appliance Distribution Donut */}
        <div>
          <ChartContainer
            title="Appliance Distribution"
            subtitle="Consumption share across devices"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={applianceData}
                    dataKey="consumption_kwh"
                    nameKey="appliance_name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {applianceData.map((entry, index) => (
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
                    formatter={(val: any) => [`${Number(val).toFixed(2)} kWh`, "Usage"]}
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
      </div>

      {/* Environmental Impact Section */}
      <div className="mb-6">
        <EnvironmentalCard />
      </div>

      {/* Top Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Recommended Energy Optimizations</h3>
            <p className="text-xs text-gray-500">AI-suggested interventions based on usage patterns</p>
          </div>
          <a href="/recommendations" className="text-xs font-bold text-blue-600 hover:underline">
            View All &rarr;
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec, i) => (
            <RecommendationCard
              key={i}
              title={rec.title}
              description={rec.description}
              potentialKwh={rec.potential_savings_kwh}
              potentialCost={rec.potential_savings_cost}
              priority={rec.priority}
              category={rec.category}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
