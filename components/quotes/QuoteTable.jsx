import StatusPill from '@/components/ui/StatusPill'
import PrimaryActionButton from './PrimaryActionButton'
import OverflowMenu from './OverflowMenu'
import SentBadge from '@/components/SentBadge'
import SendToClientButton from '@/components/SendToClientButton'

export default function QuoteTable({ 
  quotes,
  onPreviewPDF,
  onDownloadPDF,
  onGenerateConduce,
  onDuplicate,
  onEdit,
  onDelete,
  onApprove,
  onConvertToInvoice,
  onViewInvoice,
  sentMap,
  setSentMap
}) {
  if (quotes.length === 0) {
    return (
      <div className='p-8 text-center text-gray-500'>
        No quotes match the selected status filter.
      </div>
    )
  }

  return (
    <table className='w-full'>
      <thead className='bg-gray-50'>
        <tr>
          <th className='p-3 text-left'>Quote ID</th>
          <th className='p-3 text-left'>Client</th>
          <th className='p-3 text-left'>Project</th>
          <th className='p-3 text-left'>Date</th>
          <th className='p-3 text-right'>Amount</th>
          <th className='p-3 text-left'>Status</th>
          <th className='p-3 text-right'>Actions</th>
        </tr>
      </thead>

      <tbody>
        {quotes.map((quote) => (
          <tr key={quote.quote_id} className='border-t hover:bg-gray-50'>
            <td className='p-3 font-medium'>{quote.quote_id}</td>
            <td className='p-3'>{quote.client_name}</td>
            <td className='p-3'>{quote.project_name || '-'}</td>
            <td className='p-3'>{quote.date}</td>

            <td className='p-3 text-right font-bold'>
              ${ (quote.total_amount ?? 0).toFixed(2) }
            </td>

            <td className='p-3'>
              <StatusPill status={quote.status} />
              {quote.has_invoice && (
                <div className='text-xs text-blue-600 mt-1'>
                  Invoice: {quote.invoice_number}
                </div>
              )}
            </td>

            <td className='p-3 text-right'>
              <div className='flex items-center gap-2 justify-end'>
                {sentMap[quote.quote_id] && <SentBadge />}
                <SendToClientButton
                  id={quote.quote_id}
                  type="quote"
                  onSent={() => setSentMap(prev => ({ ...prev, [quote.quote_id]: true }))}
                />
                <PrimaryActionButton
                  quote={quote}
                  onApprove={() => onApprove(quote.quote_id)}
                  onConvert={() => onConvertToInvoice(quote.quote_id)}
                  onViewInvoice={() => onViewInvoice(quote)}
                />

                <OverflowMenu
                  quote={quote}
                  onPreviewPDF={() => onPreviewPDF(quote.quote_id)}
                  onDownloadPDF={() => onDownloadPDF(quote.quote_id)}
                  onGenerateConduce={() => onGenerateConduce(quote.quote_id)}
                  onDuplicate={() => onDuplicate(quote.quote_id)}
                  onEdit={() => onEdit(quote)}
                  onDelete={() => onDelete(quote.quote_id, quote.status)}
                  onApprove={() => onApprove(quote.quote_id)}
                  onConvertToInvoice={() => onConvertToInvoice(quote.quote_id)}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

