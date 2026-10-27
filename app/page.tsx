import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from './login/actions'
import { Button } from '@/components/ui/button'

export default async function Home() {
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

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            Log out
          </Button>
        </form>
      </header>

      <section className="rounded-lg border p-4">
        <p className="text-lg">Hi, {profile?.name ?? user.email}</p>
        <p className="text-sm text-muted-foreground">
          Role: <span className="font-medium">{profile?.role ?? 'unknown'}</span>
        </p>
      </section>
    </main>
  )
}
