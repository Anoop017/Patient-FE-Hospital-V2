"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FlaskConical, RefreshCw } from "lucide-react";

export default function PatientLabTests() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
      <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg w-fit">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
            statusFilter === "all"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({tests.length})
        </button>
        <button
          onClick={() => setStatusFilter("completed")}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
            statusFilter === "completed"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Completed ({tests.filter((t) => t.status?.toLowerCase() === "completed").length})
        </button>
        <button
          onClick={() => setStatusFilter("pending")}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
            statusFilter === "pending"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending ({tests.filter((t) => t.status?.toLowerCase() === "pending" || t.status?.toLowerCase() === "in_progress").length})
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Date</TableHead>
                <TableHead>Test Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result / Findings</TableHead>
                <TableHead>Ordered By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    <FlaskConical className="mx-auto h-8 w-8 mb-2 opacity-40" />
                    <p className="font-medium">No lab tests found</p>
                    <p className="text-xs">Ordered laboratory test reports will appear here.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>
                      {test.testDate
                        ? new Date(test.testDate).toLocaleDateString()
                        : (test.createdAt ? new Date(test.createdAt).toLocaleDateString() : "—")}
                    </TableCell>
                    <TableCell className="font-medium">{test.testName || test.name || "—"}</TableCell>
                    <TableCell>{getStatusBadge(test.status)}</TableCell>
                    <TableCell className="max-w-[240px] truncate">
                      {test.result ? (
                        <span className="font-medium text-foreground">{test.result}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">Awaiting lab results</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {test.doctor?.user ? `Dr. ${test.doctor.user.firstName} ${test.doctor.user.lastName}` : (test.doctorName || "—")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
