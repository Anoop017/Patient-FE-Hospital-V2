"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus } from "lucide-react";

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/prescriptions/me");
      setPrescriptions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      try {
        const fallbackRes = await api.get("/prescriptions");
        setPrescriptions(Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
      } catch {
        setPrescriptions([]);
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
      await api.post("/prescriptions", { patientId: numericPatientId, medication, dosage, frequency, duration, notes });
      setDialogOpen(false);
      setPatientId(""); setMedication(""); setDosage(""); setFrequency(""); setDuration(""); setNotes("");
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create prescription.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading prescriptions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground">Create and manage patient prescriptions.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Prescription
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No prescriptions found.</TableCell></TableRow>
              ) : (
                prescriptions.map((rx) => (
                  <TableRow key={rx.id}>
                    <TableCell>{new Date(rx.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{rx.patient?.user ? `${rx.patient.user.firstName} ${rx.patient.user.lastName}` : "—"}</TableCell>
                    <TableCell className="font-medium">{rx.medication || "—"}</TableCell>
                    <TableCell>{rx.dosage || "—"}</TableCell>
                    <TableCell>{rx.frequency || "—"}</TableCell>
                    <TableCell>{rx.duration || "—"}</TableCell>
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
              <Label htmlFor="patientId">Patient ID</Label>
              <Input id="patientId" value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="e.g. 1" required />
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
