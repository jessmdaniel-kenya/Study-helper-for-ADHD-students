import { ChevronFirst, ChevronLast, Menu, Type, Eye } from 'lucide-react'
import ThemeControl from './ThemeControl'
import type { ThemeMode, ThemePalette } from './ThemeControl'

interface TopbarProps {
  toggleSidebar: () => void
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  toggleSidebarCollapsed: () => void
  dys: boolean
  setDys: (val: boolean) => void
  calm: boolean
  setCalm: (val: boolean) => void
  palette: ThemePalette
  mode: ThemeMode
  setPalette: (palette: ThemePalette) => void
  setMode: (mode: ThemeMode) => void
}

export default function Topbar({
  toggleSidebar,
  sidebarOpen,
  sidebarCollapsed,
  toggleSidebarCollapsed,
  dys,
  setDys,
  calm,
  setCalm,
  palette,
  mode,
  setPalette,
  setMode,
}: TopbarProps) {
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
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={toggleSidebarCollapsed}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={sidebarCollapsed}
          aria-controls="primary-sidebar"
        >
          {sidebarCollapsed
            ? <ChevronLast size={19} aria-hidden="true" />
            : <ChevronFirst size={19} aria-hidden="true" />}
        </button>
      </div>
      
      <div className="topbar-tools">
        <label className="accessibility-toggle">
          <input
            type="checkbox"
            checked={dys}
            onChange={(e) => setDys(e.target.checked)}
          />
          <Type size={16} aria-hidden="true" />
          <span>Dyslexia font</span>
        </label>
        
        <label className="accessibility-toggle" title="Reduce motion, bright accents, and visual effects">
          <input
            type="checkbox"
            checked={calm}
            onChange={(e) => setCalm(e.target.checked)}
          />
          <Eye size={16} aria-hidden="true" />
          <span>Low stimulation</span>
        </label>
        <ThemeControl palette={palette} mode={mode} setPalette={setPalette} setMode={setMode} />
      </div>
    </header>
  )
}