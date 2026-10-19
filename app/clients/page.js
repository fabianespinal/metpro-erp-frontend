"use client";
import { es } from "@/lib/i18n/es";
import toast from "react-hot-toast"
import { dt } from "@/components/ui/data-table";
export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react'
import Link from "next/link";
import { api } from '@/lib/api'
import CSVImportModal from '@/components/client/CSVImportModal'
import { useCurrentRole } from '@/lib/currentRole'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import ErrorBanner from '@/components/ui/ErrorBanner'

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
  const [loadError, setLoadError] = useState(null) // E-07: visible load failure with retry

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
  try {
    const data = await api.get("/clients");
    setClients(Array.isArray(data) ? data : []);
    setLoadError(null);
  } catch (error) {
    console.error("Failed to fetch clients:", error);
    setClients([]);
    // A 401 is already sent to the login page by api(). Anything else stays visible with a retry.
    setLoadError(error.code === 'NETWORK_ERROR' ? error.message : `${es.cli.errorCargar} ${error.message}`);
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
      toast.success(es.cli.creado)
    } catch (error) {
      toast.error(es.cli.errorGenerico + error.message)
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
      toast.success(es.cli.actualizado)
    } catch (error) {
      toast.error(es.cli.errorGenerico + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClient = async (clientId) => {
    if (!confirm(es.cli.confirmarEliminar)) return

    try {
      await api(`/clients/${clientId}`, { method: 'DELETE' })
      await fetchClients()
      toast.success(es.cli.eliminado)
    } catch (error) {
      toast.error(es.cli.errorEliminar + error.message)
    }
  }

  const handleImportComplete = () => {
    fetchClients()
    if (typeof window !== "undefined" && window.toast) {
      window.toast(es.cli.importados, {
        title: es.cli.exito,
        description: es.cli.listaActualizada
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

      <ErrorBanner message={loadError} onRetry={fetchClients} />

      {/* Create/Edit Client Form */}
      <div className='bg-surface rounded-lg shadow p-6 mb-8'>
        <h2 className='text-xl font-semibold mb-4'>
          {editingClient ? es.cli.editar : es.cli.nuevo}
        </h2>

        <form
          onSubmit={editingClient ? handleUpdateClient : handleCreateClient}
          className='grid grid-cols-1 md:grid-cols-2 gap-4'
        >
          <input aria-label={es.cli.empresa}
            type='text'
            placeholder={es.cli.empresa}
            value={editingClient ? editingClient.company_name : newClient.company_name}
            onChange={(e) =>
              editingClient
                ? setEditingClient({ ...editingClient, company_name: e.target.value })
                : setNewClient({ ...newClient, company_name: e.target.value })
            }
            className='border p-2 rounded'
            required
          />

          <input aria-label={es.cli.contacto}
            type='text'
            placeholder={es.cli.contacto}
            value={editingClient ? editingClient.contact_name : newClient.contact_name}
            onChange={(e) =>
              editingClient
                ? setEditingClient({ ...editingClient, contact_name: e.target.value })
                : setNewClient({ ...newClient, contact_name: e.target.value })
            }
            className='border p-2 rounded'
          />

          <input aria-label={es.cli.correo}
            type='email'
            placeholder={es.cli.correo}
            value={editingClient ? editingClient.email : newClient.email}
            onChange={(e) =>
              editingClient
                ? setEditingClient({ ...editingClient, email: e.target.value })
                : setNewClient({ ...newClient, email: e.target.value })
            }
            className='border p-2 rounded'
          />

          <input aria-label={es.cli.telefono}
            type='tel'
            placeholder={es.cli.telefono}
            value={editingClient ? editingClient.phone : newClient.phone}
            onChange={(e) =>
              editingClient
                ? setEditingClient({ ...editingClient, phone: e.target.value })
                : setNewClient({ ...newClient, phone: e.target.value })
            }
            className='border p-2 rounded'
          />

          <input aria-label={es.cli.direccion}
            type='text'
            placeholder={es.cli.direccion}
            value={editingClient ? editingClient.address : newClient.address}
            onChange={(e) =>
              editingClient
                ? setEditingClient({ ...editingClient, address: e.target.value })
                : setNewClient({ ...newClient, address: e.target.value })
            }
            className='border p-2 rounded md:col-span-2'
          />

          <input aria-label={es.cli.rnc}
            type='text'
            placeholder={es.cli.rnc}
            value={editingClient ? editingClient.tax_id : newClient.tax_id}
            onChange={(e) =>
              editingClient
                ? setEditingClient({ ...editingClient, tax_id: e.target.value })
                : setNewClient({ ...newClient, tax_id: e.target.value })
            }
            className='border p-2 rounded'
          />

          <textarea aria-label={es.cli.notas}
            placeholder={es.cli.notas}
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
            <Button type='submit' disabled={loading}>
              {loading ? es.cli.guardando : editingClient ? es.cli.actualizar : es.cli.agregar}
            </Button>

            {editingClient && (
              <Button type='button' variant='outline' onClick={() => setEditingClient(null)}>
                {es.cli.cancelar}
              </Button>
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
                <th className={dt.th}>{es.cli.colContacto}</th>
                <th className={dt.th}>{es.cli.colCorreo}</th>
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
                        className='text-accent hover:text-accent-strong px-2 py-1 rounded hover:bg-accent/10 transition'
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