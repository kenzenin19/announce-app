'use server'

import { createClient } from '@/lib/supabase/server'

// Called when you open an announcement: it stops being "new" for you (only you).
export async function markSeen(announcementId: string): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('seen_announcements')
    .upsert(
      { announcement_id: announcementId, user_id: user.id },
      { onConflict: 'announcement_id,user_id', ignoreDuplicates: true }
    )
}
