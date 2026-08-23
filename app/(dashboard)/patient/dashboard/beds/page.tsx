"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { BedDouble, ClipboardList, RefreshCw } from "lucide-react";

export default function PatientBedAvailability() {
  const [beds, setBeds] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [myAdmissions, setMyAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"beds" | "admissions">("beds");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [bedsRes, wardsRes, admissionsRes] = await Promise.all([
        api.get("/beds").catch(() => ({ data: [] })),
        api.get("/wards").catch(() => ({ data: [] })),
        api.get("/admissions/me").catch(() => ({ data: [] })),
      ]);

      const bedsData = Array.isArray(bedsRes?.data)
        ? bedsRes.data
        : (Array.isArray(bedsRes?.data?.data) ? bedsRes.data.data : []);
      setBeds(bedsData);

      const wardsData = Array.isArray(wardsRes?.data)
        ? wardsRes.data
        : (Array.isArray(wardsRes?.data?.data) ? wardsRes.data.data : []);
      setWards(wardsData);

      const admissionsData = Array.isArray(admissionsRes?.data)
        ? admissionsRes.data
        : (Array.isArray(admissionsRes?.data?.data) ? admissionsRes.data.data : []);
      setMyAdmissions(admissionsData);
    } catch (error) {
      console.error("Error fetching bed data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const availableBeds = beds.filter((b) => b.status === "available" || b.isAvailable);
  const occupiedBeds = beds.filter((b) => b.status === "occupied" || !b.isAvailable);

  const getBedStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available": return <Badge variant="success">Available</Badge>;
      case "occupied": return <Badge variant="destructive">Occupied</Badge>;
      case "maintenance": return <Badge variant="warning">Maintenance</Badge>;
      default: return <Badge variant="outline">{status || "—"}</Badge>;
    }
  };

  const getAdmissionStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "admitted":
        return <Badge variant="default">Currently Admitted</Badge>;
      case "discharged":
        return <Badge variant="success">Discharged</Badge>;
      case "transferred":
        return <Badge variant="warning">Transferred</Badge>;
      default:
        return <Badge variant="outline">{status || "—"}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3 text-muted-foreground">
        <RefreshCw className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm">Loading bed and ward details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospital Wards & Bed Availability</h1>
          <p className="text-muted-foreground">
            Check real-time ward capacities, bed occupancy, and view your inpatient admission history.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center gap-1.5 w-fit"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hospital Beds</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{beds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {wards.length} hospital wards</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Beds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {availableBeds.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ready for patient allocation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied Beds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupiedBeds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In active inpatient use</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("beds")}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
            activeTab === "beds"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Bed & Ward Availability
        </button>
        <button
          onClick={() => setActiveTab("admissions")}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
            activeTab === "admissions"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          My Inpatient Admissions ({myAdmissions.length})
        </button>
      </div>

      {activeTab === "beds" ? (
        <div className="space-y-6">
          {/* Wards Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Hospital Wards</CardTitle>
              <CardDescription>Departmental ward floors and capacities.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ward Name</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Bed Capacity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wards.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No wards found.</TableCell></TableRow>
                  ) : (
                    wards.map((ward) => (
                      <TableRow key={ward.id}>
                        <TableCell className="font-medium">{ward.name || "—"}</TableCell>
                        <TableCell>{ward.floor || "—"}</TableCell>
                        <TableCell>{ward.capacity || ward.totalBeds || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Beds List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Bed Registry</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bed Number</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beds.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No beds found.</TableCell></TableRow>
                  ) : (
                    beds.map((bed) => (
                      <TableRow key={bed.id}>
                        <TableCell className="font-medium">{bed.bedNumber || bed.number || "—"}</TableCell>
                        <TableCell>{bed.ward?.name || "—"}</TableCell>
                        <TableCell>{bed.type || "Standard"}</TableCell>
                        <TableCell>{getBedStatusBadge(bed.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* My Admissions Tab */
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Inpatient Admission Records
            </CardTitle>
            <CardDescription>Your inpatient admissions, ward allocations, and discharge history.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission Date</TableHead>
                  <TableHead>Discharge Date</TableHead>
                  <TableHead>Ward & Bed</TableHead>
                  <TableHead>Reason / Diagnosis</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAdmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                      <BedDouble className="mx-auto h-8 w-8 mb-2 opacity-40" />
                      <p className="font-medium">No inpatient admissions on record</p>
                      <p className="text-xs">Any hospital stays or ward admissions will be recorded here.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  myAdmissions.map((adm) => (
                    <TableRow key={adm.id}>
                      <TableCell className="font-medium">
                        {adm.admissionDate ? new Date(adm.admissionDate).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        {adm.dischargeDate ? new Date(adm.dischargeDate).toLocaleDateString() : "Present"}
                      </TableCell>
                      <TableCell>
                        {adm.ward?.name || adm.wardName || "General Ward"} • Bed {adm.bed?.bedNumber || adm.bedNumber || "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{adm.reason || adm.diagnosis || "Medical Stay"}</TableCell>
                      <TableCell className="text-right">{getAdmissionStatusBadge(adm.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
