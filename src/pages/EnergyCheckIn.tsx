import { useEffect, useState } from 'react'

const SECONDS = { '50s': 50, '5m': 300, '20m': 1200, '30m': 1800 }
type Preset = keyof typeof SECONDS
type Level = { id: string; icon: string; desc: string; preset: Preset }

const LEVELS: Level[] = [
  { id: 'Low', icon: '🪫', desc: '50 sec or 5 min', preset: '50s' },
  { id: 'Medium', icon: '🔋', desc: '20 min sprint', preset: '20m' },
  { id: 'Charged up', icon: '⚡', desc: '30 min sprint', preset: '30m' },
]
const CHIPS: [Preset, string][] = [
  ['50s', '50 sec'],
  ['5m', '5 min'],
  ['20m', '20 min'],
  ['30m', '30 min'],
]
const MATERIALS = ['No material yet', 'Demo: Contract Formation', 'Demo: Cell Biology']

const format = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function EnergyCheckIn() {
  const [energy, setEnergy] = useState('Low')
  const [preset, setPreset] = useState<Preset>('50s')
  const [secondsLeft, setSecondsLeft] = useState(SECONDS['50s'])
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(0)
  const [rewardOpen, setRewardOpen] = useState(false)

  const choosePreset = (p: Preset) => {
    setPreset(p)
    setSecondsLeft(SECONDS[p])
    setRunning(false)
  }

  const selectEnergy = (l: Level) => {
    setEnergy(l.id)
    choosePreset(l.preset)
  }

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (running && secondsLeft <= 0) {
      setRunning(false)
      setCompleted((c) => c + 1)
    }
  }, [running, secondsLeft])

  useEffect(() => {
    if (completed > 0 && completed % 4 === 0) setRewardOpen(true)
  }, [completed])

  const startLabel = running ? 'Pause' : secondsLeft < SECONDS[preset] ? 'Resume' : 'Start sprint'

  return (
    <>
      <div className="step-label">Step 1</div>
      <h2 className="section-title">Tap your energy</h2>
      <p className="sub-text">No wrong answer. Pick what’s true today and we’ll size your first move to match.</p>

      <div className="energy-cards">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`energy-card${energy === l.id ? ' active' : ''}`}
            aria-pressed={energy === l.id}
            onClick={() => selectEnergy(l)}
          >
            <div className="icon">{l.icon}</div>
            <div className="title">{l.id}</div>
            <div className="desc">{l.desc}</div>
          </button>
        ))}
      </div>

      <div className="step-label gap">Step 2</div>
      <h2 className="section-title">Sprint challenge</h2>
      <select className="material-selector" aria-label="Choose material">
        {MATERIALS.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>

      <div className="card timer">
        <div className="clock" role="timer">
          {format(Math.max(secondsLeft, 0))}
        </div>
        <div className="chips">
          {CHIPS.map(([p, label]) => (
            <button
              key={p}
              type="button"
              className={`chip${preset === p ? ' active' : ''}`}
              aria-pressed={preset === p}
              onClick={() => choosePreset(p)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="actions">
          <button type="button" className="btn-primary" onClick={() => setRunning(!running)}>
            {startLabel}
          </button>
          <button type="button" className="btn-secondary" onClick={() => choosePreset(preset)}>
            Reset
          </button>
        </div>
        <p className="progress-pill" role="status">
          {rewardOpen ? 'Surprise unlocked!' : `${4 - (completed % 4)} more until a surprise`}
        </p>
      </div>

      {rewardOpen && (
        <div className="reward" role="dialog" aria-label="Surprise unlocked">
          <div className="big">🎁</div>
          <h3>Surprise unlocked!</h3>
          <p>Four sprints done, all in small steps. That counts.</p>
          <button type="button" className="btn-primary" onClick={() => setRewardOpen(false)}>
            Collect
          </button>
        </div>
      )}
    </>
  )
}