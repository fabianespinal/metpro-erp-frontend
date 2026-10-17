"use client";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { dt } from "@/components/ui/data-table";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import StatusPill from "@/components/ui/StatusPill";
import RecordPaymentModal from "@/components/invoices/RecordPaymentModal";
import SendToClientButton from "@/components/SendToClientButton";
import SentBadge from "@/components/SentBadge";
import { PageHeader } from "@/components/ui/page-header";
import { useCurrentRole } from "@/lib/currentRole";
import { Button } from "@/components/ui/button";
import { downloadInvoiceDoc } from "@/lib/invoiceDocs";
import toast from "react-hot-toast";

// Mirrors the backend manual matrix. Paid is reached only by recording payments.
const STATUS_LABELS = { Pending: "Pendiente", Paid: "Pagado", Cancelled: "Cancelado", Overdue: "Vencido" };
const MANUAL_NEXT = {
  Pending: ["Overdue", "Cancelled"],
  Overdue: ["Pending", "Cancelled"],
  Paid: [],
  Cancelled: [],
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(true);
  const [statusFilter] = useState("all");
  const [sentMap, setSentMap] = useState({});
  const [downloadingKey, setDownloadingKey] = useState(null);
  const { isAdmin } = useCurrentRole();

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
      setLoadError(`No se pudieron cargar las facturas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Factura and conduce PDFs from the backend generators (shared with the invoice detail page).
  async function handleDownloadDoc(kind, invoiceId, invoiceNumber) {
    const key = `${kind}-${invoiceId}`;
    setDownloadingKey(key);
    try {
      await downloadInvoiceDoc(kind, invoiceId, invoiceNumber);
    } catch (error) {
      toast.error(
        `No se pudo descargar ${kind === "factura" ? "la factura" : "el conduce"}: ${error.message}`
      );
    } finally {
      setDownloadingKey(null);
    }
  }

  async function handleUpdateStatus(invoiceId, newStatus) {
    try {
      await api.patch(`/invoices/${invoiceId}/status`, {
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
        <ErrorBanner message={loadError} />

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
                    <div className="flex flex-wrap items-center justify-end gap-2">
                    {sentMap[inv.id] && <SentBadge />}
                    <SendToClientButton
                      id={inv.id}
                      type="invoice"
                      onSent={() => setSentMap(prev => ({ ...prev, [inv.id]: true }))}
                    />
                    <Button
                      onClick={() => handleDownloadDoc("factura", inv.id, inv.invoice_number)}
                      disabled={downloadingKey !== null}
                    >
                      {downloadingKey === `factura-${inv.id}` ? "Generando…" : "PDF"}
                    </Button>

                    <Button
                      onClick={() => handleDownloadDoc("conduce", inv.id, inv.invoice_number)}
                      disabled={downloadingKey !== null}
                    >
                      {downloadingKey === `conduce-${inv.id}` ? "Generando…" : "Conduce"}
                    </Button>

                    <Button onClick={() => openPaymentModal(inv.id)}>
                      Pago
                    </Button>

                    {isAdmin && (MANUAL_NEXT[inv.status] || []).length > 0 && (
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        value={inv.status}
                        onChange={(e) => handleUpdateStatus(inv.id, e.target.value)}
                        aria-label="Cambiar estado"
                      >
                        <option value={inv.status}>{STATUS_LABELS[inv.status] || inv.status}</option>
                        {MANUAL_NEXT[inv.status].map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    )}
                    </div>
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