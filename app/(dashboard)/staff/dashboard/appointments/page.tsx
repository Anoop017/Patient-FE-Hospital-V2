"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Calendar, Clock, User, Stethoscope } from "lucide-react";
import { formatAppointmentRef, formatDateTime } from "@/lib/formatters";

export default function StaffAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/appointments").catch(() => ({ data: [] }));
        const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
        setAppointments(data);
      } catch (error) {
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "scheduled": return <Badge variant="default">Scheduled</Badge>;
      case "completed": return <Badge variant="success">Completed</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      case "no_show": return <Badge variant="warning">No Show</Badge>;
      default: return <Badge variant="outline">{status || "—"}</Badge>;
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const q = search.toLowerCase().trim();
      const pName = `${appt.patient?.user?.firstName || ""} ${appt.patient?.user?.lastName || ""}`.toLowerCase();
      const dName = `${appt.doctor?.user?.firstName || ""} ${appt.doctor?.user?.lastName || ""}`.toLowerCase();
      const reason = (appt.reason || "").toLowerCase();
      const ref = formatAppointmentRef(appt.id).toLowerCase();

      const matchesSearch = !q || pName.includes(q) || dName.includes(q) || reason.includes(q) || ref.includes(q);
      const matchesStatus = statusFilter === "all" || appt.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospital Appointments</h1>
          <p className="text-muted-foreground">Master appointment log across all departments and medical practitioners.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient, doctor, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {["all", "scheduled", "completed", "cancelled", "no_show"].map((st) => (
          <Button
            key={st}
            size="sm"
            variant={statusFilter === st ? "default" : "outline"}
            onClick={() => setStatusFilter(st)}
            className="h-8 text-xs capitalize cursor-pointer shrink-0"
          >
            {st.replace("_", " ")}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Calendar}
                title="No appointments found"
                description={
                  search || statusFilter !== "all"
                    ? "No appointments matched your search and filter criteria."
                    : "No hospital consultations have been logged yet."
                }
                actionLabel={search || statusFilter !== "all" ? "Clear Filters" : undefined}
                onAction={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              />
            </div>
          ) : (
            <>
              {/* DESKTOP APPOINTMENTS TABLE */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Encounter Ref</TableHead>
                      <TableHead className="whitespace-nowrap">Consultation Time</TableHead>
                      <TableHead className="whitespace-nowrap">Patient</TableHead>
                      <TableHead className="whitespace-nowrap">Attending Doctor</TableHead>
                      <TableHead className="whitespace-nowrap">Reason</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appt) => (
                      <TableRow key={appt.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {formatAppointmentRef(appt.id)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatDateTime(appt.appointmentDate)}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {appt.patient?.user ? `${appt.patient.user.firstName} ${appt.patient.user.lastName}` : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {appt.doctor?.user ? `Dr. ${appt.doctor.user.firstName} ${appt.doctor.user.lastName}` : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{appt.reason || "General Consultation"}</TableCell>
                        <TableCell>{getStatusBadge(appt.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* MOBILE APPOINTMENTS CARDS */}
              <div className="block md:hidden divide-y divide-border/60">
                {filteredAppointments.map((appt) => {
                  const patName = appt.patient?.user
                    ? `${appt.patient.user.firstName} ${appt.patient.user.lastName}`
                    : "Patient";
                  const docName = appt.doctor?.user
                    ? `Dr. ${appt.doctor.user.firstName} ${appt.doctor.user.lastName}`
                    : "Doctor";

                  return (
                    <div key={appt.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-primary">
                            {formatAppointmentRef(appt.id)}
                          </span>
                          <h4 className="text-sm font-semibold text-foreground mt-0.5">
                            {patName}
                          </h4>
                        </div>
                        <div className="shrink-0">
                          {getStatusBadge(appt.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Attending Doctor</span>
                          <span className="font-medium text-foreground">{docName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Scheduled Time</span>
                          <span className="font-medium text-foreground">{formatDateTime(appt.appointmentDate)}</span>
                        </div>
                        {appt.reason && (
                          <div className="col-span-2 pt-1 border-t border-border/40">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Reason</span>
                            <span className="text-foreground">{appt.reason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
