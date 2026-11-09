import { Menu, Eye } from 'lucide-react'
import ThemeControl from './ThemeControl'
import ThemeToggle from './ThemeToggle'
import { setPreferences, usePreferences } from '@/lib/preferences'

interface TopbarProps {
  toggleSidebar: () => void
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  toggleSidebarCollapsed: () => void
}

export default function Topbar({
  toggleSidebar,
  sidebarOpen,
  sidebarCollapsed,
  toggleSidebarCollapsed,
}: TopbarProps) {
  const { calm } = usePreferences()

  return (
    <header className="topbar">
      <div className="topbar-navigation">
        <button
          className="hamburger-btn"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          aria-expanded={sidebarOpen}
          aria-controls="primary-sidebar"
        >
          <Menu size={21} aria-hidden="true" />
        </button>
        <label className="sidebar-collapse-toggle">
          <input
            type="checkbox"
            checked={!sidebarCollapsed}
            onChange={toggleSidebarCollapsed}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-controls="primary-sidebar"
          />
          <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <path
              className="sidebar-toggle-line sidebar-toggle-line-top-bottom"
              d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
            />
            <path className="sidebar-toggle-line" d="M7 16 27 16" />
          </svg>
        </label>
      </div>

      <div className="topbar-tools">
        <label className="accessibility-toggle" title="Reduce motion, bright accents, and visual effects">
          <input
            type="checkbox"
            checked={calm}
            onChange={(e) => setPreferences({ calm: e.target.checked })}
          />
          <Eye size={16} aria-hidden="true" />
          <span>Low stimulation</span>
        </label>
        <ThemeToggle />
        <ThemeControl />
      </div>
    </header>
  )
}
