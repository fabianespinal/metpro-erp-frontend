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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        setProjects(await res.json())
      }
    } catch (err) {
      console.error('Fetch projects error:', err)
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clients/`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        setClients(await res.json())
      }
    } catch (err) {
      console.error('Fetch clients error:', err)
    }
  }

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(newProject)
        }
      )
      if (res.ok) {
        fetchProjects()
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
      }
    } catch (err) {
      console.error('Create project error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingProject) return
    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${editingProject.id}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(editingProject)
        }
      )
      if (res.ok) {
        fetchProjects()
        setEditingProject(null)
      }
    } catch (err) {
      console.error('Update project error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      )
      if (res.ok) fetchProjects()
    } catch (err) {
      console.error('Delete project error:', err)
    }
  }

  return (
    <div className='p-8 max-w-7xl mx-auto'>
      <h1 className='text-3xl font-bold mb-8 text-gray-900'>Projects</h1>

      {/* Filters */}
      <div className='mb-6'>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value })}
          className='border border-gray-300 p-2 rounded'
        >
          <option value=''>All Statuses</option>
          <option value='planning'>Planning</option>
          <option value='in_progress'>In Progress</option>
          <option value='completed'>Completed</option>
        </select>
      </div>

      {/* Projects List */}
      <div className='bg-white rounded-lg shadow p-6 border border-gray-200'>
        <table className='w-full border border-gray-200'>
          <thead className='bg-gray-100'>
            <tr>
              <th className='p-2 border'>Project</th>
              <th className='p-2 border'>Client</th>
              <th className='p-2 border'>Status</th>
              <th className='p-2 border'>Budget</th>
              <th className='p-2 border'>Actions</th>
            </tr>
          </thead>

          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className='odd:bg-gray-50'>
                <td className='p-2 border'>{project.name}</td>
                <td className='p-2 border'>
                  {clients.find(c => c.id === project.client_id)?.company_name || '—'}
                </td>
                <td className='p-2 border'>
                  <StatusPill status={project.status} />
                </td>
                <td className='p-2 border text-right font-medium'>
                  ${ (Number(project.estimated_budget ?? 0) || 0).toFixed(2) }
                </td>
                <td className='p-2 border'>
                  <button
                    className='text-blue-600 mr-3'
                    onClick={() => setEditingProject(project)}
                  >
                    Edit
                  </button>
                  <button
                    className='text-red-600'
                    onClick={() => handleDelete(project.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Form */}
      <div className='mt-10 bg-white p-6 rounded-lg shadow border border-gray-200'>
        <h2 className='text-xl font-bold mb-4'>
          {editingProject ? 'Edit Project' : 'Create Project'}
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <input
            type='text'
            placeholder='Project Name'
            value={editingProject?.name ?? newProject.name}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, name: e.target.value })
                : setNewProject({ ...newProject, name: e.target.value })
            }
            className='border p-2 rounded'
          />

          <select
            value={editingProject?.client_id ?? newProject.client_id}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, client_id: e.target.value })
                : setNewProject({ ...newProject, client_id: e.target.value })
            }
            className='border p-2 rounded'
          >
            <option value=''>Select Client</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>

          <input
            type='date'
            value={editingProject?.start_date ?? newProject.start_date}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, start_date: e.target.value })
                : setNewProject({ ...newProject, start_date: e.target.value })
            }
            className='border p-2 rounded'
          />

          <input
            type='date'
            value={editingProject?.end_date ?? newProject.end_date}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, end_date: e.target.value })
                : setNewProject({ ...newProject, end_date: e.target.value })
            }
            className='border p-2 rounded'
          />

          <input
            type='number'
            placeholder='Estimated Budget'
            value={editingProject?.estimated_budget ?? newProject.estimated_budget}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, estimated_budget: e.target.value })
                : setNewProject({ ...newProject, estimated_budget: e.target.value })
            }
            className='border p-2 rounded'
          />

          <textarea
            placeholder='Notes'
            value={editingProject?.notes ?? newProject.notes}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, notes: e.target.value })
                : setNewProject({ ...newProject, notes: e.target.value })
            }
            className='border p-2 rounded col-span-1 md:col-span-2'
          />
        </div>

        <div className='mt-4 flex gap-3'>
          {editingProject ? (
            <>
              <button
                onClick={handleUpdate}
                className='bg-blue-600 text-white px-4 py-2 rounded'
              >
                Update
              </button>
              <button
                onClick={() => setEditingProject(null)}
                className='bg-gray-300 px-4 py-2 rounded'
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleCreate}
              className='bg-green-600 text-white px-4 py-2 rounded'
            >
              Create
            </button>
          )}
        </div>
      </div>
    </div>
  )
}