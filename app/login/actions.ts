'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ActionState = { error?: string; message?: string } | undefined

export async function login(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const name = String(formData.get('name') ?? '').trim()

  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
    options: { data: { name } },
  })

  if (error) return { error: error.message }

  // If "Confirm email" is ON, there is no session yet
  if (!data.session) {
    return { message: 'Check your email to confirm your account, then log in.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
