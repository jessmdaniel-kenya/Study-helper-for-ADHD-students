import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { supabase } from './supabase'
import type { Hit, Plan, Question, Result, Reward } from './types'

const LEVELS = [
  { id: 'low', label: 'Low', start: 300 },
  { id: 'medium', label: 'Medium', start: 1200 },
  { id: 'charged', label: 'Charged up', start: 1200 },
]

async function ai(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession()
  const r = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify(body),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error || 'The AI could not help right now. Try again.')
  return j
}

// ts_headline returns <b>…</b>; render it as <mark> without raw HTML.
const mark = (s: string) =>
  s.split(/(<b>.*?<\/b>)/g).map((p, i) =>
    p.startsWith('<b>') ? <mark key={i}>{p.slice(3, -4)}</mark> : p
  )

function Timer({ start, onFinish }: { start: number; onFinish: () => void }) {
  const [left, setLeft] = useState(start)
  const [on, setOn] = useState(false)
  useEffect(() => { setLeft(start); setOn(false) }, [start])
  useEffect(() => {
    if (!on) return
    const t = setInterval(() => setLeft((l) => l - 1), 1000)
    return () => clearInterval(t)
  }, [on])
  useEffect(() => {
    if (on && left <= 0) { setOn(false); onFinish() }
  }, [left, on])
  const pick = (s: number) => { setLeft(s); setOn(false) }
  const mm = String(Math.floor(Math.max(left, 0) / 60)).padStart(2, '0')
  const ss = String(Math.max(left, 0) % 60).padStart(2, '0')
  return (
    <div className="card">
      <div className="clock" role="timer">{mm}:{ss}</div>
      <div className="row">
        {([[50, '50 sec'], [300, '5 min'], [1200, '20 min']] as [number, string][]).map(([s, l]) => (
          <button key={s} onClick={() => pick(s)}>{l}</button>
        ))}
        <button className="primary" onClick={() => setOn(!on)}>{on ? 'Pause' : 'Start'}</button>
      </div>
    </div>
  )
}

function Quiz({ qs, notes, onFinish }: { qs: Question[]; notes: string; onFinish: () => void }) {
  const [i, setI] = useState(0)
  const [text, setText] = useState('')
  const [res, setRes] = useState<Result | null>(null)
  if (i >= qs.length) return <p>Quiz done. Nice work.</p>
  const q = qs[i]

  async function check(choice?: string) {
    if (q.type === 'mcq') {
      setRes({ verdict: choice === q.answer ? 'Got it.' : 'Not yet.', best: q.answer })
      return
    }
    setRes({ busy: true })
    try {
      const g = await ai({ mode: 'grade', notes, question: q.prompt, reference: q.answer, answer: text })
      setRes({ verdict: g.verdict, feedback: g.feedback, best: g.best_fit })
    } catch {
      setRes({ verdict: 'Not yet.', feedback: 'We could not grade that. Compare it with the answer below.', best: q.answer })
    }
  }

  function next() {
    setRes(null)
    setText('')
    setI(i + 1)
    if (i + 1 >= qs.length) onFinish()
  }

  return (
    <div className="card">
      <p><strong>{q.prompt}</strong></p>
      {q.type === 'mcq' ? (
        <div className="row">
          {(q.options ?? []).map((o) => (
            <button key={o} disabled={!!res} onClick={() => check(o)}>{o}</button>
          ))}
        </div>
      ) : (
        <>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Answer in your own words" disabled={!!res} />
          {!res && <button className="primary" disabled={!text.trim()} onClick={() => check()}>Check my answer</button>}
        </>
      )}
      {res && !res.busy && (
        <div className="note">
          <p><strong>{res.verdict}</strong> {res.feedback}</p>
          <p>Best-fit answer: {res.best}</p>
          <p>{q.explanation}</p>
          <p className="hint">From your notes: “{q.quote}”</p>
          <button className="primary" onClick={next}>{i + 1 < qs.length ? 'Next question' : 'Finish'}</button>
        </div>
      )}
      {res?.busy && <p>Checking…</p>}
    </div>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [energy, setEnergy] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [plan, setPlan] = useState<Plan | null>(null)
  const [done, setDone] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [progress, setProgress] = useState(4)
  const [reward, setReward] = useState<Reward | null>(null)
  const [term, setTerm] = useState('')
  const [hits, setHits] = useState<Hit[] | null>(null)
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fs-prefs') ?? '') || { dys: false, calm: false } }
    catch { return { dys: false, calm: false } }
  })

  useEffect(() => {
    document.body.className = `${prefs.dys ? 'dys' : ''} ${prefs.calm ? 'calm' : ''}`
    localStorage.setItem('fs-prefs', JSON.stringify(prefs))
  }, [prefs])

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) await supabase.auth.signInAnonymously()
      const { count } = await supabase.from('completions').select('*', { count: 'exact', head: true })
      setProgress(4 - ((count || 0) % 4))
      setReady(true)
    })()
  }, [])

  async function complete(kind: string) {
    if (!plan) return
    const { data } = await supabase.rpc('record_completion', { p_kind: kind, p_ref: plan.id })
    if (!data) return
    setProgress(data.reward ? 4 : data.to_next)
    if (data.reward) setReward(data.reward)
  }

  async function makePlan() {
    setBusy(true); setErr(''); setPlan(null); setDone([])
    try {
      await supabase.from('materials').insert({ title: title || 'Untitled', full_text: notes })
      const r = await ai({ mode: 'plan', notes, energy })
      setPlan({ id: crypto.randomUUID(), ...r })
    } catch (e) { setErr(e instanceof Error ? e.message : 'Something went wrong. Try again.') }
    setBusy(false)
  }

  function tick(n: number) {
    if (!plan) return
    const next = done.includes(n) ? done.filter((x) => x !== n) : [...done, n]
    setDone(next)
    if (next.length === plan.steps.length) complete('steps')
  }

  async function search() {
    const { data } = await supabase.rpc('search_materials', { term })
    setHits(data || [])
  }

  function readFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    f.text().then((t) => { setNotes(t); if (!title) setTitle(f.name.replace(/\.txt$/i, '')) })
  }

  if (!ready) return <main><p>Loading…</p></main>
  const level = LEVELS.find((l) => l.id === energy) ?? LEVELS[1]

  return (
    <main>
      <header>
        <h1>FlowState</h1>
        <div>
          <label><input type="checkbox" checked={prefs.dys} onChange={(e) => setPrefs({ ...prefs, dys: e.target.checked })} /> Easy-read font</label>
          <label><input type="checkbox" checked={prefs.calm} onChange={(e) => setPrefs({ ...prefs, calm: e.target.checked })} /> No animation</label>
        </div>
      </header>
      <p className="progress" role="status">{progress} more until a surprise</p>

      <section>
        <h2>How much energy do you have today?</h2>
        <div className="row">
          {LEVELS.map((l) => (
            <button key={l.id} aria-pressed={energy === l.id} onClick={() => setEnergy(l.id)}>{l.label}</button>
          ))}
        </div>
      </section>

      <section>
        <h2>Add your notes</h2>
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="Paste your notes or an assignment here" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="row">
          <input type="file" accept=".txt" onChange={readFile} aria-label="Upload a text file" />
          <button className="primary" disabled={!energy || notes.trim().length < 200 || busy} onClick={makePlan}>
            {busy ? 'Making your plan…' : 'Make my plan'}
          </button>
        </div>
        {(!energy || notes.trim().length < 200) && <p className="hint">Pick your energy and add a few paragraphs of notes to start.</p>}
        {err && <p className="error" role="alert">{err}</p>}
      </section>

      {plan && (
        <>
          <section>
            <h2>Small steps</h2>
            <ol className="steps">
              {plan.steps.map((s, n) => (
                <li key={n}>
                  <label><input type="checkbox" checked={done.includes(n)} onChange={() => tick(n)} /> {s.text} <span className="hint">({s.minutes} min)</span></label>
                </li>
              ))}
            </ol>
          </section>
          <section>
            <h2>Timer</h2>
            <Timer start={level.start} onFinish={() => complete('timer')} />
          </section>
          <section>
            <h2>Questions</h2>
            <Quiz qs={plan.questions} notes={notes} onFinish={() => complete('quiz')} />
          </section>
        </>
      )}

      <section>
        <h2>Search your notes</h2>
        <div className="row">
          <input type="text" placeholder="Type any word" value={term} onChange={(e) => setTerm(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && term) search() }} />
          <button disabled={!term} onClick={search}>Search</button>
        </div>
        {hits && hits.length === 0 && <p>No notes contain that word.</p>}
        {hits && hits.map((h) => (
          <div className="card" key={h.id} style={{ marginTop: '0.5rem' }}>
            <strong>{h.title}</strong>
            <p>{mark(h.snippet)}</p>
          </div>
        ))}
      </section>

      {reward && (
        <div className="reward" role="status">
          <div className="big">{reward.emoji}</div>
          <p><strong>You found: {reward.name}</strong></p>
          <button onClick={() => setReward(null)}>Close</button>
        </div>
      )}
    </main>
  )
}