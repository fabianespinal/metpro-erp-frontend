"use client";

/**
 * Internal "full copy": opens the PDF with every line, including the ones hidden from the customer
 * (quote checkbox off, or a line flagged "no imprimir"). Totals are the same as the customer PDF.
 * Shown only to admins when the backend switch PDF_FULL_COPY_ENABLED is on. Opens in a new tab: print from there.
 * Never attached to email or public links.
 */

import { useState } from "react";
import { es } from "@/lib/i18n/es";
import { checkUnauthorized, safeFetch } from "@/lib/api";
import { useCurrentRole } from "@/lib/currentRole";
import { usePdfOptions } from "@/lib/pdfOptions";

export default function FullCopyButton({
  kind,
  id,
  className = "",
}: {
  kind: "quote" | "invoice";
  id: string | number;
  className?: string;
}) {
  const { isAdmin } = useCurrentRole();
  const { full_copy_enabled } = usePdfOptions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAdmin || !full_copy_enabled) return null;

  async function open() {
    setBusy(true);
    setError(null);
    const tab = window.open("", "_blank"); // opened first so the browser does not block it
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
      const token = localStorage.getItem("token");
      const path = kind === "quote" ? `/pdf/quotes/${id}?full=true` : `/pdf/invoices/${id}?full=true`;
      const res = await safeFetch(`${base}${path}`, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      if (!res.ok) {
        checkUnauthorized(res);
        let message = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          if (body && typeof body.detail === "string") message = body.detail;
        } catch {
          /* non-JSON error body */
        }
        throw new Error(message);
      }
      const url = URL.createObjectURL(new Blob([await res.arrayBuffer()], { type: "application/pdf" }));
      if (tab) tab.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      tab?.close();
      setError(es.cot.copiaCompletaError + (e instanceof Error ? e.message : ""));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={`inline-flex flex-col gap-1 print:hidden ${className}`}>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        title={es.cot.copiaCompletaAyuda}
        className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-canvas disabled:opacity-50"
      >
        {es.cot.copiaCompleta}
      </button>
      {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
