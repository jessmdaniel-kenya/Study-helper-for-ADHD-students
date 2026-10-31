// src/pages/Game.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../stores/useAppStore'

export default function Game() {
  const { materials } = useAppStore()
  const [assembled, setAssembled] = useState<string[]>([])
  const [craftedSuccess, setCraftedSuccess] = useState(false)

  // Sample conceptual building blocks extracted from user materials
  const sampleParts = [
    'Core Definition', 
    'Operational Rule', 
    'Exception Clause', 
    'Analytical Framework', 
    'Structural Constraint'
  ]

  const handleAddComponent = (part: string) => {
    if (!assembled.includes(part)) {
      const updated = [...assembled, part]
      setAssembled(updated)
      if (updated.length >= 3) {
        setCraftedSuccess(true)
      }
    }
  }

  const resetWorkbench = () => {
    setAssembled([])
    setCraftedSuccess(false)
  }

  return (
    <div className="stack" style={{ gap: '20px' }}>
      {/* Tinker's Workbench Active Module */}
      <div className="card stack">
        <div className="badge">TINKER'S WORKBENCH 🛠️</div>
        <h2 className="section-title">Concept Assembly Engine</h2>
        <p className="sub-text">Click and combine 3 conceptual parts from your notes to forge a high-yield study blueprint for your CAT.</p>

        {!craftedSuccess ? (
          <div className="stack" style={{ marginTop: '12px' }}>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', minHeight: '60px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="hint" style={{ marginRight: '8px' }}>Workbench Slots ({assembled.length}/3):</span>
              {assembled.length === 0 && <span style={{ color: 'var(--muted)', fontSize: '14px' }}>Select parts below to assemble...</span>}
              {assembled.map((part, idx) => (
                <span key={idx} className="badge" style={{ margin: 0, background: 'rgba(0,215,255,0.15)', color: 'var(--a1)' }}>
                  ✨ {part}
                </span>
              ))}
            </div>

            <p className="hint" style={{ marginTop: '12px' }}>Available Components from Materials ({materials.length > 0 ? materials[0].title : 'General Notes'}):</p>
            <div className="chips left" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {sampleParts.map((part, idx) => (
                <button 
                  key={idx} 
                  className="btn-secondary" 
                  disabled={assembled.includes(part)}
                  onClick={() => handleAddComponent(part)}
                  style={{ opacity: assembled.includes(part) ? 0.5 : 1 }}
                >
                  + {part}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="stack" style={{ textAlign: 'center', padding: '20px', background: 'rgba(6,214,160,0.05)', borderRadius: '12px', border: '1px solid var(--a3)' }}>
            <h3 style={{ fontSize: '22px', color: 'var(--a3)', marginBottom: '8px' }}>🎉 Blueprint Successfully Forged!</h3>
            <p className="sub-text">You have synthesized your structural concepts. Your mastery level has increased.</p>
            <div className="row" style={{ justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={resetWorkbench}>
                Reset Workbench
              </button>
              <Link to="/study" className="btn-primary" style={{ textDecoration: 'none' }}>
                Test in Study Engine →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Section */}
      <div className="card soon gap" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <strong style={{ fontSize: '16px' }}>Leaderboard</strong>
          <span className="soon-badge" style={{ background: 'rgba(0,215,255,0.1)', color: 'var(--a1)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
            Coming soon, opt-in
          </span>
        </div>
        <p className="hint" style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
          Community goals we reach together, never rankings of people.
        </p>
      </div>
    </div>
  )
}