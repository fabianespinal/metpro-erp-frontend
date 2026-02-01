// Single reusable report page
'use client'

import { useState } from 'react'
import DateRangePicker from '@/components/ui/DateRangePicker' // Reuse if exists, else minimal custom

export default function ReportsPage() {
  const [reportType, setReportType] = useState('quotes-summary')
  const [filters, setFilters] = useState({ start_date: '', end_date: '', client_id: '' })
  const [data, setData] = useState(null)
  
  const runReport = async () => {
    const params = new URLSearchParams(filters).toString()
    const res = await fetch(`/api/reports/${reportType}?${params}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    })
    setData(await res.json())
  }
  
  const exportCSV = () => {
    // Minimal CSV export (matches existing pattern from product import)
    const rows = data.clients?.map(c => 
      `${c.client_name},${c.quote_count},${c.total_quoted}`
    ).join('\n')
    const blob = new Blob([`Client,Quotes,Total\n${rows}`], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${reportType}.csv`; a.click()
  }
  
  // Render filter bar + table matching existing UI
  // No charts - pure tabular data
}