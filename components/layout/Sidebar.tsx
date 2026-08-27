"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Users,
  Settings,
  LogOut,
  FileText,
  ClipboardList,
  FlaskConical,
  BedDouble,
  Pill,
  Stethoscope,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Hospital,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const patientLinks = [
  { name: "Dashboard", href: "/patient/dashboard", icon: Home },
  { name: "My Appointments", href: "/patient/dashboard/appointments", icon: Calendar },
  { name: "My Medical Records", href: "/patient/dashboard/records", icon: FileText },
  { name: "My Prescriptions", href: "/patient/dashboard/prescriptions", icon: Pill },
  { name: "My Lab Tests", href: "/patient/dashboard/lab-tests", icon: FlaskConical },
  { name: "Billing & Invoices", href: "/patient/dashboard/billing", icon: CreditCard },
  { name: "Bed Availability", href: "/patient/dashboard/beds", icon: BedDouble },
];

const doctorLinks = [
  { name: "Dashboard", href: "/doctor/dashboard", icon: Home },
  { name: "My Appointments", href: "/doctor/dashboard/appointments", icon: Calendar },
  { name: "My Patients", href: "/doctor/dashboard/patients", icon: Users },
  { name: "Medical Records", href: "/doctor/dashboard/records", icon: FileText },
  { name: "Prescriptions", href: "/doctor/dashboard/prescriptions", icon: Pill },
  { name: "Lab Tests", href: "/doctor/dashboard/lab-tests", icon: FlaskConical },
  { name: "Admissions", href: "/doctor/dashboard/admissions", icon: ClipboardList },
  { name: "Beds & Wards", href: "/doctor/dashboard/beds", icon: BedDouble },
];

const staffLinks = [
  { name: "Dashboard", href: "/staff/dashboard", icon: Home },
  { name: "Appointments", href: "/staff/dashboard/appointments", icon: Calendar },
  { name: "Patients", href: "/staff/dashboard/patients", icon: Users },
  { name: "Doctors", href: "/staff/dashboard/doctors", icon: Stethoscope },
  { name: "Medical Records", href: "/staff/dashboard/records", icon: FileText },
  { name: "Admissions", href: "/staff/dashboard/admissions", icon: ClipboardList },
  { name: "Beds & Wards", href: "/staff/dashboard/beds", icon: BedDouble },
];

export function Sidebar({ role }: { role: string }) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggleCollapsed, closeMobile } = useSidebar();

  const getLinks = () => {
    switch (role) {
      case "patient":
        return patientLinks;
      case "doctor":
        return doctorLinks;
      case "staff":
      case "nurse":
        return staffLinks;
      default:
        return [{ name: "Dashboard", href: `/${role}/dashboard`, icon: Home }];
    }
  };

  const links = getLinks();
  const settingsHref = `/${role}/dashboard/settings`;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 md:hidden animate-in fade-in-0"
          aria-hidden="true"
        />
      )}

      {/* MOBILE DRAWER SIDEBAR */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-background shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobile Navigation Drawer"
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Hospital className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight capitalize block leading-tight text-foreground">
                {role} Portal
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">Hospital System</span>
            </div>
          </div>
          {/* Arrow / Close button to minimize/close mobile sidebar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={closeMobile}
            className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Nav Links */}
        <div className="flex-1 overflow-y-auto py-4 touch-scroll">
          <nav className="space-y-1 px-3">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={closeMobile}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile Footer */}
        <div className="border-t border-border p-4 space-y-1 bg-muted/10">
          <Link
            href={settingsHref}
            onClick={closeMobile}
            className={cn(
              "flex items-center space-x-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
              pathname === settingsHref
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </Link>
          <button
            onClick={() => {
              closeMobile();
              logout();
            }}
            className="w-full flex items-center space-x-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* DESKTOP / TABLET COLLAPSIBLE SIDEBAR */}
      <aside
        className={cn(
          "hidden md:flex h-full flex-col border-r border-border bg-background transition-all duration-300 ease-in-out shrink-0 select-none relative",
          isCollapsed ? "w-20" : "w-64"
        )}
        aria-label="Desktop Sidebar Navigation"
      >
        {/* Desktop Header with Minimize / Reopen Arrow */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Hospital className="h-4 w-4" />
              </div>
              <div className="truncate">
                <span className="text-sm font-bold tracking-tight capitalize block truncate text-foreground">
                  {role} - Dashboard
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Hospital className="h-4 w-4" />
            </div>
          )}

          {/* Minimize / Reopen Arrow Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className={cn(
              "h-8 w-8 rounded-md p-0 text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 transition-colors",
              isCollapsed && "mx-auto mt-1"
            )}
            aria-label={isCollapsed ? "Reopen sidebar" : "Minimize sidebar"}
            title={isCollapsed ? "Expand sidebar (Reopen)" : "Minimize sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-foreground" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-foreground" />
            )}
          </Button>
        </div>

        {/* Desktop Nav Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1.5 px-3">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  title={isCollapsed ? link.name : undefined}
                  className={cn(
                    "flex items-center rounded-md text-sm font-medium transition-colors",
                    isCollapsed
                      ? "justify-center h-10 w-full px-0"
                      : "space-x-3 px-3 py-2",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isCollapsed ? "h-5 w-5" : "")} />
                  {!isCollapsed && <span className="truncate">{link.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Footer (Settings & Logout) */}
        <div className="border-t border-border p-3 space-y-1 bg-muted/5">
          <Link
            href={settingsHref}
            title={isCollapsed ? "Settings" : undefined}
            className={cn(
              "flex items-center rounded-md text-sm font-medium transition-colors",
              isCollapsed
                ? "justify-center h-10 w-full px-0"
                : "space-x-3 px-3 py-2",
              pathname === settingsHref
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings className={cn("h-4 w-4 shrink-0", isCollapsed ? "h-5 w-5" : "")} />
            {!isCollapsed && <span>Settings</span>}
          </Link>
          <button
            onClick={logout}
            title={isCollapsed ? "Log out" : undefined}
            className={cn(
              "flex items-center rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-destructive transition-colors cursor-pointer w-full",
              isCollapsed
                ? "justify-center h-10 px-0"
                : "space-x-3 px-3 py-2"
            )}
          >
            <LogOut className={cn("h-4 w-4 shrink-0", isCollapsed ? "h-5 w-5" : "")} />
            {!isCollapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
