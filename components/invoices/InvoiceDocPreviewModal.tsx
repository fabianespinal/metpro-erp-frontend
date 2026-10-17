"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  fetchInvoiceDoc,
  invoiceDocFilename,
  saveBlob,
  type InvoiceDocKind,
} from "@/lib/invoiceDocs";

const TITLES: Record<InvoiceDocKind, string> = {
  factura: "Vista previa de factura",
  conduce: "Vista previa de conduce",
};

interface Props {
  open: boolean;
  kind: InvoiceDocKind;
  invoiceId: number;
  invoiceNumber: string | number;
  onClose: () => void;
}

/** Renders the backend-generated PDF in an iframe. Same file the download produces. */
export default function InvoiceDocPreviewModal({ open, kind, invoiceId, invoiceNumber, onClose }: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Mounted fresh per preview (parent passes a key), so state starts clean.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    fetchInvoiceDoc(kind, invoiceId)
      .then((b) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(b);
        setBlob(b);
        setUrl(objectUrl);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "No se pudo generar el documento.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, kind, invoiceId]);

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
          <div className="flex gap-2">
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
          {loading && <p className="p-6 text-sm text-muted">Generando documento…</p>}
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
