'use client'

import { useState, useEffect } from 'react'
import { api } from "@/lib/api"

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [newProduct, setNewProduct] = useState({ name: '', description: '', unit_price: 0 })
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [csvFile, setCsvFile] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  // Fetch products
  const fetchProducts = async () => {
    try {
      const data = await api('/products/', { method: 'GET' })   // ⭐ FIXED
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
    }
  }

  // Create product
  const handleCreateProduct = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api('/products/', {                                // ⭐ FIXED
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      })

      await fetchProducts()
      setNewProduct({ name: '', description: '', unit_price: 0 })
      alert('Product created successfully!')
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Update product
  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api(`/products/${editingProduct.id}/`, {            // ⭐ FIXED
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      })

      await fetchProducts()
      setEditingProduct(null)
      alert('Product updated successfully!')
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (!confirm('Delete this product?')) return

    try {
      await api(`/products/${productId}/`, { method: 'DELETE' }) // ⭐ FIXED
      await fetchProducts()
      alert('Product deleted!')
    } catch (error) {
      alert('Error deleting product: ' + error.message)
    }
  }

  // Import CSV
  const handleCsvImport = async (e) => {
    e.preventDefault()
    if (!csvFile) {
      alert('Please select a CSV file')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('file', csvFile)

    try {
      const data = await api('/products/import-csv/', {         // ⭐ FIXED
        method: 'POST',
        body: formData
      })

      setImportResult(data)
      await fetchProducts()
      setCsvFile(null)
      alert(`Imported ${data.imported} products!`)
    } catch (error) {
      alert('Error importing CSV: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='p-8 max-w-6xl mx-auto'>
      <h1 className='text-3xl font-bold mb-8 text-center'>METPRO ERP - Products</h1>

      {/* Import CSV */}
      <div className='bg-white rounded-lg shadow p-6 mb-8'>
        <h2 className='text-xl font-semibold mb-4'>Import Products from CSV</h2>
        <form onSubmit={handleCsvImport} className='flex gap-4'>
          <input
            type='file'
            accept='.csv'
            onChange={(e) => setCsvFile(e.target.files[0])}
            className='flex-1 border p-2 rounded'
          />
          <button
            type='submit'
            disabled={loading || !csvFile}
            className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-shadow disabled:opacity-50'
          >
            {loading ? 'Importing...' : 'Import CSV'}
          </button>
        </form>

        {importResult && (
          <div className='mt-4 p-4 bg-green-50 rounded'>
            <p>✅ Imported: {importResult.imported} products</p>
            {importResult.skipped > 0 && <p>⚠️ Skipped: {importResult.skipped} products</p>}
          </div>
        )}
      </div>

      {/* Create / Edit Product */}
      <div className='bg-white rounded-lg shadow p-6 mb-8'>
        <h2 className='text-xl font-semibold mb-4'>
          {editingProduct ? 'Edit Product' : '➕ Add New Product'}
        </h2>

        <form
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
          className='grid grid-cols-1 md:grid-cols-3 gap-4'
        >
          <input
            type='text'
            placeholder='Product Name *'
            value={editingProduct ? editingProduct.name : newProduct.name}
            onChange={(e) =>
              editingProduct
                ? setEditingProduct({ ...editingProduct, name: e.target.value })
                : setNewProduct({ ...newProduct, name: e.target.value })
            }
            className='border p-2 rounded'
            required
          />

          <input
            type='text'
            placeholder='Description'
            value={editingProduct ? editingProduct.description : newProduct.description}
            onChange={(e) =>
              editingProduct
                ? setEditingProduct({ ...editingProduct, description: e.target.value })
                : setNewProduct({ ...newProduct, description: e.target.value })
            }
            className='border p-2 rounded md:col-span-2'
          />

          <input
            type='number'
            placeholder='Unit Price *'
            value={editingProduct ? editingProduct.unit_price : newProduct.unit_price}
            onChange={(e) =>
              editingProduct
                ? setEditingProduct({ ...editingProduct, unit_price: parseFloat(e.target.value) || 0 })
                : setNewProduct({ ...newProduct, unit_price: parseFloat(e.target.value) || 0 })
            }
            className='border p-2 rounded'
            step='0.01'
            min='0'
            required
          />

          <div className='md:col-span-3 flex gap-2'>
            <button
              type='submit'
              disabled={loading}
              className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-shadow disabled:opacity-50'
            >
              {loading ? 'Saving...' : editingProduct ? 'Update Product' : '➕ Add Product'}
            </button>

            {editingProduct && (
              <button
                type='button'
                onClick={() => setEditingProduct(null)}
                className='bg-gray-300 px-6 py-2 rounded hover:bg-gray-400'
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Product List */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        <div className='p-4 border-b font-bold'>Product Catalog ({products.length})</div>

        {products.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            No products yet. Add one above or import from CSV!
          </div>
        ) : (
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='p-3 text-left'>Product Name</th>
                <th className='p-3 text-left'>Description</th>
                <th className='p-3 text-right'>Unit Price</th>
                <th className='p-3 text-right'>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr key={product.id} className='border-t hover:bg-gray-50'>
                  <td className='p-3 font-medium'>{product.name}</td>
                  <td className='p-3'>{product.description || '-'}</td>
                  <td className='p-3 text-right font-bold'>${product.unit_price.toFixed(2)}</td>
                  <td className='p-3 text-right'>
                    <div className='flex justify-end gap-2'>
                      <button
                        onClick={() => setEditingProduct(product)}
                        className='text-blue-600 hover:text-blue-800'
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className='text-red-600 hover:text-red-800'
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}