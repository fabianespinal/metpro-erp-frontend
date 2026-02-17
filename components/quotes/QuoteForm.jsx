import SurchargeControls from './SurchargeControls'
import QuoteItemRow from './QuoteItemRow'
import QuoteTotalsDisplay from './QuoteTotalsDisplay'

export default function QuoteForm({ 
  clients,
  selectedClient,
  setSelectedClient,
  projectName,
  setProjectName,
  quoteItems,
  handleAddItem,
  handleRemoveItem,
  handleItemChange,
  charges,
  setCharges,
  totals,
  notes,
  setNotes,

  // NEW FIELDS
  paymentTerms,
  setPaymentTerms,
  validUntil,
  setValidUntil,

  onSubmit,
  loading,
  onOpenProductModal
}) {
  return (
    <div className='bg-white rounded-lg shadow p-6 mb-8'>
      <h2 className='text-xl font-semibold mb-4'>Create New Quote</h2>
      
      {/* CLIENT SELECT */}
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
            <option key={client.id} value={client.id}>
              {client.company_name} - {client.contact_name || 'No contact'}
            </option>
          ))}
        </select>
      </div>

      {/* PROJECT NAME */}
      <div className='mb-4'>
        <label className='block text-sm font-medium mb-2'>Project Name (optional)</label>
        <input
          type='text'
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className='w-full border p-2 rounded'
          placeholder='Enter project name'
        />
      </div>

      {/* NEW FIELD: PAYMENT TERMS */}
      <div className='mb-4'>
        <label className='block text-sm font-medium mb-2'>Términos de Pago</label>
        <textarea
          value={paymentTerms}
          onChange={(e) => setPaymentTerms(e.target.value)}
          className='w-full border p-2 rounded'
          rows='2'
          placeholder='Ej: 50% anticipo, 50% contra entrega'
        />
      </div>

      {/* NEW FIELD: VALID UNTIL */}
      <div className='mb-4'>
        <label className='block text-sm font-medium mb-2'>Válida Hasta</label>
        <input
          type='date'
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
          className='w-full border p-2 rounded'
        />
      </div>

      {/* QUOTE ITEMS */}
      <div className='mb-4'>
        <label className='block text-sm font-medium mb-2'>Quote Items *</label>
        {quoteItems.map((item, index) => (
          <QuoteItemRow
            key={index}
            item={item}
            index={index}
            onRemove={handleRemoveItem}
            onChange={handleItemChange}
            onOpenProductModal={onOpenProductModal}
            showRemove={quoteItems.length > 1}
          />
        ))}
        
        <button
          type='button'
          onClick={handleAddItem}
          className='w-full bg-blue-100 text-blue-700 py-2 rounded hover:bg-blue-200'
        >
          + Add Item
        </button>
      </div>

      {/* SURCHARGES */}
      <SurchargeControls charges={charges} setCharges={setCharges} />

      {/* TOTALS */}
      <QuoteTotalsDisplay totals={totals} charges={charges} />

      {/* NOTES */}
      <div className='mb-4 mt-4'>
        <label className='block text-sm font-medium mb-2'>Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className='w-full border p-2 rounded'
          rows='3'
          placeholder='Any additional notes or terms'
        />
      </div>

      {/* SUBMIT BUTTON */}
      <button
        onClick={onSubmit}
        disabled={loading}
        className='w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400'
      >
        {loading ? 'Creating...' : 'Create Quote'}
      </button>
    </div>
  )
}