import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DueBadge } from '@/components/due-badge'
import { getCurrentUser } from '@/lib/auth'
import { authorName, formatDateTime } from '@/lib/format'
import { deleteAnnouncement } from '../actions'
import { DeleteButton } from './delete-button'

export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, user, role } = await getCurrentUser()

  const { data: a } = await supabase
    .from('announcements')
    .select('id, title, body, due_at, created_at, created_by, profiles(name)')
    .eq('id', id)
    .maybeSingle()

  if (!a) notFound()

  const canDelete =
    role === 'admin' || (role === 'mod' && a.created_by === user.id)

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <Link href="/" className="text-sm text-muted-foreground underline">
        &larr; Back
      </Link>

      <article className="mt-3 rounded-lg border p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-xl font-semibold">{a.title}</h1>
          <DueBadge dueAt={a.due_at} />
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          Posted {formatDateTime(a.created_at)}
          {authorName(a.profiles) ? ` by ${authorName(a.profiles)}` : ''}
        </p>

        {a.body ? (
          <p className="mt-4 whitespace-pre-wrap text-sm">{a.body}</p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No details.</p>
        )}
      </article>

      {canDelete && (
        <div className="mt-4">
          <DeleteButton action={deleteAnnouncement.bind(null, a.id)} />
        </div>
      )}
    </main>
  )
}
