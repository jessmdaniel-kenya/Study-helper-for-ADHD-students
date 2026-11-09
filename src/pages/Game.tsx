import { useEffect, useState } from 'react'
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
  Navigation,
  RotateCcw,
  ScanText,
  Settings2,
  Sparkles,
  Spool,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  BLUEPRINTS,
  buildBlueprint,
  GAME_ITEMS,
  getGameProgress,
  hasPart as ownsPart,
  nextUnlock,
  POINTS_PER_PART,
  updateGamePreferences,
  type GameItemId,
  type GameProgress,
} from '../lib/gameProgress'
import CheckInGames from '@/components/Games/CheckInGames'
import ParticleButton from '@/components/kokonutui/particle-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCalmMotion } from '@/lib/preferences'

const ITEM_ICONS: Record<GameItemId, LucideIcon> = {
  gear: Settings2,
  lens: Glasses,
  wire: Spool,
  glass: Eye,
  compass: Compass,
  spring: RotateCcw,
  prism: Gem,
  crystal: Sparkles,
}

const GADGET_ICONS: Record<(typeof BLUEPRINTS)[number]['id'], LucideIcon> = {
  'focus-lamp': Lightbulb,
  'quiet-compass': Navigation,
  'prism-reader': ScanText,
}

export default function Game() {
  const [progress, setProgress] = useState(getGameProgress)
  const [notice, setNotice] = useState('')
  const [params, setParams] = useSearchParams()
  const calm = useCalmMotion()
  const tab = params.get('tab') === 'workbench' ? 'workbench' : 'checkin'
  const next = nextUnlock(progress)
  const NextIcon = ITEM_ICONS[next.item.id]
  const builtGadgets = BLUEPRINTS.filter(({ id }) => progress.builtBlueprints.includes(id))
  const justUnlocked = progress.points > 0 && progress.points % POINTS_PER_PART === 0 && progress.partsAwarded > 0
    ? GAME_ITEMS[(progress.partsAwarded - 1) % GAME_ITEMS.length].id
    : null

  const hasPart = (id: GameItemId) => ownsPart(progress, id)

  // Notices fade out on their own.
  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(''), 5000)
    return () => window.clearTimeout(id)
  }, [notice])

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

  // Every gadget can be built at any time; parts are a bonus, not a requirement.
  const handleBuild = (id: string, name: string) => {
    try {
      setProgress(buildBlueprint(id))
      setNotice(`You built the ${name}! It is on your gadget shelf.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save this build.')
      throw error
    }
  }

  const onCheckinProgress = (updated: GameProgress, message: string) => {
    setProgress(updated)
    setNotice(message)
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

        <TabsContent value="checkin" className="flex flex-col gap-5">
          <button
            type="button"
            onClick={() => setParams({ tab: 'workbench' }, { replace: true })}
            className="group flex items-center gap-4 rounded-3xl border border-primary/40 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-5 text-left transition-colors hover:border-primary"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Hammer size={24} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold text-foreground">Build gadgets in the Workbench</span>
              <span className="block text-sm text-muted-foreground">Focus lamp, Quiet compass and Prism reader are all ready to build.</span>
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Open <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </button>
          <CheckInGames onWorkbenchProgress={onCheckinProgress} />
        </TabsContent>

        <TabsContent value="workbench" className="stack">
      <section className="card stack" aria-labelledby="build-title">
        <div className="badge"><Wrench size={15} aria-hidden="true" /> BUILD SOMETHING</div>
        <h2 id="build-title" className="card-title">Build any gadget</h2>
        <p className="hint">Every blueprint is open: build whatever you like, whenever you like. Collected parts are a bonus you earn by studying.</p>
        <div className="blueprint-grid">
          {BLUEPRINTS.map((blueprint) => {
            const owned = blueprint.parts.filter((part) => hasPart(part)).length
            const complete = owned === blueprint.parts.length
            const built = progress.builtBlueprints.includes(blueprint.id)
            const statusId = `${blueprint.id}-status`
            return (
              <article className={`blueprint-card ready${built ? ' built' : ''}`} key={blueprint.id}>
                <div className="blueprint-title">
                  <Lightbulb size={19} aria-hidden="true" />
                  <h3>{blueprint.name}</h3>
                  <span className="blueprint-count" aria-label={`${owned} of ${blueprint.parts.length} parts collected`}>
                    {owned}/{blueprint.parts.length}
                  </span>
                </div>
                <div className="blueprint-meter" aria-hidden="true">
                  <span style={{ width: `${(owned / blueprint.parts.length) * 100}%` }} />
                </div>
                <ul className="recipe-list">
                  {blueprint.parts.map((partId) => {
                    const item = GAME_ITEMS.find(({ id }) => id === partId)!
                    const Icon = ITEM_ICONS[item.id]
                    const have = hasPart(partId)
                    return (
                      <li key={partId} className={have ? 'owned' : ''}>
                        {have ? <Check size={14} aria-hidden="true" /> : <Icon size={14} aria-hidden="true" />}
                        {item.name}
                        {have && <span className="recipe-state">Collected</span>}
                      </li>
                    )
                  })}
                </ul>
                <p className="blueprint-description">{blueprint.description}</p>
                {built ? (
                  <span className="blueprint-built">
                    <Check size={16} aria-hidden="true" /> Built
                  </span>
                ) : (
                  <ParticleButton
                    aria-describedby={statusId}
                    particles={progress.animationsEnabled && !calm}
                    className="h-10 self-start rounded-xl px-5 font-semibold"
                    pendingLabel="Building"
                    successLabel="Built!"
                    errorLabel="Try again"
                    successDuration={1200}
                    icon={<Hammer aria-hidden="true" />}
                    // async: a save error becomes a rejected promise, shown as "Try again".
                    onClick={async () => handleBuild(blueprint.id, blueprint.name)}
                  >
                    Build
                  </ParticleButton>
                )}
                <p className="blueprint-status" id={statusId}>
                  {built
                    ? 'On your gadget shelf.'
                    : complete
                      ? 'You collected every part for this one. Nice!'
                      : 'Ready to build. Collecting its parts is an optional bonus.'}
                </p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="card stack" aria-labelledby="shelf-title">
        <div className="game-card-heading">
          <div>
            <div className="badge"><Lightbulb size={15} aria-hidden="true" /> YOUR GADGETS</div>
            <h2 id="shelf-title" className="card-title">Gadget shelf</h2>
          </div>
          <span className="session-count">{builtGadgets.length} / {BLUEPRINTS.length} built</span>
        </div>
        {builtGadgets.length === 0 ? (
          <p className="hint">Nothing here yet. Press Build on any blueprint above to add it to your shelf.</p>
        ) : (
          <div className="gadget-shelf">
            {builtGadgets.map((gadget) => {
              const Icon = GADGET_ICONS[gadget.id]
              return (
                <article key={gadget.id} className="gadget-card">
                  <span className="gadget-icon"><Icon size={26} aria-hidden="true" /></span>
                  <div>
                    <h3>{gadget.name}</h3>
                    <p>{gadget.description}</p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="card stack game-progress-card" aria-labelledby="parts-progress-title">
        <div className="game-card-heading">
          <div>
            <div className="badge"><Hammer size={15} aria-hidden="true" /> WORKBENCH PROGRESS</div>
            <h2 id="parts-progress-title" className="card-title">Next part: {next.item.name}</h2>
          </div>
          <span className="session-count">{progress.completedSessions} sessions · {progress.points} points</span>
        </div>
        <div className="next-part">
          <span className="next-part-icon"><NextIcon size={24} aria-hidden="true" /></span>
          <p className="sub-text">
            {next.pointsNeeded === 1 ? 'One more point unlocks it.' : `${next.pointsNeeded} more points unlock it.`}{' '}
            Each finished study session is 1 point, and your first check-in game each day is a bonus point.
          </p>
        </div>
        <div
          className="milestone-track"
          role="progressbar"
          aria-label="Progress toward the next part"
          aria-valuemin={0}
          aria-valuemax={POINTS_PER_PART}
          aria-valuenow={next.pointsIntoPart}
        >
          <span style={{ width: `${(next.pointsIntoPart / POINTS_PER_PART) * 100}%` }} />
        </div>
        <div className="row page-actions">
          <Link to="/study" className="btn-primary game-study-link">
            <BookOpen size={17} aria-hidden="true" /> Start a study session <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <button type="button" className="btn-secondary" onClick={() => setParams({}, { replace: true })}>
            <Gamepad2 size={17} aria-hidden="true" /> Play a check-in game
          </button>
        </div>
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
        <p className="hint">Collect parts as a bonus for studying: every {POINTS_PER_PART} points add the next one to your collection.</p>
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
                  progress.animationsEnabled && justUnlocked === item.id
                    ? 'newly-unlocked'
                    : '',
                ].filter(Boolean).join(' ')}
                aria-label={quantity > 0 ? `${item.name}, collected ${quantity} times` : `${item.name}, not collected yet`}
              >
                <span className="collection-icon"><Icon size={25} aria-hidden="true" /></span>
                <span className="collection-name">{item.name}</span>
                {quantity > 1 && <span className="collection-quantity">×{quantity}</span>}
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

        </TabsContent>
      </Tabs>

      {/* Outside the tabs so check-in rewards show on the games tab too. */}
      {notice && <p className="game-notice" role="status">{notice}</p>}
    </div>
  )
}
