import { es } from "@/lib/i18n/es";
import { money } from "@/lib/money"
export default function QuoteTotalsDisplay({ totals, charges, taxLabel }) {
  if (!totals) return null

  return (
    <div className='mt-6 p-4 bg-canvas rounded-lg space-y-2'>
      <div className='flex justify-between text-sm'>
        <span>{es.cot.subtotalArticulos}</span>
        <span className='font-medium'>{money(totals.items_total)}</span>
      </div>
      
      {parseFloat(totals.total_discounts) > 0 && (
        <div className='flex justify-between text-sm text-red-600'>
          <span>{es.cot.descuentos}</span>
          <span className='font-medium'>-{money(totals.total_discounts)}</span>
        </div>
      )}
      
      <div className='flex justify-between text-sm'>
        <span>{es.cot.despuesDescuentos}</span>
        <span className='font-medium'>{money(totals.items_after_discount)}</span>
      </div>
      
      {parseFloat(totals.supervision) > 0 && (
        <div className='flex justify-between text-sm text-accent'>
          <span>{es.cot.cargos.supervision} ({charges.supervision_percentage}%):</span>
          <span>{money(totals.supervision)}</span>
        </div>
      )}
      
      {parseFloat(totals.admin) > 0 && (
        <div className='flex justify-between text-sm text-accent'>
          <span>{es.cot.cargos.admin} ({charges.admin_percentage}%):</span>
          <span>{money(totals.admin)}</span>
        </div>
      )}
      
      {parseFloat(totals.insurance) > 0 && (
        <div className='flex justify-between text-sm text-accent'>
          <span>{es.cot.cargos.insurance} ({charges.insurance_percentage}%):</span>
          <span>{money(totals.insurance)}</span>
        </div>
      )}
      
      {parseFloat(totals.transport) > 0 && (
        <div className='flex justify-between text-sm text-accent'>
          <span>{es.cot.cargos.transport} ({charges.transport_percentage}%):</span>
          <span>{money(totals.transport)}</span>
        </div>
      )}
      
      {parseFloat(totals.contingency) > 0 && (
        <div className='flex justify-between text-sm text-accent'>
          <span>{es.cot.cargos.contingency} ({charges.contingency_percentage}%):</span>
          <span>{money(totals.contingency)}</span>
        </div>
      )}

      {(charges.dynamic_charges ?? []).map((dc) => (
        parseFloat(totals[`dynamic_${dc.id}`] || 0) > 0 && (
          <div key={dc.id} className='flex justify-between text-sm text-accent'>
            <span>{dc.name} ({dc.percentage}%):</span>
            <span>{money((parseFloat(totals.items_after_discount || 0) * (dc.percentage / 100)))}</span>
          </div>
        )
      ))}

      <div className='flex justify-between text-sm border-t pt-2'>
        <span>{es.cot.subtotalGeneralDp}</span>
        <span className='font-medium'>{money(totals.subtotal_general)}</span>
      </div>
      
      <div className='flex justify-between text-sm'>
        <span>{taxLabel || es.cot.itbis}:</span>
        <span className='font-medium'>{money(totals.itbis)}</span>
      </div>
      
      <div className='flex justify-between text-xl font-bold border-t-2 pt-2'>
        <span>{es.cot.totalGeneralDp}</span>
        <span className='text-emerald-600'>{money(totals.grand_total)}</span>
      </div>
    </div>
  )
}
