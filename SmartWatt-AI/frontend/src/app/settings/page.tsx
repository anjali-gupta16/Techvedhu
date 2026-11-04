"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Settings as SettingsIcon,
  IndianRupee,
  Leaf,
  RotateCcw,
  User,
  Shield,
  Save,
  CheckCircle2,
} from "lucide-react";
import api from "@/services/api";

export default function SettingsPage() {
  const [tariff, setTariff] = useState(8.0);
  const [emissionFactor, setEmissionFactor] = useState(0.82);
  const [userName, setUserName] = useState("Anjali Sharma");
  const [userEmail, setUserEmail] = useState("demo@smartwatt.ai");
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const userRes = await api.get("/api/auth/me");
        if (userRes.data) {
          setUserName(userRes.data.name);
          setUserEmail(userRes.data.email);
        }
      } catch (e) {}
    }
    loadConfig();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetSimulation = async () => {
    if (!confirm("Reset simulation tick counters and restart fresh telemetry?")) return;
    setResetting(true);
    try {
      await api.post("/api/simulation/reset");
      alert("Simulation counters reset successfully.");
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  return (
    <DashboardLayout title="System Settings & Tariff Configuration">
      <div className="max-w-4xl space-y-6">
        {/* Settings form card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Tariff & Environmental Parameters</h3>
              <p className="text-xs text-gray-500">
                Adjust calculation rates used across all financial and carbon modules.
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-emerald-600" /> Electricity Tariff Rate (₹ / kWh)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={tariff}
                  onChange={(e) => setTariff(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Default Indian residential benchmark is ₹8.00 per kWh.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Leaf className="w-4 h-4 text-teal-600" /> Grid Carbon Emission Factor (kg CO₂ / kWh)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={emissionFactor}
                  onChange={(e) => setEmissionFactor(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Central Electricity Authority (CEA) average factor: 0.82 kg CO₂e / kWh.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" /> Save Preferences
              </button>
              {saved && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Changes applied!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">User Account & Home Profile</h3>
              <p className="text-xs text-gray-500">Authenticated user credentials and assigned smart property.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-400 font-medium">Full Name</span>
              <p className="font-bold text-gray-900 mt-0.5">{userName}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-400 font-medium">Registered Email</span>
              <p className="font-bold text-gray-900 mt-0.5">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Simulation Reset Card */}
        <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-rose-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                Virtual Smart Meter Telemetry Controls
              </h3>
              <p className="text-xs text-rose-700 mt-1 max-w-xl">
                Reset live tick counters, clear active override flags, and reset simulation speed to 1.0x baseline.
              </p>
            </div>
            <button
              onClick={handleResetSimulation}
              disabled={resetting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
            >
              Reset Telemetry Engine
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
