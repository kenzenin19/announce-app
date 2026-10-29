import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a)
  const B = Buffer.from(b)
  return A.length === B.length && timingSafeEqual(A, B)
}

// Called by the database (pg_net) every time a notification row is created.
// Only requests that carry the secret are allowed.
export async function POST(req: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET
  const given = req.headers.get('x-push-secret') ?? ''

  if (!secret || !safeEqual(given, secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let id: string | undefined
  try {
    const body = await req.json()
    id = body?.notification_id
  } catch {
    // fall through to the 400 below
  }
  if (!id) {
    return NextResponse.json({ error: 'missing notification_id' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const { data: n, error } = await admin
      .from('notifications')
      .select('id, user_id, announcement_id, message')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!n) return NextResponse.json({ ok: true, skipped: 'notification not found' })

    const result = await sendPushToUser(n.user_id, {
      title: 'CSB Announcements',
      body: n.message,
      url: n.announcement_id ? `/announcements/${n.announcement_id}` : '/',
      tag: n.id,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'failed' },
      { status: 500 }
    )
  }
}
