"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import SealCheckbox from "@/components/SealCheckbox";
import { useSealSettings } from "@/lib/useSealSettings";
import {
  fetchInvoiceDoc,
  invoiceDocFilename,
  saveBlob,
  type InvoiceDocKind,
} from "@/lib/invoiceDocs";

const TITLES: Record<InvoiceDocKind, string> = {
  factura: "Vista previa Factura",
  conduce: "Vista previa Conduce",
};

interface Props {
  open: boolean;
  kind: InvoiceDocKind;
  invoiceId: number;
  invoiceNumber: string | number;
  onClose: () => void;
}

interface DocResult {
  key: string;
  blob?: Blob;
  url?: string;
  error?: string;
}

/** Renders the backend-generated PDF in an iframe. Same file the download produces. */
export default function InvoiceDocPreviewModal({ open, kind, invoiceId, invoiceNumber, onClose }: Props) {
  const seal = useSealSettings(open);
  // null = follow the company default. The user can override it for this document.
  const [sealChoice, setSealChoice] = useState<boolean | null>(null);
  const printSeal = seal.configured && (sealChoice ?? seal.enabledByDefault);
  const requestKey = `${kind}:${invoiceId}:${printSeal ? "seal" : "plain"}`;
  // The result is tagged with the request it answers, so a change of option shows "Generando" until the new PDF arrives.
  const [result, setResult] = useState<DocResult | null>(null);
  const current = result?.key === requestKey ? result : null;
  const loading = !current;
  const blob = current?.blob ?? null;
  const url = current?.url ?? null;
  const error = current?.error ?? null;

  useEffect(() => {
    // Wait for the seal setting so the first request already has the right option.
    if (!open || !seal.ready) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    fetchInvoiceDoc(kind, invoiceId, printSeal)
      .then((b) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(b);
        setResult({ key: requestKey, blob: b, url: objectUrl });
      })
      .catch((err: Error) => {
        if (!cancelled) setResult({ key: requestKey, error: err.message || "No se pudo generar el documento." });
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, kind, invoiceId, printSeal, requestKey, seal.ready]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={TITLES[kind]}
      onClick={onClose}
    >
      <div
        className="flex h-full max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h2 className="text-base font-semibold text-ink">
            {TITLES[kind]} · {invoiceNumber}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            {seal.configured && <SealCheckbox checked={printSeal} onChange={setSealChoice} />}
            <Button
              onClick={() => blob && saveBlob(blob, invoiceDocFilename(kind, invoiceNumber))}
              disabled={!blob}
            >
              Descargar
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
        <div className="flex-1 bg-canvas">
          {loading && !error && <p className="p-6 text-sm text-muted">Generando documento…</p>}
          {error && (
            <p role="alert" className="m-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              No se pudo generar el documento: {error}
            </p>
          )}
          {url && <iframe title={TITLES[kind]} src={url} className="h-full w-full border-0" />}
        </div>
      </div>
    </div>
  );
}
