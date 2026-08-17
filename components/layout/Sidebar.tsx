"use client";

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home, Calendar, Users, Settings, LogOut, FileText,
  ClipboardList, FlaskConical, BedDouble, Pill, Stethoscope
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

const patientLinks = [
  { name: "Dashboard", href: "/patient/dashboard", icon: Home },
  { name: "My Appointments", href: "/patient/dashboard/appointments", icon: Calendar },
  { name: "My Medical Records", href: "/patient/dashboard/records", icon: FileText },
  { name: "My Prescriptions", href: "/patient/dashboard/prescriptions", icon: Pill },
  { name: "My Lab Tests", href: "/patient/dashboard/lab-tests", icon: FlaskConical },
  { name: "Bed Availability", href: "/patient/dashboard/beds", icon: BedDouble },
]

const doctorLinks = [
  { name: "Dashboard", href: "/doctor/dashboard", icon: Home },
  { name: "My Appointments", href: "/doctor/dashboard/appointments", icon: Calendar },
  { name: "My Patients", href: "/doctor/dashboard/patients", icon: Users },
  { name: "Medical Records", href: "/doctor/dashboard/records", icon: FileText },
  { name: "Prescriptions", href: "/doctor/dashboard/prescriptions", icon: Pill },
  { name: "Lab Tests", href: "/doctor/dashboard/lab-tests", icon: FlaskConical },
  { name: "Admissions", href: "/doctor/dashboard/admissions", icon: ClipboardList },
  { name: "Beds & Wards", href: "/doctor/dashboard/beds", icon: BedDouble },
]

const staffLinks = [
  { name: "Dashboard", href: "/staff/dashboard", icon: Home },
  { name: "Appointments", href: "/staff/dashboard/appointments", icon: Calendar },
  { name: "Patients", href: "/staff/dashboard/patients", icon: Users },
  { name: "Doctors", href: "/staff/dashboard/doctors", icon: Stethoscope },
  { name: "Medical Records", href: "/staff/dashboard/records", icon: FileText },
  { name: "Admissions", href: "/staff/dashboard/admissions", icon: ClipboardList },
  { name: "Beds & Wards", href: "/staff/dashboard/beds", icon: BedDouble },
]

export function Sidebar({ role }: { role: string }) {
  const { logout } = useAuth();
  const pathname = usePathname();

  const getLinks = () => {
    switch (role) {
      case "patient": return patientLinks;
      case "doctor": return doctorLinks;
      case "staff":
      case "nurse": return staffLinks;
      default: return [{ name: "Dashboard", href: `/${role}/dashboard`, icon: Home }];
    }
  };

  const links = getLinks();
  const settingsHref = `/${role}/dashboard/settings`;

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-background">
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="text-lg font-bold tracking-tight">Patient - Hospital Dashboard</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{link.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="border-t border-border p-4">
        <Link
          href={settingsHref}
          className={cn(
            "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === settingsHref
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
        <button onClick={logout} className="w-full flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-1 cursor-pointer">
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  )
}
