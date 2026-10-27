import { useNavigate } from 'react-router-dom'

const TILES = [
  { to: '/quiz', icon: '⚡', title: 'Find your flow', desc: 'Discover your ideal study rhythm & setup' },
  { to: '/sprint', icon: '⏱️', title: 'Sprint challenge', desc: 'Tap your energy and race a timer' },
  { to: '/study', icon: '🧠', title: 'Study', desc: 'Questions made from your own notes' },
  { to: '/game', icon: '🛠️', title: 'Workbench', desc: 'Build things as you finish work' },
  { to: '/resources', icon: '🔎', title: 'Resources & Search', desc: 'Find any word inside your material' },
  { to: '/feed', icon: '💬', title: 'Community', desc: 'Share what works, no judgment' },
]

export default function Home() {
  const go = useNavigate()
  return (
    <>
      <section className="hero">
        <span className="badge">🧠 BUILT FOR DIFFERENT BRAINS</span>
        <h1 className="hero-title">WELCOME<br />KARIBU</h1>
        <p className="sub-text hero-sub">
          A study space where your brain sets the pace. Share what works, borrow what helps, and start small.
        </p>
        <div className="row hero-actions">
          <button className="btn-primary" onClick={() => go('/quiz')}>Find my flow ⚡</button>
          <button className="btn-secondary" onClick={() => go('/feed')}>Join the community</button>
        </div>
        <p className="hint">Your brain is not broken. It’s running different software.</p>
      </section>

      <div className="tiles">
        {TILES.map((t) => (
          <button key={t.to} className="tile" onClick={() => go(t.to)}>
            <span className="icon">{t.icon}</span>
            <span className="title">{t.title}</span>
            <span className="desc">{t.desc}</span>
          </button>
        ))}
      </div>
    </>
  )
}