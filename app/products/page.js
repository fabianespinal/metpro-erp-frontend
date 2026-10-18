'use client'
import { es } from "@/lib/i18n/es";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { dt } from "@/components/ui/data-table";

import { useState, useEffect } from 'react'
import { api } from "@/lib/api"
import { useCurrentRole } from "@/lib/currentRole"
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { fb } from '@/components/ui/filter-bar'

export default function ProductsPage() {
  const { isAdmin } = useCurrentRole()
  const [products, setProducts] = useState([])
  const [loadError, setLoadError] = useState(null)
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
      setLoadError(`No se pudieron cargar los productos: ${error.message}`)
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
      alert(es.prod.creado)
    } catch (error) {
      alert(es.prod.errorGenerico + error.message)
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
    alert(es.prod.actualizado)
  } catch (error) {
    alert(es.prod.errorGenerico + error.message)
  } finally {
    setLoading(false)
  }
}

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (!confirm(es.prod.confirmarEliminar)) return

    try {
      await api(`/products/${productId}/`, { method: 'DELETE' })
      await fetchProducts()
      alert(es.prod.eliminado)
    } catch (error) {
      alert(es.prod.errorEliminar + error.message)
    }
  }

  // Import CSV
  const handleCsvImport = async (e) => {
    e.preventDefault()
    if (!csvFile) {
      alert(es.prod.seleccioneCsv)
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('file', csvFile)

    try {
      const data = await api('/products/import-csv', {
        method: 'POST',
        body: formData
      })

      setImportResult(data)
      await fetchProducts()
      setCsvFile(null)
      alert(`Imported ${data.imported} products!`)
    } catch (error) {
      alert(es.prod.errorCsv + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full px-4 lg:px-8 py-8">
      <PageHeader title="Productos" />
      <ErrorBanner message={loadError} />

      {/* Import CSV */}
      <div className='rounded-lg border border-line bg-surface p-6 shadow-card mb-8'>
        <h2 className='text-lg font-semibold tracking-tight text-ink mb-4'>Importar Productos desde CSV</h2>
        <form onSubmit={handleCsvImport} className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <input
            type='file'
            accept='.csv'
            onChange={(e) => setCsvFile(e.target.files[0])}
            className={`${fb.control} min-w-0 flex-1 py-1.5`}
          />
          <Button type='submit' disabled={loading || !csvFile} className='shrink-0'>
            {loading ? es.prod.importando : es.prod.importar}
          </Button>
        </form>

        {importResult && (
          <div className='mt-4 p-4 bg-emerald-50 rounded'>
            <p>Importado: {importResult.imported} productos</p>
            {importResult.skipped > 0 && <p>Omitidos: {importResult.skipped} productos</p>}
          </div>
        )}
      </div>

      {/* Create / Edit Product */}
      <div className='bg-surface rounded-lg shadow p-6 mb-8'>
        <h2 className='text-xl font-semibold mb-4'>
          {editingProduct ? es.prod.editar : es.prod.nuevo}
        </h2>

        <form
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
          className='grid grid-cols-1 md:grid-cols-3 gap-4'
        >
          <input
            type='text'
            placeholder={es.prod.nombre}
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
            placeholder={es.prod.descripcion}
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
            placeholder={es.prod.precio}
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
            <Button type='submit' disabled={loading}>
              {loading ? es.prod.guardando : editingProduct ? es.prod.actualizar : es.prod.agregar}
            </Button>

            {editingProduct && (
              <Button type='button' variant='outline' onClick={() => setEditingProduct(null)}>
                {es.prod.cancelar}
              </Button>
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
                        {es.prod.editarBoton}
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