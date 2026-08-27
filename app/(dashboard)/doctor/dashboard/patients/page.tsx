"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function DoctorPatients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        let appointments: any[] = [];
        try {
          const res = await api.get("/appointments/me");
          appointments = Array.isArray(res.data) ? res.data : [];
        } catch {
          const patientsRes = await api.get("/patients");
          if (Array.isArray(patientsRes.data)) {
            setPatients(patientsRes.data);
            return;
          }
        }

        // Extract unique patients from appointments
        const patientMap = new Map<string, any>();
        appointments.forEach((appt: any) => {
          if (appt.patient?.id && !patientMap.has(appt.patient.id)) {
            patientMap.set(appt.patient.id, {
              ...appt.patient,
              lastVisit: appt.appointmentDate,
              totalVisits: 1,
            });
          } else if (appt.patient?.id) {
            const existing = patientMap.get(appt.patient.id)!;
            existing.totalVisits += 1;
            if (new Date(appt.appointmentDate) > new Date(existing.lastVisit)) {
              existing.lastVisit = appt.appointmentDate;
            }
          }
        });
        setPatients(Array.from(patientMap.values()));
      } catch (error) {
        console.error("Error fetching patients:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading patients...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Patients</h1>
        <p className="text-muted-foreground">Patients extracted from your appointment history.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Name</TableHead>
                <TableHead className="whitespace-nowrap">Blood Group</TableHead>
                <TableHead className="whitespace-nowrap">Total Visits</TableHead>
                <TableHead className="whitespace-nowrap">Last Visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No patients found.
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      {patient.user?.firstName} {patient.user?.lastName}
                    </TableCell>
                    <TableCell>{patient.bloodGroup || "—"}</TableCell>
                    <TableCell>{patient.totalVisits}</TableCell>
                    <TableCell>{new Date(patient.lastVisit).toLocaleDateString()}</TableCell>
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
