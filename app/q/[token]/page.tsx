"use client";
import { unwrapEnvelope } from "@/lib/api";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Public quote view by token. No login. Reads stored totals only.
// Backend: GET /quotes/public/{token} and GET /quotes/public/{token}/pdf

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface PublicQuoteItem {
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface PublicQuote {
  quote_id: string;
  quote_number?: number | null;
  project_name?: string | null;
  notes?: string | null;
  status: string;
  created_at?: string | null;
  valid_until?: string | null;
  payment_terms?: string | null;
  company_name?: string | null;
  contact_name?: string | null;
  items: PublicQuoteItem[];
  subtotal?: number | null;
  discount_total?: number | null;
  tax_amount?: number | null;
  grand_total?: number | null;
}

function fmt(n: unknown) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n) || 0);
}

function money(n: number | null | undefined) {
  return n === null || n === undefined ? "—" : fmt(n);
}

export default function PublicQuotePage() {
  const params = useParams();
  const token = params?.token as string;
  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${API_URL}/quotes/public/${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Quote not found");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setQuote(unwrapEnvelope(data) as PublicQuote);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar la cotización.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-muted">Cargando cotización...</p>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <p className="text-sm text-muted">{error || "Cotización no encontrada."}</p>
      </div>
    );
  }

  const pdfUrl = `${API_URL}/quotes/public/${encodeURIComponent(token)}/pdf`;

  return (
    <div className="min-h-screen bg-canvas px-4 py-10 text-ink">
      <div className="mx-auto max-w-2xl rounded-lg border border-line bg-surface p-8 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-lg font-semibold tracking-tight">
            Cotización #{quote.quote_number ?? "—"}
          </h1>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent underline"
          >
            Descargar PDF
          </a>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          {quote.company_name && (
            <div className="flex justify-between gap-4 border-b border-line pb-3">
              <dt className="text-muted">Cliente</dt>
              <dd className="text-right font-medium">{quote.company_name}</dd>
            </div>
          )}
          {quote.project_name && (
            <div className="flex justify-between gap-4 border-b border-line pb-3">
              <dt className="text-muted">Proyecto</dt>
              <dd className="text-right">{quote.project_name}</dd>
            </div>
          )}
          {quote.valid_until && (
            <div className="flex justify-between gap-4 border-b border-line pb-3">
              <dt className="text-muted">Válida hasta</dt>
              <dd className="text-right">{String(quote.valid_until).slice(0, 10)}</dd>
            </div>
          )}
        </dl>

        {quote.items?.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="py-2">Descripción</th>
                  <th className="py-2 text-right">Cant.</th>
                  <th className="py-2 text-right">Precio</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-line">
                    <td className="py-2">{item.product_name}</td>
                    <td className="py-2 text-right tabular-nums">{Number(item.quantity).toFixed(2)}</td>
                    <td className="py-2 text-right tabular-nums">{fmt(item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <dl className="mt-6 space-y-2 text-sm">
          {Number(quote.discount_total ?? 0) > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">Descuentos</dt>
              <dd className="tabular-nums">-{money(quote.discount_total)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{money(quote.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">ITBIS (18%)</dt>
            <dd className="tabular-nums">{money(quote.tax_amount)}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t-2 border-ink pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(quote.grand_total)}</dd>
          </div>
        </dl>

        {quote.payment_terms && (
          <p className="mt-6 text-sm text-muted">Condiciones de pago: {quote.payment_terms}</p>
        )}
        {quote.notes && (
          <p className="mt-4 whitespace-pre-line text-sm text-muted">{quote.notes}</p>
        )}
      </div>
    </div>
  );
}
