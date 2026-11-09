import { useEffect, useRef } from 'react'
import { Check, Eye, Monitor, Moon, RotateCcw, SlidersHorizontal, Sun } from 'lucide-react'
import {
  FONTS,
  PALETTES,
  SPACINGS,
  TEXT_SIZES,
  setPreferences,
  usePreferences,
  type ThemeMode,
} from '@/lib/preferences'
import { cn } from '@/lib/utils'

export type { ThemeMode, ThemePalette } from '@/lib/preferences'

const MODES: { id: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'system', label: 'System', Icon: Monitor },
]

const segment = (active: boolean) =>
  cn(
    'flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-semibold transition-colors',
    active
      ? 'border-primary/60 bg-primary/15 text-foreground'
      : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
  )

/** Display menu: theme, palette, reading font, text size, spacing and low stimulation. */
export default function ThemeControl() {
  const preferences = usePreferences()
  const ref = useRef<HTMLDetailsElement>(null)

  // <details> does not close itself on outside clicks or Escape.
  useEffect(() => {
    const close = (event: Event) => {
      const details = ref.current
      if (!details?.open) return
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !details.contains(event.target as Node)) {
        details.open = false
        if (event instanceof KeyboardEvent) details.querySelector('summary')?.focus()
      }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [])

  return (
    <details className="theme-control" ref={ref}>
      <summary className="theme-trigger" aria-label="Display settings">
        <SlidersHorizontal size={17} aria-hidden="true" />
        <span>Display</span>
      </summary>

      <div className="theme-menu tw-scope display-menu">
        <fieldset className="theme-section">
          <legend>Appearance</legend>
          <div className="grid grid-cols-3 gap-1.5">
            {MODES.map(({ id, label, Icon }) => (
              <button key={id} type="button" className={segment(preferences.mode === id)} aria-pressed={preferences.mode === id} onClick={() => setPreferences({ mode: id })}>
                <Icon size={15} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="theme-section">
          <legend>Colour palette</legend>
          <div className="palette-options">
            {PALETTES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`palette-option palette-${id}${preferences.palette === id ? ' selected' : ''}`}
                aria-pressed={preferences.palette === id}
                onClick={() => setPreferences({ palette: id })}
              >
                <span className="palette-swatch" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="theme-section">
          <legend>Reading font</legend>
          <div className="grid gap-1.5" role="radiogroup" aria-label="Reading font">
            {FONTS.map(({ id, label, note, stack }) => {
              const active = preferences.font === id
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPreferences({ font: id })}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all',
                    active
                      ? 'border-primary/60 bg-primary/12'
                      : 'border-border hover:-translate-y-px hover:border-primary/40 hover:bg-accent',
                  )}
                >
                  <span
                    aria-hidden="true"
                    style={{ fontFamily: stack }}
                    className={cn(
                      'grid size-9 shrink-0 place-items-center rounded-lg text-lg font-bold',
                      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                    )}
                  >
                    Aa
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground" style={{ fontFamily: stack }}>{label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{note}</span>
                  </span>
                  {active && <Check size={16} className="shrink-0 text-primary" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="theme-section">
          <legend>Text size</legend>
          <div className="grid grid-cols-4 gap-1.5">
            {TEXT_SIZES.map(({ id, label, scale }) => (
              <button
                key={id}
                type="button"
                className={segment(preferences.textSize === id)}
                aria-pressed={preferences.textSize === id}
                aria-label={`Text size ${label}`}
                onClick={() => setPreferences({ textSize: id })}
              >
                <span style={{ fontSize: `${12 * scale}px` }}>A</span> {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="theme-section">
          <legend>Line spacing</legend>
          <div className="grid grid-cols-3 gap-1.5">
            {SPACINGS.map(({ id, label }) => (
              <button key={id} type="button" className={segment(preferences.spacing === id)} aria-pressed={preferences.spacing === id} onClick={() => setPreferences({ spacing: id })}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <button
            type="button"
            className={segment(preferences.calm)}
            aria-pressed={preferences.calm}
            onClick={() => setPreferences({ calm: !preferences.calm })}
          >
            <Eye size={15} aria-hidden="true" /> Low stimulation
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => setPreferences({ mode: 'system', palette: 'flow', font: 'inter', textSize: 'md', spacing: 'normal', calm: false })}
          >
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </div>
    </details>
  )
}
