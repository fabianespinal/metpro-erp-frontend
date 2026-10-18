import { es } from "@/lib/i18n/es";
export default function PrimaryActionButton({ quote, onApprove, onConvert, onViewInvoice }) {
  // Approve after finalize: Final or Sent. A Draft has no public_token and cannot be approved.
  if (quote.status === 'Final' || quote.status === 'Sent') {
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
        {es.cot.convertir}
      </button>
    )
  }

  if (quote.has_invoice) {
    return (
      <button
        onClick={onViewInvoice}
        className='px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-strong transition text-sm font-medium'
      >
        {es.cot.verFactura}
      </button>
    )
  }

  return null
}
