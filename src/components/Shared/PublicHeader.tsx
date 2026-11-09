import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Zap } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { setPreferences, usePreferences } from '@/lib/preferences'
import { cn } from '@/lib/utils'

/** Header for the pages outside the app shell (landing and sign-in). */
export default function PublicHeader({ children }: { children?: ReactNode }) {
  const { calm } = usePreferences()
  const toggleCalm = () => setPreferences({ calm: !calm })

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
          <Zap size={19} aria-hidden="true" />
        </span>
        FlowState
      </Link>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleCalm}
          aria-pressed={calm}
          title="Reduce motion, bright accents and visual effects"
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors',
            calm
              ? 'border-primary/40 bg-primary/15 text-foreground'
              : 'border-border bg-card/60 text-muted-foreground backdrop-blur hover:text-foreground',
          )}
        >
          <Eye size={15} aria-hidden="true" />
          <span className="hidden sm:inline">Low stimulation</span>
        </button>
        <ThemeToggle />
        {children}
      </div>
    </header>
  )
}
