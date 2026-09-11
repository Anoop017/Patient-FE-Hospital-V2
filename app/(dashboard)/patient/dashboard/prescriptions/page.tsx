"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Search, Pill, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrescriptionRef, formatDate } from "@/lib/formatters";

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
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search medication..."
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
          {prescriptions.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 px-4">
              <Pill className="mx-auto h-8 w-8 mb-2 opacity-40" />
              <p className="font-medium text-foreground">No prescriptions found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery ? "Try a different search keyword." : "You do not have any issued prescriptions yet."}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP PRESCRIPTIONS TABLE */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Rx #</TableHead>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">Medication</TableHead>
                      <TableHead className="whitespace-nowrap">Dosage</TableHead>
                      <TableHead className="whitespace-nowrap">Frequency</TableHead>
                      <TableHead className="whitespace-nowrap">Duration</TableHead>
                      <TableHead className="whitespace-nowrap">Prescribed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prescriptions.map((rx) => (
                      <TableRow key={rx.id}>
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {formatPrescriptionRef(rx.id)}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(rx.createdAt)}</TableCell>
                        <TableCell className="font-semibold text-foreground">{rx.medication || rx.medicineName || "—"}</TableCell>
                        <TableCell className="text-sm">{rx.dosage || "—"}</TableCell>
                        <TableCell className="text-sm">{rx.frequency || "—"}</TableCell>
                        <TableCell className="text-sm">{rx.duration || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {rx.doctor?.user ? `Dr. ${rx.doctor.user.firstName} ${rx.doctor.user.lastName}` : (rx.doctorName || "—")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* MOBILE PRESCRIPTIONS CARDS */}
              <div className="block md:hidden divide-y divide-border/60">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-primary">
                          {formatPrescriptionRef(rx.id)}
                        </span>
                        <h4 className="text-sm font-bold text-foreground mt-0.5">
                          {rx.medication || rx.medicineName || "Prescription"}
                        </h4>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        Active Rx
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Dosage</span>
                        <span className="font-medium text-foreground">{rx.dosage || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Frequency</span>
                        <span className="font-medium text-foreground">{rx.frequency || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Duration</span>
                        <span className="font-medium text-foreground">{rx.duration || "—"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                      <span>Prescribed: {formatDate(rx.createdAt)}</span>
                      <span className="font-medium text-foreground">
                        {rx.doctor?.user ? `Dr. ${rx.doctor.user.firstName} ${rx.doctor.user.lastName}` : (rx.doctorName || "Staff")}
                      </span>
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
