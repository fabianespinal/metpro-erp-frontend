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
        const data = await res.json()
        if (!filters.status) {
          setProjects(data)
        } else {
          setProjects(data.filter(p => p.status === filters.status))
        }
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

  const getProjectsByStatus = (status) => {
    return projects.filter(p => p.status === status)
  }

  const renderProjectCard = (project) => {
    const client = clients.find(c => c.id === project.client_id)
    const budget = (Number(project.estimated_budget) || 0).toFixed(2)

    return (
      <div key={project.id} className='bg-white p-4 rounded-lg shadow border border-gray-200 mb-3'>
        <div className='mb-2'>
          <h3 className='font-semibold text-gray-900 mb-1'>{project.name}</h3>
          <p className='text-sm text-gray-600'>{client?.company_name || '—'}</p>
        </div>

        <div className='mb-2'>
          <StatusPill status={project.status} />
        </div>

        <div className='text-sm text-gray-700 mb-2'>
          <div className='flex justify-between mb-1'>
            <span className='text-gray-500'>Budget:</span>
            <span className='font-medium'>${budget}</span>
          </div>
          {project.start_date && (
            <div className='flex justify-between mb-1'>
              <span className='text-gray-500'>Start:</span>
              <span>{project.start_date}</span>
            </div>
          )}
          {project.end_date && (
            <div className='flex justify-between'>
              <span className='text-gray-500'>End:</span>
              <span>{project.end_date}</span>
            </div>
          )}
        </div>

        <div className='flex gap-2 pt-2 border-t border-gray-200'>
          <button
            className='text-blue-600 text-sm hover:underline'
            onClick={() => setEditingProject(project)}
          >
            Edit
          </button>
          <button
            className='text-red-600 text-sm hover:underline'
            onClick={() => handleDelete(project.id)}
          >
            Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='p-8 max-w-7xl mx-auto'>
      <h1 className='text-3xl font-bold mb-8 text-gray-900'>Projects</h1>

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

      {!filters.status ? (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
          <div>
            <div className='bg-gray-100 p-3 rounded-t-lg border border-gray-300'>
              <h2 className='font-semibold text-gray-900'>Planning</h2>
              <p className='text-sm text-gray-600'>{getProjectsByStatus('planning').length} projects</p>
            </div>
            <div className='bg-gray-50 p-3 rounded-b-lg border border-t-0 border-gray-300 min-h-[200px]'>
              {getProjectsByStatus('planning').map(renderProjectCard)}
            </div>
          </div>

          <div>
            <div className='bg-blue-100 p-3 rounded-t-lg border border-blue-300'>
              <h2 className='font-semibold text-gray-900'>In Progress</h2>
              <p className='text-sm text-gray-600'>{getProjectsByStatus('in_progress').length} projects</p>
            </div>
            <div className='bg-blue-50 p-3 rounded-b-lg border border-t-0 border-blue-300 min-h-[200px]'>
              {getProjectsByStatus('in_progress').map(renderProjectCard)}
            </div>
          </div>

          <div>
            <div className='bg-green-100 p-3 rounded-t-lg border border-green-300'>
              <h2 className='font-semibold text-gray-900'>Completed</h2>
              <p className='text-sm text-gray-600'>{getProjectsByStatus('completed').length} projects</p>
            </div>
            <div className='bg-green-50 p-3 rounded-b-lg border border-t-0 border-green-300 min-h-[200px]'>
              {getProjectsByStatus('completed').map(renderProjectCard)}
            </div>
          </div>
        </div>
      ) : (
        <div className='bg-white rounded-lg shadow p-6 border border-gray-200 mb-10'>
          <h2 className='font-semibold text-gray-900 mb-4'>Filtered Results</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {projects.map(renderProjectCard)}
          </div>
        </div>
      )}

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

          <select
            value={editingProject?.status ?? newProject.status}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, status: e.target.value })
                : setNewProject({ ...newProject, status: e.target.value })
            }
            className='border p-2 rounded'
          >
            <option value='planning'>Planning</option>
            <option value='in_progress'>In Progress</option>
            <option value='completed'>Completed</option>
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
            placeholder='Description'
            value={editingProject?.description ?? newProject.description}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, description: e.target.value })
                : setNewProject({ ...newProject, description: e.target.value })
            }
            className='border p-2 rounded col-span-1 md:col-span-2'
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
                disabled={loading}
                className='bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50'
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
              disabled={loading}
              className='bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50'
            >
              Create
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
