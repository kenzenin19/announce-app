'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { KINDS, SUBJECTS } from '@/lib/options'

type ActionState = { error?: string } | undefined

// Reads and checks the form. Returns the clean values or an error message.
function readForm(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const dueRaw = String(formData.get('due_at') ?? '').trim()
  const subject = String(formData.get('subject') ?? 'None')
  const kind = String(formData.get('kind') ?? 'None')

  if (!title) return { error: 'Title is required.' } as const
  if (title.length > 200) return { error: 'Title is too long (max 200).' } as const
  if (!(SUBJECTS as readonly string[]).includes(subject))
    return { error: 'Pick a subject from the list.' } as const
  if (!(KINDS as readonly string[]).includes(kind))
    return { error: 'Pick a type from the list.' } as const

  let due_at: string | null = null
  if (dueRaw) {
    const d = new Date(dueRaw)
    if (isNaN(d.getTime())) return { error: 'That due date is not valid.' } as const
    due_at = d.toISOString()
  }

  return { title, body, due_at, subject, kind } as const
}

export async function createAnnouncement(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = readForm(formData)
  if ('error' in parsed) return { error: parsed.error }
  const { title, body, due_at, subject, kind } = parsed

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

// Edit an announcement. RLS only lets an admin, or the mod who posted it, change a row.
// The database then takes care of the "Updated due" notifications, "New" again, and reminders.
export async function updateAnnouncement(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = readForm(formData)
  if ('error' in parsed) return { error: parsed.error }
  const { title, body, due_at, subject, kind } = parsed

  const { data, error } = await supabase
    .from('announcements')
    .update({ title, body, due_at, subject, kind })
    .eq('id', id)
    .select('id')

  if (error) return { error: error.message }
  if (!data || data.length === 0) {
    return { error: 'You can only edit announcements you posted (admins can edit any).' }
  }

  revalidatePath('/')
  revalidatePath(`/announcements/${id}`)
  redirect(`/announcements/${id}`)
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/')
  redirect('/')
}
