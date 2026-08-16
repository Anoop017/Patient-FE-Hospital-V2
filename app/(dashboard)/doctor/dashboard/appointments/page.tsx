"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Check, X, CheckCircle } from "lucide-react";

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    try {
      await api.patch(`/appointments/${id}`, { status });
      fetchAppointments();
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      alert(error.response?.data?.message || "Failed to update appointment.");
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

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading appointments...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
        <p className="text-muted-foreground">Manage your patient appointments — accept, complete, or cancel.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No appointments found.
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell>{new Date(appt.appointmentDate).toLocaleString()}</TableCell>
                    <TableCell>
                      {appt.patient?.user?.firstName} {appt.patient?.user?.lastName}
                    </TableCell>
                    <TableCell>{appt.reason || "—"}</TableCell>
                    <TableCell>{getStatusBadge(appt.status)}</TableCell>
                    <TableCell>
                      {appt.status?.toLowerCase() === "scheduled" && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateStatus(appt.id, "completed")} title="Complete">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(appt.id, "cancelled")} title="Cancel">
                            <X className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(appt.id, "no_show")} title="No Show">
                            No Show
                          </Button>
                        </div>
                      )}
                      {appt.status?.toLowerCase() !== "scheduled" && (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
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
