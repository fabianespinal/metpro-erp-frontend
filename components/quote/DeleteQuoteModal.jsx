'use client'

export default function DeleteQuoteModal({ isOpen, onClose, onConfirm, quoteId, quoteStatus }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
            Delete Quote {quoteId}?
          </h3>
          
          <p className="text-gray-600 text-center mb-4">
            This action cannot be undone. The quote and all its items will be permanently deleted.
          </p>
          
          {quoteStatus === 'Approved' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-yellow-800 text-sm font-medium">
                ⚠️ This quote is Approved. Deleting it may affect your financial records.
              </p>
            </div>
          )}
          
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
            <p className="text-red-800 text-sm font-medium">
              Invoiced quotes cannot be deleted. This quote is <span className="font-bold">{quoteStatus}</span>.
            </p>
          </div>
        </div>
        
        <div className="px-6 pb-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  )
}