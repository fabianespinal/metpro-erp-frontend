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
  onConvertToInvoice,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className='relative' ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='p-2 hover:bg-gray-100 rounded-full transition'
        aria-label='More actions'
      >
        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
          <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
        </svg>
      </button>

      {isOpen && (
        <div className='absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-50'>
          <div className='py-1'>
            <button
              onClick={() => {
                onPreviewPDF()
                setIsOpen(false)
              }}
              className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2'
            >
              <span>👁️</span>
              <span>Preview PDF</span>
            </button>

            <button
              onClick={() => {
                onDownloadPDF()
                setIsOpen(false)
              }}
              className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2'
            >
              <span>⬇️</span>
              <span>Download PDF</span>
            </button>

            {quote.status === 'Draft' && (
              <button
                onClick={() => {
                  onApprove()
                  setIsOpen(false)
                }}
                className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-green-700'
              >
                <span>✓</span>
                <span>Approve Quote</span>
              </button>
            )}

            {quote.status === 'Approved' && !quote.has_invoice && (
              <button
                onClick={() => {
                  onConvertToInvoice()
                  setIsOpen(false)
                }}
                className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-blue-700'
              >
                <span>📄</span>
                <span>Convert to Invoice</span>
              </button>
            )}

            {quote.has_invoice && (
              <button
                onClick={() => {
                  onGenerateConduce()
                  setIsOpen(false)
                }}
                className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2'
              >
                <span>📦</span>
                <span>Generate Conduce</span>
              </button>
            )}

            <hr className='my-1' />

            <button
              onClick={() => {
                onDuplicate()
                setIsOpen(false)
              }}
              className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2'
            >
              <span>📋</span>
              <span>Duplicate</span>
            </button>

            <button
              onClick={() => {
                onEdit()
                setIsOpen(false)
              }}
              className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2'
            >
              <span>✏️</span>
              <span>Edit</span>
            </button>

            <hr className='my-1' />

            <button
              onClick={() => {
                onDelete()
                setIsOpen(false)
              }}
              className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600'
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
