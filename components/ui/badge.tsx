import * as React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "success" | "warning" | "destructive"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          "bg-primary text-primary-foreground": variant === "default",
          "border border-border text-foreground": variant === "outline",
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30": variant === "success",
          "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30": variant === "warning",
          "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30": variant === "destructive",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
