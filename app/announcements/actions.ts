'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { KINDS, SUBJECTS } from '@/lib/options'

type ActionState = { error?: string } | undefined

export async function createAnnouncement(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const dueRaw = String(formData.get('due_at') ?? '').trim()
  const subject = String(formData.get('subject') ?? 'None')
  const kind = String(formData.get('kind') ?? 'None')

  if (!title) return { error: 'Title is required.' }
  if (title.length > 200) return { error: 'Title is too long (max 200).' }
  if (!(SUBJECTS as readonly string[]).includes(subject))
    return { error: 'Pick a subject from the list.' }
  if (!(KINDS as readonly string[]).includes(kind))
    return { error: 'Pick a type from the list.' }

  let due_at: string | null = null
  if (dueRaw) {
    const d = new Date(dueRaw)
    if (isNaN(d.getTime())) return { error: 'That due date is not valid.' }
    due_at = d.toISOString()
  }

  // RLS also blocks members from inserting, so this is safe even if the UI is bypassed
  const { error } = await supabase
    .from('announcements')
    .insert({ title, body, due_at, subject, kind, created_by: user.id })

  if (error) {
    return {
      error: error.message.includes('row-level security')
        ? 'Only admins and mods can post announcements.'
        : error.message,
    }
  }

  revalidatePath('/')
  redirect('/?posted=1')
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/')
  redirect('/')
}
