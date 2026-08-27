"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function StaffDoctors() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/doctors").catch(() => ({ data: [] }));
        setDoctors(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading doctors...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
        <p className="text-muted-foreground">View all registered doctors.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Name</TableHead>
                <TableHead className="whitespace-nowrap">Email</TableHead>
                <TableHead className="whitespace-nowrap">Specialization</TableHead>
                <TableHead className="whitespace-nowrap">License Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No doctors found.</TableCell></TableRow>
              ) : (
                doctors.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      Dr. {doc.user?.firstName} {doc.user?.lastName}
                    </TableCell>
                    <TableCell>{doc.user?.email || "—"}</TableCell>
                    <TableCell>{doc.specialization || "—"}</TableCell>
                    <TableCell>{doc.licenseNumber || "—"}</TableCell>
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
