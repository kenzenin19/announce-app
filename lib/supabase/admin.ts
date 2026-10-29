import { createClient } from '@supabase/supabase-js'

// SERVER ONLY. This client uses the secret service-role key, which can read and
// write everything. Never import it from a component that has 'use client' and
// never put the key in a NEXT_PUBLIC_ variable.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Server is missing SUPABASE_SERVICE_ROLE_KEY.')
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
