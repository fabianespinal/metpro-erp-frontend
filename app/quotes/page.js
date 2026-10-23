'use client'
import { es } from "@/lib/i18n/es";
import toast from "react-hot-toast"
import { getStatusLabel } from "@/lib/i18n/statusLabel";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { useState, useEffect, useRef } from 'react'
import { api } from "@/lib/api"
import PDFPreviewModal from '@/components/quotes/PDFPreviewModal'
import InvoiceDocPreviewModal from '@/components/invoices/InvoiceDocPreviewModal'
import DeleteQuoteModal from '@/components/quotes/DeleteQuoteModal'
import QuoteTable from '@/components/quotes/QuoteTable'
import { useToken } from '@/components/quotes/useToken'
import { useSealSettings } from '@/lib/useSealSettings'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { mergeQuotesWithInvoices, filterQuotesByStatus } from '@/components/quotes/quoteUtils'
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useCurrentRole } from "@/lib/currentRole";
import { getEstimatorEnabled } from "@/lib/estimatorApi";
import { fb } from "@/components/ui/filter-bar";
import {
  previewPDF,
  downloadPDF,
  convertToInvoice,
  updateQuoteStatus,
  duplicateQuote,
  deleteQuote,
} from '@/components/quotes/QuoteActions'

export default function QuotesPage() {
  const token = useToken()
  const router = useRouter()
  const { isAdmin } = useCurrentRole()
  const [estimatorOn, setEstimatorOn] = useState(false)
  useEffect(() => {
    // Admin-only entry. Hidden unless the backend switch is on. Fails closed.
    if (!isAdmin) return
    let active = true
    getEstimatorEnabled().then((on) => { if (active) setEstimatorOn(on) })
    return () => { active = false }
  }, [isAdmin])

  const [clients, setClients] = useState([])

  const [loadError, setLoadError] = useState(null)
  const [quotes, setQuotes] = useState([])
  const [invoices, setInvoices] = useState([])
  const [products, setProducts] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, quoteId: null, quoteStatus: null })
  const [conduceModal, setConduceModal] = useState(null)
  const [previewModal, setPreviewModal] = useState({ isOpen: false, quoteId: null, pdfUrl: null, printSeal: false })
  const previewRequest = useRef(0) // answers only the latest preview request
  const seal = useSealSettings()
  const [sentMap, setSentMap] = useState({});

  async function fetchClients() {
  try {
    const data = await api.get("/clients");
    setClients(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Failed to fetch clients:", error);
    setClients([]);
    setLoadError(`No se pudieron cargar los clientes: ${error.message}`);
  }
}

  async function fetchQuotes() {
    try {
      const data = await api("/quotes/", { method: "GET" })
      setQuotes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
      setQuotes([])
      setLoadError(`No se pudieron cargar las cotizaciones: ${error.message}`)
    }
  }

  async function fetchInvoices() {
    try {
      const data = await api("/invoices/", { method: "GET" })
      setInvoices(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      setInvoices([])
      setLoadError(`No se pudieron cargar las facturas: ${error.message}`)
    }
  }

  async function fetchProducts() {
    try {
      const data = await api("/products/", { method: "GET" })
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
      setLoadError(`No se pudieron cargar los productos: ${error.message}`)
    }
  }

  // Initial loads, declared after the loaders they call. Each loader sets state
  // only after its request resolves, so nothing updates synchronously here.
  useEffect(() => {
    const load = async () => {
      await Promise.resolve()
      await Promise.all([fetchClients(), fetchQuotes(), fetchInvoices(), fetchProducts()])
    }
    load()
  }, [])

  async function handlePreviewPDF(quoteId) {
    try {
      // The company default pre-checks the seal; the user can change it inside the preview.
      const printSeal = seal.enabledByDefault
      const request = ++previewRequest.current
      const blob = await previewPDF(quoteId, token, printSeal)
      const url = window.URL.createObjectURL(blob)
      if (request !== previewRequest.current) { window.URL.revokeObjectURL(url); return }
      setPreviewModal({ isOpen: true, quoteId, pdfUrl: url, printSeal })
    } catch (e) {
      console.error("PDF Preview Error:", e)
      toast.error(es.cot.errorVistaPrevia + e.message)
    }
  }

  // Seal checkbox inside the quote preview: regenerate the PDF with the new choice.
  async function handleSealToggle(checked) {
    const { quoteId, pdfUrl: oldUrl } = previewModal
    const request = ++previewRequest.current
    setPreviewModal(m => ({ ...m, pdfUrl: null, printSeal: checked }))
    if (oldUrl && oldUrl.startsWith("blob:")) window.URL.revokeObjectURL(oldUrl)
    try {
      const blob = await previewPDF(quoteId, token, checked)
      const url = window.URL.createObjectURL(blob)
      if (request !== previewRequest.current) { window.URL.revokeObjectURL(url); return }
      setPreviewModal(m => ({ ...m, pdfUrl: url, printSeal: checked }))
    } catch (e) {
      if (request !== previewRequest.current) return
      console.error("PDF Preview Error:", e)
      toast.error(es.cot.errorVistaPrevia + e.message)
      setPreviewModal(m => ({ ...m, isOpen: false, pdfUrl: null, printSeal: false }))
    }
  }

  async function handleDownloadPDF(quoteId) {
    try {
      // Direct download from the list uses the company default. Use the preview to choose per document.
      const blob = await downloadPDF(quoteId, token, seal.enabledByDefault)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const q = mergedQuotes.find(x => x.quote_id === quoteId)
      link.download = `Q-${q?.quote_number ?? quoteId}.pdf`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (e) {
      console.error("PDF Download Error:", e)
      toast.error(es.cot.errorDescarga + e.message)
    }
  }

  async function handleGenerateConduce(quoteId) {
    const mergedQuotes = mergeQuotesWithInvoices(quotes, invoices)
    const quote = mergedQuotes.find(q => q.quote_id === quoteId)
    if (!quote || !quote.has_invoice) {
      toast.error(es.cot.sinFactura)
      return
    }

    setConduceModal({ id: quote.invoice_id, number: quote.invoice_number })
  }

  async function handleDuplicateQuote(quoteId) {
    if (!confirm(es.cot.confirmarDuplicar)) return
    try {
      const data = await duplicateQuote(quoteId, token)
      // Open the new Draft in the editor. The banner tells the user it was duplicated.
      window.location.assign(`/quotes/${data.quote_id}/edit?duplicated=1`)
    } catch (error) {
      toast.error(es.cot.errorDuplicar + error.message)
    }
  }

  // Printed number for messages (Q-10001), never the internal UUID.
  function quoteLabel(quoteId) {
    const q = mergedQuotes.find(x => x.quote_id === quoteId)
    return q?.quote_number != null ? `Q-${q.quote_number}` : quoteId
  }

  async function handleConvertToInvoice(quoteId) {
    if (!confirm(es.cot.confirmarConvertir(quoteLabel(quoteId)))) return
    try {
      const data = await convertToInvoice(quoteId, token)
      toast.success(es.cot.exitoConversion(data.invoice_number ?? data.invoice_id))
      fetchQuotes()
      fetchInvoices()
    } catch (error) {
      console.error('Conversion Error:', error)
      toast.error(es.cot.errorConversion + error.message)
    }
  }

  async function handleUpdateStatus(quoteId, newStatus) {
    try {
      await updateQuoteStatus(quoteId, token, newStatus)
      fetchQuotes()
    } catch (error) {
      toast.error(es.cot.errorEstado + error.message)
    }
  }

  async function handleDeleteQuote(quoteId) {
    try {
      await deleteQuote(quoteId, token)
      setQuotes(prevQuotes => prevQuotes.filter(q => q.quote_id !== quoteId))
      setInvoices(prevInvoices => prevInvoices.filter(inv => inv.quote_id !== quoteId))
    } catch (error) {
      console.error('Delete Quote Error:', error)
      toast.error(es.cot.errorEliminar + error.message)
    }
  }

  async function handleConfirmDelete() {
    if (deleteModal.quoteId) {
      await handleDeleteQuote(deleteModal.quoteId)
    }
    setDeleteModal({ isOpen: false, quoteId: null, quoteStatus: null })
  }

  function handleViewInvoice(quote) {
    if (quote.has_invoice) {
      window.location.href = `/invoices?invoice_id=${quote.invoice_id}`
    } else {
      toast.error(es.cot.sinFactura)
    }
  }

  // Only Draft quotes are editable. Editor: /quotes/{id}/edit. Create: /quotes/new.
  function handleEdit(quote) {
    if (quote.status !== 'Draft') return
    router.push(`/quotes/${quote.quote_id}/edit`)
  }

  function handleDelete(quoteId, quoteStatus) {
    setDeleteModal({ isOpen: true, quoteId, quoteStatus })
  }

  const mergedQuotes = mergeQuotesWithInvoices(quotes, invoices)
  const safeQuotes = Array.isArray(mergedQuotes) ? mergedQuotes : []
  const filteredQuotes = filterQuotesByStatus(safeQuotes, statusFilter)

  return (
  <div className="w-full px-4 lg:px-8 py-6">
    <PageHeader
      title="Cotizar"
      actions={
        // Shared primary button (components/ui/button): same as Nuevo proyecto, Crear paquete.
        <div className="flex flex-wrap gap-2">
          {isAdmin && estimatorOn ? (
            <Button asChild variant="outline">
              <Link href="/quotes/estimate">{es.est.boton}</Link>
            </Button>
          ) : null}
          <Button asChild>
            <Link href="/quotes/new">{es.cot.nueva}</Link>
          </Button>
        </div>
      }
    />
    <ErrorBanner message={loadError} />

    <div className="bg-surface rounded-lg shadow p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold">{es.cot.existentes}</h2>

        <select
          aria-label="Filtrar por estado"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${fb.control} w-44`}
        >
          <option value="all">{es.cot.todosEstados}</option>
          <option value="Draft">{es.estados.draft}</option>
          <option value="Approved">{es.estados.approved}</option>
          <option value="Invoiced">{es.estados.invoiced}</option>
          <option value="Cancelled">{getStatusLabel("cancelled", "f")}</option>
        </select>
      </div>

      {safeQuotes.length === 0 ? (
        <div className="p-8 text-center text-muted">
          {es.cot.sinCotizaciones}
        </div>
      ) : (
        <QuoteTable
          quotes={filteredQuotes}
          onPreviewPDF={handlePreviewPDF}
          onDownloadPDF={handleDownloadPDF}
          onGenerateConduce={handleGenerateConduce}
          onDuplicate={handleDuplicateQuote}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onApprove={(id) => handleUpdateStatus(id, "Approved")}
          onReject={(id) => {
            if (confirm(es.cot.confirmarRechazar)) {
              handleUpdateStatus(id, "Rejected")
            }
          }}
          onConvertToInvoice={handleConvertToInvoice}
          onViewInvoice={handleViewInvoice}
          sentMap={sentMap}
          setSentMap={setSentMap}
          onSent={() => fetchQuotes()}
        />
      )}
    </div>

    <PDFPreviewModal
      isOpen={previewModal.isOpen}
      onClose={() => {
        previewRequest.current++
        if (previewModal.pdfUrl && previewModal.pdfUrl.startsWith("blob:")) {
          window.URL.revokeObjectURL(previewModal.pdfUrl);
        }
        setPreviewModal({ isOpen: false, quoteId: null, pdfUrl: null, printSeal: false });
      }}
      quoteId={previewModal.quoteId}
      quoteLabel={previewModal.quoteId ? quoteLabel(previewModal.quoteId) : null}
      pdfUrl={previewModal.pdfUrl}
      sealAvailable={seal.configured}
      printSeal={previewModal.printSeal}
      onSealChange={handleSealToggle}
    />

    {conduceModal && (
      <InvoiceDocPreviewModal
        key={conduceModal.id}
        open
        kind="conduce"
        invoiceId={conduceModal.id}
        invoiceNumber={conduceModal.number}
        onClose={() => setConduceModal(null)}
      />
    )}

    <DeleteQuoteModal
      isOpen={deleteModal.isOpen}
      onClose={() =>
        setDeleteModal({ isOpen: false, quoteId: null, quoteStatus: null })
      }
      onConfirm={handleConfirmDelete}
      quoteId={deleteModal.quoteId}
      quoteLabel={deleteModal.quoteId ? quoteLabel(deleteModal.quoteId) : null}
      quoteStatus={deleteModal.quoteStatus}
    />

  </div>
);
}
