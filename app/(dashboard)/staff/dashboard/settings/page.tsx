"use client";

import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";

export default function StaffSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security.</p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
