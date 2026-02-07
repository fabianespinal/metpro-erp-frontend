'use client'

import { useState, useEffect } from 'react'
import StatusPill from '@/components/ui/StatusPill'

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [newProject, setNewProject] = useState({
    client_id: '',
    name: '',
    description: '',
    status: 'planning',
    start_date: '',
    end_date: '',
    estimated_budget: '',
    notes: ''
  })
  const [editingProject, setEditingProject] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ status: '' })

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  })

  useEffect(() => {
    fetchProjects()
    fetchClients()
  }, [filters.status])

  const fetchProjects = async () => {
    try {
      const params = filters.status ? `?status=${filters.status}` : ''
      const res = await fetch(`https://metpro-erp-api.onrender.com/projects${params}`, {
        headers: getAuthHeaders()
      })
      if (!res.ok) throw new Error('Failed to fetch projects')
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Fetch projects error:', error)
      setProjects([])
      alert('Error loading projects. Please login again.')
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch('https://metpro-erp-api.onrender.com/clients/', {
        headers: getAuthHeaders()
      })
      if (!res.ok) throw new Error('Failed to fetch clients')
      const data = await res.json()
      setClients(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Fetch clients error:', error)
      setClients([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const url = editingProject 
        ? `https://metpro-erp-api.onrender.com/projects/${editingProject.id}`
        : 'https://metpro-erp-api.onrender.com/projects/'
      
      const method = editingProject ? 'PUT' : 'POST'
      const body = {
        client_id: parseInt(newProject.client_id),
        name: newProject.name,
        description: newProject.description,
        status: newProject.status,
        start_date: newProject.start_date,
        end_date: newProject.end_date || null,
        estimated_budget: newProject.estimated_budget ? parseFloat(newProject.estimated_budget) : null,
        notes: newProject.notes
      }
      
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      })
      
      if (!res.ok) throw new Error('Operation failed')
      
      await fetchProjects()
      resetForm()
      alert(editingProject ? 'Project updated!' : 'Project created!')
    } catch (error) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this project? This cannot be undone.')) return
    
    try {
      const res = await fetch(`https://metpro-erp-api.onrender.com/projects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!res.ok) throw new Error('Delete failed')
      
      await fetchProjects()
      alert('Project deleted!')
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  const resetForm = () => {
    setNewProject({
      client_id: '',
      name: '',
      description: '',
      status: 'planning',
      start_date: '',
      end_date: '',
      estimated_budget: '',
      notes: ''
    })
    setEditingProject(null)
  }

  const startEdit = (project) => {
    setNewProject({
      client_id: project.client_id.toString(),
      name: project.name,
      description: project.description || '',
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date || '',
      estimated_budget: project.estimated_budget?.toString() || '',
      notes: project.notes || ''
    })
    setEditingProject(project)
  }

  return (
    <div className='p-8 max-w-7xl mx-auto'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Projects</h1>
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className='border border-gray-300 p-2 rounded text-sm bg-white'
        >
          <option value=''>All Statuses</option>
          <option value='planning'>Planning</option>
          <option value='active'>Active</option>
          <option value='closed'>Closed</option>
        </select>
      </div>

      {/* Create/Edit Form */}
      <div className='bg-white rounded-lg shadow p-6 mb-8 border border-gray-200'>
        <h2 className='text-xl font-semibold mb-4 text-gray-800'>
          {editingProject ? 'Edit Project' : 'New Project'}
        </h2>
        <form onSubmit={handleSubmit} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <select
            value={newProject.client_id}
            onChange={(e) => setNewProject({...newProject, client_id: e.target.value})}
            className='border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            required
          >
            <option value=''>Select Client *</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.company_name} {client.contact_name ? `(${client.contact_name})` : ''}
              </option>
            ))}
          </select>
          
          <input
            type='text'
            placeholder='Project Name *'
            value={newProject.name}
            onChange={(e) => setNewProject({...newProject, name: e.target.value})}
            className='border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            required
          />
          
          <input
            type='date'
            value={newProject.start_date}
            onChange={(e) => setNewProject({...newProject, start_date: e.target.value})}
            className='border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            required
          />
          
          <input
            type='date'
            value={newProject.end_date}
            onChange={(e) => setNewProject({...newProject, end_date: e.target.value})}
            className='border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
          
          <select
            value={newProject.status}
            onChange={(e) => setNewProject({...newProject, status: e.target.value})}
            className='border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value='planning'>Planning</option>
            <option value='active'>Active</option>
            <option value='closed'>Closed</option>
          </select>
          
          <input
            type='number'
            placeholder='Estimated Budget'
            value={newProject.estimated_budget}
            onChange={(e) => setNewProject({...newProject, estimated_budget: e.target.value})}
            className='border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            step='0.01'
          />
          
          <textarea
            placeholder='Description'
            value={newProject.description}
            onChange={(e) => setNewProject({...newProject, description: e.target.value})}
            className='border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 md:col-span-2'
            rows='2'
          />
          
          <textarea
            placeholder='Notes'
            value={newProject.notes}
            onChange={(e) => setNewProject({...newProject, notes: e.target.value})}
            className='border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 md:col-span-2'
            rows='2'
          />
          
          <div className='md:col-span-2 flex gap-2'>
            <button
              type='submit'
              disabled={loading}
              className='bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium transition shadow-md hover:shadow-lg'
            >
              {loading ? 'Saving...' : (editingProject ? 'Update Project' : 'Create Project')}
            </button>
            {editingProject && (
              <button
                type='button'
                onClick={resetForm}
                className='bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 font-medium transition'
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Projects Table */}
      <div className='bg-white rounded-lg shadow overflow-hidden border border-gray-200'>
        <div className='p-4 border-b border-gray-200 font-bold text-gray-800'>
          Project List ({projects.length})
        </div>
        
        {projects.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            No projects yet. Create one above!
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='p-3 text-left text-sm font-medium text-gray-700'>Project</th>
                  <th className='p-3 text-left text-sm font-medium text-gray-700'>Client</th>
                  <th className='p-3 text-left text-sm font-medium text-gray-700'>Status</th>
                  <th className='p-3 text-left text-sm font-medium text-gray-700'>Start Date</th>
                  <th className='p-3 text-left text-sm font-medium text-gray-700'>Budget</th>
                  <th className='p-3 text-right text-sm font-medium text-gray-700'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id} className='border-t border-gray-200 hover:bg-gray-50'>
                    <td className='p-3 font-medium text-gray-900'>{project.name}</td>
                    <td className='p-3 text-gray-700'>{project.client_name || 'Unknown'}</td>
                    <td className='p-3'>
                      <StatusPill status={project.status} />
                    </td>
                    <td className='p-3 text-gray-700'>{project.start_date}</td>
                    <td className='p-3 text-gray-700'>
                      {project.estimated_budget ? `$${parseFloat(project.estimated_budget).toLocaleString()}` : '-'}
                    </td>
                    <td className='p-3 text-right'>
                      <div className='flex justify-end gap-2'>
                        <button
                          onClick={() => startEdit(project)}
                          className='text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition text-sm'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className='text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition text-sm'
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}