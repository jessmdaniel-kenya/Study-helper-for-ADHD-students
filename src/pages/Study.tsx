// src/pages/Study.tsx
import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppStore } from '../stores/useAppStore'
import { gradeAnswer, makeQuiz, questionCountForMaterial } from '../lib/quizApi'
import { recordStudyCompletion } from '../lib/gameProgress'
import type { QuizQuestion, QuizType } from '../lib/quizApi'
import { BookOpen, Check, FileText, Leaf, Sprout, TreePine } from 'lucide-react'

const TREE_STAGES = [
  { label: 'Seedling', Icon: Sprout },
  { label: 'Growing sprout', Icon: Sprout },
  { label: 'Growing fern', Icon: Leaf },
  { label: 'Mighty tree', Icon: TreePine },
]
type Reveal = { ok: boolean; verdict: string; feedback?: string; best: string }

export default function Study() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { materials } = useAppStore()

  const selectedMatId = searchParams.get('materialId') || materials[0]?.id || ''

  const activeMaterial = materials.find((m) => m.id === selectedMatId)

  const [phase, setPhase] = useState<'setup' | 'studying'>('setup')
  const [qTypes, setQTypes] = useState({ flashcard: true, mcq: true, written: true })
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [source, setSource] = useState('')
  const [round, setRound] = useState(1)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [writtenAnswer, setWrittenAnswer] = useState('')
  const [sure, setSure] = useState(true)
  const [reveal, setReveal] = useState<Reveal | null>(null)
  const [busy, setBusy] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0 })
  const [checking, setChecking] = useState(false)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')
  const [firstTry, setFirstTry] = useState(0)
  const [total, setTotal] = useState(0)
  const [treeExp, setTreeExp] = useState(0)
  const review = useRef<QuizQuestion[]>([]) // questions that come back once more
  const completionRecorded = useRef(false)
  const seenQuotes = useRef(new Set<string>())

  if (!activeMaterial) {
    return (
      <div className="card stack empty-state">
        <h2 className="section-title">No Material Found</h2>
        <p className="sub-text">Go to your Study Desk to pick or upload a file first.</p>
        <button className="btn-primary" onClick={() => navigate('/resources')}>Go to Study Desk</button>
      </div>
    )
  }

  const clearAnswer = () => {
    setSelectedOption(null)
    setWrittenAnswer('')
    setSure(true)
    setReveal(null)
    setErr('')
  }

  async function handleStartStudy() {
    if (!activeMaterial) return
    const types = (Object.keys(qTypes) as QuizType[]).filter((t) => qTypes[t])
    if (types.length === 0) { setErr('Pick at least one format.'); return }
    if (activeMaterial.content.trim().length < 200) {
      setErr('This material has too little text to make questions from. Add more notes or a fuller file.')
      return
    }
    setBusy(true)
    setErr('')
    setNote('')
    setGenerationProgress({ completed: 0, total: 0 })
    try {
      const r = await makeQuiz(
        activeMaterial.content,
        types,
        (completed, total) => setGenerationProgress({ completed, total }),
        [...seenQuotes.current],
      )
      r.questions.forEach((question) => seenQuotes.current.add(question.quote))
      const messages = []
      if (r.truncated) messages.push(`Created ${r.questions.length} of about ${r.target} planned questions.`)
      messages.push(...r.warnings)
      setNote(messages.join(' '))
      setSource(activeMaterial.content)
      setQuestions(r.questions)
      setTotal(r.questions.length)
      review.current = []
      setRound(1)
      setCurrentIndex(0)
      setFirstTry(0)
      setTreeExp(0)
      completionRecorded.current = false
      clearAnswer()
      setPhase('studying')
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Something went wrong. Try again.')
    }
    setBusy(false)
  }

  const q = questions[currentIndex]
  const treeLevel = Math.min(Math.floor(treeExp / 4), TREE_STAGES.length - 1)
  const TreeIcon = TREE_STAGES[treeLevel].Icon
  const isComplete = phase === 'studying' && currentIndex >= questions.length

  // Every answer grows the tree. Misses and guesses come back once.
  function record(ok: boolean, isSure: boolean) {
    setTreeExp((e) => e + 1)
    if (round === 1 && ok) setFirstTry((n) => n + 1)
    if ((!ok || (round === 1 && !isSure)) && !review.current.includes(q)) {
      review.current = [...review.current, q]
    }
  }

  async function submit() {
    if (!q || reveal) return
    let r: Reveal
    if (q.type === 'mcq') {
      const ok = selectedOption === q.answer
      r = { ok, verdict: ok ? 'Got it' : 'Not yet', best: q.answer }
    } else {
      setChecking(true)
      try {
        const g = await gradeAnswer(source, q, writtenAnswer)
        r = { ok: g.verdict === 'Got it', verdict: g.verdict, feedback: g.feedback, best: g.best_fit || q.answer }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not grade this answer.'
        setErr(message)
        setReveal({ ok: false, verdict: 'Could not grade this answer', feedback: message, best: q.answer })
        setChecking(false)
        return
      }
      setChecking(false)
    }
    setReveal(r)
    record(r.ok, sure)
  }

  function showCard() {
    setReveal({ ok: true, verdict: '', best: q.answer })
  }

  function rateCard(got: boolean) {
    record(got, true)
    next()
  }

  function next() {
    clearAnswer()
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1)
      return
    }
    if (round === 1 && review.current.length > 0) {
      setQuestions(review.current)
      review.current = []
      setRound(2)
      setCurrentIndex(0)
      return
    }
    if (!completionRecorded.current) {
      completionRecorded.current = true
      try {
        const { unlockedItem } = recordStudyCompletion()
        if (unlockedItem) setNote(`A new Workbench part was unlocked: ${unlockedItem.name}.`)
      } catch (error) {
        setNote(error instanceof Error ? error.message : 'Your session finished, but game progress could not be saved.')
      }
    }
    setCurrentIndex(questions.length)
  }

  function again() {
    setQuestions(review.current)
    review.current = []
    setRound(2)
    setCurrentIndex(0)
    clearAnswer()
  }

  if (phase === 'setup') {
    const chips: [QuizType, string][] = [['flashcard', 'Flashcards'], ['mcq', 'Multiple Choice'], ['written', 'Free Response']]
    return (
      <div className="card stack">
        <div className="badge"><BookOpen size={15} aria-hidden="true" /> STUDY SESSION</div>
        <h2 className="section-title">Ready for Your Exam</h2>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', marginBottom: '8px' }}>
          <p className="hint">Target Material:</p>
          <select
            className="field"
            value={selectedMatId}
            onChange={(e) => {
              seenQuotes.current.clear()
              setSearchParams({ materialId: e.target.value })
            }}
            style={{ marginTop: '8px', fontWeight: 'bold', border: '1px solid var(--border)' }}
          >
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} {m.fileName ? `(${m.fileName})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          <div className="badge">SESSION FORMATS</div>
          <p className="sub-text">Pick what to practise. Every question comes from your document, and every answer is explained.</p>
          <div className="row">
            {chips.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`chip${qTypes[key] ? ' active' : ''}`}
                aria-pressed={qTypes[key]}
                onClick={() => setQTypes((p) => ({ ...p, [key]: !p[key] }))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary" style={{ marginTop: '24px' }} disabled={busy} onClick={handleStartStudy}>
          {busy
            ? `Making questions${generationProgress.total ? `… ${generationProgress.completed}/${generationProgress.total}` : '…'}`
            : seenQuotes.current.size
              ? 'Make next set from unseen notes'
              : `Make about ${questionCountForMaterial(activeMaterial.content)} questions`}
        </button>
        <p className="hint">Question count scales with material size (about 1 per 250 words), up to 100 per study set.</p>
        {seenQuotes.current.size > 0 && <p className="hint">Previously used source passages are skipped when making the next set.</p>}
        {note && <p className="hint" role="status">{note}</p>}
        {err && <p className="err" role="alert">{err}</p>}
      </div>
    )
  }

  if (isComplete) {
    const left = review.current.length
    return (
      <div className="card stack completion-card">
        <div className="growth-icon">
          <TreeIcon size={48} aria-hidden="true" />
        </div>
        <h2 className="section-title">Session Complete!</h2>
        <p className="sub-text">
          {firstTry} of {total} right on the first try, and your progress earned {treeExp} growth points.
          {left > 0 ? ` ${left} still worth another look. That’s normal, and they’re the ones that stick.` : ' Everything landed.'}
        </p>
        <div className="row page-actions">
          {left > 0 && <button className="btn-primary" onClick={again}>Try the tricky ones again</button>}
          <button className="btn-secondary" onClick={() => { review.current = []; setPhase('setup') }}>Make another set from unseen material</button>
          <button className="btn-secondary" onClick={() => navigate('/resources')}>Back to Study Desk</button>
        </div>
      </div>
    )
  }

  if (!q) return null

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="step-label">{round === 1 ? 'QUESTION' : 'REVIEW'} {currentIndex + 1} OF {questions.length}</div>
        <div className="badge growth-badge"><TreeIcon size={16} aria-hidden="true" /> {TREE_STAGES[treeLevel].label} · {treeExp} points</div>
      </div>
      <div className="qbar"><div className="qfill" style={{ width: `${(currentIndex / questions.length) * 100}%` }} /></div>
      {note && <p className="hint">{note}</p>}

      <div className="card stack">
        <h2 className="question-title">{q.prompt}</h2>

        {!reveal && q.type !== 'flashcard' && (
          <div className="chips left" role="group" aria-label="How sure are you?">
            <button type="button" className={`chip${sure ? ' active' : ''}`} aria-pressed={sure} onClick={() => setSure(true)}>Sure</button>
            <button type="button" className={`chip${!sure ? ' active' : ''}`} aria-pressed={!sure} onClick={() => setSure(false)}>Guessing</button>
          </div>
        )}

        {q.type === 'mcq' && (
          <div className="opts">
            {(q.options ?? []).map((opt) => {
              const state = reveal ? (opt === q.answer ? ' right' : opt === selectedOption ? ' wrong' : '') : ''
              return (
                <button
                  key={opt}
                  type="button"
                  className={`opt${state}`}
                  style={!reveal && selectedOption === opt ? { borderColor: 'var(--a1)' } : undefined}
                  disabled={!!reveal}
                  onClick={() => setSelectedOption(opt)}
                >
                  {opt}
                </button>
              )
            })}
            {!reveal && (
              <button className="btn-primary" disabled={!selectedOption} onClick={submit}><Check size={16} aria-hidden="true" /> Submit answer</button>
            )}
          </div>
        )}

        {q.type === 'written' && (
          <>
            <textarea
              className="field"
              placeholder="Answer in your own words…"
              rows={4}
              value={writtenAnswer}
              disabled={!!reveal || checking}
              onChange={(e) => setWrittenAnswer(e.target.value)}
            />
            {!reveal && (
              <button className="btn-primary" disabled={!writtenAnswer.trim() || checking} onClick={submit}>
                {checking ? 'Checking…' : <><Check size={16} aria-hidden="true" /> Check my answer</>}
              </button>
            )}
          </>
        )}

        {q.type === 'flashcard' && !reveal && (
          <button className="btn-primary" onClick={showCard}><FileText size={16} aria-hidden="true" /> Reveal answer</button>
        )}

        {reveal && q.type === 'flashcard' && (
          <div className="reveal ok">
            <p className="hint">Answer</p>
            <p className="answer-text">{q.answer}</p>
            <p>{q.explanation}</p>
            <p className="hint">From your notes: “{q.quote}”</p>
            <div className="row">
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => rateCard(false)}>Review again</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => rateCard(true)}>Got it!</button>
            </div>
          </div>
        )}

        {reveal && q.type !== 'flashcard' && (
          <div className={`reveal ${reveal.ok ? 'ok' : 'miss'}`}>
            <p className="verdict">{reveal.verdict}</p>
            {reveal.feedback && <p>{reveal.feedback}</p>}
            {q.type === 'written' && <p><strong>Best answer:</strong> {reveal.best}</p>}
            <p>{q.explanation}</p>
            <p className="hint">From your notes: “{q.quote}”</p>
            {reveal.ok && !sure && round === 1 && <p className="hint">You marked this as a guess, so it comes back once more.</p>}
            <button className="btn-primary" onClick={next}>
              {currentIndex + 1 < questions.length ? 'Next question' : 'Finish'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
