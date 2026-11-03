import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { createMaterial } from '../lib/materials'
import { countCompletion, extractText, gradeAnswer, makeQuiz } from '../lib/quizPageApi'
import type { Completion, QuizQuestion } from '../lib/quizPageApi'

type Stage = 'setup' | 'quiz' | 'done'
type Reveal = { ok: boolean; verdict: string; feedback?: string; best: string }

const COUNTS = [5, 8, 10]

export default function Quiz() {
  const [stage, setStage] = useState<Stage>('setup')
  const notes = useAppStore((state) => state.materials)
  const addMaterial = useAppStore((state) => state.addMaterial)
  const [pick, setPick] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [completionMaterialId, setCompletionMaterialId] = useState<string | null>(null)
  const [count, setCount] = useState(8)
  const [save, setSave] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [hint, setHint] = useState('')
  const [source, setSource] = useState('')
  const [queue, setQueue] = useState<QuizQuestion[]>([])
  const [round, setRound] = useState(1)
  const [idx, setIdx] = useState(0)
  const [choice, setChoice] = useState<string | null>(null)
  const [written, setWritten] = useState('')
  const [sure, setSure] = useState(true)
  const [reveal, setReveal] = useState<Reveal | null>(null)
  const [checking, setChecking] = useState(false)
  const [review, setReview] = useState<QuizQuestion[]>([])
  const [firstTry, setFirstTry] = useState(0)
  const [total, setTotal] = useState(0)
  const [progress, setProgress] = useState<number | null>(null)
  const [reward, setReward] = useState<Completion['reward'] | null>(null)

  useEffect(() => {
    (async () => {
      await ensureSession()
      const { data } = await supabase.from('materials').select('id, title, full_text').limit(30)
      if (data) setNotes(data as Note[])
    })()
  }, [])

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setErr('')
    try {
      const t = await extractText(f)
      setText(t)
      setFileName(f.name)
      setPick('')
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'We couldn’t read that file.')
    }
  }

  function choose(id: string) {
    setPick(id)
    const n = notes.find((x) => x.id === id)
    if (n) { setText(n.full_text); setTitle(n.title); setFileName('') }
  }

  function resetAnswer() {
    setChoice(null); setWritten(''); setSure(true); setReveal(null)
  }

  async function make() {
    setBusy(true); setErr(''); setHint('')
    try {
      const body = text.trim()
      const r = await makeQuiz(body, count)
      let h = r.truncated ? 'This is a long document, so the quiz uses the first part of it. ' : ''
      if (save && !pick) {
        const { error } = await supabase.from('materials').insert({ title: title || 'Untitled', full_text: body })
        if (error) h += 'Your quiz is ready, but we couldn’t save the notes.'
      }
      setHint(h)
      setSource(body)
      setQueue(r.questions)
      setTotal(r.questions.length)
      setRound(1); setIdx(0); setReview([]); setFirstTry(0)
      quizId.current = crypto.randomUUID()
      resetAnswer()
      setStage('quiz')
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Something went wrong. Try again.')
    }
    setBusy(false)
  }

  const q = queue[idx]

  async function check(picked?: string) {
    if (!q || reveal) return
    let r: Reveal
    if (q.type === 'mcq') {
      const ok = picked === q.answer
      setChoice(picked ?? null)
      r = { ok, verdict: ok ? 'Got it' : 'Not yet', best: q.answer }
    } else {
      setChecking(true)
      try {
        const g = await gradeAnswer(source, q, written)
        r = { ok: g.verdict === 'Got it', verdict: g.verdict, feedback: g.feedback, best: g.best_fit || q.answer }
      } catch {
        r = { ok: false, verdict: 'Not yet', feedback: 'We couldn’t grade that one. Compare it with the answer below.', best: q.answer }
      }
      setChecking(false)
    }
    setReveal(r)
    if (round === 1 && r.ok) setFirstTry((n) => n + 1)
    if (!r.ok || (round === 1 && !sure)) setReview((list) => (list.includes(q) ? list : [...list, q]))
  }

  async function finish() {
    setStage('done')
    const r = await countCompletion('quiz', quizId.current)
    if (r) {
      setProgress(r.to_next)
      if (r.reward) setReward(r.reward)
    }
  }

  function next() {
    resetAnswer()
    if (idx + 1 < queue.length) { setIdx(idx + 1); return }
    if (round === 1 && review.length > 0) {
      setQueue(review); setReview([]); setRound(2); setIdx(0)
      return
    }
    finish()
  }

  function again() {
    setQueue(review); setReview([]); setRound(2); setIdx(0)
    resetAnswer()
    setStage('quiz')
  }

  function restart() {
    setStage('setup'); setText(''); setFileName(''); setPick(''); setTitle(''); setProgress(null)
  }

  if (stage === 'setup') {
    const ready = text.trim().length >= 200
    return (
      <>
        <div className="step-label">Study</div>
        <h2 className="section-title">Make a quiz from your notes</h2>
        <p className="sub-text">Upload a file or paste notes. Every question comes from your own material, and every answer is explained.</p>

        <div className="card stack">
          <label className="hint" htmlFor="quiz-file">Upload a PDF, Word file, TXT or MD</label>
          <input id="quiz-file" type="file" accept=".pdf,.docx,.txt,.md" onChange={onFile} />
          {fileName && <p className="hint">Loaded {fileName} ({text.length.toLocaleString()} characters)</p>}

          {notes.length > 0 && (
            <>
              <label className="hint" htmlFor="quiz-saved">Or pick from your saved notes</label>
              <select id="quiz-saved" className="material-selector" value={pick} onChange={(e) => choose(e.target.value)}>
                <option value="">Choose…</option>
                {notes.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
              </select>
            </>
          )}

          <input className="field" type="text" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea
            className="field"
            placeholder="Or paste your notes here…"
            value={text}
            onChange={(e) => { setText(e.target.value); setPick(''); setFileName('') }}
          />

          <div className="chips left" role="group" aria-label="Number of questions">
            {COUNTS.map((n) => (
              <button key={n} type="button" className={`chip${count === n ? ' active' : ''}`} aria-pressed={count === n} onClick={() => setCount(n)}>
                {n} questions
              </button>
            ))}
          </div>
          <label className="hint">
            <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} /> Save to my notes so search can find it
          </label>

          <button type="button" className="btn-primary" disabled={!ready || busy} onClick={make}>
            {busy ? 'Reading your notes…' : 'Make my quiz'}
          </button>
          {!ready && <p className="hint">Add at least a few paragraphs (200 characters) to start.</p>}
          {err && <p className="err" role="alert">{err}</p>}
        </div>
      </>
    )
  }

  if (stage === 'quiz' && q) {
    return (
      <>
        <div className="step-label">{round === 1 ? 'Quiz' : 'Review round'}</div>
        <h2 className="section-title">Question {idx + 1} of {queue.length}</h2>
        <div className="qbar"><div className="qfill" style={{ width: `${(idx / queue.length) * 100}%` }} /></div>
        {hint && <p className="hint">{hint}</p>}

        <div className="card stack">
          <p className="qtext">{q.prompt}</p>

          {!reveal && (
            <div className="chips left" role="group" aria-label="How sure are you?">
              <button type="button" className={`chip${sure ? ' active' : ''}`} aria-pressed={sure} onClick={() => setSure(true)}>Sure</button>
              <button type="button" className={`chip${!sure ? ' active' : ''}`} aria-pressed={!sure} onClick={() => setSure(false)}>Guessing</button>
            </div>
          )}

          {q.type === 'mcq' ? (
            <div className="opts">
              {(q.options ?? []).map((o) => {
                const state = reveal ? (o === q.answer ? ' right' : o === choice ? ' wrong' : '') : ''
                return (
                  <button key={o} type="button" className={`opt${state}`} disabled={!!reveal} onClick={() => check(o)}>{o}</button>
                )
              })}
            </div>
          ) : (
            <>
              <textarea
                className="field"
                placeholder="Answer in your own words…"
                value={written}
                disabled={!!reveal || checking}
                onChange={(e) => setWritten(e.target.value)}
              />
              {!reveal && (
                <button type="button" className="btn-primary" disabled={!written.trim() || checking} onClick={() => check()}>
                  {checking ? 'Checking…' : 'Check my answer'}
                </button>
              )}
            </>
          )}

          {reveal && (
            <div className={`reveal ${reveal.ok ? 'ok' : 'miss'}`}>
              <p className="verdict">{reveal.verdict}</p>
              {reveal.feedback && <p>{reveal.feedback}</p>}
              {q.type === 'written' && <p><strong>Best answer:</strong> {reveal.best}</p>}
              <p>{q.explanation}</p>
              <p className="hint">From your notes: “{q.quote}”</p>
              {reveal.ok && !sure && round === 1 && <p className="hint">You marked this as a guess, so it comes back once more.</p>}
              <button type="button" className="btn-primary" onClick={next}>
                {idx + 1 < queue.length ? 'Next question' : 'Finish'}
              </button>
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="step-label">Done</div>
      <h2 className="section-title">Nice work</h2>
      <div className="card stack">
        <p className="qtext">{firstTry} of {total} right on the first try.</p>
        <p className="sub-text">
          {review.length > 0
            ? `${review.length} still worth another look. That’s normal, and they’re the ones that stick.`
            : 'Everything landed. Pick a new document when you’re ready.'}
        </p>
        {progress !== null && <p className="progress-pill" role="status">{progress} more until a surprise</p>}
        <div className="actions">
          {review.length > 0 && <button type="button" className="btn-primary" onClick={again}>Try the tricky ones again</button>}
          <button type="button" className="btn-secondary" onClick={restart}>New document</button>
        </div>
      </div>

      {reward && (
        <div className="reward" role="dialog" aria-label="Surprise unlocked">
          <div className="big">{reward.emoji ?? '🎁'}</div>
          <h3>Surprise unlocked{reward.name ? `: ${reward.name}` : '!'}</h3>
          <button type="button" className="btn-primary" onClick={() => setReward(null)}>Collect</button>
        </div>
      )}
    </>
  )
}