export default function PDFPreviewModal({ isOpen, onClose, quoteId, pdfUrl }) {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col'>
        <div className='flex items-center justify-between p-4 border-b'>
          <h3 className='text-xl font-bold text-gray-900'>
            Quote Preview: {quoteId}
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 text-2xl font-bold'
          >
            &times;
          </button>
        </div>

        <div className='flex-1 overflow-hidden'>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className='w-full h-full'
              title={`Quote ${quoteId} Preview`}
            />
          ) : (
            <div className='flex items-center justify-center h-full'>
              <div className='text-center'>
                <div className='text-4xl mb-4'>📄</div>
                <p className='text-gray-600'>Loading PDF...</p>
              </div>
            </div>
          )}
        </div>

        <div className='p-4 border-t bg-gray-50 flex justify-end gap-2'>
          <button
            onClick={onClose}
            className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
