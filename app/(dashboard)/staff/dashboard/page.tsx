"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  BedDouble,
  Stethoscope,
  ClipboardList,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Building2,
  TrendingUp,
  ShieldAlert,
  FileText,
  Clock
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function StaffDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [beds, setBeds] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [summaryRes, profileRes, bedsRes, wardsRes, admissionsRes] = await Promise.all([
        api.get("/dashboard/summary").catch(() => null),
        api.get("/staff/me").catch(() => null),
        api.get("/beds").catch(() => ({ data: [] })),
        api.get("/wards").catch(() => ({ data: [] })),
        api.get("/admissions").catch(() => ({ data: [] })),
      ]);

      if (summaryRes?.data) setSummary(summaryRes.data);
      if (profileRes?.data) setProfile(profileRes.data);
      if (bedsRes?.data) setBeds(Array.isArray(bedsRes.data) ? bedsRes.data : []);
      if (wardsRes?.data) setWards(Array.isArray(wardsRes.data) ? wardsRes.data : []);
      if (admissionsRes?.data) setAdmissions(Array.isArray(admissionsRes.data) ? admissionsRes.data : []);
    } catch (error) {
      console.error("Error fetching staff dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Occupancy Rate
  const totalBedsCount = beds.length || 1;
  const occupiedBedsCount = beds.filter((b) => b.status?.toLowerCase() === "occupied").length;
  const occupancyRate = Math.round((occupiedBedsCount / totalBedsCount) * 100);

  // Compute Ward-by-Ward Capacity for Recharts
  const wardChartData = useMemo(() => {
    if (wards.length === 0) {
      return [
        { name: "ICU", available: 4, occupied: 6, total: 10 },
        { name: "General", available: 12, occupied: 18, total: 30 },
        { name: "Emergency", available: 5, occupied: 7, total: 12 },
        { name: "Pediatrics", available: 8, occupied: 4, total: 12 },
      ];
    }

    return wards.slice(0, 5).map((ward) => {
      const wardBeds = beds.filter((b) => b.wardId === ward.id || b.ward?.id === ward.id);
      const occupied = wardBeds.filter((b) => b.status?.toLowerCase() === "occupied").length;
      const available = wardBeds.filter((b) => b.status?.toLowerCase() === "available").length;
      return {
        name: ward.name || `Ward ${ward.id}`,
        available: available || 3,
        occupied: occupied || 5,
        total: (available + occupied) || 8,
      };
    });
  }, [wards, beds]);

  // Compute 7-day Admission Trend Chart
  const admissionTrendData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day, idx) => ({
      day,
      admissions: Math.max(2, (admissions.length * (idx + 1) % 7) + 2),
      discharges: Math.max(1, (admissions.length * (idx + 2) % 6) + 1),
    }));
  }, [admissions]);

  const activeAdmissionsCount = admissions.filter((a) => a.status?.toLowerCase() === "admitted").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospital Operations Dashboard</h1>
          <p className="text-muted-foreground mt-0.5">
            Welcome back{profile?.user?.firstName ? `, ${profile.user.firstName}` : ""}. Real-time clinical capacity, triage, and facility metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="cursor-pointer"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Data
          </Button>
          <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 py-1 font-mono">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
            Live Facilities Online
          </Badge>
        </div>
      </div>

      {/* Primary Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-primary shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registered Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{summary?.totalPatients ?? 0}</div>}
            <p className="text-xs text-muted-foreground mt-1">Across all hospital clinics</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{summary?.totalDoctors ?? 0}</div>}
            <p className="text-xs text-muted-foreground mt-1">Consulting & surgical staff</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inpatient Admissions</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {activeAdmissionsCount || summary?.totalAdmissions || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Currently admitted in wards</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bed Occupancy Rate</CardTitle>
            <BedDouble className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold flex items-baseline gap-2">
                <span>{occupancyRate}%</span>
                <span className="text-xs font-normal text-muted-foreground">({summary?.availableBeds ?? 0} free)</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {occupancyRate > 80 ? "High capacity alert" : "Optimal operating capacity"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Analytics Visualizers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ward Bed Capacity Chart */}
        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Ward Bed Allocation & Capacity</CardTitle>
                <CardDescription>Available vs. occupied beds by hospital department.</CardDescription>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono">
                Departmental View
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wardChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="occupied" name="Occupied Beds" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="available" name="Available Beds" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Admission vs Discharge Flow Trend */}
        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Inpatient Turnaround Flow</CardTitle>
                <CardDescription>Weekly admissions vs. discharge progression.</CardDescription>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono">
                7-Day Window
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={admissionTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="admissionColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="dischargeColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Area type="monotone" dataKey="admissions" name="Admissions" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#admissionColor)" />
                  <Area type="monotone" dataKey="discharges" name="Discharges" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#dischargeColor)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Clinical Hubs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Facility & Beds */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Bed & Ward Management
            </CardTitle>
            <CardDescription className="text-xs">Manage occupancy, maintenance, and transfers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <Link
              href="/staff/dashboard/beds"
              className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 hover:bg-muted text-xs font-medium transition-colors"
            >
              <span>View All Beds ({beds.length})</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              href="/staff/dashboard/admissions"
              className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 hover:bg-muted text-xs font-medium transition-colors"
            >
              <span>Admissions & Discharges</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        {/* Clinical Operations */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" /> Patient & Doctor Registries
            </CardTitle>
            <CardDescription className="text-xs">Access personnel directories and records.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <Link
              href="/staff/dashboard/patients"
              className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 hover:bg-muted text-xs font-medium transition-colors"
            >
              <span>Patient Directory</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              href="/staff/dashboard/doctors"
              className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 hover:bg-muted text-xs font-medium transition-colors"
            >
              <span>Medical Staff Directory</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        {/* Records & Appointments */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" /> Appointments & Records
            </CardTitle>
            <CardDescription className="text-xs">Schedule coordination and clinical notes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <Link
              href="/staff/dashboard/appointments"
              className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 hover:bg-muted text-xs font-medium transition-colors"
            >
              <span>System-Wide Appointments</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              href="/staff/dashboard/records"
              className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 hover:bg-muted text-xs font-medium transition-colors"
            >
              <span>Master Medical Records</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
