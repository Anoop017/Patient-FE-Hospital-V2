"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Search, FileText, RefreshCw, Stethoscope, Clock } from "lucide-react";
import { formatDate } from "@/lib/formatters";

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
          {records.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 px-4">
              <FileText className="mx-auto h-8 w-8 mb-2 opacity-40" />
              <p className="font-medium text-foreground">No medical records found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery ? "Try refining your search keyword." : "Your clinical records will appear here after medical visits."}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP RECORDS TABLE */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">Diagnosis</TableHead>
                      <TableHead className="whitespace-nowrap">Treatment</TableHead>
                      <TableHead className="whitespace-nowrap">Attending Doctor</TableHead>
                      <TableHead className="whitespace-nowrap">Clinical Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="text-sm font-medium">{formatDate(record.createdAt)}</TableCell>
                        <TableCell className="font-semibold text-foreground">{record.diagnosis || "—"}</TableCell>
                        <TableCell className="text-sm">{record.treatment || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {record.doctor?.user ? `Dr. ${record.doctor.user.firstName} ${record.doctor.user.lastName}` : (record.doctorName || "—")}
                        </TableCell>
                        <TableCell className="max-w-[240px] truncate text-xs text-muted-foreground">{record.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* MOBILE RECORDS CARDS */}
              <div className="block md:hidden divide-y divide-border/60">
                {records.map((record) => (
                  <div key={record.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-foreground">
                        {record.diagnosis || "General Clinical Diagnosis"}
                      </h4>
                      <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                        {formatDate(record.createdAt)}
                      </span>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5 space-y-1.5 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Prescribed Treatment</span>
                        <p className="font-medium text-foreground">{record.treatment || "Standard clinical care"}</p>
                      </div>
                      {record.notes && (
                        <div className="pt-1 border-t border-border/40">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Clinical Notes</span>
                          <p className="text-muted-foreground text-[11px]">{record.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                      <Stethoscope className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Attending: </span>
                      <strong className="text-foreground">
                        {record.doctor?.user ? `Dr. ${record.doctor.user.firstName} ${record.doctor.user.lastName}` : (record.doctorName || "Attending Physician")}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
