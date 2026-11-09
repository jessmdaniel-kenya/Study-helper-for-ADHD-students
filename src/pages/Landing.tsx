// src/pages/Landing.tsx — public entry point: hero, how it works, and the guest start.
import { Link } from 'react-router-dom'
import { motion, type Variants } from 'motion/react'
import { BatteryMedium, BookOpen, FileUp, ShieldCheck, Sparkles, Sprout } from 'lucide-react'
import BackgroundPaths from '@/components/kokonutui/background-paths'
import DynamicText from '@/components/kokonutui/dynamic-text'
import SlideTextButton from '@/components/kokonutui/slide-text-button'
import GuestStartButton from '@/components/Shared/GuestStartButton'
import PublicHeader from '@/components/Shared/PublicHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/hooks/useSession'
import { useCalmMotion } from '@/lib/preferences'

const FEATURES = [
  {
    Icon: FileUp,
    title: 'Drop in any notes',
    text: 'PDFs, Word files, text and even photos of handwritten pages. Scans are read with OCR.',
  },
  {
    Icon: BookOpen,
    title: 'Bite-size questions',
    text: 'Your notes become short quizzes and flashcards, each tied to the sentence it came from.',
  },
  {
    Icon: BatteryMedium,
    title: 'Matches your energy',
    text: 'A quick check-in shapes the session, so low-battery days still count.',
  },
  {
    Icon: Sprout,
    title: 'Visible progress',
    text: 'Every right answer grows your seedling, so you can see the work adding up.',
  },
] as const

const STEPS = ['Check in with your energy', 'Upload a page of notes', 'Answer five quick questions']

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
}

const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } },
}

export default function Landing() {
  const calm = useCalmMotion()
  const { session, isGuest } = useSession()
  const animate = calm ? false : 'hidden'

  return (
    <div className="tw-scope relative min-h-screen overflow-x-clip bg-background text-foreground">
      {/* Flowing ribbon behind the hero; replaced by a still gradient in low-stimulation mode. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[760px]">
        {calm ? (
          <div className="h-full w-full bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_srgb,var(--a1)_10%,transparent),transparent)]" />
        ) : (
          <BackgroundPaths
            className="absolute inset-0 min-h-0 bg-transparent text-brand-1/45 dark:bg-transparent"
            count={30}
            speed={0.45}
            interactive={false}
          >
            {null}
          </BackgroundPaths>
        )}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />
      </div>

      <PublicHeader>
        <Link
          to="/start?mode=signin"
          className="inline-flex h-9 items-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign in
        </Link>
      </PublicHeader>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-8">
        {/* Hero */}
        <motion.section
          variants={container}
          initial={animate}
          animate="show"
          className="flex flex-col items-center pt-14 pb-20 text-center sm:pt-24 sm:pb-28"
        >
          <motion.span
            variants={rise}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-primary uppercase"
          >
            <Sparkles size={14} aria-hidden="true" /> Study helper built for ADHD brains
          </motion.span>

          <motion.h1
            variants={rise}
            className="mt-6 max-w-3xl text-4xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-6xl"
          >
            Short study bursts that feel
            {/* The rotating word sits on its own line, so its changing width never reflows the rest. */}
            <span className="mt-1 block min-h-[1.2em] overflow-hidden pb-[0.08em] text-primary">
              {calm ? 'doable' : (
                <DynamicText mode="morph" words={['doable', 'focused', 'calm', 'rewarding']} interval={2600} />
              )}
            </span>
          </motion.h1>

          <motion.p variants={rise} className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Turn your notes into quick questions, take breaks without losing your place, and watch
            your progress grow. Start now — no email needed.
          </motion.p>

          <motion.div
            variants={rise}
            className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:items-start"
          >
            <GuestStartButton label={session && !isGuest ? 'Open my study desk' : 'Continue as guest'} />
            {!(session && !isGuest) && (
              <SlideTextButton
                href="/start?mode=signup"
                text="Create an account"
                hoverText="Sync across devices"
                variant="ghost"
                className="h-12 rounded-xl px-7"
              />
            )}
          </motion.div>

          <motion.p variants={rise} className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck size={14} aria-hidden="true" />
            Guest notes stay private. Add an email any time to keep them.
          </motion.p>
        </motion.section>

        {/* How it works */}
        <motion.section
          aria-labelledby="steps-heading"
          variants={container}
          initial={animate}
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto max-w-4xl pb-16"
        >
          <h2 id="steps-heading" className="sr-only">How it works</h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <motion.li
                key={step}
                variants={rise}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 px-4 py-3.5 backdrop-blur"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <span className="text-sm font-medium">{step}</span>
              </motion.li>
            ))}
          </ol>
        </motion.section>

        {/* Features */}
        <motion.section
          aria-labelledby="features-heading"
          variants={container}
          initial={animate}
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="pb-24"
        >
          <h2 id="features-heading" className="mb-8 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Less friction, more momentum
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ Icon, title, text }) => (
              <motion.div key={title} variants={rise} whileHover={calm ? undefined : { y: -4 }}>
                <Card className="h-full gap-3 rounded-2xl border-border bg-card/80 py-5 backdrop-blur">
                  <CardHeader className="gap-3 px-5">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-2/15 text-brand-2 ring-1 ring-brand-2/25">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <CardTitle className="text-base">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5">
                    <CardDescription className="text-sm leading-relaxed">{text}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>

      <footer className="relative z-10 border-t border-border py-6 text-center text-xs text-muted-foreground">
        FlowState · Study helper for ADHD students
      </footer>
    </div>
  )
}
