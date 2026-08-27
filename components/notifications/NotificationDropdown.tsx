"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  CreditCard,
  Activity,
  Building2,
  AlertCircle,
  FileText,
  Inbox,
  RefreshCw,
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import { NotificationItem, NotificationType } from "@/types/notification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const { role } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // When opening dropdown, refresh notifications
  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
      fetchUnreadCount();
    }
    setIsOpen(!isOpen);
  };

  // Helper to format relative time
  const formatTimeAgo = (dateString: string) => {
    try {
      const now = new Date();
      const past = new Date(dateString);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return past.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  // Resolve target link according to current user role and notification type
  const resolveTargetRoute = (notification: NotificationItem): string => {
    const userRole = role || "patient";
    const { link, type } = notification;

    if (link) {
      if (link.startsWith(`/${userRole}/dashboard`)) return link;
      const cleanPath = link.replace(/^\/portal/, "").replace(/^\//, "");
      return `/${userRole}/dashboard/${cleanPath}`;
    }

    switch (type) {
      case "appointment":
        return `/${userRole}/dashboard/appointments`;
      case "billing":
        return `/${userRole}/dashboard/billing`;
      case "prescription":
        return `/${userRole}/dashboard/prescriptions`;
      case "lab":
        return `/${userRole}/dashboard/lab-tests`;
      case "admission":
        return `/${userRole}/dashboard/admissions`;
      default:
        return `/${userRole}/dashboard`;
    }
  };

  // Handle clicking a notification item
  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
    const targetUrl = resolveTargetRoute(notification);
    router.push(targetUrl);
  };

  // Render category icon
  const getCategoryIcon = (type: NotificationType | string) => {
    switch (type) {
      case "appointment":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <Calendar className="h-4 w-4" />
          </div>
        );
      case "prescription":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <FileText className="h-4 w-4" />
          </div>
        );
      case "lab":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
            <Activity className="h-4 w-4" />
          </div>
        );
      case "admission":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <Building2 className="h-4 w-4" />
          </div>
        );
      case "billing":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <CreditCard className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
            <Bell className="h-4 w-4" />
          </div>
        );
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "appointment") return n.type === "appointment";
    if (filter === "billing") return n.type === "billing";
    if (filter === "clinical") return ["prescription", "lab", "admission"].includes(n.type);
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="relative h-9 w-9 rounded-full px-0 hover:bg-muted focus:ring-2 focus:ring-ring"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4 text-foreground" />
        {unreadCount > 0 && (
          <>
            {/* Animated Pulse Ring */}
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </span>
          </>
        )}
      </Button>

      {/* Notifications Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm rounded-xl border border-border bg-background shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 font-semibold bg-primary">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors p-1 rounded hover:bg-muted"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  fetchNotifications();
                  fetchUnreadCount();
                }}
                className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
                title="Refresh notifications"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/10 overflow-x-auto no-scrollbar text-xs">
            {[
              { id: "all", label: "All" },
              { id: "unread", label: `Unread (${unreadCount})` },
              { id: "appointment", label: "Appointments" },
              { id: "billing", label: "Billing" },
              { id: "clinical", label: "Clinical" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0 ${
                  filter === tab.id
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications Feed */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                <span>Loading notifications...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
                  <Inbox className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                  {filter === "unread"
                    ? "You have no unread notifications."
                    : "No notifications found in this category."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-muted/50 ${
                    !item.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  {/* Category Icon */}
                  {getCategoryIcon(item.type)}

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-semibold truncate ${!item.isRead ? "text-foreground font-bold" : "text-foreground/90"}`}>
                        {item.title}
                      </span>
                      {item.priority === "urgent" && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/15 text-red-600 dark:text-red-400">
                          Urgent
                        </span>
                      )}
                      {item.priority === "warning" && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          Important
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground/80">
                      <span>{formatTimeAgo(item.createdAt)}</span>
                      <span className="capitalize text-muted-foreground">• {item.type}</span>
                    </div>
                  </div>

                  {/* Actions & Unread Indicator */}
                  <div className="absolute right-3 top-3.5 flex items-center gap-1">
                    {!item.isRead && (
                      <span
                        className="h-2 w-2 rounded-full bg-primary shrink-0 group-hover:hidden"
                        title="Unread"
                      />
                    )}
                    <div className="hidden group-hover:flex items-center gap-1">
                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(item.id);
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(item.id);
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors"
                        title="Dismiss notification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 bg-muted/20 text-[11px] text-muted-foreground">
            <span>
              {notifications.length} total alert{notifications.length === 1 ? "" : "s"}
            </span>
            <span className="text-[10px] text-muted-foreground/70">
              Live updates enabled
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
