"use client";
import { dt } from "@/components/ui/data-table";
export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react'
import Link from "next/link";
import { api } from '@/lib/api'
import CSVImportModal from '@/components/client/CSVImportModal'
import { useCurrentRole } from '@/lib/currentRole'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'

export default function ClientsPage() {
  const { isAdmin } = useCurrentRole()
  const [clients, setClients] = useState([])
  const [newClient, setNewClient] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    notes: ''
  })
  const [editingClient, setEditingClient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)

  // Debug token status (SSR-safe)
  const [tokenStatus, setTokenStatus] = useState("checking")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      setTokenStatus(token ? "present" : "missing")
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
  try {
    const data = await api.get("/clients");
    setClients(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Failed to fetch clients:", error);
    setClients([]);
    if (error.message.includes("401") || error.message.includes("unauthorized")) {
      alert("Session expired. Please login again.");
    } else {
      alert("Error loading clients. Please try again.");
    }
  }
};

  const handleCreateClient = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api('/clients/', {
        method: 'POST',
        body: JSON.stringify(newClient)
      })

      await fetchClients()
      setNewClient({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        tax_id: '',
        notes: ''
      })
      alert("Client created successfully!")
    } catch (error) {
      alert("Error: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateClient = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api(`/clients/${editingClient.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingClient)
      })

      await fetchClients()
      setEditingClient(null)
      alert("Client updated successfully!")
    } catch (error) {
      alert("Error: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClient = async (clientId) => {
    if (!confirm("Delete this client? This cannot be undone.")) return

    try {
      await api(`/clients/${clientId}`, { method: 'DELETE' })
      await fetchClients()
      alert("Client deleted!")
    } catch (error) {
      alert("Error deleting client: " + error.message)
    }
  }

  const handleImportComplete = () => {
    fetchClients()
    if (typeof window !== "undefined" && window.toast) {
      window.toast("Clients Imported!", {
        title: "Success",
        description: "Client list updated with new imports"
      })
    }
  }

  return (
    <div className="w-full px-4 lg:px-8 py-8">
      <PageHeader
        title="Clientes"
        actions={
          <Button variant="outline" onClick={() => setImportModalOpen(true)}>
            Importar CSV
          </Button>
        }
      />

      {/* Debug Info (SSR-safe) */}
      <div className='bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-xs'>
        <strong>Debug Info:</strong> Token in localStorage:{' '}
        {tokenStatus === "checking"
          ? "⏳ Checking..."
          : tokenStatus === "present"
          ? "Present"
          : "Missing"}
      </div>

      {/* Create/Edit Client Form */}
      <div className='bg-surface rounded-lg shadow p-6 mb-8'>
        <h2 className='text-xl font-semibold mb-4'>
          {editingClient ? "Edit Client" : "New Client"}
        </h2>

        <form
          onSubmit={editingClient ? handleUpdateClient : handleCreateClient}
          className='grid grid-cols-1 md:grid-cols-2 gap-4'
        >
          <input
            type='text'
            placeholder='Company Name *'
            value={editingClient ? editingClient.company_name : newClient.company_name}
            onChange={(e) =>
              editingClient
                ? setEditingClient({ ...editingClient, company_name: e.target.value })
                : setNewClient({ ...newClient, company_name: e.target.value })
            }
            className='border p-2 rounded'
            required
          />

          <input
            type='text'
            placeholder='Contact Name'
            value={editingClient ? editingClient.contact_name : newClient.contact_name}
            onChange={(e) =>
              editingClient
                ? setEditingClient({ ...editingClient, contact_name: e.target.value })
                : setNewClient({ ...newClient, contact_name: e.target.value })
            }
            className='border p-2 rounded'
          />

          <input
            type='email'
            placeholder='Email'
            value={editingClient ? editingClient.email : newClient.email}
            onChange={(e) =>
              editingClient
                ? setEditingClient({ ...editingClient, email: e.target.value })
                : setNewClient({ ...newClient, email: e.target.value })
            }
            className='border p-2 rounded'
          />

          <input
            type='tel'
            placeholder='Phone'
            value={editingClient ? editingClient.phone : newClient.phone}
            onChange={(e) =>
              editingClient
                ? setEditingClient({ ...editingClient, phone: e.target.value })
                : setNewClient({ ...newClient, phone: e.target.value })
            }
            className='border p-2 rounded'
          />

          <input
            type='text'
            placeholder='Address'
            value={editingClient ? editingClient.address : newClient.address}
            onChange={(e) =>
              editingClient
                ? setEditingClient({ ...editingClient, address: e.target.value })
                : setNewClient({ ...newClient, address: e.target.value })
            }
            className='border p-2 rounded md:col-span-2'
          />

          <input
            type='text'
            placeholder='Tax ID (RNC)'
            value={editingClient ? editingClient.tax_id : newClient.tax_id}
            onChange={(e) =>
              editingClient
                ? setEditingClient({ ...editingClient, tax_id: e.target.value })
                : setNewClient({ ...newClient, tax_id: e.target.value })
            }
            className='border p-2 rounded'
          />

          <textarea
            placeholder='Notes'
            value={editingClient ? editingClient.notes : newClient.notes}
            onChange={(e) =>
              editingClient
                ? setEditingClient({ ...editingClient, notes: e.target.value })
                : setNewClient({ ...newClient, notes: e.target.value })
            }
            className='border p-2 rounded md:col-span-2'
            rows='3'
          />

          <div className='md:col-span-2 flex gap-2'>
            <button
              type='submit'
              disabled={loading}
              className='bg-accent text-white px-6 py-2 rounded hover:bg-accent-strong disabled:opacity-50'
            >
              {loading ? "Saving..." : editingClient ? "Update Client" : "Add Client"}
            </button>

            {editingClient && (
              <button
                type='button'
                onClick={() => setEditingClient(null)}
                className='bg-line px-6 py-2 rounded hover:bg-line/70'
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Clients List */}
      <div className='bg-surface rounded-lg shadow overflow-x-auto'>
        <div className='p-4 border-b font-bold'>Lista de Clientes ({clients.length})</div>

        {clients.length === 0 ? (
          <div className='p-8 text-center text-muted'>
            No hay clientes aún. Agrega uno arriba o importa desde CSV!
          </div>
        ) : (
          <table className={dt.table}>
            <thead className={dt.thead}>
              <tr>
                <th className={dt.th}>Compañía</th>
                <th className={dt.th}>Contact</th>
                <th className={dt.th}>Email</th>
                <th className={dt.th}>Teléfono</th>
                <th className={dt.th}>Dirección</th>
                <th className={dt.th}>Notas</th>
                <th className={dt.th}>RCN</th>
                <th className={dt.thRight}>Acciones</th>
              </tr>
            </thead>

            <tbody className={dt.tbody}>
              {clients.map((client) => (
                <tr key={client.id} className={dt.tr}>
                  <td className={dt.td}>{client.company_name}</td>
                  <td className={dt.td}>{client.contact_name || '-'}</td>
                  <td className={dt.td}>{client.email || '-'}</td>
                  <td className={dt.td}>{client.phone || '-'}</td>
                  <td className={dt.td}>{client.address || '-'}</td>
                  <td className={dt.td}>{client.notes || '-'}</td>
                  <td className={dt.td}>{client.tax_id || '-'}</td>

                  <td className={dt.tdRight}>
                    <div className='flex justify-end gap-2'>
                      <button
                        onClick={() => setEditingClient(client)}
                        className='text-accent hover:text-accent-strong px-2 py-1 rounded hover:bg-accent/10 transition'
                      >
                        Editar
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className='text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition'
                        >
                          Eliminar
                        </button>
                      )}

                      {/* NEW: Manage Contacts */}
                      <Link
                        href={`/contacts/${client.id}`}
                        className='text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 transition'
                      >
                        Contactos
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CSVImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  )
}