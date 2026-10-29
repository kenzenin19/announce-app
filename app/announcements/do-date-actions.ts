'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Result = { error?: string }

function refresh(announcementId: string) {
  revalidatePath('/')
  revalidatePath('/my-tasks')
  revalidatePath(`/announcements/${announcementId}`)
}

export async function setDoDate(
  announcementId: string,
  doAtIso: string
): Promise<Result> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You are signed out. Please log in again.' }

  const d = new Date(doAtIso)
  if (isNaN(d.getTime())) return { error: 'That date is not valid.' }

  const { error } = await supabase.from('do_dates').upsert(
    {
      announcement_id: announcementId,
      user_id: user.id,
      do_at: d.toISOString(),
    },
    { onConflict: 'announcement_id,user_id' }
  )

  if (error) return { error: error.message }

  refresh(announcementId)
  return {}
}

export async function clearDoDate(announcementId: string): Promise<Result> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You are signed out. Please log in again.' }

  const { error } = await supabase
    .from('do_dates')
    .delete()
    .eq('announcement_id', announcementId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  refresh(announcementId)
  return {}
}
