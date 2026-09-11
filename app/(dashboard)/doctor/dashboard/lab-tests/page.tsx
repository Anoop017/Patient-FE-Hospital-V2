"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, FileDown, Search, FlaskConical } from "lucide-react";
import { downloadReport } from "@/lib/reports";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMRN, formatLabOrderRef, formatDate } from "@/lib/formatters";

export default function DoctorLabTests() {
  const [tests, setTests] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState("");
  const [testName, setTestName] = useState("");
  const [testType, setTestType] = useState("Blood Test");

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
      const res = await api.get("/laboratory/me");
      const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      setTests(list);
    } catch (error) {
      try {
        const fallbackRes = await api.get("/laboratory");
        const list = Array.isArray(fallbackRes.data) ? fallbackRes.data : Array.isArray(fallbackRes.data?.data) ? fallbackRes.data.data : [];
        setTests(list);
      } catch {
        setTests([]);
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
        testName,
        testType: testType || "General",
        status: "pending",
      };

      await api.post("/laboratory", payload);
      setDialogOpen(false);
      setPatientId(""); setTestName(""); setTestType("Blood Test");
      toast.success("Lab Test Ordered", `Diagnostic test order for ${testName} created.`);
      fetchData();
    } catch (error: any) {
      toast.error("Order Failed", error.response?.data?.message || "Failed to order lab test.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTests = tests.filter((t) => {
    const pName = `${t.patient?.user?.firstName || ""} ${t.patient?.user?.lastName || ""}`.toLowerCase();
    const tName = (t.testName || t.name || "").toLowerCase();
    return pName.includes(search.toLowerCase()) || tName.includes(search.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return <Badge variant="success">Completed</Badge>;
      case "pending": return <Badge variant="warning">Pending</Badge>;
      case "in_progress": return <Badge variant="default">In Progress</Badge>;
      default: return <Badge variant="outline">{status || "—"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lab Tests</h1>
          <p className="text-muted-foreground">Order and monitor clinical laboratory diagnostics.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto cursor-pointer">
          <Plus className="mr-2 h-4 w-4" /> Order Lab Test
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by patient or test name..."
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
                <TableHead className="whitespace-nowrap">Accession #</TableHead>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Patient</TableHead>
                <TableHead className="whitespace-nowrap">Test Name</TableHead>
                <TableHead className="whitespace-nowrap">Test Type</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap">Result</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredTests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-8">
                    <EmptyState
                      icon={FlaskConical}
                      title="No lab tests found"
                      description={
                        search
                          ? "No diagnostic tests match your search query."
                          : "No laboratory tests have been ordered yet."
                      }
                      actionLabel={search ? "Clear Search" : "Order First Test"}
                      onAction={() => {
                        if (search) setSearch("");
                        else setDialogOpen(true);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredTests.map((test) => (
                  <TableRow key={test.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[11px] bg-muted/40">
                        {formatLabOrderRef(test.id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{formatDate(test.createdAt || test.testDate)}</TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {test.patient?.user ? (
                        <span>
                          {test.patient.user.firstName} {test.patient.user.lastName}
                          <span className="text-[11px] text-muted-foreground ml-1.5 font-mono">({formatMRN(test.patientId)})</span>
                        </span>
                      ) : (
                        formatMRN(test.patientId)
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">{test.testName || test.name || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{test.testType || "General"}</TableCell>
                    <TableCell>{getStatusBadge(test.status)}</TableCell>
                    <TableCell className="text-xs font-medium">{test.result || "Pending Analysis"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadReport("lab", test.id)}
                        className="h-7 px-2 text-xs cursor-pointer hover:border-primary/50"
                        title="Download Official PDF Report"
                      >
                        <FileDown className="mr-1 h-3.5 w-3.5 text-primary" /> PDF
                      </Button>
                    </TableCell>
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
        ) : filteredTests.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              icon={FlaskConical}
              title="No lab tests found"
              description={search ? "No matches found." : "No lab tests ordered yet."}
              actionLabel={search ? "Clear Search" : "Order First Test"}
              onAction={() => {
                if (search) setSearch("");
                else setDialogOpen(true);
              }}
            />
          </Card>
        ) : (
          filteredTests.map((test) => (
            <Card key={test.id} className="p-4 space-y-3 shadow-xs border-border/70 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="font-mono text-xs bg-muted/50">
                  {formatLabOrderRef(test.id)}
                </Badge>
                {getStatusBadge(test.status)}
              </div>

              <div>
                <div className="font-semibold text-foreground text-sm">
                  {test.testName || test.name || "Laboratory Test"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Type: <span className="font-medium text-foreground">{test.testType || "General"}</span>
                </div>
              </div>

              <div className="text-xs p-2.5 rounded-lg bg-muted/30 border border-border/50 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-medium text-foreground">
                    {test.patient?.user
                      ? `${test.patient.user.firstName} ${test.patient.user.lastName}`
                      : formatMRN(test.patientId)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">MRN:</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{formatMRN(test.patientId)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-mono text-[11px]">{formatDate(test.createdAt || test.testDate)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border/40 pt-1 mt-1">
                  <span className="text-muted-foreground">Result:</span>
                  <span className="font-medium text-primary text-[11px]">{test.result || "Pending Analysis"}</span>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadReport("lab", test.id)}
                className="w-full h-8 text-xs cursor-pointer flex items-center justify-center gap-1.5 hover:border-primary/50"
              >
                <FileDown className="h-3.5 w-3.5 text-primary" /> Download Lab Report
              </Button>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Order Lab Test</DialogTitle>
          <DialogDescription>Order a new laboratory test for a patient.</DialogDescription>
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
              <Label htmlFor="testName">Test Name</Label>
              <Input id="testName" value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="Complete Blood Count" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testType">Test Type</Label>
              <Select
                id="testType"
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                required
              >
                <option value="Blood Test">Blood Test</option>
                <option value="Urine Test">Urine Test</option>
                <option value="Imaging / X-Ray / CT">Imaging / X-Ray / CT</option>
                <option value="Biochemistry">Biochemistry</option>
                <option value="Microbiology">Microbiology</option>
                <option value="Pathology">Pathology</option>
                <option value="General">General</option>
              </Select>
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
