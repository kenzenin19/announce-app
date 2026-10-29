import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser, canPost } from '@/lib/auth'
import { NewAnnouncementForm } from './form'

export default async function NewAnnouncementPage() {
  const { role } = await getCurrentUser()

  // Members cannot post
  if (!canPost(role)) redirect('/')

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <Link href="/" className="text-sm text-muted-foreground underline">
        &larr; Back
      </Link>
      <h1 className="mt-3 mb-4 text-xl font-semibold">New announcement</h1>
      <NewAnnouncementForm />
    </main>
  )
}
