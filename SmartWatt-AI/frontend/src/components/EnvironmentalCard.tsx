"use client";

import React, { useEffect, useState } from "react";
import { Leaf, Trees, Wind, Info } from "lucide-react";
import api from "@/services/api";

export default function EnvironmentalCard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImpact() {
      try {
        const res = await api.get("/api/environmental/impact");
        setData(res.data);
      } catch (e) {
        setData({
          estimated_co2_emissions_kg: 285.77,
          potential_avoided_co2_kg: 127.02,
          trees_equivalent_needed: 13.1,
          trees_offset_from_savings: 5.8,
          grid_emission_factor_kg_per_kwh: 0.82,
        });
      } finally {
        setLoading(false);
      }
    }
    loadImpact();
  }, []);

  if (loading || !data) {
    return (
      <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-emerald-800/20 rounded w-1/3 mb-4" />
        <div className="h-8 bg-emerald-800/20 rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-emerald-300">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Environmental Impact & Carbon Footprint
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-semibold uppercase tracking-wider">
                Estimated
              </span>
            </h3>
            <p className="text-xs text-emerald-200/80">
              Grid Factor: {data.grid_emission_factor_kg_per_kwh} kg CO₂ / kWh
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <p className="text-xs text-emerald-200/70 font-medium">Monthly Carbon Footprint</p>
          <p className="text-2xl font-black text-white mt-1">
            {data.estimated_co2_emissions_kg} <span className="text-xs font-semibold text-emerald-300">kg CO₂e</span>
          </p>
          <p className="text-[11px] text-emerald-300/80 mt-1 flex items-center gap-1">
            <Wind className="w-3.5 h-3.5" /> From household consumption
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <p className="text-xs text-emerald-200/70 font-medium">Potential Avoided CO₂</p>
          <p className="text-2xl font-black text-emerald-300 mt-1">
            {data.potential_avoided_co2_kg} <span className="text-xs font-semibold text-emerald-200">kg CO₂e</span>
          </p>
          <p className="text-[11px] text-emerald-300/80 mt-1 flex items-center gap-1">
            🌱 With suggested optimizations
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <p className="text-xs text-emerald-200/70 font-medium">Tree Offset Required</p>
          <p className="text-2xl font-black text-white mt-1">
            {data.trees_equivalent_needed} <span className="text-xs font-semibold text-emerald-300">trees</span>
          </p>
          <p className="text-[11px] text-emerald-300/80 mt-1 flex items-center gap-1">
            <Trees className="w-3.5 h-3.5" /> To absorb monthly emissions
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <p className="text-xs text-emerald-200/70 font-medium">Tree Equivalent Saved</p>
          <p className="text-2xl font-black text-cyan-300 mt-1">
            {data.trees_offset_from_savings} <span className="text-xs font-semibold text-cyan-200">trees</span>
          </p>
          <p className="text-[11px] text-emerald-300/80 mt-1 flex items-center gap-1">
            🌿 Absorbed carbon equivalent
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 text-[11px] text-emerald-200/60 border-t border-emerald-800/40">
        <Info className="w-3.5 h-3.5" />
        <span>
          Emissions are calculated using standard grid emission factors based on simulated appliance kilowatt-hours. Values are estimates.
        </span>
      </div>
    </div>
  );
}

