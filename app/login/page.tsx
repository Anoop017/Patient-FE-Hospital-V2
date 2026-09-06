"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Lock,
  Stethoscope,
  User,
  ClipboardList,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { useTheme } from "next-themes";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { setTheme } = useTheme();

  // Enforce light mode on login page
  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  const handleLoginWithCredentials = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", { email: loginEmail, password: loginPass });
      const { accessToken, user } = response.data;
      const roles = user?.roles || [];
      const roleNames: string[] = roles.map((r: any) =>
        typeof r === "string" ? r.toLowerCase() : (r.name || "").toLowerCase()
      );

      // Guard: Disallow system administrators in the patient/clinical portal
      const isAdmin =
        user?.userType === "admin" ||
        roleNames.includes("admin") ||
        roleNames.includes("super_admin") ||
        roleNames.includes("manager");

      if (isAdmin) {
        const adminMsg =
          "Access Restricted: This portal is exclusively for Patients, Doctors, and Clinical Staff. System Administrators must sign in through the Admin Dashboard (http://localhost:3001).";
        setError(adminMsg);
        toast.error("Administrator Account", adminMsg);
        setLoading(false);
        return;
      }

      login(accessToken, roles, user);
      toast.success("Welcome back!", `Signed in as ${user?.firstName || "User"}`);

      const isDoctor = roleNames.includes("doctor");
      const isStaff = roleNames.some((r) =>
        ["staff", "nurse", "receptionist", "pharmacist", "lab_technician"].includes(r)
      );

      if (isDoctor) {
        router.push("/doctor/dashboard");
      } else if (isStaff) {
        router.push("/staff/dashboard");
      } else {
        router.push("/patient/dashboard");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Login failed. Please check your credentials.";
      setError(errMsg);
      toast.error("Authentication Error", errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLoginWithCredentials(email, password);
  };

  const handleDemoSelect = async (role: "doctor" | "patient" | "staff") => {
    let demoEmail = "";
    let demoPass = "";

    if (role === "doctor") {
      demoEmail = process.env.NEXT_PUBLIC_DEMO_DOCTOR_EMAIL || "doctor@hospital.com";
      demoPass = process.env.NEXT_PUBLIC_DEMO_DOCTOR_PASSWORD || "password123";
    } else if (role === "patient") {
      demoEmail = process.env.NEXT_PUBLIC_DEMO_PATIENT_EMAIL || "patient@hospital.com";
      demoPass = process.env.NEXT_PUBLIC_DEMO_PATIENT_PASSWORD || "password123";
    } else if (role === "staff") {
      demoEmail = process.env.NEXT_PUBLIC_DEMO_STAFF_EMAIL || "staff@hospital.com";
      demoPass = process.env.NEXT_PUBLIC_DEMO_STAFF_PASSWORD || "password123";
    }

    setEmail(demoEmail);
    setPassword(demoPass);
    toast.info(`Demo credentials loaded: ${role.toUpperCase()}`, demoEmail);
    await handleLoginWithCredentials(demoEmail, demoPass);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotLoading(true);
    setForgotError("");
    setForgotMessage("");

    try {
      const response = await api.post("/auth/forgot-password", { email: forgotEmail });
      const message =
        response.data?.message ||
        (response as any).message ||
        "If this email address is registered, a password reset link has been sent.";
      setForgotMessage(message);
    } catch (err: any) {
      setForgotError(
        err.response?.data?.message ||
        err.message ||
        "Failed to send password reset email. Please try again."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh w-full flex flex-col justify-center items-center lg:items-end px-4 py-6 sm:px-6 sm:py-10 lg:px-12 xl:px-20 2xl:px-28 overflow-y-auto selection:bg-teal-500 selection:text-white">
      {/* Full Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-center lg:bg-left pointer-events-none transition-all duration-500"
        style={{ backgroundImage: `url('/hospital-fe-bg-1.png')` }}
      />
      {/* Mobile subtle overlay so text stays razor sharp */}
      <div className="fixed inset-0 bg-white/25 lg:bg-transparent pointer-events-none" />

      {/* Main Login Card - positioned on the right */}
      <div className="relative z-10 w-full max-w-[420px] sm:max-w-[440px] rounded-2xl sm:rounded-3xl border border-white/90 bg-white/95 text-slate-900 shadow-xl sm:shadow-2xl shadow-slate-900/10 p-5 sm:p-8 backdrop-blur-xl transition-all my-auto">
        
        {/* Card Header */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Sign in to your hospital dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            Patients, Doctors, and Staff — all in one place.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 space-y-3.5 sm:space-y-4">
          
          {/* Quick Demo Login Section */}
          <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 sm:p-3.5 space-y-2 sm:space-y-2.5">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-wide uppercase">
              <span>Quick Demo Login</span>
              <span className="flex items-center gap-1 font-mono font-bold text-amber-600 text-[10px]">
                ⚡ 1-Click Sign In
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {/* Doctor Button */}
              <button
                type="button"
                onClick={() => handleDemoSelect("doctor")}
                disabled={loading}
                className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 py-2 sm:py-2.5 px-1.5 sm:px-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                title="1-Click Demo Login as Doctor"
              >
                <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 transition-transform group-hover:scale-110" />
                <span className="text-[11px] sm:text-xs font-semibold text-emerald-700">Doctor</span>
              </button>

              {/* Patient Button */}
              <button
                type="button"
                onClick={() => handleDemoSelect("patient")}
                disabled={loading}
                className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100/80 py-2 sm:py-2.5 px-1.5 sm:px-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                title="1-Click Demo Login as Patient"
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 transition-transform group-hover:scale-110" />
                <span className="text-[11px] sm:text-xs font-semibold text-blue-700">Patient</span>
              </button>

              {/* Staff Button */}
              <button
                type="button"
                onClick={() => handleDemoSelect("staff")}
                disabled={loading}
                className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100/80 py-2 sm:py-2.5 px-1.5 sm:px-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                title="1-Click Demo Login as Hospital Staff"
              >
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 transition-transform group-hover:scale-110" />
                <span className="text-[11px] sm:text-xs font-semibold text-purple-700">Staff</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center pt-0.5 sm:pt-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-2.5 sm:px-3 text-[10px] sm:text-[11px] font-medium text-slate-400">
              Or sign in with your credentials
            </span>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 sm:p-3 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="pl-10 h-10 sm:h-11 rounded-xl text-sm bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Password
              </Label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotError("");
                  setForgotMessage("");
                  setIsForgotOpen(true);
                }}
                className="text-xs font-medium text-blue-600 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="pl-10 pr-10 h-10 sm:h-11 rounded-xl text-sm bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 sm:h-11 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-900/15 cursor-pointer mt-1 sm:mt-2"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>Sign in</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>

          {/* Sign Up Footer */}
          <div className="pt-1 sm:pt-2 text-center space-y-2">
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              Don&apos;t have an account?
            </p>
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 w-full h-10 sm:h-11 rounded-xl text-xs sm:text-sm font-semibold border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-600 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Sign up as a Patient</span>
            </Link>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal Dialog */}
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <div className="space-y-4 bg-white text-slate-900">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <KeyRound className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-xl font-bold text-slate-900">
              Forgot your password?
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-slate-500">
              Enter the email address associated with your account and we&apos;ll send you a password reset link.
            </DialogDescription>
          </DialogHeader>

          {forgotMessage ? (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
                <div className="text-sm leading-relaxed">
                  <p className="font-semibold text-emerald-900 mb-1">Check your email</p>
                  <p>{forgotMessage}</p>
                </div>
              </div>
              <DialogFooter className="sm:justify-center pt-2">
                <Button
                  type="button"
                  className="w-full sm:w-auto min-w-[140px] bg-slate-900 text-white hover:bg-slate-800"
                  onClick={() => setIsForgotOpen(false)}
                >
                  Back to Sign In
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {forgotError && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-slate-700">Email address</Label>
                <div className="relative">
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoFocus
                    className="pl-9 bg-slate-50/70 border-slate-200 text-slate-900"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsForgotOpen(false)}
                  disabled={forgotLoading}
                  className="border-slate-200 text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail.trim()}
                  className="bg-slate-900 text-white hover:bg-slate-800"
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </Dialog>
    </div>
  );
}
