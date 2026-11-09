import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ParticleButton from '@/components/kokonutui/particle-button'
import { ensureSession } from '@/lib/auth'
import { useCalmMotion } from '@/lib/preferences'
import { cn } from '@/lib/utils'

interface GuestStartButtonProps {
  label?: string
  className?: string
}

/**
 * Starts (or resumes) an anonymous Supabase session, celebrates briefly, then
 * opens the study desk. Low-stimulation mode skips the burst and the pause.
 */
export default function GuestStartButton({ label = 'Continue as guest', className }: GuestStartButtonProps) {
  const navigate = useNavigate()
  const calm = useCalmMotion()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col items-center gap-2 sm:items-start">
      <ParticleButton
        size="lg"
        className={cn('h-12 rounded-xl px-7 text-base font-semibold shadow-lg shadow-primary/25', className)}
        icon={<ArrowRight aria-hidden="true" />}
        pendingLabel="Setting up your desk"
        successLabel="You're in"
        errorLabel="Try again"
        particles={!calm}
        successDuration={calm ? 200 : 900}
        onClick={async () => {
          setError(null)
          await ensureSession()
        }}
        onSuccess={() => window.setTimeout(() => navigate('/home'), calm ? 0 : 650)}
        onError={(reason) =>
          setError(
            reason instanceof Error && reason.message
              ? `Could not start a guest session: ${reason.message}`
              : 'Could not start a guest session. Check your connection and try again.',
          )
        }
      >
        {label}
      </ParticleButton>
      {error && (
        <p role="alert" className="max-w-sm text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
