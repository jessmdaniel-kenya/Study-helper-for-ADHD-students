import { useState } from 'react'

export default function Resources() {
  const [notes, setNotes] = useState('')
  const [term, setTerm] = useState('')

  return (
    <>
      <div className="step-label">Your material</div>
      <h2 className="section-title">Add notes</h2>
      <p className="sub-text">Paste text or drop lecture notes. Steps and questions are made only from what you provide.</p>

      <div className="card stack">
        <input type="file" accept=".pdf,.docx,.txt" aria-label="Upload notes" />
        <textarea
          className="field"
          placeholder="Or paste your assignment or lecture notes here…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button type="button" className="btn-primary" disabled={!notes.trim()}>Break into small steps</button>
      </div>

      <div className="step-label gap">Find anything</div>
      <h2 className="section-title">Mega search</h2>
      <p className="sub-text">Searches the words inside your notes, not just the titles.</p>
      <input
        className="field"
        type="text"
        placeholder="Try a word like law or biology…"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />

      <div className="resource-card">
        <span className="subj-tag">Law</span>
        <div className="res-title">Contract Formation</div>
        <p className="snippet">…an offer must be clear and communicated to the offeree. A valid <mark>acceptance</mark> creates binding obligations…</p>
        <div className="hint">Demo result</div>
      </div>
    </>
  )
}