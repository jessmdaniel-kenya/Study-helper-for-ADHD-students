// src/pages/EnergyCheckin.tsx
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/useAppStore'
import type { EnergyLevel } from '../stores/useAppStore'
import { Battery, BatteryFull, BatteryLow, Zap } from 'lucide-react'

export default function EnergyCheckin() {
  const navigate = useNavigate()
  const { setEnergyLevel, energyLevel } = useAppStore()

  const handleSelect = (level: EnergyLevel) => {
    setEnergyLevel(level)
    navigate('/study')
  }

  return (
    <section className="card stack energy-panel">
      <div className="badge"><Zap size={15} aria-hidden="true" /> STATE CALIBRATION</div>
      <h2 className="section-title">How is your energy right now?</h2>
      <p className="sub-text">We'll adjust your study pace and question density to match your current cognitive capacity.</p>

      <div className="energy-options">
        <button 
          type="button"
          className={`energy-choice${energyLevel === 'Low' ? ' selected' : ''}`}
          onClick={() => handleSelect('Low')}
        >
          <BatteryLow size={22} aria-hidden="true" />
          <span><b>Low energy</b><small>Gentle flashcards and bite-sized review</small></span>
        </button>

        <button 
          type="button"
          className={`energy-choice${energyLevel === 'Medium' ? ' selected' : ''}`}
          onClick={() => handleSelect('Medium')}
        >
          <Battery size={22} aria-hidden="true" />
          <span><b>Balanced</b><small>A standard mix of multiple choice and recall</small></span>
        </button>

        <button 
          type="button"
          className={`energy-choice${energyLevel === 'Wired' ? ' selected' : ''}`}
          onClick={() => handleSelect('Wired')}
        >
          <BatteryFull size={22} aria-hidden="true" />
          <span><b>High focus</b><small>More challenging free-response practice</small></span>
        </button>
      </div>
    </section>
  )
}