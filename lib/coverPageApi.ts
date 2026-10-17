"use client";

import { api, checkUnauthorized } from "@/lib/api";

export type CoverDocType = "quote" | "invoice";

export interface CoverTemplate {
  doc_type: CoverDocType;
  body: string;
  enabled: boolean;
  is_default: boolean;
  updated_at: string | null;
  updated_by: string | null;
}

export interface CoverSettings {
  templates: CoverTemplate[];
  fields: Record<CoverDocType, string[]>;
  defaults: Record<CoverDocType, string>;
}

export const getCoverSettings = () => api.get("/cover-page/") as Promise<CoverSettings>;

export const saveCoverTemplate = (docType: CoverDocType, body: string, enabled: boolean) =>
  api.put(`/cover-page/${docType}`, { body, enabled }) as Promise<CoverTemplate>;

/** One-page PDF of the cover with sample data, using the (possibly unsaved) text. */
export async function fetchCoverPreview(docType: CoverDocType, body: string): Promise<Blob> {
  const rawBase = process.env.NEXT_PUBLIC_API_URL;
  if (!rawBase) throw new Error("Backend URL missing");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${rawBase.replace(/\/+$/, "")}/cover-page/${docType}/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ body }),
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
