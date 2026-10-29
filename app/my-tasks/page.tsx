import Link from 'next/link'
import { NotificationBell } from '@/components/notification-bell'
import { DueBadge } from '@/components/due-badge'
import { getCurrentUser } from '@/lib/auth'
import { firstRow, formatDateTime } from '@/lib/format'

type Ann = { id: string; title: string; due_at: string | null }
type Item = { id: string; title: string; due_at: string | null; do_at: string }

export default async function MyTasksPage() {
  const { supabase, user } = await getCurrentUser()

  const { data: rows, error } = await supabase
    .from('do_dates')
    .select('do_at, announcements(id, title, due_at)')
    .eq('user_id', user.id)
    .order('do_at', { ascending: true })

  const items: Item[] = []
  for (const r of rows ?? []) {
    const a = firstRow<Ann>(r.announcements)
    if (a) items.push({ id: a.id, title: a.title, due_at: a.due_at, do_at: r.do_at as string })
  }

  const now = Date.now()
  const upcoming = items.filter((i) => new Date(i.do_at).getTime() >= now)
  const passed = items.filter((i) => new Date(i.do_at).getTime() < now)
  const plannedIds = new Set(items.map((i) => i.id))

  // Announcements still due in the future that this user has not planned yet
  const { data: dueSoon } = await supabase
    .from('announcements')
    .select('id, title, due_at')
    .gte('due_at', new Date().toISOString())
    .order('due_at', { ascending: true })

  const unplanned = (dueSoon ?? []).filter((a) => !plannedIds.has(a.id))

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-muted-foreground underline">
          &larr; Back
        </Link>
        <NotificationBell />
      </div>
      <h1 className="mt-3 mb-4 text-xl font-semibold">My tasks</h1>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 p-4 text-sm text-red-600">
          Could not load your tasks: {error.message}
        </p>
      )}

      <Section title="Planned" empty="Nothing planned yet. Open an announcement and set a do date.">
        {upcoming.map((i) => (
          <TaskRow key={i.id} item={i} />
        ))}
      </Section>

      {passed.length > 0 && (
        <Section title="Do date passed" empty="">
          {passed.map((i) => (
            <TaskRow key={i.id} item={i} />
          ))}
        </Section>
      )}

      {unplanned.length > 0 && (
        <Section title="Not planned yet" empty="">
          {unplanned.map((a) => (
            <li key={a.id}>
              <Link
                href={`/announcements/${a.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50"
              >
                <span className="text-sm font-medium">{a.title}</span>
                <DueBadge dueAt={a.due_at} />
              </Link>
            </li>
          ))}
        </Section>
      )}
    </main>
  )
}

function Section({
  title,
  empty,
  children,
}: {
  title: string
  empty: string
  children: React.ReactNode
}) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children)
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {hasItems ? (
        <ul className="space-y-2">{children}</ul>
      ) : (
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  )
}

function TaskRow({ item }: { item: Item }) {
  return (
    <li>
      <Link
        href={`/announcements/${item.id}`}
        className="block rounded-lg border p-3 hover:bg-muted/50"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium">{item.title}</span>
          <DueBadge dueAt={item.due_at} />
        </div>
        <p className="mt-1 text-xs font-medium text-indigo-600">
          Do: {formatDateTime(item.do_at)}
        </p>
      </Link>
    </li>
  )
}
