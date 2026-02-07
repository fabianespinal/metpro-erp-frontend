'use client'

import { useState, useEffect } from 'react'
import CSVImportModal from '@/components/client/CSVImportModal'

export default function ClientsPage() {
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

  // 🔒 FIXED: Get token from 'token' key (not 'auth_token')
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // 🔒 Fetch clients WITH token
  const fetchClients = async () => {
    try {
      const response = await fetch('https://metpro-erp-api.onrender.com/clients/', {
        headers: getAuthHeaders()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setClients(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch clients:', error)
      setClients([])
      alert('Error loading clients. Please login again.')
    }
  }

  // 🔒 Create client WITH token
  const handleCreateClient = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('https://metpro-erp-api.onrender.com/clients/', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newClient)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create client')
      }
      
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
      alert('Client created successfully!')
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 🔒 Update client WITH token
  const handleUpdateClient = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`https://metpro-erp-api.onrender.com/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingClient)
      })
      
      if (!response.ok) throw new Error('Failed to update client')
      
      await fetchClients()
      setEditingClient(null)
      alert('Client updated successfully!')
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 🔒 Delete client WITH token
  const handleDeleteClient = async (clientId) => {
    if (!confirm('Delete this client? This cannot be undone.')) return
    
    try {
      const response = await fetch(`https://metpro-erp-api.onrender.com/clients/${clientId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) throw new Error('Failed to delete client')
      
      await fetchClients()
      alert('Client deleted!')
    } catch (error) {
      alert('Error deleting client: ' + error.message)
    }
  }

  const handleImportComplete = () => {
    // Refresh client list after import
    fetchClients()
    if (window.toast) {
      window.toast('Clients Imported!', {
        title: '✅ Success',
        description: 'Client list updated with new imports'
      })
    }
  }

  return (
    <div className='p-8 max-w-6xl mx-auto'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-3xl font-bold text-center flex-1'>METPRO ERP - Clients</h1>
        <button
          onClick={() => setImportModalOpen(true)}
          className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow'
        >
          Import CSV
        </button>
      </div>
      
      {/* Create/Edit Client Form */}
      <div className='bg-white rounded-lg shadow p-6 mb-8'>
        <h2 className='text-xl font-semibold mb-4'>
          {editingClient ? 'Edit Client' : 'New Client'}
        </h2>
        <form onSubmit={editingClient ? handleUpdateClient : handleCreateClient} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <input
            type='text'
            placeholder='Company Name *'
            value={editingClient ? editingClient.company_name : newClient.company_name}
            onChange={(e) => editingClient 
              ? setEditingClient({...editingClient, company_name: e.target.value})
              : setNewClient({...newClient, company_name: e.target.value})
            }
            className='border p-2 rounded'
            required
          />
          <input
            type='text'
            placeholder='Contact Name'
            value={editingClient ? editingClient.contact_name : newClient.contact_name}
            onChange={(e) => editingClient
              ? setEditingClient({...editingClient, contact_name: e.target.value})
              : setNewClient({...newClient, contact_name: e.target.value})
            }
            className='border p-2 rounded'
          />
          <input
            type='email'
            placeholder='Email'
            value={editingClient ? editingClient.email : newClient.email}
            onChange={(e) => editingClient
              ? setEditingClient({...editingClient, email: e.target.value})
              : setNewClient({...newClient, email: e.target.value})
            }
            className='border p-2 rounded'
          />
          <input
            type='tel'
            placeholder='Phone'
            value={editingClient ? editingClient.phone : newClient.phone}
            onChange={(e) => editingClient
              ? setEditingClient({...editingClient, phone: e.target.value})
              : setNewClient({...newClient, phone: e.target.value})
            }
            className='border p-2 rounded'
          />
          <input
            type='text'
            placeholder='Address'
            value={editingClient ? editingClient.address : newClient.address}
            onChange={(e) => editingClient
              ? setEditingClient({...editingClient, address: e.target.value})
              : setNewClient({...newClient, address: e.target.value})
            }
            className='border p-2 rounded md:col-span-2'
          />
          <input
            type='text'
            placeholder='Tax ID (RNC)'
            value={editingClient ? editingClient.tax_id : newClient.tax_id}
            onChange={(e) => editingClient
              ? setEditingClient({...editingClient, tax_id: e.target.value})
              : setNewClient({...newClient, tax_id: e.target.value})
            }
            className='border p-2 rounded'
          />
          <textarea
            placeholder='Notes'
            value={editingClient ? editingClient.notes : newClient.notes}
            onChange={(e) => editingClient
              ? setEditingClient({...editingClient, notes: e.target.value})
              : setNewClient({...newClient, notes: e.target.value})
            }
            className='border p-2 rounded md:col-span-2'
            rows='3'
          />
          <div className='md:col-span-2 flex gap-2'>
            <button
              type='submit'
              disabled={loading}
              className='bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50'
            >
              {loading ? 'Saving...' : (editingClient ? 'Update Client' : 'Add Client')}
            </button>
            {editingClient && (
              <button
                type='button'
                onClick={() => setEditingClient(null)}
                className='bg-gray-300 px-6 py-2 rounded hover:bg-gray-400'
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Clients List */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        <div className='p-4 border-b font-bold'>Client List ({clients.length})</div>
        
        {clients.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            No clients yet. Add one above or import via CSV!
          </div>
        ) : (
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='p-3 text-left'>Company</th>
                <th className='p-3 text-left'>Contact</th>
                <th className='p-3 text-left'>Email</th>
                <th className='p-3 text-left'>Phone</th>
                <th className='p-3 text-left'>Tax ID</th>
                <th className='p-3 text-right'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className='border-t hover:bg-gray-50'>
                  <td className='p-3 font-medium'>{client.company_name}</td>
                  <td className='p-3'>{client.contact_name || '-'}</td>
                  <td className='p-3'>{client.email || '-'}</td>
                  <td className='p-3'>{client.phone || '-'}</td>
                  <td className='p-3'>{client.tax_id || '-'}</td>
                  <td className='p-3 text-right'>
                    <div className='flex justify-end gap-2'>
                      <button
                        onClick={() => setEditingClient(client)}
                        className='text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition'
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className='text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition'
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CSV IMPORT MODAL */}
      <CSVImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  )
}
