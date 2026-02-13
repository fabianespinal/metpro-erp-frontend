'use client'
import { useState, useEffect } from 'react'
import { api } from "@/lib/api"
import StatusPill from '@/components/ui/StatusPill'
import PrimaryActionButton from '@/components/quote/PrimaryActionButton'
import OverflowMenu from '@/components/quote/OverflowMenu'
import PDFPreviewModal from '@/components/quote/PDFPreviewModal'
import SurchargeControls from '@/components/quote/SurchargeControls'
import DeleteQuoteModal from '@/components/quote/DeleteQuoteModal'
import EditQuoteModal from '@/components/quote/EditQuoteModal'

export default function QuotesPage() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [quoteItems, setQuoteItems] = useState([{ product_name: '', quantity: 1, unit_price: 0, discount_type: 'none', discount_value: 0 }])
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, quoteId: null, quoteStatus: null })
  const [editModal, setEditModal] = useState({ isOpen: false, quote: null })
  const [projectName, setProjectName] = useState('')
  const [notes, setNotes] = useState('')
  const [charges, setCharges] = useState({
    supervision: true,
    supervision_percentage: 10,
    admin: true,
    admin_percentage: 4,
    insurance: true,
    insurance_percentage: 1,
    transport: true,
    transport_percentage: 3,
    contingency: true,
    contingency_percentage: 3
  })
  const [totals, setTotals] = useState(null)
  const [loading, setLoading] = useState(false)
  const [quotes, setQuotes] = useState([])
  const [invoices, setInvoices] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [previewPDF, setPreviewPDF] = useState({ isOpen: false, quoteId: null, pdfUrl: null })
  const [products, setProducts] = useState([])
  const [productModal, setProductModal] = useState({ isOpen: false, itemIndex: null })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClients()
    fetchQuotes()
    fetchInvoices()
    fetchProducts()
  }, [])

  useEffect(() => {
    calculateTotals()
  }, [quoteItems, charges])

  // Fetch clients
  const fetchClients = async () => {
    try {
      const data = await api("/clients/", { method: "GET" })
      setClients(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch clients:', error)
      setClients([])
    }
  }

  // Fetch quotes
  const fetchQuotes = async () => {
    try {
      const data = await api("/quotes/", { method: "GET" })
      setQuotes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
      setQuotes([])
    }
  }

  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      const data = await api("/invoices/", { method: "GET" })
      setInvoices(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      setInvoices([])
    }
  }

  // Merge invoice data into quotes
  const getMergedQuotes = () => {
    return quotes.map(quote => {
      const invoice = invoices.find(inv => inv.quote_id === quote.quote_id)
      if (invoice) {
        return {
          ...quote,
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          invoice_status: invoice.status,
          invoice_date: invoice.invoice_date,
          has_invoice: true
        }
      }
      return {
        ...quote,
        has_invoice: false
      }
    })
  }

  // Fetch products
  const fetchProducts = async () => {
    try {
      const data = await api("/products/", { method: "GET" })
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
    }
  }

  const calculateTotals = () => {
    const items_total = quoteItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const total_discounts = quoteItems.reduce((sum, item) => {
      const subtotal = item.quantity * item.unit_price
      if (item.discount_type === 'percentage') {
        return sum + (subtotal * (item.discount_value / 100))
      } else if (item.discount_type === 'fixed') {
        return sum + item.discount_value
      }
      return sum
    }, 0)

    const items_after_discount = items_total - total_discounts

    const supervision = charges.supervision 
      ? items_after_discount * (charges.supervision_percentage / 100) 
      : 0
    const admin = charges.admin 
      ? items_after_discount * (charges.admin_percentage / 100) 
      : 0
    const insurance = charges.insurance 
      ? items_after_discount * (charges.insurance_percentage / 100) 
      : 0
    const transport = charges.transport 
      ? items_after_discount * (charges.transport_percentage / 100) 
      : 0
    const contingency = charges.contingency 
      ? items_after_discount * (charges.contingency_percentage / 100) 
      : 0

    const subtotal_general = items_after_discount + supervision + admin + insurance + transport + contingency
    const itbis = subtotal_general * 0.18
    const grand_total = subtotal_general + itbis

    setTotals({
      items_total: items_total.toFixed(2),
      total_discounts: total_discounts.toFixed(2),
      items_after_discount: items_after_discount.toFixed(2),
      supervision: supervision.toFixed(2),
      admin: admin.toFixed(2),
      insurance: insurance.toFixed(2),
      transport: transport.toFixed(2),
      contingency: contingency.toFixed(2),
      subtotal_general: subtotal_general.toFixed(2),
      itbis: itbis.toFixed(2),
      grand_total: grand_total.toFixed(2)
    })
  }

  const handleAddItem = () => {
    setQuoteItems([...quoteItems, { product_name: '', quantity: 1, unit_price: 0, discount_type: 'none', discount_value: 0 }])
  }

  const handleRemoveItem = (index) => {
    const newItems = [...quoteItems]
    newItems.splice(index, 1)
    setQuoteItems(newItems)
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...quoteItems]
    newItems[index][field] = value
    setQuoteItems(newItems)
  }

  // Select product from database
  const selectProduct = (product) => {
    console.log('Selected product:', product)
    if (productModal.itemIndex !== null) {
      const newItems = [...quoteItems]
      newItems[productModal.itemIndex].product_name = product.name
      newItems[productModal.itemIndex].unit_price = parseFloat(product.unit_price) || 0
      setQuoteItems(newItems)
    }
    setProductModal({ isOpen: false, itemIndex: null })
  }

  // Get PDF URL based on invoice status
  const getPdfUrl = (quoteId) => {
    const quote = getMergedQuotes().find(q => q.quote_id === quoteId)
    if (quote && quote.has_invoice) {
      return `/pdf/invoices/${quote.invoice_id}`
    }
    return `/pdf/quotes/${quoteId}`
  }

  // Get PDF filename based on invoice status
  const getPdfFilename = (quoteId) => {
    const quote = getMergedQuotes().find(q => q.quote_id === quoteId)
    if (quote && quote.has_invoice) {
      return `${quote.invoice_number}_factura.pdf`
    }
    return `${quoteId}_cotizacion.pdf`
  }

  // Download PDF
  const handleDownloadPDF = async (quoteId) => {
    try {
      const url = getPdfUrl(quoteId)
      const filename = getPdfFilename(quoteId)

      const response = await api(url, { method: "GET" }, { raw: true })
      
      if (!response.ok) {
        throw new Error(`PDF download failed: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
    } catch (error) {
      console.error('PDF Download Error:', error)
      alert('Error downloading PDF: ' + error.message)
    }
  }

  // Generate Conduce
  const handleGenerateConduce = async (quoteId) => {
    const quote = getMergedQuotes().find(q => q.quote_id === quoteId)
    if (!quote || !quote.has_invoice) {
      alert('This quote has not been converted to an invoice yet.')
      return
    }

    try {
      const response = await api(`/pdf/invoices/${quote.invoice_id}/conduce`, { method: "GET" }, { raw: true })

      if (!response.ok) {
        throw new Error(`Conduce generation failed: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CD-${quote.invoice_number}_conduce.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      if (window.toast) {
        window.toast('Conduce Generated!', {
          title: '✅ Success',
          description: `Delivery note for ${quote.invoice_number} downloaded`
        })
      }
    } catch (error) {
      console.error('Conduce Error:', error)
      alert('Error generating conduce: ' + error.message)
    }
  }

  // Preview PDF
  const handlePreviewPDF = async (quoteId) => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/pdf/quotes/${quoteId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Preview failed: ${res.status} ${res.statusText}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    setPreviewPDF({
      isOpen: true,
      quoteId,
      pdfUrl: url,
    });
  } catch (err) {
    console.error("PDF Preview Error:", err);
    alert("Error previewing PDF: " + err.message);
  }
};

  // Duplicate quote
  const handleDuplicateQuote = async (quoteId) => {
    if (!confirm("Duplicate this quote?")) return
    try {
      const data = await api(`/quotes/${quoteId}/duplicate`, { method: "POST" })
      alert(`✅ Quote duplicated! New ID: ${data.quote_id}`)
      fetchQuotes()
      fetchInvoices()
    } catch (error) {
      alert("Error duplicating quote: " + error.message)
    }
  }

  // Convert to invoice
  const handleConvertToInvoice = async (quoteId) => {
    if (!confirm(`Convert quote ${quoteId} to invoice?\nThis will change the ID from COT- to INV- prefix and cannot be undone.`)) return
    try {
      const data = await api(`/quotes/${quoteId}/convert-to-invoice`, { method: "POST" })
      alert(`✅ SUCCESS!\nQuote converted to invoice:\nNEW ID: ${data.invoice_id}`)
      fetchQuotes()
      fetchInvoices()
      
      if (window.toast) {
        window.toast('Converted to Invoice!', {
          title: '✅ Success',
          description: `Quote ${quoteId} is now invoice ${data.invoice_id}`
        })
      }
    } catch (error) {
      console.error('Conversion Error:', error)
      alert(`❌ Conversion failed:\n${error.message}`)
    }
  }

  // Update status
  const handleUpdateStatus = async (quoteId, newStatus) => {
    try {
      await api(`/quotes/${quoteId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      })
      fetchQuotes()
      
      if (window.toast) {
        window.toast('Status updated!', {
          title: '✅ Success',
          description: `Quote ${quoteId} status changed to ${newStatus}`
        })
      }
    } catch (error) {
      alert('Error updating status: ' + error.message)
    }
  }

  // Delete quote
  const handleDeleteQuote = async (quoteId) => {
    try {
      await api(`/quotes/${quoteId}`, { method: "DELETE" })
      setQuotes(prevQuotes => prevQuotes.filter(q => q.quote_id !== quoteId))
      setInvoices(prevInvoices => prevInvoices.filter(inv => inv.quote_id !== quoteId))
      
      if (window.toast) {
        window.toast('Quote deleted!', {
          title: '✅ Success',
          description: `Quote ${quoteId} has been permanently deleted.`
        })
      }
    } catch (error) {
      console.error('Delete Quote Error:', error)
      alert(`Error deleting quote: ${error.message}`)
    }
  }

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (deleteModal.quoteId) {
      await handleDeleteQuote(deleteModal.quoteId)
    }
    setDeleteModal({ isOpen: false, quoteId: null, quoteStatus: null })
  }

  // Save edit
  const handleSaveEdit = async (quoteId, updatedData) => {
    try {
      const { client_id, ...updatePayload } = updatedData
      await api(`/quotes/${quoteId}`, {
        method: "PUT",
        body: JSON.stringify(updatePayload)
      })
      fetchQuotes()

      if (window.toast) {
        window.toast("Quote updated!", {
          title: "✅ Success",
          description: `Quote ${quoteId} has been updated.`
        })
      }
    } catch (error) {
      console.error("Edit Quote Error:", error)
      alert("Error updating quote: " + error.message)
      throw error
    }
  }

  // Create quote
  const handleCreateQuote = async (e) => {
    e.preventDefault()
    if (!selectedClient) {
      alert('Please select a client')
      return
    }
    if (quoteItems.length === 0 || !quoteItems[0].product_name) {
      alert('Please add at least one product')
      return
    }
    setLoading(true)
    try {
      const data = await api("/quotes/", {
        method: "POST",
        body: JSON.stringify({
          client_id: selectedClient.id,
          project_name: projectName,
          notes: notes,
          included_charges: charges,
          items: quoteItems
        })
      })
      alert(`Quote created successfully! ID: ${data.quote_id}`)
      fetchQuotes()
      
      // Reset form
      setSelectedClient(null)
      setQuoteItems([{ product_name: '', quantity: 1, unit_price: 0, discount_type: 'none', discount_value: 0 }])
      setProjectName('')
      setNotes('')
      setCharges({
        supervision: true,
        supervision_percentage: 10,
        admin: true,
        admin_percentage: 4,
        insurance: true,
        insurance_percentage: 1,
        transport: true,
        transport_percentage: 3,
        contingency: true,
        contingency_percentage: 3
      })
    } catch (error) {
      alert('Error creating quote: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter quotes using merged data
  const mergedQuotes = getMergedQuotes()
  const safeQuotes = Array.isArray(mergedQuotes) ? mergedQuotes : []
  const filteredQuotes = statusFilter === 'all'
    ? safeQuotes
    : safeQuotes.filter(q => q.status === statusFilter)

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>METPRO ERP - Quotes</h1>
      
      {/* Create Quote Form */}
      <div className='bg-white rounded-lg shadow p-6 mb-8'>
        <h2 className='text-xl font-semibold mb-4'>Create New Quote</h2>
        
        <div className='mb-4'>
          <label className='block text-sm font-medium mb-2'>Select Client *</label>
          <select
            value={selectedClient ? selectedClient.id : ''}
            onChange={(e) => setSelectedClient(clients.find(c => c.id == e.target.value))}
            className='w-full border p-2 rounded'
            required
          >
            <option value=''>-- Select Client --</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.company_name} - {client.contact_name || 'No contact'}</option>
            ))}
          </select>
        </div>
        
        {selectedClient && (
          <>
            <div className='mb-4'>
              <label className='block text-sm font-medium mb-2'>Project Name</label>
              <input
                type='text'
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className='w-full border p-2 rounded'
                placeholder='e.g., Construction Project'
              />
            </div>
            
            <div className='mb-4'>
              <label className='block text-sm font-medium mb-2'>Products/Items</label>
              {quoteItems.map((item, index) => (
                <div key={index} className='flex flex-wrap md:flex-nowrap gap-2 mb-2'>
                  {/* Product Name + DB Button */}
                  <div className='flex gap-1 flex-1 min-w-[200px]'>
                    <input
                      type='text'
                      placeholder='Product name'
                      value={item.product_name}
                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                      className='flex-1 border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                    <button
                      type='button'
                      onClick={() => {
                        console.log('DB button clicked for row', index)
                        setProductModal({ isOpen: true, itemIndex: index })
                        setSearchTerm('')
                      }}
                      className='bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded transition-colors whitespace-nowrap'
                      title='Select from product database'
                    >
                      Base Datos
                    </button>
                  </div>
                  
                  {/* Quantity */}
                  <input
                    type='number'
                    placeholder='Qty'
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className='w-20 md:w-24 border p-2 rounded'
                    min='0'
                    step='0.01'
                  />
                  
                  {/* Unit Price */}
                  <input
                    type='number'
                    placeholder='Unit Price'
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    className='w-28 md:w-32 border p-2 rounded'
                    min='0'
                    step='0.01'
                  />
                  
                  {/* Discount Type */}
                  <select
                    value={item.discount_type}
                    onChange={(e) => handleItemChange(index, 'discount_type', e.target.value)}
                    className='w-28 md:w-32 border p-2 rounded'
                  >
                    <option value='none'>No Discount</option>
                    <option value='percentage'>%</option>
                    <option value='fixed'>Fixed</option>
                  </select>
                  
                  {/* Discount Value */}
                  {item.discount_type !== 'none' && (
                    <input
                      type='number'
                      placeholder='Value'
                      value={item.discount_value}
                      onChange={(e) => handleItemChange(index, 'discount_value', parseFloat(e.target.value) || 0)}
                      className='w-20 md:w-24 border p-2 rounded'
                      min='0'
                      step='0.01'
                    />
                  )}
                  
                  {/* Remove Button */}
                  <button
                    type='button'
                    onClick={() => handleRemoveItem(index)}
                    className='bg-red-500 hover:bg-red-600 text-white px-3 rounded font-medium'
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type='button'
                onClick={handleAddItem}
                className='mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600'
              >
                ➕ Add Item
              </button>
            </div>
            
            <div className='mb-4'>
              <SurchargeControls
                charges={charges}
                onChargesChange={setCharges}
              />
            </div>
            
            <div className='mb-4'>
              <label className='block text-sm font-medium mb-2'>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className='w-full border p-2 rounded'
                rows='3'
                placeholder='Additional notes for this quote...'
              />
            </div>
            
            {totals && (
              <div className='bg-blue-50 p-4 rounded mb-4'>
                <h3 className='font-bold mb-2'>💰 Quote Totals</h3>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <div className='flex justify-between'>
                      <span>Items Total:</span>
                      <span>${totals.items_total}</span>
                    </div>
                    {parseFloat(totals.total_discounts) > 0 && (
                      <div className='flex justify-between text-red-600'>
                        <span>Discounts:</span>
                        <span>-${totals.total_discounts}</span>
                      </div>
                    )}
                    <div className='flex justify-between font-medium mt-2 pt-2 border-t'>
                      <span>Subtotal:</span>
                      <span>${totals.subtotal_general}</span>
                    </div>
                  </div>
                  <div>
                    {charges.supervision && (
                      <div className='flex justify-between text-sm'>
                        <span>Supervision ({charges.supervision_percentage}%):</span>
                        <span>${totals.supervision}</span>
                      </div>
                    )}
                    {charges.admin && (
                      <div className='flex justify-between text-sm'>
                        <span>Admin ({charges.admin_percentage}%):</span>
                        <span>${totals.admin}</span>
                      </div>
                    )}
                    {charges.insurance && (
                      <div className='flex justify-between text-sm'>
                        <span>Insurance ({charges.insurance_percentage}%):</span>
                        <span>${totals.insurance}</span>
                      </div>
                    )}
                    {charges.transport && (
                      <div className='flex justify-between text-sm'>
                        <span>Transport ({charges.transport_percentage}%):</span>
                        <span>${totals.transport}</span>
                      </div>
                    )}
                    {charges.contingency && (
                      <div className='flex justify-between text-sm'>
                        <span>Contingency ({charges.contingency_percentage}%):</span>
                        <span>${totals.contingency}</span>
                      </div>
                    )}
                    <div className='flex justify-between font-medium pt-2 border-t'>
                      <span>ITBIS (18%):</span>
                      <span>${totals.itbis}</span>
                    </div>
                    <div className='flex justify-between text-xl font-bold mt-2 pt-2 border-t border-blue-500'>
                      <span>TOTAL:</span>
                      <span>${totals.grand_total}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <button
              type='button'
              onClick={handleCreateQuote}
              disabled={loading}
              className='w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 disabled:opacity-50 font-bold text-lg'
            >
              {loading ? 'Creating Quote...' : 'CREATE QUOTE'}
            </button>
          </>
        )}
      </div>
      
      {/* Quotes List */}
      <div className='bg-white rounded-lg shadow overflow-visible'>
        <div className='p-4 border-b font-bold flex justify-between items-center'>
          <span>Quote History ({safeQuotes.length})</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='border p-1 rounded text-sm'
          >
            <option value='all'>All Statuses</option>
            <option value='Draft'>Draft</option>
            <option value='Approved'>Approved</option>
            <option value='Invoiced'>Invoiced</option>
            <option value='Cancelled'>Cancelled</option>
          </select>
        </div>
        
        {safeQuotes.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            No quotes yet. Create one above!
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            No quotes match the selected status filter.
          </div>
        ) : (
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='p-3 text-left'>Quote ID</th>
                <th className='p-3 text-left'>Client</th>
                <th className='p-3 text-left'>Project</th>
                <th className='p-3 text-left'>Date</th>
                <th className='p-3 text-right'>Amount</th>
                <th className='p-3 text-left'>Status</th>
                <th className='p-3 text-right'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((quote) => (
                <tr key={quote.quote_id} className='border-t hover:bg-gray-50'>
                  <td className='p-3 font-medium'>{quote.quote_id}</td>
                  <td className='p-3'>{quote.client_name}</td>
                  <td className='p-3'>{quote.project_name || '-'}</td>
                  <td className='p-3'>{quote.date}</td>
                  <td className='p-3 text-right font-bold'>${quote.total_amount.toFixed(2)}</td>
                  <td className='p-3'>
                    <StatusPill status={quote.status} />
                    {quote.has_invoice && (
                      <div className='text-xs text-blue-600 mt-1'>Invoice: {quote.invoice_number}</div>
                    )}
                  </td> 
                  <td className='p-3 text-right'>
                    <div className='flex items-center gap-2 justify-end'>
                      <PrimaryActionButton
                        quote={quote}
                        onApprove={() => handleUpdateStatus(quote.quote_id, 'Approved')}
                        onConvert={() => handleConvertToInvoice(quote.quote_id)}
                        onViewInvoice={() => {
                          if (quote.has_invoice) {
                            window.location.href = `/invoices?invoice_id=${quote.invoice_id}`
                          } else {
                            alert('This quote has not been converted to an invoice yet.')
                          }
                        }}
                      />
                      <OverflowMenu
                        quote={quote}
                        onPreviewPDF={() => handlePreviewPDF(quote.quote_id)}
                        onDownloadPDF={() => handleDownloadPDF(quote.quote_id)}
                        onGenerateConduce={() => handleGenerateConduce(quote.quote_id)}
                        onDuplicate={() => handleDuplicateQuote(quote.quote_id)}
                        onEdit={() => {
                          const fullQuote = quotes.find(q => q.quote_id === quote.quote_id)
                          setEditModal({ isOpen: true, quote: fullQuote })
                        }}
                        onDelete={() => setDeleteModal({ 
                          isOpen: true, 
                          quoteId: quote.quote_id,
                          quoteStatus: quote.status
                        })}
                        onApprove={() => handleUpdateStatus(quote.quote_id, 'Approved')}
                        onConvertToInvoice={() => handleConvertToInvoice(quote.quote_id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PDF Preview Modal */}
      {previewPDF.isOpen && (
        <PDFPreviewModal
          isOpen={previewPDF.isOpen}
          onClose={() => {
            if (previewPDF.pdfUrl && previewPDF.pdfUrl.startsWith('blob:')) {
              window.URL.revokeObjectURL(previewPDF.pdfUrl)
            }
            setPreviewPDF({ isOpen: false, quoteId: null, pdfUrl: null })
          }}
          quoteId={previewPDF.quoteId}
          pdfUrl={previewPDF.pdfUrl}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      <DeleteQuoteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, quoteId: null, quoteStatus: null })}
        onConfirm={handleConfirmDelete}
        quoteId={deleteModal.quoteId}
        quoteStatus={deleteModal.quoteStatus}
      />
      
      {/* Edit Quote Modal */}
      <EditQuoteModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, quote: null })}
        quote={editModal.quote}
        onSave={handleSaveEdit}
        clients={clients}
      />
      
      {/* Product Selection Modal */}
      {productModal.isOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto'>
          <div className='bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col'>
            <div className='flex items-center justify-between p-5 border-b'>
              <h3 className='text-xl font-bold text-gray-900'>Select Product from Database</h3>
              <button 
                onClick={() => setProductModal({ isOpen: false, itemIndex: null })} 
                className='text-gray-400 hover:text-gray-600 text-2xl'
              >
                &times;
              </button>
            </div>
            
            <div className='p-4 border-b'>
              <div className='relative'>
                <input
                  type='text'
                  placeholder='🔍 Search products by name...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full border border-gray-300 rounded-lg py-2 px-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  autoFocus
                />
                <div className='absolute left-3 top-2.5 text-gray-400'>
                  <span>🔍</span>
                </div>
              </div>
            </div>
            
            <div className='flex-1 overflow-y-auto p-4'>
              {products.length === 0 ? (
                <div className='text-center text-gray-500 py-8'>
                  <div className='text-4xl mb-2'>📦</div>
                  <p className='font-medium'>No products in database yet</p>
                  <p className='text-sm mt-1'>Go to Products page to add products first</p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {products
                    .filter(product => 
                      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map(product => (
                      <div 
                        key={product.id} 
                        onClick={() => selectProduct(product)}
                        className='border rounded-lg p-3 hover:bg-blue-50 cursor-pointer transition flex justify-between items-center'
                      >
                        <div>
                          <div className='font-medium text-gray-900'>{product.name}</div>
                          {product.description && (
                            <div className='text-sm text-gray-600 mt-1'>{product.description}</div>
                          )}
                        </div>
                        <div className='font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded whitespace-nowrap'>
                          ${parseFloat(product.unit_price).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  {products.filter(p => 
                    p.name.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 && searchTerm && (
                    <div className='text-center text-gray-500 py-4'>
                      No products match &quot;{searchTerm}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className='p-4 border-t bg-gray-50 flex justify-end'>
              <button
                onClick={() => setProductModal({ isOpen: false, itemIndex: null })}
                className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}