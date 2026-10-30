import Link from 'next/link'
import { Shell } from '@/components/app-shell'
import { AnnTags } from '@/components/ann-tags'
import { DoneToggle } from '@/components/done-toggle'
import { DueBadge } from '@/components/due-badge'
import { getCurrentUser } from '@/lib/auth'
import { dueStatus, firstRow } from '@/lib/format'

// My do dates: the tasks I planned to do, in the order I plan to do them.
const TZ = 'Asia/Manila'

type Ann = {
  id: string
  title: string
  due_at: string | null
  subject: string | null
  kind: string | null
}
type Item = Ann & { do_at: string }

function dayKey(iso: string | Date) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ })
}

function dayLabel(key: string, todayKey: string, tomorrowKey: string) {
  if (key === todayKey) return 'Today'
  if (key === tomorrowKey) return 'Tomorrow'
  return new Date(`${key}T12:00:00+08:00`).toLocaleDateString('en-PH', {
    timeZone: TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function MyDoDatesPage() {
  const { supabase, user } = await getCurrentUser()

  // All three lookups at the same time
  const [{ data: rows, error }, { data: allAnn }, { data: myDone }] =
    await Promise.all([
      supabase
        .from('do_dates')
        .select('do_at, announcements(id, title, due_at, subject, kind)')
        .eq('user_id', user.id)
        .order('do_at', { ascending: true }),
      // Only to count open announcements that have no do date yet
      supabase.from('announcements').select('id, due_at'),
      supabase.from('completions').select('announcement_id').eq('user_id', user.id),
    ])

  const items: Item[] = []
  for (const r of rows ?? []) {
    const a = firstRow<Ann>(r.announcements)
    if (a) items.push({ ...a, do_at: r.do_at as string })
  }

  const doneSet = new Set<string>(
    (myDone ?? []).map((d) => d.announcement_id as string)
  )
  const plannedIds = new Set(items.map((i) => i.id))

  const open = items.filter((i) => !doneSet.has(i.id))
  const doneItems = items.filter((i) => doneSet.has(i.id))

  const now = Date.now()
  const passed = open.filter((i) => new Date(i.do_at).getTime() < now)
  const upcoming = open.filter((i) => new Date(i.do_at).getTime() >= now)

  // Upcoming, grouped by day (already in time order)
  const todayKey = dayKey(new Date())
  const tomorrowKey = dayKey(new Date(Date.now() + 24 * 60 * 60 * 1000))
  const days: { key: string; items: Item[] }[] = []
  for (const i of upcoming) {
    const k = dayKey(i.do_at)
    const last = days[days.length - 1]
    if (last && last.key === k) last.items.push(i)
    else days.push({ key: k, items: [i] })
  }

  // Open announcements with no do date yet (not already overdue)
  const unplannedCount = (allAnn ?? []).filter((a) => {
    if (plannedIds.has(a.id as string) || doneSet.has(a.id as string)) return false
    const s = dueStatus(a.due_at as string | null)
    return s !== 'overdue'
  }).length

  const sub = error
    ? ''
    : [
        `${upcoming.length} planned`,
        passed.length ? `${passed.length} passed` : '',
        doneItems.length ? `${doneItems.length} done` : '',
      ]
        .filter(Boolean)
        .join(' · ')

  return (
    <Shell>
      <div>
        <h1 className="title">My do dates</h1>
        <p className="sub">{sub}</p>
      </div>

      {error && (
        <p className="notice notice-err" role="alert">
          Couldn&apos;t load your do dates: {error.message}
        </p>
      )}

      {!error && unplannedCount > 0 && (
        <div className="notice">
          <p className="notice-text">
            {unplannedCount} open{' '}
            {unplannedCount === 1 ? 'announcement has' : 'announcements have'} no
            do date yet.
          </p>
          <Link href="/" className="btn btn-secondary btn-sm">
            See the board
          </Link>
        </div>
      )}

      {!error && open.length === 0 && (
        <p className="empty">
          Nothing planned. Open an announcement on the board and set a do date,
          and it shows up here.
        </p>
      )}

      {passed.length > 0 && (
        <section>
          <h2 className="day-h">
            Do date passed <span>{passed.length}</span>
          </h2>
          <ul className="panel rows">
            {passed.map((i) => (
              <DoRow key={i.id} item={i} done={false} />
            ))}
          </ul>
        </section>
      )}

      {days.map((d) => (
        <section key={d.key}>
          <h2 className="day-h">
            {dayLabel(d.key, todayKey, tomorrowKey)} <span>{d.items.length}</span>
          </h2>
          <ul className="panel rows">
            {d.items.map((i) => (
              <DoRow key={i.id} item={i} done={false} />
            ))}
          </ul>
        </section>
      ))}

      {doneItems.length > 0 && (
        <details className="donegroup">
          <summary>
            Done <span>{doneItems.length}</span>
          </summary>
          <ul className="panel rows">
            {doneItems.map((i) => (
              <DoRow key={i.id} item={i} done />
            ))}
          </ul>
        </details>
      )}
    </Shell>
  )
}

function DoRow({ item, done }: { item: Item; done: boolean }) {
  return (
    <li className={`rowwrap ${done ? 'row-done' : ''}`}>
      <Link href={`/announcements/${item.id}`} className="row dorow">
        <span className="dotime">{timeOf(item.do_at)}</span>
        <div className="dorow-body">
          <AnnTags subject={item.subject} kind={item.kind} />
          <h3 className="row-title">{item.title}</h3>
          {!done && (
            <p className="dorow-due">
              <DueBadge dueAt={item.due_at} />
            </p>
          )}
        </div>
      </Link>
      <DoneToggle
        announcementId={item.id}
        initialDone={done}
        title={item.title}
        variant="row"
      />
    </li>
  )
}
