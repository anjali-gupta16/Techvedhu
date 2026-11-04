"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ChartContainer from "@/components/ChartContainer";
import {
  BrainCircuit,
  Calendar,
  Zap,
  TrendingUp,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import api from "@/services/api";

export default function PredictionsPage() {
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPredictions() {
      try {
        const [dailyRes, weeklyRes, metricRes] = await Promise.all([
          api.get("/api/predictions/daily"),
          api.get("/api/predictions/weekly"),
          api.get("/api/predictions/metrics"),
        ]);

        const dailyFormatted = (dailyRes.data.hourly_predictions || []).map((p: any) => ({
          time: `${p.hour}:00`,
          predicted: p.predicted_kwh,
          lower: p.confidence_lower,
          upper: p.confidence_upper,
          range: [p.confidence_lower, p.confidence_upper],
        }));

        setDailyData(dailyFormatted);
        setWeeklyData(weeklyRes.data.daily_predictions || []);
        setMetrics(metricRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadPredictions();
  }, []);

  const totalTomorrowKwh = dailyData.reduce((acc, curr) => acc + curr.predicted, 0);

  return (
    <DashboardLayout title="AI Energy Predictions">
      <div className="space-y-6">
        {/* Banner with Model details */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-purple-900/50">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600/30 rounded-xl border border-purple-400/30 text-purple-300">
                <BrainCircuit className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    Random Forest Regressor Forecasting Pipeline
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-400 text-purple-950">
                    Live Model
                  </span>
                </div>
                <p className="text-xs text-purple-200 mt-1 max-w-2xl">
                  Ensemble of 100 decision trees trained on chronological simulated appliance consumption, ambient temperatures, and lag features. Confidence ranges are derived from ensemble variance.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
              <div>
                <p className="text-[11px] text-purple-200 uppercase font-semibold">Tomorrow's Forecast</p>
                <p className="text-2xl font-black text-white">
                  {totalTomorrowKwh.toFixed(2)} <span className="text-xs font-normal text-purple-300">kWh</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Model Architecture</span>
              <p className="text-sm font-bold text-gray-900 mt-1 truncate">{metrics.model_name}</p>
              <span className="text-[10px] text-purple-600 font-semibold">100 Estimators</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Mean Absolute Error</span>
              <p className="text-lg font-black text-gray-900 mt-1">{metrics.mae} <span className="text-xs font-normal">kWh</span></p>
              <span className="text-[10px] text-emerald-600 font-semibold">MAE Evaluation</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Root Mean Sq. Error</span>
              <p className="text-lg font-black text-gray-900 mt-1">{metrics.rmse} <span className="text-xs font-normal">kWh</span></p>
              <span className="text-[10px] text-blue-600 font-semibold">RMSE Metric</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">R² Score</span>
              <p className="text-lg font-black text-gray-900 mt-1">{metrics.r2_score}</p>
              <span className="text-[10px] text-indigo-600 font-semibold">Variance Explained</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Training Samples</span>
              <p className="text-lg font-black text-gray-900 mt-1">{metrics.training_samples}</p>
              <span className="text-[10px] text-gray-500 font-semibold">Chronological split</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Test Samples</span>
              <p className="text-lg font-black text-gray-900 mt-1">{metrics.test_samples}</p>
              <span className="text-[10px] text-gray-500 font-semibold">Held-out horizon</span>
            </div>
          </div>
        )}

        {/* Main Next-Day Hourly Chart */}
        <ChartContainer
          title="Next-Day 24-Hour Energy Forecast"
          subtitle="Hourly predicted consumption (kWh) with empirical ensemble confidence bounds"
          action={
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-600" />
                Predicted Load
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-purple-200" />
                Error Bound (±1.645σ)
              </span>
            </div>
          }
        >
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0.05} />
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
                  formatter={(val: any, name: any) => [
                    `${val} kWh`,
                    name === "predicted" ? "Predicted Load" : name === "upper" ? "Upper Bound" : "Lower Bound",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="transparent"
                  fill="url(#confidenceGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stroke="transparent"
                  fill="#ffffff"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#9333ea"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#9333ea" }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        {/* 7-Day Weekly Prediction Bar Chart */}
        <ChartContainer
          title="7-Day Forward Horizon Forecast"
          subtitle="Total aggregated daily electricity consumption across the coming week"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day_name" tick={{ fontSize: 11, fill: "#64748b" }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "8px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val} kWh`, "Predicted Day Load"]}
                />
                <Bar dataKey="predicted_kwh" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        {/* Methodology Note */}
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-3">
          <Info className="w-4 h-4 text-purple-700 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Confidence Estimation Methodology:</span> Confidence bounds are empirically derived from the inter-tree prediction standard error (&sigma;) across all 100 individual estimators in the Random Forest. Rather than misleading certainty percentages, the error band represents the 90% empirical variation interval (y &plusmn; 1.645&sigma;).
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
