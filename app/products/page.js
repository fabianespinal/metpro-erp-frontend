'use client'
import { dt } from "@/components/ui/data-table";

import { useState, useEffect } from 'react'
import { api } from "@/lib/api"
import { useCurrentRole } from "@/lib/currentRole"
import { PageHeader } from '@/components/ui/page-header'

export default function ProductsPage() {
  const { isAdmin } = useCurrentRole()
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
      const data = await api('/products/', { method: 'GET' })
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
      await api('/products/', {
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
    await api(`/products/${editingProduct.id}`, {   // <-- FIXED: removed trailing slash
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
      await api(`/products/${productId}/`, { method: 'DELETE' })
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
      const data = await api('/products/import-csv/', {
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
    <div className="w-full px-4 lg:px-8 py-8">
      <PageHeader title="Productos" />

      {/* Import CSV */}
      <div className='bg-surface rounded-lg shadow p-6 mb-8'>
        <h2 className='text-xl font-semibold mb-4'>Importar Productos desde CSV</h2>
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
            className='bg-accent hover:bg-accent-strong text-white px-4 py-2 rounded-lg font-medium shadow-card hover:shadow-card transition-shadow disabled:opacity-50'
          >
            {loading ? 'Importing...' : 'Import CSV'}
          </button>
        </form>

        {importResult && (
          <div className='mt-4 p-4 bg-emerald-50 rounded'>
            <p>Importodo: {importResult.imported} productos</p>
            {importResult.skipped > 0 && <p>Skipped: {importResult.skipped} products</p>}
          </div>
        )}
      </div>

      {/* Create / Edit Product */}
      <div className='bg-surface rounded-lg shadow p-6 mb-8'>
        <h2 className='text-xl font-semibold mb-4'>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
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
              className='bg-accent hover:bg-accent-strong text-white px-4 py-2 rounded-lg font-medium shadow-card hover:shadow-card transition-shadow disabled:opacity-50'
            >
              {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
            </button>

            {editingProduct && (
              <button
                type='button'
                onClick={() => setEditingProduct(null)}
                className='bg-line px-6 py-2 rounded hover:bg-line/70'
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Product List */}
      <div className='bg-surface rounded-lg shadow overflow-hidden'>
        <div className='p-4 border-b font-bold'>Catalogo Productos ({products.length})</div>

        {products.length === 0 ? (
          <div className='p-8 text-center text-muted'>
            No hay productos aún. Añade uno arriba o importa desde CSV!
          </div>
        ) : (
          <table className={dt.table}>
            <thead className={dt.thead}>
              <tr>
                <th className={dt.th}>Nombre Producto</th>
                <th className={dt.th}>Descripción</th>
                <th className={dt.thRight}>Precio Unitario</th>
                <th className={dt.thRight}>Acciones</th>
              </tr>
            </thead>

            <tbody className={dt.tbody}>
              {products.map((product) => (
                <tr key={product.id} className={dt.tr}>
                  <td className={dt.td}>{product.name}</td>
                  <td className={dt.td}>{product.description || '-'}</td>

                  <td className={dt.tdRight}>
                    ${ (product.unit_price ?? 0).toFixed(2) }
                  </td>

                  <td className={dt.tdRight}>
                    <div className='flex justify-end gap-2'>
                      <button
                        onClick={() => setEditingProduct(product)}
                        className='text-accent hover:text-accent-strong'
                      >
                        Edit
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className='text-red-600 hover:text-red-700'
                        >
                          Borrar
                        </button>
                      )}
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