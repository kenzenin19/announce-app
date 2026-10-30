import Link from 'next/link'
import { Shell } from '@/components/app-shell'
import { DueBadge } from '@/components/due-badge'
import { getCurrentUser } from '@/lib/auth'
import { firstRow, formatShort } from '@/lib/format'

type Ann = { id: string; title: string; due_at: string | null }
type Item = { id: string; title: string; due_at: string | null; do_at: string }

export default async function MyTasksPage() {
  const { supabase, user } = await getCurrentUser()

  // Both lookups at the same time
  const [{ data: rows, error }, { data: dueSoon }, { data: myDone }] = await Promise.all([
    supabase
      .from('do_dates')
      .select('do_at, announcements(id, title, due_at)')
      .eq('user_id', user.id)
      .order('do_at', { ascending: true }),
    // Announcements still due in the future (we hide the ones already planned below)
    supabase
      .from('announcements')
      .select('id, title, due_at')
      .gte('due_at', new Date().toISOString())
      .order('due_at', { ascending: true }),
    // What this user has marked done
    supabase
      .from('completions')
      .select('announcement_id')
      .eq('user_id', user.id),
  ])

  const items: Item[] = []
  for (const r of rows ?? []) {
    const a = firstRow<Ann>(r.announcements)
    if (a)
      items.push({
        id: a.id,
        title: a.title,
        due_at: a.due_at,
        do_at: r.do_at as string,
      })
  }

  const doneSet = new Set<string>(
    (myDone ?? []).map((d) => d.announcement_id as string)
  )

  const now = Date.now()
  const openItems = items.filter((i) => !doneSet.has(i.id))
  const upcoming = openItems.filter((i) => new Date(i.do_at).getTime() >= now)
  const passed = openItems.filter((i) => new Date(i.do_at).getTime() < now)
  const plannedIds = new Set(items.map((i) => i.id))
  const unplanned = (dueSoon ?? []).filter(
    (a) => !plannedIds.has(a.id) && !doneSet.has(a.id)
  )

  // Done ones: planned items you finished, plus announcements you finished without a do date
  const doneItems: Item[] = [
    ...items.filter((i) => doneSet.has(i.id)),
    ...(dueSoon ?? [])
      .filter((a) => !plannedIds.has(a.id) && doneSet.has(a.id))
      .map((a) => ({ id: a.id, title: a.title, due_at: a.due_at, do_at: '' })),
  ]

  const sub = [
    `${upcoming.length} planned`,
    passed.length ? `${passed.length} do date passed` : '',
    unplanned.length ? `${unplanned.length} not planned yet` : '',
    doneItems.length ? `${doneItems.length} done` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Shell>
      <div>
        <h1 className="title">My tasks</h1>
        <p className="sub">{error ? '' : sub}</p>
      </div>

      {error && (
        <p className="notice notice-err" role="alert">
          Couldn&apos;t load your tasks: {error.message}
        </p>
      )}

      {/* Not planned yet comes first: it is the one that needs action */}
      {unplanned.length > 0 && (
        <section>
          <h2 className="section-h">
            Not planned yet <span>{unplanned.length}</span>
          </h2>
          <ul className="panel rows">
            {unplanned.map((a) => (
              <li key={a.id}>
                <Link href={`/announcements/${a.id}`} className="row">
                  <span className="row-title">{a.title}</span>
                  <div className="row-side">
                    <DueBadge dueAt={a.due_at} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="section-h">
          Planned <span>{upcoming.length}</span>
        </h2>
        {upcoming.length === 0 ? (
          <p className="empty">
            Nothing planned yet. Open an announcement and set a do date.
          </p>
        ) : (
          <ul className="panel rows">
            {upcoming.map((i) => (
              <TaskRow key={i.id} item={i} />
            ))}
          </ul>
        )}
      </section>

      {passed.length > 0 && (
        <section>
          <h2 className="section-h">
            Do date passed <span>{passed.length}</span>
          </h2>
          <ul className="panel rows">
            {passed.map((i) => (
              <TaskRow key={i.id} item={i} />
            ))}
          </ul>
        </section>
      )}
      {doneItems.length > 0 && (
        <details className="donegroup">
          <summary>
            Done <span>{doneItems.length}</span>
          </summary>
          <ul className="panel rows row-done">
            {doneItems.map((i) => (
              <TaskRow key={i.id} item={i} />
            ))}
          </ul>
        </details>
      )}
    </Shell>
  )
}

function TaskRow({ item }: { item: Item }) {
  return (
    <li>
      <Link href={`/announcements/${item.id}`} className="row">
        <div style={{ minWidth: 0 }}>
          <span className="row-title">{item.title}</span>
          {item.do_at && (
            <p className="do" style={{ marginTop: 4 }}>
              Do {formatShort(item.do_at)}
            </p>
          )}
        </div>
        <div className="row-side">
          <DueBadge dueAt={item.due_at} />
        </div>
      </Link>
    </li>
  )
}
