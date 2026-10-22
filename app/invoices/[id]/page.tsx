"use client";

import { useEffect, useState } from "react";
import { fmtDay } from "@/lib/dates"
import { money } from "@/lib/money"
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchInvoiceWithPayments, voidPayment, correctPayment, fetchPaymentOptions } from "@/lib/invoiceApi";
import { useCurrentRole } from "@/lib/currentRole";
import toast from "react-hot-toast";
import RecordPaymentModal from "@/components/invoices/RecordPaymentModal";
import StatusPill from "@/components/ui/StatusPill";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import SendToClientButton from "@/components/SendToClientButton";
import InvoiceDocPreviewModal from "@/components/invoices/InvoiceDocPreviewModal";
import { type InvoiceDocKind } from "@/lib/invoiceDocs";

interface Payment {
  id: number;
  amount: number;
  method: string;
  notes: string | null;
  payment_date: string;
  voided_at?: string | null;
  void_reason?: string | null;
  voided_by_name?: string | null;
  created_at?: string | null;
  created_by_name?: string | null;
  backfilled?: boolean;
  corrects_payment_id?: number | null;
  corrected_by_payment_id?: number | null;
  correction_chain_id?: number | null;
}

interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  invoice_date: string;
  status: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  created_by_name?: string | null;
  payments: Payment[];
  items?: InvoiceLine[];
  payments_error?: string | null;
}

interface InvoiceLine {
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_value?: number;
  total?: number;
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const invoiceId = Number(id);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [preview, setPreview] = useState<InvoiceDocKind | null>(null);
  const { isAdmin } = useCurrentRole();
  // B-14: payment being voided (admin) and the reason typed for it.
  const [voiding, setVoiding] = useState<Payment | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidBusy, setVoidBusy] = useState(false);

  // A2: void-and-correct. The action only shows when the backend switch is on.
  const [correctionEnabled, setCorrectionEnabled] = useState(false);
  const [correcting, setCorrecting] = useState<Payment | null>(null);
  const [corr, setCorr] = useState({ amount: "", method: "", notes: "", payment_date: "", reason: "" });
  const [corrBusy, setCorrBusy] = useState(false);

  useEffect(() => {
    fetchPaymentOptions().then((o) => setCorrectionEnabled(o.correction_enabled));
  }, []);

  const openCorrection = (p: Payment) => {
    setCorrecting(p);
    setCorr({ amount: String(p.amount), method: p.method, notes: p.notes ?? "", payment_date: p.payment_date.slice(0, 10), reason: "" });
  };

  const confirmCorrection = async () => {
    if (!correcting) return;
    const amount = Number(corr.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("El monto debe ser mayor que cero.");
      return;
    }
    if (corr.reason.trim().length < 3) {
      toast.error("Indique el motivo de la corrección.");
      return;
    }
    setCorrBusy(true);
    try {
      await correctPayment(invoiceId, correcting.id, {
        amount,
        method: corr.method,
        notes: corr.notes,
        payment_date: corr.payment_date,
        reason: corr.reason.trim(),
      });
      toast.success("Pago corregido");
      setCorrecting(null);
      await loadInvoice();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo corregir el pago.");
    } finally {
      setCorrBusy(false);
    }
  };

  const confirmVoid = async () => {
    if (!voiding) return;
    if (voidReason.trim().length < 3) {
      toast.error("Indique el motivo de la anulación.");
      return;
    }
    setVoidBusy(true);
    try {
      await voidPayment(invoiceId, voiding.id, voidReason.trim());
      toast.success("Pago anulado. El saldo se recalculó.");
      setVoiding(null);
      setVoidReason("");
      await loadInvoice();
    } catch (err) {
      toast.error("No se pudo anular el pago: " + (err instanceof Error ? err.message : ""));
    } finally {
      setVoidBusy(false);
    }
  };

  const loadInvoice = async () => {
    try {
      const data = await fetchInvoiceWithPayments(invoiceId);
      setInvoice(data as Invoice);
    } catch (err) {
      console.error("Error loading invoice:", err);
      setError(err instanceof Error ? err.message : "No se pudo cargar la factura.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted">Cargando factura...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          No se pudo cargar la factura: {error || "no encontrada"}
        </p>
        <Link href="/invoices" className="mt-4 inline-block text-sm text-accent underline">
          Volver a facturas
        </Link>
      </div>
    );
  }

  const lines = invoice.items ?? [];

  const payments = invoice.payments ?? [];

  return (
    <div className="min-h-screen bg-canvas p-6">
      <div className="max-w-4xl mx-auto bg-surface shadow rounded-lg p-6">

        <PageHeader title={`Factura #${invoice.invoice_number}`} />

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-muted">Cliente</p>
            <p className="font-medium">{invoice.client_name}</p>
          </div>

          <div>
            <p className="text-muted">Fecha</p>
            <p className="font-medium">
              {fmtDay(invoice.invoice_date)}
            </p>
          </div>

          <div>
            <p className="text-muted">Estado</p>
            <StatusPill status={invoice.status} gender="f" />
          </div>

          <div>
            <p className="text-muted">Creado por</p>
            <p className="font-medium">{invoice.created_by_name || "—"}</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Detalle</h2>
          {lines.length === 0 ? (
            <p className="text-muted">Sin líneas.</p>
          ) : (
            <div className="overflow-x-auto">{/* E-04: scroll inside on phones */}
            <table className="min-w-full divide-y divide-line bg-surface text-sm">
              <thead className="bg-canvas">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">Descripción</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase">Cant.</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase">Precio</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase">Desc.</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {lines.map((l, i) => {
                  const gross = Number(l.quantity || 0) * Number(l.unit_price || 0);
                  const total = l.total ?? gross - Number(l.discount_value || 0);
                  return (
                    <tr key={i}>
                      <td className="px-4 py-2">{l.product_name}</td>
                      <td className="px-4 py-2 text-right">{Number(l.quantity || 0)}</td>
                      <td className="px-4 py-2 text-right">{money(Number(l.unit_price || 0))}</td>
                      <td className="px-4 py-2 text-right">{money(Number(l.discount_value || 0))}</td>
                      <td className="px-4 py-2 text-right font-medium">{money(Number(total))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>

        <div className="bg-canvas p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">Totales</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-muted">Total</p>
              <p className="font-bold text-lg">
                {money((invoice.total_amount ?? 0))}
              </p>
            </div>

            <div>
              <p className="text-muted">Pagado</p>
              <p className="font-bold text-lg text-emerald-600">
                {money((invoice.amount_paid ?? 0))}
              </p>
            </div>

            <div>
              <p className="text-muted">Pendiente</p>
              <p className="font-bold text-lg text-red-600">
                {money((invoice.amount_due ?? 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-canvas p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">Acciones</h2>
          <div className="flex flex-wrap gap-2">
            {invoice.status !== "Cancelled" && <SendToClientButton id={invoiceId} type="invoice" />}
            <Button onClick={() => setPreview("factura")}>Vista previa Factura</Button>
            <Button onClick={() => setPreview("conduce")}>Vista previa Conduce</Button>
            <Button onClick={() => setPaymentOpen(true)}>Pago</Button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Historial de Pagos</h2>
          {invoice.payments_error && (
            <p role="alert" className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              No se pudo cargar el historial de pagos: {invoice.payments_error}
            </p>
          )}

          {payments.length === 0 ? (
            <p className="text-muted">No hay pagos registrados.</p>
          ) : (
            <div className="overflow-x-auto">{/* E-04: scroll inside on phones */}
            <table className="min-w-full divide-y divide-line bg-surface">
              <thead className="bg-canvas">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">
                    Método
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase">
                    Monto
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">
                    Notas
                  </th>
                  {isAdmin && <th className="px-4 py-2"><span className="sr-only">Acciones</span></th>}
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {payments.map((p) => (
                  <tr key={p.id} className={p.voided_at ? "text-muted" : undefined}>
                    <td className="px-4 py-2">
                      {fmtDay(p.payment_date)}
                    </td>
                    <td className="px-4 py-2">{p.method}</td>
                    <td className={`px-4 py-2 text-right font-medium ${p.voided_at ? "line-through" : ""}`}>
                      {money((p.amount ?? 0))}
                    </td>
                    <td className="px-4 py-2">
                      {p.notes || "-"}
                      {p.voided_at && (
                        <div className="text-xs text-red-700">
                          Anulado{p.voided_by_name ? ` por ${p.voided_by_name}` : ""}: {p.void_reason}
                        </div>
                      )}
                      {p.corrects_payment_id != null && (
                        <div className="text-xs text-muted">Corrige el pago #{p.corrects_payment_id}</div>
                      )}
                      {p.corrected_by_payment_id != null && (
                        <div className="text-xs text-muted">Reemplazado por el pago #{p.corrected_by_payment_id}</div>
                      )}
                      <div className="text-xs text-muted">
                        {p.backfilled
                          ? "Registro anterior al control de auditoría"
                          : `Registrado${p.created_by_name ? ` por ${p.created_by_name}` : ""}${p.created_at ? ` el ${fmtDay(p.created_at)}` : ""}`}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2 text-right">
                        {!p.voided_at && (
                          <div className="flex justify-end gap-2">
                            {correctionEnabled && invoice.status !== "Cancelled" && (
                              <Button variant="outline" onClick={() => openCorrection(p)}>Corregir pago</Button>
                            )}
                            <Button variant="outline" onClick={() => { setVoiding(p); setVoidReason(""); }}>
                              Anular pago
                            </Button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {voiding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="void-title">
          <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-card">
            <h2 id="void-title" className="text-lg font-semibold text-ink">Anular pago</h2>
            <p className="mt-1 text-sm text-muted">
              {money(voiding.amount)} del {fmtDay(voiding.payment_date)} ({voiding.method}). El pago queda en el historial como
              anulado y deja de contar en el saldo y los reportes.
            </p>
            <label htmlFor="void-reason" className="mt-4 block text-sm font-medium text-ink">Motivo</label>
            <textarea
              id="void-reason"
              rows={3}
              className="mt-1 w-full rounded border border-line px-3 py-2 text-sm"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setVoiding(null)} disabled={voidBusy}>Cancelar</Button>
              <Button onClick={confirmVoid} disabled={voidBusy}>{voidBusy ? "Anulando…" : "Anular pago"}</Button>
            </div>
          </div>
        </div>
      )}

      {correcting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="corr-title">
          <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-card">
            <h2 id="corr-title" className="text-lg font-semibold text-ink">Corregir pago</h2>
            <p className="mt-1 text-sm text-muted">
              El pago original ({money(correcting.amount)} del {fmtDay(correcting.payment_date)}) queda anulado en el historial y se
              registra uno nuevo enlazado a él.
            </p>
            {(["amount", "method", "payment_date", "notes", "reason"] as const).map((f) => (
              <div key={f} className="mt-3">
                <label htmlFor={`corr-${f}`} className="block text-sm font-medium text-ink">
                  {{ amount: "Monto", method: "Método", payment_date: "Fecha", notes: "Notas", reason: "Motivo de la corrección" }[f]}
                </label>
                <input
                  id={`corr-${f}`}
                  type={f === "amount" ? "number" : f === "payment_date" ? "date" : "text"}
                  step={f === "amount" ? "0.01" : undefined}
                  className="mt-1 w-full rounded border border-line px-3 py-2 text-sm"
                  value={corr[f]}
                  onChange={(e) => setCorr({ ...corr, [f]: e.target.value })}
                />
              </div>
            ))}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCorrecting(null)} disabled={corrBusy}>Cancelar</Button>
              <Button onClick={confirmCorrection} disabled={corrBusy}>{corrBusy ? "Guardando…" : "Corregir pago"}</Button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <InvoiceDocPreviewModal
          key={preview}
          open
          kind={preview}
          invoiceId={invoiceId}
          invoiceNumber={invoice.invoice_number}
          onClose={() => setPreview(null)}
        />
      )}

      <RecordPaymentModal
        invoiceId={invoiceId}
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={loadInvoice}
      />
    </div>
  );
}
