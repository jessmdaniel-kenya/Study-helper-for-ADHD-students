import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

const LINKS = [
  ['/', 'Home'],
  ['/sprint', 'Sprint'],
  ['/study', 'Study'],
  ['/game', 'Game'],
  ['/resources', 'Resources'],
  ['/feed', 'Community'],
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
        ⚡ FlowState
      </NavLink>
      <ul className="nav-links">
        {LINKS.map(([to, label]) => (
          <li key={to}>
            <NavLink to={to} end={to === '/'}>
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