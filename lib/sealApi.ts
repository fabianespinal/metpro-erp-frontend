"use client";

import { api, checkUnauthorized, safeFetch } from "@/lib/api";

/** Company seal status. The storage path never reaches the browser. */
export interface SealSettings {
  configured: boolean;
  enabled_by_default: boolean;
  storage_ready: boolean;
  updated_at: string | null;
  updated_by: string | null;
}

export const getSealSettings = () => api.get("/company-settings/seal") as Promise<SealSettings>;

/** Pre-checks "Imprimir sello" in the document dialogs. It never prints a seal by itself. */
export const setSealDefault = (enabled: boolean) =>
  api.put("/company-settings/seal", { enabled_by_default: enabled }) as Promise<SealSettings>;

/** Upload or replace the seal (PNG or JPG, max 5 MB). */
export function uploadSealImage(file: File): Promise<SealSettings> {
  const fd = new FormData();
  fd.append("file", file, file.name);
  return api.post("/company-settings/seal/image", fd) as Promise<SealSettings>;
}

/** The stored seal as an image, for the settings preview. */
export async function fetchSealImage(): Promise<Blob> {
  const rawBase = process.env.NEXT_PUBLIC_API_URL;
  if (!rawBase) throw new Error("Backend URL missing");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await safeFetch(`${rawBase.replace(/\/+$/, "")}/company-settings/seal/image`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    checkUnauthorized(res);
    throw new Error(`Error ${res.status}`);
  }
  return new Blob([await res.arrayBuffer()], { type: "image/png" });
}

/**
 * Query string for a PDF request. The seal is stateless: it prints only when a request asks for it,
 * so only an explicit true adds the parameter. Everything else leaves the URL as it always was.
 */
export function sealQuery(printSeal: boolean): string {
  return printSeal === true ? "?print_seal=true" : "";
}
