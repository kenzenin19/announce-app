import { Shell } from '@/components/app-shell'
import { BoardView } from '@/components/board-view'
import type { BoardItem } from '@/components/board-types'
import { PostedBanner } from '@/components/posted-banner'
import { PushToggle } from '@/components/push-toggle'
import { getCurrentUser, canPost } from '@/lib/auth'
import { authorName, dueStatus } from '@/lib/format'

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

  const items: BoardItem[] = (announcements ?? []).map((a) => ({
    id: a.id as string,
    title: a.title as string,
    body: (a.body as string) ?? '',
    due_at: a.due_at as string | null,
    created_at: a.created_at as string,
    subject: a.subject as string | null,
    kind: a.kind as string | null,
    author: authorName(a.profiles),
    doAt: doMap.get(a.id as string) ?? null,
    done: doneSet.has(a.id as string),
  }))

  // The one finding: what still needs attention (done items do not count)
  const open = items.filter((i) => !i.done)
  const soon = open.filter((i) => dueStatus(i.due_at) === 'soon').length
  const unplanned = open.filter((i) => {
    const s = dueStatus(i.due_at)
    return (s === 'soon' || s === 'ok') && !i.doAt
  }).length

  const parts: string[] = []
  if (soon) parts.push(`${soon} due within 48 hours`)
  if (unplanned) parts.push(`${unplanned} without a do date`)
  const finding = error
    ? ''
    : items.length === 0
      ? 'Nothing posted yet.'
      : open.length === 0
        ? 'All done.'
        : parts.length
          ? parts.join(' · ')
          : 'Nothing due soon.'

  return (
    <Shell>
      <BoardView
        items={items}
        finding={finding}
        canPost={canPost(role)}
        notices={
          <>
            {posted && <PostedBanner />}
            <PushToggle variant="banner" />
            {error && (
              <p className="notice notice-err" role="alert">
                Couldn&apos;t load announcements: {error.message}
              </p>
            )}
          </>
        }
      />
    </Shell>
  )
}
