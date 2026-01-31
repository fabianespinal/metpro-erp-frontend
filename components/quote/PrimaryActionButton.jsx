'use client'

import { useState } from 'react'

export default function PrimaryActionButton({ quote, onApprove, onConvert }) {
  const [showConfirm, setShowConfirm] = useState(false)
  if (quote.status === 'Invoiced') return null  // ✅ REMOVED VIEW INVOICE BUTTON

  return (
    <>
      <button
        onClick={quote.status === 'Draft' ? onApprove : () => setShowConfirm(true)}
        className={`px-4 py-2 ${
          quote.status === 'Draft' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
        } text-white font-semibold rounded-lg`}
      >
        {quote.status === 'Draft' ? '✅ Approve Quote' : '💰 Convert to Invoice'}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md mx-4">
            <h3 className="text-lg font-bold mb-3">⚠️ Confirm Conversion</h3>
            <p className="mb-4">Convert {quote.quote_id} to invoice? This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={() => { onConvert(); setShowConfirm(false) }} className="px-4 py-2 bg-purple-600 text-white rounded">
                Convert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}