"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Stethoscope, Mail, Award, Shield } from "lucide-react";

export default function StaffDoctors() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/doctors").catch(() => ({ data: [] }));
        const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
        setDoctors(data);
      } catch (error) {
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      const name = `${doc.user?.firstName || ""} ${doc.user?.lastName || ""}`.toLowerCase();
      const spec = (doc.specialization || "").toLowerCase();
      const email = (doc.user?.email || "").toLowerCase();
      const lic = (doc.licenseNumber || "").toLowerCase();
      return name.includes(q) || spec.includes(q) || email.includes(q) || lic.includes(q);
    });
  }, [doctors, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medical Staff & Doctors</h1>
          <p className="text-muted-foreground">Certified medical practitioners, specializations, and credential verification.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search doctor, specialty, license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Stethoscope}
                title="No doctors found"
                description={
                  search
                    ? "No medical doctors matched your search keyword."
                    : "No doctors have been registered in the system."
                }
                actionLabel={search ? "Clear Search" : undefined}
                onAction={search ? () => setSearch("") : undefined}
              />
            </div>
          ) : (
            <>
              {/* DESKTOP DOCTORS TABLE */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Practitioner</TableHead>
                      <TableHead className="whitespace-nowrap">Specialization</TableHead>
                      <TableHead className="whitespace-nowrap">Medical License</TableHead>
                      <TableHead className="whitespace-nowrap">Hospital Email</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctors.map((doc) => {
                      const docName = `Dr. ${doc.user?.firstName || ""} ${doc.user?.lastName || ""}`.trim();
                      const initial = doc.user?.firstName?.[0] || "D";

                      return (
                        <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-xs border border-teal-500/20">
                                {initial}
                              </div>
                              <span className="font-semibold text-foreground">{docName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium text-xs">
                              {doc.specialization || "General Medicine"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {doc.licenseNumber || "LIC-REG-PENDING"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{doc.user?.email || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="success" className="text-xs">
                              Verified
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* MOBILE DOCTORS CARDS */}
              <div className="block md:hidden divide-y divide-border/60">
                {filteredDoctors.map((doc) => {
                  const docName = `Dr. ${doc.user?.firstName || ""} ${doc.user?.lastName || ""}`.trim();
                  const initial = doc.user?.firstName?.[0] || "D";

                  return (
                    <div key={doc.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-xs border border-teal-500/20">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{docName}</p>
                            <Badge variant="outline" className="text-[10px] mt-0.5">
                              {doc.specialization || "General Medicine"}
                            </Badge>
                          </div>
                        </div>
                        <Badge variant="success" className="text-[10px] shrink-0">
                          Verified
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Medical License</span>
                          <span className="font-mono text-foreground font-medium">{doc.licenseNumber || "LIC-REG-PENDING"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Hospital Email</span>
                          <span className="text-foreground truncate block">{doc.user?.email || "—"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
