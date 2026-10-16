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
  onReject,
  onConvertToInvoice,
  onViewInvoice,
  sentMap,
  setSentMap
}) {
  if (quotes.length === 0) {
    return (
      <div className='p-8 text-center text-muted'>
        No quotes match the selected status filter.
      </div>
    )
  }

  return (
    <table className={dt.table}>
      <thead className={dt.thead}>
        <tr>
          <th className={dt.th}>No.</th>
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
            <td className={dt.td}>{quote.quote_number ?? '—'}</td>
            <td className={dt.td}>{quote.client_name}</td>
            <td className={dt.td}>{quote.project_name || '-'}</td>
            <td className={dt.td}>{quote.created_at ? String(quote.created_at).slice(0, 10) : '—'}</td>

            <td className={dt.tdRight}>
              ${ Number(quote.grand_total ?? quote.total_amount ?? 0).toFixed(2) }
            </td>

            <td className={dt.td}>
              <StatusPill status={quote.status} />
              <div className='text-xs text-muted mt-1'>
                Created by {quote.created_by_name || '—'}
              </div>
              {quote.has_invoice && (
                <div className='text-xs text-accent mt-1'>
                  Invoice: {quote.invoice_number}
                </div>
              )}
            </td>

            <td className={dt.tdRight}>
              <div className='flex items-center gap-2 justify-end'>
                {sentMap[quote.quote_id] && <SentBadge />}
                {quote.status !== 'Draft' && (
                  <SendToClientButton
                    id={quote.quote_id}
                    type="quote"
                    onSent={() => setSentMap(prev => ({ ...prev, [quote.quote_id]: true }))}
                  />
                )}
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
                  onReject={onReject ? () => onReject(quote.quote_id) : undefined}
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

