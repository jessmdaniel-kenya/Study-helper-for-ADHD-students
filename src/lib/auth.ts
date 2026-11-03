import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from './supabase'

let pendingSession: Promise<Session> | null = null

export async function ensureSession(): Promise<Session | null> {
  if (!supabaseConfigured) return null

  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (data.session) return data.session

  pendingSession ??= (async () => {
    const { data: signedIn, error: signInError } = await supabase.auth.signInAnonymously()
    if (signInError) throw signInError
    if (!signedIn.session) throw new Error('Could not start a study session.')
    return signedIn.session
  })().finally(() => {
    pendingSession = null
  })
  return pendingSession
}
