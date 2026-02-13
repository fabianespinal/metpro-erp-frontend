'use client'

import { useState, useEffect } from 'react'

export default function EditQuoteModal({ isOpen, onClose, quote, onSave, clients }) {
  const [formData, setFormData] = useState({
    client_id: '',
    project_name: '',
    notes: '',
    items: [{ product_name: '', quantity: 1, unit_price: 0, discount_type: 'none', discount_value: 0 }],
    included_charges: {
      supervision: true, supervision_percentage: 10,
      admin: true, admin_percentage: 4,
      insurance: true, insurance_percentage: 1,
      transport: true, transport_percentage: 3,
      contingency: true, contingency_percentage: 3
    }
  })

  useEffect(() => {
    if (isOpen && quote) {
      // Fetch full quote details if needed
      setFormData({
        client_id: quote.client_id || quote.client_id || '',
        project_name: quote.project_name || '',
        notes: quote.notes || '',
        items: quote.items || [{ product_name: '', quantity: 1, unit_price: 0, discount_type: 'none', discount_value: 0 }],
        included_charges: quote.included_charges || {
          supervision: true, supervision_percentage: 10,
          admin: true, admin_percentage: 4,
          insurance: true, insurance_percentage: 1,
          transport: true, transport_percentage: 3,
          contingency: true, contingency_percentage: 3
        }
      })
    }
  }, [isOpen, quote])

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_name: '', quantity: 1, unit_price: 0, discount_type: 'none', discount_value: 0 }]
    })
  }

  const handleRemoveItem = (index) => {
    const newItems = [...formData.items]
    newItems.splice(index, 1)
    setFormData({ ...formData, items: newItems })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await onSave(quote.quote_id, {
        client_id: parseInt(formData.client_id),
        project_name: formData.project_name,
        notes: formData.notes,
        items: formData.items,
        included_charges: formData.included_charges
      })
      onClose()
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-xl font-bold text-gray-900">✏️ Edit Quote: {quote?.quote_id}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Client *</label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                className="w-full border p-2 rounded mt-1"
                required
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.company_name} {client.contact_name ? `(${client.contact_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Project Name</label>
              <input
                type="text"
                value={formData.project_name}
                onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                className="w-full border p-2 rounded mt-1"
                placeholder="e.g., Office Building Renovation"
              />
            </div>
            
            {/* Items Table */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Items</label>
                <button type="button" onClick={handleAddItem} className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded">
                  ➕ Add Item
                </button>
              </div>
              
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item.product_name}
                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                      placeholder="Product name"
                      className="flex-1 border p-2 rounded"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                      className="w-20 border p-2 rounded"
                      min="0"
                      step="0.01"
                    />
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                      className="w-28 border p-2 rounded"
                      min="0"
                      step="0.01"
                    />
                    <select
                      value={item.discount_type}
                      onChange={(e) => handleItemChange(index, 'discount_type', e.target.value)}
                      className="w-28 border p-2 rounded"
                    >
                      <option value="none">No Discount</option>
                      <option value="percentage">%</option>
                      <option value="fixed">Fixed</option>
                    </select>
                    {item.discount_type !== 'none' && (
                      <input
                        type="number"
                        value={item.discount_value}
                        onChange={(e) => handleItemChange(index, 'discount_value', parseFloat(e.target.value) || 0)}
                        placeholder="Value"
                        className="w-20 border p-2 rounded"
                        min="0"
                        step="0.01"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="bg-red-500 text-white px-3 rounded hover:bg-red-600 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Surcharge Controls */}
            <div>
              <label className="block text-sm font-medium mb-2">Charges</label>
              <div className="space-y-2">
                {Object.entries(formData.included_charges).map(([key, value]) => {
                  if (key.includes('percentage')) return null
                  const percentageKey = `${key}_percentage`
                  return (
                    <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`charge-${key}`}
                          checked={value}
                          onChange={(e) => setFormData({
                            ...formData,
                            included_charges: {
                              ...formData.included_charges,
                              [key]: e.target.checked
                            }
                          })}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`charge-${key}`} className="text-sm font-medium capitalize">
                          {key.replace('_', ' ')}
                        </label>
                      </div>
                      <input
                        type="number"
                        value={formData.included_charges[percentageKey] || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          included_charges: {
                            ...formData.included_charges,
                            [percentageKey]: parseFloat(e.target.value) || 0
                          }
                        })}
                        disabled={!value}
                        className={`w-20 text-right border p-1 rounded text-sm ${
                          !value ? 'bg-gray-100 text-gray-400' : ''
                        }`}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full border p-2 rounded mt-1"
                rows="3"
                placeholder="Additional notes for this quote..."
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}