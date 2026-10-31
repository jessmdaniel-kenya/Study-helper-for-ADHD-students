// src/pages/Home.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppStore } from '../stores/useAppStore'
import { supabase } from '../lib/supabase'

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

    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccessMsg('Account created! Check your email for confirmation.')
    }
  }

  return (
    <div className="stack" style={{ gap: '24px' }}>
      {/* Exam Alert Banner */}
      <div className="card stack" style={{ background: 'linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,209,102,0.1))', border: '1px solid rgba(255,107,107,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="badge" style={{ background: 'rgba(255,107,107,0.2)', color: '#ff6b6b', margin: 0 }}>🚨 CAT EXAM TOMORROW</div>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>FlowState Engine Active</span>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0' }}>Time to Lock In Your Mastery</h2>
        <p className="sub-text">Your study materials are parsed sentence-by-sentence into high-yield MCQs, flashcards, and free-response synthesis items.</p>
        
        <div className="row" style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate('/study')}>
            Launch Study Engine ⚡
          </button>
          <button className="btn-secondary" onClick={() => navigate('/resources')}>
            View Study Desk ({materials.length} Materials)
          </button>
        </div>
      </div>

      {/* Embedded Sign Up / Sign In Portal Card */}
      <div className="card stack" style={{ border: '1px solid var(--a1)', background: 'rgba(0,215,255,0.02)' }}>
        <div className="badge">STUDENT PORTAL 🔑</div>
        <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Sign Up or Sign In to Sync Notes</h3>
        <p className="sub-text">Create an account right here to secure your study sessions and access them across devices.</p>

        {errorMsg && <div className="err" style={{ marginTop: '8px' }}>{errorMsg}</div>}
        {successMsg && <div style={{ color: 'var(--a3)', fontSize: '14px', marginTop: '8px' }}>{successMsg}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          <div>
            <label className="hint" style={{ display: 'block', marginBottom: '4px' }}>Email Address</label>
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
            <label className="hint" style={{ display: 'block', marginBottom: '4px' }}>Password</label>
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

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Processing...' : 'Sign In ⚡'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleSignUp} disabled={loading} style={{ flex: 1 }}>
              Create Account (Sign Up)
            </button>
          </div>
        </form>
      </div>

      {/* Quick Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <div className="card stack">
          <div className="badge">📚 STUDY DESK</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Uploaded Resources</h3>
          <p className="sub-text">Manage PDFs, Word notes, and text files ready for exhaustive parsing.</p>
          <Link to="/resources" className="btn-secondary" style={{ textAlign: 'center', textDecoration: 'none', marginTop: 'auto' }}>
            Open Study Desk →
          </Link>
        </div>

        <div className="card stack">
          <div className="badge">🌳 PROGRESS & FOCUS</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Active Recall Tree</h3>
          <p className="sub-text">Build experience points and grow your seedling into a mighty tree as you test your knowledge.</p>
          <Link to="/study" className="btn-secondary" style={{ textAlign: 'center', textDecoration: 'none', marginTop: 'auto' }}>
            Start Session →
          </Link>
        </div>
      </div>
    </div>
  )
}