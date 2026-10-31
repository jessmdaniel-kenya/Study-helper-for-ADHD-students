// src/pages/Resources.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/useAppStore'
import { supabase } from '../lib/supabase'
import { extractText } from '../lib/extractor'

export default function Resources() {
  const { materials, addMaterial, deleteMaterial, toggleMarked } = useAppStore()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')

  const [showProgress, setShowProgress] = useState<Record<string, boolean>>({})

  const toggleProgressView = (id: string) => {
    setShowProgress(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleAdd = async () => {
    if (!title.trim() && !file && !notes.trim()) return
    setUploading(true)
    setErr('')

    // Read the real text out of the file so the quiz has something to work with.
    let fileText = ''
    if (file) {
      try {
        fileText = await extractText(file)
      } catch (x) {
        setErr(x instanceof Error ? x.message : 'We couldn’t read that file.')
        setUploading(false)
        return
      }
    }
    const body = [notes.trim(), fileText].filter(Boolean).join('\n\n')
    if (!body) {
      setErr('Add a file or paste some text so there is something to study.')
      setUploading(false)
      return
    }

    let fileUrl = ''

    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      try {
        const { data, error } = await supabase.storage
          .from('materials')
          .upload(fileName, file)

        if (error) {
          console.warn('Supabase upload failed, using local fallback:', error.message)
          fileUrl = URL.createObjectURL(file)
        } else if (data) {
          const { data: urlData } = supabase.storage.from('materials').getPublicUrl(fileName)
          fileUrl = urlData.publicUrl
        }
      } catch (x) {
        console.warn('Supabase upload failed, using local fallback:', x)
        fileUrl = URL.createObjectURL(file)
      }
    }

    addMaterial({
      id: Date.now().toString(),
      title: title.trim() || file?.name || 'Untitled Document',
      content: body,
      fileUrl,
      fileName: file?.name,
      marked: false,
      progress: []
    })

    setNotes('')
    setTitle('')
    setFile(null)
    setUploading(false)
  }

  return (
    <>
      <div className="step-label">YOUR STUDY DESK</div>
      <h2 className="section-title">Open Files</h2>
      <p className="sub-text">Your materials sit right here in the open so nothing gets lost.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '56px' }}>
        {materials.length === 0 && <p className="hint">Your desk is empty. Add a file below!</p>}

        {materials.map(m => (
          <div key={m.id} className="resource-card" style={{
            marginTop: 0,
            opacity: m.marked ? 0.4 : 1,
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: m.marked ? '1px solid var(--border)' : '3px solid var(--a2)'
          }}>
            <div>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ fontSize: '32px', lineHeight: 1 }}>📄</div>
                <div className="row" style={{ gap: '8px' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Mark as done">
                    <input
                      type="checkbox"
                      checked={m.marked}
                      onChange={() => toggleMarked(m.id)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--a3)' }}
                    />
                  </label>
                  <button
                    onClick={() => deleteMaterial(m.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--muted)' }}
                    title="Trash this file"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <h3 className="res-title" style={{ fontSize: '18px', textDecoration: m.marked ? 'line-through' : 'none' }}>
                {m.title}
              </h3>
              {m.fileName && <p className="hint">{m.fileName}</p>}
              <p className="snippet">{m.content.slice(0, 180)}{m.content.length > 180 ? '…' : ''}</p>
            </div>

            <div className="stack" style={{ marginTop: '16px' }}>
              <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" className="btn-primary" onClick={() => navigate(`/study?materialId=${encodeURIComponent(m.id)}`)}>
                  Study this
                </button>
                {m.fileUrl && (
                  <a className="btn-secondary" href={m.fileUrl} target="_blank" rel="noreferrer">
                    Open file
                  </a>
                )}
              </div>

              {m.progress.length > 0 && (
                <button
                  type="button"
                  className="btn-secondary"
                  aria-expanded={!!showProgress[m.id]}
                  onClick={() => toggleProgressView(m.id)}
                >
                  {showProgress[m.id] ? 'Hide progress' : `Show progress (${m.progress.length})`}
                </button>
              )}
              {showProgress[m.id] && (
                <ul className="hint" style={{ margin: 0, paddingLeft: '20px' }}>
                  {m.progress.map((entry, index) => (
                    <li key={`${entry.format}-${entry.date}-${index}`}>
                      {entry.format}: {entry.score} · {entry.date}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="step-label">ADD TO YOUR DESK</div>
      <h2 className="section-title">Add a study material</h2>
      <p className="sub-text">Upload a PDF, Word, TXT or MD file, or paste your notes.</p>

      <div className="card stack">
        <label className="hint" htmlFor="resource-file">Choose a study file (optional)</label>
        <input id="resource-file" type="file" accept=".pdf,.docx,.txt,.md" onChange={handleFileChange} />
        {file && <p className="hint">Selected: {file.name}</p>}

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
          {uploading ? 'Adding material…' : 'Add to my desk'}
        </button>
        {err && <p className="err" role="alert">{err}</p>}
      </div>
    </>
  )
}