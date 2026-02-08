'use client'

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
      setError('Please upload a CSV file only')
      setFile(null)
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size must be less than 10MB')
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
    
    // 🔒 FIXED: Get token from 'token' key (not 'auth_token')
    const token = typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null

    if (!token) {
      setError("You must be logged in to import clients")
      setIsUploading(false)
      return
    }
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('skip_duplicates', skipDuplicates.toString())
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://metpro-erp-api.onrender.com'
      const response = await fetch(`${apiUrl}/clients/bulk-import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.detail || `Server error: ${response.status}`)
      }

      const result = await response.json()
      setImportResult(result)
      
      // Auto-close after 5 seconds if successful
      if (result.success) {
        setTimeout(() => {
          onClose()
          onImportComplete()
        }, 5000)
      }
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(err.message || 'Upload failed. Please check file format.')
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-xl font-bold text-gray-900">📤 Import Clients from CSV</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {!importResult ? (
            <div className="space-y-6">
              {/* CSV Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 mb-2">📋 CSV Requirements</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <span className="font-medium">Required column:</span> company_name</li>
                  <li>• <span className="font-medium">Optional columns:</span> contact_name, email, phone, address, tax_id, notes</li>
                  <li>• File must be UTF-8 encoded (Excel: Save As → CSV UTF-8)</li>
                  <li>• First row must contain headers</li>
                  <li>• Maximum file size: 10MB</li>
                </ul>
              </div>
              
              {/* Drag & Drop Zone */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : file 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 hover:border-blue-400'
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
                      <div className="text-4xl mb-2">✅</div>
                      <p className="font-medium text-green-700">{file.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {(file.size / 1024).toFixed(2)} KB • Click to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">⬇️</div>
                      <p className="font-medium text-gray-700">
                        {dragActive ? 'Drop your CSV file here' : 'Drag & drop CSV file here'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                    </div>
                  )}
                </label>
              </div>
              
              {/* Import Options */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">⚙️ Import Options</h4>
                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                  <input
                    type="radio"
                    checked={skipDuplicates}
                    onChange={() => setSkipDuplicates(true)}
                    className="form-radio text-blue-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Skip duplicates</p>
                    <p className="text-sm text-gray-600">Keep existing records, skip duplicates</p>
                  </div>
                </label>
                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                  <input
                    type="radio"
                    checked={!skipDuplicates}
                    onChange={() => setSkipDuplicates(false)}
                    className="form-radio text-blue-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Overwrite existing</p>
                    <p className="text-sm text-gray-600">Update existing records with new data</p>
                  </div>
                </label>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  ❌ {error}
                </div>
              )}
            </div>
          ) : (
            // Import Results
            <div className="space-y-4">
              <div className={`p-6 rounded-lg ${
                importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-center mb-4">
                  {importResult.success ? (
                    <div className="text-6xl">✅</div>
                  ) : (
                    <div className="text-6xl">❌</div>
                  )}
                </div>
                <h4 className="text-xl font-bold text-center mb-2">
                  {importResult.success ? 'Import Successful!' : 'Import Failed'}
                </h4>
                {importResult.success && importResult.summary && (
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div className="text-center p-3 bg-white rounded shadow-sm">
                      <div className="font-bold text-2xl text-green-600">{importResult.summary.inserted || 0}</div>
                      <div className="text-gray-600">New Clients</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded shadow-sm">
                      <div className="font-bold text-2xl text-blue-600">{importResult.summary.updated || 0}</div>
                      <div className="text-gray-600">Updated</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded shadow-sm">
                      <div className="font-bold text-2xl text-yellow-600">{importResult.summary.skipped || 0}</div>
                      <div className="text-gray-600">Skipped</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded shadow-sm">
                      <div className="font-bold text-2xl text-red-600">{importResult.summary.errors_count || 0}</div>
                      <div className="text-gray-600">Errors</div>
                    </div>
                  </div>
                )}
              </div>
              
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <h5 className="font-bold text-yellow-900 mb-2">⚠️ Import Warnings & Errors:</h5>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="text-center text-sm text-gray-500">
                {importResult.success 
                  ? 'Modal will close automatically in 5 seconds...' 
                  : 'Please fix errors and try again'}
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="px-6 pb-6 pt-4 border-t flex justify-end space-x-3">
          {importResult ? (
            <Button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                onClick={handleClose}
                disabled={isUploading}
                variant="outline"
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className={`px-4 py-2 ${
                  !file || isUploading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isUploading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importing...
                  </span>
                ) : (
                  'Import Clients'
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}