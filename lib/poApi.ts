import { api, checkUnauthorized, safeFetch } from "@/lib/api";

/** Purchase order screens. Admin and superadmin only. Amounts and totals are computed by the backend. */
export type PoStatus = "Draft" | "Issued" | "Cancelled";

export interface PoItem {
  id?: number;
  product_id: number | null;
  item: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  amount?: number;
}

export interface Po {
  id: number;
  label: string;
  rfq_id: number | null;
  rfq_label: string | null;
  supplier_id: number;
  vendor_name: string;
  title: string;
  po_date: string;
  bill_to: string | null;
  payment_terms: string | null;
  notes: string | null;
  status: PoStatus;
  subtotal: number;
  total: number;
  item_count: number;
  items: PoItem[];
}

export interface PoInput {
  supplier_id: number;
  title: string | null;
  po_date: string | null;
  bill_to: string | null;
  payment_terms: string | null;
  notes: string | null;
  items: PoItem[];
}

export async function getPoEnabled(): Promise<boolean> {
  try {
    const d = (await api.get("/po/options")) as { po_enabled?: boolean } | null;
    return d?.po_enabled === true;
  } catch {
    return false;
  }
}

export const listPos = () => api.get("/po/") as Promise<Po[]>;
export const getPo = (id: number | string) => api.get(`/po/${id}`) as Promise<Po>;
export const createPo = (b: PoInput) => api.post("/po/", b) as Promise<Po>;
export const updatePo = (id: number, b: PoInput) => api.put(`/po/${id}`, b) as Promise<Po>;
export const setPoStatus = (id: number, status: "Issued" | "Cancelled") => api.put(`/po/${id}/status`, { status }) as Promise<Po>;
export const deletePo = (id: number) => api(`/po/${id}`, { method: "DELETE" });
export const convertRfqToPo = (rfqId: number) => api.post(`/po/from-rfq/${rfqId}`, {}) as Promise<Po>;

/** Display-only line amount; the backend value wins after every save. */
export const lineAmount = (q: number, p: number) => Math.round((Number(q) || 0) * (Number(p) || 0) * 100) / 100;

export async function downloadPoPdf(id: number, label: string, printSeal = false): Promise<void> {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await safeFetch(`${base}/po/${id}/pdf?print_seal=${printSeal}`, {
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
