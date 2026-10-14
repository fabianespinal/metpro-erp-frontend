export default function PrimaryActionButton({ quote, onApprove, onConvert, onViewInvoice }) {
  if (quote.status === 'Draft') {
    return (
      <button
        onClick={onApprove}
        className='px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-strong transition text-sm font-medium'
      >
        Approve
      </button>
    )
  }

  if (quote.status === 'Approved' && !quote.has_invoice) {
    return (
      <button
        onClick={onConvert}
        className='px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-strong transition text-sm font-medium'
      >
        Convert to Invoice
      </button>
    )
  }

  if (quote.has_invoice) {
    return (
      <button
        onClick={onViewInvoice}
        className='px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-strong transition text-sm font-medium'
      >
        View Invoice
      </button>
    )
  }

  return null
}
