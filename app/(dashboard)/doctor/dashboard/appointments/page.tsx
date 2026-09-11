"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Check, X, CheckCircle, Search, Calendar, RefreshCw, UserCheck } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatAppointmentRef, formatDateTime } from "@/lib/formatters";

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/appointments/me");
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      try {
        const res = await api.get("/appointments");
        setAppointments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching appointments:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/appointments/${id}`, { status });
      toast.success(
        "Appointment Updated",
        `Marked as ${status === "completed" ? "Completed" : status === "cancelled" ? "Cancelled" : "No Show"}`
      );
      fetchAppointments();
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast.error("Update Failed", error.response?.data?.message || "Failed to update appointment status.");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "scheduled": return <Badge variant="default">Scheduled</Badge>;
      case "completed": return <Badge variant="success">Completed</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      case "no_show": return <Badge variant="warning">No Show</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const pName = `${appt.patient?.user?.firstName || ""} ${appt.patient?.user?.lastName || ""}`.toLowerCase();
      const reason = (appt.reason || "").toLowerCase();
      const matchesSearch = pName.includes(search.toLowerCase()) || reason.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || appt.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-muted-foreground">Manage and conduct your scheduled patient consultations.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            fetchAppointments();
          }}
          className="self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient name or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
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
                    ? "No appointments matched your current search and filter criteria."
                    : "You have no appointments scheduled at this time."
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
                      <TableHead className="whitespace-nowrap">Date & Time</TableHead>
                      <TableHead className="whitespace-nowrap">Patient</TableHead>
                      <TableHead className="whitespace-nowrap">Reason</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appt) => {
                      const isScheduled = appt.status?.toLowerCase() === "scheduled";
                      const isActing = actionLoading === appt.id;

                      return (
                        <TableRow key={appt.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-mono text-xs font-semibold text-primary">
                            {formatAppointmentRef(appt.id)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {formatDateTime(appt.appointmentDate)}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {appt.patient?.user?.firstName || "Patient"} {appt.patient?.user?.lastName || ""}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{appt.reason || "General Consultation"}</TableCell>
                          <TableCell>{getStatusBadge(appt.status)}</TableCell>
                          <TableCell className="text-right">
                            {isScheduled ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatus(appt.id, "completed")}
                                  disabled={isActing}
                                  className="h-7 px-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-500/30 cursor-pointer"
                                  title="Mark as Completed"
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatus(appt.id, "cancelled")}
                                  disabled={isActing}
                                  className="h-7 px-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-500/30 cursor-pointer"
                                  title="Cancel Appointment"
                                >
                                  <X className="h-3.5 w-3.5 mr-1" /> Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateStatus(appt.id, "no_show")}
                                  disabled={isActing}
                                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="Mark as No Show"
                                >
                                  No Show
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Finished</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* MOBILE APPOINTMENTS CARDS */}
              <div className="block md:hidden divide-y divide-border/60">
                {filteredAppointments.map((appt) => {
                  const isScheduled = appt.status?.toLowerCase() === "scheduled";
                  const isActing = actionLoading === appt.id;
                  const patName = `${appt.patient?.user?.firstName || ""} ${appt.patient?.user?.lastName || ""}`.trim() || "Patient";
                  const patInitial = appt.patient?.user?.firstName?.[0] || "P";

                  return (
                    <div key={appt.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                            {patInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{patName}</p>
                            <span className="font-mono text-xs text-primary font-bold">
                              {formatAppointmentRef(appt.id)}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {getStatusBadge(appt.status)}
                        </div>
                      </div>

                      <div className="rounded-lg bg-muted/40 p-2.5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                            <Calendar className="h-3.5 w-3.5" /> Consultation Time
                          </span>
                          <span className="font-medium text-foreground">{formatDateTime(appt.appointmentDate)}</span>
                        </div>
                        {appt.reason && (
                          <div className="pt-1 border-t border-border/40">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Reason</span>
                            <span className="text-foreground">{appt.reason}</span>
                          </div>
                        )}
                      </div>

                      {isScheduled && (
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(appt.id, "completed")}
                            disabled={isActing}
                            className="flex-1 h-8 text-xs font-semibold text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(appt.id, "cancelled")}
                            disabled={isActing}
                            className="flex-1 h-8 text-xs font-semibold text-rose-600 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Cancel
                          </Button>
                        </div>
                      )}
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
