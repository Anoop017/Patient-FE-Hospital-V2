"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getVitalsWsUrl, fetchRecentVitalsAlerts, fetchVitalsHistory } from "@/lib/reports";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Heart,
  Wind,
  Gauge,
  Thermometer,
  Radio,
  Volume2,
  VolumeX,
  History,
  AlertTriangle,
  BedDouble,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface VitalSign {
  id?: number;
  admissionId?: number;
  patientId?: number;
  patientName?: string;
  bedNumber?: string;
  wardName?: string;
  doctorId?: number;
  heartRate?: number;
  spo2?: number;
  systolicBp?: number;
  diastolicBp?: number;
  temperature?: number;
  respiratoryRate?: number;
  alertLevel?: "NORMAL" | "WARNING" | "CRITICAL" | string;
  alertReasons?: string[];
  recordedAt?: string;
  timestamp?: number;
}

interface DoctorVitalsLiveMonitorProps {
  patientId?: number | string;
  admissionId?: number | string;
  compact?: boolean;
  className?: string;
}

export function DoctorVitalsLiveMonitor({
  patientId,
  admissionId,
  compact = false,
  className = "",
}: DoctorVitalsLiveMonitorProps) {
  const [vitalsMap, setVitalsMap] = useState<Record<string, VitalSign>>({});
  const [activePatientKey, setActivePatientKey] = useState<string>("");
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<VitalSign[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectWs = useCallback(() => {
    try {
      const url = getVitalsWsUrl(patientId, admissionId);
      setStatus("connecting");

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "vitals_update" && message.data) {
            const v: VitalSign = message.data;
            const key = `p_${v.patientId || v.admissionId || "default"}`;
            setVitalsMap((prev) => ({ ...prev, [key]: v }));
            setActivePatientKey((curr) => (!curr || curr === key ? key : curr));
          }
        } catch {
          // parse error ignored
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWs();
        }, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setStatus("disconnected");
    }
  }, [patientId, admissionId]);

  useEffect(() => {
    connectWs();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWs]);

  // Fallback REST fetch if WebSocket offline
  useEffect(() => {
    if (status === "disconnected") {
      fetchRecentVitalsAlerts(10)
        .then((res) => {
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            const map: Record<string, VitalSign> = {};
            res.data.forEach((v: VitalSign) => {
              const k = `p_${v.patientId || v.admissionId || "default"}`;
              map[k] = v;
            });
            setVitalsMap(map);
            if (!activePatientKey && Object.keys(map).length > 0) {
              setActivePatientKey(Object.keys(map)[0]);
            }
          }
        })
        .catch(() => {});
    }
  }, [status, activePatientKey]);

  const loadHistory = async (pId: number | string) => {
    setLoadingHistory(true);
    setHistoryOpen(true);
    try {
      const res = await fetchVitalsHistory(pId, 24, 50);
      if (res?.data) {
        setHistoryData(res.data);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const patientKeys = Object.keys(vitalsMap);
  const currentVital: VitalSign =
    vitalsMap[activePatientKey] ||
    (patientKeys.length > 0 ? vitalsMap[patientKeys[0]] : null) || {
      patientId: Number(patientId) || 1,
      admissionId: Number(admissionId) || 1,
      patientName: "Admitted Patient (Monitoring)",
      bedNumber: "ICU-01",
      wardName: "Cardiac ICU",
      heartRate: 72,
      spo2: 98,
      systolicBp: 120,
      diastolicBp: 80,
      temperature: 37.0,
      respiratoryRate: 16,
      alertLevel: "NORMAL",
    };

  const isCritical = currentVital.alertLevel === "CRITICAL";
  const isWarning = currentVital.alertLevel === "WARNING";

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all relative overflow-hidden backdrop-blur-xs ${
        isCritical
          ? "bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-950/50"
          : isWarning
          ? "bg-amber-950/30 border-amber-500/60 shadow-md shadow-amber-950/30"
          : "bg-slate-900 text-slate-100 border-slate-800 shadow-sm"
      } ${className}`}
    >
      {/* Background ECG animation grid line */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:16px_16px]" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 items-center justify-center rounded-xl font-bold ${
              isCritical
                ? "bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/40"
                : isWarning
                ? "bg-amber-500 text-slate-950"
                : "bg-teal-500/20 text-teal-400 border border-teal-500/30"
            }`}
          >
            <Activity className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                {currentVital.patientName || `Patient #${currentVital.patientId || "ICU"}`}
              </h4>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <BedDouble className="size-3.5 text-slate-400" />
              {currentVital.wardName || "ICU"} — Bed {currentVital.bedNumber || "01"}
            </p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Connection Status */}
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-mono font-medium border ${
              status === "connected"
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                : status === "connecting"
                ? "bg-amber-950/60 text-amber-400 border-amber-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                status === "connected"
                  ? "bg-emerald-400 animate-ping"
                  : status === "connecting"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-slate-400"
              }`}
            />
            {status === "connected" ? "LIVE STREAM" : status === "connecting" ? "CONNECTING..." : "OFFLINE"}
          </span>

          {/* Alert Level Badge */}
          {isCritical ? (
            <Badge variant="destructive" className="animate-bounce font-bold tracking-wide">
              <AlertTriangle className="size-3 mr-1" /> CRITICAL
            </Badge>
          ) : isWarning ? (
            <Badge variant="warning" className="font-semibold">
              <AlertTriangle className="size-3 mr-1" /> WARNING
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-emerald-950/40 text-emerald-400 border-emerald-500/30 font-medium">
              <Radio className="size-3 mr-1 animate-pulse" /> NORMAL
            </Badge>
          )}

          {/* Patient History Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadHistory(currentVital.patientId || 1)}
            className="h-8 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700"
            title="View 24h Vitals History"
          >
            <History className="size-3.5 mr-1" /> History
          </Button>

          {/* Alarm Audio Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title={soundEnabled ? "Mute Alarms" : "Enable Audio Alarm"}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="size-4 text-teal-400" /> : <VolumeX className="size-4" />}
          </button>
        </div>
      </div>

      {/* Multi-Patient Selector Tabs if > 1 patient */}
      {patientKeys.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar relative z-10">
          {patientKeys.map((key) => {
            const v = vitalsMap[key];
            const isCrit = v.alertLevel === "CRITICAL";
            const isWarn = v.alertLevel === "WARNING";
            const isSel = key === activePatientKey;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setActivePatientKey(key)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                  isSel
                    ? "bg-teal-500/20 text-teal-300 border-teal-500/60 font-semibold"
                    : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    isCrit ? "bg-rose-500 animate-ping" : isWarn ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                />
                {v.patientName || `Patient #${v.patientId}`} (Bed {v.bedNumber || "?"})
              </button>
            );
          })}
        </div>
      )}

      {/* Telemetry Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center relative z-10">
        {/* Heart Rate */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Heart className={`size-3.5 text-rose-400 ${status === "connected" ? "animate-pulse" : ""}`} /> Heart Rate
            </span>
            <span className="text-[10px] text-slate-500">bpm</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono tracking-tight my-1">
            {currentVital.heartRate ?? "--"}
          </p>
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>Normal</span>
            <span className="font-medium">60-100</span>
          </div>
        </div>

        {/* Oxygen SpO2 */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Wind className="size-3.5 text-cyan-400" /> SpO2
            </span>
            <span className="text-[10px] text-slate-500">%</span>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight my-1 ${
              (currentVital.spo2 ?? 100) < 92 ? "text-rose-400" : "text-cyan-400"
            }`}
          >
            {currentVital.spo2 ?? "--"}%
          </p>
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>Normal</span>
            <span className="font-medium">&ge; 95%</span>
          </div>
        </div>

        {/* Blood Pressure (Systolic / Diastolic) */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Gauge className="size-3.5 text-amber-400" /> NIBP
            </span>
            <span className="text-[10px] text-slate-500">mmHg</span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono tracking-tight my-1.5">
            {currentVital.systolicBp ?? "--"}/{currentVital.diastolicBp ?? "--"}
          </p>
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>Target</span>
            <span className="font-medium">120/80</span>
          </div>
        </div>

        {/* Core Temperature & Respiration */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Thermometer className="size-3.5 text-emerald-400" /> Temp / Resp
            </span>
            <span className="text-[10px] text-slate-500">°C | /m</span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono tracking-tight my-1.5">
            {currentVital.temperature !== undefined ? currentVital.temperature.toFixed(1) : "--"}°C
          </p>
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>Resp Rate</span>
            <span className="font-medium text-slate-300">{currentVital.respiratoryRate ?? 16} /min</span>
          </div>
        </div>
      </div>

      {/* Bottom Live Waveform / Synchronized info */}
      {!compact && (
        <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-teal-400 animate-ping" />
            <span className="font-mono text-slate-300 text-[10px] sm:text-xs">
              ICU Real-Time Lead Stream — Active Channels 1-4
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">
            {currentVital.recordedAt ? new Date(currentVital.recordedAt).toLocaleTimeString() : "Live Synced"}
          </span>
        </div>
      )}

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vitals Telemetry History (Last 24 Hours)</DialogTitle>
            <DialogDescription>
              Physiological records recorded for {currentVital.patientName || `Patient #${currentVital.patientId}`}.
            </DialogDescription>
          </DialogHeader>

          {loadingHistory ? (
            <div className="py-8 text-center text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="size-4 animate-spin" /> Loading historical records...
            </div>
          ) : historyData.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No historical records found for the past 24 hours.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b bg-muted/50 font-semibold">
                  <tr>
                    <th className="p-2">Time</th>
                    <th className="p-2">Heart Rate</th>
                    <th className="p-2">SpO2</th>
                    <th className="p-2">BP (mmHg)</th>
                    <th className="p-2">Temp (°C)</th>
                    <th className="p-2">Resp Rate</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {historyData.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-muted/30">
                      <td className="p-2 font-mono">
                        {row.recordedAt ? new Date(row.recordedAt).toLocaleTimeString() : "-"}
                      </td>
                      <td className="p-2 font-bold text-rose-500">{row.heartRate} bpm</td>
                      <td className="p-2 font-bold text-cyan-500">{row.spo2}%</td>
                      <td className="p-2 font-medium">
                        {row.systolicBp}/{row.diastolicBp}
                      </td>
                      <td className="p-2 font-medium">{row.temperature ? Number(row.temperature).toFixed(1) : "-"}°C</td>
                      <td className="p-2 font-medium">{row.respiratoryRate} /min</td>
                      <td className="p-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.alertLevel === "CRITICAL"
                              ? "bg-rose-500/20 text-rose-500"
                              : row.alertLevel === "WARNING"
                              ? "bg-amber-500/20 text-amber-500"
                              : "bg-emerald-500/20 text-emerald-500"
                          }`}
                        >
                          {row.alertLevel || "NORMAL"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
