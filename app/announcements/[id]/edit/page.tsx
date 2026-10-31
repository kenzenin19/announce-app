import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Shell } from '@/components/app-shell'
import { getCurrentUser } from '@/lib/auth'
import { AnnouncementForm } from '../../new/form'

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, user, role } = await getCurrentUser()

  const { data: a } = await supabase
    .from('announcements')
    .select('id, title, body, due_at, subject, kind, created_by')
    .eq('id', id)
    .maybeSingle()

  if (!a) notFound()

  // Admin can edit any; a mod only their own (the database enforces this too)
  const canEdit =
    role === 'admin' || (role === 'mod' && a.created_by === user.id)
  if (!canEdit) redirect(`/announcements/${id}`)

  return (
    <Shell>
      <div>
        <Link href={`/announcements/${id}`} className="back">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to announcement
        </Link>
        <h1 className="title" style={{ marginTop: 8 }}>
          Edit announcement
        </h1>
        <p className="sub">
          Changing the title, subject, type or due date tells everyone and shows
          it as new again.
        </p>
      </div>
      <div className="panel panel-pad">
        <AnnouncementForm
          initial={{
            id: a.id as string,
            title: a.title as string,
            body: (a.body as string) ?? '',
            due_at: a.due_at as string | null,
            subject: a.subject as string | null,
            kind: a.kind as string | null,
          }}
        />
      </div>
    </Shell>
  )
}
