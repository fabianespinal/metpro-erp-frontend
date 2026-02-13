export default function QuoteTotalsDisplay({ totals, charges }) {
  if (!totals) return null

  return (
    <div className='mt-6 p-4 bg-gray-50 rounded-lg space-y-2'>
      <div className='flex justify-between text-sm'>
        <span>Items Subtotal:</span>
        <span className='font-medium'>${totals.items_total}</span>
      </div>
      
      {parseFloat(totals.total_discounts) > 0 && (
        <div className='flex justify-between text-sm text-red-600'>
          <span>Discounts:</span>
          <span className='font-medium'>-${totals.total_discounts}</span>
        </div>
      )}
      
      <div className='flex justify-between text-sm'>
        <span>After Discounts:</span>
        <span className='font-medium'>${totals.items_after_discount}</span>
      </div>
      
      {parseFloat(totals.supervision) > 0 && (
        <div className='flex justify-between text-sm text-blue-600'>
          <span>Supervision ({charges.supervision_percentage}%):</span>
          <span>${totals.supervision}</span>
        </div>
      )}
      
      {parseFloat(totals.admin) > 0 && (
        <div className='flex justify-between text-sm text-blue-600'>
          <span>Admin ({charges.admin_percentage}%):</span>
          <span>${totals.admin}</span>
        </div>
      )}
      
      {parseFloat(totals.insurance) > 0 && (
        <div className='flex justify-between text-sm text-blue-600'>
          <span>Insurance ({charges.insurance_percentage}%):</span>
          <span>${totals.insurance}</span>
        </div>
      )}
      
      {parseFloat(totals.transport) > 0 && (
        <div className='flex justify-between text-sm text-blue-600'>
          <span>Transport ({charges.transport_percentage}%):</span>
          <span>${totals.transport}</span>
        </div>
      )}
      
      {parseFloat(totals.contingency) > 0 && (
        <div className='flex justify-between text-sm text-blue-600'>
          <span>Contingency ({charges.contingency_percentage}%):</span>
          <span>${totals.contingency}</span>
        </div>
      )}
      
      <div className='flex justify-between text-sm border-t pt-2'>
        <span>Subtotal General:</span>
        <span className='font-medium'>${totals.subtotal_general}</span>
      </div>
      
      <div className='flex justify-between text-sm'>
        <span>ITBIS (18%):</span>
        <span className='font-medium'>${totals.itbis}</span>
      </div>
      
      <div className='flex justify-between text-xl font-bold border-t-2 pt-2'>
        <span>Grand Total:</span>
        <span className='text-green-600'>${totals.grand_total}</span>
      </div>
    </div>
  )
}
