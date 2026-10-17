"use client";

import { api, checkUnauthorized } from "@/lib/api";

export interface TermsSettings {
  enabled_quote: boolean;
  enabled_invoice: boolean;
  sections: Record<string, string>;
  is_default: boolean;
  updated_at: string | null;
  updated_by: string | null;
  titles: Record<string, string>;
  order: string[];
  defaults: Record<string, string>;
}

export const getTerms = () => api.get("/terms/") as Promise<TermsSettings>;

export const saveTerms = (sections: Record<string, string>, enabledQuote: boolean, enabledInvoice: boolean) =>
  api.put("/terms/", {
    sections,
    enabled_quote: enabledQuote,
    enabled_invoice: enabledInvoice,
  }) as Promise<TermsSettings>;

/** PDF of the terms using the (possibly unsaved) text. */
export async function fetchTermsPreview(sections: Record<string, string>): Promise<Blob> {
  const rawBase = process.env.NEXT_PUBLIC_API_URL;
  if (!rawBase) throw new Error("Backend URL missing");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${rawBase.replace(/\/+$/, "")}/terms/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ sections }),
    cache: "no-store",
  });

  if (!res.ok) {
    checkUnauthorized(res);
    let message = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data && typeof data.detail === "string") message = data.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  return new Blob([await res.arrayBuffer()], { type: "application/pdf" });
}
