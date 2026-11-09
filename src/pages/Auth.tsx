// src/pages/Auth.tsx — guest start, sign in and account creation in one place.
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Check, Cloud, KeyRound, LogIn, UserPlus, UserRound } from 'lucide-react'
import BackgroundPaths from '@/components/kokonutui/background-paths'
import ParticleButton, { type ParticleButtonStatus } from '@/components/kokonutui/particle-button'
import GuestStartButton from '@/components/Shared/GuestStartButton'
import PublicHeader from '@/components/Shared/PublicHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSession } from '@/hooks/useSession'
import { useCalmMotion } from '@/lib/preferences'
import { supabase, supabaseConfigured } from '@/lib/supabase'

type Mode = 'guest' | 'signin' | 'signup'
const isMode = (value: string | null): value is Mode => value === 'guest' || value === 'signin' || value === 'signup'

const BENEFITS = [
  'Start studying in one tap, no email needed',
  'Upgrade a guest desk without losing notes',
  'Sync notes and progress across devices',
]

function Panel({ children, calm }: { children: ReactNode; calm: boolean }) {
  return (
    <motion.div
      initial={calm ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col gap-5"
    >
      {children}
    </motion.div>
  )
}

function CredentialsForm({ mode, calm }: { mode: 'signin' | 'signup'; calm: boolean }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<ParticleButtonStatus>('idle')
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  const settle = (next: 'success' | 'error', text: string) => {
    setStatus(next)
    setMessage({ tone: next, text })
    window.setTimeout(() => setStatus('idle'), next === 'success' ? 1400 : 2600)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (status === 'pending') return
    if (!supabaseConfigured) {
      settle('error', 'Accounts need Supabase to be configured. You can still continue as a guest.')
      return
    }
    setStatus('pending')
    setMessage(null)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return settle('error', error.message)
      settle('success', 'Signed in. Opening your desk…')
      window.setTimeout(() => navigate('/home'), calm ? 0 : 700)
      return
    }

    // Upgrading an anonymous session keeps the guest's notes attached to the new account.
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) return settle('error', `Could not check your study session: ${sessionError.message}`)
    const { error } = session?.user.is_anonymous
      ? await supabase.auth.updateUser({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (error) return settle('error', error.message)
    settle('success', 'Check your inbox for a confirmation link to finish setting up sync.')
  }

  const isSignIn = mode === 'signin'
  const idPrefix = `auth-${mode}`

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate={false}>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-email`}>Email address</Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="email"
          placeholder="student@university.ac.ke"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="h-11 rounded-xl bg-background/60"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-password`}>Password</Label>
        <Input
          id={`${idPrefix}-password`}
          type="password"
          autoComplete={isSignIn ? 'current-password' : 'new-password'}
          placeholder={isSignIn ? '••••••••' : 'At least 6 characters'}
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="h-11 rounded-xl bg-background/60"
        />
      </div>

      <ParticleButton
        type="submit"
        status={status}
        particles={!calm}
        size="lg"
        className="mt-1 h-11 self-start rounded-xl px-6 text-base font-semibold"
        icon={isSignIn ? <LogIn aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
        pendingLabel={isSignIn ? 'Signing in' : 'Creating account'}
        successLabel={isSignIn ? 'Signed in' : 'Check your email'}
        errorLabel="Try again"
      >
        {isSignIn ? 'Sign in' : 'Create account'}
      </ParticleButton>

      <AnimatePresence mode="wait">
        {message && (
          <motion.p
            key={message.text}
            role={message.tone === 'error' ? 'alert' : 'status'}
            initial={calm ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={message.tone === 'error' ? 'text-sm text-destructive' : 'text-sm text-brand-3'}
          >
            {message.text}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  )
}

export default function Auth() {
  const calm = useCalmMotion()
  const [params, setParams] = useSearchParams()
  const requested = params.get('mode')
  const mode: Mode = isMode(requested) ? requested : 'guest'
  const { session, isGuest } = useSession()

  const changeMode = (value: string) => {
    if (isMode(value)) setParams({ mode: value }, { replace: true })
  }

  return (
    <div className="tw-scope relative flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader>
        <Link
          to="/"
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} aria-hidden="true" /> Back
        </Link>
      </PublicHeader>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 pb-16 sm:px-8 lg:grid-cols-[1.05fr_1fr]">
        {/* Story panel (desktop) */}
        <motion.section
          initial={calm ? false : { opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="relative hidden h-full min-h-[520px] overflow-hidden rounded-3xl border border-border bg-card lg:flex"
        >
          {!calm && (
            <BackgroundPaths
              className="absolute inset-0 min-h-0 bg-transparent text-brand-1/60 dark:bg-transparent"
              count={24}
              speed={0.35}
              angle={-14}
              interactive
            >
              {null}
            </BackgroundPaths>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" aria-hidden="true" />
          <div className="relative mt-auto flex flex-col gap-5 p-10">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <KeyRound size={22} aria-hidden="true" />
            </span>
            <h1 className="max-w-md text-3xl leading-tight font-extrabold tracking-tight">
              Your study desk, ready when your focus is.
            </h1>
            <ul className="flex flex-col gap-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-3/15 text-brand-3">
                    <Check size={14} aria-hidden="true" />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* Auth card */}
        <motion.div
          initial={calm ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="mx-auto w-full max-w-md"
        >
          <Card className="rounded-3xl border-border bg-card/90 shadow-2xl shadow-black/20 backdrop-blur">
            <CardHeader className="gap-1.5">
              <CardTitle className="text-2xl font-bold tracking-tight">
                {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Save your progress' : 'Jump right in'}
              </CardTitle>
              <CardDescription>
                {session && isGuest
                  ? 'You already have a guest desk on this device.'
                  : 'Pick whatever gets you studying fastest.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={mode} onValueChange={changeMode} className="gap-6">
                <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl">
                  <TabsTrigger value="guest" className="rounded-lg">
                    <UserRound aria-hidden="true" /> Guest
                  </TabsTrigger>
                  <TabsTrigger value="signin" className="rounded-lg">
                    <LogIn aria-hidden="true" /> Sign in
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-lg">
                    <UserPlus aria-hidden="true" /> Join
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="guest">
                  <Panel calm={calm}>
                    <p className="text-sm text-muted-foreground">
                      Upload notes and start quizzing straight away. Your guest desk lives on this device;
                      add an email later to keep it everywhere.
                    </p>
                    <ul className="grid gap-2 text-sm">
                      <li className="flex items-center gap-2"><Check size={15} className="text-brand-3" aria-hidden="true" /> Full study tools and AI questions</li>
                      <li className="flex items-center gap-2"><Check size={15} className="text-brand-3" aria-hidden="true" /> Daily AI allowance included</li>
                      <li className="flex items-center gap-2"><Cloud size={15} className="text-muted-foreground" aria-hidden="true" /> Cross-device sync after you join</li>
                    </ul>
                    <GuestStartButton
                      label={session && isGuest ? 'Resume my guest desk' : 'Continue as guest'}
                    />
                  </Panel>
                </TabsContent>

                <TabsContent value="signin">
                  <Panel calm={calm}>
                    <CredentialsForm mode="signin" calm={calm} />
                    {session && isGuest && (
                      <p className="text-xs text-muted-foreground">
                        Want to keep your guest notes? Use <button type="button" className="font-medium text-primary underline-offset-2 hover:underline" onClick={() => changeMode('signup')}>Join</button> instead. It upgrades this guest desk.
                      </p>
                    )}
                  </Panel>
                </TabsContent>

                <TabsContent value="signup">
                  <Panel calm={calm}>
                    <CredentialsForm mode="signup" calm={calm} />
                    <p className="text-xs text-muted-foreground">
                      {session && isGuest
                        ? 'Your current guest notes and progress move into the new account.'
                        : 'We will email you a link to confirm your address.'}
                    </p>
                  </Panel>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
