'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"

export default function PrimaryActionButton({ quote, onApprove, onConvert, onViewInvoice }) {
  const [showConfirm, setShowConfirm] = useState(false)

  const getPrimaryAction = () => {
    switch (quote.status) {
      case 'Draft':
        return {
          label: 'Approve Quote',
          color: 'bg-blue-600 hover:bg-blue-700',
          onClick: onApprove,
          icon: '✅'
        }
      case 'Approved':
        return {
          label: 'Convert to Invoice',
          color: 'bg-purple-600 hover:bg-purple-700',
          onClick: () => setShowConfirm(true),
          icon: '💰'
        }
      case 'Invoiced':
        return {
          label: 'View Invoice',
          color: 'bg-green-600 hover:bg-green-700',
          onClick: onViewInvoice,
          icon: '📄'
        }
      default:
        return null
    }
  }

  const action = getPrimaryAction()

  if (!action) return null

  return (
    <>
      <button
        onClick={action.onClick}
        disabled={showConfirm}
        className={`px-4 py-2 ${action.color} text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50`}
      >
        <span className="flex items-center justify-center gap-2">
          <span className="text-lg">{action.icon}</span>
          <span>{action.label}</span>
        </span>
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">⚠️ Confirm Conversion</h3>
              <p className="text-gray-600">
                Are you sure you want to convert quote <strong>{quote.quote_id}</strong> to an invoice? 
                This action cannot be undone.
              </p>
            </div>
            
            <div className="px-6 pb-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConvert()
                  setShowConfirm(false)
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Convert to Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}