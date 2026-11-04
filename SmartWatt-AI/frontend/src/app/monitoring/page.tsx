"use client";

import React, { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ApplianceCard from "@/components/ApplianceCard";
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Gauge,
  Thermometer,
  Radio,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import api, { API_BASE_URL } from "@/services/api";

export default function MonitoringPage() {
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [totalPower, setTotalPower] = useState(0.0);
  const [temperature, setTemperature] = useState(28.0);
  const [totalEnergy, setTotalEnergy] = useState(0.0);
  const [appliances, setAppliances] = useState<any[]>([]);
  const [tickCount, setTickCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize and WebSocket Connection
  useEffect(() => {
    let wsUrl = API_BASE_URL.replace(/^http/, "ws") + "/api/simulation/ws";
    let socket: WebSocket;

    function connectWs() {
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setWsConnected(true);
          addLog("WebSocket connected to Virtual Smart Meter telemetry stream.");
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setTotalPower(data.total_power_watts || 0);
            setTemperature(data.temperature || 28.0);
            setTotalEnergy(data.total_energy_kwh || 0);
            setAppliances(data.appliances || []);
            setTickCount((prev) => prev + 1);

            // Add log
            const logMsg = `[${new Date().toLocaleTimeString()}] Total Load: ${data.total_power_watts}W | Active: ${data.active_count} devices | Temp: ${data.temperature}°C`;
            setTelemetryLogs((prev) => [logMsg, ...prev.slice(0, 19)]);
          } catch (e) {
            console.error("Error parsing WS packet:", e);
          }
        };

        socket.onerror = () => {
          setWsConnected(false);
        };

        socket.onclose = () => {
          setWsConnected(false);
          // Try reconnect after 3 seconds
          setTimeout(connectWs, 3000);
        };
      } catch (err) {
        console.warn("WebSocket not supported or failed to connect, falling back to HTTP polling:", err);
      }
    }

    connectWs();

    // Polling fallback to keep data fresh if WS disconnects
    const fallbackPoll = setInterval(async () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        try {
          const res = await api.get("/api/simulation/status");
          const snap = res.data.latest_reading;
          if (snap) {
            setTotalPower(snap.total_power_watts || 0);
            setTemperature(snap.temperature || 28.0);
            setTotalEnergy(snap.total_energy_kwh || 0);
            setAppliances(snap.appliances || []);
            setIsRunning(res.data.running);
            setSpeed(res.data.speed);
          }
        } catch (e) {}
      }
    }, 2500);

    return () => {
      clearInterval(fallbackPoll);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const addLog = (msg: string) => {
    setTelemetryLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  const handleStart = async () => {
    try {
      await api.post("/api/simulation/start");
      setIsRunning(true);
      addLog("Simulation started.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleStop = async () => {
    try {
      await api.post("/api/simulation/stop");
      setIsRunning(false);
      addLog("Simulation paused.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    try {
      await api.post("/api/simulation/reset");
      setTickCount(0);
      setSpeed(1.0);
      addLog("Simulation counter and manual overrides reset.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpeedChange = async (newSpeed: number) => {
    try {
      await api.post("/api/simulation/speed", { speed: newSpeed });
      setSpeed(newSpeed);
      addLog(`Simulation speed set to ${newSpeed}x`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplianceToggle = async (applianceName: string, nextStatus: boolean) => {
    try {
      await api.post(`/api/simulation/appliance/${encodeURIComponent(applianceName)}/override`, {
        status: nextStatus,
      });
      addLog(`Manual Override: ${applianceName} forced ${nextStatus ? "ON" : "OFF"}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout title="Live Virtual Smart Meter Monitoring">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600">
                <Radio className={`w-5 h-5 ${isRunning ? "animate-pulse text-cyan-600" : "text-gray-400"}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  Virtual Smart Meter Telemetry Hub
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    wsConnected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {wsConnected ? "WebSocket Connected" : "HTTP Polling"}
                  </span>
                </h3>
                <p className="text-xs text-gray-500">
                  Simulated multi-appliance energy telemetry &bull; Python Simulation Engine
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Speed buttons */}
            <div className="flex items-center rounded-lg bg-gray-100 p-1 text-xs font-semibold">
              <span className="px-2 text-gray-500 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> Speed:
              </span>
              {[1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    speed === s
                      ? "bg-white text-blue-600 shadow-sm font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Run / Pause / Reset controls */}
            <div className="flex items-center gap-2">
              {isRunning ? (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  <Pause className="w-4 h-4" /> Pause
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  <Play className="w-4 h-4" /> Start
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Meter Gauge Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
            <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Instantaneous Power
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-blue-950">{totalPower.toFixed(1)}</span>
              <span className="text-sm font-bold text-blue-600">Watts</span>
            </div>
            <p className="text-[11px] text-blue-600/80 mt-1">Total household load</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-100 rounded-xl p-4">
            <span className="text-xs font-semibold text-cyan-700 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Interval Energy
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-cyan-950">{(totalEnergy * 1000).toFixed(2)}</span>
              <span className="text-sm font-bold text-cyan-600">Wh / tick</span>
            </div>
            <p className="text-[11px] text-cyan-600/80 mt-1">Incremental energy</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-4">
            <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5" /> Ambient Temperature
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-amber-950">{temperature.toFixed(1)}</span>
              <span className="text-sm font-bold text-amber-600">°C</span>
            </div>
            <p className="text-[11px] text-amber-600/80 mt-1">Simulated climate model</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-xl p-4">
            <span className="text-xs font-semibold text-purple-700 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" /> Telemetry Ticks
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-purple-950">{tickCount}</span>
              <span className="text-sm font-bold text-purple-600">cycles</span>
            </div>
            <p className="text-[11px] text-purple-600/80 mt-1">Engine stream cycles</p>
          </div>
        </div>
      </div>

      {/* 8 Connected Appliance Live Cards */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Live Appliance Telemetry</h3>
            <p className="text-xs text-gray-500">
              Click the power switch to override an appliance's simulated state
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-full border border-blue-200">
            {appliances.filter((a) => a.status).length} / {appliances.length} Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {appliances.map((app) => (
            <ApplianceCard
              key={app.appliance_name}
              name={app.appliance_name}
              powerWatts={app.power_watts}
              ratedWatts={app.rated_power}
              isActive={app.status}
              energyKwh={app.energy_kwh}
              onToggle={handleApplianceToggle}
            />
          ))}
        </div>
      </div>

      {/* Telemetry Stream Console */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Smart Meter Telemetry Event Log
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">Auto-streaming</span>
        </div>
        <div className="font-mono text-xs text-emerald-400 space-y-1 h-36 overflow-y-auto">
          {telemetryLogs.map((log, i) => (
            <div key={i} className="hover:bg-slate-800/50 px-2 py-0.5 rounded">
              {log}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
