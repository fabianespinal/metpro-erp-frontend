export default function SurchargeControls({ charges, setCharges }) {
  const handleToggle = (field) => {
    setCharges({ ...charges, [field]: !charges[field] })
  }

  const handlePercentageChange = (field, value) => {
    setCharges({ ...charges, [field]: parseFloat(value) || 0 })
  }

  return (
    <div className='mb-4'>
      <label className='block text-sm font-medium mb-3'>Additional Charges</label>
      <div className='border rounded-lg p-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={charges.supervision}
              onChange={() => handleToggle('supervision')}
              className='w-4 h-4'
            />
            <label className='text-sm font-medium'>Supervision</label>
          </div>
          <div className='flex items-center gap-2'>
            <input
              type='number'
              value={charges.supervision_percentage}
              onChange={(e) => handlePercentageChange('supervision_percentage', e.target.value)}
              disabled={!charges.supervision}
              className='w-20 border rounded px-2 py-1 text-sm'
              min='0'
              step='0.1'
            />
            <span className='text-sm'>%</span>
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={charges.admin}
              onChange={() => handleToggle('admin')}
              className='w-4 h-4'
            />
            <label className='text-sm font-medium'>Admin</label>
          </div>
          <div className='flex items-center gap-2'>
            <input
              type='number'
              value={charges.admin_percentage}
              onChange={(e) => handlePercentageChange('admin_percentage', e.target.value)}
              disabled={!charges.admin}
              className='w-20 border rounded px-2 py-1 text-sm'
              min='0'
              step='0.1'
            />
            <span className='text-sm'>%</span>
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={charges.insurance}
              onChange={() => handleToggle('insurance')}
              className='w-4 h-4'
            />
            <label className='text-sm font-medium'>Insurance</label>
          </div>
          <div className='flex items-center gap-2'>
            <input
              type='number'
              value={charges.insurance_percentage}
              onChange={(e) => handlePercentageChange('insurance_percentage', e.target.value)}
              disabled={!charges.insurance}
              className='w-20 border rounded px-2 py-1 text-sm'
              min='0'
              step='0.1'
            />
            <span className='text-sm'>%</span>
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={charges.transport}
              onChange={() => handleToggle('transport')}
              className='w-4 h-4'
            />
            <label className='text-sm font-medium'>Transport</label>
          </div>
          <div className='flex items-center gap-2'>
            <input
              type='number'
              value={charges.transport_percentage}
              onChange={(e) => handlePercentageChange('transport_percentage', e.target.value)}
              disabled={!charges.transport}
              className='w-20 border rounded px-2 py-1 text-sm'
              min='0'
              step='0.1'
            />
            <span className='text-sm'>%</span>
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={charges.contingency}
              onChange={() => handleToggle('contingency')}
              className='w-4 h-4'
            />
            <label className='text-sm font-medium'>Contingency</label>
          </div>
          <div className='flex items-center gap-2'>
            <input
              type='number'
              value={charges.contingency_percentage}
              onChange={(e) => handlePercentageChange('contingency_percentage', e.target.value)}
              disabled={!charges.contingency}
              className='w-20 border rounded px-2 py-1 text-sm'
              min='0'
              step='0.1'
            />
            <span className='text-sm'>%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
