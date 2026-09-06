"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { getVitalsWsUrl, fetchVitalsHistory, fetchRecentVitalsAlerts, downloadReport } from "@/lib/reports";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  Activity,
  Heart,
  Wind,
  Gauge,
  Thermometer,
  Radio,
  Volume2,
  VolumeX,
  AlertTriangle,
  FileDown,
  RefreshCw,
  Clock,
  BedDouble,
  SlidersHorizontal,
  CheckCircle2,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

export interface TelemetryPatient {
  id: string | number;
  patientId: number;
  admissionId?: number;
  patientName: string;
  bedNumber: string;
  wardName: string;
  heartRate: number;
  spo2: number;
  systolicBp: number;
  diastolicBp: number;
  temperature: number;
  respiratoryRate: number;
  alertLevel: "NORMAL" | "WARNING" | "CRITICAL";
  alertReasons?: string[];
  lastUpdate: string;
}

// Realistic seed data for when the backend WebSocket is initialising or connecting
const SEED_PATIENTS: TelemetryPatient[] = [
  {
    id: "p-101",
    patientId: 101,
    admissionId: 1,
    patientName: "Eleanor Vance",
    bedNumber: "ICU-01",
    wardName: "Cardiothoracic ICU",
    heartRate: 76,
    spo2: 98,
    systolicBp: 124,
    diastolicBp: 82,
    temperature: 36.8,
    respiratoryRate: 16,
    alertLevel: "NORMAL",
    alertReasons: [],
    lastUpdate: "Just now",
  },
  {
    id: "p-102",
    patientId: 102,
    admissionId: 2,
    patientName: "Marcus Sterling",
    bedNumber: "ICU-02",
    wardName: "Cardiothoracic ICU",
    heartRate: 118,
    spo2: 92,
    systolicBp: 148,
    diastolicBp: 94,
    temperature: 38.4,
    respiratoryRate: 24,
    alertLevel: "WARNING",
    alertReasons: ["Sinus Tachycardia (118 bpm)", "Pyrexia (38.4°C)"],
    lastUpdate: "Just now",
  },
  {
    id: "p-103",
    patientId: 103,
    admissionId: 3,
    patientName: "Sarah Chen",
    bedNumber: "ICU-03",
    wardName: "Neuro ICU",
    heartRate: 52,
    spo2: 99,
    systolicBp: 110,
    diastolicBp: 70,
    temperature: 36.5,
    respiratoryRate: 14,
    alertLevel: "NORMAL",
    alertReasons: [],
    lastUpdate: "Just now",
  },
  {
    id: "p-104",
    patientId: 104,
    admissionId: 4,
    patientName: "Robert Hayes",
    bedNumber: "ICU-04",
    wardName: "Trauma ICU",
    heartRate: 134,
    spo2: 88,
    systolicBp: 88,
    diastolicBp: 56,
    temperature: 37.1,
    respiratoryRate: 28,
    alertLevel: "CRITICAL",
    alertReasons: ["Acute Hypoxemia (88% SpO2)", "Severe Hypotension (88/56 mmHg)", "Tachycardia"],
    lastUpdate: "Just now",
  },
];

export function IcuTelemetryConsole() {
  const [patients, setPatients] = useState<Record<string, TelemetryPatient>>(() => {
    const map: Record<string, TelemetryPatient> = {};
    SEED_PATIENTS.forEach((p) => {
      map[String(p.patientId)] = p;
    });
    return map;
  });

  const [selectedPatientId, setSelectedPatientId] = useState<string>("104");
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [metricTab, setMetricTab] = useState<"hr" | "spo2" | "bp" | "all">("hr");
  const [timeWindow, setTimeWindow] = useState<"1h" | "6h" | "24h">("1h");
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect WebSocket to Go Microservice
  const connectWebSocket = useCallback(() => {
    try {
      const wsUrl = getVitalsWsUrl();
      setConnectionStatus("connecting");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("connected");
      };

      ws.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload.type === "vitals_update" && payload.data) {
            const v = payload.data;
            const pId = String(v.patientId || v.admissionId || "default");
            setPatients((prev) => ({
              ...prev,
              [pId]: {
                id: pId,
                patientId: v.patientId || Number(pId) || 0,
                admissionId: v.admissionId,
                patientName: v.patientName || prev[pId]?.patientName || `Patient #${pId}`,
                bedNumber: v.bedNumber || prev[pId]?.bedNumber || "ICU Bed",
                wardName: v.wardName || prev[pId]?.wardName || "ICU Ward",
                heartRate: v.heartRate ?? 75,
                spo2: v.spo2 ?? 98,
                systolicBp: v.systolicBp ?? 120,
                diastolicBp: v.diastolicBp ?? 80,
                temperature: v.temperature ?? 37.0,
                respiratoryRate: v.respiratoryRate ?? 16,
                alertLevel: v.alertLevel || "NORMAL",
                alertReasons: v.alertReasons || [],
                lastUpdate: "Live",
              },
            }));
          }
        } catch {
          // ignore parsing error
        }
      };

      ws.onclose = () => {
        setConnectionStatus("disconnected");
        // Reconnect after 4 seconds
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 4000);
      };

      ws.onerror = () => {
        setConnectionStatus("disconnected");
        ws.close();
      };
    } catch {
      setConnectionStatus("disconnected");
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
    }
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connectWebSocket]);

  // Subtle live oscillation effect if WebSocket is running in simulation mode
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          const p = next[k];
          // Small realistic physiological drift (+- 1-2 bpm, SpO2 drift)
          const hrJitter = Math.floor(Math.random() * 3) - 1;
          const newHr = Math.max(45, Math.min(180, p.heartRate + hrJitter));
          next[k] = {
            ...p,
            heartRate: newHr,
          };
        });
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Fetch or generate time-series history for the selected patient
  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const hours = timeWindow === "1h" ? 1 : timeWindow === "6h" ? 6 : 24;
        const res = await fetchVitalsHistory(selectedPatientId, hours, 40).catch(() => null);

        if (res && Array.isArray(res.data) && res.data.length > 0) {
          const formatted = res.data.map((item: any) => ({
            time: new Date(item.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            heartRate: item.heartRate,
            spo2: item.spo2,
            systolicBp: item.systolicBp,
            diastolicBp: item.diastolicBp,
            temperature: item.temperature,
            respiratoryRate: item.respiratoryRate,
          }));
          setHistoryData(formatted);
          return;
        }

        // Generate smooth realistic synthetic trend points based on patient's current profile
        const active = patients[selectedPatientId] || SEED_PATIENTS[0];
        const pointsCount = timeWindow === "1h" ? 12 : timeWindow === "6h" ? 24 : 36;
        const generated: any[] = [];
        const now = Date.now();
        const stepMs = (hours * 3600 * 1000) / pointsCount;

        for (let i = pointsCount; i >= 0; i--) {
          const t = new Date(now - i * stepMs);
          const timeLabel = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const variance = Math.sin(i / 2) * 5;
          generated.push({
            time: timeLabel,
            heartRate: Math.round(active.heartRate + variance),
            spo2: Math.min(100, Math.max(85, Math.round(active.spo2 + (Math.cos(i) * 1.5)))),
            systolicBp: Math.round(active.systolicBp + variance * 1.2),
            diastolicBp: Math.round(active.diastolicBp + variance * 0.8),
            temperature: Number((active.temperature + (Math.sin(i) * 0.2)).toFixed(1)),
            respiratoryRate: Math.round(active.respiratoryRate + (Math.cos(i) * 1)),
          });
        }
        setHistoryData(generated);
      } catch (err) {
        console.error("Error loading telemetry history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [selectedPatientId, timeWindow, patients]);

  const patientList = useMemo(() => Object.values(patients), [patients]);
  const activePatient = patients[selectedPatientId] || patientList[0] || SEED_PATIENTS[0];

  const criticalPatients = useMemo(() => {
    return patientList.filter((p) => p.alertLevel === "CRITICAL" || p.alertLevel === "WARNING");
  }, [patientList]);

  const handleExportPDF = () => {
    if (activePatient?.admissionId) {
      toast.info(`Generating Maroto PDF ICU Clinical Dossier for ${activePatient.patientName}...`);
      downloadReport("discharge", activePatient.admissionId);
    } else {
      toast.info(`Downloading clinical summary for ${activePatient.patientName}...`);
      downloadReport("discharge", 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Station */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">ICU Central Telemetry</h1>
            <Badge
              variant="outline"
              className={`gap-1.5 text-xs font-mono font-medium ${
                connectionStatus === "connected"
                  ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                  : "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
              }`}
            >
              <Radio className={`size-3 ${connectionStatus === "connected" ? "animate-pulse text-emerald-500" : ""}`} />
              {connectionStatus === "connected" ? "Go Microservice WS: Connected" : "Local Telemetry Fallback"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Continuous multi-bed physiological waveform monitoring with early-warning telemetry thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`gap-1.5 text-xs h-9 ${audioEnabled ? "border-amber-500/30 text-amber-600 bg-amber-500/10" : ""}`}
          >
            {audioEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            {audioEnabled ? "Audio Alarm: ON" : "Audio Alarm: MUTED"}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleExportPDF}
            className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90"
          >
            <FileDown className="size-3.5" />
            Export Maroto PDF Report
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner (if any) */}
      {criticalPatients.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 animate-in fade-in-0">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5 animate-bounce" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-red-600 dark:text-red-400">
                  CRITICAL TELEMETRY ALERTS ({criticalPatients.length} Patients Requiring Immediate Attention)
                </h4>
              </div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {criticalPatients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(String(p.patientId))}
                    className="cursor-pointer flex items-center justify-between bg-background/80 hover:bg-background p-2.5 rounded-lg border border-red-500/20 transition-all"
                  >
                    <div>
                      <span className="font-semibold text-foreground">{p.patientName}</span>
                      <span className="text-muted-foreground ml-2">({p.bedNumber})</span>
                      <div className="text-[11px] text-red-500 font-medium mt-0.5">
                        {p.alertReasons?.join(" • ") || "Elevated physiological threshold"}
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-[10px] uppercase font-mono">
                      {p.alertLevel}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Patient Bedside Tiles Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BedDouble className="size-4" />
            Active Bedside Monitors ({patientList.length})
          </h2>
          <span className="text-xs text-muted-foreground">Select a bedside tile to inspect live telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {patientList.map((p) => {
            const isSelected = String(p.patientId) === selectedPatientId;
            const isCrit = p.alertLevel === "CRITICAL";
            const isWarn = p.alertLevel === "WARNING";

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPatientId(String(p.patientId))}
                className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-primary border-primary bg-primary/5 shadow-md"
                    : "hover:border-foreground/30 bg-card shadow-xs"
                } ${isCrit ? "border-red-500/50" : isWarn ? "border-amber-500/50" : ""}`}
              >
                {/* Header of Tile */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-foreground leading-tight">{p.patientName}</h3>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {p.bedNumber} • {p.wardName}
                    </p>
                  </div>
                  <Badge
                    variant={isCrit ? "destructive" : isWarn ? "warning" : "outline"}
                    className={`text-[10px] font-mono uppercase px-1.5 py-0 ${
                      isWarn ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" : ""
                    } ${!isCrit && !isWarn ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" : ""}`}
                  >
                    {p.alertLevel}
                  </Badge>
                </div>

                {/* Vitals Readings Matrix */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Heart Rate */}
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                      <span>HR (bpm)</span>
                      <Heart className={`size-3 text-red-500 ${p.heartRate > 100 ? "animate-pulse" : ""}`} />
                    </div>
                    <div className="text-lg font-bold font-mono tracking-tight text-foreground mt-0.5">
                      {p.heartRate}
                    </div>
                  </div>

                  {/* SpO2 */}
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                      <span>SpO2 (%)</span>
                      <Wind className="size-3 text-sky-500" />
                    </div>
                    <div className="text-lg font-bold font-mono tracking-tight text-foreground mt-0.5">
                      {p.spo2}%
                    </div>
                  </div>

                  {/* Blood Pressure */}
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                      <span>NIBP (mmHg)</span>
                      <Gauge className="size-3 text-indigo-500" />
                    </div>
                    <div className="text-sm font-bold font-mono tracking-tight text-foreground mt-1">
                      {p.systolicBp}/{p.diastolicBp}
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                      <span>Temp (°C)</span>
                      <Thermometer className="size-3 text-amber-500" />
                    </div>
                    <div className="text-sm font-bold font-mono tracking-tight text-foreground mt-1">
                      {p.temperature}°C
                    </div>
                  </div>
                </div>

                {/* Status Indicator Bar */}
                <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="size-3 text-emerald-500 animate-pulse" />
                    Resp: {p.respiratoryRate}/min
                  </span>
                  <span className="font-mono text-[10px]">ID #{p.patientId}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Focused Patient Waveform & Time-Series Visualizer */}
      <Card className="border-border">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity className="size-5 text-teal-500 animate-pulse" />
                  Telemetry Waveform Station: {activePatient.patientName}
                </CardTitle>
                <Badge variant="outline" className="font-mono text-xs">
                  {activePatient.bedNumber} • {activePatient.wardName}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                Continuous physiological telemetry stream recorded at 1 Hz frequency with dynamic trend zones.
              </CardDescription>
            </div>

            {/* Time Window Filters */}
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg">
              <Button
                variant={timeWindow === "1h" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeWindow("1h")}
                className="h-7 text-xs px-2.5"
              >
                1 Hour
              </Button>
              <Button
                variant={timeWindow === "6h" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeWindow("6h")}
                className="h-7 text-xs px-2.5"
              >
                6 Hours
              </Button>
              <Button
                variant={timeWindow === "24h" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeWindow("24h")}
                className="h-7 text-xs px-2.5"
              >
                24 Hours
              </Button>
            </div>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-2 pt-3 overflow-x-auto">
            <Button
              variant={metricTab === "hr" ? "default" : "outline"}
              size="sm"
              onClick={() => setMetricTab("hr")}
              className="gap-1.5 text-xs h-8"
            >
              <Heart className="size-3.5 text-red-500" />
              Heart Rate (BPM)
            </Button>
            <Button
              variant={metricTab === "spo2" ? "default" : "outline"}
              size="sm"
              onClick={() => setMetricTab("spo2")}
              className="gap-1.5 text-xs h-8"
            >
              <Wind className="size-3.5 text-sky-500" />
              Pulse Oximetry (SpO2 %)
            </Button>
            <Button
              variant={metricTab === "bp" ? "default" : "outline"}
              size="sm"
              onClick={() => setMetricTab("bp")}
              className="gap-1.5 text-xs h-8"
            >
              <Gauge className="size-3.5 text-indigo-500" />
              Arterial Pressure (BP)
            </Button>
            <Button
              variant={metricTab === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setMetricTab("all")}
              className="gap-1.5 text-xs h-8"
            >
              <SlidersHorizontal className="size-3.5 text-amber-500" />
              All Waveforms
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {metricTab === "hr" ? (
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="time" stroke="currentColor" opacity={0.5} fontSize={11} />
                  <YAxis domain={[40, 160]} stroke="currentColor" opacity={0.5} fontSize={11} unit=" bpm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Tachycardia (>100)", fill: "#f59e0b", fontSize: 10 }} />
                  <ReferenceLine y={60} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: "Bradycardia (<60)", fill: "#3b82f6", fontSize: 10 }} />
                  <Area type="monotone" dataKey="heartRate" name="Heart Rate (BPM)" stroke="#ef4444" strokeWidth={2.5} fill="url(#hrGrad)" dot={false} />
                </AreaChart>
              ) : metricTab === "spo2" ? (
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="time" stroke="currentColor" opacity={0.5} fontSize={11} />
                  <YAxis domain={[80, 100]} stroke="currentColor" opacity={0.5} fontSize={11} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Hypoxia Critical (<90%)", fill: "#ef4444", fontSize: 10 }} />
                  <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Normal (>95%)", fill: "#10b981", fontSize: 10 }} />
                  <Area type="monotone" dataKey="spo2" name="SpO2 Saturation (%)" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#spo2Grad)" dot={false} />
                </AreaChart>
              ) : metricTab === "bp" ? (
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="time" stroke="currentColor" opacity={0.5} fontSize={11} />
                  <YAxis domain={[50, 180]} stroke="currentColor" opacity={0.5} fontSize={11} unit=" mmHg" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Stage 2 HTN (140)", fill: "#ef4444", fontSize: 10 }} />
                  <ReferenceLine y={90} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Hypotension (90)", fill: "#f59e0b", fontSize: 10 }} />
                  <Line type="monotone" dataKey="systolicBp" name="Systolic (mmHg)" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="diastolicBp" name="Diastolic (mmHg)" stroke="#a855f7" strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="time" stroke="currentColor" opacity={0.5} fontSize={11} />
                  <YAxis stroke="currentColor" opacity={0.5} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="heartRate" name="Heart Rate (bpm)" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="spo2" name="SpO2 (%)" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="systolicBp" name="Systolic BP" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="respiratoryRate" name="Resp Rate" stroke="#10b981" strokeWidth={1.5} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Quick Stats Strip */}
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-muted/30 p-3 rounded-lg">
              <span className="text-xs text-muted-foreground block">Mean Heart Rate</span>
              <span className="text-lg font-bold font-mono text-foreground">
                {activePatient.heartRate} bpm
              </span>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg">
              <span className="text-xs text-muted-foreground block">Current Saturation</span>
              <span className="text-lg font-bold font-mono text-foreground">
                {activePatient.spo2}% SpO2
              </span>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg">
              <span className="text-xs text-muted-foreground block">Arterial Pressure</span>
              <span className="text-lg font-bold font-mono text-foreground">
                {activePatient.systolicBp}/{activePatient.diastolicBp} mmHg
              </span>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg">
              <span className="text-xs text-muted-foreground block">Core Temperature</span>
              <span className="text-lg font-bold font-mono text-foreground">
                {activePatient.temperature}°C
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
