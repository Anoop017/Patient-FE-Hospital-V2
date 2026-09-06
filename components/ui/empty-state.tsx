import React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border/70 bg-muted/10",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3 shadow-xs">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="outline" className="mt-4 text-xs font-semibold">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
