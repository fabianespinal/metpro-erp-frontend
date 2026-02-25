"use client";

import { useState, useEffect } from "react";
import { api, sendInvoiceToClient } from "@/lib/api";
import StatusPill from "@/components/ui/StatusPill";
import RecordPaymentModal from "@/components/invoices/RecordPaymentModal";
import SendToClientButton from "@/components/SendToClientButton";
import SentBadge from "@/components/SentBadge";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sentMap, setSentMap] = useState({});

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const filteredInvoices =
    statusFilter === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === statusFilter);

  async function fetchInvoices() {
    try {
      const data = await api.get("/invoices/");
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function handleDownloadPDF(invoiceId, invoiceNumber) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pdf/invoices/${invoiceId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error(`PDF download failed: ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}_factura.pdf`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("PDF Download Error:", error);
      alert("Error downloading PDF: " + error.message);
    }
  }

  async function handleDownloadConduce(invoiceId, invoiceNumber) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pdf/invoices/${invoiceId}/conduce`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok)
        throw new Error(`Conduce download failed: ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `CD-${invoiceNumber}_conduce.pdf`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Conduce Download Error:", error);
      alert("Error downloading conduce: " + error.message);
    }
  }

  async function handleUpdateStatus(invoiceId, newStatus) {
    try {
      await api.put(`/invoices/${invoiceId}/status`, {
        status: newStatus,
      });

      fetchInvoices();

      if (window.toast) {
        window.toast("Status updated!", {
          title: "✅ Success",
          description: `Invoice status changed to ${newStatus}`,
        });
      }
    } catch (error) {
      alert("Error updating status: " + error.message);
    }
  }

  function openPaymentModal(invoiceId) {
    setSelectedInvoiceId(invoiceId);
    setPaymentOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando facturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full px-4 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💰 Facturas</h1>
          <p className="text-gray-600">Ver y gestionar todas las facturas</p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Factura #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pagado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pendiente</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                  <td className="px-4 py-3">{inv.client_name}</td>
                  <td className="px-4 py-3">{inv.invoice_date?.split("T")[0]}</td>

                  <td className="px-4 py-3 text-right font-bold">
                    ${(inv.total_amount ?? 0).toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-right">
                    ${(inv.amount_paid ?? 0).toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-right">
                    ${(
                      inv.amount_due ??
                      (inv.total_amount ?? 0) - (inv.amount_paid ?? 0)
                    ).toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <StatusPill status={inv.status} />
                  </td>

                  <td className="px-4 py-3 text-right space-x-2">
                    {sentMap[inv.id] && <SentBadge />}
                    <SendToClientButton
                      id={inv.id}
                      type="invoice"
                      onSent={() => setSentMap(prev => ({ ...prev, [inv.id]: true }))}
                    />
                    <button
                      onClick={() => handleDownloadPDF(inv.id, inv.invoice_number)}
                      className="text-blue-600 hover:underline"
                    >
                      PDF
                    </button>

                    <button
                      onClick={() => handleDownloadConduce(inv.id, inv.invoice_number)}
                      className="text-green-600 hover:underline"
                    >
                      Conduce
                    </button>

                    <button
                      onClick={() => openPaymentModal(inv.id)}
                      className="text-purple-600 hover:underline"
                    >
                      Pago
                    </button>

                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={inv.status}
                      onChange={(e) => handleUpdateStatus(inv.id, e.target.value)}
                    >
                      <option value="Pending">Pendiente</option>
                      <option value="Paid">Pagado</option>
                      <option value="Cancelled">Cancelado</option>
                      <option value="Overdue">Vencido</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoiceId && (
        <RecordPaymentModal
          invoiceId={selectedInvoiceId}
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          onSuccess={fetchInvoices}
        />
      )}
    </div>
  );
}