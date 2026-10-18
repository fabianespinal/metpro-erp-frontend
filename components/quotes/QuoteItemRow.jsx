import { es } from "@/lib/i18n/es";
export default function QuoteItemRow({ 
  item, 
  index, 
  onRemove, 
  onChange, 
  onOpenProductModal,
  showRemove = true 
}) {
  const qty = item.quantity ?? 0
const price = item.unit_price ?? 0
const discountVal = item.discount_value ?? 0

const base = qty * price

const discount =
  item.discount_type === 'percentage'
    ? base * (discountVal / 100)
    : item.discount_type === 'fixed'
      ? discountVal
      : 0

const lineTotal = (base - discount).toFixed(2)

  return (
    <div className='mb-4 p-4 border rounded'>
      <div className='flex justify-between items-center mb-3'>
        <h4 className='font-medium'>Item {index + 1}</h4>
        {showRemove && (
          <button
            type='button'
            onClick={() => onRemove(index)}
            className='text-red-600 hover:text-red-700 font-bold text-xl'
          >
            ×
          </button>
        )}
      </div>
      
      <div className='grid grid-cols-1 md:grid-cols-4 gap-3 mb-3'>
        <div className='md:col-span-2'>
          <label className='block text-xs font-medium mb-1'>Product/Service</label>
          <div className='flex gap-2'>
            <input
              type='text'
              value={item.product_name}
              onChange={(e) => onChange(index, 'product_name', e.target.value)}
              className='flex-1 border p-2 rounded text-sm'
              placeholder={es.cot.ingreseNombreProducto}
            />
            <button
              type='button'
              onClick={() => onOpenProductModal(index)}
              className='px-3 py-2 bg-accent text-white rounded hover:bg-accent-strong text-sm'
              title={es.cot.seleccionarBD}
            >
              📦
            </button>
          </div>
        </div>
        <div>
          <label className='block text-xs font-medium mb-1'>{es.cot.cantidad}</label>
          <input
            type='number'
            value={item.quantity}
            onChange={(e) => onChange(index, 'quantity', parseFloat(e.target.value) || 0)}
            className='w-full border p-2 rounded text-sm'
            min='1'
            step='1'
          />
        </div>
        <div>
          <label className='block text-xs font-medium mb-1'>{es.cot.precioUnitarioUsd}</label>
          <input
            type='number'
            value={item.unit_price}
            onChange={(e) => onChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
            className='w-full border p-2 rounded text-sm'
            min='0'
            step='0.01'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
        <div>
          <label className='block text-xs font-medium mb-1'>{es.cot.tipoDescuento}</label>
          <select
            value={item.discount_type}
            onChange={(e) => onChange(index, 'discount_type', e.target.value)}
            className='w-full border p-2 rounded text-sm'
          >
            <option value='none'>{es.cot.sinDescuento}</option>
            <option value='percentage'>{es.cot.porcentaje}</option>
            <option value='fixed'>{es.cot.montoFijo}</option>
          </select>
        </div>
        <div>
          <label className='block text-xs font-medium mb-1'>{es.cot.valorDescuento}</label>
          <input
            type='number'
            value={item.discount_value}
            onChange={(e) => onChange(index, 'discount_value', parseFloat(e.target.value) || 0)}
            className='w-full border p-2 rounded text-sm'
            min='0'
            step='0.01'
            disabled={item.discount_type === 'none'}
          />
        </div>
        <div>
          <label className='block text-xs font-medium mb-1'>{es.cot.totalLinea}</label>
          <div className='w-full border p-2 rounded bg-canvas font-bold text-sm'>
            ${lineTotal}
          </div>
        </div>
      </div>
    </div>
  )
}
