// src/App.tsx
import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Resources from './pages/Resources'
import Study from './pages/Study'
import Game from './pages/Game'
import EnergyCheckin from './pages/EnergyCheckIn'
import Feed from './pages/Feed'

export default function App() {
  return (
    <HashRouter>
      <div style={{ 
        minHeight: '100vh', 
        height: '100%',
        background: '#0f1420', 
        color: '#fff', 
        padding: '24px 16px',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '80px' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#00d7ff' }}>FlowState CAT Prep</h1>
            <nav style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Home & Sign Up</Link>
              <Link to="/resources" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Resources</Link>
              <Link to="/study" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Study</Link>
              <Link to="/game" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Arcade</Link>
              <Link to="/energy" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Energy</Link>
              <Link to="/feed" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Feed</Link>
            </nav>
          </header>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/study" element={<Study />} />
            <Route path="/game" element={<Game />} />
            <Route path="/energy" element={<EnergyCheckin />} />
            <Route path="/feed" element={<Feed />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  )
}