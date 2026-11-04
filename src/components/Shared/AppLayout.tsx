import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import type { ThemeMode, ThemePalette } from './ThemeControl'

const THEME_STORAGE_KEY = 'flowstate.theme.v1'
const SENSORY_STORAGE_KEY = 'flowstate.low-stimulation.v1'

function readLowStimulationPreference() {
  try {
    return window.localStorage.getItem(SENSORY_STORAGE_KEY) === 'true'
  } catch (error) {
    console.warn('Could not read the low-stimulation preference.', error)
    return false
  }
}

const isThemePalette = (value: unknown): value is ThemePalette =>
  value === 'flow' || value === 'ocean' || value === 'forest' ||
  value === 'rose' || value === 'lavender' || value === 'sunset'

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'dark' || value === 'light' || value === 'system'

function readThemePreferences(): { palette: ThemePalette; mode: ThemeMode } {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) || 'null')
    if (typeof stored === 'object' && stored !== null) {
      const preferences = stored as { palette?: unknown; mode?: unknown }
      return {
        palette: isThemePalette(preferences.palette) ? preferences.palette : 'flow',
        mode: isThemeMode(preferences.mode) ? preferences.mode : 'system',
      }
    }
  } catch (error) {
    console.warn('Could not read saved theme preferences; using the defaults.', error)
  }
  return { palette: 'flow', mode: 'system' }
}

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [themePreferences, setThemePreferences] = useState(readThemePreferences)
  // Accessibility state from your original NavBar
  const [dys, setDys] = useState(false)
  const [calm, setCalm] = useState(readLowStimulationPreference)

  useEffect(() => {
    document.body.classList.toggle('dys', dys)
  }, [dys])

  useEffect(() => {
    document.body.classList.toggle('calm', calm)
    try {
      window.localStorage.setItem(SENSORY_STORAGE_KEY, String(calm))
    } catch (error) {
      console.warn('Could not save the low-stimulation preference.', error)
    }
  }, [calm])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.themePalette = themePreferences.palette
    root.dataset.themeMode = themePreferences.mode
    root.style.colorScheme = themePreferences.mode === 'system' ? 'light dark' : themePreferences.mode
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themePreferences))
    } catch (error) {
      console.warn('Could not save theme preferences; the selection will last for this session.', error)
    }
  }, [themePreferences])

  const setPalette = (palette: ThemePalette) =>
    setThemePreferences((current) => ({ ...current, palette }))
  const setMode = (mode: ThemeMode) =>
    setThemePreferences((current) => ({ ...current, mode }))
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="layout-wrapper">
      <Sidebar isOpen={isSidebarOpen} isCollapsed={isSidebarCollapsed} closeMenu={closeSidebar} />
      
      <div className="main-content">
        <Topbar 
          toggleSidebar={toggleSidebar} 
          sidebarOpen={isSidebarOpen}
          sidebarCollapsed={isSidebarCollapsed}
          toggleSidebarCollapsed={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
          dys={dys} setDys={setDys} 
          calm={calm} setCalm={setCalm} 
          palette={themePreferences.palette}
          mode={themePreferences.mode}
          setPalette={setPalette}
          setMode={setMode}
        />
        
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}