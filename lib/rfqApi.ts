import { api, checkUnauthorized, safeFetch } from "@/lib/api";

/** RFQ screens. There are no price fields: the backend neither returns nor accepts any. */
export type RfqStatus = "Draft" | "Sent" | "Converted";

export interface RfqItem {
  id?: number;
  product_id: number | null;
  item: string;
  description: string | null;
  quantity: number;
  unit: string | null;
}

export interface Rfq {
  id: number;
  label: string;
  supplier_id: number;
  vendor_name: string;
  title: string;
  rfq_date: string;
  bill_to: string | null;
  payment_terms: string | null;
  notes: string | null;
  status: RfqStatus;
  item_count: number;
  items: RfqItem[];
}

export interface RfqInput {
  supplier_id: number;
  title: string | null;
  rfq_date: string | null;
  bill_to: string | null;
  payment_terms: string | null;
  notes: string | null;
  items: RfqItem[];
}

export interface RfqOptions {
  rfq_enabled: boolean;
  default_bill_to: string;
  default_title: string;
}

export async function getRfqOptions(): Promise<RfqOptions> {
  try {
    const d = (await api.get("/rfq/options")) as Partial<RfqOptions> | null;
    return { rfq_enabled: d?.rfq_enabled === true, default_bill_to: d?.default_bill_to ?? "", default_title: d?.default_title ?? "" };
  } catch {
    return { rfq_enabled: false, default_bill_to: "", default_title: "" };
  }
}

export const listRfqs = () => api.get("/rfq/") as Promise<Rfq[]>;
export const getRfq = (id: number | string) => api.get(`/rfq/${id}`) as Promise<Rfq>;
export const createRfq = (b: RfqInput) => api.post("/rfq/", b) as Promise<Rfq>;
export const updateRfq = (id: number, b: RfqInput) => api.put(`/rfq/${id}`, b) as Promise<Rfq>;
export const setRfqStatus = (id: number, status: "Draft" | "Sent") => api.put(`/rfq/${id}/status`, { status }) as Promise<Rfq>;
export const deleteRfq = (id: number) => api(`/rfq/${id}`, { method: "DELETE" });

/** Downloads the RFQ PDF. The company seal is printed only when asked, like the quote PDF. */
export async function downloadRfqPdf(id: number, label: string, printSeal = false): Promise<void> {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await safeFetch(`${base}/rfq/${id}/pdf?print_seal=${printSeal}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    checkUnauthorized(res);
    let message = `HTTP ${res.status}`;
    try {
      const b = await res.json();
      if (b && typeof b.detail === "string") message = b.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  const url = URL.createObjectURL(new Blob([await res.arrayBuffer()], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${label}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
