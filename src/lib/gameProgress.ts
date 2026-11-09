// Tinker's Workbench: progress points earn parts; parts build gadgets. Stored per device.
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

/** Parts are handed out in GAME_ITEMS order, which completes one blueprint at a time. */
export const BLUEPRINTS = [
  {
    id: 'focus-lamp',
    name: 'Focus lamp',
    parts: ['gear', 'lens', 'wire'],
    description: 'Lights up one small task at a time, so the rest can wait.',
  },
  {
    id: 'quiet-compass',
    name: 'Quiet compass',
    parts: ['glass', 'compass', 'spring'],
    description: 'Points you back to your study plan when your attention drifts.',
  },
  {
    id: 'prism-reader',
    name: 'Prism reader',
    parts: ['prism', 'crystal', 'lens'],
    description: 'Splits a dense page into clear, bite-size colours of meaning.',
  },
] as const satisfies readonly { id: string; name: string; parts: readonly GameItemId[]; description: string }[]

export type Blueprint = (typeof BLUEPRINTS)[number]

/** Progress points per new part. A finished study session is one point. */
export const POINTS_PER_PART = 2

export interface GameProgress {
  completedSessions: number
  /** Study sessions plus the once-a-day check-in game bonus. */
  points: number
  /** Parts handed out so far; the next part is GAME_ITEMS[partsAwarded % length]. */
  partsAwarded: number
  checkinBonusDays: string[]
  collectibles: Partial<Record<GameItemId, number>>
  builtBlueprints: string[]
  soundEnabled: boolean
  animationsEnabled: boolean
}

type Item = (typeof GAME_ITEMS)[number]

const STORAGE_KEY = 'flowstate.workbench.v1'

const DEFAULT_PROGRESS: GameProgress = {
  completedSessions: 0,
  points: 0,
  partsAwarded: 0,
  checkinBonusDays: [],
  collectibles: {},
  builtBlueprints: [],
  soundEnabled: false,
  animationsEnabled: true,
}

const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0

function readProgress(): GameProgress {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    if (typeof stored !== 'object' || stored === null) return structuredClone(DEFAULT_PROGRESS)
    const value = stored as Partial<GameProgress>
    const collectibles: GameProgress['collectibles'] = {}
    if (typeof value.collectibles === 'object' && value.collectibles !== null) {
      for (const item of GAME_ITEMS) {
        const quantity = (value.collectibles as Record<string, unknown>)[item.id]
        if (isCount(quantity) && quantity > 0) collectibles[item.id] = quantity
      }
    }
    const completedSessions = isCount(value.completedSessions) ? value.completedSessions : 0
    const owned = Object.values(collectibles).reduce((sum, quantity) => sum + (quantity ?? 0), 0)
    return {
      completedSessions,
      // Saves from before points existed: every finished session was worth one point.
      points: isCount(value.points) ? value.points : completedSessions,
      partsAwarded: isCount(value.partsAwarded) ? value.partsAwarded : owned,
      checkinBonusDays: Array.isArray(value.checkinBonusDays)
        ? value.checkinBonusDays.filter((day): day is string => typeof day === 'string').slice(-31)
        : [],
      collectibles,
      builtBlueprints: Array.isArray(value.builtBlueprints)
        ? value.builtBlueprints.filter((id): id is string => typeof id === 'string')
        : [],
      soundEnabled: value.soundEnabled === true,
      animationsEnabled: value.animationsEnabled !== false,
    }
  } catch (error) {
    console.warn('Could not read saved Workbench progress; starting a new collection.', error)
    return structuredClone(DEFAULT_PROGRESS)
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

/** Hands out every part the current points have earned. Mutates and returns the new parts. */
function awardEarnedParts(progress: GameProgress): Item[] {
  const unlocked: Item[] = []
  const earned = Math.floor(progress.points / POINTS_PER_PART)
  while (progress.partsAwarded < earned) {
    const item = GAME_ITEMS[progress.partsAwarded % GAME_ITEMS.length]
    progress.collectibles[item.id] = (progress.collectibles[item.id] ?? 0) + 1
    progress.partsAwarded += 1
    unlocked.push(item)
  }
  return unlocked
}

function addPoint(progress: GameProgress) {
  progress.points += 1
  const unlocked = awardEarnedParts(progress)
  saveProgress(progress)
  if (unlocked.length > 0 && progress.soundEnabled) playUnlockSound()
  return unlocked
}

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Current progress, topping up any parts already earned (e.g. after the part rate changed). */
export function getGameProgress(): GameProgress {
  const progress = readProgress()
  if (awardEarnedParts(progress).length > 0) {
    try {
      saveProgress(progress)
    } catch {
      // Still show the parts; saving is retried on the next change.
    }
  }
  return progress
}

export function hasPart(progress: GameProgress, id: GameItemId) {
  return (progress.collectibles[id] ?? 0) > 0
}

/** The part the next unlock will give, and how many points until it arrives. */
export function nextUnlock(progress: GameProgress) {
  const item = GAME_ITEMS[progress.partsAwarded % GAME_ITEMS.length]
  const pointsIntoPart = progress.points % POINTS_PER_PART
  return { item, pointsIntoPart, pointsNeeded: POINTS_PER_PART - pointsIntoPart }
}

export function recordStudyCompletion(): { progress: GameProgress; unlockedItem?: Item } {
  const progress = readProgress()
  progress.completedSessions += 1
  const unlocked = addPoint(progress)
  return { progress, unlockedItem: unlocked.at(-1) }
}

/**
 * The first finished check-in game each day is worth one point. Later games
 * that day return `{ awarded: false }`, so the Workbench can't be farmed.
 */
export function recordCheckinGame(): { progress: GameProgress; awarded: boolean; unlockedItem?: Item } {
  const progress = readProgress()
  const day = today()
  if (progress.checkinBonusDays.includes(day)) return { progress, awarded: false }
  progress.checkinBonusDays = [...progress.checkinBonusDays, day].slice(-31)
  const unlocked = addPoint(progress)
  return { progress, awarded: true, unlockedItem: unlocked.at(-1) }
}

export function updateGamePreferences(patch: Pick<GameProgress, 'soundEnabled' | 'animationsEnabled'>) {
  const progress = { ...readProgress(), ...patch }
  saveProgress(progress)
  return progress
}

/**
 * Builds a gadget. Every blueprint is open to everyone: parts are a collectible
 * bonus earned by studying, never a requirement to play.
 */
export function buildBlueprint(id: string) {
  const progress = readProgress()
  awardEarnedParts(progress)
  const blueprint = BLUEPRINTS.find((candidate) => candidate.id === id)
  if (!blueprint) throw new Error('That blueprint does not exist.')
  if (!progress.builtBlueprints.includes(id)) {
    progress.builtBlueprints = [...progress.builtBlueprints, id]
    saveProgress(progress)
  }
  return progress
}
