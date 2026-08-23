"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Search, Pill, RefreshCw } from "lucide-react";

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async (search = "") => {
    try {
      setRefreshing(true);
      const endpoint = search
        ? `/prescriptions/me?search=${encodeURIComponent(search)}`
        : "/prescriptions/me";
      const res = await api.get(endpoint).catch(() => ({ data: [] }));
      const data = Array.isArray(res?.data)
        ? res.data
        : (Array.isArray(res?.data?.data) ? res.data.data : []);
      setPrescriptions(data);
    } catch (error) {
      setPrescriptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrescriptions(searchQuery);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3 text-muted-foreground">
        <RefreshCw className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm">Loading prescriptions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Prescriptions</h1>
          <p className="text-muted-foreground">View all medications and prescriptions issued to you by doctors.</p>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search medication..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-sm h-9"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Prescribed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    <Pill className="mx-auto h-8 w-8 mb-2 opacity-40" />
                    <p className="font-medium">No prescriptions found</p>
                    <p className="text-xs">{searchQuery ? "Try a different search keyword." : "You do not have any issued prescriptions yet."}</p>
                  </TableCell>
                </TableRow>
              ) : (
                prescriptions.map((rx) => (
                  <TableRow key={rx.id}>
                    <TableCell>{new Date(rx.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{rx.medication || rx.medicineName || "—"}</TableCell>
                    <TableCell>{rx.dosage || "—"}</TableCell>
                    <TableCell>{rx.frequency || "—"}</TableCell>
                    <TableCell>{rx.duration || "—"}</TableCell>
                    <TableCell>
                      {rx.doctor?.user ? `Dr. ${rx.doctor.user.firstName} ${rx.doctor.user.lastName}` : (rx.doctorName || "—")}
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
