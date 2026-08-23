"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  CreditCard,
  ArrowRight,
  AlertCircle,
  Clock,
  User,
  HeartPulse,
  BedDouble,
  Activity,
  CheckCircle2,
  CalendarCheck
} from "lucide-react";

interface DashboardSummary {
  role?: string;
  patientId?: string;
  name?: string;
  bloodGroup?: string;
  counts?: {
    upcomingAppointments?: number;
    totalMedicalRecords?: number;
    totalPrescriptions?: number;
    totalLabTests?: number;
    unpaidBillsCount?: number;
  };
  billingOverview?: {
    unpaidBillsCount?: number;
    totalDueAmount?: number;
  };
  nextAppointment?: {
    id?: string;
    doctorName?: string;
    specialization?: string;
    appointmentDate?: string;
    reason?: string;
    status?: string;
  } | null;
  activeAdmission?: {
    id?: string;
    admissionDate?: string;
    wardName?: string;
    bedNumber?: string;
    reason?: string;
  } | null;
  recentLabTests?: Array<{
    id: string;
    testName: string;
    status: string;
    testDate: string;
    result?: string;
  }>;
}

export default function PatientDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, profileRes, appointmentsRes, billsRes] = await Promise.all([
          api.get("/dashboard/summary").catch(() => null),
          api.get("/patients/me").catch(() => null),
          api.get("/appointments/me").catch(() => null),
          api.get("/billing/me").catch(() => api.get("/billing/bills").catch(() => null)),
        ]);

        if (summaryRes?.data) setSummary(summaryRes.data);
        if (profileRes?.data) setProfile(profileRes.data);
        if (appointmentsRes?.data) {
          setAppointments(Array.isArray(appointmentsRes.data) ? appointmentsRes.data : []);
        }
        if (billsRes?.data) {
          setBills(Array.isArray(billsRes.data) ? billsRes.data : []);
        }
      } catch (error) {
        console.error("Error fetching patient data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading dashboard...</div>;
  }

  // Pre-aggregated or derived calculations
  const upcomingCount = summary?.counts?.upcomingAppointments ??
    appointments.filter((a) => a.status === "Scheduled" || a.status === "scheduled").length;

  const totalDue = summary?.billingOverview?.totalDueAmount ??
    bills.reduce((acc, b) => {
      const total = parseFloat(String(b.totalAmount || 0));
      const paid = parseFloat(String(b.paidAmount || 0));
      return acc + Math.max(0, total - paid);
    }, 0);

  const unpaidCount = summary?.billingOverview?.unpaidBillsCount ??
    bills.filter((b) => b.status === "unpaid" || b.status === "partially_paid").length;

  const patientName = summary?.name || (profile?.user?.firstName ? `${profile.user.firstName} ${profile.user.lastName || ""}`.trim() : "Patient");
  const bloodGroup = summary?.bloodGroup || profile?.bloodGroup;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight">Patient Dashboard</h1>
            {bloodGroup && (
              <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 border-primary/30">
                Blood Group: {bloodGroup}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-foreground">{patientName}</span>. Here is your personalized healthcare overview.
          </p>
        </div>
        {totalDue > 0 && (
          <Link href="/patient/dashboard/billing">
            <Button className="bg-primary text-primary-foreground shadow-xs">
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Balance (${Number(totalDue).toFixed(2)})
            </Button>
          </Link>
        )}
      </div>

      {/* Outstanding Balance Banner if applicable */}
      {totalDue > 0 && (
        <div className="flex items-center justify-between p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-semibold">Billing Notice:</span> You have{" "}
              <strong>{unpaidCount} unpaid invoice{unpaidCount > 1 ? "s" : ""}</strong> with a remaining balance of{" "}
              <strong>${Number(totalDue).toFixed(2)}</strong>.
            </div>
          </div>
          <Link href="/patient/dashboard/billing" className="text-xs font-bold underline hover:opacity-80 flex items-center gap-1 shrink-0 ml-2">
            Settle Invoices <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Active Inpatient Admission Banner if currently admitted */}
      {summary?.activeAdmission && (
        <div className="flex items-center justify-between p-4 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-300 text-sm">
          <div className="flex items-center gap-3">
            <BedDouble className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <span className="font-semibold">Active Inpatient Stay:</span> Currently admitted in{" "}
              <strong>{summary.activeAdmission.wardName || "Hospital Ward"}</strong> (Bed{" "}
              <strong>{summary.activeAdmission.bedNumber || "N/A"}</strong>) since{" "}
              {summary.activeAdmission.admissionDate ? new Date(summary.activeAdmission.admissionDate).toLocaleDateString() : "recent"}.
            </div>
          </div>
          <Link href="/patient/dashboard/beds" className="text-xs font-semibold underline hover:opacity-80">
            View Details
          </Link>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.counts?.totalMedicalRecords ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Clinical notes & records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.counts?.totalPrescriptions ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active & past prescriptions</p>
          </CardContent>
        </Card>

        <Card className={totalDue > 0 ? "border-l-4 border-l-amber-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <CreditCard className={`h-4 w-4 ${totalDue > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Number(totalDue).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {unpaidCount > 0 ? `${unpaidCount} pending invoices` : "All invoices settled"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next Appointment Hero Card + Recent Lab Results Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Next Appointment Card */}
        <Card className="border-l-4 border-l-primary flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                Next Upcoming Appointment
              </CardTitle>
              {summary?.nextAppointment?.status && (
                <Badge variant="default" className="capitalize">
                  {summary.nextAppointment.status}
                </Badge>
              )}
            </div>
            <CardDescription>Your next scheduled doctor visit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary?.nextAppointment ? (
              <div className="rounded-lg bg-muted/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-bold text-base text-foreground">
                      {summary.nextAppointment.doctorName || "Doctor Appointment"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {summary.nextAppointment.specialization || "General Medicine"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-background px-2.5 py-1 rounded-md border border-border">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {summary.nextAppointment.appointmentDate
                        ? new Date(summary.nextAppointment.appointmentDate).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Scheduled"}
                    </span>
                  </div>
                </div>
                {summary.nextAppointment.reason && (
                  <p className="text-xs text-muted-foreground border-t border-border pt-2">
                    <span className="font-medium text-foreground">Reason:</span> {summary.nextAppointment.reason}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm space-y-2">
                <Calendar className="mx-auto h-8 w-8 opacity-40" />
                <p>No upcoming appointments scheduled.</p>
                <Link href="/patient/dashboard/appointments">
                  <Button variant="outline" size="sm" className="mt-2">
                    Book an Appointment
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Lab Results */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                Recent Lab Results
              </CardTitle>
              <Link href="/patient/dashboard/lab-tests" className="text-xs font-medium text-primary hover:underline">
                View All
              </Link>
            </div>
            <CardDescription>Latest test reports and status.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary?.recentLabTests && summary.recentLabTests.length > 0 ? (
              <div className="space-y-3">
                {summary.recentLabTests.slice(0, 3).map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground text-sm">{test.testName}</p>
                      <p className="text-muted-foreground text-[11px]">
                        {test.result ? `Result: ${test.result}` : "Report processing"} •{" "}
                        {new Date(test.testDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={test.status?.toLowerCase() === "completed" ? "success" : "warning"}
                      className="capitalize"
                    >
                      {test.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm space-y-1">
                <FlaskConical className="mx-auto h-8 w-8 opacity-40" />
                <p>No recent lab tests found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Appointments Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Appointments</CardTitle>
            <CardDescription>Your latest scheduled and past visits.</CardDescription>
          </div>
          <Link href="/patient/dashboard/appointments">
            <Button variant="outline" size="sm">
              All Appointments
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No appointments found. Book one from the Appointments page.
            </p>
          ) : (
            <div className="space-y-4">
              {appointments.slice(0, 5).map((appt) => (
                <div key={appt.id} className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {appt.reason || "Medical Visit"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {appt.doctor?.user ? `Dr. ${appt.doctor.user.firstName} ${appt.doctor.user.lastName}` : (appt.doctorName || "Attending Doctor")}{" "}
                      {appt.doctor?.specialization ? `— ${appt.doctor.specialization}` : ""}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString() : "—"}
                  </div>
                  <Badge
                    variant={
                      appt.status?.toLowerCase() === "completed"
                        ? "success"
                        : appt.status?.toLowerCase() === "cancelled"
                        ? "destructive"
                        : "default"
                    }
                    className="capitalize text-xs"
                  >
                    {appt.status || "Scheduled"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
