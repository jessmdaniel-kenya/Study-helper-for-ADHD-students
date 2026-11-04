import { NavLink } from 'react-router-dom'
import { Zap, House, BookOpen, Gamepad2, FolderOpen, UsersRound, BatteryMedium } from 'lucide-react'

const LINKS = [
  { to: '/', label: 'Home', Icon: House },
  { to: '/study', label: 'Study', Icon: BookOpen },
  { to: '/energy', label: 'Energy check-in', Icon: BatteryMedium },
  { to: '/game', label: 'Game', Icon: Gamepad2 },
  { to: '/resources', label: 'Resources', Icon: FolderOpen },
  { to: '/feed', label: 'Community', Icon: UsersRound },
] as const

interface SidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  closeMenu: () => void
}

export default function Sidebar({ isOpen, isCollapsed, closeMenu }: SidebarProps) {
  return (
    <>
      <aside id="primary-sidebar" className={`sidebar${isOpen ? ' mobile-open' : ''}${isCollapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-brand-icon" aria-hidden="true"><Zap size={21} /></span>
          <span>FlowState</span>
        </div>
        
        <nav className="sidebar-links">
          {LINKS.map(({ to, label, Icon }) => (
            <NavLink 
              key={to} 
              to={to} 
              end={to === '/'} 
              onClick={closeMenu} 
              title={isCollapsed ? label : undefined}
              aria-label={isCollapsed ? label : undefined}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
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