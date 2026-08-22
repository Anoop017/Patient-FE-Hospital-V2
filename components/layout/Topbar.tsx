"use client"

import { Bell, Search, User, Moon, Sun } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import * as React from "react"

export function Topbar({ user }: { user: any }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex w-full max-w-md items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          type="search" 
          placeholder="Search..." 
          className="h-9 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 shadow-none"
        />
      </div>
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 rounded-full px-0"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {mounted && theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full px-0">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">
            {user
              ? (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : (user.name || user.email || "User"))
              : "Loading..."}
          </span>
        </div>
      </div>
    </header>
  )
}
