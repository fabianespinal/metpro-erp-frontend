import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export default function EditQuoteModal({ isOpen, onClose, quote, onSave, clients }) {
  const [formData, setFormData] = useState({
    client_id: '',
    project_name: '',
    notes: '',
    payment_terms: '',
    valid_until: '',
    status: 'Draft',
  })

  const [items, setItems] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    if (quote) {
      setFormData({
        client_id: quote.client_id || '',
        project_name: quote.project_name || '',
        notes: quote.notes || '',
        payment_terms: quote.payment_terms || '',
        valid_until: quote.valid_until ? quote.valid_until.slice(0, 10) : '',
        status: quote.status || 'Draft',
      })
      setItems(
        (quote.items || []).map((i) => ({
          product_name: i.product_name || '',
          quantity: Number(i.quantity) || 1,
          unit_price: Number(i.unit_price) || 0,
          discount_type: i.discount_type || 'none',
          discount_value: Number(i.discount_value) || 0,
        }))
      )
    }
  }, [quote])

  useEffect(() => {
    api.get('/products/').then((data) => {
      setProducts(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [])

  if (!isOpen || !quote) return null

  function addItem() {
    setItems([...items, { product_name: '', quantity: 1, unit_price: 0, discount_type: 'none', discount_value: 0 }])
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index, field, value) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  function selectProduct(index, productName) {
    const product = products.find(p => p.name === productName)
    const updated = [...items]
    updated[index] = {
      ...updated[index],
      product_name: productName,
      unit_price: product ? Number(product.price) : updated[index].unit_price,
    }
    setItems(updated)
  }

  function lineTotal(item) {
    const subtotal = item.quantity * item.unit_price
    if (item.discount_type === 'percentage') return subtotal * (1 - item.discount_value / 100)
    if (item.discount_type === 'fixed') return subtotal - item.discount_value
    return subtotal
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        payment_terms: formData.payment_terms || null,
        valid_until: formData.valid_until || null,
        items: items.map(i => ({
          product_name: i.product_name,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          discount_type: i.discount_type || 'none',
          discount_value: Number(i.discount_value) || 0,
        })),
      }
      await onSave(quote.quote_id, payload)
      onClose()
    } catch (error) {
      console.error('Error saving quote:', error)
    }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between p-6 border-b sticky top-0 bg-white'>
          <h3 className='text-xl font-bold text-gray-900'>Edit Quote: {quote.quote_id}</h3>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-2xl'>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-4'>

          {/* Client */}
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

          {/* Project Name */}
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

          {/* Status */}
          <div>
            <label className='block text-sm font-medium mb-2'>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className='w-full border border-gray-300 rounded-lg p-2'
            >
              <option value='Draft'>Draft</option>
              <option value='Sent'>Sent</option>
              <option value='Approved'>Approved</option>
              <option value='Rejected'>Rejected</option>
              <option value='Cancelled'>Cancelled</option>
              <option value='Invoiced'>Invoiced</option>
            </select>
          </div>

          {/* Items */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <label className='block text-sm font-medium'>Items</label>
              <button
                type='button'
                onClick={addItem}
                className='text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
              >
                + Add Item
              </button>
            </div>

            <div className='border border-gray-200 rounded-lg overflow-hidden'>
              <table className='w-full text-sm'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='text-left px-3 py-2 font-medium text-gray-600'>Product</th>
                    <th className='text-right px-3 py-2 font-medium text-gray-600 w-20'>Qty</th>
                    <th className='text-right px-3 py-2 font-medium text-gray-600 w-28'>Unit Price</th>
                    <th className='text-right px-3 py-2 font-medium text-gray-600 w-24'>Discount</th>
                    <th className='text-right px-3 py-2 font-medium text-gray-600 w-28'>Total</th>
                    <th className='w-10'></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className='border-t border-gray-100'>
                      <td className='px-3 py-2'>
                        <input
                          list={`products-${i}`}
                          value={item.product_name}
                          onChange={(e) => selectProduct(i, e.target.value)}
                          className='w-full border border-gray-300 rounded p-1 text-sm'
                          placeholder='Product name'
                        />
                        <datalist id={`products-${i}`}>
                          {products.map((p) => (
                            <option key={p.id} value={p.name} />
                          ))}
                        </datalist>
                      </td>
                      <td className='px-3 py-2'>
                        <input
                          type='number'
                          value={item.quantity}
                          onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                          className='w-full border border-gray-300 rounded p-1 text-right text-sm'
                          min='0'
                          step='0.01'
                        />
                      </td>
                      <td className='px-3 py-2'>
                        <input
                          type='number'
                          value={item.unit_price}
                          onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                          className='w-full border border-gray-300 rounded p-1 text-right text-sm'
                          min='0'
                          step='0.01'
                        />
                      </td>
                      <td className='px-3 py-2'>
                        <div className='flex gap-1'>
                          <select
                            value={item.discount_type}
                            onChange={(e) => updateItem(i, 'discount_type', e.target.value)}
                            className='border border-gray-300 rounded p-1 text-xs'
                          >
                            <option value='none'>None</option>
                            <option value='percentage'>%</option>
                            <option value='fixed'>$</option>
                          </select>
                          {item.discount_type !== 'none' && (
                            <input
                              type='number'
                              value={item.discount_value}
                              onChange={(e) => updateItem(i, 'discount_value', e.target.value)}
                              className='w-16 border border-gray-300 rounded p-1 text-right text-xs'
                              min='0'
                              step='0.01'
                            />
                          )}
                        </div>
                      </td>
                      <td className='px-3 py-2 text-right font-medium'>
                        ${lineTotal(item).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className='px-3 py-2'>
                        <button
                          type='button'
                          onClick={() => removeItem(i)}
                          className='text-red-400 hover:text-red-600 font-bold'
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className='px-3 py-4 text-center text-gray-400 text-sm'>
                        No items. Click "+ Add Item" to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
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

          {/* Payment Terms */}
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

          {/* Valid Until */}
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

