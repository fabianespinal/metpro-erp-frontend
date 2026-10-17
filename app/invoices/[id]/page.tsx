"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchInvoiceWithPayments } from "@/lib/invoiceApi";
import RecordPaymentModal from "@/components/invoices/RecordPaymentModal";
import StatusPill from "@/components/ui/StatusPill";
import { PageHeader } from "@/components/ui/page-header";

interface Payment {
  id: number;
  amount: number;
  method: string;
  notes: string | null;
  payment_date: string;
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
              {invoice.invoice_date?.split("T")[0]}
            </p>
          </div>

          <div>
            <p className="text-muted">Estado</p>
            <StatusPill status={invoice.status} />
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
                      <td className="px-4 py-2 text-right">${Number(l.unit_price || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">${Number(l.discount_value || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-medium">${Number(total).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-canvas p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">Totales</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-muted">Total</p>
              <p className="font-bold text-lg">
                ${(invoice.total_amount ?? 0).toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-muted">Pagado</p>
              <p className="font-bold text-lg text-emerald-600">
                ${(invoice.amount_paid ?? 0).toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-muted">Pendiente</p>
              <p className="font-bold text-lg text-red-600">
                ${(invoice.amount_due ?? 0).toFixed(2)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setPaymentOpen(true)}
            className="mt-4 bg-accent text-white px-4 py-2 rounded hover:bg-accent-strong"
          >
            Registrar Pago
          </button>
        </div>

        <div className="bg-canvas p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">Acciones</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                console.log("Downloading PDF for invoice", invoiceId);
                // TODO: Implement PDF download
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
            >
              Descargar PDF
            </button>

            <button
              onClick={() => {
                console.log("Creating conduce for invoice", invoiceId);
                // TODO: Implement conduce creation
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm font-medium"
            >
              Crear Conduce
            </button>

            <button
              onClick={() => {
                console.log("Opening payment link for invoice", invoiceId);
                // TODO: Implement payment link / payment portal
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium"
            >
              Link de Pago
            </button>

            <button
              onClick={() => {
                console.log("Sending invoice to client", invoiceId);
                // TODO: Implement send to client (email)
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm font-medium"
            >
              Enviar al Cliente
            </button>
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
            <table className="min-w-full divide-y divide-line bg-surface">
              <thead className="bg-canvas">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">
                    Metodo
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase">
                    Monto
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">
                    Notas
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">
                      {p.payment_date?.split("T")[0]}
                    </td>
                    <td className="px-4 py-2">{p.method}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      ${(p.amount ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2">{p.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <RecordPaymentModal
        invoiceId={invoiceId}
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={loadInvoice}
      />
    </div>
  );
}
