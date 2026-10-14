'use client'
import { unwrapEnvelope } from "@/lib/api"

import { useState, useEffect } from 'react'
import StatusPill from '@/components/ui/StatusPill'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { fb } from '@/components/ui/filter-bar'

// ============================================================
// STATUS NORMALIZATION (CRITICAL - USED EVERYWHERE)
// ============================================================
/**
 * Normalize ANY status value to backend-safe format
 * Backend accepts: planning, active, in_progress, completed, on_hold, cancelled
 * Backend normalizes "in progress" → "in_progress"
 */
function normalizeStatus(s) {
  if (!s || typeof s !== 'string') return 'planning'
  
  const v = s.toLowerCase().trim()
  
  // Handle common variations
  if (v === 'in progress' || v === 'in-progress') return 'in_progress'
  if (v === 'on hold' || v === 'on-hold') return 'on_hold'
  
  // Valid backend statuses
  const valid = ['planning', 'active', 'in_progress', 'completed', 'on_hold', 'cancelled']
  return valid.includes(v) ? v : 'planning'
}

// Dropdown options (backend-safe values with human labels)
const STATUS_OPTIONS = [
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

  // ============================================================
  // AUTH HEADERS
  // ============================================================
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
  })

  // ============================================================
  // INITIAL LOAD
  // ============================================================
  useEffect(() => {
    fetchProjects()
    fetchClients()
  }, [filters.status])

  // ============================================================
  // FETCH PROJECTS (NORMALIZES EVERY STATUS BEFORE STATE)
  // ============================================================
  const fetchProjects = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/`,
        { headers: getAuthHeaders() }
      )

      if (!res.ok) {
        console.error('Failed to fetch projects:', res.status)
        return
      }

      const rawData = unwrapEnvelope(await res.json())

      // CRITICAL FIX: Normalize EVERY project status BEFORE storing
      const normalizedProjects = rawData.map(project => ({
        ...project,
        status: normalizeStatus(project.status)
      }))

      // Apply filter if active (compare normalized values)
      if (!filters.status) {
        setProjects(normalizedProjects)
      } else {
        setProjects(
          normalizedProjects.filter(p => p.status === normalizeStatus(filters.status))
        )
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
        setClients(unwrapEnvelope(await res.json()))
      }
    } catch (err) {
      console.error('Fetch clients error:', err)
    }
  }

  // ============================================================
  // DATE VALIDATION
  // ============================================================
  const validateDates = (startDate, endDate) => {
    if (!startDate || !endDate) return null

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

    if (end < start) {
      return 'End date must be after start date'
    }

    return null
  }

  // ============================================================
  // SANITIZE PAYLOAD (empty strings → null, normalize status)
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

    // CRITICAL FIX: Normalize status before sending to backend
    if (payload.status) {
      payload.status = normalizeStatus(payload.status)
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
        await fetchProjects()
        
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
  // UPDATE PROJECT (PREVENTS DISAPPEARING PROJECTS)
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
        const updatedProject = unwrapEnvelope(await res.json())
        
        // CRITICAL FIX: Normalize the returned project status
        updatedProject.status = normalizeStatus(updatedProject.status)
        
        // CRITICAL FIX: Update local state IMMEDIATELY before refetch
        // This prevents visual glitches and ensures instant Kanban updates
        setProjects(prevProjects => 
          prevProjects.map(p => 
            p.id === updatedProject.id ? updatedProject : p
          )
        )
        
        // Then refetch to ensure perfect sync
        await fetchProjects()
        
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

      if (res.ok) {
        await fetchProjects()
      }
    } catch (err) {
      console.error('Delete project error:', err)
    }
  }

  // ============================================================
  // GET PROJECTS BY STATUS (BACKEND-SAFE COMPARISON ONLY)
  // ============================================================
  const getProjectsByStatus = (backendStatus) => {
    const normalized = normalizeStatus(backendStatus)
    return projects.filter(p => p.status === normalized)
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
  // HANDLE EDIT CLICK (NORMALIZES STATUS WHEN LOADING)
  // ============================================================
  const handleEditClick = (project) => {
    const editData = {
      ...project,
      status: normalizeStatus(project.status), // Ensure normalized value enters edit form
      start_date: formatDateForInput(project.start_date),
      end_date: formatDateForInput(project.end_date)
    }
    setEditingProject(editData)
  }

  // ============================================================
  // RENDER PROJECT CARD
  // ============================================================
  const renderProjectCard = (project) => {
    const client = clients.find(c => c.id === project.client_id)
    const budget = (Number(project.estimated_budget) || 0).toFixed(2)

    return (
      <div key={project.id} className='rounded-lg border border-line bg-surface p-4 shadow-card mb-3'>
        <div className='mb-2'>
          <h3 className='font-semibold text-ink mb-1'>{project.name}</h3>
          <p className='text-sm text-muted'>{client?.company_name || '—'}</p>
        </div>

        <div className='mb-2'>
          {/* StatusPill receives normalized backend-safe value */}
          <StatusPill status={project.status} />
        </div>

        <div className='text-sm text-ink mb-2'>
          <div className='flex justify-between mb-1'>
            <span className='text-muted'>Budget:</span>
            <span className='font-medium'>${budget}</span>
          </div>
          {project.start_date && (
            <div className='flex justify-between mb-1'>
              <span className='text-muted'>Start:</span>
              <span>{project.start_date}</span>
            </div>
          )}
          {project.end_date && (
            <div className='flex justify-between'>
              <span className='text-muted'>End:</span>
              <span>{project.end_date}</span>
            </div>
          )}
        </div>

        <div className='flex gap-2 pt-2 border-t border-line'>
          <button
            className='text-accent text-sm hover:underline'
            onClick={() => handleEditClick(project)}
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

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full px-4 lg:px-8 py-6">
      <PageHeader title="Gestion Proyectos" />

      {/* ============================================================
           FILTER DROPDOWN (BACKEND-SAFE VALUES)
         ============================================================ */}
      <div className={fb.bar}>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value })}
          className={`${fb.control} md:w-56`}
        >
          <option value=''>All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* ============================================================
           KANBAN VIEW (BACKEND-SAFE COLUMN FILTERS)
         ============================================================ */}
      {!filters.status ? (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
          
          {/* PLANNING COLUMN */}
          <div>
            <div className='bg-surface p-3 rounded-t-lg border border-line'>
              <h2 className='font-semibold text-ink'>Planning</h2>
              <p className='text-sm text-muted'>
                {getProjectsByStatus('planning').length} projects
              </p>
            </div>
            <div className='bg-canvas p-3 rounded-b-lg border border-t-0 border-line min-h-[200px]'>
              {getProjectsByStatus('planning').map(renderProjectCard)}
            </div>
          </div>

          {/* IN PROGRESS COLUMN */}
          <div>
            <div className='bg-surface p-3 rounded-t-lg border border-line'>
              <h2 className='font-semibold text-ink'>In Progress</h2>
              <p className='text-sm text-muted'>
                {getProjectsByStatus('in_progress').length} projects
              </p>
            </div>
            <div className='bg-canvas p-3 rounded-b-lg border border-t-0 border-line min-h-[200px]'>
              {getProjectsByStatus('in_progress').map(renderProjectCard)}
            </div>
          </div>

          {/* COMPLETED COLUMN */}
          <div>
            <div className='bg-surface p-3 rounded-t-lg border border-line'>
              <h2 className='font-semibold text-ink'>Completed</h2>
              <p className='text-sm text-muted'>
                {getProjectsByStatus('completed').length} projects
              </p>
            </div>
            <div className='bg-canvas p-3 rounded-b-lg border border-t-0 border-line min-h-[200px]'>
              {getProjectsByStatus('completed').map(renderProjectCard)}
            </div>
          </div>

        </div>
      ) : (
        // ============================================================
        // FILTERED VIEW (BACKEND-SAFE FILTERING)
        // ============================================================
        <div className='rounded-lg border border-line bg-surface p-6 shadow-card mb-10'>
          <h2 className='font-semibold text-ink mb-4'>Filtered Results</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {projects.map(renderProjectCard)}
          </div>
        </div>
      )}

      {/* ============================================================
           CREATE/EDIT FORM (BACKEND-SAFE VALUES)
         ============================================================ */}
      <div className='mt-10 rounded-lg border border-line bg-surface p-6 shadow-card'>
        <h2 className='text-lg font-semibold tracking-tight text-ink mb-4'>
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
            className={fb.control}
          />

          {/* Client */}
          <select
            value={editingProject?.client_id ?? newProject.client_id}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, client_id: e.target.value })
                : setNewProject({ ...newProject, client_id: e.target.value })
            }
            className={fb.control}
          >
            <option value=''>Select Client *</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>

          {/* Status - Backend-safe values with human labels */}
          <select
            value={editingProject?.status ?? newProject.status}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, status: e.target.value })
                : setNewProject({ ...newProject, status: e.target.value })
            }
            className={fb.control}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type='date'
            value={editingProject?.start_date ?? newProject.start_date}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, start_date: e.target.value })
                : setNewProject({ ...newProject, start_date: e.target.value })
            }
            className={fb.control}
          />

          {/* End Date */}
          <input
            type='date'
            value={editingProject?.end_date ?? newProject.end_date}
            onChange={(e) =>
              editingProject
                ? setEditingProject({ ...editingProject, end_date: e.target.value })
                : setNewProject({ ...newProject, end_date: e.target.value })
            }
            className={fb.control}
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
            className={fb.control}
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
            className={`${fb.control} h-auto py-2 col-span-1 md:col-span-2`}
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
            className={`${fb.control} h-auto py-2 col-span-1 md:col-span-2`}
          />
        </div>

        {/* Buttons */}
        <div className='mt-4 flex gap-3'>
          {editingProject ? (
            <>
              <Button onClick={handleUpdate} disabled={loading}>
                Update
              </Button>
              <Button variant="outline" onClick={() => setEditingProject(null)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={handleCreate} disabled={loading}>
              Create
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}