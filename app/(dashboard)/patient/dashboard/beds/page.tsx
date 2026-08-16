"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { BedDouble } from "lucide-react";

export default function PatientBedAvailability() {
  const [beds, setBeds] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bedsRes, wardsRes] = await Promise.all([
          api.get("/beds").catch(() => ({ data: [] })),
          api.get("/wards").catch(() => ({ data: [] })),
        ]);
        setBeds(Array.isArray(bedsRes.data) ? bedsRes.data : []);
        setWards(Array.isArray(wardsRes.data) ? wardsRes.data : []);
      } catch (error) {
        console.error("Error fetching bed data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading bed availability...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bed Availability</h1>
        <p className="text-muted-foreground">View current bed and ward availability.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beds</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{beds.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableBeds.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupiedBeds.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Wards Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Wards</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ward Name</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Capacity</TableHead>
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
          <CardTitle>All Beds</CardTitle>
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
                    <TableCell>{bed.type || "—"}</TableCell>
                    <TableCell>{getBedStatusBadge(bed.status)}</TableCell>
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
