'use client'
import { unwrapEnvelope } from "@/lib/api"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { fb } from "@/components/ui/filter-bar"
import { dt } from "@/components/ui/data-table"

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

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null

    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/`, {
        method: 'GET',
        headers: { ...getAuthHeaders() }
      })

      if (res.ok) {
        const data = unwrapEnvelope(await res.json())
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

      const apiUrl = process.env.NEXT_PUBLIC_API_URL

      const res = await fetch(
        `${apiUrl}/reports/${reportType}?${params}`,
        {
          method: 'GET',
          headers: { ...getAuthHeaders() }
        }
      )

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Server error: ${errText || res.status}`)
      }

      setReportData(unwrapEnvelope(await res.json()))
    } catch (error) {
      console.error('Report generation failed:', error)
      alert(`Report failed: ${error.message}`)
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

      reportData.status_breakdown?.forEach(row => {
        csvContent += `${row.status},${row.count},${row.percentage}%\n`
      })

      csvContent += `\nTotal Quotes,${reportData.summary?.total_quotes ?? 0},100%`
    }

    else if (reportType === 'revenue') {
      filename = 'revenue_report'
      csvContent = 'Status,Revenue,Quote Count\n'

      reportData.revenue_breakdown?.forEach(row => {
        csvContent += `${row.status},$${(row.total_revenue ?? 0).toFixed(2)},${row.quote_count}\n`
      })

      csvContent += `\nGrand Total,$${(reportData.grand_total ?? 0).toFixed(2)}`
    }

    else if (reportType === 'client-activity') {
      filename = 'client_activity'
      csvContent = 'Client,Quotes,Total Quoted,Last Quote Date\n'

      reportData.clients?.forEach(row => {
        csvContent += `${row.client_name},${row.quote_count},$${(row.total_quoted ?? 0).toFixed(2)},${row.last_quote_date || 'N/A'}\n`
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
    <div className="w-full px-4 lg:px-8 py-8 text-ink">
      <PageHeader title="Reportes" subtitle="Análisis de cotizaciones, ingresos y actividad de clientes" />

      {/* Report Type Selector */}
      <div className={`${fb.bar} mb-6 items-center justify-between`}>
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">

          <div>
            <label className={fb.label}>Tipo de reporte</label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value)
                setReportData(null)
              }}
              className={`${fb.control} md:w-56`}
            >
              <option value="quotes-summary">Quotes Summary</option>
              <option value="revenue">Revenue Report</option>
              <option value="client-activity">Client Activity</option>
            </select>
          </div>

          <div>
            <label className={fb.label}>Desde</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className={`${fb.control} md:w-44`}
            />
          </div>

          <div>
            <label className={fb.label}>Hasta</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className={`${fb.control} md:w-44`}
            />
          </div>

          <div>
            <label className={fb.label}>Cliente</label>
            <select
              value={filters.client_id}
              onChange={(e) => setFilters({ ...filters, client_id: e.target.value })}
              className={`${fb.control} md:w-64`}
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Right side: Run Report button */}
        <Button onClick={runReport} disabled={loading}>
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running...
            </span>
          ) : 'Run Report'}
        </Button>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className='rounded-lg border border-line bg-surface p-6 shadow-card'>

          {/* Filters Applied */}
          <div className='mb-6 rounded-md border border-line bg-canvas p-4'>
            <p className='text-sm font-medium text-ink'>Filters Applied:</p>
            <p className='text-sm text-muted'>
              Date Range: {filters.start_date} to {filters.end_date}
              {filters.client_id &&
                ` | Client: ${clients.find(c => c.id == filters.client_id)?.company_name}`}
            </p>
          </div>

          {/* Report Header */}
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold tracking-tight text-ink'>
              {reportType === 'quotes-summary' && 'Quotes Summary Report'}
              {reportType === 'revenue' && 'Revenue Report'}
              {reportType === 'client-activity' && 'Client Activity Report'}
            </h2>

            <Button variant="outline" onClick={exportCSV}>
              Export CSV
            </Button>
          </div>

          {/* ----------------------------- */}
          {/* QUOTES SUMMARY */}
          {/* ----------------------------- */}
          {reportType === 'quotes-summary' && (
            <div>
              <div className='mb-6 grid grid-cols-2 gap-4 md:grid-cols-4'>
                <div className='rounded-lg border border-line bg-surface p-4 text-center shadow-card'>
                  <div className='text-2xl font-semibold tabular-nums text-ink'>
                    {reportData.summary?.total_quotes ?? 0}
                  </div>
                  <div className='mt-1 text-sm text-muted'>Total Quotes</div>
                </div>

                {reportData.status_breakdown?.map(status => (
                  <div key={status.status} className='rounded-lg border border-line bg-surface p-4 text-center shadow-card'>
                    <div className='text-xl font-semibold tabular-nums text-ink'>{status.count}</div>
                    <div className='mt-1 text-sm text-ink'>{status.status}</div>
                    <div className='text-xs text-muted'>{status.percentage}%</div>
                  </div>
                ))}
              </div>

              <h3 className='mb-3 text-base font-semibold text-ink'>Status Breakdown</h3>
              <div className={dt.wrap}>
                <table className={dt.table}>
                  <thead className={dt.thead}>
                    <tr>
                      <th className={dt.th}>Status</th>
                      <th className={dt.thRight}>Count</th>
                      <th className={dt.thRight}>Percentage</th>
                    </tr>
                  </thead>
                  <tbody className={dt.tbody}>
                    {reportData.status_breakdown?.map((row, i) => (
                      <tr key={i} className={dt.tr}>
                        <td className={dt.td}>{row.status}</td>
                        <td className={dt.tdRight}>{row.count}</td>
                        <td className={dt.tdRight}>{row.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ----------------------------- */}
          {/* REVENUE REPORT */}
          {/* ----------------------------- */}
          {reportType === 'revenue' && (
            <div>
              <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>

                <div className='rounded-lg border border-line bg-surface p-4 text-center shadow-card'>
                  <div className='text-2xl font-semibold tabular-nums text-emerald-600'>
                    ${((reportData.revenue_breakdown?.find(r => r.status === 'Approved')?.total_revenue) ?? 0).toFixed(2)}
                  </div>
                  <div className='mt-1 text-sm text-muted'>Approved Revenue</div>
                </div>

                <div className='rounded-lg border border-line bg-surface p-4 text-center shadow-card'>
                  <div className='text-2xl font-semibold tabular-nums text-amber-600'>
                    ${((reportData.revenue_breakdown?.find(r => r.status === 'Pending (Draft)')?.total_revenue) ?? 0).toFixed(2)}
                  </div>
                  <div className='mt-1 text-sm text-muted'>Pending Revenue</div>
                </div>

                <div className='rounded-lg border border-line bg-surface p-4 text-center shadow-card'>
                  <div className='text-2xl font-semibold tabular-nums text-ink'>
                    ${(reportData.grand_total ?? 0).toFixed(2)}
                  </div>
                  <div className='mt-1 text-sm text-muted'>Grand Total</div>
                </div>

              </div>

              <h3 className='mb-3 text-base font-semibold text-ink'>Revenue Breakdown</h3>
              <div className={dt.wrap}>
                <table className={dt.table}>
                  <thead className={dt.thead}>
                    <tr>
                      <th className={dt.th}>Status</th>
                      <th className={dt.thRight}>Revenue</th>
                      <th className={dt.thRight}>Quote Count</th>
                    </tr>
                  </thead>
                  <tbody className={dt.tbody}>
                    {reportData.revenue_breakdown?.map((row, i) => (
                      <tr key={i} className={dt.tr}>
                        <td className={dt.td}>{row.status}</td>
                        <td className={dt.tdRight}>
                          ${(row.total_revenue ?? 0).toFixed(2)}
                        </td>
                        <td className={dt.tdRight}>
                          {row.quote_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ----------------------------- */}
          {/* CLIENT ACTIVITY */}
          {/* ----------------------------- */}
          {reportType === 'client-activity' && (
            <div>
              <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
                <div className='rounded-lg border border-line bg-surface p-4 text-center shadow-card'>
                  <div className='text-2xl font-semibold tabular-nums text-ink'>
                    {reportData.summary?.total_clients ?? 0}
                  </div>
                  <div className='mt-1 text-sm text-muted'>Active Clients</div>
                </div>

                <div className='rounded-lg border border-line bg-surface p-4 text-center shadow-card'>
                  <div className='text-2xl font-semibold tabular-nums text-ink'>
                    {reportData.summary?.total_quotes ?? 0}
                  </div>
                  <div className='mt-1 text-sm text-muted'>Total Quotes</div>
                </div>

                <div className='rounded-lg border border-line bg-surface p-4 text-center shadow-card'>
                  <div className='text-2xl font-semibold tabular-nums text-emerald-600'>
                    ${(reportData.summary?.total_revenue ?? 0).toFixed(2)}
                  </div>
                  <div className='mt-1 text-sm text-muted'>Total Revenue</div>
                </div>
              </div>

              <h3 className='mb-3 text-base font-semibold text-ink'>Client Activity</h3>
              <div className={dt.wrap}>
                <table className={dt.table}>
                  <thead className={dt.thead}>
                    <tr>
                      <th className={dt.th}>Client</th>
                      <th className={dt.thRight}>Quotes</th>
                      <th className={dt.thRight}>Total Quoted</th>
                      <th className={dt.th}>Last Quote</th>
                    </tr>
                  </thead>
                  <tbody className={dt.tbody}>
                    {reportData.clients?.map((row, i) => (
                      <tr key={i} className={dt.tr}>
                        <td className={dt.td}>
                          {row.client_name}
                        </td>
                        <td className={dt.tdRight}>
                          {row.quote_count}
                        </td>
                        <td className={dt.tdRight}>
                          ${(row.total_quoted ?? 0).toFixed(2)}
                        </td>
                        <td className={dt.td}>
                          {row.last_quote_date || 'N/A'}
                        </td>
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
