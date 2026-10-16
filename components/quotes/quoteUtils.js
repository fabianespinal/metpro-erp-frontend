/**
 * Default surcharge percentages
 * 5 static charges: supervision (10%), admin (4%), insurance (1%), transport (3%), contingency (3%)
 * Dynamic charges: up to 3 additional custom charges per quote
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
  contingency_percentage: 3,
  dynamic_charges: [],
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
 * Calculate quote totals (SAFE VERSION)
 * Supports static charges (5 types) and dynamic charges (up to 3 additional)
 *
 * @typedef {Object} QuoteTotals  All money values are fixed-2 strings.
 * @property {string} items_total
 * @property {string} total_discounts
 * @property {string} items_after_discount
 * @property {string} supervision
 * @property {string} admin
 * @property {string} insurance
 * @property {string} transport
 * @property {string} contingency
 * @property {string} dynamic_charges_total
 * @property {string} subtotal_general
 * @property {string} itbis
 * @property {string} grand_total
 *
 * @param {Array} quoteItems - Quote line items
 * @param {Object} charges - Charges config with static charges
 * @param {Array} [dynamicCharges] - Optional array of {id, name, enabled, percentage}
 * @returns {QuoteTotals} Totals breakdown with all charges
 */
export function calculateQuoteTotals(quoteItems, charges, dynamicCharges) {
  const items_total = quoteItems.reduce((sum, item) => {
    const qty = Number(item.quantity ?? 0)
    const price = Number(item.unit_price ?? 0)
    return sum + qty * price
  }, 0)

  const total_discounts = quoteItems.reduce((sum, item) => {
    const qty = Number(item.quantity ?? 0)
    const price = Number(item.unit_price ?? 0)
    const subtotal = qty * price
    const discountVal = Number(item.discount_value ?? 0)

    if (item.discount_type === 'percentage') {
      return sum + subtotal * (discountVal / 100)
    } else if (item.discount_type === 'fixed') {
      return sum + discountVal
    }
    return sum
  }, 0)

  const items_after_discount = items_total - total_discounts

  // Static charges (5 types)
  const supervision = charges.supervision
    ? items_after_discount * (Number(charges.supervision_percentage ?? 0) / 100)
    : 0

  const admin = charges.admin
    ? items_after_discount * (Number(charges.admin_percentage ?? 0) / 100)
    : 0

  const insurance = charges.insurance
    ? items_after_discount * (Number(charges.insurance_percentage ?? 0) / 100)
    : 0

  const transport = charges.transport
    ? items_after_discount * (Number(charges.transport_percentage ?? 0) / 100)
    : 0

  const contingency = charges.contingency
    ? items_after_discount * (Number(charges.contingency_percentage ?? 0) / 100)
    : 0

  // Dynamic charges (up to 3 additional)
  const dynamic_charges_total = (dynamicCharges ?? []).reduce((sum, dc) => {
    if (dc.enabled) {
      return sum + items_after_discount * (Number(dc.percentage ?? 0) / 100)
    }
    return sum
  }, 0)

  // Subtotal general: after discount + all charges
  const subtotal_general =
    items_after_discount +
    supervision +
    admin +
    insurance +
    transport +
    contingency +
    dynamic_charges_total

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
    dynamic_charges_total: dynamic_charges_total.toFixed(2),
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
