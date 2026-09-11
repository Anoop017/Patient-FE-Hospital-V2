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
import { Plus, Search, FileText } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatMRN, formatDate } from "@/lib/formatters";

export default function StaffMedicalRecords() {
  const [records, setRecords] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [patientId, setPatientId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
    fetchPatients();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/medical-records").catch(() => ({ data: [] }));
      const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      setRecords(list);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get("/patients?take=100").catch(() => ({ data: [] }));
      const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      setPatients(list);
    } catch (error) {
      console.error("Failed to load patients", error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const numericPatientId = !isNaN(Number(patientId)) ? Number(patientId) : patientId;
      await api.post("/medical-records", { patientId: numericPatientId, diagnosis, symptoms, treatment, notes });
      setDialogOpen(false);
      setPatientId(""); setDiagnosis(""); setSymptoms(""); setTreatment(""); setNotes("");
      toast.success("Medical Record Created", "Successfully recorded clinical encounter.");
      fetchData();
    } catch (error: any) {
      toast.error("Creation Failed", error.response?.data?.message || "Failed to create record.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const pName = `${r.patient?.user?.firstName || ""} ${r.patient?.user?.lastName || ""}`.toLowerCase();
    const diag = (r.diagnosis || "").toLowerCase();
    const sym = (r.symptoms || "").toLowerCase();
    return pName.includes(search.toLowerCase()) || diag.includes(search.toLowerCase()) || sym.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medical Records</h1>
          <p className="text-muted-foreground">Comprehensive institutional archive of patient clinical records.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto cursor-pointer">
          <Plus className="mr-2 h-4 w-4" /> New Record
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by patient, diagnosis, or symptom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Patient</TableHead>
                <TableHead className="whitespace-nowrap">Diagnosis</TableHead>
                <TableHead className="whitespace-nowrap">Symptoms</TableHead>
                <TableHead className="whitespace-nowrap">Treatment</TableHead>
                <TableHead className="whitespace-nowrap">Clinical Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  </TableRow>
                ))
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-8">
                    <EmptyState
                      icon={FileText}
                      title="No medical records found"
                      description={
                        search
                          ? "No medical records match your search criteria."
                          : "No medical records have been created in the hospital system."
                      }
                      actionLabel={search ? "Clear Search" : "Create First Record"}
                      onAction={() => {
                        if (search) setSearch("");
                        else setDialogOpen(true);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs">{formatDate(r.createdAt || r.recordDate)}</TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {r.patient?.user ? (
                        <span>
                          {r.patient.user.firstName} {r.patient.user.lastName}
                          <span className="text-[11px] text-muted-foreground ml-1.5 font-mono">({formatMRN(r.patientId)})</span>
                        </span>
                      ) : (
                        formatMRN(r.patientId)
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{r.diagnosis || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{r.symptoms || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{r.treatment || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs">{r.notes || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="p-4">
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-40 mb-3" />
              <Skeleton className="h-8 w-full" />
            </Card>
          ))
        ) : filteredRecords.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              icon={FileText}
              title="No medical records found"
              description={search ? "No matches found." : "No records created yet."}
              actionLabel={search ? "Clear Search" : "Create First Record"}
              onAction={() => {
                if (search) setSearch("");
                else setDialogOpen(true);
              }}
            />
          </Card>
        ) : (
          filteredRecords.map((r) => (
            <Card key={r.id} className="p-4 space-y-3 shadow-xs border-border/70 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground text-sm">
                  📋 {r.diagnosis || "Clinical Record"}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatDate(r.createdAt || r.recordDate)}
                </span>
              </div>

              <div>
                <div className="font-medium text-foreground text-xs">
                  {r.patient?.user
                    ? `${r.patient.user.firstName} ${r.patient.user.lastName}`
                    : formatMRN(r.patientId)}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {formatMRN(r.patientId)}
                </div>
              </div>

              <div className="text-xs p-2.5 rounded-lg bg-muted/30 border border-border/50 space-y-1.5">
                <div>
                  <span className="text-muted-foreground font-medium">Symptoms: </span>
                  <span className="text-foreground">{r.symptoms || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Treatment: </span>
                  <span className="text-foreground">{r.treatment || "—"}</span>
                </div>
                {r.notes && (
                  <div className="border-t border-border/40 pt-1 text-muted-foreground italic">
                    {r.notes}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Create Medical Record</DialogTitle>
          <DialogDescription>Enter clinical details for the patient.</DialogDescription>
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
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input id="diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symptoms">Symptoms</Label>
              <Input id="symptoms" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="treatment">Treatment</Label>
              <Textarea id="treatment" value={treatment} onChange={(e) => setTreatment(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Record"}</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
