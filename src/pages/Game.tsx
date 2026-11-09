import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  Compass,
  Eye,
  Gem,
  Glasses,
  Gamepad2,
  Hammer,
  Lightbulb,
  RotateCcw,
  Settings2,
  Sparkles,
  Spool,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  buildBlueprint,
  GAME_ITEMS,
  getGameProgress,
  updateGamePreferences,
} from '../lib/gameProgress'
import CheckInGames from '@/components/Games/CheckInGames'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const ITEM_ICONS: Record<(typeof GAME_ITEMS)[number]['id'], LucideIcon> = {
  gear: Settings2,
  lens: Glasses,
  wire: Spool,
  glass: Eye,
  compass: Compass,
  spring: RotateCcw,
  prism: Gem,
  crystal: Sparkles,
}

const BLUEPRINTS = [
  { id: 'focus-lamp', name: 'Focus lamp', parts: ['gear', 'lens', 'wire'] },
  { id: 'quiet-compass', name: 'Quiet compass', parts: ['glass', 'compass', 'spring'] },
  { id: 'prism-reader', name: 'Prism reader', parts: ['prism', 'crystal', 'lens'] },
] as const

export default function Game() {
  const [progress, setProgress] = useState(getGameProgress)
  const [notice, setNotice] = useState('')
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'workbench' ? 'workbench' : 'checkin'
  const sessionsToNext = progress.completedSessions % 4
    ? 4 - (progress.completedSessions % 4)
    : 4

  const hasPart = (id: string) => (progress.collectibles[id as keyof typeof progress.collectibles] ?? 0) > 0

  const updatePreference = (key: 'soundEnabled' | 'animationsEnabled', enabled: boolean) => {
    try {
      setProgress(updateGamePreferences({
        soundEnabled: key === 'soundEnabled' ? enabled : progress.soundEnabled,
        animationsEnabled: key === 'animationsEnabled' ? enabled : progress.animationsEnabled,
      }))
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save your game settings.')
    }
  }

  const handleBuild = (id: string, name: string) => {
    try {
      setProgress(buildBlueprint(id))
      setNotice(`${name} added to your builds.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save this build.')
    }
  }

  return (
    <div className={`page stack game-page${progress.animationsEnabled ? '' : ' no-game-animations'}`}>
      <header className="page-heading">
        <div className="step-label">GAMES</div>
        <h1 className="section-title">Play, check in, and collect</h1>
        <p className="sub-text page-description">
          One-minute check-in games to settle in before studying, plus the Tinker’s Workbench where
          finished sessions turn into collectible parts. No timers, rankings, or pressure.
        </p>
      </header>

      <Tabs
        value={tab}
        onValueChange={(value) => setParams(value === 'workbench' ? { tab: 'workbench' } : {}, { replace: true })}
        className="tw-scope gap-5"
      >
        <TabsList className="h-11 w-full max-w-md rounded-xl">
          <TabsTrigger value="checkin" className="rounded-lg"><Gamepad2 aria-hidden="true" /> Check-in games</TabsTrigger>
          <TabsTrigger value="workbench" className="rounded-lg"><Hammer aria-hidden="true" /> Workbench</TabsTrigger>
        </TabsList>

        <TabsContent value="checkin">
          <CheckInGames />
        </TabsContent>

        <TabsContent value="workbench" className="stack">
      <section className="card stack game-progress-card" aria-labelledby="parts-progress-title">
        <div className="game-card-heading">
          <div>
            <div className="badge"><Hammer size={15} aria-hidden="true" /> WORKBENCH PROGRESS</div>
            <h2 id="parts-progress-title" className="card-title">Your next surprise part</h2>
          </div>
          <span className="session-count">{progress.completedSessions} sessions completed</span>
        </div>
        <p className="sub-text">
          {sessionsToNext === 1
            ? 'One more finished study session unlocks a new part.'
            : `${sessionsToNext} finished study sessions until your next part.`}
        </p>
        <div
          className="milestone-track"
          role="progressbar"
          aria-label="Progress toward the next collectible"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={progress.completedSessions % 4}
        >
          <span style={{ width: `${(progress.completedSessions % 4) * 25}%` }} />
        </div>
        <Link to="/study" className="btn-primary game-study-link">
          <BookOpen size={17} aria-hidden="true" /> Start a study session <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>

      <section className="card stack" aria-labelledby="collection-title">
        <div className="game-card-heading">
          <div>
            <div className="badge"><Gem size={15} aria-hidden="true" /> COLLECTION</div>
            <h2 id="collection-title" className="card-title">Workbench parts</h2>
          </div>
          <span className="session-count">
            {Object.values(progress.collectibles).filter((quantity) => (quantity ?? 0) > 0).length} / {GAME_ITEMS.length} found
          </span>
        </div>
        <p className="hint">Unfound parts appear as quiet silhouettes. Each completed fourth session reveals the next part.</p>
        <div className="collection-grid">
          {GAME_ITEMS.map((item) => {
            const Icon = ITEM_ICONS[item.id]
            const quantity = progress.collectibles[item.id] ?? 0
            return (
              <article
                key={item.id}
                className={[
                  'collection-item',
                  quantity > 0 ? 'unlocked' : 'locked',
                  progress.animationsEnabled &&
                  progress.completedSessions > 0 &&
                  progress.completedSessions % 4 === 0 &&
                  Math.floor(progress.completedSessions / 4 - 1) % GAME_ITEMS.length === GAME_ITEMS.indexOf(item)
                    ? 'newly-unlocked'
                    : '',
                ].filter(Boolean).join(' ')}
                aria-label={quantity > 0 ? `${item.name}, collected ${quantity} times` : 'Unfound collectible'}
              >
                <span className="collection-icon"><Icon size={25} aria-hidden="true" /></span>
                <span className="collection-name">{quantity > 0 ? item.name : 'Unfound part'}</span>
                {quantity > 1 && <span className="collection-quantity">×{quantity}</span>}
              </article>
            )
          })}
        </div>
      </section>

      <section className="card stack" aria-labelledby="build-title">
        <div className="badge"><Wrench size={15} aria-hidden="true" /> BUILD SOMETHING</div>
        <h2 id="build-title" className="card-title">Combine collected parts</h2>
        <p className="hint">Builds stay in your collection; parts are not consumed.</p>
        <div className="blueprint-grid">
          {BLUEPRINTS.map((blueprint) => {
            const ready = blueprint.parts.every(hasPart)
            const built = progress.builtBlueprints.includes(blueprint.id)
            return (
              <article className={`blueprint-card${ready ? ' ready' : ''}`} key={blueprint.id}>
                <div className="blueprint-title">
                  <Lightbulb size={19} aria-hidden="true" />
                  <h3>{blueprint.name}</h3>
                </div>
                <ul className="recipe-list">
                  {blueprint.parts.map((partId) => {
                    const item = GAME_ITEMS.find(({ id }) => id === partId)!
                    const Icon = ITEM_ICONS[item.id]
                    const owned = hasPart(partId)
                    return (
                      <li key={partId} className={owned ? 'owned' : ''}>
                        {owned ? <Check size={14} aria-hidden="true" /> : <Icon size={14} aria-hidden="true" />}
                        {item.name}
                      </li>
                    )
                  })}
                </ul>
                <button
                  type="button"
                  className={built ? 'btn-secondary' : 'btn-primary'}
                  disabled={!ready || built}
                  onClick={() => handleBuild(blueprint.id, blueprint.name)}
                >
                  {built ? <><Check size={16} aria-hidden="true" /> Built</> : 'Build'}
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <section className="card stack game-preferences" aria-labelledby="game-settings-title">
        <div className="badge"><Settings2 size={15} aria-hidden="true" /> YOUR PREFERENCES</div>
        <h2 id="game-settings-title" className="card-title">Keep the game comfortable</h2>
        <label className="game-setting">
          <span><Sparkles size={17} aria-hidden="true" /><span><b>Subtle animations</b><small>Use gentle motion when progress changes.</small></span></span>
          <input
            type="checkbox"
            checked={progress.animationsEnabled}
            onChange={(event) => updatePreference('animationsEnabled', event.target.checked)}
          />
        </label>
        <label className="game-setting">
          <span><AudioLines size={17} aria-hidden="true" /><span><b>Unlock sound</b><small>Play a short, soft tone when a part is found.</small></span></span>
          <input
            type="checkbox"
            checked={progress.soundEnabled}
            onChange={(event) => updatePreference('soundEnabled', event.target.checked)}
          />
        </label>
      </section>

      {notice && <p className="game-notice" role="status">{notice}</p>}
        </TabsContent>
      </Tabs>
    </div>
  )
}
