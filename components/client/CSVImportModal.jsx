'use client'
import { es } from "@/lib/i18n/es";
import { unwrapEnvelope } from "@/lib/api"

import { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"

export default function CSVImportModal({ isOpen, onClose, onImportComplete }) {
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [error, setError] = useState(null)

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      validateAndSetFile(droppedFile)
    }
  }, [])

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError(es.csv.soloCsv)
      setFile(null)
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(es.csv.tamano)
      setFile(null)
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    
    setIsUploading(true)
    setError(null)
    setImportResult(null)
    
    const token = typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null

    if (!token) {
      setError(es.csv.sinSesion)
      setIsUploading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("skip_duplicates", skipDuplicates.toString())

      const apiUrl = process.env.NEXT_PUBLIC_API_URL

      const response = await fetch(`${apiUrl}/clients/bulk-import`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      })

      // Handle non-OK responses BEFORE parsing JSON
      if (!response.ok) {
        let errorMessage = es.csv.importFallo
        try {
          const errorData = await response.json()
          // Backend error model is {"detail": ..., "code": ...}.
          errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage
        } catch {
          // Fallback to text if JSON parsing fails
          const text = await response.text()
          if (text) errorMessage = text
        }
        throw new Error(errorMessage)
      }

      // Parse successful response
      const result = unwrapEnvelope(await response.json())
      setImportResult(result)

      // Auto-close on success
      if (result.success) {
        setTimeout(() => {
          handleClose()
          onImportComplete()
        }, 5000)
      }
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError(es.csv.errorRed)
      } else {
        setError(err.message || es.csv.errorSubida)
      }
      console.error('Import error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setImportResult(null)
    setError(null)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg shadow-card w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-xl font-bold text-ink">{es.csv.titulo}</h3>
          <button onClick={handleClose} className="text-muted hover:text-muted text-2xl leading-none">×</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {!importResult ? (
            <div className="space-y-6">
              {/* CSV Requirements */}
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                <h4 className="font-bold text-accent-strong mb-2">{es.csv.requisitos}</h4>
                <ul className="text-sm text-accent-strong space-y-1">
                  <li>• <span className="font-medium">{es.csv.columnaObligatoria}</span> company_name</li>
                  <li>• <span className="font-medium">{es.csv.columnasOpcionales}</span> contact_name, email, phone, address, tax_id, notes</li>
                  <li>{es.csv.utf8}</li>
                  <li>{es.csv.encabezados}</li>
                  <li>{es.csv.maximo}</li>
                </ul>
              </div>
              
              {/* Drag & Drop Zone */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  dragActive 
                    ? 'border-accent bg-accent/10' 
                    : file 
                      ? 'border-emerald-600 bg-emerald-50' 
                      : 'border-line hover:border-accent'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="csv-upload"
                  onChange={handleFileChange}
                />

                <label htmlFor="csv-upload" className="cursor-pointer block">
                  {file ? (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">{es.csv.archivoListo}</p>
                      <p className="font-medium text-emerald-700">{file.name}</p>
                      <p className="text-sm text-muted mt-1">
                        { ((file?.size ?? 0) / 1024).toFixed(2) } {es.csv.cambiarArchivo}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{es.csv.sinArchivo}</p>
                      <p className="font-medium text-ink">
                        {dragActive ? es.csv.suelteAqui : es.csv.arrastre}
                      </p>
                      <p className="text-sm text-muted mt-1">{es.csv.clic}</p>
                    </div>
                  )}
                </label>
              </div>
              
              {/* Import Options */}
              <div className="space-y-3">
                <h4 className="font-medium text-ink">{es.csv.opciones}</h4>
                <label className="flex items-center space-x-3 p-3 bg-canvas rounded-lg cursor-pointer hover:bg-canvas transition">
                  <input
                    type="radio"
                    checked={skipDuplicates}
                    onChange={() => setSkipDuplicates(true)}
                    className="form-radio text-accent"
                  />
                  <div>
                    <p className="font-medium text-ink">{es.csv.omitir}</p>
                    <p className="text-sm text-muted">{es.csv.omitirDesc}</p>
                  </div>
                </label>
                <label className="flex items-center space-x-3 p-3 bg-canvas rounded-lg cursor-pointer hover:bg-canvas transition">
                  <input
                    type="radio"
                    checked={!skipDuplicates}
                    onChange={() => setSkipDuplicates(false)}
                    className="form-radio text-accent"
                  />
                  <div>
                    <p className="font-medium text-ink">{es.csv.sobrescribir}</p>
                    <p className="text-sm text-muted">{es.csv.sobrescribirDesc}</p>
                  </div>
                </label>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {es.csv.errorPrefijo} {error}
                </div>
              )}
            </div>
          ) : (
            // Import Results
            <div className="space-y-4">
              <div className={`p-6 rounded-lg ${
                importResult.success ? 'bg-emerald-50 border border-emerald-600' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-center mb-4">
                  {importResult.success ? (
                    <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{es.csv.exitoso}</p>
                  ) : (
                    <p className="text-sm font-semibold uppercase tracking-wide text-red-700">{es.csv.fallida}</p>
                  )}
                </div>
                <h4 className="text-xl font-bold text-center mb-2">
                  {importResult.success ? es.csv.exitosoAdm : es.csv.fallidaAdm}
                </h4>
                {importResult.success && importResult.summary && (
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div className="text-center p-3 bg-surface rounded shadow-sm">
                      <div className="font-bold text-2xl text-emerald-600">{importResult.summary.inserted || 0}</div>
                      <div className="text-muted">{es.csv.nuevos}</div>
                    </div>
                    <div className="text-center p-3 bg-surface rounded shadow-sm">
                      <div className="font-bold text-2xl text-accent">{importResult.summary.updated || 0}</div>
                      <div className="text-muted">{es.csv.actualizados}</div>
                    </div>
                    <div className="text-center p-3 bg-surface rounded shadow-sm">
                      <div className="font-bold text-2xl text-amber-600">{importResult.summary.skipped || 0}</div>
                      <div className="text-muted">{es.csv.omitidos}</div>
                    </div>
                    <div className="text-center p-3 bg-surface rounded shadow-sm">
                      <div className="font-bold text-2xl text-red-600">{importResult.summary.errors_count || 0}</div>
                      <div className="text-muted">{es.csv.errores}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <h5 className="font-bold text-amber-800 mb-2">{es.csv.advertencias}</h5>
                  <ul className="text-sm text-amber-800 space-y-1">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="text-center text-sm text-muted">
                {importResult.success 
                  ? es.csv.cierraSolo 
                  : es.csv.corrija}
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="px-6 pb-6 pt-4 border-t flex justify-end space-x-3">
          {importResult ? (
            <Button
              onClick={handleClose}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-strong"
            >
              {es.csv.cerrar}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleClose}
                disabled={isUploading}
                variant="outline"
                className="px-4 py-2"
              >
                {es.csv.cancelar}
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className={`px-4 py-2 ${
                  !file || isUploading
                    ? 'bg-line cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accent-strong'
                }`}
              >
                {isUploading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {es.csv.importando}
                  </span>
                ) : (
                  es.csv.importar
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}