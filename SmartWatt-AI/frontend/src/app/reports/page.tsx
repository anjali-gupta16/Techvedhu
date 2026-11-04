"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FileText,
  Download,
  Calendar,
  FileSpreadsheet,
  FileCheck,
  CheckCircle,
  Zap,
} from "lucide-react";
import api, { API_BASE_URL } from "@/services/api";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        const res = await api.get(`/api/reports/${reportType}`);
        setReportData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [reportType]);

  const daysMap = { daily: 1, weekly: 7, monthly: 30 };
  const currentDays = daysMap[reportType];

  const handleDownloadCsv = () => {
    window.open(`${API_BASE_URL}/api/reports/export/csv?days=${currentDays}`, "_blank");
  };

  const handleDownloadPdf = () => {
    window.open(`${API_BASE_URL}/api/reports/export/pdf?days=${currentDays}`, "_blank");
  };

  const appliances = reportData?.appliances || [];

  return (
    <DashboardLayout title="Periodic Reports & Exports">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Audited Energy Consumption Reports
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Generate and download certified appliance billing and carbon emission audit statements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold w-fit">
          {(["daily", "weekly", "monthly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setReportType(t)}
              className={`px-4 py-2 rounded-lg transition-all capitalize ${
                reportType === t
                  ? "bg-white text-indigo-600 shadow-sm font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t === "daily" ? "Daily Audit (24h)" : t === "weekly" ? "Weekly Statement (7d)" : "Monthly Statement (30d)"}
            </button>
          ))}
        </div>

        {/* Summary Card */}
        {reportData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Reporting Window</span>
              <p className="text-base font-bold text-gray-900 mt-1">
                {reportData.start_date} <span className="text-gray-400">to</span> {reportData.end_date}
              </p>
              <span className="text-[11px] text-indigo-600 font-semibold">{reportData.period_days} Days Horizon</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Total Energy Recorded</span>
              <p className="text-2xl font-black text-blue-600 mt-1">
                {reportData.total_kwh} <span className="text-xs font-normal text-gray-500">kWh</span>
              </p>
              <span className="text-[11px] text-gray-500">Simulated virtual smart meter</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Estimated Energy Bill</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                ₹{reportData.total_cost}
              </p>
              <span className="text-[11px] text-gray-500">Tariff: ₹{reportData.tariff_per_kwh}/kWh</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Carbon Emissions Generated</span>
              <p className="text-2xl font-black text-teal-600 mt-1">
                {reportData.total_co2_kg} <span className="text-xs font-normal text-gray-500">kg CO₂e</span>
              </p>
              <span className="text-[11px] text-gray-500">Factor: {reportData.emission_factor} kg/kWh</span>
            </div>
          </div>
        )}

        {/* Audited Appliance Data Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-base font-bold text-gray-900">Appliance Line-Item Statement</h4>
            <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 font-medium rounded-full">
              {appliances.length} Line Items
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-6">Appliance Name</th>
                  <th className="py-3.5 px-6">Rated Power (W)</th>
                  <th className="py-3.5 px-6">Energy Consumed (kWh)</th>
                  <th className="py-3.5 px-6">Cost (₹)</th>
                  <th className="py-3.5 px-6">Carbon Footprint (kg CO₂)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appliances.map((app: any) => (
                  <tr key={app.appliance_name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">{app.appliance_name}</td>
                    <td className="py-4 px-6 text-gray-600">{app.rated_power} W</td>
                    <td className="py-4 px-6 font-bold text-blue-600">{app.energy_kwh} kWh</td>
                    <td className="py-4 px-6 font-bold text-emerald-600">₹{app.cost}</td>
                    <td className="py-4 px-6 text-gray-500">{app.co2_kg} kg</td>
                  </tr>
                ))}
              </tbody>
              {reportData && (
                <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-200">
                  <tr>
                    <td className="py-4 px-6 uppercase text-xs tracking-wider">Total Audited Usage</td>
                    <td className="py-4 px-6">-</td>
                    <td className="py-4 px-6 text-blue-700">{reportData.total_kwh} kWh</td>
                    <td className="py-4 px-6 text-emerald-700">₹{reportData.total_cost}</td>
                    <td className="py-4 px-6 text-teal-700">{reportData.total_co2_kg} kg</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
