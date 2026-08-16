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
          "bg-gray-800 text-white": variant === "success",
          "bg-gray-500 text-white": variant === "warning",
          "bg-gray-950 text-white": variant === "destructive",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
