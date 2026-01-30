'use client'

import { useState, useRef, useEffect } from 'react'

export default function OverflowMenu({ quote, onPreviewPDF, onDownloadPDF, onDuplicate, onEdit, onDelete }) {
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

  const menuItems = [
  { label: 'Preview PDF', onClick: onPreviewPDF, icon: '👁️', show: true },
  { label: 'Download PDF', onClick: onDownloadPDF, icon: '⬇️', show: true },
  { label: 'Duplicate Quote', onClick: onDuplicate, icon: '📋', show: true },
  { label: 'Edit Quote', onClick: onEdit, icon: '✏️', show: quote.status === 'Draft' },
  { label: 'Delete Quote', onClick: onDelete, icon: '🗑️', show: quote.status !== 'Invoiced', danger: true }
].filter(item => item.show)

  if (menuItems.length === 0) return null

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
      >
        <span className="text-xl">⋯</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 animate-fade-in">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick()
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium ${
                item.danger 
                  ? 'text-red-600 hover:bg-red-50 hover:text-red-700' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              } flex items-center space-x-2 transition-colors duration-150`}
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