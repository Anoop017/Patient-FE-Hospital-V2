"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  HeartPulse, 
  MapPin, 
  FileText, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Mail,
  Phone
} from "lucide-react";

interface PatientData {
  id: number | string;
  userId?: number | string;
  dateOfBirth?: string | null;
  gender?: "male" | "female" | "other" | string;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | string;
  address?: string | null;
  medicalNotes?: string | null;
  status?: string;
  user?: {
    id?: number | string;
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
  };
}

export function EditPatientProfileForm({ onUpdated }: { onUpdated?: () => void }) {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.get("/patients/me");
      const data: PatientData = res.data;
      if (data) {
        setPatient(data);
        // Format dateOfBirth to YYYY-MM-DD for HTML input date
        if (data.dateOfBirth) {
          const dobDate = new Date(data.dateOfBirth);
          if (!isNaN(dobDate.getTime())) {
            setDateOfBirth(dobDate.toISOString().split("T")[0]);
          } else {
            setDateOfBirth(data.dateOfBirth.split("T")[0]);
          }
        } else {
          setDateOfBirth("");
        }
        setGender(data.gender || "");
        setBloodGroup(data.bloodGroup || "");
        setAddress(data.address || "");
        setMedicalNotes(data.medicalNotes || "");
      }
    } catch (err: any) {
      console.error("Failed to fetch patient profile:", err);
      setMessage({
        type: "error",
        text: err.message || "Failed to load patient profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient?.id) {
      setMessage({ type: "error", text: "Patient profile ID not found." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const numericId = !isNaN(Number(patient.id)) ? Number(patient.id) : patient.id;

      const payload: any = {
        dateOfBirth: dateOfBirth ? dateOfBirth : null,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        address: address.trim() || null,
        medicalNotes: medicalNotes.trim() || null,
      };

      await api.patch(`/patients/${numericId}`, payload);

      setMessage({ type: "success", text: "Patient profile updated successfully!" });
      await fetchProfile();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      console.error("Failed to update patient profile:", err);
      setMessage({
        type: "error",
        text: err.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (patient) {
      if (patient.dateOfBirth) {
        const dobDate = new Date(patient.dateOfBirth);
        setDateOfBirth(!isNaN(dobDate.getTime()) ? dobDate.toISOString().split("T")[0] : patient.dateOfBirth.split("T")[0]);
      } else {
        setDateOfBirth("");
      }
      setGender(patient.gender || "");
      setBloodGroup(patient.bloodGroup || "");
      setAddress(patient.address || "");
      setMedicalNotes(patient.medicalNotes || "");
      setMessage(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-48 space-y-3 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Loading your patient profile details...</p>
        </CardContent>
      </Card>
    );
  }

  const user = patient?.user;
  const fullName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || "Patient";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Patient Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal demographics, emergency medical indicators, and contact address.
            </CardDescription>
          </div>
          {patient?.id && (
            <Badge variant="outline" className="w-fit font-mono text-xs">
              Patient ID: #{patient.id}
            </Badge>
          )}
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {message && (
            <div
              className={`flex items-start gap-2.5 rounded-lg p-3.5 text-sm ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Account Overview (Read Only Credentials) */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Account Credentials & Identity
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Full Name</span>
                <span className="font-semibold text-foreground">{fullName}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email Address
                </span>
                <span className="font-medium text-foreground truncate block">
                  {user?.email || "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Mobile Number
                </span>
                <span className="font-medium text-foreground">
                  {user?.mobile || "Not specified"}
                </span>
              </div>
            </div>
          </div>

          {/* Editable Patient Demographics & Health Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Date of Birth
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>

            {/* Blood Group */}
            <div className="space-y-2">
              <Label htmlFor="bloodGroup" className="flex items-center gap-1.5">
                <HeartPulse className="h-3.5 w-3.5 text-red-500" />
                Blood Group
              </Label>
              <Select
                id="bloodGroup"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              Residential Address
            </Label>
            <Input
              id="address"
              placeholder="123 Health Ave, Suite 400, City, State, ZIP"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Medical Notes */}
          <div className="space-y-2">
            <Label htmlFor="medicalNotes" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Personal Health & Allergy Notes
            </Label>
            <Textarea
              id="medicalNotes"
              rows={3}
              placeholder="Enter any persistent medical history, ongoing treatments, or important personal health notes..."
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              These notes will be accessible to attending doctors and nurses during your clinical consultations.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Reset Changes
          </Button>

          <Button type="submit" disabled={saving} className="font-semibold w-full sm:w-auto">
            {saving ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving Changes...
              </span>
            ) : (
              "Save Profile Changes"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
