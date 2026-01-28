'use client'

import { useState, useEffect } from 'react'

export default function QuotesPage() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [quoteItems, setQuoteItems] = useState([{ product_name: '', quantity: 1, unit_price: 0, discount_type: 'none', discount_value: 0 }])
  const [projectName, setProjectName] = useState('')
  const [notes, setNotes] = useState('')
  const [charges, setCharges] = useState({
    supervision: true,
    admin: true,
    insurance: true,
    transport: true,
    contingency: true
  })
  const [totals, setTotals] = useState(null)
  const [loading, setLoading] = useState(false)
  const [quotes, setQuotes] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')

  // 🔑 HELPER: Get auth headers with token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  useEffect(() => {
    fetchClients()
    fetchQuotes()
  }, [])

  useEffect(() => {
    calculateTotals()
  }, [quoteItems, charges])

  // 🔑 UPDATED: Fetch clients WITH token
  const fetchClients = async () => {
    try {
      const response = await fetch('https://metpro-erp-api.onrender.com/clients/', {
        headers: getAuthHeaders()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setClients(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch clients:', error)
      setClients([])
    }
  }

  // 🔑 UPDATED: Fetch quotes WITH token
  const fetchQuotes = async () => {
    try {
      const response = await fetch('https://metpro-erp-api.onrender.com/quotes/', {
        headers: getAuthHeaders()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setQuotes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
      setQuotes([])
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
    
    const supervision = charges.supervision ? items_after_discount * 0.10 : 0
    const admin = charges.admin ? items_after_discount * 0.04 : 0
    const insurance = charges.insurance ? items_after_discount * 0.01 : 0
    const transport = charges.transport ? items_after_discount * 0.03 : 0
    const contingency = charges.contingency ? items_after_discount * 0.03 : 0
    
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
    // Auto-fill price when product is selected from dropdown
    if (field === 'product_name') {
      // Note: Product auto-suggest would go here (future enhancement)
    }
    newItems[index][field] = value
    setQuoteItems(newItems)
  }

  // 🔑 UPDATED: Download PDF WITH token
  const handleDownloadPDF = async (quoteId) => {
    try {
      const response = await fetch(`https://metpro-erp-api.onrender.com/quotes/${quoteId}/pdf`, {
        headers: getAuthHeaders()
      })
      if (!response.ok) throw new Error('Failed to generate PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${quoteId}_cotizacion.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('Error downloading PDF: ' + error.message)
    }
  }

  // 🔑 UPDATED: Duplicate quote WITH token
  const handleDuplicateQuote = async (quoteId) => {
    if (!confirm('Duplicate this quote?')) return
    
    try {
      const response = await fetch(`https://metpro-erp-api.onrender.com/quotes/${quoteId}/duplicate`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) throw new Error('Failed to duplicate quote')
      
      const data = await response.json()
      alert(`Quote duplicated! New ID: ${data.quote_id}`)
      fetchQuotes()
    } catch (error) {
      alert('Error duplicating quote: ' + error.message)
    }
  }

  // 🔑 UPDATED: Convert to invoice WITH token
  const handleConvertToInvoice = async (quoteId) => {
    if (!confirm(`Convert quote ${quoteId} to invoice? This cannot be undone.`)) return
    
    try {
      const response = await fetch(`https://metpro-erp-api.onrender.com/quotes/${quoteId}/convert-to-invoice`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to convert to invoice')
      }
      
      alert(`✅ Converted to invoice!\nID: ${data.invoice_id}\nStatus: ${data.status}`)
      fetchQuotes()
    } catch (error) {
      alert(`❌ Error converting to invoice:\n${error.message}`)
    }
  }

  // 🔑 UPDATED: Update status WITH token
  const handleUpdateStatus = async (quoteId, newStatus) => {
    try {
      const response = await fetch(`https://metpro-erp-api.onrender.com/quotes/${quoteId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update status')
      
      fetchQuotes()
    } catch (error) {
      alert('Error updating status: ' + error.message)
    }
  }

  // 🔑 UPDATED: Create quote WITH token
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
      const response = await fetch('https://metpro-erp-api.onrender.com/quotes/', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          client_id: selectedClient.id,
          project_name: projectName,
          notes: notes,
          included_charges: charges,
          items: quoteItems
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create quote')
      }

      const data = await response.json()
      alert(`Quote created successfully! ID: ${data.quote_id}`)
      fetchQuotes()
      
      setSelectedClient(null)
      setQuoteItems([{ product_name: '', quantity: 1, unit_price: 0, discount_type: 'none', discount_value: 0 }])
      setProjectName('')
      setNotes('')
      setCharges({
        supervision: true,
        admin: true,
        insurance: true,
        transport: true,
        contingency: true
      })
    } catch (error) {
      alert('Error creating quote: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 🔑 SAFETY: Ensure quotes is always an array before filtering
  const safeQuotes = Array.isArray(quotes) ? quotes : []
  const filteredQuotes = statusFilter === 'all' 
    ? safeQuotes 
    : safeQuotes.filter(q => q.status === statusFilter)

  return (
    <div className='p-8 max-w-6xl mx-auto'>
      <h1 className='text-3xl font-bold mb-8 text-center'>📝 METPRO ERP - Quotes</h1>
      
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
                <div key={index} className='flex gap-2 mb-2'>
                  <input
                    type='text'
                    placeholder='Product name'
                    value={item.product_name}
                    onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                    className='flex-1 border p-2 rounded'
                  />
                  <input
                    type='number'
                    placeholder='Qty'
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className='w-24 border p-2 rounded'
                    min='0'
                    step='0.01'
                  />
                  <input
                    type='number'
                    placeholder='Unit Price'
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    className='w-32 border p-2 rounded'
                    min='0'
                    step='0.01'
                  />
                  <select
                    value={item.discount_type}
                    onChange={(e) => handleItemChange(index, 'discount_type', e.target.value)}
                    className='w-32 border p-2 rounded'
                  >
                    <option value='none'>No Discount</option>
                    <option value='percentage'>%</option>
                    <option value='fixed'>Fixed</option>
                  </select>
                  {item.discount_type !== 'none' && (
                    <input
                      type='number'
                      placeholder='Value'
                      value={item.discount_value}
                      onChange={(e) => handleItemChange(index, 'discount_value', parseFloat(e.target.value) || 0)}
                      className='w-24 border p-2 rounded'
                      min='0'
                      step='0.01'
                    />
                  )}
                  <button
                    type='button'
                    onClick={() => handleRemoveItem(index)}
                    className='bg-red-500 text-white px-3 rounded hover:bg-red-600'
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
              <label className='block text-sm font-medium mb-2'>Included Charges</label>
              <div className='grid grid-cols-2 md:grid-cols-5 gap-2'>
                <label className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={charges.supervision}
                    onChange={(e) => setCharges({...charges, supervision: e.target.checked})}
                    className='w-4 h-4'
                  />
                  <span>10% Supervision</span>
                </label>
                <label className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={charges.admin}
                    onChange={(e) => setCharges({...charges, admin: e.target.checked})}
                    className='w-4 h-4'
                  />
                  <span>4% Admin</span>
                </label>
                <label className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={charges.insurance}
                    onChange={(e) => setCharges({...charges, insurance: e.target.checked})}
                    className='w-4 h-4'
                  />
                  <span>1% Insurance</span>
                </label>
                <label className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={charges.transport}
                    onChange={(e) => setCharges({...charges, transport: e.target.checked})}
                    className='w-4 h-4'
                  />
                  <span>3% Transport</span>
                </label>
                <label className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={charges.contingency}
                    onChange={(e) => setCharges({...charges, contingency: e.target.checked})}
                    className='w-4 h-4'
                  />
                  <span>3% Contingency</span>
                </label>
              </div>
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
                        <span>Supervision (10%):</span>
                        <span>${totals.supervision}</span>
                      </div>
                    )}
                    {charges.admin && (
                      <div className='flex justify-between text-sm'>
                        <span>Admin (4%):</span>
                        <span>${totals.admin}</span>
                      </div>
                    )}
                    {charges.insurance && (
                      <div className='flex justify-between text-sm'>
                        <span>Insurance (1%):</span>
                        <span>${totals.insurance}</span>
                      </div>
                    )}
                    {charges.transport && (
                      <div className='flex justify-between text-sm'>
                        <span>Transport (3%):</span>
                        <span>${totals.transport}</span>
                      </div>
                    )}
                    {charges.contingency && (
                      <div className='flex justify-between text-sm'>
                        <span>Contingency (3%):</span>
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
              {loading ? 'Creating Quote...' : '📄 CREATE QUOTE'}
            </button>
          </>
        )}
      </div>
      
      {/* Quotes List */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
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
                    <div className='flex items-center gap-2'>
                      <select
                        value={quote.status}
                        onChange={(e) => handleUpdateStatus(quote.quote_id, e.target.value)}
                        className='px-2 py-1 rounded text-xs border text-gray-700'
                      >
                        <option value='Draft'>Draft</option>
                        <option value='Approved'>Approved</option>
                        <option value='Invoiced'>Invoiced</option>
                        <option value='Cancelled'>Cancelled</option>
                      </select>
                      <button
                        onClick={() => handleDownloadPDF(quote.quote_id)}
                        className='bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors'
                      >
                        📄 PDF
                      </button>
                      <button
                        onClick={() => handleDuplicateQuote(quote.quote_id)}
                        className='bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition-colors'
                      >
                        📋 Duplicate
                      </button>
                      {quote.status === 'Draft' && (
                        <button
                          onClick={() => handleConvertToInvoice(quote.quote_id)}
                          className='bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600 transition-colors'
                        >
                          💰 Invoice
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}