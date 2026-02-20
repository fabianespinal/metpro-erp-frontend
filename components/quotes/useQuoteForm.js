import { useState, useEffect } from 'react'
import { DEFAULT_CHARGES, calculateQuoteTotals } from './quoteUtils'
import { api } from '@/lib/api'

export function useQuoteForm() {
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedContact, setSelectedContact] = useState(null)
  const [contacts, setContacts] = useState([])
  const [quoteItems, setQuoteItems] = useState([
    { product_name: '', quantity: 1, unit_price: 0, discount_type: 'none', discount_value: 0 }
  ])
  const [projectName, setProjectName] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [charges, setCharges] = useState(DEFAULT_CHARGES)
  const [totals, setTotals] = useState(null)

  useEffect(() => {
  if (!selectedClient?.id) return

  let cancelled = false

  api.get(`/contacts/company/${selectedClient.id}`)
    .then(data => {
      if (!cancelled) {
        setContacts(Array.isArray(data) ? data : [])
        setSelectedContact(null)
      }
    })
    .catch(err => {
      console.error('Error loading contacts:', err)
      if (!cancelled) setContacts([])
    })

  return () => { cancelled = true }
}, [selectedClient?.id])

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
    setSelectedContact(null)
    setContacts([])
    setQuoteItems([{ product_name: '', quantity: 1, unit_price: 0, discount_type: 'none', discount_value: 0 }])
    setProjectName('')
    setNotes('')
    setPaymentTerms('')
    setValidUntil('')
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
      contact_id: selectedContact ? selectedContact.id : null,
      project_name: projectName,
      notes: notes,
      payment_terms: paymentTerms || null,
      valid_until: validUntil || null,
      included_charges: charges,
      items: quoteItems,
    }
  }

  return {
    selectedClient,
    selectedContact,
    contacts,
    quoteItems,
    projectName,
    notes,
    paymentTerms,
    validUntil,
    charges,
    totals,

    setSelectedClient,
    setSelectedContact,
    setQuoteItems,
    setProjectName,
    setNotes,
    setPaymentTerms,
    setValidUntil,
    setCharges,

    handleAddItem,
    handleRemoveItem,
    handleItemChange,
    selectProduct,
    resetForm,
    getFormData,
  }
}