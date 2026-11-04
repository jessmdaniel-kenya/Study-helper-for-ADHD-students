import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Zap, House, BookOpen, Gamepad2, FolderOpen, UsersRound, BatteryMedium } from 'lucide-react'

const LINKS = [
  { to: '/', label: 'Home', Icon: House },
  { to: '/study', label: 'Study', Icon: BookOpen },
  { to: '/energy', label: 'Energy', Icon: BatteryMedium },
  { to: '/game', label: 'Game', Icon: Gamepad2 },
  { to: '/resources', label: 'Resources', Icon: FolderOpen },
  { to: '/feed', label: 'Community', Icon: UsersRound },
] as const

export default function NavBar() {
  const [dys, setDys] = useState(false)
  const [calm, setCalm] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('dys', dys)
  }, [dys])

  useEffect(() => {
    document.body.classList.toggle('calm', calm)
  }, [calm])

  return (
    <header className="top-nav">
      <NavLink to="/" className="brand">
        <Zap size={20} aria-hidden="true" />
        <span>FlowState</span>
      </NavLink>
      <ul className="nav-links">
        {LINKS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink to={to} end={to === '/'}>
              <Icon size={16} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="nav-toggles">
        <label>
          <input
            type="checkbox"
            checked={dys}
            onChange={(e) => setDys(e.target.checked)}
          />{' '}
          Dyslexia font
        </label>
        <label>
          <input
            type="checkbox"
            checked={calm}
            onChange={(e) => setCalm(e.target.checked)}
          />{' '}
          Low-sensory
        </label>
      </div>
    </header>
  )
}