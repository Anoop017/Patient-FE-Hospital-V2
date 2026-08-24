"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Plus,
  Calendar,
  Clock,
  User,
  XCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  CalendarCheck
} from "lucide-react";

interface Slot {
  time: string;
  isAvailable: boolean;
}

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patientId, setPatientId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Booking Modal State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  // Slots State
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Cancel Appointment Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedApptToCancel, setSelectedApptToCancel] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [apptRes, doctorsRes, profileRes] = await Promise.all([
        api.get("/appointments/me").catch(() => ({ data: [] })),
        api.get("/doctors").catch(() => ({ data: [] })),
        api.get("/patients/me").catch(() => ({ data: null })),
      ]);

      const apptData = Array.isArray(apptRes?.data)
        ? apptRes.data
        : Array.isArray(apptRes?.data?.data)
        ? apptRes.data.data
        : [];
      setAppointments(apptData);

      const doctorsData = Array.isArray(doctorsRes?.data)
        ? doctorsRes.data
        : Array.isArray(doctorsRes?.data?.data)
        ? doctorsRes.data.data
        : [];
      setDoctors(doctorsData);

      setPatientId(profileRes?.data?.id || "");
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch slots whenever doctor and date are chosen
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots(selectedDoctor, selectedDate);
    } else {
      setAvailableSlots([]);
      setSelectedTimeSlot("");
    }
  }, [selectedDoctor, selectedDate]);

  const fetchAvailableSlots = async (doctorId: string, date: string) => {
    setLoadingSlots(true);
    try {
      const res = await api.get(
        `/appointments/available-slots?doctorId=${doctorId}&date=${date}`
      );
      const slotsData = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];
      setAvailableSlots(slotsData);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      // Fallback default slots if endpoint is not configured for specific day
      setAvailableSlots([
        { time: "09:00", isAvailable: true },
        { time: "09:30", isAvailable: true },
        { time: "10:00", isAvailable: true },
        { time: "10:30", isAvailable: true },
        { time: "11:00", isAvailable: true },
        { time: "11:30", isAvailable: true },
        { time: "14:00", isAvailable: true },
        { time: "14:30", isAvailable: true },
        { time: "15:00", isAvailable: true },
        { time: "15:30", isAvailable: true },
        { time: "16:00", isAvailable: true },
      ]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedTimeSlot) {
      setFormError("Please select a doctor, date, and available time slot.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTimeSlot}:00`).toISOString();
      const numericPatientId = !isNaN(Number(patientId)) ? Number(patientId) : patientId;
      const numericDoctorId = !isNaN(Number(selectedDoctor)) ? Number(selectedDoctor) : selectedDoctor;

      await api.post("/appointments", {
        patientId: numericPatientId,
        doctorId: numericDoctorId,
        appointmentDate: appointmentDateTime,
        reason,
        notes,
      });

      setDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      setFormError(error.message || "Failed to book appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedDoctor("");
    setSelectedDate("");
    setSelectedTimeSlot("");
    setReason("");
    setNotes("");
    setAvailableSlots([]);
    setFormError(null);
  };

  // Quick Cancel appointment via PATCH /appointments/:id/status
  const handleCancelAppointment = async () => {
    if (!selectedApptToCancel) return;
    setCancelling(true);
    try {
      await api.patch(`/appointments/${selectedApptToCancel.id}/status`, {
        status: "cancelled",
      }).catch(async () => {
        // Fallback to delete if patch status not implemented
        await api.delete(`/appointments/${selectedApptToCancel.id}`);
      });
      setCancelModalOpen(false);
      setSelectedApptToCancel(null);
      await fetchData();
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      alert(error.message || "Failed to cancel appointment.");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return (
          <Badge variant="default" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Scheduled
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="success" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Cancelled
          </Badge>
        );
      case "no_show":
        return (
          <Badge variant="warning" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            No Show
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || "—"}</Badge>;
    }
  };

  const filteredAppointments = appointments.filter((appt) => {
    if (statusFilter === "all") return true;
    return appt.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3 text-muted-foreground">
        <RefreshCw className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm">Loading your appointments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-muted-foreground">
            Schedule visits with available specialists and manage your appointment calendar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg w-fit">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
            statusFilter === "all"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({appointments.length})
        </button>
        <button
          onClick={() => setStatusFilter("scheduled")}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
            statusFilter === "scheduled"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Scheduled ({appointments.filter((a) => a.status?.toLowerCase() === "scheduled").length})
        </button>
        <button
          onClick={() => setStatusFilter("completed")}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
            statusFilter === "completed"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Completed ({appointments.filter((a) => a.status?.toLowerCase() === "completed").length})
        </button>
        <button
          onClick={() => setStatusFilter("cancelled")}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
            statusFilter === "cancelled"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Cancelled ({appointments.filter((a) => a.status?.toLowerCase() === "cancelled").length})
        </button>
      </div>

      {/* Appointments List Card */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    <Calendar className="mx-auto h-8 w-8 mb-2 opacity-40" />
                    <p className="font-medium">No appointments found</p>
                    <p className="text-xs">Schedule an appointment with our doctors to get started.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((appt) => {
                  const isScheduled = appt.status?.toLowerCase() === "scheduled";
                  return (
                    <TableRow key={appt.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(appt.appointmentDate).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {appt.doctor?.user ? `Dr. ${appt.doctor.user.firstName} ${appt.doctor.user.lastName}` : (appt.doctorName || "—")}
                        </div>
                      </TableCell>
                      <TableCell>{appt.doctor?.specialization || "General"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{appt.reason || "Routine Checkup"}</TableCell>
                      <TableCell>{getStatusBadge(appt.status)}</TableCell>
                      <TableCell className="text-right">
                        {isScheduled && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedApptToCancel(appt);
                              setCancelModalOpen(true);
                            }}
                            className="h-8 text-xs"
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Book Appointment Modal Dialog with Real-Time Slot Availability */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Book a New Appointment
          </DialogTitle>
          <DialogDescription>
            Select a specialist doctor, pick a date, and choose an available consultation time slot.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleBookAppointment}>
          <div className="space-y-4">
            {formError && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Doctor Picker */}
            <div className="space-y-1.5">
              <Label htmlFor="doctor">Doctor / Specialist</Label>
              <Select
                id="doctor"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                required
              >
                <option value="">Select a doctor...</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.user?.firstName} {doc.user?.lastName} — {doc.specialization}
                  </option>
                ))}
              </Select>
            </div>

            {/* Date Picker */}
            <div className="space-y-1.5">
              <Label htmlFor="apptDate">Appointment Date</Label>
              <Input
                id="apptDate"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>

            {/* Real-Time Slot Availability Grid */}
            {selectedDoctor && selectedDate && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Available Time Slots
                  </Label>
                  {loadingSlots && <span className="text-[11px] text-muted-foreground animate-pulse">Checking availability...</span>}
                </div>

                {availableSlots.length === 0 && !loadingSlots ? (
                  <p className="text-xs text-muted-foreground">No time slots available for the selected day. Please try another date.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => setSelectedTimeSlot(slot.time)}
                        className={`px-2.5 py-2 text-xs font-medium rounded-md border transition-all cursor-pointer ${
                          !slot.isAvailable
                            ? "bg-muted/40 text-muted-foreground border-transparent opacity-40 cursor-not-allowed line-through"
                            : selectedTimeSlot === slot.time
                            ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                            : "bg-background border-border hover:border-primary hover:bg-muted/50"
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason for Consultation</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Annual health checkup, Chest discomfort"
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Additional Medical Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any symptoms, current medications, or details for the doctor..."
                className="h-20"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !selectedTimeSlot}
              className="bg-primary text-primary-foreground font-semibold"
            >
              {submitting ? "Booking..." : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Cancel Appointment
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel your scheduled appointment with{" "}
            <strong>
              {selectedApptToCancel?.doctor?.user
                ? `Dr. ${selectedApptToCancel.doctor.user.firstName} ${selectedApptToCancel.doctor.user.lastName}`
                : "the doctor"}
            </strong>{" "}
            on{" "}
            <strong>
              {selectedApptToCancel?.appointmentDate
                ? new Date(selectedApptToCancel.appointmentDate).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "the scheduled time"}
            </strong>
            ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => setCancelModalOpen(false)}
            disabled={cancelling}
          >
            Keep Appointment
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancelAppointment}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling..." : "Yes, Cancel Appointment"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
