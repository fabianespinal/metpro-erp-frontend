"use client";

import { es } from "@/lib/i18n/es";
/**
 * Invoice documents: factura PDF and conduce PDF from the backend generators.
 *   GET /pdf/invoices/{id}          -> factura
 *   GET /pdf/invoices/{id}/conduce  -> conduce (delivery note)
 * Both require the Bearer token, so they are fetched as blobs (a plain link cannot send the header).
 */

import { checkUnauthorized, safeFetch } from "@/lib/api";
import { sealQuery } from "@/lib/sealApi";

export type InvoiceDocKind = "factura" | "conduce";

const PATHS: Record<InvoiceDocKind, (id: number) => string> = {
  factura: (id) => `/pdf/invoices/${id}`,
  conduce: (id) => `/pdf/invoices/${id}/conduce`,
};

/** F-10002 -> C-10002. Legacy INV-<timestamp> -> CD-<timestamp>. */
export function conduceNumber(invoiceNumber: string | number): string {
  const n = String(invoiceNumber);
  return n.startsWith("F-") ? `C-${n.slice(2)}` : n.replace("INV-", "CD-");
}

export function invoiceDocFilename(kind: InvoiceDocKind, invoiceNumber: string | number): string {
  return kind === "factura" ? `${invoiceNumber}_factura.pdf` : `${conduceNumber(invoiceNumber)}_conduce.pdf`;
}

export async function fetchInvoiceDoc(
  kind: InvoiceDocKind,
  invoiceId: number,
  printSeal: boolean = false
): Promise<Blob> {
  const rawBase = process.env.NEXT_PUBLIC_API_URL;
  if (!rawBase) throw new Error(es.fact.backendFalta);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await safeFetch(`${rawBase.replace(/\/+$/, "")}${PATHS[kind](invoiceId)}${sealQuery(printSeal)}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  if (!res.ok) {
    checkUnauthorized(res);
    let message = es.fact.errorHttp(res.status);
    try {
      const body = await res.json();
      if (body && typeof body.detail === "string") message = body.detail;
    } catch {
      /* non-JSON error body */
    }
    console.error(`Invoice ${kind} PDF failed`, { invoiceId, status: res.status, message });
    throw new Error(message);
  }

  // Force the PDF type so the browser renders it inline in the preview.
  return new Blob([await res.arrayBuffer()], { type: "application/pdf" });
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the download a moment to start before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadInvoiceDoc(
  kind: InvoiceDocKind,
  invoiceId: number,
  invoiceNumber: string | number
): Promise<void> {
  const blob = await fetchInvoiceDoc(kind, invoiceId);
  saveBlob(blob, invoiceDocFilename(kind, invoiceNumber));
}
