import { useState, useEffect } from 'react'
import { DEFAULT_CHARGES, calculateQuoteTotals } from './quoteUtils'

export function useQuoteForm() {
  const [selectedClient, setSelectedClient] = useState(null)
  const [quoteItems, setQuoteItems] = useState([
    { product_name: '', quantity: 1, unit_price: 0, discount_type: 'none', discount_value: 0 }
  ])
  const [projectName, setProjectName] = useState('')
  const [notes, setNotes] = useState('')
  const [charges, setCharges] = useState(DEFAULT_CHARGES)
  const [totals, setTotals] = useState(null)

  useEffect(() => {
    const newTotals = calculateQuoteTotals(quoteItems, charges)
    setTotals(newTotals)
  }, [quoteItems, charges])

  const handleAddItem = () => {
    setQuoteItems([...quoteItems, { 
      product_name: '', 
      quantity: 1, 
      unit_price: 0, 
      discount_type: 'none', 
      discount_value: 0 
    }])
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

  const selectProduct = (product, itemIndex) => {
    if (itemIndex !== null) {
      const newItems = [...quoteItems]
      newItems[itemIndex].product_name = product.name
      newItems[itemIndex].unit_price = parseFloat(product.unit_price) || 0
      setQuoteItems(newItems)
    }
  }

  const resetForm = () => {
    setSelectedClient(null)
    setQuoteItems([{ product_name: '', quantity: 1, unit_price: 0, discount_type: 'none', discount_value: 0 }])
    setProjectName('')
    setNotes('')
    setCharges(DEFAULT_CHARGES)
  }

  const getFormData = () => {
    if (!selectedClient) {
      throw new Error('Please select a client')
    }
    if (quoteItems.length === 0 || !quoteItems[0].product_name) {
      throw new Error('Please add at least one product')
    }

    return {
      client_id: selectedClient.id,
      project_name: projectName,
      notes: notes,
      included_charges: charges,
      items: quoteItems
    }
  }

  return {
    // State
    selectedClient,
    quoteItems,
    projectName,
    notes,
    charges,
    totals,
    
    // Setters
    setSelectedClient,
    setQuoteItems,
    setProjectName,
    setNotes,
    setCharges,
    
    // Handlers
    handleAddItem,
    handleRemoveItem,
    handleItemChange,
    selectProduct,
    resetForm,
    getFormData,
  }
}
