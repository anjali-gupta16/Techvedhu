"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Cpu,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Power,
  Zap,
  Info,
} from "lucide-react";
import api from "@/services/api";
import { Appliance } from "@/types";

export default function AppliancesPage() {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Appliance | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [ratedPower, setRatedPower] = useState(100);

  const fetchAppliances = async () => {
    try {
      const res = await api.get("/api/appliances");
      setAppliances(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppliances();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/appliances", {
        appliance_name: name,
        rated_power: Number(ratedPower),
      });
      setIsAddOpen(false);
      setName("");
      setRatedPower(100);
      fetchAppliances();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (app: Appliance) => {
    setSelectedApp(app);
    setName(app.appliance_name);
    setRatedPower(app.rated_power);
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      await api.put(`/api/appliances/${selectedApp.id}`, {
        appliance_name: name,
        rated_power: Number(ratedPower),
      });
      setIsEditOpen(false);
      setSelectedApp(null);
      fetchAppliances();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this appliance from monitoring?")) return;
    try {
      await api.delete(`/api/appliances/${id}`);
      fetchAppliances();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async (app: Appliance) => {
    try {
      await api.put(`/api/appliances/${app.id}`, {
        status: !app.status,
      });
      fetchAppliances();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout title="Appliance Management">
      <div className="space-y-6">
        {/* Header bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              Connected Appliances & Smart Loads
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure rated wattages, operating schedules, and load boundaries.
            </p>
          </div>
          <button
            onClick={() => {
              setName("");
              setRatedPower(150);
              setIsAddOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Appliance
          </button>
        </div>

        {/* Appliances Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-4 px-6">Appliance</th>
                  <th className="py-4 px-6">Rated Power</th>
                  <th className="py-4 px-6">Simulated State</th>
                  <th className="py-4 px-6">Estimated Draw</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appliances.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${
                          app.status ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"
                        }`}>
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{app.appliance_name}</p>
                          <p className="text-xs text-gray-400">ID: #{app.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-gray-800">{app.rated_power}</span>{" "}
                      <span className="text-xs text-gray-500">Watts</span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggle(app)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          app.status
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {app.status ? "ONLINE / ACTIVE" : "STANDBY / OFF"}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold text-slate-700">
                        {app.status ? `~${app.rated_power} W` : "~3.5 W (Standby)"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(app)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Appliance"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Appliance"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notice */}
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span>
            Changes made here directly modify the Virtual Smart Meter simulation parameters.
          </span>
        </div>
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold text-gray-900">Add New Appliance</h4>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Appliance Name</label>
                <input
                  type="text"
                  placeholder="e.g. Electric Vehicle Charger"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Rated Power (Watts)</label>
                <input
                  type="number"
                  placeholder="e.g. 3300"
                  value={ratedPower}
                  onChange={(e) => setRatedPower(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min={1}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  Save Appliance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && selectedApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold text-gray-900">Edit Appliance</h4>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Appliance Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Rated Power (Watts)</label>
                <input
                  type="number"
                  value={ratedPower}
                  onChange={(e) => setRatedPower(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min={1}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  Update Appliance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
