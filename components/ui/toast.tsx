"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global event bus so `toast.success(...)` can be called from anywhere without hooks if needed
type ToastListener = (toast: Omit<ToastItem, "id">) => void;
const listeners = new Set<ToastListener>();

export const toast = {
  success: (title: string, description?: string) => {
    listeners.forEach((l) => l({ type: "success", title, description }));
  },
  error: (title: string, description?: string) => {
    listeners.forEach((l) => l({ type: "error", title, description }));
  },
  warning: (title: string, description?: string) => {
    listeners.forEach((l) => l({ type: "warning", title, description }));
  },
  info: (title: string, description?: string) => {
    listeners.forEach((l) => l({ type: "info", title, description }));
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (item: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = { ...item, id };
      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 on screen

      const duration = item.duration || 4500;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  useEffect(() => {
    listeners.add(addToast);
    return () => {
      listeners.delete(addToast);
    };
  }, [addToast]);

  const success = useCallback((title: string, description?: string) => addToast({ type: "success", title, description }), [addToast]);
  const error = useCallback((title: string, description?: string) => addToast({ type: "error", title, description }), [addToast]);
  const warning = useCallback((title: string, description?: string) => addToast({ type: "warning", title, description }), [addToast]);
  const info = useCallback((title: string, description?: string) => addToast({ type: "info", title, description }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div
      aria-live="assertive"
      className="fixed top-4 right-4 z-50 flex max-h-screen w-full max-w-sm flex-col gap-2 pointer-events-none p-2 sm:p-0"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />;
      case "info":
        return <Info className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case "success":
        return "border-emerald-500/40 bg-background/95";
      case "error":
        return "border-red-500/50 bg-background/95";
      case "warning":
        return "border-amber-500/40 bg-background/95";
      case "info":
        return "border-sky-500/40 bg-background/95";
    }
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 fade-in-50",
        getBorderColor()
      )}
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-foreground leading-tight">{toast.title}</h4>
        {toast.description && (
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
