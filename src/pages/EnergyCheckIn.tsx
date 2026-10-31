// src/pages/EnergyCheckin.tsx
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/useAppStore'
import type { EnergyLevel } from '../stores/useAppStore'

export default function EnergyCheckin() {
  const navigate = useNavigate()
  const { setEnergyLevel, energyLevel } = useAppStore()

  const handleSelect = (level: EnergyLevel) => {
    setEnergyLevel(level)
    navigate('/study')
  }

  return (
    <div className="card stack" style={{ maxWidth: '500px', margin: '8vh auto', textAlign: 'center' }}>
      <div className="badge">STATE CALIBRATION ⚡</div>
      <h2 className="section-title">How is your energy right now?</h2>
      <p className="sub-text">We'll adjust your study pace and question density to match your current cognitive capacity.</p>

      <div className="stack" style={{ gap: '12px', marginTop: '20px' }}>
        <button 
          type="button"
          className="btn-secondary" 
          style={{ padding: '16px', borderColor: energyLevel === 'Low' ? 'var(--a1)' : 'var(--border)', width: '100%', textAlign: 'left' }}
          onClick={() => handleSelect('Low')}
        >
          🪫 <b>Low Energy</b> (Gentle flashcards & bite-sized review)
        </button>

        <button 
          type="button"
          className="btn-secondary" 
          style={{ padding: '16px', borderColor: energyLevel === 'Medium' ? 'var(--a1)' : 'var(--border)', width: '100%', textAlign: 'left' }}
          onClick={() => handleSelect('Medium')}
        >
          🔋 <b>Balanced</b> (Standard mix of MCQs and recall)
        </button>

        <button 
          type="button"
          className="btn-secondary" 
          style={{ padding: '16px', borderColor: energyLevel === 'Wired' ? 'var(--a1)' : 'var(--border)', width: '100%', textAlign: 'left' }}
          onClick={() => handleSelect('Wired')}
        >
          ⚡ <b>Wired / High Focus</b> (Exhaustive free-response synthesis)
        </button>
      </div>
    </div>
  )
}