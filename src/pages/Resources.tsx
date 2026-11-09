// src/pages/Resources.tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ChangeEvent, DragEvent } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { supabaseConfigured } from '../lib/supabase'
import { createMaterial, listMaterials, removeMaterial, saveMaterialOverview, signedFileUrl } from '../lib/materials'
import { extractText } from '../lib/extractor'
import { summarizeMaterial } from '../lib/quizApi'
import type { MaterialOverview } from '../stores/useAppStore'
import { BookOpen, Check, ChevronDown, ChevronUp, CloudUpload, ExternalLink, FileText, FolderOpen, Trash2, X } from 'lucide-react'

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp'
const MAX_FILE_BYTES = 25 * 1024 * 1024

export default function Resources() {
  const { materials, addMaterial, deleteMaterial, toggleMarked, setMaterials, updateMaterial } = useAppStore()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fileProgress, setFileProgress] = useState('')
  const [err, setErr] = useState('')
  const [overviewBusyId, setOverviewBusyId] = useState<string | null>(null)
  const [overviewError, setOverviewError] = useState<{ id: string; message: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showProgress, setShowProgress] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let active = true
    void listMaterials()
      .then((saved) => { if (active) setMaterials(saved) })
      .catch((error: unknown) => {
        if (active) setErr(error instanceof Error ? error.message : 'Could not load saved materials.')
      })
    return () => { active = false }
  }, [setMaterials])

  const toggleProgressView = (id: string) => {
    setShowProgress(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleFileSelection = (files: FileList | File[]) => {
    const picked = files[0]
    if (!picked) return
    setErr('')
    if (picked.size > MAX_FILE_BYTES) {
      setErr('Files must be 25 MB or smaller.')
      setFile(null)
      return
    }
    if (!ACCEPTED_FILE_TYPES.split(',').includes(`.${picked.name.split('.').pop()?.toLowerCase()}`)) {
      setErr('Choose a PDF, DOCX, TXT, MD, PNG, JPG, or WEBP file.')
      setFile(null)
      return
    }
    setFile(picked)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget
    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    handleFileSelection(event.dataTransfer.files)
  }

  const handleAdd = async () => {
    if (!file && !notes.trim()) return
    setUploading(true)
    setErr('')
    try {
      const fileText = file ? await extractText(file, setFileProgress) : ''
      const body = [notes.trim(), fileText].filter(Boolean).join('\n\n')
      if (!body) throw new Error('Add a file or paste some text so there is something to study.')
      const material = await createMaterial({
        title: title.trim() || file?.name || 'Untitled Document',
        content: body,
        file,
      })
      addMaterial(material)
      setNotes('')
      setTitle('')
      setFile(null)
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Could not save this study material.')
    } finally {
      setUploading(false)
      setFileProgress('')
    }
  }

  const handleGenerateOverview = async (material: (typeof materials)[number]) => {
    setOverviewBusyId(material.id)
    setOverviewError(null)
    try {
      const overview: MaterialOverview = await summarizeMaterial(material.content)
      await saveMaterialOverview(material.id, overview)
      updateMaterial(material.id, { overview })
    } catch (error) {
      setOverviewError({
        id: material.id,
        message: error instanceof Error ? error.message : 'Could not create this overview.',
      })
    } finally {
      setOverviewBusyId(null)
    }
  }

  const handleDelete = async (material: (typeof materials)[number]) => {
    setErr('')
    try {
      await removeMaterial(material.id, material.storagePath)
      deleteMaterial(material.id)
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Could not delete this study material.')
    }
  }

  const handleOpenFile = async (storagePath?: string) => {
    try {
      const url = await signedFileUrl(storagePath)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      else setErr('The original file is not stored in the cloud for this material.')
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Could not open the saved file.')
    }
  }

  return (
    <>
      <div className="page page-resources">
      <header className="page-heading">
      <div className="step-label">YOUR STUDY DESK</div>
      <h1 className="section-title">Your study materials</h1>
      <p className="sub-text page-description">
        {supabaseConfigured
          ? 'Your notes and original files sync privately to your Supabase account.'
          : 'Local-only mode: notes save in this browser. Add Supabase settings to sync across devices.'}
      </p>
      <p className="hint page-description">Summaries and AI study sets are created only when requested. Extracted text is sent securely through the app server; the original file is not sent.</p>
      </header>

      <div className="material-grid">
        {materials.length === 0 && <p className="hint">Your desk is empty. Add a file below!</p>}

        {materials.map(m => (
          <article key={m.id} className={`resource-card material-card${m.marked ? ' marked' : ''}`}>
            <div>
              <div className="material-card-header">
                <div className="material-icon"><FileText size={22} aria-hidden="true" /></div>
                <div className="material-card-actions">
                  <label className="mark-control" title="Mark as done">
                    <input
                      type="checkbox"
                      checked={m.marked}
                      onChange={() => toggleMarked(m.id)}
                    />
                    <span className="sr-only">Mark {m.title} as done</span>
                  </label>
                  <button
                    type="button"
                    className="icon-button danger"
                    onClick={() => { void handleDelete(m) }}
                    aria-label={`Delete ${m.title}`}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <h2 className="res-title">
                {m.title}
              </h2>
              {m.fileName && <p className="hint">{m.fileName}</p>}
              <p className="snippet">{m.content.slice(0, 180)}{m.content.length > 180 ? '…' : ''}</p>
              {m.overview && (
                <section className="material-overview" aria-label={`Overview of ${m.title}`}>
                  <h3 className="hint">Material overview</h3>
                  <p>{m.overview.overview}</p>
                  <details>
                    <summary>Read summary and study guide</summary>
                    <p>{m.overview.summary}</p>
                    {m.overview.keyPoints.length > 0 && (
                      <>
                        <strong>Key points</strong>
                        <ul>{m.overview.keyPoints.map(({ point, quote }, index) => (
                          <li key={`${index}-${point}`}>{point}<p className="hint">Source: “{quote}”</p></li>
                        ))}</ul>
                      </>
                    )}
                    {m.overview.keyTerms.length > 0 && (
                      <>
                        <strong>Key terms</strong>
                        <ul>{m.overview.keyTerms.map(({ term, definition }) => <li key={term}><strong>{term}:</strong> {definition}</li>)}</ul>
                      </>
                    )}
                    {m.overview.studyPlan.length > 0 && (
                      <>
                        <strong>Suggested study steps</strong>
                        <ol>{m.overview.studyPlan.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}</ol>
                      </>
                    )}
                  </details>
                </section>
              )}
            </div>

            <div className="stack material-card-footer">
              <div className="row material-actions">
                <button type="button" className="btn-primary" onClick={() => navigate(`/study?materialId=${encodeURIComponent(m.id)}`)}>
                  <BookOpen size={16} aria-hidden="true" />
                  Study this
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={overviewBusyId !== null}
                  onClick={() => { void handleGenerateOverview(m) }}
                >
                  {overviewBusyId === m.id ? 'Creating overview…' : m.overview ? 'Refresh overview' : 'Create summary & overview'}
                </button>
                {m.storagePath && (
                  <button type="button" className="btn-secondary" onClick={() => { void handleOpenFile(m.storagePath) }}>
                    <ExternalLink size={16} aria-hidden="true" />
                    Open original file
                  </button>
                )}
              </div>
              {overviewError?.id === m.id && <p className="err" role="alert">{overviewError.message}</p>}

              {m.progress.length > 0 && (
                <button
                  type="button"
                  className="btn-secondary"
                  aria-expanded={!!showProgress[m.id]}
                  onClick={() => toggleProgressView(m.id)}
                >
                  {showProgress[m.id] ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                  {showProgress[m.id] ? 'Hide progress' : `Show progress (${m.progress.length})`}
                </button>
              )}
              {showProgress[m.id] && (
                <ul className="hint progress-list">
                  {m.progress.map((entry, index) => (
                    <li key={`${entry.format}-${entry.date}-${index}`}>
                      {entry.format}: {entry.score} · {entry.date}
                    </li>
                  ))}
                </ul>
              )}
          </div>
          </article>
        ))}
      </div>

      <header className="page-heading">
        <div className="step-label">ADD TO YOUR DESK</div>
        <h2 className="section-title">Add a study material</h2>
        <p className="sub-text page-description">Upload a PDF, Word, TXT, MD, or image file, or paste your notes.</p>
      </header>

      <div className="card stack">
        <div
          className={`upload-dropzone${isDragging ? ' is-dragging' : ''}${file ? ' has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            id="resource-file"
            className="upload-input"
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileChange}
          />
          {file ? (
            <div className="upload-selected">
              <span className="upload-icon"><FileText size={23} aria-hidden="true" /></span>
              <span className="upload-file-details">
                <strong>{file.name}</strong>
                <small>{(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to add</small>
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label="Remove selected file"
                onClick={() => { setFile(null); setErr('') }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
              <span className="upload-icon"><CloudUpload size={27} aria-hidden="true" /></span>
              <strong className="upload-title">Drag and drop your study file</strong>
              <span className="upload-hint">PDF, Word, text, Markdown, or image · Max 25 MB</span>
              <div className="upload-actions">
                <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                  <FolderOpen size={16} aria-hidden="true" /> Browse files
                </button>
                <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                  <CloudUpload size={16} aria-hidden="true" /> Upload from Drive
                </button>
              </div>
              <span className="upload-hint">Drive files must be available on this device or synced locally.</span>
            </>
          )}
        </div>

        <label className="hint" htmlFor="resource-title">Title (optional)</label>
        <input
          id="resource-title"
          className="field"
          type="text"
          placeholder="e.g. Biology chapter 3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="hint" htmlFor="resource-notes">Notes (optional if your file contains text)</label>
        <textarea
          id="resource-notes"
          className="field"
          placeholder="Paste your notes here…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button type="button" className="btn-primary" disabled={uploading || (!file && !notes.trim())} onClick={handleAdd}>
          {uploading ? null : <Check size={16} aria-hidden="true" />}
          {uploading ? 'Processing material…' : 'Add to my desk'}
        </button>
        {fileProgress && <p className="hint" role="status" aria-live="polite">{fileProgress}</p>}
        {err && <p className="err" role="alert">{err}</p>}
      </div>
      </div>
    </>
  )
}
