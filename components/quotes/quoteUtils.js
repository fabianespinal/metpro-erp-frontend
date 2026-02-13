/**
 * Default surcharge percentages
 */
export const DEFAULT_CHARGES = {
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
}

/**
 * Merge invoice data into quotes
 */
export function mergeQuotesWithInvoices(quotes, invoices) {
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

/**
 * Calculate quote totals
 */
export function calculateQuoteTotals(quoteItems, charges) {
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

  return {
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
  }
}

/**
 * Filter quotes by status
 */
export function filterQuotesByStatus(quotes, statusFilter) {
  if (statusFilter === 'all') {
    return quotes
  }
  return quotes.filter(q => q.status === statusFilter)
}
