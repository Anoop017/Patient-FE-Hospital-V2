"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Activity, History, Search, User, Calendar, Stethoscope } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DoctorVitalsLiveMonitor } from "@/components/vitals/DoctorVitalsLiveMonitor";
import { PatientTimeline } from "@/components/patient/PatientTimeline";

export default function DoctorPatients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPatientForVitals, setSelectedPatientForVitals] = useState<any | null>(null);
  const [selectedPatientForTimeline, setSelectedPatientForTimeline] = useState<any | null>(null);

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

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      const fullName = `${p.user?.firstName || ""} ${p.user?.lastName || ""}`.toLowerCase();
      const bloodGroup = (p.bloodGroup || "").toLowerCase();
      const id = String(p.id || "");
      return fullName.includes(q) || bloodGroup.includes(q) || id.includes(q);
    });
  }, [patients, search]);

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Patients</h1>
          <p className="text-muted-foreground">
            Clinical records, longitudinal EHR journeys, and real-time physiological telemetry.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, blood..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Patient</TableHead>
                <TableHead className="whitespace-nowrap">Blood Group</TableHead>
                <TableHead className="whitespace-nowrap">Total Encounters</TableHead>
                <TableHead className="whitespace-nowrap">Last Visit</TableHead>
                <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12">
                    <EmptyState
                      icon={User}
                      title="No patients found"
                      description={search ? "Try adjusting your search keywords." : "You currently have no patient records assigned."}
                      actionLabel={search ? "Clear Search" : undefined}
                      onAction={search ? () => setSearch("") : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                          {patient.user?.firstName?.[0] || "P"}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {patient.user?.firstName} {patient.user?.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            ID #{patient.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {patient.bloodGroup ? (
                        <Badge variant="outline" className="text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                          {patient.bloodGroup}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{patient.totalVisits || 1}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Longitudinal Timeline Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPatientForTimeline(patient)}
                          className="h-8 text-xs flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <History className="size-3.5" />
                          Patient Journey
                        </Button>

                        {/* Real-time Telemetry Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPatientForVitals(patient)}
                          className="h-8 text-xs flex items-center gap-1.5 border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10"
                        >
                          <Activity className="size-3.5" />
                          Live Vitals
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Unified Longitudinal Patient Journey Dialog */}
      <Dialog
        open={!!selectedPatientForTimeline}
        onOpenChange={(open) => !open && setSelectedPatientForTimeline(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="size-5 text-primary" />
              Longitudinal EHR Patient Journey
            </DialogTitle>
            <DialogDescription>
              Chronological medical encounters, diagnoses, prescriptions, lab results, and inpatient admissions.
            </DialogDescription>
          </DialogHeader>
          {selectedPatientForTimeline && (
            <div className="mt-3">
              <PatientTimeline
                patientId={selectedPatientForTimeline.id}
                patientInfo={selectedPatientForTimeline}
                onOpenTelemetry={() => {
                  const p = selectedPatientForTimeline;
                  setSelectedPatientForTimeline(null);
                  setSelectedPatientForVitals(p);
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Live Vitals Dialog for Selected Patient */}
      <Dialog
        open={!!selectedPatientForVitals}
        onOpenChange={(open) => !open && setSelectedPatientForVitals(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="size-5 text-teal-500" />
              Patient Telemetry & Vitals
            </DialogTitle>
            <DialogDescription>
              Live physiological telemetry stream for{" "}
              {selectedPatientForVitals?.user?.firstName} {selectedPatientForVitals?.user?.lastName} (ID #{selectedPatientForVitals?.id}).
            </DialogDescription>
          </DialogHeader>
          {selectedPatientForVitals && (
            <div className="mt-2">
              <DoctorVitalsLiveMonitor patientId={selectedPatientForVitals.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
