"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  User,
  Moon,
  Sun,
  Mail,
  Phone,
  Shield,
  Settings,
  LogOut,
  ChevronDown,
  Activity,
  HeartPulse,
  Stethoscope,
  Building2,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export function Topbar({ user }: { user: any }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { role, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [detailedProfile, setDetailedProfile] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch role-specific details (e.g., blood group for patients, specialization for doctors)
  useEffect(() => {
    const fetchSpecificProfile = async () => {
      try {
        if (role === "patient") {
          const res = await api.get("/patients/me").catch(() => null);
          if (res?.data) setDetailedProfile(res.data);
        } else if (role === "doctor") {
          const res = await api.get("/doctors/me").catch(() => null);
          if (res?.data) setDetailedProfile(res.data);
        } else if (role === "staff") {
          const res = await api.get("/staff/me").catch(() => null);
          if (res?.data) setDetailedProfile(res.data);
        }
      } catch (e) {
        // Silently keep default user object
      }
    };
    if (role) {
      fetchSpecificProfile();
    }
  }, [role]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  // Extract display information
  const firstName = detailedProfile?.user?.firstName || user?.firstName || "";
  const lastName = detailedProfile?.user?.lastName || user?.lastName || "";
  const fullName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (user?.name || "User");
  const email = detailedProfile?.user?.email || user?.email || "No email available";
  const mobile = detailedProfile?.user?.mobile || user?.mobile || detailedProfile?.mobile || user?.phone || "Not provided";
  const bloodGroup = detailedProfile?.bloodGroup;
  const specialization = detailedProfile?.specialization;
  const department = detailedProfile?.department || detailedProfile?.ward?.name;
  const patientId = detailedProfile?.id || user?.id;

  // Initials for avatar badge
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const settingsHref = `/${role || "patient"}/dashboard/settings`;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      {/* Search Bar */}
      <div className="flex w-full max-w-md items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="h-9 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 shadow-none"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle Icon Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 rounded-full px-0 hover:bg-muted"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {mounted && isDark ? (
            <Sun className="h-4 w-4 text-amber-500" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700" />
          )}
        </Button>

        {/* Notifications Button */}
        <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full px-0 hover:bg-muted">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Profile Trigger & Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2.5 rounded-full p-1 sm:px-2.5 sm:py-1 hover:bg-muted/80 transition-colors cursor-pointer border border-transparent hover:border-border focus:outline-none focus:ring-2 focus:ring-ring"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs shadow-xs">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="text-sm font-medium leading-tight text-foreground">
                {fullName}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground capitalize">
                {role || "Patient"}
              </span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Profile Popover / Dropdown Card */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-background p-4 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
              {/* Profile Header */}
              <div className="flex items-start gap-3 border-b border-border pb-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-foreground truncate">{fullName}</h3>
                    <Badge variant="default" className="text-[10px] uppercase font-semibold px-1.5 py-0">
                      {role || "Patient"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{email}</p>
                </div>
              </div>

              {/* Detailed User Information List */}
              <div className="py-3 space-y-2.5 text-xs">
                {/* Email */}
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate text-foreground font-medium">{email}</span>
                </div>

                {/* Mobile */}
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-foreground font-medium">{mobile}</span>
                </div>

                {/* Role Specific Details */}
                {role === "patient" && (
                  <>
                    {bloodGroup && (
                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <HeartPulse className="h-3.5 w-3.5 shrink-0 text-red-500" />
                        <span>
                          Blood Group: <strong className="text-foreground">{bloodGroup}</strong>
                        </span>
                      </div>
                    )}
                    {patientId && (
                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>
                          Patient ID: <code className="text-[11px] font-mono font-bold text-foreground">#{String(patientId)}</code>
                        </span>
                      </div>
                    )}
                  </>
                )}

                {role === "doctor" && specialization && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Stethoscope className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>
                      Specialization: <strong className="text-foreground">{specialization}</strong>
                    </span>
                  </div>
                )}

                {role === "staff" && department && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>
                      Department: <strong className="text-foreground">{department}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Actions & Navigation */}
              <div className="border-t border-border pt-2 space-y-1">
                <Link
                  href={settingsHref}
                  className="flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Account Settings</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className="flex items-center justify-between w-full rounded-md px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-slate-700" />}
                    <span>Theme</span>
                  </div>
                  <span className="text-[11px] font-semibold text-foreground">
                    {isDark ? "Dark" : "Light"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
