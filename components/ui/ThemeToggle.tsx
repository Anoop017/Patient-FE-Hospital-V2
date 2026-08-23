"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: "pill" | "icon" | "full";
}

export function ThemeToggle({
  className,
  showLabel = false,
  variant = "icon",
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (resolvedTheme || theme) : "light";
  const isDark = currentTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-lg border border-border bg-background p-2 text-muted-foreground opacity-50",
          variant === "pill" && "rounded-full px-3 py-1.5 text-xs gap-2",
          variant === "full" && "w-full justify-start space-x-3 px-3 py-2 text-sm",
          className
        )}
      >
        <div className="h-4 w-4" />
        {showLabel && <span>Theme</span>}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer",
          className
        )}
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-700 dark:text-slate-200" />}
        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-background/80 backdrop-blur-sm px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 shadow-xs transition-all cursor-pointer",
          className
        )}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <>
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Light mode</span>
          </>
        ) : (
          <>
            <Moon className="h-3.5 w-3.5 text-slate-700" />
            <span>Dark mode</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 shadow-xs transition-all cursor-pointer",
        className
      )}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-500 transition-transform rotate-0 scale-100" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-transform rotate-0 scale-100" />
      )}
    </button>
  );
}
