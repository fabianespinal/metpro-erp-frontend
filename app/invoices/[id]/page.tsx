"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchInvoiceWithPayments } from "@/lib/invoiceApi";
import RecordPaymentModal from "@/components/invoices/RecordPaymentModal";
import StatusPill from "@/components/ui/StatusPill";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const invoiceId = Number(id);

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const [paymentOpen, setPaymentOpen] = useState(false);

  const loadInvoice = async () => {
    try {
      const data = await fetchInvoiceWithPayments(invoiceId);
      setInvoice(data);
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
        <p className="text-gray-600">Cargando factura...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">

        <h1 className="text-3xl font-bold mb-4">
          Factura #{invoice.invoice_number}
        </h1>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-gray-600">Cliente</p>
            <p className="font-medium">{invoice.client_name}</p>
          </div>

          <div>
            <p className="text-gray-600">Fecha</p>
            <p className="font-medium">
              {invoice.invoice_date?.split("T")[0]}
            </p>
          </div>

          <div>
            <p className="text-gray-600">Estado</p>
            <StatusPill status={invoice.status} />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">Totales</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600">Total</p>
              <p className="font-bold text-lg">
                ${invoice.total_amount.toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-gray-600">Pagado</p>
              <p className="font-bold text-lg text-green-600">
                ${invoice.amount_paid.toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-gray-600">Pendiente</p>
              <p className="font-bold text-lg text-red-600">
                ${invoice.amount_due.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setPaymentOpen(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Registrar Pago
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Historial de Pagos</h2>

          {invoice.payments.length === 0 ? (
            <p className="text-gray-500">No hay pagos registrados.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Método
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Monto
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Notas
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {invoice.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">
                      {p.payment_date?.split("T")[0]}
                    </td>
                    <td className="px-4 py-2">{p.method}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      ${p.amount.toFixed(2)}
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