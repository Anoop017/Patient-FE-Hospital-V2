"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, Search, Pill } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [patientId, setPatientId] = useState("");
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const [doctorId, setDoctorId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
    fetchPatients();
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const res = await api.get("/doctors/me").catch(() => null);
      if (res?.data?.id) {
        setDoctorId(res.data.id);
      }
    } catch {}
  };

  const fetchData = async () => {
    try {
      const res = await api.get("/prescriptions/me");
      const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      setPrescriptions(list);
    } catch (error) {
      try {
        const fallbackRes = await api.get("/prescriptions");
        const list = Array.isArray(fallbackRes.data) ? fallbackRes.data : Array.isArray(fallbackRes.data?.data) ? fallbackRes.data.data : [];
        setPrescriptions(list);
      } catch {
        setPrescriptions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const [patRes, apptRes] = await Promise.allSettled([
        api.get("/patients?take=100"),
        api.get("/appointments/me"),
      ]);

      const map = new Map<string | number, any>();

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
      let activeDocId = doctorId;
      if (!activeDocId) {
        const docRes = await api.get("/doctors/me").catch(() => null);
        activeDocId = docRes?.data?.id || 1;
      }

      const numericPatientId = !isNaN(Number(patientId)) ? Number(patientId) : patientId;
      const payload: any = {
        patientId: numericPatientId,
        doctorId: Number(activeDocId),
        medication,
        dosage,
        frequency,
        duration,
        issuedDate: new Date().toISOString(),
      };
      if (notes) payload.notes = notes;

      await api.post("/prescriptions", payload);
      setDialogOpen(false);
      setPatientId(""); setMedication(""); setDosage(""); setFrequency(""); setDuration(""); setNotes("");
      toast.success("Prescription Issued", `Prescription for ${medication} has been recorded.`);
      fetchData();
    } catch (error: any) {
      toast.error("Prescription Error", error.response?.data?.message || "Failed to create prescription.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const pName = `${rx.patient?.user?.firstName || ""} ${rx.patient?.user?.lastName || ""}`.toLowerCase();
    const med = (rx.medication || "").toLowerCase();
    return pName.includes(search.toLowerCase()) || med.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground">Issue and monitor patient pharmacological therapies.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto cursor-pointer">
          <Plus className="mr-2 h-4 w-4" /> New Prescription
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by patient or medication name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Patient</TableHead>
                <TableHead className="whitespace-nowrap">Medication</TableHead>
                <TableHead className="whitespace-nowrap">Dosage</TableHead>
                <TableHead className="whitespace-nowrap">Frequency</TableHead>
                <TableHead className="whitespace-nowrap">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredPrescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-8">
                    <EmptyState
                      icon={Pill}
                      title="No prescriptions found"
                      description={
                        search
                          ? "No prescriptions match your search criteria."
                          : "No prescriptions have been issued yet."
                      }
                      actionLabel={search ? "Clear Search" : "Issue First Prescription"}
                      onAction={() => {
                        if (search) setSearch("");
                        else setDialogOpen(true);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrescriptions.map((rx) => (
                  <TableRow key={rx.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs">{new Date(rx.createdAt || rx.issuedDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {rx.patient?.user ? `${rx.patient.user.firstName} ${rx.patient.user.lastName}` : `Patient #${rx.patientId || "—"}`}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">{rx.medication || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{rx.dosage || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{rx.frequency || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{rx.duration || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Create Prescription</DialogTitle>
          <DialogDescription>Issue a new prescription for a patient.</DialogDescription>
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
              <Label htmlFor="medication">Medication</Label>
              <Input id="medication" value={medication} onChange={(e) => setMedication(e.target.value)} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input id="dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="10mg" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Input id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="Twice daily" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="7 days" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Prescription"}</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
