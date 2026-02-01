'use client'

import { useState, useEffect } from 'react'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('quotes-summary')
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    client_id: ''
  })
  const [clients, setClients] = useState([])
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await fetch('https://metpro-erp-api.onrender.com/clients/', {
        headers: getAuthHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setClients(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Fetch clients error:', error)
    }
  }

  const runReport = async () => {
    if (!filters.start_date || !filters.end_date) {
      alert('Please select both start and end dates')
      return
    }
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        start_date: filters.start_date,
        end_date: filters.end_date,
        ...(filters.client_id && { client_id: filters.client_id })
      }).toString()
      
      const res = await fetch(
        `https://metpro-erp-api.onrender.com/reports/${reportType}?${params}`,
        { headers: getAuthHeaders() }
      )
      
      if (!res.ok) throw new Error('Report generation failed')
      
      setReportData(await res.json())
    } catch (error) {
      alert(`Error: ${error.message}`)
      setReportData(null)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!reportData) return
    
    let csvContent = ''
    let filename = reportType
    
    if (reportType === 'quotes-summary') {
      filename = 'quotes_summary'
      csvContent = 'Status,Count,Percentage\n'
      reportData.status_breakdown.forEach(row => {
        csvContent += `${row.status},${row.count},${row.percentage}%\n`
      })
      csvContent += `\nTotal Quotes,${reportData.summary.total_quotes},100%`
    } 
    else if (reportType === 'revenue') {
      filename = 'revenue_report'
      csvContent = 'Status,Revenue,Quote Count\n'
      reportData.revenue_breakdown.forEach(row => {
        csvContent += `${row.status},$${row.total_revenue.toFixed(2)},${row.quote_count}\n`
      })
      csvContent += `\nGrand Total,$${reportData.grand_total.toFixed(2)},`
    } 
    else if (reportType === 'client-activity') {
      filename = 'client_activity'
      csvContent = 'Client,Quotes,Total Quoted,Last Quote Date\n'
      reportData.clients.forEach(row => {
        csvContent += `${row.client_name},${row.quote_count},$${row.total_quoted.toFixed(2)},${row.last_quote_date || 'N/A'}\n`
      })
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className='p-8 max-w-7xl mx-auto'>
      <h1 className='text-3xl font-bold mb-8'>📊 Reports</h1>
      
      {/* Report Type Selector */}
      <div className='bg-white rounded-lg shadow p-6 mb-6'>
        <div className='flex flex-col md:flex-row gap-4'>
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value)
              setReportData(null)
            }}
            className='border p-2 rounded flex-1'
          >
            <option value='quotes-summary'>Quotes Summary</option>
            <option value='revenue'>Revenue Report</option>
            <option value='client-activity'>Client Activity</option>
          </select>
          
          <input
            type='date'
            value={filters.start_date}
            onChange={(e) => setFilters({...filters, start_date: e.target.value})}
            className='border p-2 rounded'
            placeholder='Start Date'
          />
          
          <input
            type='date'
            value={filters.end_date}
            onChange={(e) => setFilters({...filters, end_date: e.target.value})}
            className='border p-2 rounded'
            placeholder='End Date'
          />
          
          <select
            value={filters.client_id}
            onChange={(e) => setFilters({...filters, client_id: e.target.value})}
            className='border p-2 rounded'
          >
            <option value=''>All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.company_name}
              </option>
            ))}
          </select>
          
          <button
            onClick={runReport}
            disabled={loading}
            className='bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center'
          >
            {loading ? (
              <span className='flex items-center'>
                <svg className='animate-spin -ml-1 mr-2 h-4 w-4 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                </svg>
                Running...
              </span>
            ) : '▶️ Run Report'}
          </button>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-2xl font-bold'>
              {reportType === 'quotes-summary' && 'Quotes Summary Report'}
              {reportType === 'revenue' && 'Revenue Report'}
              {reportType === 'client-activity' && 'Client Activity Report'}
            </h2>
            <button
              onClick={exportCSV}
              className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2'
            >
              📥 Export CSV
            </button>
          </div>
          
          <div className='mb-6 p-4 bg-blue-50 rounded'>
            <p className='font-medium'>Filters Applied:</p>
            <p className='text-sm'>
              Date Range: {filters.start_date} to {filters.end_date}
              {filters.client_id && ` | Client: ${clients.find(c => c.id == filters.client_id)?.company_name}`}
            </p>
          </div>
          
          {reportType === 'quotes-summary' && (
            <div>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                <div className='bg-white border p-4 rounded text-center'>
                  <div className='text-3xl font-bold text-blue-600'>{reportData.summary.total_quotes}</div>
                  <div className='text-gray-600'>Total Quotes</div>
                </div>
                {reportData.status_breakdown.map(status => (
                  <div key={status.status} className='bg-white border p-4 rounded text-center'>
                    <div className='text-xl font-bold'>{status.count}</div>
                    <div className='text-sm'>{status.status}</div>
                    <div className='text-xs text-gray-500'>{status.percentage}%</div>
                  </div>
                ))}
              </div>
              
              <h3 className='font-bold mb-2'>Status Breakdown</h3>
              <table className='w-full border'>
                <thead className='bg-gray-100'>
                  <tr>
                    <th className='p-2 border'>Status</th>
                    <th className='p-2 border'>Count</th>
                    <th className='p-2 border'>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.status_breakdown.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className='p-2 border'>{row.status}</td>
                      <td className='p-2 border text-right'>{row.count}</td>
                      <td className='p-2 border text-right'>{row.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {reportType === 'revenue' && (
            <div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                <div className='bg-white border p-4 rounded text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    ${reportData.revenue_breakdown.find(r => r.status === 'Approved')?.total_revenue.toFixed(2) || '0.00'}
                  </div>
                  <div className='text-gray-600'>Approved Revenue</div>
                </div>
                <div className='bg-white border p-4 rounded text-center'>
                  <div className='text-2xl font-bold text-yellow-600'>
                    ${reportData.revenue_breakdown.find(r => r.status === 'Pending (Draft)')?.total_revenue.toFixed(2) || '0.00'}
                  </div>
                  <div className='text-gray-600'>Pending Revenue</div>
                </div>
                <div className='bg-white border p-4 rounded text-center'>
                  <div className='text-3xl font-bold text-blue-600'>
                    ${reportData.grand_total.toFixed(2)}
                  </div>
                  <div className='text-gray-600'>Grand Total</div>
                </div>
              </div>
              
              <h3 className='font-bold mb-2'>Revenue Breakdown</h3>
              <table className='w-full border'>
                <thead className='bg-gray-100'>
                  <tr>
                    <th className='p-2 border'>Status</th>
                    <th className='p-2 border'>Revenue</th>
                    <th className='p-2 border'>Quote Count</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.revenue_breakdown.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className='p-2 border'>{row.status}</td>
                      <td className='p-2 border text-right font-medium'>
                        ${row.total_revenue.toFixed(2)}
                      </td>
                      <td className='p-2 border text-right'>{row.quote_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {reportType === 'client-activity' && (
            <div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                <div className='bg-white border p-4 rounded text-center'>
                  <div className='text-3xl font-bold text-blue-600'>{reportData.summary.total_clients}</div>
                  <div className='text-gray-600'>Active Clients</div>
                </div>
                <div className='bg-white border p-4 rounded text-center'>
                  <div className='text-3xl font-bold text-purple-600'>{reportData.summary.total_quotes}</div>
                  <div className='text-gray-600'>Total Quotes</div>
                </div>
                <div className='bg-white border p-4 rounded text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    ${reportData.summary.total_revenue.toFixed(2)}
                  </div>
                  <div className='text-gray-600'>Total Revenue</div>
                </div>
              </div>
              
              <h3 className='font-bold mb-2'>Client Activity</h3>
              <div className='overflow-x-auto'>
                <table className='w-full border'>
                  <thead className='bg-gray-100'>
                    <tr>
                      <th className='p-2 border'>Client</th>
                      <th className='p-2 border'>Quotes</th>
                      <th className='p-2 border'>Total Quoted</th>
                      <th className='p-2 border'>Last Quote</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.clients.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className='p-2 border font-medium'>{row.client_name}</td>
                        <td className='p-2 border text-right'>{row.quote_count}</td>
                        <td className='p-2 border text-right font-medium'>
                          ${row.total_quoted.toFixed(2)}
                        </td>
                        <td className='p-2 border'>{row.last_quote_date || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}