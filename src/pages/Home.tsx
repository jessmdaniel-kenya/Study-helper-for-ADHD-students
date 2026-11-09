// src/pages/Home.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppStore } from '../stores/useAppStore'
import { supabase } from '../lib/supabase'
import { AlertTriangle, ArrowRight, BookOpen, KeyRound, Sprout, Zap } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const { materials } = useAppStore()

  // Inline auth state for home page
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccessMsg('Signed in successfully!')
      setTimeout(() => navigate('/study'), 1000)
    }
  }

  const handleSignUp = async () => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      setLoading(false)
      setErrorMsg(`Could not check your study session: ${sessionError.message}`)
      return
    }

    const { error } = session?.user.is_anonymous
      ? await supabase.auth.updateUser({ email, password })
      : await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccessMsg('Account linked. Check your email to confirm it and enable cross-device sync.')
    }
  }

  return (
    <div className="page stack">
      {/* Exam Alert Banner */}
      <section className="card stack home-feature">
        <div className="home-feature-meta">
          <div className="badge badge-alert"><AlertTriangle size={15} aria-hidden="true" /> CAT EXAM PREP</div>
          <span className="hint">FlowState study space</span>
        </div>
        <h1 className="home-title">Build confidence, one study session at a time</h1>
        <p className="sub-text">Your study materials are parsed sentence-by-sentence into high-yield MCQs, flashcards, and free-response synthesis items.</p>
        
        <div className="row page-actions">
          <button className="btn-primary" onClick={() => navigate('/study')}>
            <Zap size={17} aria-hidden="true" /> Start studying
          </button>
          <button className="btn-secondary" onClick={() => navigate('/resources')}>
            <BookOpen size={17} aria-hidden="true" /> Study desk <span className="count-pill">{materials.length}</span>
          </button>
        </div>
      </section>

      {/* Embedded Sign Up / Sign In Portal Card */}
      <section className="card stack">
        <div className="badge"><KeyRound size={15} aria-hidden="true" /> STUDENT PORTAL</div>
        <h2 className="section-title">Sign up or sign in to sync notes</h2>
        <p className="sub-text">You can study and use shared NVIDIA AI as a guest. Create or sign in to link your current study space and sync notes across devices.</p>

        {errorMsg && <div className="err" style={{ marginTop: '8px' }}>{errorMsg}</div>}
        {successMsg && <div style={{ color: 'var(--a3)', fontSize: '14px', marginTop: '8px' }}>{successMsg}</div>}

        <form onSubmit={handleLogin} className="form-stack">
          <div>
            <label className="hint form-label">Email Address</label>
            <input 
              type="email" 
              className="field" 
              placeholder="student@university.ac.ke"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label className="hint form-label">Password</label>
            <input 
              type="password" 
              className="field" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div className="row form-actions">
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Processing...' : 'Sign in'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleSignUp} disabled={loading} style={{ flex: 1 }}>
              Create Account (Sign Up)
            </button>
          </div>
        </form>
      </section>

      {/* Quick Dashboard Grid */}
      <div className="dashboard-grid">
        <section className="card stack dashboard-card">
          <div className="badge"><BookOpen size={15} aria-hidden="true" /> STUDY DESK</div>
          <h2 className="card-title">Uploaded resources</h2>
          <p className="sub-text">Manage PDFs, Word notes, and text files ready for exhaustive parsing.</p>
          <Link to="/resources" className="btn-secondary card-link">
            Open study desk <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>

        <section className="card stack dashboard-card">
          <div className="badge"><Sprout size={15} aria-hidden="true" /> PROGRESS & FOCUS</div>
          <h2 className="card-title">Active recall</h2>
          <p className="sub-text">Build experience points and grow your seedling into a mighty tree as you test your knowledge.</p>
          <Link to="/study" className="btn-secondary card-link">
            Start a session <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  )
}