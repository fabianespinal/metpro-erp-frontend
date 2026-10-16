"use client";
import { dt } from "@/components/ui/data-table";

import { useState, useEffect } from "react";
import { api, sendInvoiceToClient } from "@/lib/api";
import StatusPill from "@/components/ui/StatusPill";
import RecordPaymentModal from "@/components/invoices/RecordPaymentModal";
import SendToClientButton from "@/components/SendToClientButton";
import SentBadge from "@/components/SentBadge";
import { PageHeader } from "@/components/ui/page-header";

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
          title: "Success",
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
          <p className="text-muted">Cargando facturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas p-6">
      <div className="w-full px-4 lg:px-8">
        <PageHeader title="Facturas" subtitle="Ver y gestionar todas las facturas" />

        <div className="bg-surface shadow rounded-lg overflow-hidden mt-6">
          <table className={dt.table}>
            <thead className={dt.thead}>
              <tr>
                <th className={dt.th}>Factura #</th>
                <th className={dt.th}>Cliente</th>
                <th className={dt.th}>Fecha</th>
                <th className={dt.thRight}>Total</th>
                <th className={dt.thRight}>Pagado</th>
                <th className={dt.thRight}>Pendiente</th>
                <th className={dt.th}>Estado</th>
                <th className={dt.thRight}>Acciones</th>
              </tr>
            </thead>

            <tbody className={dt.tbody}>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className={dt.tr}>
                  <td className={dt.td}>{inv.invoice_number}</td>
                  <td className={dt.td}>{inv.client_name}</td>
                  <td className={dt.td}>{inv.invoice_date?.split("T")[0]}</td>

                  <td className={dt.tdRight}>
                    ${(inv.total_amount ?? 0).toFixed(2)}
                  </td>

                  <td className={dt.tdRight}>
                    ${(inv.amount_paid ?? 0).toFixed(2)}
                  </td>

                  <td className={dt.tdRight}>
                    ${(
                      inv.amount_due ??
                      (inv.total_amount ?? 0) - (inv.amount_paid ?? 0)
                    ).toFixed(2)}
                  </td>

                  <td className={dt.td}>
                    <StatusPill status={inv.status} />
                    <div className="text-xs text-muted mt-1">
                      Creado por {inv.created_by_name || "—"}
                    </div>
                  </td>

                  <td className={dt.tdRight}>
                    {sentMap[inv.id] && <SentBadge />}
                    <SendToClientButton
                      id={inv.id}
                      type="invoice"
                      onSent={() => setSentMap(prev => ({ ...prev, [inv.id]: true }))}
                    />
                    <button
                      onClick={() => handleDownloadPDF(inv.id, inv.invoice_number)}
                      className="text-accent hover:underline"
                    >
                      PDF
                    </button>

                    <button
                      onClick={() => handleDownloadConduce(inv.id, inv.invoice_number)}
                      className="text-emerald-600 hover:underline"
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