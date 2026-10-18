import { es } from "@/lib/i18n/es";
export default function SurchargeControls({ charges, setCharges }) {
  const handleToggle = (field) => {
    setCharges({ ...charges, [field]: !charges[field] })
  }

  const handlePercentageChange = (field, value) => {
    setCharges({ ...charges, [field]: parseFloat(value) || 0 })
  }

  const dynamicCharges = charges.dynamic_charges ?? []

  const handleDynamicChargeToggle = (index) => {
    const updated = dynamicCharges.map((dc, i) => (i === index ? { ...dc, enabled: !dc.enabled } : dc))
    setCharges({ ...charges, dynamic_charges: updated })
  }

  const handleDynamicChargeNameChange = (index, name) => {
    const updated = dynamicCharges.map((dc, i) => (i === index ? { ...dc, name } : dc))
    setCharges({ ...charges, dynamic_charges: updated })
  }

  const handleDynamicChargePercentageChange = (index, percentage) => {
    const updated = dynamicCharges.map((dc, i) => (i === index ? { ...dc, percentage: parseFloat(percentage) || 0 } : dc))
    setCharges({ ...charges, dynamic_charges: updated })
  }

  const handleAddDynamicCharge = () => {
    if (dynamicCharges.length >= 3) return
    const newId = `dc_${Date.now()}`
    const updated = [...dynamicCharges, { id: newId, name: '', enabled: true, percentage: 0 }]
    setCharges({ ...charges, dynamic_charges: updated })
  }

  const handleRemoveDynamicCharge = (index) => {
    const updated = dynamicCharges.filter((_, i) => i !== index)
    setCharges({ ...charges, dynamic_charges: updated })
  }

  return (
    <div className='mb-4'>
      <label className='block text-sm font-medium mb-3'>{es.cot.cargosAdicionales}</label>
      <div className='border rounded-lg p-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={charges.supervision}
              onChange={() => handleToggle('supervision')}
              className='w-4 h-4'
            />
            <label className='text-sm font-medium'>{es.cot.cargos.supervision}</label>
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
            <label className='text-sm font-medium'>{es.cot.cargos.admin}</label>
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
            <label className='text-sm font-medium'>{es.cot.cargos.insurance}</label>
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
            <label className='text-sm font-medium'>{es.cot.cargos.transport}</label>
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
            <label className='text-sm font-medium'>{es.cot.cargos.contingency}</label>
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

        {/* Dynamic Charges */}
        {dynamicCharges.length > 0 && (
          <div className='border-t pt-3'>
            <div className='text-xs font-medium text-muted mb-2'>{es.cot.cargosPersonalizados}</div>
            <div className='space-y-2'>
              {dynamicCharges.map((dc, index) => (
                <div key={dc.id} className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={dc.enabled}
                    onChange={() => handleDynamicChargeToggle(index)}
                    className='w-4 h-4'
                  />
                  <input
                    type='text'
                    value={dc.name}
                    onChange={(e) => handleDynamicChargeNameChange(index, e.target.value)}
                    placeholder={es.cot.nombreCargo}
                    className='flex-1 border rounded px-2 py-1 text-sm'
                  />
                  <input
                    type='number'
                    value={dc.percentage}
                    onChange={(e) => handleDynamicChargePercentageChange(index, e.target.value)}
                    disabled={!dc.enabled}
                    className='w-20 border rounded px-2 py-1 text-sm'
                    min='0'
                    step='0.1'
                  />
                  <span className='text-sm'>%</span>
                  <button
                    type='button'
                    onClick={() => handleRemoveDynamicCharge(index)}
                    className='text-red-600 hover:text-red-700 text-sm font-bold'
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Dynamic Charge Button */}
      {dynamicCharges.length < 3 && (
        <button
          type='button'
          onClick={handleAddDynamicCharge}
          className='mt-3 w-full text-sm text-accent hover:text-accent-strong py-1 border border-dashed border-accent rounded'
        >
          {es.cot.agregarCargo}
        </button>
      )}
    </div>
  )
}
