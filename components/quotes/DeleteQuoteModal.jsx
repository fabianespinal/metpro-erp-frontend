export default function DeleteQuoteModal({ isOpen, onClose, onConfirm, quoteId, quoteStatus }) {
  if (!isOpen) return null

  const isInvoiced = quoteStatus === 'Invoiced'

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
      <div className='bg-surface rounded-lg shadow-card max-w-md w-full'>
        <div className='p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='text-4xl'>⚠️</div>
            <h3 className='text-xl font-bold text-ink'>Delete Quote</h3>
          </div>

          {isInvoiced ? (
            <div className='mb-6'>
              <p className='text-red-600 font-medium mb-2'>
                This quote has been converted to an invoice.
              </p>
              <p className='text-ink'>
                Deleting this quote will also delete the associated invoice. This action cannot be undone.
              </p>
            </div>
          ) : (
            <div className='mb-6'>
              <p className='text-ink'>
                Are you sure you want to delete quote <span className='font-bold'>{quoteId}</span>?
              </p>
              <p className='text-muted text-sm mt-2'>
                This action cannot be undone.
              </p>
            </div>
          )}

          <div className='flex gap-3 justify-end'>
            <button
              onClick={onClose}
              className='px-4 py-2 border border-line rounded-lg hover:bg-canvas'
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
