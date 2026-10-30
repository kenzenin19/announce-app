import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Shell } from '@/components/app-shell'
import { AnnTags } from '@/components/ann-tags'
import { DoneToggle } from '@/components/done-toggle'
import { SeenMarker } from '@/components/seen-marker'
import { DueBadge } from '@/components/due-badge'
import { getCurrentUser } from '@/lib/auth'
import { authorName, formatDateTime } from '@/lib/format'
import { deleteAnnouncement } from '../actions'
import { DeleteButton } from './delete-button'
import { DoDateForm } from './do-date-form'

export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, user, role } = await getCurrentUser()

  // Both lookups at the same time
  const [{ data: a }, { data: mine }, { data: doneRow }] = await Promise.all([
    supabase
      .from('announcements')
      .select(
        'id, title, body, due_at, created_at, created_by, subject, kind, profiles!announcements_created_by_fkey(name)'
      )
      .eq('id', id)
      .maybeSingle(),
    // This user's own do date for this announcement (if any)
    supabase
      .from('do_dates')
      .select('do_at')
      .eq('announcement_id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    // Has this user marked it done?
    supabase
      .from('completions')
      .select('announcement_id')
      .eq('announcement_id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (!a) notFound()

  const canDelete =
    role === 'admin' || (role === 'mod' && a.created_by === user.id)
  const author = authorName(a.profiles)

  return (
    <Shell>
      <SeenMarker announcementId={a.id} />
      <div>
        <Link href="/" className="back">
          <ArrowLeft size={16} aria-hidden="true" />
          Announcements
        </Link>
        <div className="titlerow" style={{ marginTop: 8 }}>
          <div style={{ minWidth: 0 }}>
            <AnnTags subject={a.subject} kind={a.kind} />
            <h1 className="title">{a.title}</h1>
          </div>
          <DoneToggle
            announcementId={a.id}
            initialDone={Boolean(doneRow)}
            title={a.title}
            variant="detail"
          />
        </div>
      </div>

      <article className="panel panel-pad">
        <dl className="kv">
          <dt>Due</dt>
          <dd>
            <span style={{ display: 'inline-flex' }}>
              <DueBadge dueAt={a.due_at} />
            </span>
          </dd>
          <dt>Posted by</dt>
          <dd>{author ?? '—'}</dd>
          <dt>Posted</dt>
          <dd>{formatDateTime(a.created_at)}</dd>
        </dl>

        {a.body ? (
          <p className="prose">{a.body}</p>
        ) : (
          <p className="hint">No details.</p>
        )}
      </article>

      <DoDateForm
        announcementId={a.id}
        initialDoAt={mine?.do_at ?? null}
        dueAt={a.due_at}
      />

      {canDelete && (
        <div className="danger-zone">
          <p className="hint" style={{ maxWidth: 420 }}>
            Deleting removes this announcement and everyone&apos;s do dates for
            it.
          </p>
          <DeleteButton
            title={a.title}
            action={deleteAnnouncement.bind(null, a.id)}
          />
        </div>
      )}
    </Shell>
  )
}
