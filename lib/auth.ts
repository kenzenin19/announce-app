import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Role = 'admin' | 'mod' | 'member'

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  return {
    supabase,
    user,
    name: (profile?.name ?? user.email ?? 'there') as string,
    role: (profile?.role ?? 'member') as Role,
  }
})

export function canPost(role: Role) {
  return role === 'admin' || role === 'mod'
}
