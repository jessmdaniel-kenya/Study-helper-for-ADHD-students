// Short, pressure-free check-in games: mood weather, box breathing, odd one out, and memory pairs.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BellDot,
  Brain,
  CalendarCheck,
  Check,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Clover,
  Coffee,
  FaceGrinning,
  FaceSlightlySmiling,
  Flame,
  Leaf,
  Puzzle,
  Rocket,
  RotateCcw,
  ScanEye,
  Star,
  StarHalf,
  Sun,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import ParticleButton from '@/components/kokonutui/particle-button'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { completeGame, getCheckins, logMood, summarize, type CheckinState, type GameId, type Mood } from '@/lib/checkins'
import { recordCheckinGame, type GameProgress } from '@/lib/gameProgress'
import { useCalmMotion } from '@/lib/preferences'
import { cn } from '@/lib/utils'
import { useAppStore, type EnergyLevel } from '@/stores/useAppStore'

const EASE = [0.23, 1, 0.32, 1] as const

const GAMES: { id: GameId; title: string; time: string; text: string; Icon: LucideIcon; tone: string }[] = [
  { id: 'weather', title: 'Mood weather', time: '30 sec', text: 'Name your inner weather and energy. We suggest a study pace.', Icon: CloudSun, tone: 'bg-brand-4/15 text-brand-4 ring-brand-4/30' },
  { id: 'breathe', title: 'Box breathing', time: '1 min', text: 'Follow the bubble for three slow breaths to settle in.', Icon: Wind, tone: 'bg-brand-3/15 text-brand-3 ring-brand-3/30' },
  { id: 'odd-one', title: 'Odd one out', time: '1 min', text: 'Spot the icon that is different. A quick focus warm-up.', Icon: ScanEye, tone: 'bg-brand-1/15 text-brand-1 ring-brand-1/30' },
  { id: 'pairs', title: 'Memory pairs', time: '1–2 min', text: 'Flip cards to find four matching pairs. No timer.', Icon: Puzzle, tone: 'bg-brand-2/15 text-brand-2 ring-brand-2/30' },
]

/* ── Shared pieces ─────────────────────────────────────────────────────── */

function Finished({ title, text, onAgain, onExit }: { title: string; text: string; onAgain: () => void; onExit: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="flex flex-col items-center gap-3 rounded-2xl border border-brand-3/30 bg-brand-3/10 p-6 text-center"
      role="status"
    >
      <span className="grid size-12 place-items-center rounded-full bg-brand-3 text-white">
        <Check size={24} aria-hidden="true" />
      </span>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={onAgain}><RotateCcw aria-hidden="true" /> Play again</Button>
        <Button onClick={onExit}>More games <ArrowRight aria-hidden="true" /></Button>
      </div>
    </motion.div>
  )
}

const shuffle = <T,>(items: T[]) => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/* ── 1. Mood weather ──────────────────────────────────────────────────── */

const MOODS: { id: Mood; label: string; Icon: LucideIcon }[] = [
  { id: 'sunny', label: 'Bright', Icon: Sun },
  { id: 'partly', label: 'Okay-ish', Icon: CloudSun },
  { id: 'cloudy', label: 'Foggy', Icon: Cloud },
  { id: 'rainy', label: 'Low', Icon: CloudRain },
  { id: 'stormy', label: 'Overloaded', Icon: CloudLightning },
]

const ENERGY_TO_LEVEL = (energy: number, mood: Mood): EnergyLevel =>
  mood === 'stormy' || energy <= 2 ? 'Low' : energy >= 4 && mood !== 'rainy' ? 'Wired' : 'Medium'

const LEVEL_COPY: Record<EnergyLevel, string> = {
  Low: 'Gentle pace: flashcards and short review.',
  Medium: 'Balanced pace: a mix of multiple choice and recall.',
  Wired: 'High focus: more challenging free-response practice.',
}

function MoodWeather({ history, onLogged, calm }: { history: CheckinState; onLogged: (state: CheckinState) => void; calm: boolean }) {
  const navigate = useNavigate()
  const setEnergyLevel = useAppStore((state) => state.setEnergyLevel)
  const [mood, setMood] = useState<Mood | null>(null)
  const [energy, setEnergy] = useState(3)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState<EnergyLevel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recent = history.moods.slice(-7)

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-foreground">What is the weather like inside?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {MOODS.map(({ id, label, Icon }) => {
            const active = mood === id
            return (
              <motion.button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => { setMood(id); setSaved(null) }}
                whileHover={calm ? undefined : { y: -3 }}
                whileTap={calm ? undefined : { scale: 0.95 }}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-semibold transition-colors',
                  active ? 'border-primary bg-primary/15 text-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                <motion.span animate={active && !calm ? { rotate: [0, -8, 8, 0] } : {}} transition={{ duration: 0.5 }}>
                  <Icon size={30} className={active ? 'text-primary' : ''} aria-hidden="true" />
                </motion.span>
                {label}
              </motion.button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-foreground">
          Energy battery <span className="font-normal text-muted-foreground">({energy} of 5)</span>
        </legend>
        <div className="flex max-w-sm items-end gap-1.5" role="radiogroup" aria-label="Energy from 1 to 5">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={energy === level}
              aria-label={`Energy ${level}`}
              onClick={() => { setEnergy(level); setSaved(null) }}
              style={{ height: `${18 + level * 8}px` }}
              className={cn(
                'flex-1 rounded-lg border transition-all hover:-translate-y-0.5',
                level <= energy ? 'border-brand-3 bg-brand-3' : 'border-border bg-muted',
              )}
            />
          ))}
        </div>
      </fieldset>

      <label className="grid max-w-sm gap-2 text-sm font-semibold text-foreground">
        <span>One word for today <span className="font-normal text-muted-foreground">(optional)</span></span>
        <input
          value={note}
          maxLength={40}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. scattered, hopeful"
          className="h-10 rounded-xl border border-border bg-background/60 px-3 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
      </label>

      <div className="flex flex-col gap-2">
        <ParticleButton
          size="lg"
          disabled={!mood}
          particles={!calm}
          className="h-11 self-start rounded-xl px-6 font-semibold"
          pendingLabel="Saving"
          successLabel="Checked in"
          icon={<CalendarCheck aria-hidden="true" />}
          onClick={async () => {
            if (!mood) return
            setError(null)
            try {
              onLogged(logMood({ mood, energy, note: note.trim() || undefined }))
              setSaved(ENERGY_TO_LEVEL(energy, mood))
            } catch (reason) {
              setError(reason instanceof Error ? reason.message : 'Could not save your check-in.')
              throw reason
            }
          }}
        >
          Log check-in
        </ParticleButton>
        {!mood && <p className="text-xs text-muted-foreground">Pick a weather to log your check-in.</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>

      <AnimatePresence>
        {saved && (
          <motion.div
            initial={calm ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-bold text-foreground">Suggested pace: {saved === 'Wired' ? 'High focus' : saved === 'Medium' ? 'Balanced' : 'Gentle'}</p>
              <p className="text-sm text-muted-foreground">{LEVEL_COPY[saved]}</p>
            </div>
            <Button onClick={() => { setEnergyLevel(saved); navigate('/study') }}>
              Study at this pace <ArrowRight aria-hidden="true" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {recent.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Your recent weather</p>
          <ol className="flex flex-wrap gap-2">
            {recent.map((entry) => {
              const found = MOODS.find(({ id }) => id === entry.mood) ?? MOODS[2]
              const date = new Date(entry.at)
              return (
                <li
                  key={entry.at}
                  title={`${found.label}, energy ${entry.energy}/5${entry.note ? ` – ${entry.note}` : ''}`}
                  className="flex w-16 flex-col items-center gap-1 rounded-xl border border-border bg-card px-2 py-2 text-[11px] text-muted-foreground"
                >
                  <found.Icon size={18} className="text-foreground" aria-hidden="true" />
                  {date.toLocaleDateString(undefined, { weekday: 'short' })}
                  <span className="sr-only">{found.label}, energy {entry.energy} of 5</span>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}

/* ── 2. Box breathing ─────────────────────────────────────────────────── */

const PHASES = [
  { label: 'Breathe in', scale: 1 },
  { label: 'Hold', scale: 1 },
  { label: 'Breathe out', scale: 0.55 },
  { label: 'Hold', scale: 0.55 },
] as const
const PHASE_SECONDS = 4
const CYCLES = 3

function Breathe({ onDone, onExit, calm }: { onDone: () => void; onExit: () => void; calm: boolean }) {
  const [running, setRunning] = useState(false)
  const [tick, setTick] = useState(0) // seconds elapsed
  const total = PHASES.length * PHASE_SECONDS * CYCLES
  const done = tick >= total
  const phaseIndex = Math.floor(tick / PHASE_SECONDS) % PHASES.length
  const phase = PHASES[phaseIndex]
  const countdown = PHASE_SECONDS - (tick % PHASE_SECONDS)
  const cycle = Math.min(CYCLES, Math.floor(tick / (PHASE_SECONDS * PHASES.length)) + 1)
  const reported = useRef(false)

  useEffect(() => {
    if (!running || done) return
    const id = window.setInterval(() => setTick((value) => value + 1), 1000)
    return () => window.clearInterval(id)
  }, [running, done])

  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true
      onDone()
    }
  }, [done, onDone])

  if (done) {
    return (
      <Finished
        title="Three calm breaths done"
        text="Notice how your shoulders feel. When you're ready, pick a small first task."
        onAgain={() => { reported.current = false; setTick(0); setRunning(true) }}
        onExit={onExit}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="relative grid size-64 place-items-center">
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-brand-3/30" aria-hidden="true" />
        <motion.div
          aria-hidden="true"
          className="absolute inset-4 rounded-full bg-gradient-to-br from-brand-3/70 to-brand-2/60 shadow-[0_0_60px_-10px] shadow-brand-3/60"
          initial={false}
          animate={{ scale: running && !calm ? phase.scale : running ? 1 : 0.55, opacity: calm && running ? (phase.scale === 1 ? 1 : 0.55) : 1 }}
          transition={{ duration: running ? PHASE_SECONDS : 0.4, ease: 'easeInOut' }}
        />
        <div className="relative text-center text-white" aria-live="polite">
          <p className="text-xl font-bold drop-shadow">{running ? phase.label : 'Ready?'}</p>
          {running && <p className="text-4xl font-extrabold tabular-nums drop-shadow">{countdown}</p>}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Breath {running ? cycle : 1} of {CYCLES} · four counts each side of the box</p>
      <div className="flex gap-2">
        <Button size="lg" onClick={() => setRunning((value) => !value)}>
          {running ? 'Pause' : tick > 0 ? 'Resume' : 'Start breathing'}
        </Button>
        {tick > 0 && <Button size="lg" variant="outline" onClick={() => { setRunning(false); setTick(0) }}>Restart</Button>}
      </div>
    </div>
  )
}

/* ── 3. Odd one out ───────────────────────────────────────────────────── */

const ODD_ROUNDS: { base: LucideIcon; odd: LucideIcon; size: number }[] = [
  { base: FaceSlightlySmiling, odd: FaceGrinning, size: 9 },
  { base: Cloud, odd: CloudSun, size: 9 },
  { base: Star, odd: StarHalf, size: 12 },
  { base: Bell, odd: BellDot, size: 12 },
  { base: Leaf, odd: Clover, size: 16 },
]

function OddOneOut({ onDone, onExit, calm }: { onDone: () => void; onExit: () => void; calm: boolean }) {
  const [round, setRound] = useState(0)
  const [misses, setMisses] = useState(0)
  const [found, setFound] = useState(false)
  const [shake, setShake] = useState<number | null>(null)
  const [seed, setSeed] = useState(0)
  const done = round >= ODD_ROUNDS.length
  const current = ODD_ROUNDS[Math.min(round, ODD_ROUNDS.length - 1)]
  // seed forces a fresh position when replaying
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const oddIndex = useMemo(() => Math.floor(Math.random() * current.size), [round, seed])
  const reported = useRef(false)

  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true
      onDone()
    }
  }, [done, onDone])

  if (done) {
    return (
      <Finished
        title="Focus warmed up"
        text={misses === 0 ? 'Five for five on the first look. Sharp eyes!' : `All five found, with ${misses} extra look${misses === 1 ? '' : 's'}. Nicely done.`}
        onAgain={() => { reported.current = false; setRound(0); setMisses(0); setFound(false); setSeed((value) => value + 1) }}
        onExit={onExit}
      />
    )
  }

  const pick = (index: number) => {
    if (found) return
    if (index === oddIndex) {
      setFound(true)
      window.setTimeout(() => { setFound(false); setRound((value) => value + 1) }, calm ? 250 : 650)
    } else {
      setMisses((value) => value + 1)
      setShake(index)
      window.setTimeout(() => setShake(null), 400)
    }
  }

  const columns = current.size === 9 ? 'grid-cols-3' : 'grid-cols-4'

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full max-w-md items-center justify-between text-sm text-muted-foreground">
        <span>Round {round + 1} of {ODD_ROUNDS.length}</span>
        <div className="flex gap-1" aria-hidden="true">
          {ODD_ROUNDS.map((_, index) => (
            <span key={index} className={cn('h-1.5 w-6 rounded-full', index < round ? 'bg-primary' : index === round ? 'bg-primary/40' : 'bg-muted')} />
          ))}
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground" aria-live="polite">
        {found ? 'Found it!' : 'Tap the icon that is different.'}
      </p>
      <motion.div
        key={`${round}-${seed}`}
        initial={calm ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
        className={cn('grid w-full max-w-md gap-2', columns)}
      >
        {Array.from({ length: current.size }, (_, index) => {
          const Icon = index === oddIndex ? current.odd : current.base
          const isFound = found && index === oddIndex
          return (
            <motion.button
              key={index}
              type="button"
              aria-label={`Icon ${index + 1}`}
              onClick={() => pick(index)}
              animate={shake === index && !calm ? { x: [0, -6, 6, -3, 3, 0] } : isFound && !calm ? { scale: [1, 1.12, 1] } : {}}
              transition={{ duration: 0.35 }}
              whileHover={calm ? undefined : { y: -2 }}
              className={cn(
                'grid aspect-square place-items-center rounded-2xl border transition-colors',
                isFound ? 'border-brand-3 bg-brand-3/20 text-brand-3' : 'border-border bg-card text-foreground hover:border-primary/40',
              )}
            >
              <Icon size={30} aria-hidden="true" />
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}

/* ── 4. Memory pairs ──────────────────────────────────────────────────── */

const PAIR_ICONS: { id: string; Icon: LucideIcon }[] = [
  { id: 'brain', Icon: Brain },
  { id: 'rocket', Icon: Rocket },
  { id: 'leaf', Icon: Leaf },
  { id: 'coffee', Icon: Coffee },
]

const newDeck = () => shuffle([...PAIR_ICONS, ...PAIR_ICONS].map((card, index) => ({ ...card, key: index })))

function Pairs({ onDone, onExit, calm }: { onDone: () => void; onExit: () => void; calm: boolean }) {
  const [deck, setDeck] = useState(newDeck)
  const [open, setOpen] = useState<number[]>([])
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [moves, setMoves] = useState(0)
  const done = matched.size === PAIR_ICONS.length
  const reported = useRef(false)

  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true
      onDone()
    }
  }, [done, onDone])

  const flip = (index: number) => {
    if (open.length === 2 || open.includes(index) || matched.has(deck[index].id)) return
    const next = [...open, index]
    setOpen(next)
    if (next.length === 2) {
      setMoves((value) => value + 1)
      const [a, b] = next
      if (deck[a].id === deck[b].id) {
        window.setTimeout(() => {
          setMatched((current) => new Set(current).add(deck[a].id))
          setOpen([])
        }, 350)
      } else {
        window.setTimeout(() => setOpen([]), 850)
      }
    }
  }

  if (done) {
    return (
      <Finished
        title="All pairs found"
        text={`You matched four pairs in ${moves} moves. Your working memory is warmed up.`}
        onAgain={() => { reported.current = false; setDeck(newDeck()); setOpen([]); setMatched(new Set()); setMoves(0) }}
        onExit={onExit}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {matched.size} of {PAIR_ICONS.length} pairs · {moves} moves
      </p>
      <div className="grid w-full max-w-md grid-cols-4 gap-3 [perspective:900px]">
        {deck.map((card, index) => {
          const faceUp = open.includes(index) || matched.has(card.id)
          const isMatched = matched.has(card.id)
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => flip(index)}
              aria-label={faceUp ? `Card ${index + 1}: ${card.id}` : `Card ${index + 1}, face down`}
              className="relative aspect-[3/4] rounded-2xl"
            >
              <motion.span
                className="absolute inset-0 [transform-style:preserve-3d]"
                initial={false}
                animate={calm ? {} : { rotateY: faceUp ? 180 : 0 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                {/* Back */}
                <span
                  className={cn(
                    'absolute inset-0 grid place-items-center rounded-2xl border border-border bg-gradient-to-br from-primary/25 to-brand-2/25 [backface-visibility:hidden]',
                    calm && faceUp && 'hidden',
                  )}
                >
                  <Flame size={20} className="text-primary/70" aria-hidden="true" />
                </span>
                {/* Front */}
                <span
                  className={cn(
                    'absolute inset-0 grid place-items-center rounded-2xl border bg-card [backface-visibility:hidden]',
                    !calm && '[transform:rotateY(180deg)]',
                    calm && !faceUp && 'hidden',
                    isMatched ? 'border-brand-3 bg-brand-3/15 text-brand-3' : 'border-primary/50 text-foreground',
                  )}
                >
                  <card.Icon size={30} aria-hidden="true" />
                </span>
              </motion.span>
            </button>
          )
        })}
      </div>
      <Button variant="ghost" size="sm" onClick={() => { setDeck(newDeck()); setOpen([]); setMatched(new Set()); setMoves(0) }}>
        <RotateCcw aria-hidden="true" /> Shuffle
      </Button>
    </div>
  )
}

/* ── Hub ──────────────────────────────────────────────────────────────── */

function GameShell({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <Card className="gap-5 rounded-3xl border-border bg-card p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft aria-hidden="true" /> All games</Button>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <span className="w-24" aria-hidden="true" />
      </div>
      {children}
    </Card>
  )
}

interface CheckInGamesProps {
  /** Called when a finished check-in earns the daily Workbench point. */
  onWorkbenchProgress?: (progress: GameProgress, message: string) => void
}

export default function CheckInGames({ onWorkbenchProgress }: CheckInGamesProps = {}) {
  const calm = useCalmMotion()
  const [active, setActive] = useState<GameId | null>(null)
  const [checkins, setCheckins] = useState(getCheckins)
  const [notice, setNotice] = useState<string | null>(null)
  const { todayCount, streak } = summarize(checkins)
  const lastMood = checkins.moods.at(-1)
  const lastMoodInfo = lastMood ? MOODS.find(({ id }) => id === lastMood.mood) : undefined

  // The first finished check-in each day also earns a Workbench point.
  const rewardWorkbench = useMemo(
    () => () => {
      try {
        const result = recordCheckinGame()
        if (!result.awarded) return
        onWorkbenchProgress?.(
          result.progress,
          result.unlockedItem
            ? `Daily check-in bonus: +1 Workbench point. New part unlocked: ${result.unlockedItem.name}!`
            : 'Daily check-in bonus: +1 Workbench point.',
        )
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Could not save Workbench progress.')
      }
    },
    [onWorkbenchProgress],
  )

  const finish = useMemo(
    () => (game: GameId) => {
      try {
        setCheckins(completeGame(game))
        rewardWorkbench()
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Could not save this check-in.')
      }
    },
    [rewardWorkbench],
  )
  const onDone = useMemo(() => (active ? () => finish(active) : () => {}), [active, finish])
  const exit = () => setActive(null)
  const game = GAMES.find(({ id }) => id === active)

  return (
    <div className="tw-scope flex flex-col gap-5">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Check-ins today', value: String(todayCount), Icon: CalendarCheck, tone: 'text-brand-3' },
          { label: 'Day streak', value: streak ? `${streak} day${streak === 1 ? '' : 's'}` : 'Start today', Icon: Flame, tone: 'text-brand-1' },
          { label: 'Last weather', value: lastMoodInfo ? `${lastMoodInfo.label} · ${lastMood!.energy}/5` : 'Not logged yet', Icon: lastMoodInfo?.Icon ?? Cloud, tone: 'text-brand-4' },
        ].map(({ label, value, Icon, tone }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
            <Icon size={22} className={tone} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="truncate text-sm font-bold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {game ? (
          <motion.div
            key={game.id}
            initial={calm ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={calm ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <GameShell title={game.title} onBack={exit}>
              {game.id === 'weather' && <MoodWeather history={checkins} onLogged={(state) => { setCheckins(state); rewardWorkbench() }} calm={calm} />}
              {game.id === 'breathe' && <Breathe onDone={onDone} onExit={exit} calm={calm} />}
              {game.id === 'odd-one' && <OddOneOut onDone={onDone} onExit={exit} calm={calm} />}
              {game.id === 'pairs' && <Pairs onDone={onDone} onExit={exit} calm={calm} />}
            </GameShell>
          </motion.div>
        ) : (
          <motion.div
            key="launcher"
            initial={calm ? false : 'hidden'}
            animate="show"
            exit={calm ? undefined : { opacity: 0 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {GAMES.map(({ id, title, time, text, Icon, tone }) => (
              <motion.button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } }}
                whileHover={calm ? undefined : { y: -4 }}
                whileTap={calm ? undefined : { scale: 0.98 }}
                className="group flex items-start gap-4 rounded-3xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/40 hover:shadow-lg"
              >
                <span className={cn('grid size-12 shrink-0 place-items-center rounded-2xl ring-1', tone)}>
                  <Icon size={24} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-base font-bold text-foreground">{title}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{time}</span>
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{text}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Play <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {notice && <p role="alert" className="text-sm text-destructive">{notice}</p>}
    </div>
  )
}
