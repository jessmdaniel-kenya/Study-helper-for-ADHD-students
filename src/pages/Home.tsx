// src/pages/Home.tsx
import { useNavigate, Link } from 'react-router-dom'
import { useAppStore } from '../stores/useAppStore'
import { useSession } from '../hooks/useSession'
import { AlertTriangle, ArrowRight, BookOpen, KeyRound, Sprout, Zap } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const { materials } = useAppStore()
  const { session, isGuest } = useSession()

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

      {/* Guests get a gentle nudge to keep their work; account holders see nothing here. */}
      {(isGuest || !session) && (
        <section className="card home-save-card">
          <div className="stack">
            <div className="badge"><KeyRound size={15} aria-hidden="true" /> {isGuest ? 'GUEST DESK' : 'STUDENT PORTAL'}</div>
            <h2 className="section-title">{isGuest ? 'Keep your progress safe' : 'Sign in to sync notes'}</h2>
            <p className="sub-text">
              {isGuest
                ? 'You are studying as a guest. Add an email to keep these notes and sync them across devices.'
                : 'Create an account or sign in to keep notes and progress across devices.'}
            </p>
          </div>
          <div className="row form-actions">
            <Link to="/start?mode=signup" className="btn-primary card-link">
              {isGuest ? 'Save my progress' : 'Create account'} <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to="/start?mode=signin" className="btn-secondary card-link">Sign in</Link>
          </div>
        </section>
      )}

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