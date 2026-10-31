'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Result = { error?: string }

// Saves this person's notification choice. RLS lets each person write only their own row.
export async function saveNotificationSettings(input: {
  enabled: boolean
  mode: 'light' | 'default'
}): Promise<Result> {
  if (input.mode !== 'light' && input.mode !== 'default') {
    return { error: 'That choice is not valid.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You are signed out. Please log in again.' }

  const { error } = await supabase.from('notification_settings').upsert(
    {
      user_id: user.id,
      push_enabled: Boolean(input.enabled),
      push_mode: input.mode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return {}
}
