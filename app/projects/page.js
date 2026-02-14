'use client'
import { useState, useEffect } from 'react'
import StatusPill from '@/components/ui/StatusPill'

// ============================================================
// STATUS NORMALIZATION
// ============================================================
const BACKEND_TO_DISPLAY = {
  planning: 'Planning',
  active: 'Active',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
  in_progress: 'In Progress'
}

const DISPLAY_TO_BACKEND = {
  'Planning': 'planning',
  'Active': 'active',
  'Completed': 'completed',
  'On Hold': 'on_hold',
  'Cancelled': 'cancelled',
  'In Progress': 'in_progress'
}

const ALL_STATUSES = [
  { label: 'Planning', value: 'planning' },
  { label: 'Active', value: 'active' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Cancelled', value: 'cancelled' }
]

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

  // ============================================================
  // FETCH PROJECTS
  // ============================================================
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

  // ============================================================
  // FETCH CLIENTS
  // ============================================================
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

  // ============================================================
  // DATE VALIDATION
  // ============================================================
  const validateDates = (startDate, endDate) => {
    if (!startDate || !endDate) {
      return null
    }
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null
    }

    if (end < start) {
      return 'End date must be after start date'
    }

    return null
  }

  // ============================================================
  // SANITIZE PAYLOAD (empty strings → null)
  // ============================================================
  const sanitizePayload = (data) => {
    const payload = { ...data }

    // Client ID
    if (payload.client_id === '') {
      delete payload.client_id
    } else {
      payload.client_id = parseInt(payload.client_id, 10)
    }

    // Budget
    if (payload.estimated_budget === '') {
      payload.estimated_budget = null
    } else if (payload.estimated_budget !== null && payload.estimated_budget !== undefined) {
      payload.estimated_budget = parseFloat(payload.estimated_budget)
    }

    // Empty strings → null
    if (payload.description === '') payload.description = null
    if (payload.notes === '') payload.notes = null
    if (payload.start_date === '') payload.start_date = null
    if (payload.end_date === '') payload.end_date = null

    // Validate dates
    const dateError = validateDates(payload.start_date, payload.end_date)
    if (dateError) {
      throw new Error(dateError)
    }

    return payload
  }

  // ============================================================
  // CREATE PROJECT
  // ============================================================
  const handleCreate = async () => {
    if (!newProject.client_id || !newProject.name) {
      alert('Please fill in required fields: Client and Project Name')
      return
    }

    setLoading(true)
    try {
      const payload = sanitizePayload(newProject)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
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
      } else {
        const error = await res.json()
        console.error('Create error:', error)
        alert(error.detail || 'Failed to create project')
      }
    } catch (err) {
      console.error('Create project error:', err)
      alert(err.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // UPDATE PROJECT
  // ============================================================
  const handleUpdate = async () => {
    if (!editingProject) return

    setLoading(true)
    try {
      const payload = sanitizePayload(editingProject)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${editingProject.id}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        }
      )

      if (res.ok) {
        fetchProjects()
        setEditingProject(null)
      } else {
        const error = await res.json()
        console.error('Update error:', error)
        alert(error.detail || 'Failed to update project')
      }
    } catch (err) {
      console.error('Update project error:', err)
      alert(err.message || 'Failed to update project')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // DELETE PROJECT
  // ============================================================
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

  // ============================================================
  // FILTER BY STATUS (backend-safe values)
  // ============================================================
  const getProjectsByStatus = (backendStatus) => {
    return projects.filter(p => p.status === backendStatus)
  }

  // ============================================================
  // FORMAT DATE FOR INPUT
  // ============================================================
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // ============================================================
  // RENDER PROJECT CARD
  // ============================================================
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
            onClick={() => {
              const editData = {
                ...project,
                start_date: formatDateForInput(project.start_date),
                end_date: formatDateForInput(project.end_date)
              }
              setEditingProject(editData)
            }}
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
    <div className='p-6 max-w-7xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Projects</h1>

      {/* FILTER DROPDOWN */}
      <div className='mb-6'>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value })}
          className='border border-gray-300 p-2 rounded'
        >
          <option value=''>All Statuses</option>
          {ALL_STATUSES.map(s => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* KANBAN VIEW - NO FILTER */}
      {!filters.status ? (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
          {/* PLANNING */}
          <div>
            <div className='bg-gray-100 p-3 rounded-t-lg border border-gray-300'>
              <h2 className='font-semibold text-gray-900'>Planning</h2>
              <p className='text-sm text-gray-600'>{getProjectsByStatus('planning').length} projects</p>
            </div>
            <div className='bg-gray-50 p-3 rounded-b-lg border border-t-0 border-gray-300 min-h-[200px]'>
              {getProjectsByStatus('planning').map(renderProjectCard)}
            </div>
          </div>

          {/* IN PROGRESS */}
          <div>
            <div className='bg-blue-100 p-3 rounded-t-lg border border-blue-300'>
              <h2 className='font-semibold text-gray-900'>In Progress</h2>
              <p className='text-sm text-gray-600'>{getProjectsByStatus('in_progress').length} projects</p>
            </div>
            <div className='bg-blue-50 p-3 rounded-b-lg border border-t-0 border-blue-300 min-h-[200px]'>
              {getProjectsByStatus('in_progress').map(renderProjectCard)}
            </div>
          </div>

          {/* COMPLETED */}
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
        // FILTERED VIEW
        <div className='bg-white rounded-lg shadow p-6 border border-gray-200 mb-10'>
          <h2 className='font-semibold text-gray-900 mb-4'>Filtered Results</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {projects.map(renderProjectCard)}
          </div>
        </div>
      )}

      {/* CREATE/EDIT FORM */}
      <div className='mt-10 bg-white p-6 rounded-lg shadow border border-gray-200'>
        <h2 className='text-xl font-bold mb-4'>
          {editingProject ? 'Edit Project' : 'Create Project'}
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Project Name */}
          <input
            type='text'
            placeholder='Project Name *'
            value={editingProject?.name ?? newProject.name}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, name: e.target.value })
                : setNewProject({ ...newProject, name: e.target.value })
            }
            className='border p-2 rounded'
          />

          {/* Client */}
          <select
            value={editingProject?.client_id ?? newProject.client_id}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, client_id: e.target.value })
                : setNewProject({ ...newProject, client_id: e.target.value })
            }
            className='border p-2 rounded'
          >
            <option value=''>Select Client *</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={editingProject?.status ?? newProject.status}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, status: e.target.value })
                : setNewProject({ ...newProject, status: e.target.value })
            }
            className='border p-2 rounded'
          >
            {ALL_STATUSES.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type='date'
            placeholder='Start Date'
            value={editingProject?.start_date ?? newProject.start_date}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, start_date: e.target.value })
                : setNewProject({ ...newProject, start_date: e.target.value })
            }
            className='border p-2 rounded'
          />

          {/* End Date */}
          <input
            type='date'
            placeholder='End Date'
            value={editingProject?.end_date ?? newProject.end_date}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, end_date: e.target.value })
                : setNewProject({ ...newProject, end_date: e.target.value })
            }
            className='border p-2 rounded'
          />

          {/* Budget */}
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

          {/* Description */}
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

          {/* Notes */}
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

        {/* Buttons */}
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