import { useEffect, useState, useSyncExternalStore } from 'react'

/*
 * One store for every display preference: theme, palette, reading font, text
 * size, spacing and low-stimulation mode. Changes are written to the DOM
 * synchronously (the theme toggle's view-transition snapshot depends on that),
 * saved to localStorage, and broadcast to every component using usePreferences().
 */

export type ThemePalette = 'flow' | 'ocean' | 'forest' | 'rose' | 'lavender' | 'sunset'
export type ThemeMode = 'dark' | 'light' | 'system'
export type FontChoice = 'inter' | 'atkinson' | 'lexend' | 'opendyslexic' | 'literata' | 'comic' | 'system'
export type TextSize = 'sm' | 'md' | 'lg' | 'xl'
export type Spacing = 'compact' | 'normal' | 'relaxed'

export interface Preferences {
  palette: ThemePalette
  mode: ThemeMode
  font: FontChoice
  textSize: TextSize
  spacing: Spacing
  calm: boolean
}

export const THEME_STORAGE_KEY = 'flowstate.theme.v1'
export const SENSORY_STORAGE_KEY = 'flowstate.low-stimulation.v1'
export const READING_STORAGE_KEY = 'flowstate.reading.v1'

export const PALETTES: { id: ThemePalette; label: string }[] = [
  { id: 'flow', label: 'Flow' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'forest', label: 'Forest' },
  { id: 'rose', label: 'Rose' },
  { id: 'lavender', label: 'Lavender' },
  { id: 'sunset', label: 'Sunset' },
]

export const FONTS: { id: FontChoice; label: string; note: string; stack: string }[] = [
  { id: 'inter', label: 'Inter', note: 'Clean default', stack: "'Inter', system-ui, sans-serif" },
  { id: 'atkinson', label: 'Atkinson Hyperlegible', note: 'Clear letter shapes', stack: "'Atkinson Hyperlegible', 'Inter', sans-serif" },
  { id: 'lexend', label: 'Lexend', note: 'Wide, easy tracking', stack: "'Lexend', 'Inter', sans-serif" },
  { id: 'opendyslexic', label: 'OpenDyslexic', note: 'Weighted for dyslexia', stack: "'OpenDyslexic', 'Inter', sans-serif" },
  { id: 'literata', label: 'Literata', note: 'Bookish serif', stack: "'Literata', Georgia, serif" },
  { id: 'comic', label: 'Comic Neue', note: 'Casual and friendly', stack: "'Comic Neue', 'Comic Sans MS', sans-serif" },
  { id: 'system', label: 'System', note: 'Your device font', stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
]

export const TEXT_SIZES: { id: TextSize; label: string; scale: number }[] = [
  { id: 'sm', label: 'S', scale: 0.92 },
  { id: 'md', label: 'M', scale: 1 },
  { id: 'lg', label: 'L', scale: 1.1 },
  { id: 'xl', label: 'XL', scale: 1.22 },
]

export const SPACINGS: { id: Spacing; label: string }[] = [
  { id: 'compact', label: 'Compact' },
  { id: 'normal', label: 'Normal' },
  { id: 'relaxed', label: 'Relaxed' },
]

const DEFAULTS: Preferences = {
  palette: 'flow',
  mode: 'system',
  font: 'inter',
  textSize: 'md',
  spacing: 'normal',
  calm: false,
}

const oneOf = <T extends string>(options: readonly { id: T }[], value: unknown, fallback: T): T =>
  options.some((option) => option.id === value) ? (value as T) : fallback

function readJson(key: string): Record<string, unknown> {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(key) || 'null')
    return typeof stored === 'object' && stored !== null ? (stored as Record<string, unknown>) : {}
  } catch (error) {
    console.warn(`Could not read saved preferences (${key}); using the defaults.`, error)
    return {}
  }
}

function readPreferences(): Preferences {
  const theme = readJson(THEME_STORAGE_KEY)
  const reading = readJson(READING_STORAGE_KEY)
  let calm = DEFAULTS.calm
  try {
    calm = window.localStorage.getItem(SENSORY_STORAGE_KEY) === 'true'
  } catch {
    // Storage can be unavailable (private mode); keep the default.
  }
  const modes = [{ id: 'dark' }, { id: 'light' }, { id: 'system' }] as const
  return {
    palette: oneOf(PALETTES, theme.palette, DEFAULTS.palette),
    mode: oneOf(modes, theme.mode, DEFAULTS.mode),
    font: oneOf(FONTS, reading.font, DEFAULTS.font),
    textSize: oneOf(TEXT_SIZES, reading.textSize, DEFAULTS.textSize),
    spacing: oneOf(SPACINGS, reading.spacing, DEFAULTS.spacing),
    calm,
  }
}

function savePreferences(preferences: Preferences) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ palette: preferences.palette, mode: preferences.mode }))
    window.localStorage.setItem(READING_STORAGE_KEY, JSON.stringify({
      font: preferences.font,
      textSize: preferences.textSize,
      spacing: preferences.spacing,
    }))
    window.localStorage.setItem(SENSORY_STORAGE_KEY, String(preferences.calm))
  } catch (error) {
    console.warn('Could not save display preferences; they will last for this session.', error)
  }
}

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

export function resolvedTheme(preferences: Preferences): 'light' | 'dark' {
  if (preferences.mode !== 'system') return preferences.mode
  return darkQuery().matches ? 'dark' : 'light'
}

function applyPreferences(preferences: Preferences) {
  const root = document.documentElement
  const theme = resolvedTheme(preferences)
  root.dataset.themePalette = preferences.palette
  root.dataset.themeMode = preferences.mode
  root.dataset.themeResolved = theme
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme

  const font = FONTS.find(({ id }) => id === preferences.font) ?? FONTS[0]
  const size = TEXT_SIZES.find(({ id }) => id === preferences.textSize) ?? TEXT_SIZES[1]
  root.style.setProperty('--font-body', font.stack)
  root.style.setProperty('--reading-scale', String(size.scale))
  root.dataset.font = preferences.font
  root.dataset.spacing = preferences.spacing

  document.body.classList.toggle('calm', preferences.calm)
  // Legacy rules switch some headings to OpenDyslexic under body.dys.
  document.body.classList.toggle('dys', preferences.font === 'opendyslexic')
}

let state: Preferences | null = null
const listeners = new Set<() => void>()

function getState(): Preferences {
  state ??= readPreferences()
  return state
}

export function setPreferences(patch: Partial<Preferences>) {
  state = { ...getState(), ...patch }
  applyPreferences(state)
  savePreferences(state)
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Applies saved preferences before first paint and follows the OS theme while in "system" mode. */
export function applyStoredPreferences() {
  applyPreferences(getState())
  darkQuery().addEventListener('change', () => {
    if (getState().mode === 'system') {
      applyPreferences(getState())
      for (const listener of listeners) listener()
    }
  })
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribe, getState, getState)
}

/**
 * True when animation should stay still: the app's low-stimulation mode or the
 * operating system's reduced-motion setting. Follows both as they change.
 */
export function useCalmMotion() {
  const { calm } = usePreferences()
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(media.matches)
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return calm || reduced
}
