"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FlaskConical, RefreshCw, FileDown, Eye, FileText } from "lucide-react";
import { downloadReport } from "@/lib/reports";

export default function PatientLabTests() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTest, setSelectedTest] = useState<any | null>(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setRefreshing(true);
      const res = await api.get("/laboratory/me").catch(() => api.get("/lab-tests/me"));
      const data = Array.isArray(res?.data)
        ? res.data
        : (Array.isArray(res?.data?.data) ? res.data.data : []);
      setTests(data);
    } catch (error) {
      setTests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return (
          <Badge variant="success" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="warning" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Pending
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="default" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            In Progress
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || "—"}</Badge>;
    }
  };

  const filteredTests = tests.filter((t) => {
    if (statusFilter === "all") return true;
    return t.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3 text-muted-foreground">
        <RefreshCw className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm">Loading lab tests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Lab Tests</h1>
          <p className="text-muted-foreground">View your laboratory orders, sample status, and clinical test reports.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTests}
          disabled={refreshing}
          className="flex items-center gap-1.5 w-fit"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg w-full sm:w-fit overflow-x-auto no-scrollbar">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer shrink-0 ${
            statusFilter === "all"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({tests.length})
        </button>
        <button
          onClick={() => setStatusFilter("completed")}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer shrink-0 ${
            statusFilter === "completed"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Completed ({tests.filter((t) => t.status?.toLowerCase() === "completed").length})
        </button>
        <button
          onClick={() => setStatusFilter("pending")}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer shrink-0 ${
            statusFilter === "pending"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending ({tests.filter((t) => t.status?.toLowerCase() === "pending").length})
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Test Name</TableHead>
                <TableHead className="whitespace-nowrap">Category</TableHead>
                <TableHead className="whitespace-nowrap">Doctor</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right whitespace-nowrap">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    <FlaskConical className="mx-auto h-8 w-8 mb-2 opacity-40" />
                    <p className="font-medium">No lab tests found</p>
                    <p className="text-xs">Ordered laboratory test reports will appear here.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="text-sm">
                      {test.testDate
                        ? new Date(test.testDate).toLocaleDateString()
                        : (test.createdAt ? new Date(test.createdAt).toLocaleDateString() : "—")}
                    </TableCell>
                    <TableCell className="font-medium">{test.testName || test.name || "—"}</TableCell>
                    <TableCell className="text-sm">{test.testType || test.category || "General"}</TableCell>
                    <TableCell className="text-sm">
                      {test.doctor?.user ? `Dr. ${test.doctor.user.firstName} ${test.doctor.user.lastName}` : (test.doctorName || "—")}
                    </TableCell>
                    <TableCell>{getStatusBadge(test.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReport("lab", test.id)}
                          title="Download Lab Report PDF"
                          className="h-8 text-xs flex items-center gap-1 text-primary hover:bg-primary/10 border-primary/30"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          PDF
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTest(test)}
                          className="h-8 text-xs flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lab Test Details Dialog */}
      <Dialog open={!!selectedTest} onOpenChange={(open) => !open && setSelectedTest(null)}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              {selectedTest?.testName || selectedTest?.name || "Lab Test Details"}
            </DialogTitle>
            {selectedTest && getStatusBadge(selectedTest.status)}
          </div>
          <DialogDescription>
            Clinical lab order and results summary.
          </DialogDescription>
        </DialogHeader>

        {selectedTest && (
          <div className="space-y-4 pt-2 text-sm">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 text-xs">
              <div>
                <span className="text-muted-foreground block">Order Date:</span>
                <span className="font-semibold text-foreground">
                  {selectedTest.testDate ? new Date(selectedTest.testDate).toLocaleDateString() : (selectedTest.createdAt ? new Date(selectedTest.createdAt).toLocaleDateString() : "—")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Category / Type:</span>
                <span className="font-semibold text-foreground">{selectedTest.testType || selectedTest.category || "General Laboratory"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Ordered By:</span>
                <span className="font-semibold text-foreground">
                  {selectedTest.doctor?.user ? `Dr. ${selectedTest.doctor.user.firstName} ${selectedTest.doctor.user.lastName}` : (selectedTest.doctorName || "Staff")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Lab Test ID:</span>
                <span className="font-mono font-semibold text-foreground">#{selectedTest.id}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Findings & Clinical Results</span>
              <div className="p-3 rounded-md border border-border bg-card">
                {selectedTest.result ? (
                  <p className="whitespace-pre-wrap text-foreground font-mono text-xs">{selectedTest.result}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Test sample is being processed by the laboratory. Official findings will be posted upon completion.</p>
                )}
              </div>
            </div>

            {selectedTest.notes && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Clinical Notes:</span>
                <p className="text-xs text-muted-foreground">{selectedTest.notes}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4 sm:justify-between">
          {selectedTest && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadReport("lab", selectedTest.id)}
              className="flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
            >
              <FileDown className="h-4 w-4" />
              Download Lab Report PDF
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedTest(null)}
          >
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
