export type NotificationType =
  | "appointment"
  | "admission"
  | "billing"
  | "lab"
  | "prescription"
  | "system";

export type NotificationPriority = "info" | "warning" | "urgent";

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType | string;
  priority: NotificationPriority | string;
  isRead: boolean;
  link?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface NotificationPaginationMeta {
  page: number;
  take: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface NotificationsResponse {
  data: NotificationItem[];
  meta?: NotificationPaginationMeta;
}
