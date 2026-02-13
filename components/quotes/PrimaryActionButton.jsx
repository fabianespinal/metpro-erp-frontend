export default function PrimaryActionButton({ quote, onApprove, onConvert, onViewInvoice }) {
  if (quote.status === 'Draft') {
    return (
      <button
        onClick={onApprove}
        className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium'
      >
        Approve
      </button>
    )
  }

  if (quote.status === 'Approved' && !quote.has_invoice) {
    return (
      <button
        onClick={onConvert}
        className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium'
      >
        Convert to Invoice
      </button>
    )
  }

  if (quote.has_invoice) {
    return (
      <button
        onClick={onViewInvoice}
        className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium'
      >
        View Invoice
      </button>
    )
  }

  return null
}
