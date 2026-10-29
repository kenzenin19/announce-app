import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Shell } from '@/components/app-shell'
import { DueBadge } from '@/components/due-badge'
import { PostedBanner } from '@/components/posted-banner'
import { PushToggle } from '@/components/push-toggle'
import { getCurrentUser, canPost } from '@/lib/auth'
import { authorName, dueStatus, formatShort } from '@/lib/format'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ posted?: string }>
}) {
  const { posted } = await searchParams
  const { supabase, user, role } = await getCurrentUser()

  // Ask the database both questions at the same time (faster than one after the other)
  const [{ data: announcements, error }, { data: myDoDates }] =
    await Promise.all([
      // Soonest due date first; announcements with no due date go last
      supabase
        .from('announcements')
        .select(
          'id, title, body, due_at, created_at, profiles!announcements_created_by_fkey(name)'
        )
        .order('due_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false }),
      // This user's own do dates, so we can mark them in the list
      supabase
        .from('do_dates')
        .select('announcement_id, do_at')
        .eq('user_id', user.id),
    ])

  const doMap = new Map<string, string>(
    (myDoDates ?? []).map((d) => [d.announcement_id as string, d.do_at as string])
  )

  // The one finding: what needs attention now
  const list = announcements ?? []
  const soon = list.filter((a) => dueStatus(a.due_at) === 'soon').length
  const unplanned = list.filter((a) => {
    const s = dueStatus(a.due_at)
    return (s === 'soon' || s === 'ok') && !doMap.has(a.id)
  }).length

  const parts: string[] = []
  if (soon) parts.push(`${soon} due within 48 hours`)
  if (unplanned) parts.push(`${unplanned} without a do date`)
  const finding = error
    ? ''
    : list.length === 0
      ? 'Nothing posted yet.'
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

      {!error && list.length === 0 && (
        <p className="empty">
          No announcements yet.
          {canPost(role) ? ' Post the first one with New announcement.' : ''}
        </p>
      )}

      {list.length > 0 && (
        <ul className="panel rows">
          {list.map((a) => {
            const myDoAt = doMap.get(a.id)
            const author = authorName(a.profiles)
            return (
              <li key={a.id}>
                <Link href={`/announcements/${a.id}`} className="row">
                  <div style={{ minWidth: 0 }}>
                    <h2 className="row-title">{a.title}</h2>
                    {a.body && <p className="row-body">{a.body}</p>}
                    <p className="row-meta">
                      {author ? `Posted by ${author}` : 'Posted'}
                      {' · '}
                      {formatShort(a.created_at)}
                    </p>
                  </div>
                  <div className="row-side">
                    <DueBadge dueAt={a.due_at} />
                    {myDoAt ? (
                      <span className="do">Do {formatShort(myDoAt)}</span>
                    ) : null}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Shell>
  )
}
