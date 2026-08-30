/**
 * Helper utility for triggering PDF report downloads & telemetry from the Go microservice.
 */

const DEFAULT_GO_SERVICE_URL = process.env.NEXT_PUBLIC_GO_SERVICE_URL || "http://localhost:4000";
const DEFAULT_WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/api/v1/ws/vitals";

export function getReportsBaseUrl(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_REPORTS_URL) {
    return process.env.NEXT_PUBLIC_REPORTS_URL;
  }
  return `${DEFAULT_GO_SERVICE_URL}/api/v1/reports`;
}

export function getAccessToken(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken") || localStorage.getItem("token") || "";
  }
  return "";
}

/**
 * Constructs the direct PDF download URL with authentication token.
 * 
 * Supported endpoints:
 * - billing: /api/v1/reports/billing/{billId}?token={accessToken}
 * - discharge: /api/v1/reports/discharge/{admissionId}?token={accessToken}
 * - lab: /api/v1/reports/lab/{labTestId}?token={accessToken}
 */
export function getReportDownloadUrl(type: "billing" | "discharge" | "lab", id: string | number): string {
  const baseUrl = getReportsBaseUrl();
  const token = getAccessToken();
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${baseUrl}/${type}/${id}${tokenParam}`;
}

/**
 * Triggers PDF report download in a new tab / window.
 */
export function downloadReport(type: "billing" | "discharge" | "lab", id: string | number) {
  if (typeof window !== "undefined") {
    const url = getReportDownloadUrl(type, id);
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Returns the WebSocket endpoint for real-time patient ICU telemetry.
 */
export function getVitalsWsUrl(patientId?: number | string, admissionId?: number | string): string {
  const params = new URLSearchParams();
  if (patientId) params.append("patientId", String(patientId));
  if (admissionId) params.append("admissionId", String(admissionId));
  const queryString = params.toString();
  return queryString ? `${DEFAULT_WS_URL}?${queryString}` : DEFAULT_WS_URL;
}

/**
 * Fetches time-series historical vitals from the Go microservice.
 */
export async function fetchVitalsHistory(patientId: number | string, hours = 24, limit = 100) {
  const token = getAccessToken();
  const res = await fetch(`${DEFAULT_GO_SERVICE_URL}/api/v1/vitals/history/${patientId}?hours=${hours}&limit=${limit}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch vitals history");
  return res.json();
}

/**
 * Fetches recent warning and critical telemetry alerts.
 */
export async function fetchRecentVitalsAlerts(limit = 20) {
  const token = getAccessToken();
  const res = await fetch(`${DEFAULT_GO_SERVICE_URL}/api/v1/vitals/alerts?limit=${limit}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch vitals alerts");
  return res.json();
}
