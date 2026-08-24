"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus } from "lucide-react";

export default function DoctorAdmissions() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/admissions/me");
      setAdmissions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      try {
        const fallbackRes = await api.get("/admissions");
        setAdmissions(Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
      } catch {
        setAdmissions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const numericPatientId = !isNaN(Number(patientId)) ? Number(patientId) : patientId;
      await api.post("/admissions", { patientId: numericPatientId, reason, notes });
      setDialogOpen(false);
      setPatientId(""); setReason(""); setNotes("");
      fetchData();
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
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to discharge.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "admitted": return <Badge variant="default">Admitted</Badge>;
      case "discharged": return <Badge variant="success">Discharged</Badge>;
      case "transferred": return <Badge variant="warning">Transferred</Badge>;
      default: return <Badge variant="outline">{status || "—"}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading admissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admissions</h1>
          <p className="text-muted-foreground">Manage patient admissions and discharges.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Admit Patient
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissions.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No admissions found.</TableCell></TableRow>
              ) : (
                admissions.map((adm) => (
                  <TableRow key={adm.id}>
                    <TableCell>{new Date(adm.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{adm.patient?.user ? `${adm.patient.user.firstName} ${adm.patient.user.lastName}` : "—"}</TableCell>
                    <TableCell>{adm.reason || "—"}</TableCell>
                    <TableCell>{getStatusBadge(adm.status)}</TableCell>
                    <TableCell>
                      {adm.status?.toLowerCase() === "admitted" && (
                        <Button size="sm" variant="outline" onClick={() => handleDischarge(adm.id)}>Discharge</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Admit Patient</DialogTitle>
          <DialogDescription>Create a new patient admission record.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID</Label>
              <Input id="patientId" value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="e.g. 1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Admission</Label>
              <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
