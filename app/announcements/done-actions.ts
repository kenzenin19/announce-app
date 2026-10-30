'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Mark an announcement done (or not done) for the signed-in person only.
export async function setDone(
  announcementId: string,
  done: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You are signed out. Please log in again.' }

  const { error } = done
    ? await supabase
        .from('completions')
        .upsert(
          { announcement_id: announcementId, user_id: user.id },
          { onConflict: 'announcement_id,user_id' }
        )
    : await supabase
        .from('completions')
        .delete()
        .eq('announcement_id', announcementId)
        .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/my-tasks')
  revalidatePath(`/announcements/${announcementId}`)
  return {}
}
