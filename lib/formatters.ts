/**
 * Standardized healthcare formatting utilities.
 * Transforms raw database keys and ISO timestamps into professional clinical identifiers.
 */

/**
 * Format a patient identifier into a Medical Record Number (MRN).
 * Example: 104 -> "MRN-00104"
 */
export function formatMRN(id?: number | string | null): string {
  if (id === undefined || id === null || id === "") return "MRN-00000";
  const str = String(id).trim();
  if (!isNaN(Number(str))) {
    return `MRN-${str.padStart(5, "0")}`;
  }
  return `MRN-${str.slice(0, 6).toUpperCase()}`;
}

/**
 * Format an appointment identifier into a clinical encounter reference.
 * Example: 42 -> "APT-00042"
 */
export function formatAppointmentRef(id?: number | string | null): string {
  if (id === undefined || id === null || id === "") return "APT-00000";
  const str = String(id).trim();
  if (!isNaN(Number(str))) {
    return `APT-${str.padStart(5, "0")}`;
  }
  return `APT-${str.slice(0, 6).toUpperCase()}`;
}

/**
 * Format an inpatient admission identifier into a hospital admission reference.
 * Example: 15 -> "ADM-00015"
 */
export function formatAdmissionRef(id?: number | string | null): string {
  if (id === undefined || id === null || id === "") return "ADM-00000";
  const str = String(id).trim();
  if (!isNaN(Number(str))) {
    return `ADM-${str.padStart(5, "0")}`;
  }
  return `ADM-${str.slice(0, 6).toUpperCase()}`;
}

/**
 * Format a laboratory order identifier into a clinical accession number.
 * Example: 3 -> "LAB-00003"
 */
export function formatLabOrderRef(id?: number | string | null): string {
  if (id === undefined || id === null || id === "") return "LAB-00000";
  const str = String(id).trim();
  if (!isNaN(Number(str))) {
    return `LAB-${str.padStart(5, "0")}`;
  }
  return `LAB-${str.slice(0, 6).toUpperCase()}`;
}

/**
 * Format a prescription identifier into an Rx order reference.
 * Example: 88 -> "RX-00088"
 */
export function formatPrescriptionRef(id?: number | string | null): string {
  if (id === undefined || id === null || id === "") return "RX-00000";
  const str = String(id).trim();
  if (!isNaN(Number(str))) {
    return `RX-${str.padStart(5, "0")}`;
  }
  return `RX-${str.slice(0, 6).toUpperCase()}`;
}

/**
 * Format an invoice/billing identifier.
 * Example: 2 -> "INV-00002"
 */
export function formatInvoiceRef(id?: number | string | null): string {
  if (id === undefined || id === null || id === "") return "INV-00000";
  const str = String(id).trim();
  if (!isNaN(Number(str))) {
    return `INV-${str.padStart(5, "0")}`;
  }
  return `INV-${str.slice(0, 8).toUpperCase()}`;
}

/**
 * Format currency to standard USD representation.
 * Example: 500 -> "$500.00"
 */
export function formatCurrency(amount?: number | string | null): string {
  if (amount === undefined || amount === null || amount === "") return "$0.00";
  const num = typeof amount === "number" ? amount : parseFloat(String(amount));
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format date & time into a human-friendly readable string.
 * Example: "Sep 11, 2026 • 9:30 AM"
 */
export function formatDateTime(date?: string | Date | null): string {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    const datePart = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timePart = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} • ${timePart}`;
  } catch {
    return "—";
  }
}

/**
 * Format date into a human-friendly string.
 * Example: "Sep 11, 2026"
 */
export function formatDate(date?: string | Date | null): string {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * Format time into a human-friendly string.
 * Example: "9:30 AM"
 */
export function formatTime(date?: string | Date | null): string {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}
