/**
 * Client API for interacting with the Go Microservice Webhook Dispatcher & Event Ingestion Subsystem.
 */

const DEFAULT_GO_SERVICE_URL = process.env.NEXT_PUBLIC_GO_SERVICE_URL || "http://localhost:4000";

function getAccessToken(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken") || localStorage.getItem("token") || "";
  }
  return "";
}

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface WebhookSubscription {
  id: number;
  name: string;
  targetUrl: string;
  secretToken: string;
  eventTypes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface WebhookLog {
  id: number;
  subscriptionId: number;
  eventType: string;
  payload: any;
  responseStatus: number | null;
  responseBody: string | null;
  attemptCount: number;
  status: "SUCCESS" | "FAILED" | "PENDING" | string;
  createdAt: string;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  environment: string;
  services: {
    postgres: string;
    mongodb: string;
    redis: string;
    grpc: string;
  };
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const res = await fetch(`${DEFAULT_GO_SERVICE_URL}/health`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function fetchWebhookSubscriptions(): Promise<WebhookSubscription[]> {
  const res = await fetch(`${DEFAULT_GO_SERVICE_URL}/api/v1/webhooks/subscriptions`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch webhook subscriptions");
  const data = await res.json();
  return data?.data || [];
}

export async function createWebhookSubscription(params: {
  name: string;
  targetUrl: string;
  eventTypes: string[];
  secretToken?: string;
}): Promise<WebhookSubscription> {
  const res = await fetch(`${DEFAULT_GO_SERVICE_URL}/api/v1/webhooks/subscriptions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to create subscription" }));
    throw new Error(err.error || err.details || "Subscription creation failed");
  }
  const data = await res.json();
  return data?.data;
}

export async function deleteWebhookSubscription(id: number | string): Promise<void> {
  const res = await fetch(`${DEFAULT_GO_SERVICE_URL}/api/v1/webhooks/subscriptions/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete webhook subscription");
}

export async function fetchWebhookLogs(limit = 50): Promise<WebhookLog[]> {
  const res = await fetch(`${DEFAULT_GO_SERVICE_URL}/api/v1/webhooks/logs?limit=${limit}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch webhook delivery logs");
  const data = await res.json();
  return data?.data || [];
}

export async function publishTestEvent(event: string, data: any): Promise<any> {
  const res = await fetch(`${DEFAULT_GO_SERVICE_URL}/api/v1/events/publish`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ event, data }),
  });
  if (!res.ok) throw new Error("Failed to publish event to Go worker pool");
  return res.json();
}
