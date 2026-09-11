"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FileDown, Search, Building2, RefreshCw } from "lucide-react";
import { downloadReport } from "@/lib/reports";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMRN, formatAdmissionRef, formatDate } from "@/lib/formatters";

export default function StaffAdmissions() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
      toast.success("Patient Discharged", "Admission has been finalized and bed released.");
      fetchData();
    } catch (error: any) {
      toast.error("Discharge Failed", error.response?.data?.message || "Failed to update admission status.");
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

  const filteredAdmissions = admissions.filter((adm) => {
    const pName = `${adm.patient?.user?.firstName || ""} ${adm.patient?.user?.lastName || ""}`.toLowerCase();
    const dName = `${adm.doctor?.user?.firstName || ""} ${adm.doctor?.user?.lastName || ""}`.toLowerCase();
    const reason = (adm.reason || "").toLowerCase();
    return pName.includes(search.toLowerCase()) || dName.includes(search.toLowerCase()) || reason.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admissions</h1>
          <p className="text-muted-foreground">Monitor and manage institutional patient admissions & discharges.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          className="self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by patient, doctor, or reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Admission Ref</TableHead>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Patient</TableHead>
                <TableHead className="whitespace-nowrap">Reason</TableHead>
                <TableHead className="whitespace-nowrap">Doctor</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredAdmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-8">
                    <EmptyState
                      icon={Building2}
                      title="No admissions found"
                      description={
                        search
                          ? "No admissions matched your search query."
                          : "No patients are currently admitted in the hospital system."
                      }
                      actionLabel={search ? "Clear Search" : undefined}
                      onAction={() => setSearch("")}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmissions.map((adm) => (
                  <TableRow key={adm.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[11px] bg-muted/40">
                        {formatAdmissionRef(adm.id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{formatDate(adm.createdAt || adm.admissionDate)}</TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {adm.patient?.user ? (
                        <span>
                          {adm.patient.user.firstName} {adm.patient.user.lastName}
                          <span className="text-[11px] text-muted-foreground ml-1.5 font-mono">({formatMRN(adm.patientId)})</span>
                        </span>
                      ) : (
                        formatMRN(adm.patientId)
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{adm.reason || "Medical Inpatient Stay"}</TableCell>
                    <TableCell className="text-xs">
                      {adm.doctor?.user ? `Dr. ${adm.doctor.user.firstName} ${adm.doctor.user.lastName}` : "Attending Staff"}
                    </TableCell>
                    <TableCell>{getStatusBadge(adm.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadReport("discharge", adm.id)}
                          title="Download Discharge Summary PDF"
                          className="h-7 px-2 text-xs flex items-center gap-1 text-primary hover:bg-primary/10 border-primary/30 cursor-pointer"
                        >
                          <FileDown className="h-3.5 w-3.5" /> PDF
                        </Button>
                        {adm.status?.toLowerCase() === "admitted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDischarge(adm.id)}
                            className="h-7 px-2 text-xs font-medium hover:bg-muted cursor-pointer"
                          >
                            Discharge
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="p-4">
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-40 mb-3" />
              <Skeleton className="h-8 w-full" />
            </Card>
          ))
        ) : filteredAdmissions.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              icon={Building2}
              title="No admissions found"
              description={search ? "No matches found." : "No admissions recorded."}
              actionLabel={search ? "Clear Search" : undefined}
              onAction={() => setSearch("")}
            />
          </Card>
        ) : (
          filteredAdmissions.map((adm) => (
            <Card key={adm.id} className="p-4 space-y-3 shadow-xs border-border/70 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="font-mono text-xs bg-muted/50">
                  {formatAdmissionRef(adm.id)}
                </Badge>
                {getStatusBadge(adm.status)}
              </div>

              <div>
                <div className="font-semibold text-foreground text-sm">
                  {adm.patient?.user
                    ? `${adm.patient.user.firstName} ${adm.patient.user.lastName}`
                    : formatMRN(adm.patientId)}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {formatMRN(adm.patientId)}
                </div>
              </div>

              <div className="text-xs p-2.5 rounded-lg bg-muted/30 border border-border/50 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Admitted:</span>
                  <span className="font-mono text-[11px]">{formatDate(adm.createdAt || adm.admissionDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reason:</span>
                  <span className="font-medium text-foreground">{adm.reason || "Inpatient Care"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Physician:</span>
                  <span className="font-medium text-foreground">
                    {adm.doctor?.user ? `Dr. ${adm.doctor.user.firstName} ${adm.doctor.user.lastName}` : "Attending Staff"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadReport("discharge", adm.id)}
                  className="flex-1 h-8 text-xs cursor-pointer flex items-center justify-center gap-1.5 hover:border-primary/50"
                >
                  <FileDown className="h-3.5 w-3.5 text-primary" /> Discharge PDF
                </Button>
                {adm.status?.toLowerCase() === "admitted" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDischarge(adm.id)}
                    className="h-8 px-3 text-xs font-medium hover:bg-muted cursor-pointer"
                  >
                    Discharge
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
