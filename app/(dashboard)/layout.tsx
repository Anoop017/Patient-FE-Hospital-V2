"use client";

import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { useAuth } from "@/context/AuthContext"
import { SidebarProvider } from "@/context/SidebarContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !role) {
      router.push("/login");
    }
  }, [isLoading, role, router]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!role) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar role={role} />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Topbar user={user} />
          <main className="flex-1 overflow-y-auto bg-muted/20 p-3 sm:p-4 md:p-6 pb-20 sm:pb-6 touch-scroll">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
