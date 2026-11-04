"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import RecommendationCard from "@/components/RecommendationCard";
import {
  Lightbulb,
  Zap,
  IndianRupee,
  RefreshCw,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import api from "@/services/api";
import { RecommendationResponse } from "@/types";

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendationResponse[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async () => {
    try {
      const res = await api.get("/api/recommendations");
      setRecommendations(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.post("/api/recommendations/refresh");
      setRecommendations(res.data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = recommendations.filter((r) => {
    const matchPriority = priorityFilter === "all" || r.priority.toLowerCase() === priorityFilter.toLowerCase();
    const matchCat = categoryFilter === "all" || (r.category && r.category.toLowerCase() === categoryFilter.toLowerCase());
    return matchPriority && matchCat;
  });

  const totalKwhSavings = recommendations.reduce((acc, r) => acc + (r.potential_savings_kwh || 0), 0);
  const totalCostSavings = recommendations.reduce((acc, r) => acc + (r.potential_savings_cost || 0), 0);

  return (
    <DashboardLayout title="Smart Recommendations">
      <div className="space-y-6">
        {/* Banner with Total Savings Calculation */}
        <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-amber-800/40">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-400/30 text-amber-300">
                <Lightbulb className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Actionable Energy Efficiency Interventions
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400 text-amber-950">
                    Rule Engine
                  </span>
                </h3>
                <p className="text-xs text-amber-200 mt-1 max-w-xl">
                  Dynamic recommendations derived from simulated appliance duty cycles, off-peak tariff arbitrage, and idle load detection.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10">
              <div>
                <p className="text-[11px] text-amber-200 font-semibold uppercase">Total Potential Savings</p>
                <div className="flex items-baseline gap-3 mt-0.5">
                  <span className="text-2xl font-black text-amber-300">
                    ~₹{totalCostSavings.toFixed(0)} <span className="text-xs font-normal text-white">/ month</span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">
                    (~{totalKwhSavings.toFixed(1)} kWh)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Priority:
            </span>
            {["all", "high", "medium", "low"].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  priorityFilter === p
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Re-evaluate Appliances
          </button>
        </div>

        {/* Recommendations Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((rec) => (
            <RecommendationCard
              key={rec.id}
              title={rec.title}
              description={rec.description}
              potentialKwh={rec.potential_savings_kwh}
              potentialCost={rec.potential_savings_cost}
              priority={rec.priority}
              category={rec.category}
            />
          ))}
        </div>

        {/* Disclaimer */}
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span>
            <b>Estimate Notice:</b> Savings figures are mathematical estimates derived from appliance wattages and configured electricity tariff (₹8.00/kWh). They do not represent guaranteed billing discounts.
          </span>
        </div>
      </div>
    </DashboardLayout>
  );
}
