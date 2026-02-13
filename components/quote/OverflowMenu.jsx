'use client'

import { useState, useRef, useEffect } from 'react'

export default function OverflowMenu({
  quote,
  onPreviewPDF,
  onDownloadPDF,
  onGenerateConduce,
  onDuplicate,
  onEdit,
  onDelete,
  onApprove,
  onConvertToInvoice
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Normalize status
  const status = quote.status?.toString().toLowerCase().trim()

  console.log(
    '🔍 OverflowMenu - Quote:',
    quote.quote_id,
    'Status:',
    quote.status,
    'Normalized:',
    status
  )

  const menuItems = [
    // Always available
    { label: 'Preview PDF', onClick: onPreviewPDF, icon: '👁️', show: true },
    { label: 'Download PDF', onClick: onDownloadPDF, icon: '⬇️', show: true },

    // Draft → Approve
    {
      label: 'Approve Quote',
      onClick: onApprove,
      icon: '✔️',
      show: status === 'draft'
    },

    // Approved → Convert to Invoice
    {
      label: 'Convert to Invoice',
      onClick: onConvertToInvoice,
      icon: '💳',
      show: status === 'approved'
    },

    // Invoiced → Generate Conduce
    {
      label: 'Generate Conduce',
      onClick: onGenerateConduce,
      icon: '🚚',
      show: status === 'invoiced'
    },

    // Duplicate allowed unless invoiced
    {
      label: 'Duplicate Quote',
      onClick: onDuplicate,
      icon: '📋',
      show: status !== 'invoiced'
    },

    // Edit only in Draft
    {
      label: 'Edit Quote',
      onClick: onEdit,
      icon: '✏️',
      show: status === 'draft'
    },

    // Delete allowed unless invoiced
    {
      label: 'Delete Quote',
      onClick: onDelete,
      icon: '🗑️',
      danger: true,
      show: status !== 'invoiced'
    }
  ].filter((item) => item.show)

  console.log('✅ Menu items to display:', menuItems.map((i) => i.label))

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
        aria-label="More actions"
      >
        <span className="text-xl">⋯</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick()
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center space-x-2 transition-colors ${
                item.danger
                  ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}