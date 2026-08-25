"use client";

import { EditPatientProfileForm } from "@/components/settings/EditPatientProfileForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";

export default function PatientSettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal patient profile, medical indicators, and security credentials.
        </p>
      </div>

      <div className="space-y-8">
        {/* Patient Profile Details Form */}
        <EditPatientProfileForm />

        {/* Security & Password Form */}
        <ChangePasswordForm />
      </div>
    </div>
  );
}

