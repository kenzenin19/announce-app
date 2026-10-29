import Link from 'next/link'
import { NotificationBell } from '@/components/notification-bell'
import { logout } from './login/actions'
import { Button } from '@/components/ui/button'
import { DueBadge } from '@/components/due-badge'
import { getCurrentUser, canPost } from '@/lib/auth'
import { authorName, formatDateTime } from '@/lib/format'
import { PostedBanner } from '@/components/posted-banner'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ posted?: string }>
}) {
  const { posted } = await searchParams
  const { supabase, user, name, role } = await getCurrentUser()

  // Soonest due date first; announcements with no due date go last
  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('id, title, body, due_at, created_at, profiles!announcements_created_by_fkey(name)')
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  // This user's own do dates, so we can mark them in the list
  const { data: myDoDates } = await supabase
    .from('do_dates')
    .select('announcement_id, do_at')
    .eq('user_id', user.id)

  const doMap = new Map<string, string>(
    (myDoDates ?? []).map((d) => [d.announcement_id as string, d.do_at as string])
  )

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <header className="flex items-center justify-between gap-4 py-4">
        <div>
          <h1 className="text-xl font-semibold">Announcements</h1>
          <p className="text-sm text-muted-foreground">
            Hi, {name} · {role}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </header>

      {posted && <PostedBanner />}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {canPost(role) && (
          <Link
            href="/announcements/new"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            + New announcement
          </Link>
        )}
        <Link
          href="/my-tasks"
          className="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium"
        >
          My tasks
        </Link>
      </div>

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
        {announcements?.map((a) => {
          const myDoAt = doMap.get(a.id)
          return (
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
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {authorName(a.profiles)
                      ? `Posted by ${authorName(a.profiles)}`
                      : ''}
                  </span>
                  {myDoAt && (
                    <span className="font-medium text-indigo-600">
                      My do date: {formatDateTime(myDoAt)}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
