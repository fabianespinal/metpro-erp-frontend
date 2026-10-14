"use client";

import { useEffect, useState } from "react";
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
  payments: Payment[];
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const invoiceId = Number(id);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const loadInvoice = async () => {
    try {
      const data = await fetchInvoiceWithPayments(invoiceId);
      setInvoice(data as Invoice);
    } catch (err) {
      console.error("Error loading invoice:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, []);

  if (loading || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted">Cargando factura...</p>
      </div>
    );
  }

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

        <div>
          <h2 className="text-xl font-semibold mb-3">Historial de Pagos</h2>

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
