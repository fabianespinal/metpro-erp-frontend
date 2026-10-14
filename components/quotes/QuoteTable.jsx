import { dt } from "@/components/ui/data-table";
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
    <table className={dt.table}>
      <thead className={dt.thead}>
        <tr>
          <th className={dt.th}>Quote ID</th>
          <th className={dt.th}>Client</th>
          <th className={dt.th}>Project</th>
          <th className={dt.th}>Date</th>
          <th className={dt.thRight}>Amount</th>
          <th className={dt.th}>Status</th>
          <th className={dt.thRight}>Actions</th>
        </tr>
      </thead>

      <tbody className={dt.tbody}>
        {quotes.map((quote) => (
          <tr key={quote.quote_id} className={dt.tr}>
            <td className={dt.td}>{quote.quote_id}</td>
            <td className={dt.td}>{quote.client_name}</td>
            <td className={dt.td}>{quote.project_name || '-'}</td>
            <td className={dt.td}>{quote.date}</td>

            <td className={dt.tdRight}>
              ${ (quote.total_amount ?? 0).toFixed(2) }
            </td>

            <td className={dt.td}>
              <StatusPill status={quote.status} />
              {quote.has_invoice && (
                <div className='text-xs text-blue-600 mt-1'>
                  Invoice: {quote.invoice_number}
                </div>
              )}
            </td>

            <td className={dt.tdRight}>
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

