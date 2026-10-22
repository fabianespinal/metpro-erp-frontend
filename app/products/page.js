'use client'
import { es } from "@/lib/i18n/es";
import toast from "react-hot-toast"
import ErrorBanner from "@/components/ui/ErrorBanner";
import { dt } from "@/components/ui/data-table";

import { useState, useEffect } from 'react'
import { usePdfOptions } from '@/lib/pdfOptions'
import { UnitInput } from '@/components/quotes/UnitInput'
import { api } from "@/lib/api"
import { useCurrentRole } from "@/lib/currentRole"
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { fb } from '@/components/ui/filter-bar'
import { money } from '@/lib/money'

// B3 dimensions: '' means empty (sent as null). Sent only when the backend switch is on.
const DIM_FIELDS = ['length', 'width', 'height', 'thickness', 'area', 'volume']
const dimsOut = (p, enabled) => {
  if (!enabled) return {}
  const out = { unit_of_measure: (p.unit_of_measure || '').trim() || null }
  for (const f of DIM_FIELDS) out[f] = p[f] === '' || p[f] === null || p[f] === undefined ? null : Number(p[f])
  return out
}

// Cost input: '' means no cost (sent as null).
const costOut = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

const stripDims = (p) => {
  const { length, width, height, thickness, area, volume, unit_of_measure, ...rest } = p
  return rest
}

export default function ProductsPage() {
  const { isAdmin } = useCurrentRole()
  const [dimsEnabled, setDimsEnabled] = useState(false)
  useEffect(() => {
    api('/products/options').then((o) => setDimsEnabled(o?.dimensions_enabled === true)).catch(() => setDimsEnabled(false))
  }, [])
  const [products, setProducts] = useState([])
  const { medidas_enabled } = usePdfOptions()
  const [loadError, setLoadError] = useState(null)
  const [newProduct, setNewProduct] = useState({ name: '', description: '', unit_price: 0, cost: '', unit_of_measure: '' })
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
        body: JSON.stringify({ ...stripDims(newProduct), cost: costOut(newProduct.cost), ...dimsOut(newProduct, dimsEnabled) })
      })

      await fetchProducts()
      setNewProduct({ name: '', description: '', unit_price: 0, cost: '', unit_of_measure: '' })
      toast.success(es.prod.creado)
    } catch (error) {
      toast.error(es.prod.errorGenerico + error.message)
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
      body: JSON.stringify({ ...stripDims(editingProduct), cost: costOut(editingProduct.cost), ...dimsOut(editingProduct, dimsEnabled) })
    })

    await fetchProducts()
    setEditingProduct(null)
    toast.success(es.prod.actualizado)
  } catch (error) {
    toast.error(es.prod.errorGenerico + error.message)
  } finally {
    setLoading(false)
  }
}

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (!confirm(es.prod.confirmarEliminar)) return

    try {
      const res = await api(`/products/${productId}/`, { method: 'DELETE' })
      await fetchProducts()
      // X-05: a product used on quotes or invoices is archived (leaves the catalog, keeps history).
      toast.success(res && res.archived ? es.prod.archivado : es.prod.eliminado)
    } catch (error) {
      toast.error(es.prod.errorEliminar + error.message)
    }
  }

  // Import CSV
  const handleCsvImport = async (e) => {
    e.preventDefault()
    if (!csvFile) {
      toast.error(es.prod.seleccioneCsv)
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
      toast.success(es.cst.importados(data.imported))
    } catch (error) {
      toast.error(es.prod.errorCsv + error.message)
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
            aria-label='Archivo CSV de productos'
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
          <input aria-label={es.prod.nombre}
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

          <input aria-label={es.prod.descripcion}
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

          <input aria-label={es.prod.precio}
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

          {medidas_enabled && (
            <label className='flex flex-col gap-1 text-sm text-muted'>
              {es.pdf.medidas}
              <UnitInput
                value={editingProduct ? (editingProduct.unit_of_measure ?? '') : newProduct.unit_of_measure}
                onChange={(v) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, unit_of_measure: v })
                    : setNewProduct({ ...newProduct, unit_of_measure: v })
                }
                label={es.pdf.medidas}
                className='border p-2 rounded text-ink'
              />
            </label>
          )}

          <label className='md:col-span-2 flex flex-col gap-1 text-sm text-muted'>
            {es.cst.costoProducto}
            <input aria-label={es.cst.costoProducto}
              type='number'
              placeholder={es.cst.costoProducto}
              value={editingProduct ? (editingProduct.cost ?? '') : newProduct.cost}
              onChange={(e) =>
                editingProduct
                  ? setEditingProduct({ ...editingProduct, cost: e.target.value })
                  : setNewProduct({ ...newProduct, cost: e.target.value })
              }
              className='border p-2 rounded text-ink'
              step='0.01'
              min='0'
            />
          </label>

          {dimsEnabled && (
            <fieldset className='md:col-span-3 grid grid-cols-2 gap-3 rounded border border-line p-3 md:grid-cols-4'>
              <legend className='px-1 text-sm text-muted'>{es.prod.dimensiones}</legend>
              {[...DIM_FIELDS].map((f) => (
                <label key={f} className='flex flex-col gap-1 text-sm text-muted'>
                  {es.prod.dim[f]}
                  <input
                    type='number'
                    step='any'
                    min='0'
                    value={(editingProduct ? editingProduct[f] : newProduct[f]) ?? ''}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({ ...editingProduct, [f]: e.target.value })
                        : setNewProduct({ ...newProduct, [f]: e.target.value })
                    }
                    className='border p-2 rounded text-ink'
                  />
                </label>
              ))}
              <label className='flex flex-col gap-1 text-sm text-muted'>
                {es.prod.dim.unit_of_measure}
                <input
                  type='text'
                  maxLength={20}
                  value={(editingProduct ? editingProduct.unit_of_measure : newProduct.unit_of_measure) ?? ''}
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({ ...editingProduct, unit_of_measure: e.target.value })
                      : setNewProduct({ ...newProduct, unit_of_measure: e.target.value })
                  }
                  className='border p-2 rounded text-ink'
                />
              </label>
            </fieldset>
          )}

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
                {medidas_enabled && <th className={dt.th}>{es.pdf.medidas}</th>}
                <th className={dt.thRight}>Precio Unitario</th>
                <th className={dt.thRight}>{es.cst.colCosto}</th>
                <th className={dt.thRight}>{es.cst.colMargen}</th>
                <th className={dt.thRight}>Acciones</th>
              </tr>
            </thead>

            <tbody className={dt.tbody}>
              {products.map((product) => (
                <tr key={product.id} className={dt.tr}>
                  <td className={dt.td}>{product.name}</td>
                  <td className={dt.td}>{product.description || '-'}</td>

                  {medidas_enabled && <td className={dt.td}>{product.unit_of_measure || '-'}</td>}

                  <td className={dt.tdRight}>
                    {money((product.unit_price ?? 0))}
                  </td>

                  <td className={dt.tdRight}>
                    {product.cost === null || product.cost === undefined
                      ? <span className='text-muted'>{es.cst.sinCosto}</span>
                      : money(product.cost)}
                  </td>

                  <td className={dt.tdRight}>
                    {product.cost === null || product.cost === undefined ? '—' : (() => {
                      const m = (product.unit_price ?? 0) - product.cost
                      const pct = product.unit_price ? (m / product.unit_price) * 100 : null
                      return (
                        <span className={m < 0 ? 'text-red-600' : ''}>
                          {money(m)}{pct !== null ? ` · ${pct.toFixed(1)}%` : ''}
                        </span>
                      )
                    })()}
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