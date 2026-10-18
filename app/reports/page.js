'use client'
import { es } from "@/lib/i18n/es";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { unwrapEnvelope, checkUnauthorized } from "@/lib/api"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { fb } from "@/components/ui/filter-bar"
import { dt } from "@/components/ui/data-table"

import { useState, useEffect } from 'react'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('quotes-summary')
  const [loadError, setLoadError] = useState(null)
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
      } else {
        checkUnauthorized(res)
        setLoadError(`No se pudieron cargar los clientes (error ${res.status}).`)
      }
    } catch (error) {
      console.error('Fetch clients error:', error)
      setLoadError(`No se pudieron cargar los clientes: ${error.message}`)
    }
  }

  const runReport = async () => {
    if (!filters.start_date || !filters.end_date) {
      alert(es.rep.fechasRequeridas)
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
        checkUnauthorized(res)
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
      csvContent = es.rep.csvResumen

      reportData.status_breakdown?.forEach(row => {
        csvContent += `${es.estados[row.status] ?? row.status},${row.count},${row.percentage}%\n`
      })

      csvContent += `\n${es.rep.csvTotal},${reportData.summary?.total_quotes ?? 0},100%`
    }

    else if (reportType === 'revenue') {
      filename = 'revenue_report'
      csvContent = 'Concepto,Monto,Cantidad\n'

      reportData.revenue_breakdown?.forEach(row => {
        csvContent += `${es.estados[row.status] ?? row.status},$${(row.total_revenue ?? 0).toFixed(2)},${row.count ?? row.quote_count}\n`
      })

      csvContent += `\nCobrado,$${(reportData.grand_total ?? 0).toFixed(2)}`
    }

    else if (reportType === 'client-activity') {
      filename = 'client_activity'
      csvContent = es.rep.csvActividad

      reportData.clients?.forEach(row => {
        csvContent += `${row.client_name},${row.quote_count},$${(row.total_quoted ?? 0).toFixed(2)},${row.last_quote_date || es.rep.noAplica}\n`
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
      <ErrorBanner message={loadError} />

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
              <option value="quotes-summary">{es.rep.resumenCotizaciones}</option>
              <option value="revenue">{es.rep.ingresos}</option>
              <option value="client-activity">{es.rep.actividadClientes}</option>
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
              <option value="">{es.rep.todosClientes}</option>
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
              {es.rep.generando}
            </span>
          ) : es.rep.ejecutar}
        </Button>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className='rounded-lg border border-line bg-surface p-6 shadow-card'>

          {/* Filters Applied */}
          <div className='mb-6 rounded-md border border-line bg-canvas p-4'>
            <p className='text-sm font-medium text-ink'>{es.rep.filtrosAplicados}</p>
            <p className='text-sm text-muted'>
              {es.rep.rangoFechas} {filters.start_date} {es.rep.hasta} {filters.end_date}
              {filters.client_id &&
                ` | ${es.rep.cliente} ${clients.find(c => c.id == filters.client_id)?.company_name}`}
            </p>
          </div>

          {/* Report Header */}
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold tracking-tight text-ink'>
              {reportType === 'quotes-summary' && es.rep.tituloResumen}
              {reportType === 'revenue' && es.rep.tituloIngresos}
              {reportType === 'client-activity' && es.rep.tituloActividad}
            </h2>

            <Button variant="outline" onClick={exportCSV}>
              {es.rep.exportarCsv}
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
                  <div className='mt-1 text-sm text-muted'>{es.rep.totalCotizaciones}</div>
                </div>

                {reportData.status_breakdown?.map(status => (
                  <div key={status.status} className='rounded-lg border border-line bg-surface p-4 text-center shadow-card'>
                    <div className='text-xl font-semibold tabular-nums text-ink'>{status.count}</div>
                    <div className='mt-1 text-sm text-ink'>{status.status}</div>
                    <div className='text-xs text-muted'>{status.percentage}%</div>
                  </div>
                ))}
              </div>

              <h3 className='mb-3 text-base font-semibold text-ink'>{es.rep.desgloseEstado}</h3>
              <div className={dt.wrap}>
                <table className={dt.table}>
                  <thead className={dt.thead}>
                    <tr>
                      <th className={dt.th}>{es.rep.estado}</th>
                      <th className={dt.thRight}>{es.rep.cantidad}</th>
                      <th className={dt.thRight}>{es.rep.porcentaje}</th>
                    </tr>
                  </thead>
                  <tbody className={dt.tbody}>
                    {reportData.status_breakdown?.map((row, i) => (
                      <tr key={i} className={dt.tr}>
                        <td className={dt.td}>{es.estados[row.status] ?? row.status}</td>
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
                    ${((reportData.revenue_breakdown?.find(r => r.key === 'invoiced')?.total_revenue) ?? 0).toFixed(2)}
                  </div>
                  <div className='mt-1 text-sm text-muted'>Facturado</div>
                </div>

                <div className='rounded-lg border border-line bg-surface p-4 text-center shadow-card'>
                  <div className='text-2xl font-semibold tabular-nums text-amber-600'>
                    ${((reportData.revenue_breakdown?.find(r => r.key === 'outstanding')?.total_revenue) ?? 0).toFixed(2)}
                  </div>
                  <div className='mt-1 text-sm text-muted'>Por cobrar</div>
                </div>

                <div className='rounded-lg border border-line bg-surface p-4 text-center shadow-card'>
                  <div className='text-2xl font-semibold tabular-nums text-ink'>
                    ${(reportData.grand_total ?? 0).toFixed(2)}
                  </div>
                  <div className='mt-1 text-sm text-muted'>Cobrado (pagos recibidos)</div>
                </div>

              </div>

              <h3 className='mb-3 text-base font-semibold text-ink'>{es.rep.desgloseIngresos}</h3>
              <div className={dt.wrap}>
                <table className={dt.table}>
                  <thead className={dt.thead}>
                    <tr>
                      <th className={dt.th}>Concepto</th>
                      <th className={dt.thRight}>Monto</th>
                      <th className={dt.thRight}>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className={dt.tbody}>
                    {reportData.revenue_breakdown?.map((row, i) => (
                      <tr key={i} className={dt.tr}>
                        <td className={dt.td}>{es.estados[row.status] ?? row.status}</td>
                        <td className={dt.tdRight}>
                          ${(row.total_revenue ?? 0).toFixed(2)}
                        </td>
                        <td className={dt.tdRight}>
                          {row.count ?? row.quote_count}
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
                  <div className='mt-1 text-sm text-muted'>{es.rep.clientesActivos}</div>
                </div>

                <div className='rounded-lg border border-line bg-surface p-4 text-center shadow-card'>
                  <div className='text-2xl font-semibold tabular-nums text-ink'>
                    {reportData.summary?.total_quotes ?? 0}
                  </div>
                  <div className='mt-1 text-sm text-muted'>{es.rep.totalCotizaciones}</div>
                </div>

                <div className='rounded-lg border border-line bg-surface p-4 text-center shadow-card'>
                  <div className='text-2xl font-semibold tabular-nums text-emerald-600'>
                    ${(reportData.summary?.total_revenue ?? 0).toFixed(2)}
                  </div>
                  <div className='mt-1 text-sm text-muted'>{es.rep.totalIngresos}</div>
                </div>
              </div>

              <h3 className='mb-3 text-base font-semibold text-ink'>{es.rep.actividadClientes}</h3>
              <div className={dt.wrap}>
                <table className={dt.table}>
                  <thead className={dt.thead}>
                    <tr>
                      <th className={dt.th}>{es.rep.cliente2}</th>
                      <th className={dt.thRight}>{es.rep.cotizaciones}</th>
                      <th className={dt.thRight}>{es.rep.totalCotizado}</th>
                      <th className={dt.th}>{es.rep.ultimaCotizacion}</th>
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
                          {row.last_quote_date || es.rep.noAplica}
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
