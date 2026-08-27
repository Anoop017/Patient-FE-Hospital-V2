"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Search, FileText, RefreshCw } from "lucide-react";

export default function PatientMedicalRecords() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async (search = "") => {
    try {
      setRefreshing(true);
      const endpoint = search
        ? `/medical-records/me?search=${encodeURIComponent(search)}`
        : "/medical-records/me";
      const res = await api.get(endpoint).catch(() => ({ data: [] }));
      const data = Array.isArray(res?.data)
        ? res.data
        : (Array.isArray(res?.data?.data) ? res.data.data : []);
      setRecords(data);
    } catch (error) {
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords(searchQuery);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3 text-muted-foreground">
        <RefreshCw className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm">Loading medical records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Medical Records</h1>
          <p className="text-muted-foreground">View your medical diagnosis history, doctor notes, and treatment plans.</p>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search diagnosis or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-sm h-9 w-full"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="shrink-0">
            Search
          </Button>
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Diagnosis</TableHead>
                <TableHead className="whitespace-nowrap">Treatment</TableHead>
                <TableHead className="whitespace-nowrap">Doctor</TableHead>
                <TableHead className="whitespace-nowrap">Clinical Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    <FileText className="mx-auto h-8 w-8 mb-2 opacity-40" />
                    <p className="font-medium">No medical records found</p>
                    <p className="text-xs">{searchQuery ? "Try refining your search keyword." : "Your clinical records will appear here after medical visits."}</p>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{record.diagnosis || "—"}</TableCell>
                    <TableCell>{record.treatment || "—"}</TableCell>
                    <TableCell>
                      {record.doctor?.user ? `Dr. ${record.doctor.user.firstName} ${record.doctor.user.lastName}` : (record.doctorName || "—")}
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate">{record.notes || "—"}</TableCell>
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
