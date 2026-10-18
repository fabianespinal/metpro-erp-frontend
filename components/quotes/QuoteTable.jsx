import { es } from "@/lib/i18n/es";
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
  setSentMap,
  onSent
}) {
  if (quotes.length === 0) {
    return (
      <div className='p-8 text-center text-muted'>
        {es.cot.sinResultados}
      </div>
    )
  }

  return (
    <table className={dt.table}>
      <thead className={dt.thead}>
        <tr>
          <th className={dt.th}>{es.cot.colNumero}</th>
          <th className={dt.th}>{es.cot.colCliente}</th>
          <th className={dt.th}>{es.cot.colProyecto}</th>
          <th className={dt.th}>{es.cot.colFecha}</th>
          <th className={dt.thRight}>{es.cot.colMonto}</th>
          <th className={dt.th}>{es.cot.colEstado}</th>
          <th className={dt.thRight}>Actions</th>
        </tr>
      </thead>

      <tbody className={dt.tbody}>
        {quotes.map((quote) => (
          <tr key={quote.quote_id} className={dt.tr}>
            <td className={dt.td}>{quote.quote_number != null ? `Q-${quote.quote_number}` : '—'}</td>
            <td className={dt.td}>{quote.client_name}</td>
            <td className={dt.td}>{quote.project_name || '-'}</td>
            <td className={dt.td}>{quote.created_at ? String(quote.created_at).slice(0, 10) : '—'}</td>

            <td className={dt.tdRight}>
              ${ Number(quote.grand_total ?? quote.total_amount ?? 0).toFixed(2) }
            </td>

            <td className={dt.td}>
              <StatusPill status={quote.status} gender="f" />
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
                {sentMap[quote.quote_id] && quote.status !== 'Sent' && <SentBadge />}
                {quote.status !== 'Draft' && (
                  <SendToClientButton
                    id={quote.quote_id}
                    type="quote"
                    onSent={() => {
                      setSentMap(prev => ({ ...prev, [quote.quote_id]: true }))
                      // Reload so the status pill shows Enviada without a manual refresh.
                      if (onSent) onSent(quote.quote_id)
                    }}
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

