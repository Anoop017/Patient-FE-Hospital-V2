"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function StaffAdmissions() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/admissions").catch(() => ({ data: [] }));
      setAdmissions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setAdmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDischarge = async (id: string) => {
    try {
      await api.patch(`/admissions/${id}`, { status: "discharged" });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "admitted": return <Badge variant="default">Admitted</Badge>;
      case "discharged": return <Badge variant="success">Discharged</Badge>;
      case "transferred": return <Badge variant="warning">Transferred</Badge>;
      default: return <Badge variant="outline">{status || "—"}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading admissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admissions</h1>
        <p className="text-muted-foreground">View and update patient admissions.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No admissions found.</TableCell></TableRow>
              ) : (
                admissions.map((adm) => (
                  <TableRow key={adm.id}>
                    <TableCell>{new Date(adm.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{adm.patient?.user ? `${adm.patient.user.firstName} ${adm.patient.user.lastName}` : "—"}</TableCell>
                    <TableCell>{adm.reason || "—"}</TableCell>
                    <TableCell>{adm.doctor?.user ? `Dr. ${adm.doctor.user.firstName} ${adm.doctor.user.lastName}` : "—"}</TableCell>
                    <TableCell>{getStatusBadge(adm.status)}</TableCell>
                    <TableCell>
                      {adm.status?.toLowerCase() === "admitted" && (
                        <Button size="sm" variant="outline" onClick={() => handleDischarge(adm.id)}>Discharge</Button>
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
