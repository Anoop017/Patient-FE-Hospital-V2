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
import { Plus, FileDown, Activity } from "lucide-react";
import { downloadReport } from "@/lib/reports";
import { DoctorVitalsLiveMonitor } from "@/components/vitals/DoctorVitalsLiveMonitor";

export default function DoctorAdmissions() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVitalsAdm, setSelectedVitalsAdm] = useState<any | null>(null);

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
        alert("Please select an available bed before admitting a patient.");
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
      fetchData();
      fetchBeds();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create admission.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischarge = async (id: string | number) => {
    try {
      await api.patch(`/admissions/${id}`, { status: "discharged" });
      fetchData();
      fetchBeds();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to discharge.");
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

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading admissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admissions</h1>
          <p className="text-muted-foreground">Manage patient admissions, live vital monitoring, and discharges.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Admit Patient
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Patient</TableHead>
                <TableHead className="whitespace-nowrap">Bed / Ward</TableHead>
                <TableHead className="whitespace-nowrap">Reason</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No admissions found.</TableCell></TableRow>
              ) : (
                admissions.map((adm) => (
                  <TableRow key={adm.id}>
                    <TableCell>{new Date(adm.createdAt || adm.admissionDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{adm.patient?.user ? `${adm.patient.user.firstName} ${adm.patient.user.lastName}` : "-"}</TableCell>
                    <TableCell>{adm.bed ? `Bed ${adm.bed.bedNumber} (${adm.bed.ward?.name || "General"})` : "-"}</TableCell>
                    <TableCell>{adm.reason || "-"}</TableCell>
                    <TableCell>{getStatusBadge(adm.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedVitalsAdm(adm)}
                          title="Live ICU Telemetry"
                          className="h-8 text-xs flex items-center gap-1 border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10"
                        >
                          <Activity className="h-3.5 w-3.5" />
                          Vitals
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadReport("discharge", adm.id)}
                          title="Download Discharge Summary PDF"
                          className="h-8 text-xs flex items-center gap-1 text-primary hover:bg-primary/10 border-primary/30"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          PDF
                        </Button>
                        {adm.status?.toLowerCase() === "admitted" && (
                          <Button size="sm" variant="outline" onClick={() => handleDischarge(adm.id)} className="h-8 text-xs">
                            Discharge
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
                    : p.name || `Patient #${p.id}`;
                  const email = p.user?.email ? ` (${p.user.email})` : "";
                  return (
                    <option key={p.id} value={p.id}>
                      {name || `Patient #${p.id}`}{email}
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
