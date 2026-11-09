import { Link, NavLink, useLocation } from 'react-router-dom'
import { Zap, House, BookOpen, Gamepad2, Hammer, FolderOpen, UsersRound, BatteryMedium } from 'lucide-react'

const LINKS = [
  { to: '/home', label: 'Home', Icon: House },
  { to: '/study', label: 'Study', Icon: BookOpen },
  { to: '/energy', label: 'Energy check-in', Icon: BatteryMedium },
  { to: '/game', label: 'Games', Icon: Gamepad2 },
  { to: '/game?tab=workbench', label: 'Workbench', Icon: Hammer },
  { to: '/resources', label: 'Resources', Icon: FolderOpen },
  { to: '/feed', label: 'Community', Icon: UsersRound },
] as const

interface SidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  closeMenu: () => void
}

export default function Sidebar({ isOpen, isCollapsed, closeMenu }: SidebarProps) {
  const location = useLocation()
  const onWorkbench = location.pathname === '/game' && new URLSearchParams(location.search).get('tab') === 'workbench'
  const activeFor = (to: string, routerActive: boolean) =>
    to === '/game' ? routerActive && !onWorkbench : to === '/game?tab=workbench' ? onWorkbench : routerActive

  return (
    <>
      <aside id="primary-sidebar" className={`sidebar${isOpen ? ' mobile-open' : ''}${isCollapsed ? ' collapsed' : ''}`}>
        <Link to="/" className="sidebar-header" onClick={closeMenu} aria-label="FlowState home page">
          <span className="sidebar-brand-icon" aria-hidden="true"><Zap size={21} /></span>
          <span>FlowState</span>
        </Link>
        
        <nav className="sidebar-links">
          {LINKS.map(({ to, label, Icon }) => (
            <NavLink 
              key={to} 
              to={to} 
              end={to === '/home'} 
              onClick={closeMenu} 
              title={isCollapsed ? label : undefined}
              aria-label={isCollapsed ? label : undefined}
              className={({ isActive }) => `nav-link ${activeFor(to, isActive) ? 'active' : ''}`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      
      <button 
        type="button"
        className={`mobile-overlay ${isOpen ? 'mobile-open' : ''}`} 
        onClick={closeMenu}
        aria-label="Close navigation menu"
        tabIndex={isOpen ? 0 : -1}
      />
    </>
  )
}