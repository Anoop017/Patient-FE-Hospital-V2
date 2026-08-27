"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Hospital, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, Loader2, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", { email, password });
      const { accessToken, user } = response.data;
      const roles = user?.roles || [];
      
      login(accessToken, roles, user);

      const isPatient = roles.some((r: any) => r.name === "patient");
      const isDoctor = roles.some((r: any) => r.name === "doctor");
      const isStaff = roles.some((r: any) => ["staff", "nurse"].includes(r.name));

      if (isPatient) {
        router.push("/patient/dashboard");
      } else if (isDoctor) {
        router.push("/doctor/dashboard");
      } else if (isStaff) {
        router.push("/staff/dashboard");
      } else {
        router.push("/patient/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle variant="pill" />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Hospital className="h-12 w-12" />
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Dashboard for Patients, Doctors, and Staff
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to continue.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotError("");
                      setForgotMessage("");
                      setIsForgotOpen(true);
                    }}
                    className="text-sm font-medium text-foreground/80 hover:text-foreground hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-foreground hover:underline">
                  Sign up as a Patient
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Forgot Password Modal Dialog */}
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <div className="space-y-4">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">
              Forgot your password?
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              Enter the email address associated with your account and we&apos;ll send you a password reset link.
            </DialogDescription>
          </DialogHeader>

          {forgotMessage ? (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1">Check your email</p>
                  <p>{forgotMessage}</p>
                </div>
              </div>
              <DialogFooter className="sm:justify-center pt-2">
                <Button
                  type="button"
                  className="w-full sm:w-auto min-w-[140px]"
                  onClick={() => setIsForgotOpen(false)}
                >
                  Back to Sign In
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {forgotError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email address</Label>
                <div className="relative">
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoFocus
                    className="pl-9"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsForgotOpen(false)}
                  disabled={forgotLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail.trim()}
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
