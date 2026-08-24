"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus } from "lucide-react";

export default function DoctorLabTests() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [testName, setTestName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/laboratory/me");
      setTests(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      try {
        const fallbackRes = await api.get("/laboratory");
        setTests(Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
      } catch {
        setTests([]);
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
      await api.post("/laboratory", { patientId: numericPatientId, testName, notes });
      setDialogOpen(false);
      setPatientId(""); setTestName(""); setNotes("");
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to order lab test.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return <Badge variant="success">Completed</Badge>;
      case "pending": return <Badge variant="warning">Pending</Badge>;
      case "in_progress": return <Badge variant="default">In Progress</Badge>;
      default: return <Badge variant="outline">{status || "—"}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading lab tests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lab Tests</h1>
          <p className="text-muted-foreground">Order and manage laboratory tests.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Order Lab Test
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Test Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No lab tests found.</TableCell></TableRow>
              ) : (
                tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>{new Date(test.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{test.patient?.user ? `${test.patient.user.firstName} ${test.patient.user.lastName}` : "—"}</TableCell>
                    <TableCell className="font-medium">{test.testName || test.name || "—"}</TableCell>
                    <TableCell>{getStatusBadge(test.status)}</TableCell>
                    <TableCell>{test.result || "Pending"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Order Lab Test</DialogTitle>
          <DialogDescription>Order a new laboratory test for a patient.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID</Label>
              <Input id="patientId" value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="e.g. 1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testName">Test Name</Label>
              <Input id="testName" value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="Complete Blood Count" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Ordering..." : "Order Test"}</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
