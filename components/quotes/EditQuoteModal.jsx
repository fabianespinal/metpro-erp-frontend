import { useState, useEffect } from 'react'

export default function EditQuoteModal({ isOpen, onClose, quote, onSave, clients }) {
  const [formData, setFormData] = useState({
    client_id: '',
    project_name: '',
    notes: '',
    payment_terms: '',
    valid_until: '',
    status: 'Draft',
  })

  useEffect(() => {
    if (quote) {
      setFormData({
        client_id: quote.client_id || '',
        project_name: quote.project_name || '',
        notes: quote.notes || '',
        payment_terms: quote.payment_terms || '',
        // valid_until comes back from the API as "YYYY-MM-DD" — the date input needs exactly that format
        valid_until: quote.valid_until ? quote.valid_until.slice(0, 10) : '',
        status: quote.status || 'Draft',
      })
    }
  }, [quote])

  if (!isOpen || !quote) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Strip empty strings back to null so the backend receives clean data
      const payload = {
        ...formData,
        payment_terms: formData.payment_terms || null,
        valid_until: formData.valid_until || null,
      }
      await onSave(quote.quote_id, payload)
      onClose()
    } catch (error) {
      console.error('Error saving quote:', error)
    }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between p-6 border-b sticky top-0 bg-white'>
          <h3 className='text-xl font-bold text-gray-900'>
            Edit Quote: {quote.quote_id}
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 text-2xl'
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Client</label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className='w-full border border-gray-300 rounded-lg p-2'
              required
            >
              <option value=''>-- Select Client --</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name} - {client.contact_name || 'No contact'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Project Name</label>
            <input
              type='text'
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              className='w-full border border-gray-300 rounded-lg p-2'
              placeholder='Enter project name'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className='w-full border border-gray-300 rounded-lg p-2'
            >
              <option value='Draft'>Draft</option>
              <option value='Approved'>Approved</option>
              <option value='Cancelled'>Cancelled</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className='w-full border border-gray-300 rounded-lg p-2'
              rows='3'
              placeholder='Additional notes'
            />
          </div>

          {/* ── New fields ── */}
          <div>
            <label className='block text-sm font-medium mb-2'>Términos de Pago</label>
            <textarea
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              className='w-full border border-gray-300 rounded-lg p-2'
              rows='3'
              placeholder='Ej: 50% anticipo, 50% contra entrega'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Válida Hasta</label>
            <input
              type='date'
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              className='w-full border border-gray-300 rounded-lg p-2'
            />
          </div>

          <div className='flex gap-3 justify-end pt-4 border-t'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
