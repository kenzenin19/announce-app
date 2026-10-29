import Link from 'next/link'
import { logout } from './login/actions'
import { Button } from '@/components/ui/button'
import { DueBadge } from '@/components/due-badge'
import { getCurrentUser, canPost } from '@/lib/auth'
import { authorName } from '@/lib/format'

export default async function Home() {
  const { supabase, name, role } = await getCurrentUser()

  // Soonest due date first; announcements with no due date go last
  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('id, title, body, due_at, created_at, profiles(name)')
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <header className="flex items-center justify-between gap-4 py-4">
        <div>
          <h1 className="text-xl font-semibold">Announcements</h1>
          <p className="text-sm text-muted-foreground">
            Hi, {name} · {role}
          </p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            Log out
          </Button>
        </form>
      </header>

      {canPost(role) && (
        <Link
          href="/announcements/new"
          className="mb-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          + New announcement
        </Link>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 p-4 text-sm text-red-600">
          Could not load announcements: {error.message}
        </p>
      )}

      {!error && (!announcements || announcements.length === 0) && (
        <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          No announcements yet.
        </p>
      )}

      <ul className="space-y-3">
        {announcements?.map((a) => (
          <li key={a.id}>
            <Link
              href={`/announcements/${a.id}`}
              className="block rounded-lg border p-4 transition hover:bg-muted/50"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-medium">{a.title}</h2>
                <DueBadge dueAt={a.due_at} />
              </div>
              {a.body && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {a.body}
                </p>
              )}
              {authorName(a.profiles) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Posted by {authorName(a.profiles)}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
