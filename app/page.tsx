import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Shell } from '@/components/app-shell'
import { AnnTags } from '@/components/ann-tags'
import { DoneToggle } from '@/components/done-toggle'
import { DueBadge } from '@/components/due-badge'
import { PostedBanner } from '@/components/posted-banner'
import { PushToggle } from '@/components/push-toggle'
import { getCurrentUser, canPost } from '@/lib/auth'
import { authorName, dueStatus, formatShort } from '@/lib/format'

type Row = {
  id: string
  title: string
  body: string
  due_at: string | null
  created_at: string
  subject: string | null
  kind: string | null
  profiles: unknown
}

function AnnRow({
  a,
  done,
  myDoAt,
}: {
  a: Row
  done: boolean
  myDoAt?: string
}) {
  const author = authorName(a.profiles)
  const st = dueStatus(a.due_at)
  const hasPill = !done && (st === 'overdue' || st === 'soon')
  return (
    <li className={`rowwrap ${done ? 'row-done' : ''}`}>
      <Link href={`/announcements/${a.id}`} className="row">
        {/* Phones: the pill sits in the top-right corner */}
        {!done && (
          <span className="row-pill phone-only">
            <DueBadge dueAt={a.due_at} variant="pill" />
          </span>
        )}
        <div style={{ minWidth: 0 }} className={hasPill ? 'has-pill' : undefined}>
          <AnnTags subject={a.subject} kind={a.kind} />
          {/* Phones: the due date sits under the subject and type */}
          {!done && (
            <p className="row-due phone-only">
              <DueBadge dueAt={a.due_at} variant="text" />
              {myDoAt ? (
                <span className="do">Do {formatShort(myDoAt)}</span>
              ) : null}
            </p>
          )}
          <h2 className="row-title">{a.title}</h2>
          {a.body && <p className="row-body">{a.body}</p>}
          <p className="row-meta">
            {author ? `Posted by ${author}` : 'Posted'}
          </p>
        </div>
        {/* Desktop: pill and date on the right */}
        {!done && (
          <div className="row-side desk-only">
            <DueBadge dueAt={a.due_at} />
            {myDoAt ? (
              <span className="do">Do {formatShort(myDoAt)}</span>
            ) : null}
          </div>
        )}
      </Link>
      <DoneToggle
        announcementId={a.id}
        initialDone={done}
        title={a.title}
        variant="row"
      />
    </li>
  )
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ posted?: string }>
}) {
  const { posted } = await searchParams
  const { supabase, user, role } = await getCurrentUser()

  // Ask the database all three questions at the same time
  const [{ data: announcements, error }, { data: myDoDates }, { data: myDone }] =
    await Promise.all([
      // Soonest due date first; announcements with no due date go last
      supabase
        .from('announcements')
        .select(
          'id, title, body, due_at, created_at, subject, kind, profiles!announcements_created_by_fkey(name)'
        )
        .order('due_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false }),
      // This user's own do dates, so we can mark them in the list
      supabase
        .from('do_dates')
        .select('announcement_id, do_at')
        .eq('user_id', user.id),
      // What this user has marked done (private to them)
      supabase
        .from('completions')
        .select('announcement_id')
        .eq('user_id', user.id),
    ])

  const doMap = new Map<string, string>(
    (myDoDates ?? []).map((d) => [d.announcement_id as string, d.do_at as string])
  )
  const doneSet = new Set<string>(
    (myDone ?? []).map((d) => d.announcement_id as string)
  )

  // Open ones first (same order as before), done ones go to the bottom group
  const all = (announcements ?? []) as Row[]
  const open = all.filter((a) => !doneSet.has(a.id))
  const doneList = all.filter((a) => doneSet.has(a.id))

  // The one finding: what still needs attention (done items do not count)
  const soon = open.filter((a) => dueStatus(a.due_at) === 'soon').length
  const unplanned = open.filter((a) => {
    const s = dueStatus(a.due_at)
    return (s === 'soon' || s === 'ok') && !doMap.has(a.id)
  }).length

  const parts: string[] = []
  if (soon) parts.push(`${soon} due within 48 hours`)
  if (unplanned) parts.push(`${unplanned} without a do date`)
  const finding = error
    ? ''
    : all.length === 0
      ? 'Nothing posted yet.'
      : open.length === 0
        ? 'All done.'
        : parts.length
          ? parts.join(' · ')
          : 'Nothing due soon.'

  return (
    <Shell>
      <div className="titlerow">
        <div>
          <h1 className="title">Announcements</h1>
          {finding && <p className="sub">{finding}</p>}
        </div>
        {canPost(role) && (
          <Link
            href="/announcements/new"
            className="btn btn-primary hide-phone"
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            New announcement
          </Link>
        )}
      </div>

      {posted && <PostedBanner />}

      <PushToggle variant="banner" />

      {error && (
        <p className="notice notice-err" role="alert">
          Couldn&apos;t load announcements: {error.message}
        </p>
      )}

      {!error && all.length === 0 && (
        <p className="empty">
          No announcements yet.
          {canPost(role) ? ' Post the first one with New announcement.' : ''}
        </p>
      )}

      {!error && all.length > 0 && open.length === 0 && (
        <p className="empty">Nothing open. Everything is marked done.</p>
      )}

      {open.length > 0 && (
        <ul className="panel rows">
          {open.map((a) => (
            <AnnRow key={a.id} a={a} done={false} myDoAt={doMap.get(a.id)} />
          ))}
        </ul>
      )}

      {doneList.length > 0 && (
        <details className="donegroup">
          <summary>
            Done <span>{doneList.length}</span>
          </summary>
          <ul className="panel rows">
            {doneList.map((a) => (
              <AnnRow key={a.id} a={a} done />
            ))}
          </ul>
        </details>
      )}
    </Shell>
  )
}
