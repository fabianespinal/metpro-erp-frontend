'use client'
import { useState, useEffect } from 'react'
import { api } from "@/lib/api"
import PDFPreviewModal from '@/components/quotes/PDFPreviewModal'
import DeleteQuoteModal from '@/components/quotes/DeleteQuoteModal'
import QuoteTable from '@/components/quotes/QuoteTable'
import { useToken } from '@/components/quotes/useToken'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { mergeQuotesWithInvoices, filterQuotesByStatus } from '@/components/quotes/quoteUtils'
import { PageHeader } from "@/components/ui/page-header";
import { fb } from "@/components/ui/filter-bar";
import {
  previewPDF,
  downloadPDF,
  convertToInvoice,
  updateQuoteStatus,
  generateConduce,
  duplicateQuote,
  deleteQuote,
} from '@/components/quotes/QuoteActions'

export default function QuotesPage() {
  const token = useToken()
  const router = useRouter()

  const [clients, setClients] = useState([])
  const [quotes, setQuotes] = useState([])
  const [invoices, setInvoices] = useState([])
  const [products, setProducts] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, quoteId: null, quoteStatus: null })
  const [previewModal, setPreviewModal] = useState({ isOpen: false, quoteId: null, pdfUrl: null })
  const [sentMap, setSentMap] = useState({});

  async function fetchClients() {
  try {
    const data = await api.get("/clients");
    setClients(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Failed to fetch clients:", error);
    setClients([]);
  }
}

  async function fetchQuotes() {
    try {
      const data = await api("/quotes/", { method: "GET" })
      setQuotes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
      setQuotes([])
    }
  }

  async function fetchInvoices() {
    try {
      const data = await api("/invoices/", { method: "GET" })
      setInvoices(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      setInvoices([])
    }
  }

  async function fetchProducts() {
    try {
      const data = await api("/products/", { method: "GET" })
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
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
      const blob = await previewPDF(quoteId, token)
      const url = window.URL.createObjectURL(blob)
      setPreviewModal({ isOpen: true, quoteId, pdfUrl: url })
    } catch (e) {
      console.error("PDF Preview Error:", e)
      alert("Error previewing PDF: " + e.message)
    }
  }

  async function handleDownloadPDF(quoteId) {
    try {
      const blob = await downloadPDF(quoteId, token)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Q-${quoteId}.pdf`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (e) {
      console.error("PDF Download Error:", e)
      alert("Error downloading PDF: " + e.message)
    }
  }

  async function handleGenerateConduce(quoteId) {
    const mergedQuotes = mergeQuotesWithInvoices(quotes, invoices)
    const quote = mergedQuotes.find(q => q.quote_id === quoteId)
    if (!quote || !quote.has_invoice) {
      alert('This quote has not been converted to an invoice yet.')
      return
    }

    try {
      const blob = await generateConduce(quote.invoice_id, token)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CD-${quote.invoice_number}_conduce.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Conduce Error:', error)
      alert('Error generating conduce: ' + error.message)
    }
  }

  async function handleDuplicateQuote(quoteId) {
    if (!confirm("Duplicate this quote?")) return
    try {
      const data = await duplicateQuote(quoteId, token)
      // Open the new Draft in the editor. The banner tells the user it was duplicated.
      window.location.assign(`/quotes/${data.quote_id}/edit?duplicated=1`)
    } catch (error) {
      alert("Error duplicating quote: " + error.message)
    }
  }

  async function handleConvertToInvoice(quoteId) {
    if (!confirm(`Convert quote ${quoteId} to invoice?\nThis cannot be undone.`)) return
    try {
      const data = await convertToInvoice(quoteId, token)
      alert(`SUCCESS!\nQuote converted to invoice:\nNEW ID: ${data.invoice_id}`)
      fetchQuotes()
      fetchInvoices()
    } catch (error) {
      console.error('Conversion Error:', error)
      alert(`Conversion failed:\n${error.message}`)
    }
  }

  async function handleUpdateStatus(quoteId, newStatus) {
    try {
      await updateQuoteStatus(quoteId, token, newStatus)
      fetchQuotes()
    } catch (error) {
      alert('Error updating status: ' + error.message)
    }
  }

  async function handleDeleteQuote(quoteId) {
    try {
      await deleteQuote(quoteId, token)
      setQuotes(prevQuotes => prevQuotes.filter(q => q.quote_id !== quoteId))
      setInvoices(prevInvoices => prevInvoices.filter(inv => inv.quote_id !== quoteId))
    } catch (error) {
      console.error('Delete Quote Error:', error)
      alert(`Error deleting quote: ${error.message}`)
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
      alert('This quote has not been converted to an invoice yet.')
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
    <PageHeader title="Cotizar" />

    <div className="bg-surface rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Existing Quotes</h2>
        <Link
          href="/quotes/new"
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface"
        >
          Nueva cotización
        </Link>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${fb.control} w-44`}
        >
          <option value="all">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Approved">Approved</option>
          <option value="Invoiced">Invoiced</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {safeQuotes.length === 0 ? (
        <div className="p-8 text-center text-muted">
          No quotes yet. Create one above!
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
          onConvertToInvoice={handleConvertToInvoice}
          onViewInvoice={handleViewInvoice}
          sentMap={sentMap}
          setSentMap={setSentMap}
        />
      )}
    </div>

    <PDFPreviewModal
      isOpen={previewModal.isOpen}
      onClose={() => {
        if (previewModal.pdfUrl && previewModal.pdfUrl.startsWith("blob:")) {
          window.URL.revokeObjectURL(previewModal.pdfUrl);
        }
        setPreviewModal({ isOpen: false, quoteId: null, pdfUrl: null });
      }}
      quoteId={previewModal.quoteId}
      pdfUrl={previewModal.pdfUrl}
    />

    <DeleteQuoteModal
      isOpen={deleteModal.isOpen}
      onClose={() =>
        setDeleteModal({ isOpen: false, quoteId: null, quoteStatus: null })
      }
      onConfirm={handleConfirmDelete}
      quoteId={deleteModal.quoteId}
      quoteStatus={deleteModal.quoteStatus}
    />

  </div>
);
}
