'use client'

export default function SurchargeControls({ charges, onChargesChange }) {
  const surchargeOptions = [
    { key: 'supervision', label: 'Supervision surcharge (%)', default: 10 },
    { key: 'admin', label: 'Admin surcharge (%)', default: 4 },
    { key: 'insurance', label: 'Insurance surcharge (%)', default: 1 },
    { key: 'transport', label: 'Transport surcharge (%)', default: 3 },
    { key: 'contingency', label: 'Contingency surcharge (%)', default: 3 }
  ]

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Included Charges
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {surchargeOptions.map((option) => (
          <div 
            key={option.key} 
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`charge-${option.key}`}
                  checked={charges[option.key] || false}
                  onChange={(e) => {
                    onChargesChange({
                      ...charges,
                      [option.key]: e.target.checked
                    })
                  }}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label 
                  htmlFor={`charge-${option.key}`} 
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            </div>
            
            <div className="w-24">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={charges[`${option.key}_percentage`] || option.default}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  onChargesChange({
                    ...charges,
                    [`${option.key}_percentage`]: value
                  })
                }}
                disabled={!charges[option.key]}
                className={`w-full text-right text-sm font-medium px-2 py-1 border rounded-md ${
                  !charges[option.key] 
                    ? 'bg-gray-100 cursor-not-allowed text-gray-400' 
                    : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}