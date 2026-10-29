import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Shell } from '@/components/app-shell'
import { getCurrentUser, canPost } from '@/lib/auth'
import { NewAnnouncementForm } from './form'

export default async function NewAnnouncementPage() {
  const { role } = await getCurrentUser()

  // Members cannot post
  if (!canPost(role)) redirect('/')

  return (
    <Shell>
      <div>
        <Link href="/" className="back">
          <ArrowLeft size={16} aria-hidden="true" />
          Announcements
        </Link>
        <h1 className="title" style={{ marginTop: 8 }}>
          New announcement
        </h1>
        <p className="sub">Everyone gets a notification when you post.</p>
      </div>
      <div className="panel panel-pad">
        <NewAnnouncementForm />
      </div>
    </Shell>
  )
}
