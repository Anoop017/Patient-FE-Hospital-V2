"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { BedDouble } from "lucide-react";

export default function DoctorBeds() {
  const [beds, setBeds] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [bedsRes, wardsRes] = await Promise.all([
        api.get("/beds"),
        api.get("/wards"),
      ]);
      setBeds(Array.isArray(bedsRes.data) ? bedsRes.data : []);
      setWards(Array.isArray(wardsRes.data) ? wardsRes.data : []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateBedStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/beds/${id}`, { status });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update bed.");
    }
  };

  const getBedStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available": return <Badge variant="success">Available</Badge>;
      case "occupied": return <Badge variant="destructive">Occupied</Badge>;
      case "maintenance": return <Badge variant="warning">Maintenance</Badge>;
      default: return <Badge variant="outline">{status || "—"}</Badge>;
    }
  };

  const availableBeds = beds.filter((b) => b.status?.toLowerCase() === "available");

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading beds...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Beds & Wards</h1>
        <p className="text-muted-foreground">View and assign beds across wards.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beds</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{beds.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Available</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{availableBeds.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Wards</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{wards.length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Beds</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Bed Number</TableHead>
                <TableHead className="whitespace-nowrap">Ward</TableHead>
                <TableHead className="whitespace-nowrap">Type</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beds.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No beds found.</TableCell></TableRow>
              ) : (
                beds.map((bed) => (
                  <TableRow key={bed.id}>
                    <TableCell className="font-medium">{bed.bedNumber || bed.number || "—"}</TableCell>
                    <TableCell>{bed.ward?.name || "—"}</TableCell>
                    <TableCell>{bed.type || "—"}</TableCell>
                    <TableCell>{getBedStatusBadge(bed.status)}</TableCell>
                    <TableCell>
                      <Select
                        value={bed.status || ""}
                        onChange={(e) => updateBedStatus(bed.id, e.target.value)}
                        className="w-[140px] h-8 text-xs"
                      >
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                      </Select>
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
