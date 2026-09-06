"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  ArrowRight,
  AlertCircle,
  Loader2,
  LogIn,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { setTheme } = useTheme();

  // Enforce light mode on register page
  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      const msg = "Passwords do not match";
      setError(msg);
      toast.error("Validation Error", msg);
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/register", { firstName, lastName, mobile, email, password });
      toast.success("Account Created!", "Your patient profile is ready. Please sign in.");
      router.push("/login?registered=true");
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Registration failed. Please try again.";
      setError(errMsg);
      toast.error("Registration Failed", errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh w-full flex flex-col justify-center items-center lg:items-start px-4 py-6 sm:px-6 sm:py-10 lg:px-12 xl:px-20 2xl:px-28 overflow-y-auto selection:bg-teal-500 selection:text-white">
      {/* Full Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-center lg:bg-right pointer-events-none transition-all duration-500"
        style={{ backgroundImage: `url('/hospital-fe-signup.png')` }}
      />
      {/* Mobile subtle overlay so text stays razor sharp */}
      <div className="fixed inset-0 bg-white/25 lg:bg-transparent pointer-events-none" />

      {/* Main Registration Card - positioned on the left */}
      <div className="relative z-10 w-full max-w-[430px] sm:max-w-[460px] rounded-2xl sm:rounded-3xl border border-white/90 bg-white/95 text-slate-900 shadow-xl sm:shadow-2xl shadow-slate-900/10 p-5 sm:p-7 backdrop-blur-xl transition-all my-auto">
        {/* Card Header */}
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 mb-1.5">
            <UserPlus className="h-3 w-3" />
            <span>New Patient Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Create an Account
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            Enter your personal details to register as a patient
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Doctors & Staff accounts are managed by administration.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 sm:mt-5 space-y-3 sm:space-y-3.5">
          {/* Error Alert */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name Row - 2 columns even on mobile for compact vertical footprint */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-xs font-semibold text-slate-700">
                First Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                  className="pl-8 sm:pl-9 h-9 sm:h-10 rounded-xl text-xs sm:text-sm bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-xs font-semibold text-slate-700">
                Last Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                  className="pl-8 sm:pl-9 h-9 sm:h-10 rounded-xl text-xs sm:text-sm bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Mobile Number */}
          <div className="space-y-1">
            <Label htmlFor="mobile" className="text-xs font-semibold text-slate-700">
              Mobile Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+1 234 567 8900"
                required
                className="pl-8 sm:pl-9 h-9 sm:h-10 rounded-xl text-xs sm:text-sm bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@example.com"
                required
                className="pl-8 sm:pl-9 h-9 sm:h-10 rounded-xl text-xs sm:text-sm bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900"
              />
            </div>
          </div>

          {/* Password & Confirm Password - 2 columns for compact vertical footprint */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="pl-8 sm:pl-9 pr-7 h-9 sm:h-10 rounded-xl text-xs sm:text-sm bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700">
                Confirm
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm"
                  required
                  className="pl-8 sm:pl-9 pr-7 h-9 sm:h-10 rounded-xl text-xs sm:text-sm bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
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
                <span>Registering account...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>Create Patient Account</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>

          {/* Sign In Footer */}
          <div className="pt-1 text-center space-y-1.5">
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              Already have an account?
            </p>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 bg-slate-100/70 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
