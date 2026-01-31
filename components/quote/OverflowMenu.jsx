'use client'

import { useState, useRef, useEffect } from 'react'

export default function OverflowMenu({ quote, onPreviewPDF, onDownloadPDF, onGenerateConduce, onDuplicate, onEdit, onDelete }) {
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

  // DEBUG: Log status value for troubleshooting
console.log('🔍 OverflowMenu - Quote:', quote.quote_id, 'Status:', quote.status, 'Type:', typeof quote.status)

const menuItems = [
  { label: 'Preview PDF', onClick: onPreviewPDF, icon: '👁️', show: true },
  { label: 'Download PDF', onClick: onDownloadPDF, icon: '⬇️', show: true },
  { 
    label: 'Generate Conduce', 
    onClick: onGenerateConduce, 
    icon: '🚚', 
    // CASE-INSENSITIVE CHECK - fixes 90% of issues
    show: quote.status?.toString().toLowerCase() === 'invoiced',
    title: 'Generate delivery note (no prices)'
  },
  { 
    label: 'Duplicate Quote', 
    onClick: onDuplicate, 
    icon: '📋', 
    show: quote.status?.toString().toLowerCase() !== 'invoiced'
  },
  { 
    label: 'Edit Quote', 
    onClick: onEdit, 
    icon: '✏️',
    show: quote.status?.toString().toLowerCase() === 'draft',
    title: 'Only Draft quotes can be edited'
  },
  { 
    label: 'Delete Quote', 
    onClick: onDelete, 
    icon: '🗑️',
    show: quote.status?.toString().toLowerCase() !== 'invoiced',
    danger: true,
    title: 'Invoiced quotes cannot be deleted'
  }
].filter(item => item.show !== false)

// DEBUG: Log which items will show
console.log('✅ Menu items to display:', menuItems.filter(i => i.show).map(i => i.label))

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
                if (!item.disabled) {
                  item.onClick()
                  setIsOpen(false)
                }
              }}
              disabled={item.disabled}
              title={item.title || ''}
              className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center space-x-2 transition-colors ${
                item.danger
                  ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                  : item.disabled
                  ? 'text-gray-300 cursor-not-allowed'
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