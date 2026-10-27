import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Question {
  id: number
  question: string
  subtext: string
  options: {
    label: string
    desc: string
    energyMatch: 'Low' | 'Medium' | 'Charged up'
  }[]
}

const FLOW_QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'How is your mental battery right now?',
    subtext: 'Be real with where you are. There is no wrong answer.',
    options: [
      { label: '🪫 Low battery / Brain fog', desc: 'Starting feels heavy, small steps only', energyMatch: 'Low' },
      { label: '🔋 Steady / Grounded', desc: 'Ready for a focused 20-minute chunk', energyMatch: 'Medium' },
      { label: '⚡ Hyperfocus / Buzzing', desc: 'High energy, ready to dive deep', energyMatch: 'Charged up' },
    ],
  },
  {
    id: 2,
    question: 'What kind of sensory environment helps you most today?',
    subtext: 'Your nervous system decides the rules.',
    options: [
      { label: '🔇 Total quiet & muted screen', desc: 'Low stimulation, minimal visuals', energyMatch: 'Low' },
      { label: '🎧 Lo-fi / background hum', desc: 'Gentle rhythm to anchor focus', energyMatch: 'Medium' },
      { label: '🔥 Fast-paced race with the clock', desc: 'Dopamine-driven sprint against time', energyMatch: 'Charged up' },
    ],
  },
  {
    id: 3,
    question: 'What is your main study goal for this session?',
    subtext: 'Pick the bite-sized win that feels safest.',
    options: [
      { label: 'Just open one note and read 2 lines', desc: 'Zero pressure warm-up teaser', energyMatch: 'Low' },
      { label: 'Review flashcards on one topic', desc: 'Clear boundaries, structured questions', energyMatch: 'Medium' },
      { label: 'Break down an overwhelming assignment', desc: 'Map out the full project into mini-steps', energyMatch: 'Charged up' },
    ],
  },
]

export default function Quiz() {
  const navigate = useNavigate()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState<{
    profile: string
    recommendedEnergy: 'Low' | 'Medium' | 'Charged up'
    recommendation: string
    timerSuggestion: string
  } | null>(null)

  const handleSelectOption = (energyMatch: 'Low' | 'Medium' | 'Charged up') => {
    const updated = [...answers, energyMatch]
    setAnswers(updated)

    if (currentIdx + 1 < FLOW_QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1)
    } else {
      // Calculate dominant energy style
      const lowCount = updated.filter((a) => a === 'Low').length
      const chargedCount = updated.filter((a) => a === 'Charged up').length

      if (lowCount >= 2) {
        setResult({
          profile: 'Gentle Warm-Up Mode',
          recommendedEnergy: 'Low',
          recommendation: 'Start tiny. A 50-second teaser or 5-minute glance with muted sensory settings will bypass task-paralysis.',
          timerSuggestion: '50-second or 5-minute teaser sprint',
        })
      } else if (chargedCount >= 2) {
        setResult({
          profile: 'High-Drive Momentum',
          recommendedEnergy: 'Charged up',
          recommendation: 'Ride the wave before the dopamine dips. Use an open count-up or a 30-minute sprint to tackle heavy notes.',
          timerSuggestion: '30-minute deep dive sprint',
        })
      } else {
        setResult({
          profile: 'Structured Rhythm',
          recommendedEnergy: 'Medium',
          recommendation: 'The sweet spot. A predictable 20-minute sprint with 5-minute breaks will keep you in steady flow without burnout.',
          timerSuggestion: '20-minute classic sprint',
        })
      }
    }
  }

  const resetQuiz = () => {
    setCurrentIdx(0)
    setAnswers([])
    setResult(null)
  }

  const q = FLOW_QUESTIONS[currentIdx]

  return (
    <>
      <div className="step-label">DISCOVERY QUIZ</div>
      <h2 className="page-title">Find Your Flow</h2>
      <p className="page-sub">Three quick questions to calibrate your environment to your brain’s frequency today.</p>

      {!result ? (
        <div className="card stack">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="hint">Question {currentIdx + 1} of {FLOW_QUESTIONS.length}</span>
            <span className="subj-tag">Calibration</span>
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0' }}>{q.question}</h3>
          <p className="hint" style={{ marginBottom: '16px' }}>{q.subtext}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                className="energy-card"
                style={{ textAlign: 'left', alignItems: 'flex-start', padding: '16px 20px', cursor: 'pointer' }}
                onClick={() => handleSelectOption(opt.energyMatch)}
              >
                <span className="energy-label" style={{ fontSize: '16px' }}>{opt.label}</span>
                <span className="energy-desc" style={{ fontSize: '13px', marginTop: '4px' }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="card stack">
          <div className="badge">⚡ YOUR FLOW PROFILE</div>
          <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '32px', letterSpacing: '1.5px', color: 'var(--a1)', margin: '8px 0 4px' }}>
            {result.profile}
          </h3>
          <p className="sub-text" style={{ marginBottom: '12px' }}>{result.recommendation}</p>

          <div className="resource-card" style={{ marginTop: 0, borderLeft: '4px solid var(--a3)' }}>
            <div className="res-title">Suggested Entry Point:</div>
            <p className="snippet">{result.timerSuggestion}</p>
          </div>

          <div className="row" style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/sprint')}
            >
              Start Sprint ({result.recommendedEnergy}) ⚡
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={resetQuiz}
            >
              Retake Quiz
            </button>
          </div>
        </div>
      )}
    </>
  )
}