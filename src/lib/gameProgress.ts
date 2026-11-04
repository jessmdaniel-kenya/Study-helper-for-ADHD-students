export const GAME_ITEMS = [
  { id: 'gear', name: 'Brass gear' },
  { id: 'lens', name: 'Focus lens' },
  { id: 'wire', name: 'Copper wire' },
  { id: 'glass', name: 'Frosted glass' },
  { id: 'compass', name: 'Pocket compass' },
  { id: 'spring', name: 'Clock spring' },
  { id: 'prism', name: 'Quiet prism' },
  { id: 'crystal', name: 'Study crystal' },
] as const

export type GameItemId = (typeof GAME_ITEMS)[number]['id']

export interface GameProgress {
  completedSessions: number
  collectibles: Partial<Record<GameItemId, number>>
  builtBlueprints: string[]
  soundEnabled: boolean
  animationsEnabled: boolean
}

const STORAGE_KEY = 'flowstate.workbench.v1'

const DEFAULT_PROGRESS: GameProgress = {
  completedSessions: 0,
  collectibles: {},
  builtBlueprints: [],
  soundEnabled: false,
  animationsEnabled: true,
}

function readProgress(): GameProgress {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    if (typeof stored !== 'object' || stored === null) return { ...DEFAULT_PROGRESS }
    const value = stored as Partial<GameProgress>
    return {
      completedSessions: Number.isInteger(value.completedSessions) && (value.completedSessions ?? -1) >= 0
        ? value.completedSessions!
        : 0,
      collectibles: typeof value.collectibles === 'object' && value.collectibles !== null
        ? value.collectibles
        : {},
      builtBlueprints: Array.isArray(value.builtBlueprints)
        ? value.builtBlueprints.filter((id): id is string => typeof id === 'string')
        : [],
      soundEnabled: value.soundEnabled === true,
      animationsEnabled: value.animationsEnabled !== false,
    }
  } catch (error) {
    console.warn('Could not read saved Workbench progress; starting a new collection.', error)
    return { ...DEFAULT_PROGRESS }
  }
}

function saveProgress(progress: GameProgress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (error) {
    console.error('Could not save Workbench progress.', error)
    throw new Error('Your browser could not save game progress. Check available storage and try again.')
  }
}

function playUnlockSound() {
  try {
    const audio = new AudioContext()
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(660, audio.currentTime)
    oscillator.frequency.setValueAtTime(880, audio.currentTime + 0.12)
    gain.gain.setValueAtTime(0.0001, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.08, audio.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.3)
    oscillator.connect(gain)
    gain.connect(audio.destination)
    oscillator.start()
    oscillator.stop(audio.currentTime + 0.31)
    oscillator.addEventListener('ended', () => { void audio.close() }, { once: true })
  } catch (error) {
    console.warn('Could not play the optional Workbench unlock sound.', error)
  }
}

export function getGameProgress(): GameProgress {
  return readProgress()
}

export function recordStudyCompletion(): { progress: GameProgress; unlockedItem?: typeof GAME_ITEMS[number] } {
  const progress = readProgress()
  const completedSessions = progress.completedSessions + 1
  let unlockedItem: typeof GAME_ITEMS[number] | undefined
  const collectibles = { ...progress.collectibles }

  if (completedSessions % 4 === 0) {
    unlockedItem = GAME_ITEMS[(completedSessions / 4 - 1) % GAME_ITEMS.length]
    collectibles[unlockedItem.id] = (collectibles[unlockedItem.id] ?? 0) + 1
  }

  const updated = { ...progress, completedSessions, collectibles }
  saveProgress(updated)
  if (unlockedItem && updated.soundEnabled) playUnlockSound()
  return { progress: updated, unlockedItem }
}

export function updateGamePreferences(patch: Pick<GameProgress, 'soundEnabled' | 'animationsEnabled'>) {
  const progress = { ...readProgress(), ...patch }
  saveProgress(progress)
  return progress
}

export function buildBlueprint(id: string) {
  const progress = readProgress()
  if (!progress.builtBlueprints.includes(id)) {
    progress.builtBlueprints = [...progress.builtBlueprints, id]
    saveProgress(progress)
  }
  return progress
}
