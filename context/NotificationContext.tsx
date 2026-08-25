"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { NotificationItem, NotificationsResponse } from "@/types/notification";

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (params?: {
    page?: number;
    take?: number;
    isRead?: boolean;
    type?: string;
    search?: string;
  }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const prevCountRef = useRef<number>(0);

  // Fetch unread count for badge
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get("/notifications/unread-count");
      const count = typeof res?.data?.count === "number" ? res.data.count : (typeof res?.data === "number" ? res.data : 0);
      setUnreadCount(count);
      prevCountRef.current = count;
    } catch {
      // Ignore if unauthenticated or offline
    }
  }, [user]);

  // Fetch full notifications list
  const fetchNotifications = useCallback(
    async (params?: {
      page?: number;
      take?: number;
      isRead?: boolean;
      type?: string;
      search?: string;
    }) => {
      if (!user) return;
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", String(params.page));
        queryParams.append("take", String(params?.take || 20));
        if (params?.isRead !== undefined) queryParams.append("isRead", String(params.isRead));
        if (params?.type && params.type !== "all") queryParams.append("type", params.type);
        if (params?.search) queryParams.append("search", params.search);

        const res = await api.get(`/notifications?${queryParams.toString()}`);
        const data = res?.data;
        const list: NotificationItem[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setNotifications(list);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Mark a single notification as read
  const markAsRead = async (id: number) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await api.patch(`/notifications/${id}/read`);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      fetchUnreadCount();
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await api.patch("/notifications/read-all");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      fetchUnreadCount();
    }
  };

  // Delete / dismiss notification
  const deleteNotification = async (id: number) => {
    try {
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      fetchNotifications();
    }
  };

  // Initial load and polling (every 30 seconds)
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    const handleFocus = () => {
      fetchUnreadCount();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user, fetchUnreadCount, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
