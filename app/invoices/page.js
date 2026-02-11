'use client'
import { useState, useEffect } from 'react'
import { api } from "@/lib/api"
import StatusPill from '@/components/ui/StatusPill'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  // --------------------------
  // FIXED: fetchInvoices()
  // --------------------------
  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        console.error("No token found")
        setInvoices([])
        setLoading(false)
        return
      }

      const data = await api("/invoices/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setInvoices(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      const token = localStorage.getItem("token")

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pdf/invoices/${invoiceId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`PDF download failed: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `${invoiceNumber}_factura.pdf`
      document.body.appendChild(a)
      a.click()

      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('PDF Download Error:', error)
      alert('Error downloading PDF: ' + error.message)
    }
  }

  const handleDownloadConduce = async (invoiceId, invoiceNumber) => {
    try {
      const token = localStorage.getItem("token")

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoiceId}/conduce/pdf`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Conduce download failed: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `CD-${invoiceNumber}_conduce.pdf`
      document.body.appendChild(a)
      a.click()

      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Conduce Download Error:', error)
      alert('Error downloading conduce: ' + error.message)
    }
  }

  const handleUpdateStatus = async (invoiceId, newStatus) => {
    try {
      const token = localStorage.getItem("token")

      await api(`/invoices/${invoiceId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      fetchInvoices()

      if (window.toast) {
        window.toast('Status updated!', {
          title: '✅ Success',
          description: `Invoice status changed to ${newStatus}`,
        })
      }
    } catch (error) {
      alert('Error updating status: ' + error.message)
    }
  }

  const filteredInvoices =
    statusFilter === 'all'
      ? invoices
      : invoices.filter(inv => inv.status === statusFilter)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💰 Invoices</h1>
          <p className="text-gray-600">View and manage all invoices</p>
        </div>

        {/* FILTERS */}
        ...
        {/* (rest of your JSX stays the same) */}
      </div>
    </div>
  )
}

