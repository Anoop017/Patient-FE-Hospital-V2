"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, BedDouble, Stethoscope, ClipboardList } from "lucide-react";

export default function StaffDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, profileRes] = await Promise.all([
          api.get("/dashboard/summary").catch(() => null),
          api.get("/staff/me").catch(() => null),
        ]);
        if (summaryRes) setSummary(summaryRes.data);
        if (profileRes) setProfile(profileRes.data);
      } catch (error) {
        console.error("Error fetching staff data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back{profile?.user?.firstName ? `, ${profile.user.firstName}` : ""}. Overview of hospital operations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalPatients ?? 0}</div>
            <p className="text-xs text-muted-foreground">Registered in hospital</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalDoctors ?? 0}</div>
            <p className="text-xs text-muted-foreground">Active medical staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admissions</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalAdmissions ?? 0}</div>
            <p className="text-xs text-muted-foreground">Inpatient admissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Beds</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.availableBeds ?? 0}</div>
            <p className="text-xs text-muted-foreground">Ready for occupancy</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointments & Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="/staff/dashboard/appointments" className="block text-sm font-medium text-foreground hover:underline">View All Appointments →</a>
              <a href="/staff/dashboard/patients" className="block text-sm font-medium text-foreground hover:underline">View All Patients →</a>
              <a href="/staff/dashboard/doctors" className="block text-sm font-medium text-foreground hover:underline">View All Doctors →</a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facilities & Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="/staff/dashboard/beds" className="block text-sm font-medium text-foreground hover:underline">Beds & Wards Management →</a>
              <a href="/staff/dashboard/admissions" className="block text-sm font-medium text-foreground hover:underline">Admissions & Discharges →</a>
              <a href="/staff/dashboard/records" className="block text-sm font-medium text-foreground hover:underline">Medical Records →</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
