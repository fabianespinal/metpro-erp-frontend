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
      <div className='bg-surface rounded-lg shadow-card w-full max-w-3xl max-h-[90vh] flex flex-col'>

        {/* HEADER */}
        <div className='flex items-center justify-between p-5 border-b'>
          <h3 className='text-xl font-bold text-ink'>Select Product from Database</h3>
          <button
            onClick={onClose}
            className='text-muted hover:text-muted text-2xl'
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
              className='w-full border border-line rounded-lg py-2 px-4 pl-10 focus:ring-2 focus:ring-accent focus:border-accent'
              autoFocus
            />
            <div className='absolute left-3 top-2.5 text-muted'>
              <span>🔍</span>
            </div>
          </div>
        </div>

        {/* PRODUCT LIST */}
        <div className='flex-1 overflow-y-auto p-4'>
          {products.length === 0 ? (
            <div className='text-center text-muted py-8'>
              <div className='text-4xl mb-2'>📦</div>
              <p className='font-medium'>No products in database yet</p>
              <p className='text-sm mt-1'>Go to Products page to add products first</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className='text-center text-muted py-4'>
              No products match &quot;{searchTerm}&quot;
            </div>
          ) : (
            <div className='space-y-2'>
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => onSelect(product)}
                  className='border rounded-lg p-3 hover:bg-accent/10 cursor-pointer transition flex justify-between items-center'
                >
                  <div>
                    <div className='font-medium text-ink'>{product.name}</div>
                    {product.description && (
                      <div className='text-sm text-muted mt-1'>{product.description}</div>
                    )}
                  </div>

                  <div className='font-bold text-accent bg-accent/10 px-3 py-1 rounded whitespace-nowrap'>
                    ${ (Number(product.unit_price ?? 0) || 0).toFixed(2) }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className='p-4 border-t bg-canvas flex justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 border border-line rounded-lg hover:bg-canvas'
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  )
}
