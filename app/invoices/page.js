"use client";
import { es } from "@/lib/i18n/es";
import toast from "react-hot-toast"
import { fmtDay } from "@/lib/dates"
import { money } from "@/lib/money"
import { getStatusLabel } from "@/lib/i18n/statusLabel";
import StatusActor from "@/components/StatusActor";
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
import InvoiceDocPreviewModal from "@/components/invoices/InvoiceDocPreviewModal";

// Mirrors the backend manual matrix. Paid is reached only by recording payments.
const STATUS_LABELS = { Pending: getStatusLabel("pending", "f"), Paid: getStatusLabel("paid", "f"), Cancelled: getStatusLabel("cancelled", "f"), Overdue: getStatusLabel("overdue", "f") };
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
  // { kind: "factura" | "conduce", id, number } while a preview is open
  const [preview, setPreview] = useState(null);
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

  async function handleUpdateStatus(invoiceId, newStatus) {
    try {
      await api.patch(`/invoices/${invoiceId}/status`, {
        status: newStatus,
      });

      fetchInvoices();

      if (window.toast) {
        window.toast(es.fact.estadoActualizado, {
          title: es.fact.exito,
          description: es.fact.estadoCambiadoA(STATUS_LABELS[newStatus] ?? newStatus),
        });
      }
    } catch (error) {
      toast.error(es.fact.errorEstado + error.message);
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
                  <td className={dt.td}>{fmtDay(inv.invoice_date)}</td>

                  <td className={dt.tdRight}>
                    {money((inv.total_amount ?? 0))}
                  </td>

                  <td className={dt.tdRight}>
                    {money((inv.amount_paid ?? 0))}
                  </td>

                  <td className={dt.tdRight}>
                    {money(
                      inv.amount_due ??
                      (inv.total_amount ?? 0) - (inv.amount_paid ?? 0)
                    )}
                  </td>

                  <td className={dt.td}>
                    <StatusPill status={inv.status} gender="f" />
                    <StatusActor kind="invoice" id={inv.id} createdBy={inv.created_by_name}
                      lastBy={inv.last_status_by} lastAt={inv.last_status_at} />
                  </td>

                  <td className={dt.tdRight}>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                    {sentMap[inv.id] && <SentBadge />}
                    {inv.status !== "Cancelled" && ( // B-10: cancelled invoices cannot be emailed
                      <SendToClientButton
                        id={inv.id}
                        type="invoice"
                        onSent={() => setSentMap(prev => ({ ...prev, [inv.id]: true }))}
                      />
                    )}
                    <Button onClick={() => setPreview({ kind: "factura", id: inv.id, number: inv.invoice_number })}>
                      Vista previa Factura
                    </Button>

                    <Button onClick={() => setPreview({ kind: "conduce", id: inv.id, number: inv.invoice_number })}>
                      Vista previa Conduce
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

      {preview && (
        <InvoiceDocPreviewModal
          key={`${preview.kind}-${preview.id}`}
          open
          kind={preview.kind}
          invoiceId={preview.id}
          invoiceNumber={preview.number}
          onClose={() => setPreview(null)}
        />
      )}

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