'use client'

import { useEffect } from 'react'

export default function PDFPreviewModal({ isOpen, onClose, quoteId, pdfUrl }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            📄 PDF Preview: {quoteId}
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // Download PDF
                window.open(pdfUrl, '_blank')
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          <iframe
            src={pdfUrl}
            className="w-full h-full min-h-[60vh] border-0"
            title={`PDF Preview - ${quoteId}`}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-500 bg-gray-50">
          <p>Use Ctrl + and Ctrl - to zoom in/out. Click outside to close.</p>
        </div>
      </div>
    </div>
  )
}