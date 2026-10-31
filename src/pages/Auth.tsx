// src/pages/Auth.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const navigate = useNavigate()
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
      setSuccessMsg('Logged in successfully! Redirecting...')
      setTimeout(() => navigate('/resources'), 1000)
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
      setSuccessMsg('Check your email for the confirmation link!')
    }
  }

  return (
    <div className="card stack" style={{ maxWidth: '420px', margin: '8vh auto' }}>
      <div className="badge">STUDENT PORTAL 🔑</div>
      <h2 className="section-title">Sign In to Your Desk</h2>
      <p className="sub-text">Access your saved notes and CAT prep sync across devices.</p>

      {errorMsg && <div className="err" style={{ marginTop: '12px' }}>{errorMsg}</div>}
      {successMsg && <div style={{ color: 'var(--a3)', fontSize: '14px', marginTop: '12px' }}>{successMsg}</div>}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
        <div>
          <label className="hint" style={{ display: 'block', marginBottom: '6px' }}>Email Address</label>
          <input 
            type="email5" 
            className="field" 
            placeholder="student@university.ac.ke"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label className="hint" style={{ display: 'block', marginBottom: '6px' }}>Password</label>
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

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
          {loading ? 'Processing...' : 'Sign In ⚡'}
        </button>

        <button type="button" className="btn-secondary" onClick={handleSignUp} disabled={loading}>
          Create New Account
        </button>
      </form>
    </div>
  )
}