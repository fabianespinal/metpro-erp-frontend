import { useState } from 'react'

export default function ProductSelectionModal({ isOpen, onClose, onSelect, products }) {
  const [searchTerm, setSearchTerm] = useState('')

  if (!isOpen) return null

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col'>

        {/* HEADER */}
        <div className='flex items-center justify-between p-5 border-b'>
          <h3 className='text-xl font-bold text-gray-900'>Select Product from Database</h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 text-2xl'
          >
            &times;
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className='p-4 border-b'>
          <div className='relative'>
            <input
              type='text'
              placeholder='🔍 Search products by name...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full border border-gray-300 rounded-lg py-2 px-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              autoFocus
            />
            <div className='absolute left-3 top-2.5 text-gray-400'>
              <span>🔍</span>
            </div>
          </div>
        </div>

        {/* PRODUCT LIST */}
        <div className='flex-1 overflow-y-auto p-4'>
          {products.length === 0 ? (
            <div className='text-center text-gray-500 py-8'>
              <div className='text-4xl mb-2'>📦</div>
              <p className='font-medium'>No products in database yet</p>
              <p className='text-sm mt-1'>Go to Products page to add products first</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className='text-center text-gray-500 py-4'>
              No products match "{searchTerm}"
            </div>
          ) : (
            <div className='space-y-2'>
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => onSelect(product)}
                  className='border rounded-lg p-3 hover:bg-blue-50 cursor-pointer transition flex justify-between items-center'
                >
                  <div>
                    <div className='font-medium text-gray-900'>{product.name}</div>
                    {product.description && (
                      <div className='text-sm text-gray-600 mt-1'>{product.description}</div>
                    )}
                  </div>

                  <div className='font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded whitespace-nowrap'>
                    ${ (Number(product.unit_price ?? 0) || 0).toFixed(2) }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className='p-4 border-t bg-gray-50 flex justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100'
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  )
}
