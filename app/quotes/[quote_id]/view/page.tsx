"use client";
import { es } from "@/lib/i18n/es";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { api } from "@/lib/api";
import type { DynamicCharge } from "@/lib/quotingApi";
import { dt } from "@/components/ui/data-table";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QuoteCostEstimate from "@/components/quotes/QuoteCostEstimate";
import { localDate } from "@/lib/dates";


interface QuoteItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_type?: string;
  discount_value?: number;
}

interface Quote {
  quote_id: string;
  quote_number?: number | null;
  project_name: string;
  notes: string;
  status: string;
  created_by_name?: string | null;
  created_at: string;
  valid_until?: string;
  payment_terms?: string;
  total_amount: number;
  subtotal?: number | null;
  discount_total?: number | null;
  tax_amount?: number | null;
  grand_total?: number | null;
  terms?: string | null;
  finalized_at?: string | null;
  public_token?: string | null;
  company_name: string;
  company_address?: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  items: QuoteItem[];
  included_charges: string | Record<string, unknown> | null;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

// Stored totals (set at finalize) are the only source for the summary.
// Legacy rows with no stored totals show a dash. No client-side tax math.
function money(n: number | null | undefined) {
  return n === null || n === undefined ? "—" : fmt(Number(n));
}

// Sum of line amounts before any discount or charge. Display only.
function itemsSubtotal(items: QuoteItem[]) {
  return items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
}

export default function QuotePublicView() {
  const params = useParams();
  const quoteId = params?.quote_id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!quoteId) return;
    // Internal view: authenticated read. Public token route is for the customer page only.
    let cancelled = false;
    (async () => {
      try {
        const q = (await api(`/quotes/${quoteId}`)) as Quote & { client_id: number; contact_id: number };
        const missing: string[] = [];
        const [client, contacts] = await Promise.all([
          api(`/clients/${q.client_id}`).catch(() => {
            missing.push("cliente");
            return null;
          }),
          api(`/contacts/company/${q.client_id}`).catch(() => {
            missing.push("contacto");
            return [];
          }),
        ]);
        if (!cancelled && missing.length) {
          setWarning(`No se pudieron cargar los datos de: ${missing.join(", ")}.`);
        }
        const contact = Array.isArray(contacts)
          ? (contacts as Array<{ id: number; name: string; email?: string; phone?: string }>).find(
              (c) => c.id === q.contact_id
            )
          : undefined;
        if (cancelled) return;
        const c = client as { company_name?: string; address?: string } | null;
        setQuote({
          ...q,
          company_name: c?.company_name ?? "",
          company_address: c?.address ?? "",
          contact_name: contact?.name ?? "",
          contact_email: contact?.email ?? "",
          contact_phone: contact?.phone ?? "",
        });
      } catch {
        if (!cancelled) setError("No se pudo cargar la cotización.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [quoteId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-line border-t-ink" />
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

  const charges = typeof quote.included_charges === "string"
    ? JSON.parse(quote.included_charges)
    : quote.included_charges || {};

  const enabledCharges = [
    charges?.supervision && `Supervisión (${charges.supervision_percentage ?? 10}%)`,
    charges?.admin && `Administración (${charges.admin_percentage ?? 4}%)`,
    charges?.insurance && `Seguro (${charges.insurance_percentage ?? 1}%)`,
    charges?.transport && `Transporte (${charges.transport_percentage ?? 3}%)`,
    charges?.contingency && `Contingencia (${charges.contingency_percentage ?? 3}%)`,
    ...((charges?.dynamic_charges ?? []) as DynamicCharge[])
      .filter((dc) => dc.enabled)
      .map((dc) => `${dc.name} (${dc.percentage}%)`),
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-canvas px-2 py-6 text-ink sm:px-4 sm:py-10 print:bg-white print:py-0">
      <div className="mx-auto max-w-[860px] rounded-lg border border-line bg-surface p-4 shadow-card sm:p-10 print:border-0 print:p-0 print:shadow-none">

        <ErrorBanner message={warning} />

        {/* Header */}
        <div className="flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-lg font-semibold">Metpro SRL</div>
            <div className="mt-1 text-sm leading-6 text-muted">Parque Industrial Disdo</div>
            <div className="text-sm leading-6 text-muted">Calle Central No. 1, Hato Nuevo Palave</div>
            <div className="text-sm leading-6 text-muted">Tel: (829) 439-8476 | RNC: 131-71683-2</div>
          </div>
          <div className="sm:text-right">
            <div className="text-xl font-semibold uppercase tracking-widest">COTIZACIÓN</div>
            <div className="mt-1 text-sm text-muted">No. {quote.quote_number != null ? `Q-${quote.quote_number}` : "—"}</div>
            <div className="mt-0.5 text-sm text-muted">
              {localDate(quote.created_at)}
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="mt-8">
          <div className="mb-4 border-b border-line pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Información del Cliente
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm leading-7 sm:grid-cols-2">
            <div>
              <span className="font-semibold">Cliente:</span> {quote.company_name}
            </div>
            <div>
              <span className="font-semibold">Contacto:</span> {quote.contact_name}
            </div>
            <div>
              <span className="font-semibold">{es.cot.correo}</span> {quote.contact_email}
            </div>
            <div>
              <span className="font-semibold">Teléfono:</span> {quote.contact_phone}
            </div>
            <div>
              <span className="font-semibold">Creado por:</span> {quote.created_by_name || "—"}
            </div>
            {quote.project_name && (
              <div className="sm:col-span-2">
                <span className="font-semibold">Proyecto:</span> {quote.project_name}
              </div>
            )}
            {quote.valid_until && (
              <div>
                <span className="font-semibold">Válido hasta:</span> {quote.valid_until}
              </div>
            )}
            {quote.payment_terms && (
              <div>
                <span className="font-semibold">Términos de pago:</span> {quote.payment_terms}
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-8">
          <div className="mb-4 border-b border-line pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            {es.cot.detalleItems}
          </div>
          <div className={dt.wrap}>
            <table className={dt.table}>
              <thead className={dt.thead}>
                <tr>
                  <th className="whitespace-nowrap px-1 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted sm:px-4 sm:py-2.5">Descripción</th>
                  <th className="whitespace-nowrap px-1 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted sm:px-4 sm:py-2.5">Cantidad</th>
                  <th className="whitespace-nowrap px-1 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted sm:px-4 sm:py-2.5">{es.cot.precioUnit}</th>
                  <th className="whitespace-nowrap px-1 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted sm:px-4 sm:py-2.5">{es.cot.total}</th>
                </tr>
              </thead>
              <tbody className={dt.tbody}>
                {quote.items.map((item, i) => {
                  const lineTotal = item.quantity * item.unit_price;
                  return (
                    <tr key={i} className={dt.tr}>
                      <td className="px-1 py-2.5 text-xs text-ink sm:px-4 sm:py-3 sm:text-sm">{item.product_name}</td>
                      <td className="whitespace-nowrap px-1 py-2.5 text-right text-xs tabular-nums text-ink sm:px-4 sm:py-3 sm:text-sm">{item.quantity.toFixed(2)}</td>
                      <td className="whitespace-nowrap px-1 py-2.5 text-right text-xs tabular-nums text-ink sm:px-4 sm:py-3 sm:text-sm">{fmt(item.unit_price)}</td>
                      <td className="whitespace-nowrap px-1 py-2.5 text-right text-xs tabular-nums text-ink sm:px-4 sm:py-3 sm:text-sm">{fmt(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="mt-8 flex justify-end">
          <div className="w-full max-w-sm">
            <div className="mb-4 border-b border-line pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Resumen Financiero
            </div>
            <div className="flex justify-between border-b border-line py-1.5 text-sm tabular-nums">
              <span className="text-muted">Subtotal de Items</span>
              <span>{fmt(itemsSubtotal(quote.items || []))}</span>
            </div>
            {Number(quote.discount_total ?? 0) > 0 && (
              <div className="flex justify-between border-b border-line py-1.5 text-sm tabular-nums">
                <span className="text-muted">Descuentos</span>
                <span>-{money(quote.discount_total)}</span>
              </div>
            )}
            {enabledCharges.length > 0 && (
              <div className="border-b border-line py-1.5 text-sm">
                <span className="text-muted">Cargos incluidos: </span>
                <span>{enabledCharges.join(", ")}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-line py-1.5 text-sm tabular-nums">
              <span className="text-muted">{es.cot.subtotalGeneral}</span>
              <span>{money(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between border-b border-line py-1.5 text-sm tabular-nums">
              <span className="text-muted">ITBIS (18%)</span>
              <span>{money(quote.tax_amount)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t-2 border-ink pt-3 text-base font-semibold tabular-nums">
              <span>{es.cot.totalGeneralMay}</span>
              <span>{money(quote.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="mt-8">
            <div className="mb-4 border-b border-line pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Notas
            </div>
            <p className="text-sm leading-7 text-muted">{quote.notes}</p>
          </div>
        )}

        <div className="mt-10 border-t border-line pt-6 text-center text-xs text-muted">
          Generado por METPRO · metprord.com
        </div>
      </div>

      {/* Internal only, outside the document: not in the PDF or the public viewer. */}
      <QuoteCostEstimate quoteId={quoteId} className="mt-6" />
    </div>
  );
}
