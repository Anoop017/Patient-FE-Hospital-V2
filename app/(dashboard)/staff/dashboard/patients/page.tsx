"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, User, Calendar, Mail, Phone, Shield } from "lucide-react";
import { formatMRN, formatDate } from "@/lib/formatters";

export default function StaffPatients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/patients").catch(() => ({ data: [] }));
        const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
        setPatients(data);
      } catch (error) {
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      const name = `${p.user?.firstName || ""} ${p.user?.lastName || ""}`.toLowerCase();
      const email = (p.user?.email || "").toLowerCase();
      const blood = (p.bloodGroup || "").toLowerCase();
      const mrn = formatMRN(p.id).toLowerCase();
      return name.includes(q) || email.includes(q) || blood.includes(q) || mrn.includes(q);
    });
  }, [patients, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Directory</h1>
          <p className="text-muted-foreground">Comprehensive registry of hospital patients, demographics, and clinical identifiers.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, MRN, email..."
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
          ) : filteredPatients.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={User}
                title="No patients found"
                description={
                  search
                    ? "No patients matched your search query."
                    : "No patients have been registered in the system."
                }
                actionLabel={search ? "Clear Search" : undefined}
                onAction={search ? () => setSearch("") : undefined}
              />
            </div>
          ) : (
            <>
              {/* DESKTOP PATIENT TABLE */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">MRN</TableHead>
                      <TableHead className="whitespace-nowrap">Patient Name</TableHead>
                      <TableHead className="whitespace-nowrap">Email Contact</TableHead>
                      <TableHead className="whitespace-nowrap">Blood Group</TableHead>
                      <TableHead className="whitespace-nowrap">Date of Birth</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((p) => {
                      const fullName = p.user ? `${p.user.firstName} ${p.user.lastName}` : "Patient";
                      const initial = p.user?.firstName?.[0] || "P";

                      return (
                        <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-mono text-xs font-semibold text-primary">
                            {formatMRN(p.id)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                                {initial}
                              </div>
                              <span className="font-semibold text-foreground">{fullName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.user?.email || "—"}</TableCell>
                          <TableCell>
                            {p.bloodGroup ? (
                              <Badge variant="outline" className="text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                                {p.bloodGroup}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(p.dateOfBirth)}</TableCell>
                          <TableCell>
                            <Badge variant="success" className="text-xs">
                              {p.status || "Active"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* MOBILE PATIENTS CARDS */}
              <div className="block md:hidden divide-y divide-border/60">
                {filteredPatients.map((p) => {
                  const fullName = p.user ? `${p.user.firstName} ${p.user.lastName}` : "Patient";
                  const initial = p.user?.firstName?.[0] || "P";

                  return (
                    <div key={p.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                            <span className="font-mono text-xs text-primary font-bold">
                              {formatMRN(p.id)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {p.bloodGroup && (
                            <Badge variant="outline" className="text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                              {p.bloodGroup}
                            </Badge>
                          )}
                          <Badge variant="success" className="text-[10px]">
                            {p.status || "Active"}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Email</span>
                          <span className="text-foreground truncate block">{p.user?.email || "Not recorded"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Date of Birth</span>
                          <span className="text-foreground font-medium">{formatDate(p.dateOfBirth)}</span>
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
