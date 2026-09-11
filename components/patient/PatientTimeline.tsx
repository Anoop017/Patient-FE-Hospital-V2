"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { formatMRN } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Activity,
  Calendar,
  FileText,
  FlaskConical,
  Pill,
  BedDouble,
  Clock,
  User,
  Stethoscope,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { toast } from "@/components/ui/toast";

export interface TimelineEvent {
  id: string;
  type: "admission" | "record" | "prescription" | "lab_test" | "appointment";
  date: string;
  title: string;
  subtitle?: string;
  statusBadge?: {
    label: string;
    variant: "default" | "outline" | "success" | "warning" | "destructive";
  };
  doctorName?: string;
  details: Record<string, any>;
  raw: any;
}

interface PatientTimelineProps {
  patientId: number | string;
  patientInfo?: {
    name?: string;
    bloodGroup?: string;
    gender?: string;
    dateOfBirth?: string;
    phone?: string;
    email?: string;
  };
  onOpenTelemetry?: () => void;
}

export function PatientTimeline({ patientId, patientInfo, onOpenTelemetry }: PatientTimelineProps) {
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [patientDetails, setPatientDetails] = useState<any>(patientInfo || null);

  useEffect(() => {
    if (!patientId) return;

    const fetchTimeline = async () => {
      setLoading(true);
      try {
        // Fetch concurrently across endpoints
        const [patientRes, recordsRes, rxRes, labsRes, admitsRes, apptsRes] = await Promise.allSettled([
          api.get(`/patients/${patientId}`).catch(() => null),
          api.get(`/medical-records?patientId=${patientId}`).catch(() => api.get("/medical-records")),
          api.get(`/prescriptions?patientId=${patientId}`).catch(() => api.get("/prescriptions")),
          api.get(`/lab-tests?patientId=${patientId}`).catch(() => api.get("/lab-tests")),
          api.get(`/admissions?patientId=${patientId}`).catch(() => api.get("/admissions")),
          api.get(`/appointments?patientId=${patientId}`).catch(() => api.get("/appointments")),
        ]);

        // Process Patient info if returned
        if (patientRes.status === "fulfilled" && patientRes.value && (patientRes.value as any).data) {
          setPatientDetails((prev: any) => ({ ...prev, ...(patientRes.value as any).data }));
        }

        const unwrap = (result: PromiseSettledResult<any>) => {
          if (result.status !== "fulfilled" || !result.value?.data) return [];
          const d = result.value.data;
          if (Array.isArray(d)) return d;
          if (Array.isArray(d.data)) return d.data;
          return [];
        };

        const rawRecords = unwrap(recordsRes).filter((r: any) => !r.patientId || String(r.patientId) === String(patientId) || String(r.patient?.id) === String(patientId));
        const rawRx = unwrap(rxRes).filter((r: any) => !r.patientId || String(r.patientId) === String(patientId) || String(r.patient?.id) === String(patientId));
        const rawLabs = unwrap(labsRes).filter((r: any) => !r.patientId || String(r.patientId) === String(patientId) || String(r.patient?.id) === String(patientId));
        const rawAdmits = unwrap(admitsRes).filter((r: any) => !r.patientId || String(r.patientId) === String(patientId) || String(r.patient?.id) === String(patientId));
        const rawAppts = unwrap(apptsRes).filter((r: any) => !r.patientId || String(r.patientId) === String(patientId) || String(r.patient?.id) === String(patientId));

        const mapped: TimelineEvent[] = [];

        // 1. Admissions
        rawAdmits.forEach((adm: any) => {
          mapped.push({
            id: `adm-${adm.id}`,
            type: "admission",
            date: adm.admissionDate || adm.createdAt || new Date().toISOString(),
            title: `Inpatient Admission: ${adm.ward?.name || adm.wardName || "General Ward"} (Bed ${adm.bed?.bedNumber || adm.bedNumber || "N/A"})`,
            subtitle: adm.reason ? `Reason: ${adm.reason}` : "Inpatient Care",
            statusBadge: {
              label: adm.status || "ADMITTED",
              variant: adm.status === "DISCHARGED" ? "outline" : "default",
            },
            doctorName: adm.doctor?.user ? `Dr. ${adm.doctor.user.firstName} ${adm.doctor.user.lastName}` : undefined,
            details: {
              admissionDate: adm.admissionDate,
              dischargeDate: adm.dischargeDate,
              diagnosis: adm.diagnosis,
              ward: adm.ward?.name || adm.wardName,
              bed: adm.bed?.bedNumber || adm.bedNumber,
              dischargeSummary: adm.dischargeSummary,
            },
            raw: adm,
          });
        });

        // 2. Medical Records / Diagnoses
        rawRecords.forEach((rec: any) => {
          mapped.push({
            id: `rec-${rec.id}`,
            type: "record",
            date: rec.createdAt || rec.date || new Date().toISOString(),
            title: `Clinical Diagnosis: ${rec.diagnosis || "Medical Consultation"}`,
            subtitle: rec.symptoms ? `Symptoms: ${rec.symptoms}` : undefined,
            statusBadge: {
              label: "Clinical Record",
              variant: "outline",
            },
            doctorName: rec.doctor?.user ? `Dr. ${rec.doctor.user.firstName} ${rec.doctor.user.lastName}` : undefined,
            details: {
              symptoms: rec.symptoms,
              treatment: rec.treatment,
              notes: rec.notes,
            },
            raw: rec,
          });
        });

        // 3. Prescriptions
        rawRx.forEach((rx: any) => {
          const medCount = Array.isArray(rx.medications) ? rx.medications.length : 1;
          mapped.push({
            id: `rx-${rx.id}`,
            type: "prescription",
            date: rx.createdAt || new Date().toISOString(),
            title: rx.medicationName
              ? `Prescription: ${rx.medicationName} (${rx.dosage || "As directed"})`
              : `Prescription Order (${medCount} medication${medCount > 1 ? "s" : ""})`,
            subtitle: rx.instructions || rx.frequency || "Follow physician instructions",
            statusBadge: {
              label: rx.status || "ACTIVE",
              variant: rx.status === "DISCONTINUED" ? "destructive" : "outline",
            },
            doctorName: rx.doctor?.user ? `Dr. ${rx.doctor.user.firstName} ${rx.doctor.user.lastName}` : undefined,
            details: {
              medications: rx.medications,
              dosage: rx.dosage,
              frequency: rx.frequency,
              duration: rx.duration,
              instructions: rx.instructions,
            },
            raw: rx,
          });
        });

        // 4. Lab Tests
        rawLabs.forEach((lab: any) => {
          const isAbnormal = lab.status === "CRITICAL" || lab.isAbnormal;
          mapped.push({
            id: `lab-${lab.id}`,
            type: "lab_test",
            date: lab.createdAt || new Date().toISOString(),
            title: `Lab Diagnostic: ${lab.testName || lab.name || "Blood Panel"}`,
            subtitle: lab.category ? `Category: ${lab.category}` : undefined,
            statusBadge: {
              label: lab.status || "COMPLETED",
              variant: isAbnormal ? "destructive" : "outline",
            },
            doctorName: lab.doctor?.user ? `Dr. ${lab.doctor.user.firstName} ${lab.doctor.user.lastName}` : undefined,
            details: {
              category: lab.category,
              result: lab.result,
              referenceRange: lab.referenceRange,
              notes: lab.notes,
            },
            raw: lab,
          });
        });

        // 5. Appointments
        rawAppts.forEach((appt: any) => {
          mapped.push({
            id: `appt-${appt.id}`,
            type: "appointment",
            date: appt.appointmentDate || appt.createdAt || new Date().toISOString(),
            title: `Consultation Encounter (${appt.type || "General"})`,
            subtitle: appt.reason ? `Chief Complaint: ${appt.reason}` : undefined,
            statusBadge: {
              label: appt.status || "SCHEDULED",
              variant: appt.status === "COMPLETED" ? "outline" : "default",
            },
            doctorName: appt.doctor?.user ? `Dr. ${appt.doctor.user.firstName} ${appt.doctor.user.lastName}` : undefined,
            details: {
              type: appt.type,
              status: appt.status,
              notes: appt.notes,
            },
            raw: appt,
          });
        });

        // Sort descending chronologically
        mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEvents(mapped);
      } catch (err) {
        console.error("Failed to compile patient timeline:", err);
        toast.error("Failed to load full clinical timeline");
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [patientId]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === "all") return events;
    return events.filter((e) => {
      if (activeFilter === "records") return e.type === "record" || e.type === "appointment";
      if (activeFilter === "prescriptions") return e.type === "prescription";
      if (activeFilter === "labs") return e.type === "lab_test";
      if (activeFilter === "admissions") return e.type === "admission";
      return true;
    });
  }, [events, activeFilter]);

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "admission":
        return <BedDouble className="size-4 text-indigo-500" />;
      case "record":
        return <FileText className="size-4 text-emerald-500" />;
      case "prescription":
        return <Pill className="size-4 text-amber-500" />;
      case "lab_test":
        return <FlaskConical className="size-4 text-purple-500" />;
      case "appointment":
        return <Calendar className="size-4 text-sky-500" />;
    }
  };

  const getEventColorClass = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "admission":
        return "border-indigo-500/30 bg-indigo-500/5";
      case "record":
        return "border-emerald-500/30 bg-emerald-500/5";
      case "prescription":
        return "border-amber-500/30 bg-amber-500/5";
      case "lab_test":
        return "border-purple-500/30 bg-purple-500/5";
      case "appointment":
        return "border-sky-500/30 bg-sky-500/5";
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Dossier Banner */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
              {patientDetails?.user?.firstName?.[0] || patientDetails?.name?.[0] || "P"}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight">
                  {patientDetails?.user?.firstName} {patientDetails?.user?.lastName}
                  {!patientDetails?.user?.firstName && (patientDetails?.name || formatMRN(patientId))}
                </h2>
                <Badge variant="outline" className="text-xs font-mono bg-muted/40">
                  {formatMRN(patientId)}
                </Badge>
                {patientDetails?.bloodGroup && (
                  <Badge variant="outline" className="text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                    🩸 {patientDetails.bloodGroup}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                {patientDetails?.gender && <span>Gender: <strong className="text-foreground capitalize">{patientDetails.gender}</strong></span>}
                {patientDetails?.dateOfBirth && (
                  <span>DOB: <strong className="text-foreground">{new Date(patientDetails.dateOfBirth).toLocaleDateString()}</strong></span>
                )}
                {patientDetails?.phone && <span>Tel: <strong className="text-foreground">{patientDetails.phone}</strong></span>}
                <span>Total Clinical Encounters: <strong className="text-foreground">{events.length}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {onOpenTelemetry && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenTelemetry}
                className="gap-1.5 border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 text-xs font-medium"
              >
                <Activity className="size-3.5 text-teal-500 animate-pulse" />
                Live Telemetry
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 text-xs">
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("all")}
            className="h-8 rounded-full text-xs"
          >
            All Journey ({events.length})
          </Button>
          <Button
            variant={activeFilter === "records" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("records")}
            className="h-8 rounded-full text-xs"
          >
            Diagnoses & Notes
          </Button>
          <Button
            variant={activeFilter === "prescriptions" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("prescriptions")}
            className="h-8 rounded-full text-xs"
          >
            Prescriptions
          </Button>
          <Button
            variant={activeFilter === "labs" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("labs")}
            className="h-8 rounded-full text-xs"
          >
            Lab Diagnostics
          </Button>
          <Button
            variant={activeFilter === "admissions" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("admissions")}
            className="h-8 rounded-full text-xs"
          >
            Inpatient Admissions
          </Button>
        </div>
      </div>

      {/* Timeline Section */}
      {loading ? (
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No timeline events found"
          description="There are no medical events or encounters recorded for this filter."
          actionLabel="Clear Filter"
          onAction={() => setActiveFilter("all")}
        />
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-border">
          {filteredEvents.map((evt) => (
            <div key={evt.id} className="relative group">
              {/* Timeline marker node */}
              <div className="absolute -left-6 top-1.5 size-5 rounded-full border-2 border-background bg-card flex items-center justify-center shadow-xs ring-4 ring-background">
                {getEventIcon(evt.type)}
              </div>

              {/* Event Card */}
              <div className={`rounded-xl border p-4 transition-all hover:shadow-sm ${getEventColorClass(evt.type)}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-foreground tracking-tight">{evt.title}</h4>
                      {evt.statusBadge && (
                        <Badge variant={evt.statusBadge.variant} className="text-[11px] py-0 px-2">
                          {evt.statusBadge.label}
                        </Badge>
                      )}
                    </div>
                    {evt.subtitle && <p className="text-xs text-muted-foreground">{evt.subtitle}</p>}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="size-3" />
                      {new Date(evt.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Event Details Content */}
                <div className="mt-3 pt-3 border-t border-border/50 text-xs space-y-2">
                  {/* Medical Record Details */}
                  {evt.type === "record" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {evt.details.treatment && (
                        <div className="bg-background/60 p-2.5 rounded-lg border border-border/40">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">
                            Treatment Plan
                          </span>
                          <p className="text-foreground">{evt.details.treatment}</p>
                        </div>
                      )}
                      {evt.details.notes && (
                        <div className="bg-background/60 p-2.5 rounded-lg border border-border/40">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">
                            Clinical Notes
                          </span>
                          <p className="text-foreground">{evt.details.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prescription Details */}
                  {evt.type === "prescription" && (
                    <div>
                      {Array.isArray(evt.details.medications) && evt.details.medications.length > 0 ? (
                        <div className="space-y-1.5">
                          {evt.details.medications.map((m: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between bg-background/60 p-2 rounded-lg border border-border/40">
                              <span className="font-medium text-foreground">{m.name || m.medicationName}</span>
                              <span className="text-muted-foreground font-mono">
                                {m.dosage} • {m.frequency} • {m.duration}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-background/60 p-2 rounded-lg border border-border/40 font-mono">
                          <span>Dosage: {evt.details.dosage || "Standard"}</span>
                          <span>Freq: {evt.details.frequency || "Once daily"}</span>
                          <span>Duration: {evt.details.duration || "7 days"}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lab Test Details */}
                  {evt.type === "lab_test" && (
                    <div className="flex flex-wrap items-center gap-4 bg-background/60 p-2.5 rounded-lg border border-border/40">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Result</span>
                        <span className="font-semibold text-foreground">{evt.details.result || "Awaiting Analysis"}</span>
                      </div>
                      {evt.details.referenceRange && (
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Reference Range</span>
                          <span className="font-mono text-muted-foreground">{evt.details.referenceRange}</span>
                        </div>
                      )}
                      {evt.details.notes && (
                        <div className="flex-1 min-w-[200px]">
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Lab Notes</span>
                          <span className="text-foreground">{evt.details.notes}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inpatient Admission Details */}
                  {evt.type === "admission" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="bg-background/60 p-2 rounded-lg border border-border/40">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Ward & Bed</span>
                        <span className="font-medium">{evt.details.ward} — Bed {evt.details.bed}</span>
                      </div>
                      <div className="bg-background/60 p-2 rounded-lg border border-border/40">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Admission Window</span>
                        <span>{new Date(evt.details.admissionDate).toLocaleDateString()} &rarr; {evt.details.dischargeDate ? new Date(evt.details.dischargeDate).toLocaleDateString() : "Current Inpatient"}</span>
                      </div>
                      <div className="bg-background/60 p-2 rounded-lg border border-border/40">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Diagnosis</span>
                        <span className="font-medium">{evt.details.diagnosis || "Under Observation"}</span>
                      </div>
                    </div>
                  )}

                  {/* Clinician Footer */}
                  {evt.doctorName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                      <Stethoscope className="size-3 text-primary" />
                      <span>Attending Clinician: <strong className="text-foreground font-normal">{evt.doctorName}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
