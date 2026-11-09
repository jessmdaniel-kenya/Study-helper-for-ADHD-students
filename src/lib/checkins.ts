// Check-in history for the mini games: mood logs, completed games and a gentle daily streak.
export type Mood = 'sunny' | 'partly' | 'cloudy' | 'rainy' | 'stormy'
export type GameId = 'weather' | 'breathe' | 'odd-one' | 'pairs'

export interface MoodEntry {
  at: string // ISO timestamp
  mood: Mood
  energy: number // 1–5
  note?: string
}

export interface CheckinState {
  moods: MoodEntry[]
  completed: { game: GameId; at: string }[]
}

const STORAGE_KEY = 'flowstate.checkins.v1'
const MAX_ENTRIES = 60

function read(): CheckinState {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    if (typeof stored === 'object' && stored !== null) {
      const value = stored as Partial<CheckinState>
      return {
        moods: Array.isArray(value.moods) ? value.moods.filter((m) => m && typeof m.at === 'string') : [],
        completed: Array.isArray(value.completed) ? value.completed.filter((c) => c && typeof c.at === 'string') : [],
      }
    }
  } catch (error) {
    console.warn('Could not read check-in history; starting fresh.', error)
  }
  return { moods: [], completed: [] }
}

function write(state: CheckinState): CheckinState {
  const trimmed = {
    moods: state.moods.slice(-MAX_ENTRIES),
    completed: state.completed.slice(-MAX_ENTRIES * 2),
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (error) {
    throw new Error('Could not save your check-in on this device.', { cause: error })
  }
  return trimmed
}

export const getCheckins = read

export function logMood(entry: Omit<MoodEntry, 'at'>): CheckinState {
  const state = read()
  const at = new Date().toISOString()
  return write({
    moods: [...state.moods, { ...entry, at }],
    completed: [...state.completed, { game: 'weather', at }],
  })
}

export function completeGame(game: GameId): CheckinState {
  const state = read()
  return write({ ...state, completed: [...state.completed, { game, at: new Date().toISOString() }] })
}

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** Check-ins today, and consecutive days (ending today or yesterday) with at least one. */
export function summarize(state: CheckinState) {
  const days = new Set(state.completed.map(({ at }) => dayKey(new Date(at))))
  const today = dayKey(new Date())
  const todayCount = state.completed.filter(({ at }) => dayKey(new Date(at)) === today).length

  let streak = 0
  const cursor = new Date()
  if (!days.has(today)) cursor.setDate(cursor.getDate() - 1)
  while (days.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return { todayCount, streak }
}
