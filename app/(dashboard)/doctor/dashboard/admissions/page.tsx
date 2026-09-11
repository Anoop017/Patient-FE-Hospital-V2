"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, FileDown, Activity, Search, Building2 } from "lucide-react";
import { downloadReport } from "@/lib/reports";
import { DoctorVitalsLiveMonitor } from "@/components/vitals/DoctorVitalsLiveMonitor";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatAdmissionRef, formatDate, formatMRN } from "@/lib/formatters";

export default function DoctorAdmissions() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVitalsAdm, setSelectedVitalsAdm] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [beds, setBeds] = useState<any[]>([]);
  const [patientId, setPatientId] = useState("");
  const [bedId, setBedId] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchData();
    fetchPatients();
    fetchDoctorProfile();
    fetchBeds();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const res = await api.get("/doctors/me").catch(() => null);
      if (res?.data?.id) {
        setDoctorId(res.data.id);
      }
    } catch {
      // ignore
    }
  };

  const fetchBeds = async () => {
    try {
      const res = await api.get("/beds").catch(() => null);
      if (res?.data && Array.isArray(res.data)) {
        setBeds(res.data);
      }
    } catch {
      // ignore
    }
  };

  const fetchData = async () => {
    try {
      const res = await api.get("/admissions");
      setAdmissions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load admissions", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const [patRes, apptRes] = await Promise.allSettled([
        api.get("/patients"),
        api.get("/appointments/me"),
      ]);

      const map = new Map<number | string, any>();

      if (patRes.status === "fulfilled") {
        const data = patRes.value.data;
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        list.forEach((p: any) => {
          if (p?.id) map.set(p.id, p);
        });
      }

      if (apptRes.status === "fulfilled") {
        const data = apptRes.value.data;
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        list.forEach((a: any) => {
          if (a?.patient?.id && !map.has(a.patient.id)) {
            map.set(a.patient.id, a.patient);
          }
        });
      }

      setPatients(Array.from(map.values()));
    } catch (error) {
      console.error("Failed to load patients", error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!bedId) {
        toast.warning("Bed Required", "Please select an available bed before admitting a patient.");
        setSubmitting(false);
        return;
      }

      let activeDocId = doctorId;
      if (!activeDocId) {
        const docRes = await api.get("/doctors/me").catch(() => null);
        activeDocId = docRes?.data?.id || 1;
      }

      const numericPatientId = !isNaN(Number(patientId)) ? Number(patientId) : patientId;
      const payload: any = {
        patientId: numericPatientId,
        admittingDoctorId: Number(activeDocId),
        bedId: Number(bedId),
        admissionDate: new Date().toISOString(),
        reason,
        status: "admitted",
      };

      await api.post("/admissions", payload);
      setDialogOpen(false);
      setPatientId(""); setReason("");
      toast.success("Patient Admitted", "Patient has been admitted to ward bed.");
      fetchData();
      fetchBeds();
    } catch (error: any) {
      toast.error("Admission Failed", error.response?.data?.message || "Failed to create admission.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischarge = async (id: string | number) => {
    try {
      await api.patch(`/admissions/${id}`, { status: "discharged" });
      toast.success("Patient Discharged", "Admission has been concluded and bed freed.");
      fetchData();
      fetchBeds();
    } catch (error: any) {
      toast.error("Discharge Failed", error.response?.data?.message || "Failed to discharge patient.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "admitted": return <Badge variant="default">Admitted</Badge>;
      case "discharged": return <Badge variant="success">Discharged</Badge>;
      case "transferred": return <Badge variant="warning">Transferred</Badge>;
      default: return <Badge variant="outline">{status || "-"}</Badge>;
    }
  };

  const filteredAdmissions = admissions.filter((adm) => {
    const pName = `${adm.patient?.user?.firstName || ""} ${adm.patient?.user?.lastName || ""}`.toLowerCase();
    const bNum = `${adm.bed?.bedNumber || ""}`.toLowerCase();
    const wName = `${adm.bed?.ward?.name || ""}`.toLowerCase();
    const reasonStr = (adm.reason || "").toLowerCase();
    return pName.includes(search.toLowerCase()) || bNum.includes(search.toLowerCase()) || wName.includes(search.toLowerCase()) || reasonStr.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admissions</h1>
          <p className="text-muted-foreground">Manage inpatient admissions, ICU vitals, and discharges.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto cursor-pointer">
          <Plus className="mr-2 h-4 w-4" /> Admit Patient
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by patient, bed, or ward..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : filteredAdmissions.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Building2}
                title="No admissions found"
                description={
                  search
                    ? "No inpatient admissions match your search query."
                    : "No patients are currently admitted."
                }
                actionLabel={search ? "Clear Search" : "Admit New Patient"}
                onAction={() => {
                  if (search) setSearch("");
                  else setDialogOpen(true);
                }}
              />
            </div>
          ) : (
            <>
              {/* DESKTOP ADMISSIONS TABLE */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Admission Ref</TableHead>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">Patient</TableHead>
                      <TableHead className="whitespace-nowrap">Bed / Ward</TableHead>
                      <TableHead className="whitespace-nowrap">Reason</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmissions.map((adm) => (
                      <TableRow key={adm.id}>
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {formatAdmissionRef(adm.id)}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(adm.createdAt || adm.admissionDate)}</TableCell>
                        <TableCell className="font-medium text-foreground">
                          {adm.patient?.user ? `${adm.patient.user.firstName} ${adm.patient.user.lastName}` : "—"}
                        </TableCell>
                        <TableCell>{adm.bed ? `Bed ${adm.bed.bedNumber} (${adm.bed.ward?.name || "General"})` : "—"}</TableCell>
                        <TableCell className="text-sm">{adm.reason || "—"}</TableCell>
                        <TableCell>{getStatusBadge(adm.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedVitalsAdm(adm)}
                              title="Live ICU Telemetry"
                              className="h-8 text-xs flex items-center gap-1 border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 cursor-pointer"
                            >
                              <Activity className="h-3.5 w-3.5" />
                              Vitals
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadReport("discharge", adm.id)}
                              title="Download Discharge Summary PDF"
                              className="h-8 text-xs flex items-center gap-1 text-primary hover:bg-primary/10 border-primary/30 cursor-pointer"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              PDF
                            </Button>
                            {adm.status?.toLowerCase() === "admitted" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDischarge(adm.id)}
                                className="h-8 text-xs cursor-pointer text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                              >
                                Discharge
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* MOBILE ADMISSIONS CARDS */}
              <div className="block md:hidden divide-y divide-border/60">
                {filteredAdmissions.map((adm) => {
                  const patName = adm.patient?.user
                    ? `${adm.patient.user.firstName} ${adm.patient.user.lastName}`
                    : "Patient";
                  const patInitials = patName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "PT";

                  return (
                    <div key={adm.id} className="p-4 space-y-3">
                      {/* Top Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                            {patInitials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{patName}</p>
                            <span className="font-mono text-xs text-primary font-bold">
                              {formatAdmissionRef(adm.id)}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {getStatusBadge(adm.status)}
                        </div>
                      </div>

                      {/* Middle Details Grid */}
                      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Ward & Bed</span>
                          <span className="font-medium text-foreground">
                            {adm.bed ? `Bed ${adm.bed.bedNumber} (${adm.bed.ward?.name || "General"})` : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Admission Date</span>
                          <span className="font-medium text-foreground">{formatDate(adm.createdAt || adm.admissionDate)}</span>
                        </div>
                        {adm.reason && (
                          <div className="col-span-2 pt-1 border-t border-border/40">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Diagnosis / Reason</span>
                            <span className="text-foreground">{adm.reason}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedVitalsAdm(adm)}
                          className="flex-1 h-8 text-xs flex items-center justify-center gap-1 border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 cursor-pointer"
                        >
                          <Activity className="h-3.5 w-3.5" />
                          Live Vitals
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadReport("discharge", adm.id)}
                          className="flex-1 h-8 text-xs flex items-center justify-center gap-1 text-primary border-primary/30 cursor-pointer"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          PDF Summary
                        </Button>
                        {adm.status?.toLowerCase() === "admitted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDischarge(adm.id)}
                            className="flex-1 h-8 text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                          >
                            Discharge
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Live Vitals Modal for Admitted Patient */}
      <Dialog open={!!selectedVitalsAdm} onOpenChange={(open) => !open && setSelectedVitalsAdm(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="size-5 text-teal-500" />
              Admission Telemetry & Vitals
            </DialogTitle>
            <DialogDescription>
              Live physiological telemetry for admission #{selectedVitalsAdm?.id} (
              {selectedVitalsAdm?.patient?.user?.firstName} {selectedVitalsAdm?.patient?.user?.lastName}).
            </DialogDescription>
          </DialogHeader>
          {selectedVitalsAdm && (
            <div className="mt-2">
              <DoctorVitalsLiveMonitor
                admissionId={selectedVitalsAdm.id}
                patientId={selectedVitalsAdm.patientId || selectedVitalsAdm.patient?.id}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Admit Patient</DialogTitle>
          <DialogDescription>Create a new patient admission record.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient</Label>
              <Select
                id="patientId"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
              >
                <option value="">Select a patient...</option>
                {patients.map((p) => {
                  const name = p.user
                    ? `${p.user.firstName || ""} ${p.user.lastName || ""}`.trim()
                    : p.name || formatMRN(p.id);
                  const email = p.user?.email ? ` (${p.user.email})` : "";
                  return (
                    <option key={p.id} value={p.id}>
                      {name || formatMRN(p.id)}{email}
                    </option>
                  );
                })}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bedId">Assign Bed</Label>
              <Select
                id="bedId"
                value={bedId}
                onChange={(e) => setBedId(e.target.value)}
                required
              >
                <option value="">Select an available bed...</option>
                {beds.map((b) => (
                  <option key={b.id} value={b.id}>
                    Bed #{b.bedNumber} - {b.ward?.name || "General Ward"} ({b.status})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Admission</Label>
              <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Severe Appendicitis" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Admitting..." : "Admit Patient"}</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
