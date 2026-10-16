"use client";
import { unwrapEnvelope } from "@/lib/api";

import { useEffect, useState } from "react";

interface InvoicePublicViewProps {
  invoiceId: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function fmt(n: unknown) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n) || 0);
}

interface PublicInvoice {
  invoice_number: string;
  client_name?: string | null;
  total_amount?: number | string | null;
}

export default function InvoicePublicView({ invoiceId }: InvoicePublicViewProps) {
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/invoices/public/${invoiceId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Invoice not found");
        return res.json();
      })
      .then((data) => setInvoice(unwrapEnvelope(data)))
      .catch(() => setError("No se pudo cargar la factura."))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-muted">Cargando factura...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <p className="text-sm text-muted">{error || "Factura no encontrada."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-10 text-ink">
      <div className="mx-auto max-w-xl rounded-lg border border-line bg-surface p-8 shadow-card">
        <h1 className="text-lg font-semibold tracking-tight">
          Factura #{invoice.invoice_number}
        </h1>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-line pb-3">
            <dt className="text-muted">Cliente</dt>
            <dd className="text-right font-medium">{invoice.client_name}</dd>
          </div>
          <div className="flex justify-between gap-4 pb-1">
            <dt className="text-muted">Total</dt>
            <dd className="text-right text-base font-semibold tabular-nums">{fmt(invoice.total_amount)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
