import { createClient } from '@supabase/supabase-js'

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const supabaseConfigured = Boolean(
  configuredUrl &&
  configuredAnonKey &&
  configuredUrl.startsWith('https://') &&
  !configuredUrl.includes('YOUR_SUPABASE') &&
  !configuredAnonKey.includes('YOUR_SUPABASE'),
)

// A non-routable placeholder keeps local-only mode bootable. Service functions
// must check supabaseConfigured before making network calls.
export const supabase = createClient(
  supabaseConfigured ? configuredUrl! : 'https://local-only.invalid',
  supabaseConfigured ? configuredAnonKey! : 'local-only-placeholder-key',
  { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } },
)
