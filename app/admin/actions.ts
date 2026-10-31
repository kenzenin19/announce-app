'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Result = { error?: string }

const ROLES = ['member', 'mod', 'admin'] as const

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, isAdmin: false }

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return { supabase, user, isAdmin: me?.role === 'admin' }
}

// Change someone's role. The database also checks that the caller is an admin.
export async function setRole(userId: string, role: string): Promise<Result> {
  if (!(ROLES as readonly string[]).includes(role)) {
    return { error: 'That role is not valid.' }
  }

  const { supabase, user, isAdmin } = await requireAdmin()
  if (!user) return { error: 'You are signed out. Please log in again.' }
  if (!isAdmin) return { error: 'Only admins can change roles.' }
  if (userId === user.id) return { error: 'You cannot change your own role.' }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select('id')

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'Could not change that role.' }

  revalidatePath('/admin')
  revalidatePath('/admin/activity')
  return {}
}

// Delete an announcement from the admin list and stay on the admin page.
export async function removeAnnouncement(id: string): Promise<void> {
  const { supabase, user, isAdmin } = await requireAdmin()
  if (!user || !isAdmin) throw new Error('Only admins can do this.')

  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/admin/activity')
  revalidatePath('/')
}
