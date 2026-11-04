import { Monitor, Moon, Palette, Sun } from 'lucide-react'

export type ThemePalette = 'flow' | 'ocean' | 'forest' | 'rose' | 'lavender' | 'sunset'
export type ThemeMode = 'dark' | 'light' | 'system'

interface ThemeControlProps {
  palette: ThemePalette
  mode: ThemeMode
  setPalette: (palette: ThemePalette) => void
  setMode: (mode: ThemeMode) => void
}

const PALETTES: { id: ThemePalette; label: string }[] = [
  { id: 'flow', label: 'Flow' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'forest', label: 'Forest' },
  { id: 'rose', label: 'Rose' },
  { id: 'lavender', label: 'Lavender' },
  { id: 'sunset', label: 'Sunset' },
]

const MODES: { id: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'system', label: 'System', Icon: Monitor },
]

export default function ThemeControl({ palette, mode, setPalette, setMode }: ThemeControlProps) {
  return (
    <details className="theme-control">
      <summary className="theme-trigger" aria-label="Theme settings">
        <Palette size={17} aria-hidden="true" />
        <span>Theme</span>
      </summary>
      <div className="theme-menu">
        <fieldset className="theme-section">
          <legend>Appearance</legend>
          <div className="mode-options">
            {MODES.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={`mode-option${mode === id ? ' selected' : ''}`}
                aria-pressed={mode === id}
                onClick={() => setMode(id)}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="theme-section">
          <legend>Color palette</legend>
          <div className="palette-options">
            {PALETTES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`palette-option palette-${id}${palette === id ? ' selected' : ''}`}
                aria-pressed={palette === id}
                onClick={() => setPalette(id)}
              >
                <span className="palette-swatch" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </details>
  )
}
