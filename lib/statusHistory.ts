/**
 * Status history (S2): who changed a quote or invoice status, and when.
 * Backend: GET /quotes/{id}/status-history, GET /invoices/{id}/status-history.
 * The list rows carry last_status_by / last_status_at (null while the backend switch is off).
 */
import { api } from "@/lib/api";
import { fmtDateTime } from "@/lib/dates";

export type HistoryKind = "quote" | "invoice";

export interface HistoryEntry {
  from_status: string | null;
  to_status: string;
  actor_name: string | null;
  changed_at: string;
}

export interface StatusHistory {
  enabled: boolean;
  current_status: string;
  entries: HistoryEntry[];
}

export async function fetchStatusHistory(kind: HistoryKind, id: string | number): Promise<StatusHistory> {
  const base = kind === "quote" ? "/quotes" : "/invoices";
  const r = (await api(`${base}/${encodeURIComponent(String(id))}/status-history`)) as Partial<StatusHistory> | null;
  return {
    enabled: r?.enabled === true,
    current_status: String(r?.current_status ?? ""),
    entries: Array.isArray(r?.entries) ? (r!.entries as HistoryEntry[]) : [],
  };
}

/** "por Ana · 23/10/2026 12:05", or null when the row has no recorded change. */
export function lastChangeText(by: string | null | undefined, at: string | null | undefined): string | null {
  const when = fmtDateTime(at);
  if (!by && !when) return null;
  return ["por " + (by || "—"), when].filter(Boolean).join(" · ");
}
